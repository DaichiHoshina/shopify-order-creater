/**
 * Plus Shipping CLI 型定義
 */

export interface LocationData {
  area: string;
  name: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  province_code: string;
  zip: string;
  country_code: string;
  phone: string;
}

export interface ShopConfig {
  shopify_shop_id: string;
  store_id: number;
  environments: {
    [key: string]: EnvironmentConfig;
  };
  credentials?: {
    sagawa_detail_id?: number;
    yamato_detail_id?: number;
    japan_post_detail_id?: number;
  };
}

export interface EnvironmentConfig {
  namespace: string;
  context: string;
  db_name: string;
  db_config_map: string;
  db_secret: string;
}

export interface ShopsConfig {
  shops: {
    [shopName: string]: ShopConfig;
  };
}

export interface ConsignorSQLOptions {
  shop: string;
  testData?: boolean;
  output?: string;
}

export interface DeployOptions {
  shop: string;
  env: 'tes' | 'prod';
  dryRun?: boolean;
}

export interface OrderCreateOptions {
  shop: string;
  accessToken?: string;
  areas?: string[];
  dryRun?: boolean;
}

export interface KubernetesExecSQLOptions {
  namespace: string;
  podName: string;
  dbHost: string;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  dbPort?: string;
  sql: string;
}

export interface DBCredentials {
  host: string;
  user: string;
  password: string;
  port: string;
  name: string;
}
