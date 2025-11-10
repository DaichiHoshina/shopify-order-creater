/**
 * Shop Repository Interface
 *
 * ドメイン層のインターフェース（依存関係逆転の原則）
 * 実装はInfrastructure層で行う
 */

import { Shop } from './shop.entity';

export interface IShopRepository {
  /**
   * Shop名からShopを取得
   * @param name Shop名（例: '81-test-store-plan-silver'）
   * @returns Shop entity
   * @throws Error if shop not found
   */
  findByName(name: string): Promise<Shop>;

  /**
   * 利用可能な全Shopの名前一覧を取得
   * @returns Shop名の配列
   */
  listAll(): Promise<string[]>;
}
