/**
 * 北海道の注文を再作成するスクリプト
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { createShopifyOrder } from './shopify';
import { extractOrderData } from './template-converter';

dotenv.config();

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ エラー: 環境変数 SHOPIFY_STORE_URL と SHOPIFY_ACCESS_TOKEN を設定してください');
  process.exit(1);
}

async function createHokkaidoOrder() {
  const templateFile = 'hokkaido-to-tokyo.json';
  const templatePath = path.join(__dirname, '../test-scenarios/consignor-area', templateFile);

  console.log('\n🔄 北海道の注文を再作成します\n');
  console.log(`📦 ストア: ${SHOPIFY_STORE_URL}`);
  console.log(`📄 テンプレート: ${templateFile}\n`);

  try {
    // テンプレートファイルを読み込み
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const template = JSON.parse(templateContent);

    console.log('📋 テンプレート内容:');
    console.log(`   - 商品名: ${template.order.line_items[0]?.title}`);
    console.log(`   - アイテム数: ${template.order.line_items[0]?.quantity}個`);
    console.log(`   - タグ: ${template.order.tags}`);
    console.log(
      `   - 配送先: ${template.order.shipping_address.province} ${template.order.shipping_address.city}`
    );
    console.log(`   - 住所1: ${template.order.shipping_address.address1}`);
    console.log(`   - 郵便番号: ${template.order.shipping_address.zip}\n`);

    // テンプレートデータをShopify API形式に変換
    const orderData = extractOrderData(template);

    // Shopify注文を作成
    console.log('🔄 Shopify注文を作成中...');
    const result = await createShopifyOrder(SHOPIFY_STORE_URL!, SHOPIFY_ACCESS_TOKEN!, orderData);

    const orderId = result.data?.orderCreate?.order?.id || 'N/A';
    console.log(`\n✅ 成功！注文ID: ${orderId}\n`);
  } catch (error) {
    console.error(`\n❌ 失敗しました`);
    if (error instanceof Error) {
      console.error(`エラー: ${error.message}\n`);
    }
    process.exit(1);
  }
}

// スクリプトを実行
createHokkaidoOrder()
  .then(() => {
    console.log('✨ 北海道の注文作成完了');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  });
