/**
 * PostalCode Value Object Tests
 * TDD: RED Phase
 */

import { PostalCode } from './postal-code.value-object';

describe('PostalCode', () => {
  describe('from', () => {
    it('should create valid postal code with hyphen format (123-4567)', () => {
      const postalCode = PostalCode.from('135-0061');
      expect(postalCode.toString()).toBe('135-0061');
    });

    it('should create valid postal code without hyphen (1234567)', () => {
      const postalCode = PostalCode.from('1350061');
      expect(postalCode.toString()).toBe('135-0061');
    });

    it('should normalize to hyphen format', () => {
      const postalCode = PostalCode.from('0600001');
      expect(postalCode.toString()).toBe('060-0001');
    });

    it('should throw error for invalid length', () => {
      expect(() => PostalCode.from('123')).toThrow('Invalid postal code format');
    });

    it('should throw error for non-numeric characters', () => {
      expect(() => PostalCode.from('abc-defg')).toThrow('Invalid postal code format');
    });

    it('should throw error for empty string', () => {
      expect(() => PostalCode.from('')).toThrow('Invalid postal code format');
    });

    it('should throw error for invalid hyphen position (12-34567)', () => {
      expect(() => PostalCode.from('12-34567')).toThrow('Invalid postal code format');
    });
  });

  describe('equals', () => {
    it('should return true for same postal code', () => {
      const code1 = PostalCode.from('135-0061');
      const code2 = PostalCode.from('1350061');
      expect(code1.equals(code2)).toBe(true);
    });

    it('should return false for different postal codes', () => {
      const code1 = PostalCode.from('135-0061');
      const code2 = PostalCode.from('060-0001');
      expect(code1.equals(code2)).toBe(false);
    });
  });

  describe('getRegion', () => {
    it('should return region code (first 3 digits)', () => {
      const postalCode = PostalCode.from('135-0061');
      expect(postalCode.getRegion()).toBe('135');
    });

    it('should handle leading zeros', () => {
      const postalCode = PostalCode.from('060-0001');
      expect(postalCode.getRegion()).toBe('060');
    });
  });
});
