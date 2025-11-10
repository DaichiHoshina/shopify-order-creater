/**
 * PhoneNumber Value Object Tests
 * TDD: RED Phase
 */

import { PhoneNumber } from './phone-number.value-object';

describe('PhoneNumber', () => {
  describe('from', () => {
    it('should create valid phone number with hyphens (03-1234-5678)', () => {
      const phone = PhoneNumber.from('03-1234-5678');
      expect(phone.toString()).toBe('03-1234-5678');
    });

    it('should create valid phone number without hyphens (0312345678)', () => {
      const phone = PhoneNumber.from('0312345678');
      expect(phone.toString()).toBe('03-1234-5678');
    });

    it('should normalize mobile number (090-1234-5678)', () => {
      const phone = PhoneNumber.from('09012345678');
      expect(phone.toString()).toBe('090-1234-5678');
    });

    it('should normalize Hokkaido landline (011-123-4567)', () => {
      const phone = PhoneNumber.from('0111234567');
      expect(phone.toString()).toBe('011-123-4567');
    });

    it('should throw error for invalid length (9 digits)', () => {
      expect(() => PhoneNumber.from('012345678')).toThrow('Invalid phone number format');
    });

    it('should throw error for invalid length (12 digits)', () => {
      expect(() => PhoneNumber.from('012345678901')).toThrow('Invalid phone number format');
    });

    it('should throw error if not starting with 0', () => {
      expect(() => PhoneNumber.from('1234567890')).toThrow('Invalid phone number format');
    });

    it('should throw error for non-numeric characters', () => {
      expect(() => PhoneNumber.from('03-abcd-efgh')).toThrow('Invalid phone number format');
    });

    it('should throw error for empty string', () => {
      expect(() => PhoneNumber.from('')).toThrow('Invalid phone number format');
    });
  });

  describe('equals', () => {
    it('should return true for same phone number', () => {
      const phone1 = PhoneNumber.from('03-1234-5678');
      const phone2 = PhoneNumber.from('0312345678');
      expect(phone1.equals(phone2)).toBe(true);
    });

    it('should return false for different phone numbers', () => {
      const phone1 = PhoneNumber.from('03-1234-5678');
      const phone2 = PhoneNumber.from('090-1234-5678');
      expect(phone1.equals(phone2)).toBe(false);
    });
  });

  describe('isMobile', () => {
    it('should return true for mobile numbers starting with 090', () => {
      const phone = PhoneNumber.from('090-1234-5678');
      expect(phone.isMobile()).toBe(true);
    });

    it('should return true for mobile numbers starting with 080', () => {
      const phone = PhoneNumber.from('080-1234-5678');
      expect(phone.isMobile()).toBe(true);
    });

    it('should return true for mobile numbers starting with 070', () => {
      const phone = PhoneNumber.from('070-1234-5678');
      expect(phone.isMobile()).toBe(true);
    });

    it('should return false for landline numbers', () => {
      const phone = PhoneNumber.from('03-1234-5678');
      expect(phone.isMobile()).toBe(false);
    });
  });
});
