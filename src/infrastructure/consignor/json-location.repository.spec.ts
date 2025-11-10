/**
 * JsonLocationRepository Integration Tests
 *
 * 実際のlocations.jsonファイルを使ったIntegration Test
 */

import { JsonLocationRepository } from './json-location.repository';

describe('JsonLocationRepository', () => {
  let repository: JsonLocationRepository;

  beforeEach(() => {
    repository = new JsonLocationRepository();
  });

  describe('findAll', () => {
    it('should load all 13 locations', async () => {
      // Act
      const locations = await repository.findAll();

      // Assert
      expect(locations).toHaveLength(13);
    });

    it('should create valid Location value objects', async () => {
      // Act
      const locations = await repository.findAll();

      // Assert
      locations.forEach(location => {
        expect(location.getName()).toBeTruthy();
        expect(location.getName()).toContain('配送センター');
        expect(location.getPostalCode()).toBeTruthy();
        expect(location.getPrefecture()).toBeTruthy();
        expect(location.getCity()).toBeTruthy();
        expect(location.getAddress1()).toBeTruthy();
        expect(location.getPhone()).toBeTruthy();
      });
    });

    it('should load specific areas correctly', async () => {
      // Act
      const locations = await repository.findAll();

      // Assert - 北海道配送センター
      const hokkaido = locations.find(loc => loc.getArea() === 'hokkaido');
      expect(hokkaido).toBeDefined();
      expect(hokkaido!.getName()).toContain('北海道配送センター');
      expect(hokkaido!.getPostalCode().toString()).toBe('060-8588');
      expect(hokkaido!.getPrefecture().toString()).toBe('北海道');

      // Assert - 関東配送センター
      const kanto = locations.find(loc => loc.getArea() === 'kanto');
      expect(kanto).toBeDefined();
      expect(kanto!.getName()).toContain('関東配送センター');
      expect(kanto!.getPostalCode().toString()).toBe('163-8001');
      expect(kanto!.getPrefecture().toString()).toBe('東京都');

      // Assert - 沖縄配送センター
      const okinawa = locations.find(loc => loc.getArea() === 'okinawa');
      expect(okinawa).toBeDefined();
      expect(okinawa!.getName()).toContain('沖縄配送センター');
      expect(okinawa!.getPostalCode().toString()).toBe('900-8570');
      expect(okinawa!.getPrefecture().toString()).toBe('沖縄県');
    });
  });

  describe('findByArea', () => {
    it('should find location by area code', async () => {
      // Act
      const location = await repository.findByArea('hokkaido');

      // Assert
      expect(location.getArea()).toBe('hokkaido');
      expect(location.getName()).toContain('北海道配送センター');
    });

    it('should find kanto location', async () => {
      // Act
      const location = await repository.findByArea('kanto');

      // Assert
      expect(location.getArea()).toBe('kanto');
      expect(location.getName()).toContain('関東配送センター');
      expect(location.getPrefecture().toString()).toBe('東京都');
    });

    it('should throw error for non-existent area', async () => {
      // Act & Assert
      await expect(repository.findByArea('invalid-area')).rejects.toThrow(
        'Location not found for area: invalid-area'
      );
    });

    it('should throw error for empty area', async () => {
      // Act & Assert
      await expect(repository.findByArea('')).rejects.toThrow('Location not found for area:');
    });
  });
});
