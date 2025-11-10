/**
 * Location Repository Interface
 *
 * ドメイン層のインターフェース（依存関係逆転の原則）
 * 実装はInfrastructure層で行う
 */

import { Location } from './location.value-object';

export interface ILocationRepository {
  /**
   * 全ての配送元Location（13エリア）を取得
   * @returns Location value objects array
   */
  findAll(): Promise<Location[]>;

  /**
   * エリアコードでLocationを取得
   * @param area エリアコード（例: 'hokkaido', 'kanto'）
   * @returns Location value object
   * @throws Error if not found
   */
  findByArea(area: string): Promise<Location>;
}
