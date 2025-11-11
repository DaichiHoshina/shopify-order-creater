/**
 * Consignor Entity
 *
 * 配送元を表現するエンティティ（集約ルート）
 *
 * ビジネスルール:
 * - テストデータ: application_status = 'accepted', 既存のdetail_id使用
 * - 本番データ: application_status = 'not_applied', detail_id = 0
 * - デプロイ可能: acceptedステータス かつ いずれかのdetail_idが設定済み
 */

import { Shop } from '../shop/shop.entity';
import { Location } from './location.value-object';
import { ApplicationStatus } from './application-status.value-object';

export class Consignor {
  private constructor(
    private readonly shop: Shop,
    private readonly location: Location,
    private readonly status: ApplicationStatus,
    private readonly sagawaDetailId: number,
    private readonly yamatoDetailId: number,
    private readonly japanPostDetailId: number
  ) {}

  /**
   * テストデータ用のConsignorを作成
   * - application_status: accepted
   * - Shopのcredentialsを使用
   *
   * @param shop Shop entity
   * @param location Location value object
   * @returns Consignor instance
   */
  static createTestData(shop: Shop, location: Location): Consignor {
    const credentials = shop.getCredentials();

    return new Consignor(
      shop,
      location,
      ApplicationStatus.accepted(),
      credentials.sagawaDetailId,
      credentials.yamatoDetailId,
      credentials.japanPostDetailId
    );
  }

  /**
   * 本番データ用のConsignorを作成
   * - application_status: not_applied
   * - detail_id: すべて0（配送業者との契約が必要）
   *
   * @param shop Shop entity
   * @param location Location value object
   * @returns Consignor instance
   */
  static createForProduction(shop: Shop, location: Location): Consignor {
    return new Consignor(
      shop,
      location,
      ApplicationStatus.notApplied(),
      0, // sagawa
      0, // yamato
      0 // japan_post
    );
  }

  /**
   * デプロイ可能かどうかを判定
   *
   * ビジネスルール:
   * - application_status が accepted
   * - かつ、いずれかの配送業者のdetail_idが設定されている
   *
   * @returns true if deployable
   */
  canDeploy(): boolean {
    if (!this.status.isAccepted()) {
      return false;
    }

    return this.sagawaDetailId > 0 || this.yamatoDetailId > 0 || this.japanPostDetailId > 0;
  }

  /**
   * INSERT SQL文を生成
   *
   * @returns SQL INSERT statement
   */
  toSQL(): string {
    const shopId = this.shop.getShopifyShopId().toString();
    const storeId = this.shop.getStoreId();
    const location = this.location;
    const status = this.status.toString();

    const sql = `INSERT INTO consignors (
  shopify_shop_id,
  store_id,
  japan_post_consignor_detail_id,
  sagawa_consignor_detail_id,
  yamato_consignor_detail_id,
  print_name,
  location_name,
  postal_code,
  prefecture,
  city,
  address,
  building,
  tel,
  delivery_usage,
  application_status,
  application_status_sagawa,
  application_status_yamato,
  deletion_requested
) VALUES (
  '${shopId}',
  ${storeId},
  ${this.japanPostDetailId},
  ${this.sagawaDetailId},
  ${this.yamatoDetailId},
  '',
  '${location.getName()}',
  '${location.getPostalCode().toString()}',
  '${location.getPrefecture().toString()}',
  '${location.getCity()}',
  '${location.getAddress1()}',
  '${location.getAddress2()}',
  '${location.getPhone().toString()}',
  1,
  '${status}',
  '${status}',
  '${status}',
  0
);`;

    return sql;
  }

  /**
   * Shopを取得
   */
  getShop(): Shop {
    return this.shop;
  }

  /**
   * Locationを取得
   */
  getLocation(): Location {
    return this.location;
  }

  /**
   * ApplicationStatusを取得
   */
  getStatus(): ApplicationStatus {
    return this.status;
  }
}
