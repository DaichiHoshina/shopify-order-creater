/**
 * SQL File Repository Interface
 *
 * ドメイン層のインターフェース（依存関係逆転の原則）
 * 実装はInfrastructure層で行う
 */

export interface ISQLFileRepository {
  /**
   * SQLをファイルに保存
   * @param sql SQL文字列
   * @param filename ファイル名
   * @param outputDir 出力ディレクトリ（オプション）
   * @returns 保存されたファイルのフルパス
   */
  save(sql: string, filename: string, outputDir?: string): Promise<string>;
}
