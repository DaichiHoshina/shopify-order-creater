/**
 * GenerateConsignorSQL Use Case DTOs
 */

/**
 * Input DTO
 */
export interface GenerateConsignorSQLInput {
  /**
   * Shop名
   */
  shopName: string;

  /**
   * テストデータモードかどうか
   * - true: application_status = 'accepted', Shopのcredentials使用
   * - false: application_status = 'not_applied', credentials = 0
   */
  isTestData: boolean;

  /**
   * 出力ディレクトリ（オプション）
   */
  outputDir?: string;
}

/**
 * Output DTO
 */
export interface GenerateConsignorSQLOutput {
  /**
   * 生成されたSQLファイルのパス
   */
  filepath: string;

  /**
   * 生成されたConsignor数（通常13エリア）
   */
  consignorCount: number;

  /**
   * 申請ステータス
   */
  applicationStatus: 'accepted' | 'not_applied';
}
