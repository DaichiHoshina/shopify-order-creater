/**
 * 失敗した2件の注文を再作成するスクリプト（北陸、南九州）
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

const FAILED_TEMPLATES = [
  { file: 'hokuriku-to-tokyo.json', area: '北陸' },
  { file: 'minami-kyushu-to-tokyo.json', area: '南九州' },
];

async function retryFailedOrders() {
  console.log('\n🔄 失敗した2件の注文を再作成します\n');
  console.log(`📦 ストア: ${SHOPIFY_STORE_URL}`);
  console.log('⏳ レート制限回避のため30秒待機中...\n');
  await new Promise(resolve => setTimeout(resolve, 30000));

  const results = {
    succeeded: [] as string[],
    failed: [] as string[],
  };

  for (let i = 0; i < FAILED_TEMPLATES.length; i++) {
    const { file, area } = FAILED_TEMPLATES[i];
    const templatePath = path.join(__dirname, '../test-scenarios/consignor-area', file);

    console.log(`\n[${i + 1}/${FAILED_TEMPLATES.length}] 📄 ${file} を処理中...`);

    try {
      // テンプレートファイルを読み込み
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const template = JSON.parse(templateContent);

      console.log(`   📋 商品名: ${template.order.line_items[0]?.title}`);
      console.log(`   📦 アイテム数: ${template.order.line_items[0]?.quantity}個`);
      console.log(`   🏷️  タグ: ${template.order.tags}`);
      console.log(
        `   📍 配送先: ${template.order.shipping_address.province} ${template.order.shipping_address.city}`
      );

      // テンプレートデータをShopify API形式に変換
      const orderData = extractOrderData(template);

      // Shopify注文を作成
      console.log(`   🔄 Shopify注文を作成中...`);
      const result = await createShopifyOrder(SHOPIFY_STORE_URL!, SHOPIFY_ACCESS_TOKEN!, orderData);

      const orderId = result.data?.orderCreate?.order?.id || 'N/A';
      console.log(`   ✅ 成功！注文ID: ${orderId}`);
      results.succeeded.push(`${area} (${orderId})`);
    } catch (error) {
      console.error(`   ❌ 失敗: ${file}`);
      if (error instanceof Error) {
        console.error(`      エラー: ${error.message}`);
      }
      results.failed.push(`${area} - ${error instanceof Error ? error.message : String(error)}`);
    }

    // 次の注文の前に15秒待機
    if (i < FAILED_TEMPLATES.length - 1) {
      console.log(`   ⏳ 15秒待機中...`);
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }

  // 結果を表示
  console.log('\n' + '='.repeat(60));
  console.log('📊 再実行の結果');
  console.log('='.repeat(60));
  console.log(`✅ 成功: ${results.succeeded.length}件`);
  results.succeeded.forEach(name => {
    console.log(`   - ${name}`);
  });

  console.log(`\n❌ 失敗: ${results.failed.length}件`);
  if (results.failed.length > 0) {
    results.failed.forEach(error => {
      console.log(`   - ${error}`);
    });
  }
  console.log('='.repeat(60) + '\n');
}

// スクリプトを実行
retryFailedOrders()
  .then(() => {
    console.log('✨ 再実行完了');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  });
