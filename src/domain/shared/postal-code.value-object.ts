/**
 * PostalCode Value Object
 *
 * 日本の郵便番号を表現する不変オブジェクト
 * Format: 123-4567 (7桁、ハイフン区切り)
 */

export class PostalCode {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * 郵便番号を作成
   * @param input ハイフンあり/なし両対応 (例: "135-0061" or "1350061")
   * @returns PostalCode instance
   * @throws Error if invalid format
   */
  static from(input: string): PostalCode {
    // バリデーション
    if (!input || input.trim() === '') {
      throw new Error('Invalid postal code format: empty string');
    }

    let digitsOnly: string;

    // ハイフンが含まれる場合は、正しい位置にあるかチェック
    if (input.includes('-')) {
      // 正しい形式: 123-4567
      if (!/^\d{3}-\d{4}$/.test(input)) {
        throw new Error(
          'Invalid postal code format: hyphen must be at position 3 (format: 123-4567)'
        );
      }
      digitsOnly = input.replace('-', '');
    } else {
      // ハイフンなしの場合は7桁の数字のみ
      if (!/^\d{7}$/.test(input)) {
        throw new Error('Invalid postal code format: must be 7 digits without hyphen');
      }
      digitsOnly = input;
    }

    // ハイフン付き形式に正規化 (123-4567)
    const normalized = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;

    return new PostalCode(normalized);
  }

  /**
   * 等価性チェック
   */
  equals(other: PostalCode): boolean {
    return this.value === other.value;
  }

  /**
   * 文字列表現を取得
   */
  toString(): string {
    return this.value;
  }

  /**
   * 地域コード（最初の3桁）を取得
   */
  getRegion(): string {
    return this.value.slice(0, 3);
  }
}
