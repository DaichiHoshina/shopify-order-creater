/**
 * Shop Entity Tests
 * TDD: RED Phase
 */

import { Shop } from './shop.entity';
import { ShopifyShopId } from './shopify-shop-id.value-object';

describe('Shop Entity', () => {
  describe('create', () => {
    it('should create valid shop with all required fields', () => {
      const shop = Shop.create({
        shopifyShopId: ShopifyShopId.from('81-test-store-plan-silver.myshopify.com'),
        storeId: 404,
        environments: new Map([
          [
            'tes',
            {
              namespace: 'store',
              context: 'arn:aws:eks:ap-northeast-1:691177763108:cluster/shopifyshipping-tes-main',
              dbName: 'store_management',
              dbConfigMap: 'store-management-env',
              dbSecret: 'store-management-env',
            },
          ],
        ]),
        credentials: {
          sagawaDetailId: 556,
          yamatoDetailId: 528,
          japanPostDetailId: 0,
        },
      });

      expect(shop.getShopifyShopId().toString()).toBe('81-test-store-plan-silver.myshopify.com');
      expect(shop.getStoreId()).toBe(404);
    });

    it('should create shop with empty credentials', () => {
      const shop = Shop.create({
        shopifyShopId: ShopifyShopId.from('example.myshopify.com'),
        storeId: 100,
        environments: new Map(),
        credentials: {
          sagawaDetailId: 0,
          yamatoDetailId: 0,
          japanPostDetailId: 0,
        },
      });

      expect(shop.hasTestCredentials()).toBe(false);
    });

    it('should throw error for negative store ID', () => {
      expect(() =>
        Shop.create({
          shopifyShopId: ShopifyShopId.from('example.myshopify.com'),
          storeId: -1,
          environments: new Map(),
          credentials: { sagawaDetailId: 0, yamatoDetailId: 0, japanPostDetailId: 0 },
        })
      ).toThrow('Store ID must be a positive number');
    });

    it('should throw error for zero store ID', () => {
      expect(() =>
        Shop.create({
          shopifyShopId: ShopifyShopId.from('example.myshopify.com'),
          storeId: 0,
          environments: new Map(),
          credentials: { sagawaDetailId: 0, yamatoDetailId: 0, japanPostDetailId: 0 },
        })
      ).toThrow('Store ID must be a positive number');
    });
  });

  describe('getEnvironment', () => {
    it('should return environment by name', () => {
      const shop = Shop.create({
        shopifyShopId: ShopifyShopId.from('example.myshopify.com'),
        storeId: 100,
        environments: new Map([
          [
            'tes',
            {
              namespace: 'store',
              context: 'test-context',
              dbName: 'store_management',
              dbConfigMap: 'store-env',
              dbSecret: 'store-secret',
            },
          ],
        ]),
        credentials: { sagawaDetailId: 0, yamatoDetailId: 0, japanPostDetailId: 0 },
      });

      const env = shop.getEnvironment('tes');
      expect(env.namespace).toBe('store');
      expect(env.context).toBe('test-context');
    });

    it('should throw error for non-existent environment', () => {
      const shop = Shop.create({
        shopifyShopId: ShopifyShopId.from('example.myshopify.com'),
        storeId: 100,
        environments: new Map(),
        credentials: { sagawaDetailId: 0, yamatoDetailId: 0, japanPostDetailId: 0 },
      });

      expect(() => shop.getEnvironment('prod')).toThrow('Environment "prod" not found');
    });
  });

  describe('hasTestCredentials', () => {
    it('should return true if any carrier has credentials', () => {
      const shop = Shop.create({
        shopifyShopId: ShopifyShopId.from('example.myshopify.com'),
        storeId: 100,
        environments: new Map(),
        credentials: {
          sagawaDetailId: 556,
          yamatoDetailId: 0,
          japanPostDetailId: 0,
        },
      });

      expect(shop.hasTestCredentials()).toBe(true);
    });

    it('should return false if no credentials', () => {
      const shop = Shop.create({
        shopifyShopId: ShopifyShopId.from('example.myshopify.com'),
        storeId: 100,
        environments: new Map(),
        credentials: {
          sagawaDetailId: 0,
          yamatoDetailId: 0,
          japanPostDetailId: 0,
        },
      });

      expect(shop.hasTestCredentials()).toBe(false);
    });
  });

  describe('getCredentials', () => {
    it('should return credentials', () => {
      const shop = Shop.create({
        shopifyShopId: ShopifyShopId.from('example.myshopify.com'),
        storeId: 100,
        environments: new Map(),
        credentials: {
          sagawaDetailId: 556,
          yamatoDetailId: 528,
          japanPostDetailId: 100,
        },
      });

      const credentials = shop.getCredentials();
      expect(credentials.sagawaDetailId).toBe(556);
      expect(credentials.yamatoDetailId).toBe(528);
      expect(credentials.japanPostDetailId).toBe(100);
    });
  });

  describe('hasEnvironment', () => {
    it('should return true if environment exists', () => {
      const shop = Shop.create({
        shopifyShopId: ShopifyShopId.from('example.myshopify.com'),
        storeId: 100,
        environments: new Map([
          [
            'tes',
            {
              namespace: 'store',
              context: 'test-context',
              dbName: 'store_management',
              dbConfigMap: 'store-env',
              dbSecret: 'store-secret',
            },
          ],
        ]),
        credentials: { sagawaDetailId: 0, yamatoDetailId: 0, japanPostDetailId: 0 },
      });

      expect(shop.hasEnvironment('tes')).toBe(true);
      expect(shop.hasEnvironment('prod')).toBe(false);
    });
  });
});
