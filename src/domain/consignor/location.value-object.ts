/**
 * Location Value Object
 *
 * 配送元の所在地を表現する不変オブジェクト
 * 複合Value Object（PostalCode, Prefecture, PhoneNumberを含む）
 */

import { PostalCode } from '../shared/postal-code.value-object';
import { Prefecture } from '../shared/prefecture.value-object';
import { PhoneNumber } from '../shared/phone-number.value-object';

export interface LocationProps {
  area: string;
  name: string;
  postalCode: PostalCode;
  prefecture: Prefecture;
  city: string;
  address1: string;
  address2: string;
  phone: PhoneNumber;
}

export class Location {
  private constructor(
    private readonly area: string,
    private readonly name: string,
    private readonly postalCode: PostalCode,
    private readonly prefecture: Prefecture,
    private readonly city: string,
    private readonly address1: string,
    private readonly address2: string,
    private readonly phone: PhoneNumber
  ) {}

  /**
   * Locationを作成
   * @param props Location properties
   * @returns Location instance
   * @throws Error if validation fails
   */
  static create(props: LocationProps): Location {
    // バリデーション
    if (!props.name || props.name.trim() === '') {
      throw new Error('Location name must not be empty');
    }

    if (!props.name.includes('配送センター')) {
      throw new Error('Location name must include 配送センター');
    }

    if (!props.city || props.city.trim() === '') {
      throw new Error('City must not be empty');
    }

    if (!props.address1 || props.address1.trim() === '') {
      throw new Error('Address1 must not be empty');
    }

    if (!props.area || props.area.trim() === '') {
      throw new Error('Area must not be empty');
    }

    return new Location(
      props.area.trim(),
      props.name.trim(),
      props.postalCode,
      props.prefecture,
      props.city.trim(),
      props.address1.trim(),
      props.address2.trim(),
      props.phone
    );
  }

  /**
   * 等価性チェック
   * 郵便番号と都道府県が同じであれば同一とみなす
   */
  equals(other: Location): boolean {
    return this.postalCode.equals(other.postalCode) &&
           this.prefecture.equals(other.prefecture);
  }

  /**
   * エリアコードを取得
   */
  getArea(): string {
    return this.area;
  }

  /**
   * 配送センター名を取得
   */
  getName(): string {
    return this.name;
  }

  /**
   * 郵便番号を取得
   */
  getPostalCode(): PostalCode {
    return this.postalCode;
  }

  /**
   * 都道府県を取得
   */
  getPrefecture(): Prefecture {
    return this.prefecture;
  }

  /**
   * 市区町村を取得
   */
  getCity(): string {
    return this.city;
  }

  /**
   * 住所1を取得
   */
  getAddress1(): string {
    return this.address1;
  }

  /**
   * 住所2を取得（建物名など）
   */
  getAddress2(): string {
    return this.address2;
  }

  /**
   * 電話番号を取得
   */
  getPhone(): PhoneNumber {
    return this.phone;
  }

  /**
   * 完全な住所を取得
   * 形式: 都道府県 + 市区町村 + 住所1 + 住所2
   */
  getFullAddress(): string {
    let address = this.prefecture.toString() + this.city + this.address1;

    if (this.address2) {
      address += ' ' + this.address2;
    }

    return address;
  }
}
