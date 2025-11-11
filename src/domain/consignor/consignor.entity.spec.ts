/**
 * Consignor Entity Tests
 * TDD: RED Phase
 */

import { Consignor } from './consignor.entity';
import { Shop } from '../shop/shop.entity';
import { ShopifyShopId } from '../shop/shopify-shop-id.value-object';
import { Location } from './location.value-object';
import { PostalCode } from '../shared/postal-code.value-object';
import { Prefecture } from '../shared/prefecture.value-object';
import { PhoneNumber } from '../shared/phone-number.value-object';
import { ApplicationStatus } from './application-status.value-object';

describe('Consignor Entity', () => {
  let testShop: Shop;
  let testLocation: Location;

  beforeEach(() => {
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

    testLocation = Location.create({
      area: 'hokkaido',
      name: '北海道配送センター',
      postalCode: PostalCode.from('060-8588'),
      prefecture: Prefecture.from('北海道'),
      city: '札幌市中央区',
      address1: '北3条西6丁目',
      address2: '',
      phone: PhoneNumber.from('011-231-4111'),
    });
  });

  describe('createTestData', () => {
    it('should create consignor with accepted status', () => {
      const consignor = Consignor.createTestData(testShop, testLocation);

      expect(consignor.canDeploy()).toBe(true);
      expect(consignor.getLocation()).toBe(testLocation);
      expect(consignor.getShop()).toBe(testShop);
    });

    it('should use shop credentials', () => {
      const consignor = Consignor.createTestData(testShop, testLocation);
      const sql = consignor.toSQL();

      expect(sql).toContain('556'); // sagawa_detail_id
      expect(sql).toContain('528'); // yamato_detail_id
      expect(sql).toContain('accepted');
    });
  });

  describe('createForProduction', () => {
    it('should create consignor with not_applied status', () => {
      const consignor = Consignor.createForProduction(testShop, testLocation);

      expect(consignor.canDeploy()).toBe(false);
    });

    it('should have zero credentials', () => {
      const consignor = Consignor.createForProduction(testShop, testLocation);
      const sql = consignor.toSQL();

      // detail_idが全て0であることを確認
      const lines = sql.split('\n');
      expect(lines.some(line => line.includes('japan_post_consignor_detail_id'))).toBe(true);
      expect(lines.some(line => line.trim() === '0,' && lines.indexOf(line) > 10)).toBe(true);
      expect(sql).toContain('not_applied');
    });
  });

  describe('canDeploy', () => {
    it('should return true for accepted status with credentials', () => {
      const consignor = Consignor.createTestData(testShop, testLocation);
      expect(consignor.canDeploy()).toBe(true);
    });

    it('should return false for not_applied status', () => {
      const consignor = Consignor.createForProduction(testShop, testLocation);
      expect(consignor.canDeploy()).toBe(false);
    });

    it('should return false for accepted status without credentials', () => {
      const shopWithoutCreds = Shop.create({
        shopifyShopId: ShopifyShopId.from('example.myshopify.com'),
        storeId: 100,
        environments: new Map(),
        credentials: {
          sagawaDetailId: 0,
          yamatoDetailId: 0,
          japanPostDetailId: 0,
        },
      });

      const consignor = Consignor.createTestData(shopWithoutCreds, testLocation);
      expect(consignor.canDeploy()).toBe(false);
    });
  });

  describe('toSQL', () => {
    it('should generate valid INSERT statement', () => {
      const consignor = Consignor.createTestData(testShop, testLocation);
      const sql = consignor.toSQL();

      expect(sql).toContain('INSERT INTO consignors');
      expect(sql).toContain('81-test-store-plan-silver.myshopify.com');
      expect(sql).toContain('404'); // store_id
      expect(sql).toContain('北海道配送センター');
      expect(sql).toContain('060-8588');
      expect(sql).toContain('北海道');
      expect(sql).toContain('札幌市中央区');
      expect(sql).toContain('accepted');
    });

    it('should handle empty address2', () => {
      const consignor = Consignor.createTestData(testShop, testLocation);
      const sql = consignor.toSQL();

      // buildingフィールドが空文字列であることを確認
      expect(sql).toContain('building');
      const lines = sql.split('\n');
      const buildingLineIndex = lines.findIndex(line => line.includes('building'));
      expect(buildingLineIndex).toBeGreaterThan(-1);
      // VALUESセクションでbuildingに対応する行が空文字列
      expect(lines.some(line => line.includes("''") && line.trim() === "'',")).toBe(true);
    });

    it('should handle non-empty address2', () => {
      const locationWithBuilding = Location.create({
        area: 'hokkaido',
        name: '北海道配送センター',
        postalCode: PostalCode.from('060-8588'),
        prefecture: Prefecture.from('北海道'),
        city: '札幌市中央区',
        address1: '北3条西6丁目',
        address2: 'テストビル3F',
        phone: PhoneNumber.from('011-231-4111'),
      });

      const consignor = Consignor.createTestData(testShop, locationWithBuilding);
      const sql = consignor.toSQL();

      expect(sql).toContain('テストビル3F');
    });
  });

  describe('getters', () => {
    it('should return shop', () => {
      const consignor = Consignor.createTestData(testShop, testLocation);
      expect(consignor.getShop()).toBe(testShop);
    });

    it('should return location', () => {
      const consignor = Consignor.createTestData(testShop, testLocation);
      expect(consignor.getLocation()).toBe(testLocation);
    });

    it('should return status', () => {
      const testConsignor = Consignor.createTestData(testShop, testLocation);
      const prodConsignor = Consignor.createForProduction(testShop, testLocation);

      expect(testConsignor.getStatus().isAccepted()).toBe(true);
      expect(prodConsignor.getStatus().isNotApplied()).toBe(true);
    });
  });
});
