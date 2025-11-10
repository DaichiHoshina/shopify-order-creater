/**
 * FileSystemSQLRepository
 *
 * SQLファイルをファイルシステムに保存するRepository実装
 */

import * as fs from 'fs';
import * as path from 'path';
import { ISQLFileRepository } from '../../domain/consignor/sql-file.repository';

export class FileSystemSQLRepository implements ISQLFileRepository {
  private readonly defaultOutputDir: string;

  constructor() {
    this.defaultOutputDir = path.join(process.cwd(), 'sql-output-store-management');
  }

  async save(sql: string, filename: string, outputDir?: string): Promise<string> {
    const dir = outputDir || this.defaultOutputDir;

    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // ファイルパスを生成
    const filepath = path.join(dir, filename);

    // SQLファイルを保存（UTF-8エンコーディング）
    fs.writeFileSync(filepath, sql, 'utf-8');

    return filepath;
  }
}
