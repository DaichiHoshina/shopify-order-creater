/**
 * DeployConsignor Use Case DTOs
 */

/**
 * Input DTO
 */
export interface DeployConsignorInput {
  /**
   * Shop名
   */
  shopName: string;

  /**
   * デプロイ先環境
   * - 'staging': ステージング環境
   * - 'production': 本番環境
   */
  environment: 'staging' | 'production';

  /**
   * テストデータモードかどうか
   * - true: application_status = 'accepted', Shopのcredentials使用
   * - false: application_status = 'not_applied', credentials = 0
   */
  isTestData: boolean;

  /**
   * デプロイ前の確認をスキップするか（デフォルト: false）
   */
  skipConfirmation?: boolean;
}

/**
 * Output DTO
 */
export interface DeployConsignorOutput {
  /**
   * デプロイ成功フラグ
   */
  success: boolean;

  /**
   * デプロイされたConsignor数
   */
  deployedCount: number;

  /**
   * デプロイ先環境
   */
  environment: string;

  /**
   * エラーメッセージ（失敗時）
   */
  errorMessage?: string;
}
