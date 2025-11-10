/**
 * Plus Shipping用の配送元データSQLを生成するスクリプト
 * store_managementのconsignorsテーブル用
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

/**
 * consignorsテーブル用のINSERT SQLを生成
 */
function generateInsertSQL(
  shopifyShopId: string,
  storeId: number,
  locations: LocationData[]
): string {
  let sql = `-- Plus Shipping 配送元データ登録SQL（consignorsテーブル）\n`;
  sql += `-- 生成日時: ${new Date().toLocaleString('ja-JP')}\n`;
  sql += `-- Shopify Shop ID: ${shopifyShopId}\n`;
  sql += `-- Store ID: ${storeId}\n\n`;

  locations.forEach((location, index) => {
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
    sql += `  '${shopifyShopId}',\n`;
    sql += `  ${storeId},\n`;
    sql += `  0,\n`;
    sql += `  0,\n`;
    sql += `  0,\n`;
    sql += `  '',\n`;
    sql += `  '${location.name}',\n`;
    sql += `  '${location.zip}',\n`;
    sql += `  '${location.province}',\n`;
    sql += `  '${location.city}',\n`;
    sql += `  '${location.address1}',\n`;
    sql += `  '${location.address2}',\n`;
    sql += `  '${location.phone}',\n`;
    sql += `  1,\n`;
    sql += `  'not_applied',\n`;
    sql += `  'not_applied',\n`;
    sql += `  'not_applied',\n`;
    sql += `  0\n`;
    sql += `);\n\n`;
  });

  return sql;
}

/**
 * consignorsテーブル用のUPSERT SQLを生成（ON DUPLICATE KEY UPDATE）
 */
function generateUpsertSQL(
  shopifyShopId: string,
  storeId: number,
  locations: LocationData[]
): string {
  let sql = `-- Plus Shipping 配送元データ登録/更新SQL（UPSERT）\n`;
  sql += `-- 生成日時: ${new Date().toLocaleString('ja-JP')}\n`;
  sql += `-- Shopify Shop ID: ${shopifyShopId}\n`;
  sql += `-- Store ID: ${storeId}\n\n`;
  sql += `-- 注意: consignorsテーブルにはUNIQUE KEYがないため、通常のINSERTを使用してください\n`;
  sql += `-- 既存データと重複する場合は、location_nameで識別して手動でUPDATEしてください\n\n`;

  sql += generateInsertSQL(shopifyShopId, storeId, locations);

  return sql;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('🚀 Plus Shipping 配送元データのSQL生成を開始します\n');

  // Shopify Shop IDを入力
  const shopifyShopId = await rl.question(
    '📍 Shopify Shop IDを入力してください (例: test-store-1.myshopify.com): '
  );
  console.log(`✓ Shopify Shop ID: ${shopifyShopId}\n`);

  // Store IDを入力
  const storeIdInput = await rl.question(
    '🏪 Store IDを入力してください (storesテーブルのid、例: 404): '
  );
  const storeId = parseInt(storeIdInput, 10);
  console.log(`✓ Store ID: ${storeId}\n`);

  rl.close();

  // locations.jsonを読み込み
  const locationsPath = path.join(__dirname, '../data/locations.json');
  const locationsData = JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));

  console.log(`📦 読み込んだロケーション数: ${locationsData.length}件\n`);

  // 出力ディレクトリを作成
  const outputDir = path.join(__dirname, '../sql-output-store-management');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // INSERT SQLを生成
  const insertSQL = generateInsertSQL(shopifyShopId, storeId, locationsData);
  const insertPath = path.join(outputDir, 'insert_consignors.sql');
  fs.writeFileSync(insertPath, insertSQL, 'utf-8');
  console.log(`✅ INSERT SQL生成完了: ${insertPath}`);

  // UPSERT SQLを生成（参考用）
  const upsertSQL = generateUpsertSQL(shopifyShopId, storeId, locationsData);
  const upsertPath = path.join(outputDir, 'upsert_consignors.sql');
  fs.writeFileSync(upsertPath, upsertSQL, 'utf-8');
  console.log(`✅ UPSERT SQL生成完了: ${upsertPath}`);

  console.log('\n📊 生成されたSQLファイル:');
  console.log(`  1. ${insertPath}`);
  console.log(`  2. ${upsertPath}`);

  console.log('\n📝 使用方法:');
  console.log('  1. 生成されたSQLファイルを確認');
  console.log('  2. store_management DBに対してSQLを実行');
  console.log(`     kubectl exec -i -n store temp-mysql-client -- mysql ...`);

  console.log('\n✨ SQL生成が完了しました！');
}

main().catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
