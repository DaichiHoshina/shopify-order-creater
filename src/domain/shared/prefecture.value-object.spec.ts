/**
 * Prefecture Value Object Tests
 * TDD: RED Phase
 */

import { Prefecture } from './prefecture.value-object';

describe('Prefecture', () => {
  describe('from', () => {
    it('should create valid prefecture (北海道)', () => {
      const pref = Prefecture.from('北海道');
      expect(pref.toString()).toBe('北海道');
    });

    it('should create valid prefecture (東京都)', () => {
      const pref = Prefecture.from('東京都');
      expect(pref.toString()).toBe('東京都');
    });

    it('should create valid prefecture (大阪府)', () => {
      const pref = Prefecture.from('大阪府');
      expect(pref.toString()).toBe('大阪府');
    });

    it('should create valid prefecture (福岡県)', () => {
      const pref = Prefecture.from('福岡県');
      expect(pref.toString()).toBe('福岡県');
    });

    it('should throw error for empty string', () => {
      expect(() => Prefecture.from('')).toThrow('Invalid prefecture');
    });

    it('should throw error for invalid prefecture name', () => {
      expect(() => Prefecture.from('東京市')).toThrow('Invalid prefecture');
    });

    it('should throw error for English name', () => {
      expect(() => Prefecture.from('Tokyo')).toThrow('Invalid prefecture');
    });
  });

  describe('equals', () => {
    it('should return true for same prefecture', () => {
      const pref1 = Prefecture.from('東京都');
      const pref2 = Prefecture.from('東京都');
      expect(pref1.equals(pref2)).toBe(true);
    });

    it('should return false for different prefectures', () => {
      const pref1 = Prefecture.from('東京都');
      const pref2 = Prefecture.from('大阪府');
      expect(pref1.equals(pref2)).toBe(false);
    });
  });

  describe('isTo', () => {
    it('should return true for 都 (東京都)', () => {
      const pref = Prefecture.from('東京都');
      expect(pref.isTo()).toBe(true);
    });

    it('should return false for 道 (北海道)', () => {
      const pref = Prefecture.from('北海道');
      expect(pref.isTo()).toBe(false);
    });
  });

  describe('isDo', () => {
    it('should return true for 道 (北海道)', () => {
      const pref = Prefecture.from('北海道');
      expect(pref.isDo()).toBe(true);
    });

    it('should return false for 都 (東京都)', () => {
      const pref = Prefecture.from('東京都');
      expect(pref.isDo()).toBe(false);
    });
  });

  describe('isFu', () => {
    it('should return true for 府 (大阪府)', () => {
      const pref = Prefecture.from('大阪府');
      expect(pref.isFu()).toBe(true);
    });

    it('should return true for 府 (京都府)', () => {
      const pref = Prefecture.from('京都府');
      expect(pref.isFu()).toBe(true);
    });

    it('should return false for 都 (東京都)', () => {
      const pref = Prefecture.from('東京都');
      expect(pref.isFu()).toBe(false);
    });
  });

  describe('isKen', () => {
    it('should return true for 県 (福岡県)', () => {
      const pref = Prefecture.from('福岡県');
      expect(pref.isKen()).toBe(true);
    });

    it('should return false for 道 (北海道)', () => {
      const pref = Prefecture.from('北海道');
      expect(pref.isKen()).toBe(false);
    });
  });
});
