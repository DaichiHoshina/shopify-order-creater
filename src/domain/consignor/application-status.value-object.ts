/**
 * ApplicationStatus Value Object
 *
 * 配送業者への申請状態を表す不変オブジェクト
 * - accepted: 申請済み（承認済み）テストデータで使用
 * - not_applied: 未申請（本番データ）
 */

type StatusValue = 'accepted' | 'not_applied';

export class ApplicationStatus {
  private constructor(private readonly value: StatusValue) {}

  /**
   * 申請済み（承認済み）ステータスを作成
   * テストデータで使用
   */
  static accepted(): ApplicationStatus {
    return new ApplicationStatus('accepted');
  }

  /**
   * 未申請ステータスを作成
   * 本番データで使用（配送業者との契約が必要）
   */
  static notApplied(): ApplicationStatus {
    return new ApplicationStatus('not_applied');
  }

  /**
   * 文字列からApplicationStatusを作成
   * @param value "accepted" or "not_applied"
   * @returns ApplicationStatus instance
   * @throws Error if invalid value
   */
  static from(value: string): ApplicationStatus {
    if (value === 'accepted') {
      return ApplicationStatus.accepted();
    } else if (value === 'not_applied') {
      return ApplicationStatus.notApplied();
    } else {
      throw new Error(`Invalid application status: ${value}. Must be "accepted" or "not_applied"`);
    }
  }

  /**
   * 等価性チェック
   */
  equals(other: ApplicationStatus): boolean {
    return this.value === other.value;
  }

  /**
   * 文字列表現を取得
   */
  toString(): string {
    return this.value;
  }

  /**
   * 申請済み（承認済み）かどうか
   */
  isAccepted(): boolean {
    return this.value === 'accepted';
  }

  /**
   * 未申請かどうか
   */
  isNotApplied(): boolean {
    return this.value === 'not_applied';
  }

  /**
   * デプロイ可能かどうか
   * acceptedステータスのみデプロイ可能
   */
  canDeploy(): boolean {
    return this.isAccepted();
  }
}
