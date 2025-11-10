/**
 * 配送元関連コマンド
 */

import * as fs from 'fs';
import inquirer from 'inquirer';
import { ConsignorSQLOptions, DeployOptions } from '../../types/index';
import { loadShopConfig } from '../utils/config';
import { logger } from '../utils/logger';
import { k8s } from '../utils/kubernetes';
import { ConsignorSQLGenerator } from '../../generators/consignor-sql';

/**
 * 配送元SQL生成コマンド
 */
export async function generateConsignorSQL(options: ConsignorSQLOptions): Promise<void> {
  try {
    logger.title('📦 Plus Shipping 配送元SQL生成');

    // Shop設定を読み込み
    const shopConfig = loadShopConfig(options.shop);
    logger.success(`Shop: ${shopConfig.shopify_shop_id}`);
    logger.info(`Store ID: ${shopConfig.store_id}`);

    // SQL生成
    const generator = new ConsignorSQLGenerator();
    const sql = generator.generateInsertSQL(shopConfig, options.testData || false);

    // ファイルに保存
    const filename = options.testData ? 'insert_test_consignors.sql' : 'insert_consignors.sql';
    const filepath = generator.saveToFile(sql, filename, options.output);

    logger.success(`SQLファイルを生成しました: ${filepath}`);

    if (options.testData) {
      logger.warning(
        'テストデータモード: 既存のdetail_idを使用しています（本番では各エリアごとに配送業者との契約が必要です）'
      );
    }

    logger.section('📊 生成内容');
    logger.log(`  - 配送元数: 13エリア`);
    logger.log(`  - application_status: ${options.testData ? 'accepted' : 'not_applied'}`);
    logger.log(`  - 出力先: ${filepath}`);
  } catch (error: any) {
    logger.error(`エラー: ${error.message}`);
    throw error;
  }
}

/**
 * 配送元データをデプロイするコマンド
 */
export async function deployConsignor(options: DeployOptions): Promise<void> {
  try {
    logger.title('🚀 Plus Shipping 配送元データデプロイ');

    // Shop設定を読み込み
    const shopConfig = loadShopConfig(options.shop);
    const envConfig = shopConfig.environments[options.env];

    if (!envConfig) {
      throw new Error(`環境 "${options.env}" が設定されていません`);
    }

    logger.info(`Shop: ${shopConfig.shopify_shop_id}`);
    logger.info(`環境: ${options.env}`);
    logger.info(`Namespace: ${envConfig.namespace}`);

    // 確認
    if (!options.dryRun) {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'この設定でデプロイしますか？',
          default: false,
        },
      ]);

      if (!confirmed) {
        logger.warning('デプロイをキャンセルしました');
        return;
      }
    }

    // Kubernetesコンテキストを切り替え
    await k8s.switchContext(envConfig.context);

    try {
      // MySQLクライアントPodを確保
      const podName = await k8s.ensureMySQLClientPod(envConfig.namespace);

      // DB接続情報を取得
      const dbCreds = await k8s.getDBCredentials(
        envConfig.namespace,
        envConfig.db_config_map,
        envConfig.db_secret
      );

      logger.info(`DB: ${dbCreds.host}/${dbCreds.name}`);

      // SQLを生成
      const generator = new ConsignorSQLGenerator();
      const sql = generator.generateInsertSQL(shopConfig, true); // テストデータモード

      if (options.dryRun) {
        logger.info('Dry-runモード: SQLを表示します');
        console.log('\n' + sql);
        logger.success('Dry-run完了');
        return;
      }

      // SQLを実行
      logger.startSpinner('SQLを実行中...');

      await k8s.execSQL({
        namespace: envConfig.namespace,
        podName,
        dbHost: dbCreds.host,
        dbUser: dbCreds.user,
        dbPassword: dbCreds.password,
        dbName: dbCreds.name,
        sql,
      });

      logger.succeedSpinner('SQL実行完了');

      // 確認クエリを実行
      logger.section('📊 登録データを確認');

      const verifySQL = `
        SELECT location_name, prefecture, application_status_yamato
        FROM consignors
        WHERE shopify_shop_id = '${shopConfig.shopify_shop_id}'
        ORDER BY id;
      `;

      const result = await k8s.execSQL({
        namespace: envConfig.namespace,
        podName,
        dbHost: dbCreds.host,
        dbUser: dbCreds.user,
        dbPassword: dbCreds.password,
        dbName: dbCreds.name,
        sql: verifySQL,
      });

      console.log(result);

      logger.success('デプロイ完了！');
    } finally {
      // 元のコンテキストに戻す
      await k8s.restoreContext();
    }
  } catch (error: any) {
    logger.error(`エラー: ${error.message}`);
    throw error;
  }
}

/**
 * 配送元データを削除するコマンド（ロールバック用）
 */
export async function rollbackConsignor(options: DeployOptions): Promise<void> {
  try {
    logger.title('↩️  Plus Shipping 配送元データロールバック');

    // Shop設定を読み込み
    const shopConfig = loadShopConfig(options.shop);
    const envConfig = shopConfig.environments[options.env];

    if (!envConfig) {
      throw new Error(`環境 "${options.env}" が設定されていません`);
    }

    logger.warning('⚠️  13エリアの配送元データを削除します');
    logger.info(`Shop: ${shopConfig.shopify_shop_id}`);
    logger.info(`環境: ${options.env}`);

    // 確認
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: '本当に削除しますか？',
        default: false,
      },
    ]);

    if (!confirmed) {
      logger.warning('ロールバックをキャンセルしました');
      return;
    }

    // Kubernetesコンテキストを切り替え
    await k8s.switchContext(envConfig.context);

    try {
      // MySQLクライアントPodを確保
      const podName = await k8s.ensureMySQLClientPod(envConfig.namespace);

      // DB接続情報を取得
      const dbCreds = await k8s.getDBCredentials(
        envConfig.namespace,
        envConfig.db_config_map,
        envConfig.db_secret
      );

      // DELETE SQLを生成
      const generator = new ConsignorSQLGenerator();
      const sql = generator.generateDeleteSQL(shopConfig);

      // SQLを実行
      logger.startSpinner('削除中...');

      await k8s.execSQL({
        namespace: envConfig.namespace,
        podName,
        dbHost: dbCreds.host,
        dbUser: dbCreds.user,
        dbPassword: dbCreds.password,
        dbName: dbCreds.name,
        sql,
      });

      logger.succeedSpinner('削除完了');
      logger.success('ロールバック完了！');
    } finally {
      // 元のコンテキストに戻す
      await k8s.restoreContext();
    }
  } catch (error: any) {
    logger.error(`エラー: ${error.message}`);
    throw error;
  }
}
