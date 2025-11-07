#!/usr/bin/env node

/**
 * Shopify Order Creator CLI
 *
 * 環境変数からアクセストークンを取得し、Shopify APIで注文を作成するツール
 */

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createShopifyOrder, createCustomOrder, DEFAULT_ORDER } from './shopify';
import { CLIConfig, OrderCreateInput } from './types';

// .envファイルを読み込み
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * 環境変数から設定を取得
 */
function getConfigFromEnv(): CLIConfig {
  const shopifyStoreUrl = process.env.SHOPIFY_STORE_URL || '';
  const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN || '';

  return {
    shopifyStoreUrl,
    shopifyAccessToken,
  };
}

/**
 * メイン処理
 */
async function main() {
  const program = new Command();

  program
    .name('shopify-order-creator')
    .description('CLI tool to create Shopify orders')
    .version('1.0.0');

  // デフォルトコマンド: 注文作成
  program
    .command('create')
    .description('Create a Shopify order')
    .option('-s, --store <url>', 'Shopify store URL')
    .option('--show-default-order', 'Show default order data and exit')
    .action(async (options) => {
      try {
        // デフォルト注文データを表示して終了
        if (options.showDefaultOrder) {
          console.log('📦 Default Order Data:');
          console.log(JSON.stringify(DEFAULT_ORDER, null, 2));
          return;
        }

        // 設定を取得（環境変数 → コマンドオプションの順で優先）
        const envConfig = getConfigFromEnv();
        const config: CLIConfig = {
          shopifyStoreUrl: options.store || envConfig.shopifyStoreUrl,
          shopifyAccessToken: envConfig.shopifyAccessToken,
        };

        // 必須パラメータのチェック
        if (!config.shopifyAccessToken) {
          console.error('❌ SHOPIFY_ACCESS_TOKEN is required in .env');
          process.exit(1);
        }

        if (!config.shopifyStoreUrl) {
          console.error('❌ Shopify store URL is required. Set SHOPIFY_STORE_URL in .env or use --store option.');
          process.exit(1);
        }

        console.log('🚀 Starting Shopify Order Creator...\n');
        console.log('📋 Configuration:');
        console.log(`   Shopify Store: ${config.shopifyStoreUrl}\n`);

        // Shopify APIで注文を作成
        console.log('📊 Creating Shopify order...');
        await createShopifyOrder(config.shopifyStoreUrl, config.shopifyAccessToken);

        console.log('\n✨ All done! Order created successfully!');
      } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
      }
    });

  // カスタム注文作成コマンド
  program
    .command('create-custom')
    .description('Create a Shopify order with custom data from JSON file')
    .requiredOption('-f, --file <path>', 'Path to JSON file with order data')
    .option('-s, --store <url>', 'Shopify store URL')
    .action(async (options) => {
      try {
        const fs = await import('fs');
        const orderDataJson = fs.readFileSync(options.file, 'utf-8');
        const customOrderData = JSON.parse(orderDataJson) as Partial<OrderCreateInput>;

        // 設定を取得
        const envConfig = getConfigFromEnv();
        const config: CLIConfig = {
          shopifyStoreUrl: options.store || envConfig.shopifyStoreUrl,
          shopifyAccessToken: envConfig.shopifyAccessToken,
        };

        // 必須パラメータのチェック
        if (!config.shopifyAccessToken) {
          console.error('❌ SHOPIFY_ACCESS_TOKEN is required in .env');
          process.exit(1);
        }

        if (!config.shopifyStoreUrl) {
          console.error('❌ Shopify store URL is required');
          process.exit(1);
        }

        console.log('🚀 Starting Shopify Order Creator (Custom)...\n');

        // カスタムデータで注文を作成
        await createCustomOrder(config.shopifyStoreUrl, config.shopifyAccessToken, customOrderData);

        console.log('\n✨ All done! Custom order created successfully!');
      } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}

// エラーハンドリング
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
