/**
 * PhoneNumber Value Object
 *
 * 日本の電話番号を表現する不変オブジェクト
 * - 固定電話: 10桁 (例: 03-1234-5678, 011-123-4567)
 * - 携帯電話: 11桁 (例: 090-1234-5678)
 */

export class PhoneNumber {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * 電話番号を作成
   * @param input ハイフンあり/なし両対応 (例: "03-1234-5678" or "0312345678")
   * @returns PhoneNumber instance
   * @throws Error if invalid format
   */
  static from(input: string): PhoneNumber {
    // バリデーション
    if (!input || input.trim() === '') {
      throw new Error('Invalid phone number format: empty string');
    }

    // ハイフン除去
    const digitsOnly = input.replace(/-/g, '');

    // 数字のみチェック
    if (!/^\d+$/.test(digitsOnly)) {
      throw new Error('Invalid phone number format: must contain only digits');
    }

    // 長さチェック（10桁または11桁）
    if (digitsOnly.length !== 10 && digitsOnly.length !== 11) {
      throw new Error('Invalid phone number format: must be 10 or 11 digits');
    }

    // 0で始まるかチェック
    if (!digitsOnly.startsWith('0')) {
      throw new Error('Invalid phone number format: must start with 0');
    }

    // ハイフン付き形式に正規化
    const normalized = this.normalize(digitsOnly);

    return new PhoneNumber(normalized);
  }

  /**
   * 電話番号を正規化（ハイフン付き形式に変換）
   */
  private static normalize(digitsOnly: string): string {
    if (digitsOnly.length === 11) {
      // 11桁: 携帯電話 (090-1234-5678)
      return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;
    } else {
      // 10桁: 固定電話
      // 市外局番が2桁の場合 (03, 04, 06など): 0X-XXXX-XXXX
      const areaCode2Digit = ['03', '04', '06'];
      const firstTwoDigits = digitsOnly.slice(0, 2);

      if (areaCode2Digit.includes(firstTwoDigits)) {
        return `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 6)}-${digitsOnly.slice(6)}`;
      } else {
        // 市外局番が3桁の場合 (011, 015など): 0XX-XXX-XXXX
        return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
      }
    }
  }

  /**
   * 等価性チェック
   */
  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }

  /**
   * 文字列表現を取得
   */
  toString(): string {
    return this.value;
  }

  /**
   * 携帯電話番号かどうかを判定
   */
  isMobile(): boolean {
    return this.value.startsWith('070') ||
           this.value.startsWith('080') ||
           this.value.startsWith('090');
  }
}
