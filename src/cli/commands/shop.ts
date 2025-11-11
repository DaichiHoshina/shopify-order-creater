/**
 * Shop情報管理関連コマンド
 */

import { loadShopConfig } from '../utils/config';
import { logger } from '../utils/logger';

interface ShopInfoOptions {
  shop: string;
}

/**
 * Shop情報を表示するコマンド
 */
export async function showShopInfo(options: ShopInfoOptions): Promise<void> {
  try {
    logger.title(`📋 Shop情報: ${options.shop}`);

    // Shop設定を読み込み
    const shopConfig = loadShopConfig(options.shop);

    // 基本情報
    logger.section('基本情報');
    logger.log(`  Shopify Shop ID: ${shopConfig.shopify_shop_id}`);
    logger.log(`  Store ID: ${shopConfig.store_id}`);

    // 環境情報
    logger.section('環境情報');
    Object.entries(shopConfig.environments).forEach(([envName, envConfig]) => {
      logger.log(`\n  ${envName.toUpperCase()}:`);
      logger.log(`    Namespace: ${envConfig.namespace}`);
      logger.log(`    Context: ${envConfig.context}`);
      logger.log(`    DB Name: ${envConfig.db_name}`);
      logger.log(`    ConfigMap: ${envConfig.db_config_map}`);
      logger.log(`    Secret: ${envConfig.db_secret}`);
    });

    // 認証情報
    if (shopConfig.credentials) {
      logger.section('配送業者認証情報');
      if (shopConfig.credentials.sagawa_detail_id) {
        logger.log(`  佐川急便 Detail ID: ${shopConfig.credentials.sagawa_detail_id}`);
      }
      if (shopConfig.credentials.yamato_detail_id) {
        logger.log(`  ヤマト運輸 Detail ID: ${shopConfig.credentials.yamato_detail_id}`);
      }
      if (shopConfig.credentials.japan_post_detail_id) {
        logger.log(`  日本郵便 Detail ID: ${shopConfig.credentials.japan_post_detail_id}`);
      }
    }
  } catch (error: any) {
    logger.error(`エラー: ${error.message}`);
    throw error;
  }
}
