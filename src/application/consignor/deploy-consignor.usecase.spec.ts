/**
 * DeployConsignor Use Case Tests
 * TDD: RED Phase
 */

import { DeployConsignorUseCase } from './deploy-consignor.usecase';
import { IShopRepository } from '../../domain/shop/shop.repository';
import { ILocationRepository } from '../../domain/consignor/location.repository';
import { IConsignorRepository, DeployResult } from '../../domain/consignor/consignor.repository';
import { Shop } from '../../domain/shop/shop.entity';
import { ShopifyShopId } from '../../domain/shop/shopify-shop-id.value-object';
import { Location } from '../../domain/consignor/location.value-object';
import { PostalCode } from '../../domain/shared/postal-code.value-object';
import { Prefecture } from '../../domain/shared/prefecture.value-object';
import { PhoneNumber } from '../../domain/shared/phone-number.value-object';

describe('DeployConsignorUseCase', () => {
  let useCase: DeployConsignorUseCase;
  let mockShopRepo: jest.Mocked<IShopRepository>;
  let mockLocationRepo: jest.Mocked<ILocationRepository>;
  let mockConsignorRepo: jest.Mocked<IConsignorRepository>;

  let testShop: Shop;
  let testLocations: Location[];

  beforeEach(() => {
    // テストデータ準備
    testShop = Shop.create({
      shopifyShopId: ShopifyShopId.from('81-test-store-plan-silver.myshopify.com'),
      storeId: 404,
      environments: new Map(),
      credentials: {
        sagawaDetailId: 556,
        yamatoDetailId: 528,
        japanPostDetailId: 0,
      },
    });

    testLocations = [
      Location.create({
        area: 'hokkaido',
        name: '北海道配送センター',
        postalCode: PostalCode.from('060-8588'),
        prefecture: Prefecture.from('北海道'),
        city: '札幌市中央区',
        address1: '北3条西6丁目',
        address2: '',
        phone: PhoneNumber.from('011-231-4111'),
      }),
      Location.create({
        area: 'kanto',
        name: '関東配送センター',
        postalCode: PostalCode.from('160-0023'),
        prefecture: Prefecture.from('東京都'),
        city: '新宿区',
        address1: '西新宿2-8-1',
        address2: '',
        phone: PhoneNumber.from('03-5321-1111'),
      }),
    ];

    // モック作成
    mockShopRepo = {
      findByName: jest.fn(),
      listAll: jest.fn(),
    };

    mockLocationRepo = {
      findAll: jest.fn(),
      findByArea: jest.fn(),
    };

    mockConsignorRepo = {
      deploy: jest.fn(),
      rollback: jest.fn(),
    };

    useCase = new DeployConsignorUseCase(mockShopRepo, mockLocationRepo, mockConsignorRepo);
  });

  describe('execute', () => {
    it('should deploy test data consignors to staging environment', async () => {
      // Arrange
      mockShopRepo.findByName.mockResolvedValue(testShop);
      mockLocationRepo.findAll.mockResolvedValue(testLocations);
      mockConsignorRepo.deploy.mockResolvedValue({
        success: true,
        insertedCount: 2,
      });

      // Act
      const result = await useCase.execute({
        shopName: '81-test-store-plan-silver',
        environment: 'staging',
        isTestData: true,
        skipConfirmation: true,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.deployedCount).toBe(2);
      expect(result.environment).toBe('staging');
      expect(result.errorMessage).toBeUndefined();

      // リポジトリが正しく呼ばれたか確認
      expect(mockShopRepo.findByName).toHaveBeenCalledWith('81-test-store-plan-silver');
      expect(mockLocationRepo.findAll).toHaveBeenCalled();
      expect(mockConsignorRepo.deploy).toHaveBeenCalledWith(expect.any(Array), 'staging');

      // デプロイされたConsignorの数を確認
      const deployCall = mockConsignorRepo.deploy.mock.calls[0];
      expect(deployCall[0]).toHaveLength(2);
    });

    it('should deploy production data consignors to production environment', async () => {
      // Arrange
      mockShopRepo.findByName.mockResolvedValue(testShop);
      mockLocationRepo.findAll.mockResolvedValue(testLocations);
      mockConsignorRepo.deploy.mockResolvedValue({
        success: true,
        insertedCount: 2,
      });

      // Act
      const result = await useCase.execute({
        shopName: '81-test-store-plan-silver',
        environment: 'production',
        isTestData: false,
        skipConfirmation: true,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.deployedCount).toBe(2);
      expect(result.environment).toBe('production');

      expect(mockConsignorRepo.deploy).toHaveBeenCalledWith(expect.any(Array), 'production');
    });

    it('should return error when deploy fails', async () => {
      // Arrange
      mockShopRepo.findByName.mockResolvedValue(testShop);
      mockLocationRepo.findAll.mockResolvedValue(testLocations);
      mockConsignorRepo.deploy.mockResolvedValue({
        success: false,
        insertedCount: 0,
        errorMessage: 'Database connection failed',
      });

      // Act
      const result = await useCase.execute({
        shopName: '81-test-store-plan-silver',
        environment: 'staging',
        isTestData: true,
        skipConfirmation: true,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.deployedCount).toBe(0);
      expect(result.errorMessage).toBe('Database connection failed');
    });

    it('should throw error if shop not found', async () => {
      // Arrange
      mockShopRepo.findByName.mockRejectedValue(new Error('Shop not found'));

      // Act & Assert
      await expect(
        useCase.execute({
          shopName: 'non-existent-shop',
          environment: 'staging',
          isTestData: true,
          skipConfirmation: true,
        })
      ).rejects.toThrow('Shop not found');
    });

    it('should create consignors for all locations', async () => {
      // Arrange
      mockShopRepo.findByName.mockResolvedValue(testShop);
      mockLocationRepo.findAll.mockResolvedValue(testLocations);
      mockConsignorRepo.deploy.mockResolvedValue({
        success: true,
        insertedCount: 2,
      });

      // Act
      await useCase.execute({
        shopName: '81-test-store-plan-silver',
        environment: 'staging',
        isTestData: true,
        skipConfirmation: true,
      });

      // Assert
      const deployCall = mockConsignorRepo.deploy.mock.calls[0];
      const consignors = deployCall[0];

      expect(consignors).toHaveLength(2);
      // 各Consignorが正しいLocationに対応しているか確認
      expect(consignors[0].getLocation().getName()).toBe('北海道配送センター');
      expect(consignors[1].getLocation().getName()).toBe('関東配送センター');
    });

    it('should create test data consignors with accepted status', async () => {
      // Arrange
      mockShopRepo.findByName.mockResolvedValue(testShop);
      mockLocationRepo.findAll.mockResolvedValue(testLocations);
      mockConsignorRepo.deploy.mockResolvedValue({
        success: true,
        insertedCount: 2,
      });

      // Act
      await useCase.execute({
        shopName: '81-test-store-plan-silver',
        environment: 'staging',
        isTestData: true,
        skipConfirmation: true,
      });

      // Assert
      const deployCall = mockConsignorRepo.deploy.mock.calls[0];
      const consignors = deployCall[0];

      // テストデータモードなので、全てのConsignorがacceptedステータス
      consignors.forEach(consignor => {
        expect(consignor.getStatus().isAccepted()).toBe(true);
      });
    });

    it('should create production consignors with not_applied status', async () => {
      // Arrange
      mockShopRepo.findByName.mockResolvedValue(testShop);
      mockLocationRepo.findAll.mockResolvedValue(testLocations);
      mockConsignorRepo.deploy.mockResolvedValue({
        success: true,
        insertedCount: 2,
      });

      // Act
      await useCase.execute({
        shopName: '81-test-store-plan-silver',
        environment: 'production',
        isTestData: false,
        skipConfirmation: true,
      });

      // Assert
      const deployCall = mockConsignorRepo.deploy.mock.calls[0];
      const consignors = deployCall[0];

      // 本番データモードなので、全てのConsignorがnot_appliedステータス
      consignors.forEach(consignor => {
        expect(consignor.getStatus().isAccepted()).toBe(false);
      });
    });
  });
});
