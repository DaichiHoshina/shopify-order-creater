/**
 * 配送元SQL生成ジェネレーター
 */

import * as fs from 'fs';
import * as path from 'path';
import { LocationData, ShopConfig } from '../types/index';

export class ConsignorSQLGenerator {
  private locationsData: LocationData[];

  constructor() {
    // locations.jsonを読み込み
    const locationsPath = path.join(__dirname, '../../data/locations.json');
    this.locationsData = JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));
  }

  /**
   * INSERT SQLを生成
   */
  generateInsertSQL(shopConfig: ShopConfig, testData: boolean = false): string {
    const { shopify_shop_id, store_id, credentials } = shopConfig;

    let sql = `-- Plus Shipping 配送元データ登録SQL（consignorsテーブル）\n`;
    sql += `-- 生成日時: ${new Date().toLocaleString('ja-JP')}\n`;
    sql += `-- Shopify Shop ID: ${shopify_shop_id}\n`;
    sql += `-- Store ID: ${store_id}\n`;

    if (testData) {
      sql += `-- 用途: テストデータ\n`;
      sql += `-- 注意: 既存のdetail_idを使い回しています\n`;
    }

    sql += `\n`;

    const sagawaDetailId =
      testData && credentials?.sagawa_detail_id ? credentials.sagawa_detail_id : 0;
    const yamatoDetailId =
      testData && credentials?.yamato_detail_id ? credentials.yamato_detail_id : 0;
    const japanPostDetailId =
      testData && credentials?.japan_post_detail_id ? credentials.japan_post_detail_id : 0;

    const applicationStatus = testData ? 'accepted' : 'not_applied';

    this.locationsData.forEach((location, index) => {
      sql += `-- ${index + 1}. ${location.province} - ${location.name}\n`;
      sql += `INSERT INTO consignors (\n`;
      sql += `  shopify_shop_id,\n`;
      sql += `  store_id,\n`;
      sql += `  japan_post_consignor_detail_id,\n`;
      sql += `  sagawa_consignor_detail_id,\n`;
      sql += `  yamato_consignor_detail_id,\n`;
      sql += `  print_name,\n`;
      sql += `  location_name,\n`;
      sql += `  postal_code,\n`;
      sql += `  prefecture,\n`;
      sql += `  city,\n`;
      sql += `  address,\n`;
      sql += `  building,\n`;
      sql += `  tel,\n`;
      sql += `  delivery_usage,\n`;
      sql += `  application_status,\n`;
      sql += `  application_status_sagawa,\n`;
      sql += `  application_status_yamato,\n`;
      sql += `  deletion_requested\n`;
      sql += `) VALUES (\n`;
      sql += `  '${shopify_shop_id}',\n`;
      sql += `  ${store_id},\n`;
      sql += `  ${japanPostDetailId},\n`;
      sql += `  ${sagawaDetailId},\n`;
      sql += `  ${yamatoDetailId},\n`;
      sql += `  '',\n`;
      sql += `  '${location.name}',\n`;
      sql += `  '${location.zip}',\n`;
      sql += `  '${location.province}',\n`;
      sql += `  '${location.city}',\n`;
      sql += `  '${location.address1}',\n`;
      sql += `  '${location.address2}',\n`;
      sql += `  '${location.phone}',\n`;
      sql += `  1,\n`;
      sql += `  '${applicationStatus}',\n`;
      sql += `  '${applicationStatus}',\n`;
      sql += `  '${applicationStatus}',\n`;
      sql += `  0\n`;
      sql += `);\n\n`;
    });

    return sql;
  }

  /**
   * DELETE SQLを生成（ロールバック用）
   */
  generateDeleteSQL(shopConfig: ShopConfig): string {
    const { shopify_shop_id } = shopConfig;

    let sql = `-- Plus Shipping 配送元データ削除SQL（ロールバック用）\n`;
    sql += `-- 生成日時: ${new Date().toLocaleString('ja-JP')}\n`;
    sql += `-- Shopify Shop ID: ${shopify_shop_id}\n\n`;

    sql += `DELETE FROM consignors \n`;
    sql += `WHERE shopify_shop_id = '${shopify_shop_id}' \n`;
    sql += `  AND location_name LIKE '%配送センター%';\n`;

    return sql;
  }

  /**
   * SQLファイルとして保存
   */
  saveToFile(sql: string, filename: string, outputDir?: string): string {
    const dir = outputDir || path.join(__dirname, '../../sql-output-store-management');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, sql, 'utf-8');

    return filepath;
  }
}
