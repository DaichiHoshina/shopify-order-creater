/**
 * JsonLocationRepository
 *
 * locations.jsonからLocationデータを読み込むRepository実装
 */

import * as fs from 'fs';
import * as path from 'path';
import { ILocationRepository } from '../../domain/consignor/location.repository';
import { Location } from '../../domain/consignor/location.value-object';
import { PostalCode } from '../../domain/shared/postal-code.value-object';
import { Prefecture } from '../../domain/shared/prefecture.value-object';
import { PhoneNumber } from '../../domain/shared/phone-number.value-object';

interface LocationDataJson {
  area: string;
  name: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  province_code: string;
  zip: string;
  country_code: string;
  phone: string;
}

export class JsonLocationRepository implements ILocationRepository {
  private readonly locationsFilePath: string;
  private locationsCache: Location[] | null = null;

  constructor() {
    this.locationsFilePath = path.join(__dirname, '../../../data/locations.json');
  }

  async findAll(): Promise<Location[]> {
    if (this.locationsCache) {
      return this.locationsCache;
    }

    const locations = await this.loadLocations();
    this.locationsCache = locations;
    return locations;
  }

  async findByArea(area: string): Promise<Location> {
    const locations = await this.findAll();
    const location = locations.find(loc => loc.getArea() === area);

    if (!location) {
      throw new Error(`Location not found for area: ${area}`);
    }

    return location;
  }

  private async loadLocations(): Promise<Location[]> {
    if (!fs.existsSync(this.locationsFilePath)) {
      throw new Error(`Locations file not found: ${this.locationsFilePath}`);
    }

    const content = fs.readFileSync(this.locationsFilePath, 'utf-8');
    const data: LocationDataJson[] = JSON.parse(content);

    return data.map(item => {
      return Location.create({
        area: item.area,
        name: item.name,
        postalCode: PostalCode.from(item.zip),
        prefecture: Prefecture.from(item.province),
        city: item.city,
        address1: item.address1,
        address2: item.address2,
        phone: PhoneNumber.from(item.phone),
      });
    });
  }
}
