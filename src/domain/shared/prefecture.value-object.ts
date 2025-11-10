/**
 * Prefecture Value Object
 *
 * 日本の都道府県を表現する不変オブジェクト
 * 47都道府県のみ許可
 */

export class Prefecture {
  private static readonly VALID_PREFECTURES = [
    '北海道',
    '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
    '岐阜県', '静岡県', '愛知県', '三重県',
    '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
    '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県',
    '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県',
    '沖縄県'
  ];

  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * 都道府県を作成
   * @param input 都道府県名（例: "東京都", "大阪府", "福岡県"）
   * @returns Prefecture instance
   * @throws Error if invalid prefecture
   */
  static from(input: string): Prefecture {
    if (!input || input.trim() === '') {
      throw new Error('Invalid prefecture: empty string');
    }

    const trimmed = input.trim();

    if (!this.VALID_PREFECTURES.includes(trimmed)) {
      throw new Error(`Invalid prefecture: ${trimmed} is not a valid Japanese prefecture`);
    }

    return new Prefecture(trimmed);
  }

  /**
   * 等価性チェック
   */
  equals(other: Prefecture): boolean {
    return this.value === other.value;
  }

  /**
   * 文字列表現を取得
   */
  toString(): string {
    return this.value;
  }

  /**
   * 「都」かどうか（東京都のみ）
   */
  isTo(): boolean {
    return this.value.endsWith('都');
  }

  /**
   * 「道」かどうか（北海道のみ）
   */
  isDo(): boolean {
    return this.value.endsWith('道');
  }

  /**
   * 「府」かどうか（京都府、大阪府）
   */
  isFu(): boolean {
    return this.value.endsWith('府');
  }

  /**
   * 「県」かどうか（43県）
   */
  isKen(): boolean {
    return this.value.endsWith('県');
  }
}
