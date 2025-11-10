/**
 * 設定ファイル管理ユーティリティ
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { ShopsConfig, ShopConfig } from '../../types/index';

const CONFIG_DIR = path.join(__dirname, '../../../config');
const SHOPS_CONFIG_PATH = path.join(CONFIG_DIR, 'shops.yaml');

/**
 * shops.yamlを読み込む
 */
export function loadShopsConfig(): ShopsConfig {
  if (!fs.existsSync(SHOPS_CONFIG_PATH)) {
    throw new Error(`設定ファイルが見つかりません: ${SHOPS_CONFIG_PATH}`);
  }

  const content = fs.readFileSync(SHOPS_CONFIG_PATH, 'utf-8');
  return yaml.load(content) as ShopsConfig;
}

/**
 * 指定されたShopの設定を取得
 */
export function loadShopConfig(shopName: string): ShopConfig {
  const config = loadShopsConfig();

  if (!config.shops[shopName]) {
    throw new Error(
      `Shop "${shopName}" が見つかりません。利用可能なShop: ${Object.keys(config.shops).join(', ')}`
    );
  }

  return config.shops[shopName];
}

/**
 * 設定されている全Shopのリストを取得
 */
export function listShops(): string[] {
  const config = loadShopsConfig();
  return Object.keys(config.shops);
}

/**
 * 指定されたShopが存在するか確認
 */
export function shopExists(shopName: string): boolean {
  const config = loadShopsConfig();
  return shopName in config.shops;
}
