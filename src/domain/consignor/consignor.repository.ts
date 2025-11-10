/**
 * Consignor Repository Interface
 *
 * ドメイン層のインターフェース（依存関係逆転の原則）
 * 実装はInfrastructure層で行う
 */

import { Consignor } from './consignor.entity';

export interface IConsignorRepository {
  /**
   * ConsignorデータをDBにデプロイ（INSERT）
   * @param consignors デプロイするConsignorエンティティの配列
   * @param environment デプロイ先環境（'staging', 'production'）
   * @returns デプロイ結果
   */
  deploy(consignors: Consignor[], environment: string): Promise<DeployResult>;

  /**
   * Consignorデータをロールバック（DELETE）
   * @param shopifyShopId 対象のShopify Shop ID
   * @param environment ロールバック対象環境
   * @returns ロールバック結果
   */
  rollback(shopifyShopId: string, environment: string): Promise<RollbackResult>;
}

/**
 * デプロイ結果
 */
export interface DeployResult {
  success: boolean;
  insertedCount: number;
  errorMessage?: string;
}

/**
 * ロールバック結果
 */
export interface RollbackResult {
  success: boolean;
  deletedCount: number;
  errorMessage?: string;
}
