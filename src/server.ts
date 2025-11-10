/**
 * Express Web Server for Shopify Order Creator
 */

import express, { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { createShopifyOrder, createCustomOrder, DEFAULT_ORDER } from './shopify';
import { OrderCreateInput } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

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
 * テスト用フィールドを除去し、正しい構造に変換
 */
function extractOrderData(templateData: any): Partial<OrderCreateInput> {
  // test-scenarios形式の場合: ネストされた order フィールドを使用
  if (templateData.order && typeof templateData.order === 'object') {
    const { order } = templateData;

    // line_items を lineItems に変換
    const lineItems = order.line_items?.map((item: any) => ({
      title: item.title,
      priceSet: {
        shopMoney: {
          amount: parseFloat(item.price),
          currencyCode: 'JPY', // デフォルトをJPYに設定
        },
      },
      quantity: item.quantity,
      requiresShipping: item.requires_shipping,
    }));

    // shipping_address を shippingAddress に変換
    const shippingAddress = order.shipping_address ? {
      firstName: order.shipping_address.first_name,
      lastName: order.shipping_address.last_name,
      address1: order.shipping_address.address1,
      address2: order.shipping_address.address2,
      city: order.shipping_address.city,
      province: order.shipping_address.province,
      country: order.shipping_address.country_code || order.shipping_address.country,
      zip: order.shipping_address.zip,
      phone: normalizePhoneNumber(order.shipping_address.phone),
    } : undefined;

    // 合計金額を計算（line_itemsとshipping_linesから）
    let totalAmount = 0;
    if (order.line_items) {
      totalAmount += order.line_items.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.price) * item.quantity);
      }, 0);
    }
    if (order.shipping_lines && order.shipping_lines.length > 0) {
      totalAmount += parseFloat(order.shipping_lines[0].price);
    }

    // transactionsを生成（JPY通貨で）
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

    return {
      currency: 'JPY',
      lineItems,
      shippingAddress,
      phone: normalizePhoneNumber(order.shipping_address?.phone || ''),
      transactions,
    };
  }

  // test-data形式の場合: そのまま使用（API用フィールドのみ抽出）
  const cleanData: Partial<OrderCreateInput> = {};

  if (templateData.currency) cleanData.currency = templateData.currency;
  if (templateData.lineItems) cleanData.lineItems = templateData.lineItems;
  if (templateData.shippingAddress) {
    cleanData.shippingAddress = {
      ...templateData.shippingAddress,
      phone: normalizePhoneNumber(templateData.shippingAddress.phone),
    };
  }
  if (templateData.phone) cleanData.phone = normalizePhoneNumber(templateData.phone);
  if (templateData.transactions) cleanData.transactions = templateData.transactions;

  return cleanData;
}

// ミドルウェア
app.use(express.json());

/**
 * ルートパスリダイレクト
 */
app.get('/', (req: Request, res: Response) => {
  res.redirect('/home.html');
});

app.use(express.static(path.join(__dirname, '../public')));

/**
 * API: 注文作成エンドポイント
 */
app.post('/api/create-order', async (req: Request, res: Response) => {
  try {
    const { storeUrl, accessToken, orderType, orderData } = req.body;

    // バリデーション
    if (!storeUrl || !accessToken) {
      return res.status(400).json({
        error: 'Store URL and Access Token are required',
      });
    }

    if (orderType === 'custom' && !orderData) {
      return res.status(400).json({
        error: 'Order data is required for custom orders',
      });
    }

    console.log('📊 Creating Shopify order...');
    console.log(`   Store: ${storeUrl}`);
    console.log(`   Order Type: ${orderType}`);

    let result;

    if (orderType === 'custom') {
      // テンプレートデータをクリーンアップ
      const cleanedOrderData = extractOrderData(orderData);
      console.log('🧹 Cleaned Order Data:', JSON.stringify(cleanedOrderData, null, 2));

      // カスタム注文作成
      result = await createCustomOrder(storeUrl, accessToken, cleanedOrderData);
    } else {
      // デフォルト注文作成
      result = await createShopifyOrder(storeUrl, accessToken);
    }

    console.log('✅ Order created successfully!');

    // レスポンスからデータを抽出
    const order = result.data.orderCreate.order;

    // 成功レスポンス
    return res.status(200).json({
      success: true,
      orderId: order.id,
      phone: order.phone,
      totalTax: `${order.totalTaxSet.shopMoney.amount} ${order.totalTaxSet.shopMoney.currencyCode}`,
      lineItemsCount: order.lineItems.nodes.length,
    });
  } catch (error: unknown) {
    console.error('❌ Error creating order:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      error: 'Failed to create order',
      details: errorMessage,
    });
  }
});

/**
 * API: デフォルト注文データ取得
 */
app.get('/api/default-order', (req: Request, res: Response) => {
  res.status(200).json(DEFAULT_ORDER);
});

/**
 * API: テンプレート一覧取得
 */
app.get('/api/templates', (req: Request, res: Response) => {
  try {
    const templatesPath = path.join(__dirname, '../test-data/templates.json');
    const templatesData = fs.readFileSync(templatesPath, 'utf-8');
    const templates = JSON.parse(templatesData);
    res.status(200).json(templates);
  } catch (error) {
    console.error('❌ Error loading templates:', error);
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

/**
 * API: 特定のテンプレートデータ取得（3階層パス用）
 */
app.get('/api/templates/:dir/:subdir/:filename', (req: Request, res: Response) => {
  try {
    const filepath = `${req.params.dir}/${req.params.subdir}/${req.params.filename}`;

    // セキュリティチェック: パストラバーサル防止
    if (filepath.includes('..')) {
      return res.status(400).json({ error: 'Invalid filepath' });
    }

    const templatePath = path.join(__dirname, '..', filepath);

    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const templateData = fs.readFileSync(templatePath, 'utf-8');
    const template = JSON.parse(templateData);
    res.status(200).json(template);
  } catch (error) {
    console.error('❌ Error loading template:', error);
    res.status(500).json({ error: 'Failed to load template' });
  }
});

/**
 * API: 特定のテンプレートデータ取得（2階層パス用）
 */
app.get('/api/templates/:category/:filename', (req: Request, res: Response) => {
  try {
    const filepath = `${req.params.category}/${req.params.filename}`;

    // セキュリティチェック: パストラバーサル防止
    if (filepath.includes('..')) {
      return res.status(400).json({ error: 'Invalid filepath' });
    }

    const templatePath = path.join(__dirname, '..', filepath);

    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const templateData = fs.readFileSync(templatePath, 'utf-8');
    const template = JSON.parse(templateData);
    res.status(200).json(template);
  } catch (error) {
    console.error('❌ Error loading template:', error);
    res.status(500).json({ error: 'Failed to load template' });
  }
});

/**
 * ヘルスチェック
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * サーバー起動
 */
app.listen(PORT, () => {
  console.log('🚀 Shopify Order Creator Web UI is running!');
  console.log(`📋 Open your browser: http://localhost:${PORT}`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});
