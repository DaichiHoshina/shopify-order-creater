/**
 * ShopifyShopId Value Object
 *
 * Shopifyストアの一意識別子を表現する不変オブジェクト
 * 形式: shop-name.myshopify.com
 */

export class ShopifyShopId {
  private static readonly SHOPIFY_DOMAIN = '.myshopify.com';
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Shopify Shop IDを作成
   * @param input Shopify Shop ID (例: "81-test-store-plan-silver.myshopify.com")
   * @returns ShopifyShopId instance
   * @throws Error if invalid format
   */
  static from(input: string): ShopifyShopId {
    // バリデーション
    if (!input || input.trim() === '') {
      throw new Error('Invalid Shopify Shop ID: empty string');
    }

    const trimmed = input.trim();

    // .myshopify.com で終わるかチェック
    if (!trimmed.endsWith(this.SHOPIFY_DOMAIN)) {
      throw new Error(`Invalid Shopify Shop ID: must end with ${this.SHOPIFY_DOMAIN}`);
    }

    // ショップ名部分を抽出
    const shopName = trimmed.slice(0, -this.SHOPIFY_DOMAIN.length);

    // ショップ名が空でないかチェック
    if (shopName.length === 0) {
      throw new Error('Invalid Shopify Shop ID: shop name cannot be empty');
    }

    // ショップ名の形式チェック（小文字の英字、数字、ハイフンのみ）
    if (!/^[a-z0-9-]+$/.test(shopName)) {
      throw new Error(
        'Invalid Shopify Shop ID: shop name must contain only lowercase letters, numbers, and hyphens'
      );
    }

    return new ShopifyShopId(trimmed);
  }

  /**
   * 等価性チェック
   */
  equals(other: ShopifyShopId): boolean {
    return this.value === other.value;
  }

  /**
   * 文字列表現を取得
   */
  toString(): string {
    return this.value;
  }

  /**
   * ショップ名部分を取得（.myshopify.comを除いた部分）
   */
  getShopName(): string {
    return this.value.slice(0, -ShopifyShopId.SHOPIFY_DOMAIN.length);
  }

  /**
   * ストアのHTTPS URLを取得
   */
  getStoreUrl(): string {
    return `https://${this.value}`;
  }
}
