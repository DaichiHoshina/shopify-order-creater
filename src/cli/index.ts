#!/usr/bin/env node

/**
 * Plus Shipping CLI - メインエントリーポイント
 */

import { Command } from 'commander';
import { generateConsignorSQL, deployConsignor, rollbackConsignor } from './commands/consignor';
import { createOrders } from './commands/order';
import { showShopInfo } from './commands/shop';
import { listShops } from './utils/config';
import { logger } from './utils/logger';

const program = new Command();

program
  .name('ps-cli')
  .description('Plus Shipping 店舗管理CLI - 配送元管理、注文作成、Kubernetes連携')
  .version('1.0.0');

// ============================================
// 配送元関連コマンド
// ============================================

const consignorCommand = program
  .command('consignor')
  .description('配送元データ管理（SQL生成、デプロイ、ロールバック）');

// ps-cli consignor generate
consignorCommand
  .command('generate')
  .description('配送元SQL生成（13エリア）')
  .requiredOption('-s, --shop <shop>', 'Shop名（config/shops.yamlで定義）')
  .option('-t, --test-data', 'テストデータモード（application_status: accepted、既存detail_id使用）')
  .option('-o, --output <dir>', '出力ディレクトリ')
  .action(async (options) => {
    try {
      await generateConsignorSQL(options);
    } catch (error: any) {
      logger.error(`コマンド失敗: ${error.message}`);
      process.exit(1);
    }
  });

// ps-cli consignor deploy
consignorCommand
  .command('deploy')
  .description('配送元データをKubernetesクラスタにデプロイ')
  .requiredOption('-s, --shop <shop>', 'Shop名')
  .requiredOption('-e, --env <env>', '環境名（tes, stg, prd等）')
  .option('--dry-run', 'Dry-runモード（SQLのみ表示）')
  .action(async (options) => {
    try {
      await deployConsignor(options);
    } catch (error: any) {
      logger.error(`コマンド失敗: ${error.message}`);
      process.exit(1);
    }
  });

// ps-cli consignor rollback
consignorCommand
  .command('rollback')
  .description('配送元データをロールバック（削除）')
  .requiredOption('-s, --shop <shop>', 'Shop名')
  .requiredOption('-e, --env <env>', '環境名')
  .action(async (options) => {
    try {
      await rollbackConsignor(options);
    } catch (error: any) {
      logger.error(`コマンド失敗: ${error.message}`);
      process.exit(1);
    }
  });

// ============================================
// 注文作成関連コマンド
// ============================================

program
  .command('order-create')
  .description('Shopify注文を一括作成（13エリア対応）')
  .requiredOption('-s, --shop <shop>', 'Shop名')
  .option('-t, --access-token <token>', 'Shopifyアクセストークン（環境変数 SHOPIFY_ACCESS_TOKEN でも設定可）')
  .option('-a, --areas <areas...>', '作成するエリア（例: hokkaido-to-tokyo kanto-to-tokyo）')
  .option('--dry-run', 'Dry-runモード（実際には注文を作成しない）')
  .action(async (options) => {
    try {
      await createOrders(options);
    } catch (error: any) {
      logger.error(`コマンド失敗: ${error.message}`);
      process.exit(1);
    }
  });

// ============================================
// Shop情報管理コマンド
// ============================================

program
  .command('shops')
  .description('利用可能なShop一覧を表示')
  .action(() => {
    try {
      logger.title('📋 利用可能なShop一覧');
      const shops = listShops();
      shops.forEach((shop) => {
        console.log(`  - ${shop}`);
      });
    } catch (error: any) {
      logger.error(`コマンド失敗: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('shop-info')
  .description('Shop詳細情報を表示')
  .requiredOption('-s, --shop <shop>', 'Shop名')
  .action(async (options) => {
    try {
      await showShopInfo(options);
    } catch (error: any) {
      logger.error(`コマンド失敗: ${error.message}`);
      process.exit(1);
    }
  });

// ============================================
// グローバルエラーハンドリング
// ============================================

process.on('unhandledRejection', (reason: any) => {
  logger.error(`未処理のエラー: ${reason?.message || reason}`);
  process.exit(1);
});

// ============================================
// CLIを実行
// ============================================

program.parse(process.argv);

// 引数なしの場合はヘルプを表示
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
