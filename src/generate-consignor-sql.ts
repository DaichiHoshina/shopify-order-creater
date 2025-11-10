/**
 * Plus Shipping用の配送元データSQLを生成するスクリプト（ショップ毎）
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline/promises';

interface LocationData {
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

// エリアコードマッピング
const AREA_CODE_MAP: Record<string, string> = {
  'hokkaido': '01',
  'kita-tohoku': '02',
  'minami-tohoku': '03',
  'kanto': '04',
  'shinetsu': '05',
  'hokuriku': '06',
  'chubu': '07',
  'kansai': '08',
  'chugoku': '09',
  'shikoku': '10',
  'kyushu': '11',
  'okinawa': '12',
  'remote-island': '13',
};

function generateCreateTableSQL(): string {
  let sql = `-- Plus Shipping 配送元ロケーションテーブル作成SQL\n`;
  sql += `-- 生成日時: ${new Date().toLocaleString('ja-JP')}\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS consignor_locations (\n`;
  sql += `  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,\n`;
  sql += `  shopify_shop_id VARCHAR(200) NOT NULL COMMENT 'Shopify Shop ID',\n`;
  sql += `  area_code VARCHAR(2) NOT NULL COMMENT 'エリアコード (01-13)',\n`;
  sql += `  area_name VARCHAR(50) NOT NULL COMMENT 'エリア名 (hokkaido, kanto等)',\n`;
  sql += `  name VARCHAR(100) NOT NULL COMMENT '配送センター名',\n`;
  sql += `  zip VARCHAR(10) NOT NULL COMMENT '郵便番号',\n`;
  sql += `  prefecture VARCHAR(50) NOT NULL COMMENT '都道府県',\n`;
  sql += `  city VARCHAR(50) NOT NULL COMMENT '市区町村',\n`;
  sql += `  address1 VARCHAR(100) NOT NULL COMMENT '住所1',\n`;
  sql += `  address2 VARCHAR(100) DEFAULT '' COMMENT '住所2',\n`;
  sql += `  phone VARCHAR(20) NOT NULL COMMENT '電話番号',\n`;
  sql += `  country_code VARCHAR(2) NOT NULL DEFAULT 'JP' COMMENT '国コード',\n`;
  sql += `  is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '有効フラグ',\n`;
  sql += `  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '作成日時',\n`;
  sql += `  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新日時',\n`;
  sql += `  deleted_at DATETIME(3) DEFAULT NULL COMMENT '削除日時',\n`;
  sql += `  PRIMARY KEY (id),\n`;
  sql += `  UNIQUE KEY idx_shop_area (shopify_shop_id, area_code),\n`;
  sql += `  KEY idx_shopify_shop_id (shopify_shop_id),\n`;
  sql += `  KEY idx_area_code (area_code)\n`;
  sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='配送元ロケーション';\n\n`;

  return sql;
}

function generateInsertSQL(shopifyShopId: string, locations: LocationData[]): string {
  let sql = `-- Plus Shipping 配送元ロケーション登録SQL\n`;
  sql += `-- 生成日時: ${new Date().toLocaleString('ja-JP')}\n`;
  sql += `-- Shopify Shop ID: ${shopifyShopId}\n\n`;

  locations.forEach((location, index) => {
    const areaCode = AREA_CODE_MAP[location.area] || '99';

    sql += `-- ${index + 1}. ${location.province} - ${location.name}\n`;
    sql += `INSERT INTO consignor_locations (\n`;
    sql += `  shopify_shop_id,\n`;
    sql += `  area_code,\n`;
    sql += `  area_name,\n`;
    sql += `  name,\n`;
    sql += `  zip,\n`;
    sql += `  prefecture,\n`;
    sql += `  city,\n`;
    sql += `  address1,\n`;
    sql += `  address2,\n`;
    sql += `  phone,\n`;
    sql += `  country_code,\n`;
    sql += `  is_active,\n`;
    sql += `  created_at,\n`;
    sql += `  updated_at\n`;
    sql += `) VALUES (\n`;
    sql += `  '${shopifyShopId}',\n`;
    sql += `  '${areaCode}',\n`;
    sql += `  '${location.area}',\n`;
    sql += `  '${location.name}',\n`;
    sql += `  '${location.zip}',\n`;
    sql += `  '${location.province}',\n`;
    sql += `  '${location.city}',\n`;
    sql += `  '${location.address1}',\n`;
    sql += `  '${location.address2 || ''}',\n`;
    sql += `  '${location.phone}',\n`;
    sql += `  '${location.country_code}',\n`;
    sql += `  1,\n`;
    sql += `  NOW(),\n`;
    sql += `  NOW()\n`;
    sql += `);\n\n`;
  });

  return sql;
}

function generateUpdateSQL(shopifyShopId: string, locations: LocationData[]): string {
  let sql = `-- Plus Shipping 配送元ロケーション更新SQL\n`;
  sql += `-- 生成日時: ${new Date().toLocaleString('ja-JP')}\n`;
  sql += `-- Shopify Shop ID: ${shopifyShopId}\n\n`;

  sql += `-- 既存データがある場合の更新用SQL\n\n`;

  locations.forEach((location, index) => {
    const areaCode = AREA_CODE_MAP[location.area] || '99';

    sql += `-- ${index + 1}. ${location.province} - ${location.name}\n`;
    sql += `UPDATE consignor_locations SET\n`;
    sql += `  name = '${location.name}',\n`;
    sql += `  zip = '${location.zip}',\n`;
    sql += `  prefecture = '${location.province}',\n`;
    sql += `  city = '${location.city}',\n`;
    sql += `  address1 = '${location.address1}',\n`;
    sql += `  address2 = '${location.address2 || ''}',\n`;
    sql += `  phone = '${location.phone}',\n`;
    sql += `  country_code = '${location.country_code}',\n`;
    sql += `  updated_at = NOW()\n`;
    sql += `WHERE shopify_shop_id = '${shopifyShopId}' AND area_code = '${areaCode}';\n\n`;
  });

  return sql;
}

function generateUpsertSQL(shopifyShopId: string, locations: LocationData[]): string {
  let sql = `-- Plus Shipping 配送元ロケーション登録/更新SQL（UPSERT）\n`;
  sql += `-- 生成日時: ${new Date().toLocaleString('ja-JP')}\n`;
  sql += `-- Shopify Shop ID: ${shopifyShopId}\n\n`;

  sql += `-- INSERT ON DUPLICATE KEY UPDATE 方式\n\n`;

  locations.forEach((location, index) => {
    const areaCode = AREA_CODE_MAP[location.area] || '99';

    sql += `-- ${index + 1}. ${location.province} - ${location.name}\n`;
    sql += `INSERT INTO consignor_locations (\n`;
    sql += `  shopify_shop_id,\n`;
    sql += `  area_code,\n`;
    sql += `  area_name,\n`;
    sql += `  name,\n`;
    sql += `  zip,\n`;
    sql += `  prefecture,\n`;
    sql += `  city,\n`;
    sql += `  address1,\n`;
    sql += `  address2,\n`;
    sql += `  phone,\n`;
    sql += `  country_code,\n`;
    sql += `  is_active,\n`;
    sql += `  created_at,\n`;
    sql += `  updated_at\n`;
    sql += `) VALUES (\n`;
    sql += `  '${shopifyShopId}',\n`;
    sql += `  '${areaCode}',\n`;
    sql += `  '${location.area}',\n`;
    sql += `  '${location.name}',\n`;
    sql += `  '${location.zip}',\n`;
    sql += `  '${location.province}',\n`;
    sql += `  '${location.city}',\n`;
    sql += `  '${location.address1}',\n`;
    sql += `  '${location.address2 || ''}',\n`;
    sql += `  '${location.phone}',\n`;
    sql += `  '${location.country_code}',\n`;
    sql += `  1,\n`;
    sql += `  NOW(),\n`;
    sql += `  NOW()\n`;
    sql += `)\n`;
    sql += `ON DUPLICATE KEY UPDATE\n`;
    sql += `  name = VALUES(name),\n`;
    sql += `  zip = VALUES(zip),\n`;
    sql += `  prefecture = VALUES(prefecture),\n`;
    sql += `  city = VALUES(city),\n`;
    sql += `  address1 = VALUES(address1),\n`;
    sql += `  address2 = VALUES(address2),\n`;
    sql += `  phone = VALUES(phone),\n`;
    sql += `  country_code = VALUES(country_code),\n`;
    sql += `  updated_at = NOW();\n\n`;
  });

  return sql;
}

async function main() {
  console.log('🚀 Plus Shipping 配送元データのSQL生成を開始します\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Shopify Shop IDを入力
    const shopifyShopId = await rl.question('📍 Shopify Shop IDを入力してください (例: test-store-1.myshopify.com): ');

    if (!shopifyShopId || shopifyShopId.trim() === '') {
      console.log('\n❌ Shopify Shop IDが入力されませんでした。終了します。');
      process.exit(1);
    }

    console.log(`\n✓ Shopify Shop ID: ${shopifyShopId}\n`);

    // locations.jsonを読み込み
    const locationsPath = path.join(__dirname, '..', 'data', 'locations.json');
    const locations: LocationData[] = JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));

    console.log(`📦 読み込んだロケーション数: ${locations.length}件\n`);

    // 出力ディレクトリを作成
    const outputDir = path.join(__dirname, '..', 'sql-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // CREATE TABLE SQL生成
    const createTableSQL = generateCreateTableSQL();
    const createTablePath = path.join(outputDir, 'create_consignor_locations_table.sql');
    fs.writeFileSync(createTablePath, createTableSQL, 'utf-8');
    console.log(`✅ CREATE TABLE SQL生成完了: ${createTablePath}`);

    // INSERT SQL生成
    const insertSQL = generateInsertSQL(shopifyShopId, locations);
    const insertPath = path.join(outputDir, 'insert_consignor_locations.sql');
    fs.writeFileSync(insertPath, insertSQL, 'utf-8');
    console.log(`✅ INSERT SQL生成完了: ${insertPath}`);

    // UPDATE SQL生成
    const updateSQL = generateUpdateSQL(shopifyShopId, locations);
    const updatePath = path.join(outputDir, 'update_consignor_locations.sql');
    fs.writeFileSync(updatePath, updateSQL, 'utf-8');
    console.log(`✅ UPDATE SQL生成完了: ${updatePath}`);

    // UPSERT SQL生成
    const upsertSQL = generateUpsertSQL(shopifyShopId, locations);
    const upsertPath = path.join(outputDir, 'upsert_consignor_locations.sql');
    fs.writeFileSync(upsertPath, upsertSQL, 'utf-8');
    console.log(`✅ UPSERT SQL生成完了: ${upsertPath}`);

    console.log('\n📊 生成されたSQLファイル:');
    console.log(`  1. ${createTablePath}`);
    console.log(`  2. ${insertPath}`);
    console.log(`  3. ${updatePath}`);
    console.log(`  4. ${upsertPath}`);

    console.log('\n📝 使用方法:');
    console.log('  1. 最初にCREATE TABLEを実行してテーブルを作成');
    console.log('     ./execute-sql-on-tes.sh');
    console.log('     → create_consignor_locations_table.sql を選択');
    console.log('  2. 次にUPSERTを実行してデータを登録');
    console.log('     ./execute-sql-on-tes.sh');
    console.log('     → upsert_consignor_locations.sql を選択');

    console.log('\n✨ SQL生成が完了しました！\n');
  } finally {
    rl.close();
  }
}

// スクリプトを実行
main().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
