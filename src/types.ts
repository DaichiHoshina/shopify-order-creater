/**
 * 型定義ファイル
 */

// DynamoDB Session Item
export interface DynamoDBSessionItem {
  SessionId: string;
  session_id?: string;
  session?: string;
  [key: string]: unknown;
}

// Shopify Session from DynamoDB
export interface ShopifySession {
  id: string;
  shop: string;
  state: string;
  isOnline: boolean;
  scope: string;
  expires?: string;
  onlineAccessInfo?: string;
  accessToken?: string;
  [key: string]: unknown;
}

// Shopify Order Creation Input
export interface OrderCreateInput {
  currency: string;
  lineItems: LineItem[];
  shippingAddress: ShippingAddress;
  phone: string;
  transactions: Transaction[];
}

export interface LineItem {
  title: string;
  priceSet: PriceSet;
  quantity: number;
  taxLines: TaxLine[];
}

export interface PriceSet {
  shopMoney: Money;
}

export interface Money {
  amount: number;
  currencyCode: string;
}

export interface TaxLine {
  priceSet: PriceSet;
  rate: number;
  title: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone: string;
}

export interface Transaction {
  kind: string;
  status: string;
  amountSet: PriceSet;
}

// Shopify GraphQL Variables
export interface OrderCreateVariables {
  order: OrderCreateInput;
  options?: OrderCreateOptionsInput;
}

export interface OrderCreateOptionsInput {
  [key: string]: unknown;
}

// Shopify GraphQL Response
export interface OrderCreateResponse {
  data: {
    orderCreate: {
      userErrors: Array<{
        field: string[];
        message: string;
      }>;
      order: {
        id: string;
        totalTaxSet: PriceSet;
        phone: string;
        lineItems: {
          nodes: Array<{
            variant: {
              id: string;
            };
            id: string;
            title: string;
            quantity: number;
            taxLines: TaxLine[];
          }>;
        };
      };
    };
  };
}

// CLI Config
export interface CLIConfig {
  shopifyStoreUrl: string;
  shopifyAccessToken: string;
}
