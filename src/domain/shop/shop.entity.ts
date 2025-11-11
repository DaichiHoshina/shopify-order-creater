/**
 * Shop Entity
 *
 * Shopifyストアを表現するエンティティ
 * 集約ルート: Shop配下の環境設定、認証情報を管理
 */

import { ShopifyShopId } from './shopify-shop-id.value-object';

/**
 * Kubernetes環境設定
 */
export interface KubernetesEnvironment {
  namespace: string;
  context: string;
  dbName: string;
  dbConfigMap: string;
  dbSecret: string;
}

/**
 * 配送業者の認証情報（detail_id）
 */
export interface ShippingCredentials {
  sagawaDetailId: number;
  yamatoDetailId: number;
  japanPostDetailId: number;
}

/**
 * Shop作成パラメータ
 */
export interface ShopProps {
  shopifyShopId: ShopifyShopId;
  storeId: number;
  environments: Map<string, KubernetesEnvironment>;
  credentials: ShippingCredentials;
}

export class Shop {
  private constructor(
    private readonly shopifyShopId: ShopifyShopId,
    private readonly storeId: number,
    private readonly environments: Map<string, KubernetesEnvironment>,
    private readonly credentials: ShippingCredentials
  ) {}

  /**
   * Shopを作成
   * @param props Shop properties
   * @returns Shop instance
   * @throws Error if validation fails
   */
  static create(props: ShopProps): Shop {
    // バリデーション
    if (props.storeId <= 0) {
      throw new Error('Store ID must be a positive number');
    }

    return new Shop(props.shopifyShopId, props.storeId, props.environments, props.credentials);
  }

  /**
   * Shopify Shop IDを取得
   */
  getShopifyShopId(): ShopifyShopId {
    return this.shopifyShopId;
  }

  /**
   * Store IDを取得
   */
  getStoreId(): number {
    return this.storeId;
  }

  /**
   * 指定された環境設定を取得
   * @param name 環境名 (例: 'tes', 'stg', 'prd')
   * @returns Kubernetes環境設定
   * @throws Error if environment not found
   */
  getEnvironment(name: string): KubernetesEnvironment {
    const env = this.environments.get(name);
    if (!env) {
      throw new Error(`Environment "${name}" not found for shop ${this.shopifyShopId.toString()}`);
    }
    return env;
  }

  /**
   * 環境が存在するかチェック
   */
  hasEnvironment(name: string): boolean {
    return this.environments.has(name);
  }

  /**
   * 配送業者の認証情報を取得
   */
  getCredentials(): ShippingCredentials {
    return { ...this.credentials }; // 防御的コピー
  }

  /**
   * テスト用の認証情報を持っているかチェック
   * いずれかの配送業者のdetail_idが設定されていればtrue
   */
  hasTestCredentials(): boolean {
    return (
      this.credentials.sagawaDetailId > 0 ||
      this.credentials.yamatoDetailId > 0 ||
      this.credentials.japanPostDetailId > 0
    );
  }
}
