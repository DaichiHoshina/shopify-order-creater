/**
 * FileSystemSQLRepository Integration Tests
 *
 * 実際のファイルシステムを使ったIntegration Test
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileSystemSQLRepository } from './file-system-sql.repository';

describe('FileSystemSQLRepository', () => {
  let repository: FileSystemSQLRepository;
  const testOutputDir = path.join(__dirname, '../../../test-output');

  beforeEach(() => {
    repository = new FileSystemSQLRepository();

    // テスト用の出力ディレクトリを作成
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // テスト後にファイルをクリーンアップ
    if (fs.existsSync(testOutputDir)) {
      const files = fs.readdirSync(testOutputDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testOutputDir, file));
      });
      fs.rmdirSync(testOutputDir);
    }
  });

  describe('save', () => {
    it('should save SQL to file and return filepath', async () => {
      // Arrange
      const sql = 'INSERT INTO consignors VALUES (1, 2, 3);';
      const filename = 'test.sql';

      // Act
      const filepath = await repository.save(sql, filename, testOutputDir);

      // Assert
      expect(filepath).toContain('test.sql');
      expect(fs.existsSync(filepath)).toBe(true);

      // ファイルの内容を確認
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content).toBe(sql);
    });

    it('should save SQL with default output directory', async () => {
      // Arrange
      const sql = 'INSERT INTO consignors VALUES (1, 2, 3);';
      const filename = 'test-default.sql';

      // Act
      const filepath = await repository.save(sql, filename);

      // Assert
      expect(filepath).toContain('test-default.sql');
      expect(fs.existsSync(filepath)).toBe(true);

      // クリーンアップ
      fs.unlinkSync(filepath);
    });

    it('should create directory if it does not exist', async () => {
      // Arrange
      const sql = 'INSERT INTO consignors VALUES (1, 2, 3);';
      const filename = 'test-nested.sql';
      const nestedDir = path.join(testOutputDir, 'nested', 'deep');

      // Act
      const filepath = await repository.save(sql, filename, nestedDir);

      // Assert
      expect(fs.existsSync(filepath)).toBe(true);

      // クリーンアップ
      fs.unlinkSync(filepath);
      fs.rmdirSync(path.join(testOutputDir, 'nested', 'deep'));
      fs.rmdirSync(path.join(testOutputDir, 'nested'));
    });

    it('should overwrite existing file', async () => {
      // Arrange
      const sql1 = 'INSERT INTO consignors VALUES (1);';
      const sql2 = 'INSERT INTO consignors VALUES (2);';
      const filename = 'test-overwrite.sql';

      // Act
      await repository.save(sql1, filename, testOutputDir);
      const filepath = await repository.save(sql2, filename, testOutputDir);

      // Assert
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content).toBe(sql2);
    });

    it('should save SQL with UTF-8 encoding', async () => {
      // Arrange
      const sql = "INSERT INTO consignors (name) VALUES ('配送センター');";
      const filename = 'test-utf8.sql';

      // Act
      const filepath = await repository.save(sql, filename, testOutputDir);

      // Assert
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content).toContain('配送センター');
    });
  });
});
