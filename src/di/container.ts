/**
 * DI Container
 *
 * Factory Patternによる依存性注入コンテナ
 * すべての依存関係をここで解決する
 */

import { IShopRepository } from '../domain/shop/shop.repository';
import { ILocationRepository } from '../domain/consignor/location.repository';
import { ISQLFileRepository } from '../domain/consignor/sql-file.repository';
import { IConsignorRepository } from '../domain/consignor/consignor.repository';

import { YamlShopRepository } from '../infrastructure/shop/yaml-shop.repository';
import { JsonLocationRepository } from '../infrastructure/consignor/json-location.repository';
import { FileSystemSQLRepository } from '../infrastructure/consignor/file-system-sql.repository';
import { KubernetesConsignorRepository } from '../infrastructure/consignor/kubernetes-consignor.repository';

import { GenerateConsignorSQLUseCase } from '../application/consignor/generate-consignor-sql.usecase';
import { DeployConsignorUseCase } from '../application/consignor/deploy-consignor.usecase';

import { k8s } from '../cli/utils/kubernetes';

/**
 * DI Container
 *
 * Singleton パターンで依存関係を管理
 */
export class DIContainer {
  // Repository インスタンス（シングルトン）
  private static shopRepository: IShopRepository;
  private static locationRepository: ILocationRepository;
  private static sqlFileRepository: ISQLFileRepository;
  private static consignorRepository: IConsignorRepository;

  /**
   * ShopRepositoryを取得
   */
  static getShopRepository(): IShopRepository {
    if (!this.shopRepository) {
      this.shopRepository = new YamlShopRepository();
    }
    return this.shopRepository;
  }

  /**
   * LocationRepositoryを取得
   */
  static getLocationRepository(): ILocationRepository {
    if (!this.locationRepository) {
      this.locationRepository = new JsonLocationRepository();
    }
    return this.locationRepository;
  }

  /**
   * SQLFileRepositoryを取得
   */
  static getSQLFileRepository(): ISQLFileRepository {
    if (!this.sqlFileRepository) {
      this.sqlFileRepository = new FileSystemSQLRepository();
    }
    return this.sqlFileRepository;
  }

  /**
   * ConsignorRepositoryを取得
   */
  static getConsignorRepository(): IConsignorRepository {
    if (!this.consignorRepository) {
      this.consignorRepository = new KubernetesConsignorRepository(k8s, this.getShopRepository());
    }
    return this.consignorRepository;
  }

  /**
   * GenerateConsignorSQLUseCaseを取得
   */
  static getGenerateConsignorSQLUseCase(): GenerateConsignorSQLUseCase {
    return new GenerateConsignorSQLUseCase(
      this.getShopRepository(),
      this.getLocationRepository(),
      this.getSQLFileRepository()
    );
  }

  /**
   * DeployConsignorUseCaseを取得
   */
  static getDeployConsignorUseCase(): DeployConsignorUseCase {
    return new DeployConsignorUseCase(
      this.getShopRepository(),
      this.getLocationRepository(),
      this.getConsignorRepository()
    );
  }

  /**
   * テスト用：すべてのインスタンスをリセット
   */
  static reset(): void {
    this.shopRepository = null as any;
    this.locationRepository = null as any;
    this.sqlFileRepository = null as any;
    this.consignorRepository = null as any;
  }
}
