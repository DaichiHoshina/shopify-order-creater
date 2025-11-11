/**
 * Location Value Object Tests
 * TDD: RED Phase
 */

import { Location } from './location.value-object';
import { PostalCode } from '../shared/postal-code.value-object';
import { Prefecture } from '../shared/prefecture.value-object';
import { PhoneNumber } from '../shared/phone-number.value-object';

describe('Location', () => {
  describe('create', () => {
    it('should create valid location with all required fields', () => {
      const location = Location.create({
        area: 'hokkaido',
        name: '北海道配送センター',
        postalCode: PostalCode.from('060-8588'),
        prefecture: Prefecture.from('北海道'),
        city: '札幌市中央区',
        address1: '北3条西6丁目',
        address2: '',
        phone: PhoneNumber.from('011-231-4111'),
      });

      expect(location.getName()).toBe('北海道配送センター');
      expect(location.getArea()).toBe('hokkaido');
      expect(location.getCity()).toBe('札幌市中央区');
    });

    it('should throw error if name does not include 配送センター', () => {
      expect(() =>
        Location.create({
          area: 'hokkaido',
          name: '北海道倉庫',
          postalCode: PostalCode.from('060-8588'),
          prefecture: Prefecture.from('北海道'),
          city: '札幌市中央区',
          address1: '北3条西6丁目',
          address2: '',
          phone: PhoneNumber.from('011-231-4111'),
        })
      ).toThrow('Location name must include 配送センター');
    });

    it('should throw error for empty name', () => {
      expect(() =>
        Location.create({
          area: 'hokkaido',
          name: '',
          postalCode: PostalCode.from('060-8588'),
          prefecture: Prefecture.from('北海道'),
          city: '札幌市中央区',
          address1: '北3条西6丁目',
          address2: '',
          phone: PhoneNumber.from('011-231-4111'),
        })
      ).toThrow('Location name must not be empty');
    });

    it('should throw error for empty city', () => {
      expect(() =>
        Location.create({
          area: 'hokkaido',
          name: '北海道配送センター',
          postalCode: PostalCode.from('060-8588'),
          prefecture: Prefecture.from('北海道'),
          city: '',
          address1: '北3条西6丁目',
          address2: '',
          phone: PhoneNumber.from('011-231-4111'),
        })
      ).toThrow('City must not be empty');
    });

    it('should throw error for empty address1', () => {
      expect(() =>
        Location.create({
          area: 'hokkaido',
          name: '北海道配送センター',
          postalCode: PostalCode.from('060-8588'),
          prefecture: Prefecture.from('北海道'),
          city: '札幌市中央区',
          address1: '',
          address2: '',
          phone: PhoneNumber.from('011-231-4111'),
        })
      ).toThrow('Address1 must not be empty');
    });

    it('should allow empty address2', () => {
      const location = Location.create({
        area: 'hokkaido',
        name: '北海道配送センター',
        postalCode: PostalCode.from('060-8588'),
        prefecture: Prefecture.from('北海道'),
        city: '札幌市中央区',
        address1: '北3条西6丁目',
        address2: '',
        phone: PhoneNumber.from('011-231-4111'),
      });

      expect(location.getAddress2()).toBe('');
    });
  });

  describe('equals', () => {
    it('should return true for locations with same postal code and prefecture', () => {
      const location1 = Location.create({
        area: 'hokkaido',
        name: '北海道配送センター',
        postalCode: PostalCode.from('060-8588'),
        prefecture: Prefecture.from('北海道'),
        city: '札幌市中央区',
        address1: '北3条西6丁目',
        address2: '',
        phone: PhoneNumber.from('011-231-4111'),
      });

      const location2 = Location.create({
        area: 'hokkaido',
        name: '北海道配送センター（別名）',
        postalCode: PostalCode.from('0608588'), // ハイフンなし
        prefecture: Prefecture.from('北海道'),
        city: '札幌市中央区',
        address1: '北3条西6丁目',
        address2: 'テストビル',
        phone: PhoneNumber.from('011-231-4111'),
      });

      expect(location1.equals(location2)).toBe(true);
    });

    it('should return false for different postal codes', () => {
      const location1 = Location.create({
        area: 'hokkaido',
        name: '北海道配送センター',
        postalCode: PostalCode.from('060-8588'),
        prefecture: Prefecture.from('北海道'),
        city: '札幌市中央区',
        address1: '北3条西6丁目',
        address2: '',
        phone: PhoneNumber.from('011-231-4111'),
      });

      const location2 = Location.create({
        area: 'hokkaido',
        name: '北海道配送センター',
        postalCode: PostalCode.from('030-8570'),
        prefecture: Prefecture.from('北海道'),
        city: '札幌市中央区',
        address1: '北3条西6丁目',
        address2: '',
        phone: PhoneNumber.from('011-231-4111'),
      });

      expect(location1.equals(location2)).toBe(false);
    });
  });

  describe('getFullAddress', () => {
    it('should return full address without address2', () => {
      const location = Location.create({
        area: 'hokkaido',
        name: '北海道配送センター',
        postalCode: PostalCode.from('060-8588'),
        prefecture: Prefecture.from('北海道'),
        city: '札幌市中央区',
        address1: '北3条西6丁目',
        address2: '',
        phone: PhoneNumber.from('011-231-4111'),
      });

      expect(location.getFullAddress()).toBe('北海道札幌市中央区北3条西6丁目');
    });

    it('should return full address with address2', () => {
      const location = Location.create({
        area: 'hokkaido',
        name: '北海道配送センター',
        postalCode: PostalCode.from('060-8588'),
        prefecture: Prefecture.from('北海道'),
        city: '札幌市中央区',
        address1: '北3条西6丁目',
        address2: 'テストビル3F',
        phone: PhoneNumber.from('011-231-4111'),
      });

      expect(location.getFullAddress()).toBe('北海道札幌市中央区北3条西6丁目 テストビル3F');
    });
  });
});
