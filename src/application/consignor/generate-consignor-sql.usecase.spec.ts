/**
 * GenerateConsignorSQL Use Case Tests
 * TDD: RED Phase
 */

import { GenerateConsignorSQLUseCase } from './generate-consignor-sql.usecase';
import { IShopRepository } from '../../domain/shop/shop.repository';
import { ILocationRepository } from '../../domain/consignor/location.repository';
import { ISQLFileRepository } from '../../domain/consignor/sql-file.repository';
import { Shop } from '../../domain/shop/shop.entity';
import { ShopifyShopId } from '../../domain/shop/shopify-shop-id.value-object';
import { Location } from '../../domain/consignor/location.value-object';
import { PostalCode } from '../../domain/shared/postal-code.value-object';
import { Prefecture } from '../../domain/shared/prefecture.value-object';
import { PhoneNumber } from '../../domain/shared/phone-number.value-object';

describe('GenerateConsignorSQLUseCase', () => {
  let useCase: GenerateConsignorSQLUseCase;
  let mockShopRepo: jest.Mocked<IShopRepository>;
  let mockLocationRepo: jest.Mocked<ILocationRepository>;
  let mockSQLFileRepo: jest.Mocked<ISQLFileRepository>;

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

    mockSQLFileRepo = {
      save: jest.fn(),
    };

    useCase = new GenerateConsignorSQLUseCase(mockShopRepo, mockLocationRepo, mockSQLFileRepo);
  });

  describe('execute', () => {
    it('should generate test data SQL with accepted status', async () => {
      // Arrange
      mockShopRepo.findByName.mockResolvedValue(testShop);
      mockLocationRepo.findAll.mockResolvedValue(testLocations);
      mockSQLFileRepo.save.mockResolvedValue('/path/to/insert_test_consignors.sql');

      // Act
      const result = await useCase.execute({
        shopName: '81-test-store-plan-silver',
        isTestData: true,
      });

      // Assert
      expect(result.filepath).toBe('/path/to/insert_test_consignors.sql');
      expect(result.consignorCount).toBe(2);
      expect(result.applicationStatus).toBe('accepted');

      // リポジトリが正しく呼ばれたか確認
      expect(mockShopRepo.findByName).toHaveBeenCalledWith('81-test-store-plan-silver');
      expect(mockLocationRepo.findAll).toHaveBeenCalled();
      expect(mockSQLFileRepo.save).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO consignors'),
        'insert_test_consignors.sql',
        undefined
      );
    });

    it('should generate production SQL with not_applied status', async () => {
      // Arrange
      mockShopRepo.findByName.mockResolvedValue(testShop);
      mockLocationRepo.findAll.mockResolvedValue(testLocations);
      mockSQLFileRepo.save.mockResolvedValue('/path/to/insert_consignors.sql');

      // Act
      const result = await useCase.execute({
        shopName: '81-test-store-plan-silver',
        isTestData: false,
      });

      // Assert
      expect(result.filepath).toBe('/path/to/insert_consignors.sql');
      expect(result.consignorCount).toBe(2);
      expect(result.applicationStatus).toBe('not_applied');

      expect(mockSQLFileRepo.save).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO consignors'),
        'insert_consignors.sql',
        undefined
      );
    });

    it('should save SQL with custom output directory', async () => {
      // Arrange
      mockShopRepo.findByName.mockResolvedValue(testShop);
      mockLocationRepo.findAll.mockResolvedValue(testLocations);
      mockSQLFileRepo.save.mockResolvedValue('/custom/dir/insert_test_consignors.sql');

      // Act
      await useCase.execute({
        shopName: '81-test-store-plan-silver',
        isTestData: true,
        outputDir: '/custom/dir',
      });

      // Assert
      expect(mockSQLFileRepo.save).toHaveBeenCalledWith(
        expect.any(String),
        'insert_test_consignors.sql',
        '/custom/dir'
      );
    });

    it('should throw error if shop not found', async () => {
      // Arrange
      mockShopRepo.findByName.mockRejectedValue(new Error('Shop not found'));

      // Act & Assert
      await expect(
        useCase.execute({
          shopName: 'non-existent-shop',
          isTestData: true,
        })
      ).rejects.toThrow('Shop not found');
    });

    it('should generate SQL for all locations', async () => {
      // Arrange
      mockShopRepo.findByName.mockResolvedValue(testShop);
      mockLocationRepo.findAll.mockResolvedValue(testLocations);
      mockSQLFileRepo.save.mockResolvedValue('/path/to/sql');

      // Act
      await useCase.execute({
        shopName: '81-test-store-plan-silver',
        isTestData: true,
      });

      // Assert
      const savedSQL = mockSQLFileRepo.save.mock.calls[0][0];
      expect(savedSQL).toContain('北海道配送センター');
      expect(savedSQL).toContain('関東配送センター');
      // 2つのINSERT文が含まれる
      expect((savedSQL.match(/INSERT INTO consignors/g) || []).length).toBe(2);
    });
  });
});
