/**
 * Kubernetes操作ユーティリティ
 */

import { execSync } from 'child_process';
import { DBCredentials, KubernetesExecSQLOptions } from '../../types/index';
import { logger } from './logger';

export class KubernetesClient {
  private originalContext: string | null = null;

  /**
   * 現在のkubectlコンテキストを取得
   */
  getCurrentContext(): string {
    try {
      return execSync('kubectl config current-context', { encoding: 'utf-8' }).trim();
    } catch (error) {
      throw new Error('kubectlコンテキストの取得に失敗しました');
    }
  }

  /**
   * kubectlコンテキストを切り替え
   */
  async switchContext(context: string): Promise<void> {
    if (!this.originalContext) {
      this.originalContext = this.getCurrentContext();
    }

    try {
      execSync(`kubectl config use-context "${context}"`, { stdio: 'ignore' });
      logger.success(`コンテキスト切り替え: ${context}`);
    } catch (error) {
      throw new Error(`コンテキストの切り替えに失敗しました: ${context}`);
    }
  }

  /**
   * 元のコンテキストに戻す
   */
  async restoreContext(): Promise<void> {
    if (this.originalContext) {
      try {
        execSync(`kubectl config use-context "${this.originalContext}"`, { stdio: 'ignore' });
        logger.info(`元のコンテキストに復元: ${this.originalContext}`);
      } catch (error) {
        logger.warning('元のコンテキストへの復元に失敗しました');
      }
    }
  }

  /**
   * Pod名を取得
   */
  async getPodName(namespace: string, selector: string): Promise<string> {
    try {
      const cmd = `kubectl get pods -n ${namespace} -l ${selector} -o jsonpath='{.items[0].metadata.name}'`;
      const podName = execSync(cmd, { encoding: 'utf-8' }).trim();

      if (!podName) {
        throw new Error(`Pod not found with selector: ${selector}`);
      }

      return podName;
    } catch (error) {
      throw new Error(`Podの取得に失敗しました: ${error}`);
    }
  }

  /**
   * ConfigMapから値を取得
   */
  async getConfigMap(namespace: string, name: string, key: string): Promise<string> {
    try {
      const cmd = `kubectl get configmap -n ${namespace} ${name} -o jsonpath='{.data.${key}}'`;
      return execSync(cmd, { encoding: 'utf-8' }).trim();
    } catch (error) {
      throw new Error(`ConfigMapの取得に失敗しました: ${namespace}/${name}.${key}`);
    }
  }

  /**
   * Secretから値を取得（base64デコード済み）
   */
  async getSecret(namespace: string, name: string, key: string): Promise<string> {
    try {
      const cmd = `kubectl get secret -n ${namespace} ${name} -o jsonpath='{.data.${key}}'`;
      const base64Value = execSync(cmd, { encoding: 'utf-8' }).trim();
      return Buffer.from(base64Value, 'base64').toString('utf-8');
    } catch (error) {
      throw new Error(`Secretの取得に失敗しました: ${namespace}/${name}.${key}`);
    }
  }

  /**
   * DB接続情報を取得
   */
  async getDBCredentials(
    namespace: string,
    configMapName: string,
    secretName: string
  ): Promise<DBCredentials> {
    logger.startSpinner('DB接続情報を取得中...');

    try {
      const [host, user, port, name, password] = await Promise.all([
        this.getConfigMap(namespace, configMapName, 'DB_HOST'),
        this.getConfigMap(namespace, configMapName, 'DB_USER'),
        this.getConfigMap(namespace, configMapName, 'DB_PORT'),
        this.getConfigMap(namespace, configMapName, 'DB_NAME'),
        this.getSecret(namespace, secretName, 'DB_PASSWORD'),
      ]);

      logger.succeedSpinner('DB接続情報を取得しました');

      return { host, user, port, name, password };
    } catch (error) {
      logger.failSpinner('DB接続情報の取得に失敗しました');
      throw error;
    }
  }

  /**
   * Podで任意のMySQLコマンドを実行
   */
  async execSQL(options: KubernetesExecSQLOptions): Promise<string> {
    const { namespace, podName, dbHost, dbUser, dbPassword, dbName, sql } = options;

    // SQLをファイルに書き込んでからexecする方法を使用
    const tempSqlFile = `/tmp/ps-cli-${Date.now()}.sql`;

    try {
      // SQLをPodにコピー
      const escapedSQL = sql.replace(/'/g, "'\\''");
      execSync(
        `kubectl exec -n ${namespace} ${podName} -- sh -c "echo '${escapedSQL}' > ${tempSqlFile}"`,
        { stdio: 'pipe' }
      );

      // MySQLコマンドを実行
      const cmd = `kubectl exec -i -n ${namespace} ${podName} -- mysql --default-character-set=utf8mb4 -h ${dbHost} -P ${options.dbPort || '3306'} -u ${dbUser} -p${dbPassword} ${dbName} < ${tempSqlFile}`;

      const result = execSync(cmd, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // 一時ファイルを削除
      execSync(`kubectl exec -n ${namespace} ${podName} -- rm ${tempSqlFile}`, {
        stdio: 'ignore',
      });

      return result;
    } catch (error: any) {
      throw new Error(`SQL実行エラー: ${error.message}`);
    }
  }

  /**
   * MySQLクライアントPodが存在するか確認し、なければ作成
   */
  async ensureMySQLClientPod(namespace: string): Promise<string> {
    const podName = 'temp-mysql-client';

    try {
      // 既存のPodを確認
      execSync(`kubectl get pod -n ${namespace} ${podName}`, { stdio: 'ignore' });
      return podName;
    } catch {
      // Podが存在しない場合は作成
      logger.startSpinner('temp-mysql-clientを作成中...');

      const podYaml = `
apiVersion: v1
kind: Pod
metadata:
  name: ${podName}
  namespace: ${namespace}
spec:
  containers:
  - name: mysql-client
    image: mysql:8.0
    command: ["sleep", "36000"]
  restartPolicy: Never
`;

      execSync(`echo '${podYaml}' | kubectl apply -f -`, { stdio: 'ignore' });
      execSync(`kubectl wait --for=condition=Ready pod/${podName} -n ${namespace} --timeout=60s`, {
        stdio: 'ignore',
      });

      logger.succeedSpinner('temp-mysql-clientを作成しました');
      return podName;
    }
  }
}

export const k8s = new KubernetesClient();
