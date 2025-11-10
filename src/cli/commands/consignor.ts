/**
 * 配送元関連コマンド（新アーキテクチャ版）
 *
 * Clean Architecture + DDD + TDDで実装
 * Use Caseを経由してビジネスロジックを実行
 */

import inquirer from 'inquirer';
import { ConsignorSQLOptions, DeployOptions } from '../../types/index';
import { logger } from '../utils/logger';
import { DIContainer } from '../../di/container';

/**
 * 配送元SQL生成コマンド
 */
export async function generateConsignorSQL(options: ConsignorSQLOptions): Promise<void> {
  try {
    logger.title('📦 Plus Shipping 配送元SQL生成');

    // Use Caseを取得
    const useCase = DIContainer.getGenerateConsignorSQLUseCase();

    // Use Caseを実行
    const result = await useCase.execute({
      shopName: options.shop,
      isTestData: options.testData || false,
      outputDir: options.output,
    });

    logger.success(`SQLファイルを生成しました: ${result.filepath}`);

    if (options.testData) {
      logger.warning(
        'テストデータモード: 既存のdetail_idを使用しています（本番では各エリアごとに配送業者との契約が必要です）'
      );
    }

    logger.section('📊 生成内容');
    logger.log(`  - 配送元数: ${result.consignorCount}エリア`);
    logger.log(`  - application_status: ${result.applicationStatus}`);
    logger.log(`  - 出力先: ${result.filepath}`);
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

    logger.info(`Shop: ${options.shop}`);
    logger.info(`環境: ${options.env}`);

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

    // Dry-runモードの場合
    if (options.dryRun) {
      logger.info('Dry-runモード: SQLを生成して表示します');

      // SQL生成UseCaseを使用
      const sqlUseCase = DIContainer.getGenerateConsignorSQLUseCase();
      const sqlResult = await sqlUseCase.execute({
        shopName: options.shop,
        isTestData: true,
      });

      logger.success('SQL生成完了（Dry-run）');
      logger.info(`生成場所: ${sqlResult.filepath}`);
      return;
    }

    // 環境名をマッピング（tes/stg/prod -> staging/production）
    const environmentMap: { [key: string]: 'staging' | 'production' } = {
      'tes': 'staging',
      'stg': 'staging',
      'staging': 'staging',
      'prod': 'production',
      'prd': 'production',
      'production': 'production',
    };

    const mappedEnv = environmentMap[options.env];
    if (!mappedEnv) {
      throw new Error(`不明な環境: ${options.env}`);
    }

    // Use Caseを取得
    const useCase = DIContainer.getDeployConsignorUseCase();

    // Use Caseを実行
    logger.startSpinner('デプロイ中...');

    const result = await useCase.execute({
      shopName: options.shop,
      environment: mappedEnv,
      isTestData: true,
      skipConfirmation: true,
    });

    if (result.success) {
      logger.succeedSpinner('デプロイ完了');
      logger.success(`${result.deployedCount}エリアの配送元データを登録しました`);
    } else {
      logger.failSpinner('デプロイ失敗');
      logger.error(`エラー: ${result.errorMessage}`);
      throw new Error(result.errorMessage);
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

    logger.warning('⚠️  13エリアの配送元データを削除します');
    logger.info(`Shop: ${options.shop}`);
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

    // 環境名をマッピング（tes/stg/prod -> staging/production）
    const environmentMap: { [key: string]: 'staging' | 'production' } = {
      'tes': 'staging',
      'stg': 'staging',
      'staging': 'staging',
      'prod': 'production',
      'prd': 'production',
      'production': 'production',
    };

    const mappedEnv = environmentMap[options.env];
    if (!mappedEnv) {
      throw new Error(`不明な環境: ${options.env}`);
    }

    // Use Caseを取得（ConsignorRepositoryを直接使用）
    const consignorRepo = DIContainer.getConsignorRepository();

    // ロールバックを実行
    logger.startSpinner('削除中...');

    const result = await consignorRepo.rollback(
      `${options.shop}.myshopify.com`,
      mappedEnv
    );

    if (result.success) {
      logger.succeedSpinner('削除完了');
      logger.success(`ロールバック完了！（${result.deletedCount}件削除）`);
    } else {
      logger.failSpinner('削除失敗');
      logger.error(`エラー: ${result.errorMessage}`);
      throw new Error(result.errorMessage);
    }
  } catch (error: any) {
    logger.error(`エラー: ${error.message}`);
    throw error;
  }
}
