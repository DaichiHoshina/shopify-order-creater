/**
 * ShopifyShopId Value Object Tests
 * TDD: RED Phase
 */

import { ShopifyShopId } from './shopify-shop-id.value-object';

describe('ShopifyShopId', () => {
  describe('from', () => {
    it('should create valid Shopify Shop ID', () => {
      const shopId = ShopifyShopId.from('81-test-store-plan-silver.myshopify.com');
      expect(shopId.toString()).toBe('81-test-store-plan-silver.myshopify.com');
    });

    it('should create valid Shopify Shop ID with simple name', () => {
      const shopId = ShopifyShopId.from('example-store.myshopify.com');
      expect(shopId.toString()).toBe('example-store.myshopify.com');
    });

    it('should throw error if not ending with .myshopify.com', () => {
      expect(() => ShopifyShopId.from('example-store.com')).toThrow('Invalid Shopify Shop ID');
    });

    it('should throw error for empty string', () => {
      expect(() => ShopifyShopId.from('')).toThrow('Invalid Shopify Shop ID');
    });

    it('should throw error for only .myshopify.com', () => {
      expect(() => ShopifyShopId.from('.myshopify.com')).toThrow('Invalid Shopify Shop ID');
    });

    it('should throw error for invalid characters', () => {
      expect(() => ShopifyShopId.from('invalid_store.myshopify.com')).toThrow(
        'Invalid Shopify Shop ID'
      );
    });

    it('should allow numbers in shop name', () => {
      const shopId = ShopifyShopId.from('store123.myshopify.com');
      expect(shopId.toString()).toBe('store123.myshopify.com');
    });

    it('should allow hyphens in shop name', () => {
      const shopId = ShopifyShopId.from('my-awesome-store.myshopify.com');
      expect(shopId.toString()).toBe('my-awesome-store.myshopify.com');
    });
  });

  describe('equals', () => {
    it('should return true for same Shop ID', () => {
      const shopId1 = ShopifyShopId.from('81-test-store-plan-silver.myshopify.com');
      const shopId2 = ShopifyShopId.from('81-test-store-plan-silver.myshopify.com');
      expect(shopId1.equals(shopId2)).toBe(true);
    });

    it('should return false for different Shop IDs', () => {
      const shopId1 = ShopifyShopId.from('81-test-store-plan-silver.myshopify.com');
      const shopId2 = ShopifyShopId.from('example-store.myshopify.com');
      expect(shopId1.equals(shopId2)).toBe(false);
    });
  });

  describe('getShopName', () => {
    it('should extract shop name without .myshopify.com', () => {
      const shopId = ShopifyShopId.from('81-test-store-plan-silver.myshopify.com');
      expect(shopId.getShopName()).toBe('81-test-store-plan-silver');
    });

    it('should extract simple shop name', () => {
      const shopId = ShopifyShopId.from('example.myshopify.com');
      expect(shopId.getShopName()).toBe('example');
    });
  });

  describe('getStoreUrl', () => {
    it('should return full HTTPS URL', () => {
      const shopId = ShopifyShopId.from('81-test-store-plan-silver.myshopify.com');
      expect(shopId.getStoreUrl()).toBe('https://81-test-store-plan-silver.myshopify.com');
    });
  });
});
