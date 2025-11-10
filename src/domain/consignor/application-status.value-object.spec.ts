/**
 * ApplicationStatus Value Object Tests
 * TDD: RED Phase
 */

import { ApplicationStatus } from './application-status.value-object';

describe('ApplicationStatus', () => {
  describe('accepted', () => {
    it('should create accepted status', () => {
      const status = ApplicationStatus.accepted();
      expect(status.toString()).toBe('accepted');
      expect(status.isAccepted()).toBe(true);
      expect(status.isNotApplied()).toBe(false);
    });
  });

  describe('notApplied', () => {
    it('should create not_applied status', () => {
      const status = ApplicationStatus.notApplied();
      expect(status.toString()).toBe('not_applied');
      expect(status.isAccepted()).toBe(false);
      expect(status.isNotApplied()).toBe(true);
    });
  });

  describe('from', () => {
    it('should create from accepted string', () => {
      const status = ApplicationStatus.from('accepted');
      expect(status.isAccepted()).toBe(true);
    });

    it('should create from not_applied string', () => {
      const status = ApplicationStatus.from('not_applied');
      expect(status.isNotApplied()).toBe(true);
    });

    it('should throw error for invalid status', () => {
      expect(() => ApplicationStatus.from('invalid')).toThrow('Invalid application status');
    });

    it('should throw error for empty string', () => {
      expect(() => ApplicationStatus.from('')).toThrow('Invalid application status');
    });
  });

  describe('equals', () => {
    it('should return true for same status', () => {
      const status1 = ApplicationStatus.accepted();
      const status2 = ApplicationStatus.accepted();
      expect(status1.equals(status2)).toBe(true);
    });

    it('should return false for different statuses', () => {
      const status1 = ApplicationStatus.accepted();
      const status2 = ApplicationStatus.notApplied();
      expect(status1.equals(status2)).toBe(false);
    });
  });

  describe('canDeploy', () => {
    it('should return true for accepted status', () => {
      const status = ApplicationStatus.accepted();
      expect(status.canDeploy()).toBe(true);
    });

    it('should return false for not_applied status', () => {
      const status = ApplicationStatus.notApplied();
      expect(status.canDeploy()).toBe(false);
    });
  });
});
