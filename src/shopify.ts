/**
 * Shopify API操作モジュール
 */

import axios, { AxiosError } from 'axios';
import { OrderCreateInput, OrderCreateResponse, OrderCreateVariables } from './types';

/**
 * デフォルトの注文データ
 */
export const DEFAULT_ORDER: OrderCreateInput = {
  currency: 'EUR',
  lineItems: [
    {
      title: 'Big Brown Bear Boots',
      priceSet: {
        shopMoney: {
          amount: 74.99,
          currencyCode: 'EUR',
        },
      },
      quantity: 3,
      taxLines: [
        {
          priceSet: {
            shopMoney: {
              amount: 13.5,
              currencyCode: 'EUR',
            },
          },
          rate: 0.06,
          title: 'State tax',
        },
      ],
    },
  ],
  shippingAddress: {
    firstName: '太郎',
    lastName: '山田',
    address1: '1-1',
    city: '千代田区千代田',
    province: '東京都',
    country: 'JP',
    zip: '100-0001',
    phone: '+8190-8765-4321',
  },
  phone: '+81 90 8765 4321',
  transactions: [
    {
      kind: 'SALE',
      status: 'SUCCESS',
      amountSet: {
        shopMoney: {
          amount: 238.47,
          currencyCode: 'EUR',
        },
      },
    },
  ],
};

/**
 * Shopify GraphQL Mutation
 */
const ORDER_CREATE_MUTATION = `
  mutation orderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
    orderCreate(order: $order, options: $options) {
      userErrors {
        field
        message
      }
      order {
        id
        totalTaxSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        phone
        lineItems(first: 5) {
          nodes {
            variant {
              id
            }
            id
            title
            quantity
            taxLines {
              title
              rate
              priceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Shopify APIのURLを構築
 */
export function buildShopifyApiUrl(shopifyStoreUrl: string): string {
  // URLから "https://" を除去し、ドメインのみ取得
  const domain = shopifyStoreUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `https://${domain}/admin/api/2025-04/graphql.json`;
}

/**
 * Shopify APIに注文を作成
 */
export async function createShopifyOrder(
  shopifyStoreUrl: string,
  accessToken: string,
  orderData: OrderCreateInput = DEFAULT_ORDER
): Promise<OrderCreateResponse> {
  const apiUrl = buildShopifyApiUrl(shopifyStoreUrl);
  
  console.log(`\n📦 Creating Shopify order...`);
  console.log(`   Store: ${shopifyStoreUrl}`);
  console.log(`   API URL: ${apiUrl}`);

  const variables: OrderCreateVariables = {
    order: orderData,
  };

  console.log('📦 Order Data:', JSON.stringify(orderData, null, 2));

  try {
    const response = await axios.post<OrderCreateResponse>(
      apiUrl,
      {
        query: ORDER_CREATE_MUTATION,
        variables,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        // SSL証明書検証を無効化（開発環境用）
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false,
        }),
      }
    );

    // レスポンスのデバッグログ
    console.log('📦 API Response:', JSON.stringify(response.data, null, 2));

    // レスポンス構造の確認
    if (!response.data || !response.data.data) {
      console.error('❌ Invalid response structure:', response.data);
      throw new Error('Invalid response from Shopify API');
    }

    // エラーチェック
    if (response.data.data.orderCreate.userErrors.length > 0) {
      console.error('❌ Shopify API returned errors:');
      response.data.data.orderCreate.userErrors.forEach((error) => {
        console.error(`   - ${error.message} (${error.field.join('.')})`);
      });
      throw new Error('Failed to create order due to validation errors');
    }

    const order = response.data.data.orderCreate.order;
    console.log('✅ Order created successfully!');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Phone: ${order.phone}`);
    console.log(`   Total Tax: ${order.totalTaxSet.shopMoney.amount} ${order.totalTaxSet.shopMoney.currencyCode}`);
    console.log(`   Line Items: ${order.lineItems.nodes.length}`);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('❌ HTTP Error:', axiosError.message);
      
      if (axiosError.response) {
        console.error('   Status:', axiosError.response.status);
        console.error('   Data:', JSON.stringify(axiosError.response.data, null, 2));
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }
    throw error;
  }
}

/**
 * カスタム注文データで注文を作成
 */
export async function createCustomOrder(
  shopifyStoreUrl: string,
  accessToken: string,
  customOrderData: Partial<OrderCreateInput>
): Promise<OrderCreateResponse> {
  // カスタムデータをそのまま使用（DEFAULT_ORDERとマージしない）
  // テンプレートから必要なデータがすべて来ることを想定
  return createShopifyOrder(shopifyStoreUrl, accessToken, customOrderData as OrderCreateInput);
}
