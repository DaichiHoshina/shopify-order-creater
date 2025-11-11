import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline/promises';
import { createShopifyOrder } from './shopify';
import { extractOrderData } from './template-converter';

dotenv.config();

// 統一配送元住所
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

/**
 * 対話式で設定を取得
 */
async function getInteractiveConfig(): Promise<{
  storeUrl: string;
  accessToken: string;
  templates: string[];
}> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log('\n🚀 Shopify 一括注文作成ツール\n');
    console.log('='.repeat(60));

    // ストアURL
    const envStoreUrl = process.env.SHOPIFY_STORE_URL;
    let storeUrl: string;

    if (envStoreUrl) {
      console.log(`\n📍 ストアURL（環境変数から）: ${envStoreUrl}`);
      const useEnvStore = await rl.question('このストアURLを使用しますか？ (y/n): ');

      if (useEnvStore.toLowerCase() === 'y') {
        storeUrl = envStoreUrl;
      } else {
        storeUrl = await rl.question('ストアURLを入力してください: ');
      }
    } else {
      storeUrl = await rl.question(
        '\n📍 ストアURLを入力してください (例: https://your-store.myshopify.com): '
      );
    }

    // アクセストークン
    const envAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    let accessToken: string;

    if (envAccessToken) {
      console.log(`\n🔑 アクセストークン（環境変数から）: ${envAccessToken.substring(0, 10)}...`);
      const useEnvToken = await rl.question('このアクセストークンを使用しますか？ (y/n): ');

      if (useEnvToken.toLowerCase() === 'y') {
        accessToken = envAccessToken;
      } else {
        accessToken = await rl.question('アクセストークンを入力してください: ');
      }
    } else {
      accessToken = await rl.question('\n🔑 アクセストークンを入力してください: ');
    }

    // テンプレート選択
    console.log('\n📋 作成する注文のテンプレートを選択してください:');
    console.log('  1. 全13エリアの注文を作成');
    console.log('  2. 個別にエリアを選択');

    const templateChoice = await rl.question('\n選択 (1 or 2): ');

    let templates: string[];

    if (templateChoice === '2') {
      console.log('\n利用可能なエリア:');
      ALL_TEMPLATE_FILES.forEach((file, index) => {
        const fileKey = file.replace('.json', '');
        const areaName = AREA_NAME_MAP[fileKey];
        console.log(`  ${index + 1}. ${areaName} (${file})`);
      });

      const selection = await rl.question('\n作成するエリア番号をカンマ区切りで入力 (例: 1,3,5): ');
      const indices = selection.split(',').map(s => parseInt(s.trim()) - 1);
      templates = indices
        .filter(i => i >= 0 && i < ALL_TEMPLATE_FILES.length)
        .map(i => ALL_TEMPLATE_FILES[i]);

      if (templates.length === 0) {
        console.log('\n⚠️ 有効なエリアが選択されませんでした。全エリアを実行します。');
        templates = [...ALL_TEMPLATE_FILES];
      }
    } else {
      templates = [...ALL_TEMPLATE_FILES];
    }

    // 確認
    console.log('\n' + '='.repeat(60));
    console.log('📊 実行内容の確認');
    console.log('='.repeat(60));
    console.log(`ストアURL: ${storeUrl}`);
    console.log(`アクセストークン: ${accessToken.substring(0, 10)}...`);
    console.log(`作成する注文数: ${templates.length}件`);
    templates.forEach((file, index) => {
      const fileKey = file.replace('.json', '');
      const areaName = AREA_NAME_MAP[fileKey];
      console.log(`  ${index + 1}. ${areaName}`);
    });
    console.log('='.repeat(60));

    const confirm = await rl.question('\nこの内容で実行しますか？ (y/n): ');

    if (confirm.toLowerCase() !== 'y') {
      console.log('\n❌ キャンセルしました');
      process.exit(0);
    }

    return {
      storeUrl,
      accessToken,
      templates,
    };
  } finally {
    rl.close();
  }
}

async function createBulkOrders(
  storeUrl: string,
  accessToken: string,
  templates: string[]
): Promise<void> {
  console.log(
    '\n🚀 13配送元パターンの一括注文作成を開始します（v2: 100個アイテム + 配送元タグ + 統一住所）\n'
  );
  console.log(`📦 対象ストア: ${storeUrl}\n`);

  const results = {
    succeeded: [] as string[],
    failed: [] as string[],
  };

  for (let i = 0; i < templates.length; i++) {
    const templateFile = templates[i];
    const templatePath = path.join(__dirname, '../test-scenarios/consignor-area', templateFile);

    console.log(`\n[${i + 1}/${templates.length}] 📄 ${templateFile} を処理中...`);

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
      const result = await createShopifyOrder(storeUrl, accessToken, orderData);

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
    if (i < templates.length - 1) {
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

// メイン処理
async function main() {
  const config = await getInteractiveConfig();
  await createBulkOrders(config.storeUrl, config.accessToken, config.templates);
}

// スクリプトを実行
main()
  .then(() => {
    console.log('✨ 処理が完了しました');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  });
