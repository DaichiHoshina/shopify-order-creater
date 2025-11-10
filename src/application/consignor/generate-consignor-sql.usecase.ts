/**
 * GenerateConsignorSQL Use Case
 *
 * 配送元SQL生成のユースケース
 *
 * 処理フロー:
 * 1. Shopを取得
 * 2. 全Locationを取得（13エリア）
 * 3. Consignorエンティティを作成
 * 4. SQLを生成
 * 5. ファイルに保存
 */

import { IShopRepository } from '../../domain/shop/shop.repository';
import { ILocationRepository } from '../../domain/consignor/location.repository';
import { ISQLFileRepository } from '../../domain/consignor/sql-file.repository';
import { Consignor } from '../../domain/consignor/consignor.entity';
import {
  GenerateConsignorSQLInput,
  GenerateConsignorSQLOutput
} from './generate-consignor-sql.dto';

export class GenerateConsignorSQLUseCase {
  constructor(
    private readonly shopRepository: IShopRepository,
    private readonly locationRepository: ILocationRepository,
    private readonly sqlFileRepository: ISQLFileRepository
  ) {}

  async execute(input: GenerateConsignorSQLInput): Promise<GenerateConsignorSQLOutput> {
    // 1. Shopを取得
    const shop = await this.shopRepository.findByName(input.shopName);

    // 2. 全Locationを取得（13エリア）
    const locations = await this.locationRepository.findAll();

    // 3. Consignorエンティティを作成
    const consignors = locations.map(location => {
      return input.isTestData
        ? Consignor.createTestData(shop, location)
        : Consignor.createForProduction(shop, location);
    });

    // 4. SQLを生成
    const sqlStatements = consignors.map(consignor => consignor.toSQL());
    const sql = this.generateHeader(shop, input.isTestData) + sqlStatements.join('\n\n');

    // 5. ファイルに保存
    const filename = input.isTestData
      ? 'insert_test_consignors.sql'
      : 'insert_consignors.sql';

    const filepath = await this.sqlFileRepository.save(
      sql,
      filename,
      input.outputDir
    );

    // 6. 結果を返す
    return {
      filepath,
      consignorCount: consignors.length,
      applicationStatus: input.isTestData ? 'accepted' : 'not_applied'
    };
  }

  /**
   * SQLヘッダーコメントを生成
   */
  private generateHeader(shop: any, isTestData: boolean): string {
    const now = new Date().toLocaleString('ja-JP');

    let header = `-- Plus Shipping 配送元データ登録SQL（consignorsテーブル）\n`;
    header += `-- 生成日時: ${now}\n`;
    header += `-- Shopify Shop ID: ${shop.getShopifyShopId().toString()}\n`;
    header += `-- Store ID: ${shop.getStoreId()}\n`;

    if (isTestData) {
      header += `-- 用途: テストデータ\n`;
      header += `-- 注意: 既存のdetail_idを使い回しています\n`;
    }

    header += `\n`;

    return header;
  }
}
