/**
 * 注文作成関連コマンド
 */

import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import { loadShopConfig } from '../utils/config';
import { logger } from '../utils/logger';
import { createShopifyOrder } from '../../shopify';
import { extractOrderData } from '../../template-converter';

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
  'remote-island-to-tokyo': '離島'
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

interface CreateOrdersOptions {
  shop: string;
  accessToken?: string;
  areas?: string[];
  dryRun?: boolean;
}

/**
 * Shopify注文を一括作成するコマンド
 */
export async function createOrders(options: CreateOrdersOptions): Promise<void> {
  try {
    logger.title('📦 Plus Shipping 一括注文作成');

    // Shop設定を読み込み
    const shopConfig = loadShopConfig(options.shop);
    const storeUrl = `https://${shopConfig.shopify_shop_id}`;

    logger.success(`Shop: ${shopConfig.shopify_shop_id}`);
    logger.info(`Store ID: ${shopConfig.store_id}`);

    // アクセストークン確認
    const accessToken = options.accessToken || process.env.SHOPIFY_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('アクセストークンが設定されていません。--access-token オプションまたは SHOPIFY_ACCESS_TOKEN 環境変数を設定してください。');
    }

    logger.info(`アクセストークン: ${accessToken.substring(0, 10)}...`);

    // テンプレート選択
    let templates: string[];

    if (options.areas && options.areas.length > 0) {
      // コマンドラインで指定されたエリア
      templates = options.areas.map(area => {
        const templateFile = `${area}.json`;
        if (!ALL_TEMPLATE_FILES.includes(templateFile)) {
          throw new Error(`無効なエリア: ${area}`);
        }
        return templateFile;
      });
    } else {
      // 対話式でエリアを選択
      const { createAll } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createAll',
          message: '全13エリアの注文を作成しますか？',
          default: true,
        },
      ]);

      if (createAll) {
        templates = [...ALL_TEMPLATE_FILES];
      } else {
        const { selectedAreas } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedAreas',
            message: '作成するエリアを選択してください:',
            choices: ALL_TEMPLATE_FILES.map(file => {
              const fileKey = file.replace('.json', '');
              const areaName = AREA_NAME_MAP[fileKey];
              return {
                name: `${areaName} (${file})`,
                value: file,
              };
            }),
          },
        ]);

        if (!selectedAreas || selectedAreas.length === 0) {
          logger.warning('エリアが選択されませんでした');
          return;
        }

        templates = selectedAreas;
      }
    }

    // 確認
    logger.section('📊 実行内容の確認');
    logger.log(`ストアURL: ${storeUrl}`);
    logger.log(`作成する注文数: ${templates.length}件`);
    templates.forEach((file, index) => {
      const fileKey = file.replace('.json', '');
      const areaName = AREA_NAME_MAP[fileKey];
      logger.log(`  ${index + 1}. ${areaName}`);
    });

    if (!options.dryRun) {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'この設定で注文を作成しますか？',
          default: false,
        },
      ]);

      if (!confirmed) {
        logger.warning('注文作成をキャンセルしました');
        return;
      }
    }

    if (options.dryRun) {
      logger.info('Dry-runモード: 実際には注文を作成しません');
      logger.success('Dry-run完了');
      return;
    }

    // 注文作成
    logger.section('🚀 注文作成開始');

    const results = {
      succeeded: [] as string[],
      failed: [] as string[]
    };

    for (let i = 0; i < templates.length; i++) {
      const templateFile = templates[i];
      const templatePath = path.join(__dirname, '../../../test-scenarios/consignor-area', templateFile);

      const fileKey = templateFile.replace('.json', '');
      const areaName = AREA_NAME_MAP[fileKey];

      logger.log(`\n[${i + 1}/${templates.length}] ${areaName} を処理中...`);

      try {
        // テンプレートファイルを読み込み
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        const template: OrderTemplate = JSON.parse(templateContent);

        logger.info(`  アイテム数: ${template.order.line_items[0]?.quantity || 0}個`);
        logger.info(`  配送元: ${template.shipping_metadata.consignor_prefecture} ${template.shipping_metadata.consignor_city}`);
        logger.info(`  配送先: ${template.order.shipping_address.province} ${template.order.shipping_address.city}`);

        // テンプレートデータをShopify API形式に変換
        const orderData = extractOrderData(template);

        // Shopify注文を作成
        logger.startSpinner('Shopify注文を作成中...');
        const result = await createShopifyOrder(
          storeUrl,
          accessToken,
          orderData
        );

        const orderId = result.data?.orderCreate?.order?.id || 'N/A';
        logger.succeedSpinner(`成功: 注文ID ${orderId}`);
        results.succeeded.push(areaName);

      } catch (error) {
        logger.failSpinner(`失敗: ${areaName}`);
        if (error instanceof Error) {
          logger.error(`  エラー: ${error.message}`);
        }
        results.failed.push(`${areaName} - ${error instanceof Error ? error.message : String(error)}`);
      }

      // API レート制限を考慮して10秒待機（最後の注文以外）
      if (i < templates.length - 1) {
        logger.info('  10秒待機中...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // 最終結果を表示
    logger.section('📊 一括注文作成の結果');
    logger.success(`成功: ${results.succeeded.length}件`);
    results.succeeded.forEach(name => {
      logger.log(`  - ${name}`);
    });

    if (results.failed.length > 0) {
      logger.error(`失敗: ${results.failed.length}件`);
      results.failed.forEach(msg => {
        logger.log(`  - ${msg}`);
      });
    } else {
      logger.success('全ての注文が正常に作成されました！');
    }

  } catch (error: any) {
    logger.error(`エラー: ${error.message}`);
    throw error;
  }
}
