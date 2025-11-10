/**
 * テンプレートデータからShopify API用の注文データに変換するモジュール
 */

import { OrderCreateInput } from './types';

/**
 * 日本の電話番号を国際形式に変換
 */
function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';

  // すでに+81で始まっている場合はそのまま
  if (phone.startsWith('+81')) {
    return phone.replace(/[^+\d]/g, ''); // ハイフンやスペースを除去
  }

  // ハイフンやスペースを除去
  let cleaned = phone.replace(/[^\d]/g, '');

  // 先頭の0を除去して+81を追加
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  return `+81${cleaned}`;
}

/**
 * テンプレートデータからShopify API用の注文データを抽出
 */
export function extractOrderData(templateData: any): OrderCreateInput {
  if (!templateData.order || typeof templateData.order !== 'object') {
    throw new Error('Invalid template data: missing order field');
  }

  const { order } = templateData;

  // line_items を lineItems に変換
  const lineItems = order.line_items?.map((item: any) => ({
    title: item.title,
    priceSet: {
      shopMoney: {
        amount: parseFloat(item.price),
        currencyCode: 'JPY',
      },
    },
    quantity: item.quantity,
    requiresShipping: item.requires_shipping,
  }));

  // shipping_address を shippingAddress に変換
  const shippingAddress = order.shipping_address
    ? {
        firstName: order.shipping_address.first_name,
        lastName: order.shipping_address.last_name,
        address1: order.shipping_address.address1,
        address2: order.shipping_address.address2,
        city: order.shipping_address.city,
        province: order.shipping_address.province,
        country: order.shipping_address.country_code || order.shipping_address.country,
        zip: order.shipping_address.zip,
        phone: normalizePhoneNumber(order.shipping_address.phone),
      }
    : undefined;

  // 合計金額を計算
  let totalAmount = 0;
  if (order.line_items) {
    totalAmount += order.line_items.reduce((sum: number, item: any) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);
  }
  if (order.shipping_lines && order.shipping_lines.length > 0) {
    totalAmount += parseFloat(order.shipping_lines[0].price);
  }

  // transactionsを生成
  const transactions = [
    {
      kind: 'SALE' as const,
      status: 'SUCCESS' as const,
      amountSet: {
        shopMoney: {
          amount: totalAmount,
          currencyCode: 'JPY',
        },
      },
    },
  ];

  // shipping_metadataからcustomAttributesを生成（配送元情報）
  const customAttributes = [];
  if (templateData.shipping_metadata) {
    const metadata = templateData.shipping_metadata;

    if (metadata.consignor_prefecture) {
      customAttributes.push({
        key: 'consignor_prefecture',
        value: metadata.consignor_prefecture,
      });
    }

    if (metadata.consignor_city) {
      customAttributes.push({
        key: 'consignor_city',
        value: metadata.consignor_city,
      });
    }

    if (metadata.carrier) {
      customAttributes.push({
        key: 'carrier',
        value: metadata.carrier,
      });
    }

    if (metadata.service_type) {
      customAttributes.push({
        key: 'service_type',
        value: metadata.service_type,
      });
    }

    if (metadata.packing_size) {
      customAttributes.push({
        key: 'packing_size',
        value: String(metadata.packing_size),
      });
    }

    if (metadata.area_code) {
      customAttributes.push({
        key: 'area_code',
        value: metadata.area_code,
      });
    }
  }

  // tagsを配列に変換
  const tags = order.tags
    ? order.tags
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag)
    : undefined;

  if (!shippingAddress) {
    throw new Error('Shipping address is required');
  }

  return {
    currency: 'JPY',
    lineItems,
    shippingAddress,
    phone: normalizePhoneNumber(order.shipping_address?.phone || ''),
    transactions,
    customAttributes: customAttributes.length > 0 ? customAttributes : undefined,
    tags,
  };
}
