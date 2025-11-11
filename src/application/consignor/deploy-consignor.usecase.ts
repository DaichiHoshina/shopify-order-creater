/**
 * DeployConsignor Use Case
 *
 * Consignorデプロイのユースケース
 *
 * 処理フロー:
 * 1. Shopを取得
 * 2. 全Locationを取得（13エリア）
 * 3. Consignorエンティティを作成（テストデータ or 本番データ）
 * 4. Kubernetes DBにデプロイ
 * 5. 結果を返す
 */

import { IShopRepository } from '../../domain/shop/shop.repository';
import { ILocationRepository } from '../../domain/consignor/location.repository';
import { IConsignorRepository } from '../../domain/consignor/consignor.repository';
import { Consignor } from '../../domain/consignor/consignor.entity';
import { DeployConsignorInput, DeployConsignorOutput } from './deploy-consignor.dto';

export class DeployConsignorUseCase {
  constructor(
    private readonly shopRepository: IShopRepository,
    private readonly locationRepository: ILocationRepository,
    private readonly consignorRepository: IConsignorRepository
  ) {}

  async execute(input: DeployConsignorInput): Promise<DeployConsignorOutput> {
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

    // 4. Kubernetes DBにデプロイ
    const deployResult = await this.consignorRepository.deploy(consignors, input.environment);

    // 5. 結果を返す
    return {
      success: deployResult.success,
      deployedCount: deployResult.insertedCount,
      environment: input.environment,
      errorMessage: deployResult.errorMessage,
    };
  }
}
