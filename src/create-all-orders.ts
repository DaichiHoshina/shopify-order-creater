/**
 * 全13エリアの注文を一括作成するスクリプト
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

// エリア名マッピング
const AREA_NAME_MAP: Record<string, string> = {
  'hokkaido-to-tokyo': '北海道',
  'kita-tohoku-to-tokyo': '北東北',
  'minami-tohoku-to-tokyo': '南東北',
  'kanto-to-tokyo': '関東',
  'shinetsu-to-tokyo': '信越',
  'hokuriku-to-tokyo': '北陸',
  'chubu-to-tokyo': '中部',
  'kansai-to-tokyo': '関西',
  'chugoku-to-tokyo': '中国',
  'shikoku-to-tokyo': '四国',
  'kita-kyushu-to-tokyo': '北九州',
  'minami-kyushu-to-tokyo': '南九州',
  'okinawa-to-tokyo': '沖縄'
};

// 13エリアのテンプレートファイル
const ALL_TEMPLATE_FILES = [
  'hokkaido-to-tokyo.json',
  'kita-tohoku-to-tokyo.json',
  'minami-tohoku-to-tokyo.json',
  'kanto-to-tokyo.json',
  'shinetsu-to-tokyo.json',
  'hokuriku-to-tokyo.json',
  'chubu-to-tokyo.json',
  'kansai-to-tokyo.json',
  'chugoku-to-tokyo.json',
  'shikoku-to-tokyo.json',
  'kita-kyushu-to-tokyo.json',
  'minami-kyushu-to-tokyo.json',
  'okinawa-to-tokyo.json',
];

async function createAllOrders() {
  console.log('\n🚀 13エリアの一括注文作成を開始します\n');
  console.log(`📦 対象ストア: ${SHOPIFY_STORE_URL}`);
  console.log(`📋 作成する注文数: ${ALL_TEMPLATE_FILES.length}件\n`);
  console.log('='.repeat(60));

  const results = {
    succeeded: [] as string[],
    failed: [] as string[]
  };

  for (let i = 0; i < ALL_TEMPLATE_FILES.length; i++) {
    const templateFile = ALL_TEMPLATE_FILES[i];
    const templatePath = path.join(__dirname, '../test-scenarios/consignor-area', templateFile);

    console.log(`\n[${i + 1}/${ALL_TEMPLATE_FILES.length}] 📄 ${templateFile} を処理中...`);

    try {
      // テンプレートファイルを読み込み
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const template = JSON.parse(templateContent);

      // エリア名を取得
      const fileKey = templateFile.replace('.json', '');
      const areaName = AREA_NAME_MAP[fileKey];

      if (!areaName) {
        throw new Error(`エリア名が見つかりません: ${fileKey}`);
      }

      console.log(`   📋 商品名: ${template.order.line_items[0]?.title}`);
      console.log(`   📦 アイテム数: ${template.order.line_items[0]?.quantity}個`);
      console.log(`   🏷️  タグ: ${template.order.tags}`);
      console.log(`   📍 配送先: ${template.order.shipping_address.province} ${template.order.shipping_address.city}`);

      // テンプレートデータをShopify API形式に変換
      const orderData = extractOrderData(template);

      // Shopify注文を作成
      console.log(`   🔄 Shopify注文を作成中...`);
      const result = await createShopifyOrder(
        SHOPIFY_STORE_URL!,
        SHOPIFY_ACCESS_TOKEN!,
        orderData
      );

      const orderId = result.data?.orderCreate?.order?.id || 'N/A';
      console.log(`   ✅ 成功: 注文ID ${orderId}`);
      results.succeeded.push(`${areaName} (${orderId})`);

    } catch (error) {
      console.error(`   ❌ 失敗: ${templateFile}`);
      if (error instanceof Error) {
        console.error(`      エラー: ${error.message}`);
      }
      const fileKey = templateFile.replace('.json', '');
      const areaName = AREA_NAME_MAP[fileKey] || fileKey;
      results.failed.push(`${areaName} - ${error instanceof Error ? error.message : String(error)}`);
    }

    // API レート制限を考慮して10秒待機（最後の注文以外）
    if (i < ALL_TEMPLATE_FILES.length - 1) {
      console.log(`   ⏳ 10秒待機中...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  // 最終結果を表示
  console.log('\n' + '='.repeat(60));
  console.log('📊 一括注文作成の結果');
  console.log('='.repeat(60));
  console.log(`✅ 成功: ${results.succeeded.length}件`);
  results.succeeded.forEach((name, index) => {
    console.log(`   ${index + 1}. ${name}`);
  });

  console.log(`\n❌ 失敗: ${results.failed.length}件`);
  if (results.failed.length > 0) {
    results.failed.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  console.log('='.repeat(60) + '\n');
}

// スクリプトを実行
createAllOrders()
  .then(() => {
    console.log('✨ 処理が完了しました');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  });
