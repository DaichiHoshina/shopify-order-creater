/**
 * YamlShopRepository
 *
 * shops.yamlからShopデータを読み込むRepository実装
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { IShopRepository } from '../../domain/shop/shop.repository';
import { Shop, KubernetesEnvironment, ShippingCredentials } from '../../domain/shop/shop.entity';
import { ShopifyShopId } from '../../domain/shop/shopify-shop-id.value-object';

interface ShopConfigYaml {
  shopify_shop_id: string;
  store_id: number;
  environments: {
    [key: string]: {
      namespace: string;
      context: string;
      db_name: string;
      db_config_map: string;
      db_secret: string;
    };
  };
  credentials?: {
    sagawa_detail_id?: number;
    yamato_detail_id?: number;
    japan_post_detail_id?: number;
  };
}

interface ShopsConfigYaml {
  shops: {
    [shopName: string]: ShopConfigYaml;
  };
}

export class YamlShopRepository implements IShopRepository {
  private readonly shopsFilePath: string;
  private shopsCache: ShopsConfigYaml | null = null;

  constructor() {
    this.shopsFilePath = path.join(__dirname, '../../../config/shops.yaml');
  }

  async findByName(name: string): Promise<Shop> {
    const config = await this.loadShopsConfig();

    if (!config.shops[name]) {
      throw new Error(`Shop "${name}" not found`);
    }

    const shopConfig = config.shops[name];
    return this.mapToShopEntity(shopConfig);
  }

  async listAll(): Promise<string[]> {
    const config = await this.loadShopsConfig();
    return Object.keys(config.shops);
  }

  private async loadShopsConfig(): Promise<ShopsConfigYaml> {
    if (this.shopsCache) {
      return this.shopsCache;
    }

    if (!fs.existsSync(this.shopsFilePath)) {
      throw new Error(`Shops config file not found: ${this.shopsFilePath}`);
    }

    const content = fs.readFileSync(this.shopsFilePath, 'utf-8');
    const config = yaml.load(content) as ShopsConfigYaml;

    this.shopsCache = config;
    return config;
  }

  private mapToShopEntity(config: ShopConfigYaml): Shop {
    // Environmentsをマップに変換
    const environments = new Map<string, KubernetesEnvironment>();
    Object.entries(config.environments).forEach(([name, env]) => {
      environments.set(name, {
        namespace: env.namespace,
        context: env.context,
        dbName: env.db_name,
        dbConfigMap: env.db_config_map,
        dbSecret: env.db_secret,
      });
    });

    // Credentialsを変換
    const credentials: ShippingCredentials = {
      sagawaDetailId: config.credentials?.sagawa_detail_id || 0,
      yamatoDetailId: config.credentials?.yamato_detail_id || 0,
      japanPostDetailId: config.credentials?.japan_post_detail_id || 0,
    };

    return Shop.create({
      shopifyShopId: ShopifyShopId.from(config.shopify_shop_id),
      storeId: config.store_id,
      environments,
      credentials,
    });
  }
}
