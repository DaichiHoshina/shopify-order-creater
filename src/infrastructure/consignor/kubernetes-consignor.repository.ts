/**
 * KubernetesConsignorRepository
 *
 * Kubernetes経由でConsignorデータをDBにデプロイするRepository実装
 */

import {
  IConsignorRepository,
  DeployResult,
  RollbackResult,
} from '../../domain/consignor/consignor.repository';
import { Consignor } from '../../domain/consignor/consignor.entity';
import { IShopRepository } from '../../domain/shop/shop.repository';
import { KubernetesClient } from '../../cli/utils/kubernetes';

export class KubernetesConsignorRepository implements IConsignorRepository {
  constructor(
    private readonly k8sClient: KubernetesClient,
    private readonly shopRepository: IShopRepository
  ) {}

  async deploy(consignors: Consignor[], environment: string): Promise<DeployResult> {
    if (consignors.length === 0) {
      return {
        success: false,
        insertedCount: 0,
        errorMessage: 'No consignors to deploy',
      };
    }

    try {
      // 1. Shopの環境情報を取得（最初のConsignorから）
      const shop = consignors[0].getShop();
      const env = shop.getEnvironment(environment);

      // 2. Kubernetesコンテキストを切り替え
      await this.k8sClient.switchContext(env.context);

      // 3. MySQL Client Podを確保
      const podName = await this.k8sClient.ensureMySQLClientPod(env.namespace);

      // 4. DB接続情報を取得
      const dbCredentials = await this.k8sClient.getDBCredentials(
        env.namespace,
        env.dbConfigMap,
        env.dbSecret
      );

      // 5. SQLを生成
      const sqlStatements = consignors.map(consignor => consignor.toSQL());
      const sql = sqlStatements.join('\n\n');

      // 6. SQLを実行
      await this.k8sClient.execSQL({
        namespace: env.namespace,
        podName,
        dbHost: dbCredentials.host,
        dbUser: dbCredentials.user,
        dbPassword: dbCredentials.password,
        dbPort: dbCredentials.port,
        dbName: dbCredentials.name,
        sql,
      });

      // 7. 成功を返す
      return {
        success: true,
        insertedCount: consignors.length,
      };
    } catch (error: any) {
      return {
        success: false,
        insertedCount: 0,
        errorMessage: error.message || 'Unknown error occurred',
      };
    } finally {
      // コンテキストを必ず復元
      await this.k8sClient.restoreContext();
    }
  }

  async rollback(shopifyShopId: string, environment: string): Promise<RollbackResult> {
    try {
      // 1. shopifyShopIdからShop名を抽出（例: "test-shop.myshopify.com" -> "test-shop"）
      const shopName = shopifyShopId.replace('.myshopify.com', '');

      // 2. Shopを取得
      const shop = await this.shopRepository.findByName(shopName);
      const env = shop.getEnvironment(environment);

      // 3. Kubernetesコンテキストを切り替え
      await this.k8sClient.switchContext(env.context);

      // 4. MySQL Client Podを確保
      const podName = await this.k8sClient.ensureMySQLClientPod(env.namespace);

      // 5. DB接続情報を取得
      const dbCredentials = await this.k8sClient.getDBCredentials(
        env.namespace,
        env.dbConfigMap,
        env.dbSecret
      );

      // 6. DELETE SQLを生成
      const sql = `DELETE FROM consignors
WHERE shopify_shop_id = '${shopifyShopId}'
  AND location_name LIKE '%配送センター%';`;

      // 7. SQLを実行
      await this.k8sClient.execSQL({
        namespace: env.namespace,
        podName,
        dbHost: dbCredentials.host,
        dbUser: dbCredentials.user,
        dbPassword: dbCredentials.password,
        dbPort: dbCredentials.port,
        dbName: dbCredentials.name,
        sql,
      });

      // 8. 成功を返す
      return {
        success: true,
        deletedCount: 13, // 13エリア想定
      };
    } catch (error: any) {
      return {
        success: false,
        deletedCount: 0,
        errorMessage: error.message || 'Unknown error occurred',
      };
    } finally {
      // コンテキストを必ず復元
      await this.k8sClient.restoreContext();
    }
  }
}
