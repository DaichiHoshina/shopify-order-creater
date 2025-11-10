/**
 * YamlShopRepository Integration Tests
 *
 * 実際のshops.yamlファイルを使ったIntegration Test
 */

import { YamlShopRepository } from './yaml-shop.repository';

describe('YamlShopRepository', () => {
  let repository: YamlShopRepository;

  beforeEach(() => {
    repository = new YamlShopRepository();
  });

  describe('findByName', () => {
    it('should find shop by name', async () => {
      // Act
      const shop = await repository.findByName('81-test-store-plan-silver');

      // Assert
      expect(shop.getShopifyShopId().toString()).toBe('81-test-store-plan-silver.myshopify.com');
      expect(shop.getStoreId()).toBe(404);
    });

    it('should load shop with credentials', async () => {
      // Act
      const shop = await repository.findByName('81-test-store-plan-silver');

      // Assert
      expect(shop.hasTestCredentials()).toBe(true);

      const credentials = shop.getCredentials();
      expect(credentials.sagawaDetailId).toBe(556);
      expect(credentials.yamatoDetailId).toBe(528);
      expect(credentials.japanPostDetailId).toBe(0);
    });

    it('should load shop with environments', async () => {
      // Act
      const shop = await repository.findByName('81-test-store-plan-silver');

      // Assert
      expect(shop.hasEnvironment('tes')).toBe(true);

      const env = shop.getEnvironment('tes');
      expect(env.namespace).toBe('store');
      expect(env.context).toContain('shopifyshipping-tes-main');
      expect(env.dbName).toBe('store_management');
      expect(env.dbConfigMap).toBe('store-management-env');
      expect(env.dbSecret).toBe('store-management-env');
    });

    it('should throw error for non-existent shop', async () => {
      // Act & Assert
      await expect(repository.findByName('non-existent-shop')).rejects.toThrow(
        'Shop "non-existent-shop" not found'
      );
    });

    it('should throw error for empty shop name', async () => {
      // Act & Assert
      await expect(repository.findByName('')).rejects.toThrow('Shop "" not found');
    });
  });

  describe('listAll', () => {
    it('should list all shop names', async () => {
      // Act
      const shopNames = await repository.listAll();

      // Assert
      expect(shopNames).toContain('81-test-store-plan-silver');
      expect(shopNames.length).toBeGreaterThanOrEqual(1);
    });

    it('should return array of strings', async () => {
      // Act
      const shopNames = await repository.listAll();

      // Assert
      shopNames.forEach(name => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      });
    });
  });
});
