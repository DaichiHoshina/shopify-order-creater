import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline/promises';
import { createShopifyOrder } from './shopify';
import { extractOrderData } from './template-converter';

dotenv.config();

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ エラー: 環境変数 SHOPIFY_STORE_URL と SHOPIFY_ACCESS_TOKEN を設定してください');
  process.exit(1);
}

// 統一配送元住所（未使用 - テンプレートに各県庁が設定済み）
const UNIFIED_CONSIGNOR = {
  zip: '135-0061',
  prefecture: '東京都',
  city: '江東区',
  address: '豊洲３丁目３−３ 豊洲センタービル',
};

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
  'kyushu-to-tokyo': '九州',
  'okinawa-to-tokyo': '沖縄',
  'remote-island-to-tokyo': '離島',
};

// 13配送元パターンのテンプレートファイル
const TEMPLATE_FILES = [
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
  'kyushu-to-tokyo.json',
  'okinawa-to-tokyo.json',
  'remote-island-to-tokyo.json',
];

interface OrderTemplate {
  description: string;
  test_id: string;
  order: {
    email: string;
    fulfillment_status: string;
    send_receipt: boolean;
    send_fulfillment_receipt: boolean;
    note: string;
    tags: string;
    line_items: Array<{
      variant_id: null;
      quantity: number;
      title: string;
      price: string;
      grams: number;
      sku: string;
      requires_shipping: boolean;
    }>;
    shipping_address: {
      first_name: string;
      last_name: string;
      company: string | null;
      address1: string;
      address2: string | null;
      city: string;
      province: string;
      province_code: string;
      country: string;
      country_code: string;
      zip: string;
      phone: string;
    };
    shipping_lines: Array<{
      title: string;
      price: string;
      code: string;
      source: string;
    }>;
    financial_status: string;
  };
  shipping_metadata: {
    carrier: string;
    service_type: string;
    packing_size: number;
    consignor_prefecture: string;
    consignor_city: string;
    destination_prefecture: string;
    purchase_type: string;
    expected_base_fee: number;
    area_classification: string;
    area_code: string;
  };
}

async function createBulkOrders(): Promise<void> {
  console.log(
    '🚀 13配送元パターンの一括注文作成を開始します（v2: 100個アイテム + 配送元タグ + 統一住所）\n'
  );
  console.log(`📦 対象ストア: ${SHOPIFY_STORE_URL}\n`);

  const results = {
    succeeded: [] as string[],
    failed: [] as string[],
  };

  for (let i = 0; i < TEMPLATE_FILES.length; i++) {
    const templateFile = TEMPLATE_FILES[i];
    const templatePath = path.join(__dirname, '../test-scenarios/consignor-area', templateFile);

    console.log(`\n[${i + 1}/${TEMPLATE_FILES.length}] 📄 ${templateFile} を処理中...`);

    try {
      // テンプレートファイルを読み込み
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const template: OrderTemplate = JSON.parse(templateContent);

      // エリア名を取得
      const fileKey = templateFile.replace('.json', '');
      const areaName = AREA_NAME_MAP[fileKey];

      if (!areaName) {
        throw new Error(`エリア名が見つかりません: ${fileKey}`);
      }

      // テンプレートは既に更新済み（update-templates.tsで）
      // 念のため確認のみ
      console.log(`   ✅ テンプレート確認完了`);
      console.log(`      - アイテム数: ${template.order.line_items[0]?.quantity || 0}個`);
      console.log(`      - タグ: ${template.order.tags}`);
      console.log(
        `      - 配送元: ${template.shipping_metadata.consignor_prefecture} ${template.shipping_metadata.consignor_city}`
      );
      console.log(
        `      - 配送先: ${template.order.shipping_address.province} ${template.order.shipping_address.city}`
      );

      // テンプレートデータをShopify API形式に変換
      const orderData = extractOrderData(template);

      // Shopify注文を作成
      console.log(`   🔄 Shopify注文を作成中...`);
      const result = await createShopifyOrder(SHOPIFY_STORE_URL!, SHOPIFY_ACCESS_TOKEN!, orderData);

      const orderId = result.data?.orderCreate?.order?.id || 'N/A';
      console.log(`   ✅ 成功: 注文ID ${orderId}`);
      results.succeeded.push(`${areaName} (${templateFile})`);
    } catch (error) {
      console.error(`   ❌ 失敗: ${templateFile}`);
      if (error instanceof Error) {
        console.error(`      エラー: ${error.message}`);
      }
      results.failed.push(
        `${templateFile} - ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // API レート制限を考慮して10秒待機（最後の注文以外）
    if (i < TEMPLATE_FILES.length - 1) {
      console.log(`   ⏳ 10秒待機中...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  // 最終結果を表示
  console.log('\n' + '='.repeat(60));
  console.log('📊 一括注文作成の結果');
  console.log('='.repeat(60));
  console.log(`✅ 成功: ${results.succeeded.length}件`);
  results.succeeded.forEach(name => {
    console.log(`   - ${name}`);
  });

  console.log(`\n❌ 失敗: ${results.failed.length}件`);
  results.failed.forEach(error => {
    console.log(`   - ${error}`);
  });
  console.log('='.repeat(60) + '\n');
}

// スクリプトを実行
createBulkOrders()
  .then(() => {
    console.log('✨ 処理が完了しました');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  });
