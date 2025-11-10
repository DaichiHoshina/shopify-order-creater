/**
 * KubernetesConsignorRepository Unit Tests
 *
 * KubernetesClientをモックしたUnit Test
 */

import { KubernetesConsignorRepository } from './kubernetes-consignor.repository';
import { Consignor } from '../../domain/consignor/consignor.entity';
import { Shop } from '../../domain/shop/shop.entity';
import { ShopifyShopId } from '../../domain/shop/shopify-shop-id.value-object';
import { Location } from '../../domain/consignor/location.value-object';
import { PostalCode } from '../../domain/shared/postal-code.value-object';
import { Prefecture } from '../../domain/shared/prefecture.value-object';
import { PhoneNumber } from '../../domain/shared/phone-number.value-object';
import { IShopRepository } from '../../domain/shop/shop.repository';
import { KubernetesClient } from '../../cli/utils/kubernetes';

// KubernetesClientをモック
jest.mock('../../cli/utils/kubernetes');

describe('KubernetesConsignorRepository', () => {
  let repository: KubernetesConsignorRepository;
  let mockK8sClient: jest.Mocked<KubernetesClient>;
  let mockShopRepo: jest.Mocked<IShopRepository>;
  let testShop: Shop;
  let testConsignors: Consignor[];

  beforeEach(() => {
    // KubernetesClientのモックを作成
    mockK8sClient = {
      switchContext: jest.fn(),
      restoreContext: jest.fn(),
      ensureMySQLClientPod: jest.fn(),
      getDBCredentials: jest.fn(),
      execSQL: jest.fn(),
    } as any;

    // ShopRepositoryのモックを作成
    mockShopRepo = {
      findByName: jest.fn(),
      listAll: jest.fn(),
    } as any;

    repository = new KubernetesConsignorRepository(mockK8sClient, mockShopRepo);

    // テストデータ準備
    testShop = Shop.create({
      shopifyShopId: ShopifyShopId.from('test-shop.myshopify.com'),
      storeId: 123,
      environments: new Map([
        [
          'staging',
          {
            namespace: 'test-namespace',
            context: 'test-context',
            dbName: 'test_db',
            dbConfigMap: 'test-config',
            dbSecret: 'test-secret',
          },
        ],
      ]),
      credentials: {
        sagawaDetailId: 1,
        yamatoDetailId: 2,
        japanPostDetailId: 3,
      },
    });

    const testLocation = Location.create({
      area: 'test',
      name: 'テスト配送センター',
      postalCode: PostalCode.from('123-4567'),
      prefecture: Prefecture.from('東京都'),
      city: 'テスト市',
      address1: 'テスト1-2-3',
      address2: '',
      phone: PhoneNumber.from('03-1234-5678'),
    });

    testConsignors = [Consignor.createTestData(testShop, testLocation)];
  });

  describe('deploy', () => {
    it('should deploy consignors successfully', async () => {
      // Arrange
      mockK8sClient.ensureMySQLClientPod.mockResolvedValue('mysql-client-pod');
      mockK8sClient.getDBCredentials.mockResolvedValue({
        host: 'db.example.com',
        user: 'testuser',
        password: 'testpass',
        port: '3306',
        name: 'test_db',
      });
      mockK8sClient.execSQL.mockResolvedValue('Success');

      // Act
      const result = await repository.deploy(testConsignors, 'staging');

      // Assert
      expect(result.success).toBe(true);
      expect(result.insertedCount).toBe(1);
      expect(result.errorMessage).toBeUndefined();

      // KubernetesClientが正しく呼ばれたか確認
      expect(mockK8sClient.switchContext).toHaveBeenCalledWith('test-context');
      expect(mockK8sClient.ensureMySQLClientPod).toHaveBeenCalledWith('test-namespace');
      expect(mockK8sClient.getDBCredentials).toHaveBeenCalledWith(
        'test-namespace',
        'test-config',
        'test-secret'
      );
      expect(mockK8sClient.execSQL).toHaveBeenCalled();
      expect(mockK8sClient.restoreContext).toHaveBeenCalled();
    });

    it('should deploy multiple consignors', async () => {
      // Arrange
      const location2 = Location.create({
        area: 'test2',
        name: 'テスト配送センター2',
        postalCode: PostalCode.from('987-6543'),
        prefecture: Prefecture.from('大阪府'),
        city: 'テスト市2',
        address1: 'テスト9-8-7',
        address2: '',
        phone: PhoneNumber.from('06-9876-5432'),
      });

      const consignors = [
        Consignor.createTestData(testShop, testConsignors[0].getLocation()),
        Consignor.createTestData(testShop, location2),
      ];

      mockK8sClient.ensureMySQLClientPod.mockResolvedValue('mysql-client-pod');
      mockK8sClient.getDBCredentials.mockResolvedValue({
        host: 'db.example.com',
        user: 'testuser',
        password: 'testpass',
        port: '3306',
        name: 'test_db',
      });
      mockK8sClient.execSQL.mockResolvedValue('Success');

      // Act
      const result = await repository.deploy(consignors, 'staging');

      // Assert
      expect(result.success).toBe(true);
      expect(result.insertedCount).toBe(2);
    });

    it('should return error when SQL execution fails', async () => {
      // Arrange
      mockK8sClient.ensureMySQLClientPod.mockResolvedValue('mysql-client-pod');
      mockK8sClient.getDBCredentials.mockResolvedValue({
        host: 'db.example.com',
        user: 'testuser',
        password: 'testpass',
        port: '3306',
        name: 'test_db',
      });
      mockK8sClient.execSQL.mockRejectedValue(new Error('SQL execution failed'));

      // Act
      const result = await repository.deploy(testConsignors, 'staging');

      // Assert
      expect(result.success).toBe(false);
      expect(result.insertedCount).toBe(0);
      expect(result.errorMessage).toContain('SQL execution failed');

      // コンテキストは必ず復元される
      expect(mockK8sClient.restoreContext).toHaveBeenCalled();
    });

    it('should restore context even when error occurs', async () => {
      // Arrange
      mockK8sClient.switchContext.mockRejectedValue(new Error('Context switch failed'));

      // Act
      const result = await repository.deploy(testConsignors, 'staging');

      // Assert
      expect(result.success).toBe(false);
      expect(mockK8sClient.restoreContext).toHaveBeenCalled();
    });
  });

  describe('rollback', () => {
    it('should rollback consignors successfully', async () => {
      // Arrange
      mockShopRepo.findByName.mockResolvedValue(testShop);
      mockK8sClient.ensureMySQLClientPod.mockResolvedValue('mysql-client-pod');
      mockK8sClient.getDBCredentials.mockResolvedValue({
        host: 'db.example.com',
        user: 'testuser',
        password: 'testpass',
        port: '3306',
        name: 'test_db',
      });
      mockK8sClient.execSQL.mockResolvedValue('Success');

      // Act
      const result = await repository.rollback('test-shop.myshopify.com', 'staging');

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBeGreaterThan(0);
      expect(result.errorMessage).toBeUndefined();

      // Repositoryが正しく呼ばれたか確認
      expect(mockShopRepo.findByName).toHaveBeenCalledWith('test-shop');

      // KubernetesClientが正しく呼ばれたか確認
      expect(mockK8sClient.switchContext).toHaveBeenCalledWith('test-context');
      expect(mockK8sClient.execSQL).toHaveBeenCalled();
      const sqlArg = mockK8sClient.execSQL.mock.calls[0][0].sql;
      expect(sqlArg).toContain('DELETE FROM consignors');
      expect(sqlArg).toContain('test-shop.myshopify.com');
      expect(mockK8sClient.restoreContext).toHaveBeenCalled();
    });

    it('should return error when rollback fails', async () => {
      // Arrange
      mockShopRepo.findByName.mockResolvedValue(testShop);
      mockK8sClient.ensureMySQLClientPod.mockResolvedValue('mysql-client-pod');
      mockK8sClient.getDBCredentials.mockResolvedValue({
        host: 'db.example.com',
        user: 'testuser',
        password: 'testpass',
        port: '3306',
        name: 'test_db',
      });
      mockK8sClient.execSQL.mockRejectedValue(new Error('Rollback failed'));

      // Act
      const result = await repository.rollback('test-shop.myshopify.com', 'staging');

      // Assert
      expect(result.success).toBe(false);
      expect(result.deletedCount).toBe(0);
      expect(result.errorMessage).toContain('Rollback failed');

      // コンテキストは必ず復元される
      expect(mockK8sClient.restoreContext).toHaveBeenCalled();
    });
  });
});
