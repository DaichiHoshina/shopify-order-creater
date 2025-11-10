/**
 * テンプレートファイルを一括更新するスクリプト
 * - 配送先を各エリアの県庁に設定（locations.jsonから読み込み）
 * - 配送元は統一（Plus shippingで設定）
 * - アイテム個数を100に変更
 * - タグは「配送先:エリア名」のみ
 * - 商品名も「配送先:エリア名」に設定
 */

import * as fs from 'fs';
import * as path from 'path';

// 統一配送元住所（Plus shippingで設定される想定）
const UNIFIED_CONSIGNOR = {
  zip: '135-0061',
  prefecture: '東京都',
  city: '江東区',
  address: '豊洲３丁目３−３ 豊洲センタービル'
};

// locations.jsonから住所データを読み込み
const locationsPath = path.join(__dirname, '../data/locations.json');
const locationsData = JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));

// エリア名マッピング
const AREA_NAME_MAP: Record<string, string> = {
  'hokkaido': '北海道',
  'kita-tohoku': '北東北',
  'minami-tohoku': '南東北',
  'kanto': '関東',
  'shinetsu': '信越',
  'hokuriku': '北陸',
  'chubu': '中部',
  'kansai': '関西',
  'chugoku': '中国',
  'shikoku': '四国',
  'kita-kyushu': '北九州',
  'minami-kyushu': '南九州',
  'okinawa': '沖縄'
};

// ファイル名マッピング
const FILE_NAME_MAP: Record<string, string> = {
  'hokkaido': 'hokkaido-to-tokyo.json',
  'kita-tohoku': 'kita-tohoku-to-tokyo.json',
  'minami-tohoku': 'minami-tohoku-to-tokyo.json',
  'kanto': 'kanto-to-tokyo.json',
  'shinetsu': 'shinetsu-to-tokyo.json',
  'hokuriku': 'hokuriku-to-tokyo.json',
  'chubu': 'chubu-to-tokyo.json',
  'kansai': 'kansai-to-tokyo.json',
  'chugoku': 'chugoku-to-tokyo.json',
  'shikoku': 'shikoku-to-tokyo.json',
  'kita-kyushu': 'kita-kyushu-to-tokyo.json',
  'minami-kyushu': 'minami-kyushu-to-tokyo.json',
  'okinawa': 'okinawa-to-tokyo.json',
};

// エリアコードマッピング
const AREA_CODE_MAP: Record<string, string> = {
  'hokkaido': '01',
  'kita-tohoku': '02',
  'minami-tohoku': '03',
  'kanto': '04',
  'shinetsu': '05',
  'hokuriku': '06',
  'chubu': '07',
  'kansai': '08',
  'chugoku': '09',
  'shikoku': '10',
  'kita-kyushu': '11',
  'minami-kyushu': '12',
  'okinawa': '13',
};

interface LocationData {
  area: string;
  name: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  province_code: string;
  zip: string;
  country_code: string;
  phone: string;
}

async function updateTemplate(locationData: LocationData) {
  const area = locationData.area;
  const filename = FILE_NAME_MAP[area];
  const areaName = AREA_NAME_MAP[area];
  const areaCode = AREA_CODE_MAP[area];
  const areaTag = `配送先:${areaName}`;

  const templatePath = path.join(
    __dirname,
    '..',
    'test-scenarios',
    'consignor-area',
    filename
  );

  console.log(`\n📝 ${filename} を更新中...`);

  // テンプレートファイルを読み込み
  const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

  // 更新
  templateData.description = `配送先エリアテスト: ${areaName}`;
  templateData.order.note = `テスト注文: ${areaName}配送`;

  // タグは1個だけ（配送先:エリア名）
  templateData.order.tags = areaTag;

  // アイテム個数を100に、商品名も「配送先:エリア名」に
  if (templateData.order.line_items && templateData.order.line_items.length > 0) {
    templateData.order.line_items[0].quantity = 100;
    templateData.order.line_items[0].title = areaTag;
  }

  // 配送先を各エリアの県庁に（locations.jsonから）
  // "北海道配送センター（北海道庁）" → "北海道庁"
  const match = locationData.name.match(/（(.+)）$/);
  const companyName = match ? match[1] : locationData.name;

  templateData.order.shipping_address = {
    first_name: companyName,
    last_name: '担当者',
    company: companyName,
    address1: locationData.address1,
    address2: locationData.address2 || null,
    city: locationData.city,
    province: locationData.province,
    province_code: locationData.province_code,
    country: 'Japan',
    country_code: locationData.country_code,
    zip: locationData.zip,
    phone: locationData.phone,
  };

  // shipping_metadataを更新（配送元は統一）
  if (templateData.shipping_metadata) {
    templateData.shipping_metadata.consignor_prefecture = UNIFIED_CONSIGNOR.prefecture;
    templateData.shipping_metadata.consignor_city = UNIFIED_CONSIGNOR.city;
    templateData.shipping_metadata.destination_prefecture = locationData.province;
    templateData.shipping_metadata.area_classification = `${areaName}エリア`;
    templateData.shipping_metadata.area_code = areaCode;
  }

  // ファイルに保存
  fs.writeFileSync(templatePath, JSON.stringify(templateData, null, 2));
  console.log(`   ✅ 更新完了`);
  console.log(`   - 配送元: ${UNIFIED_CONSIGNOR.prefecture} ${UNIFIED_CONSIGNOR.city}（Plus shippingで設定）`);
  console.log(`   - 配送先: ${locationData.province} ${locationData.city}`);
  console.log(`   - 住所1: ${locationData.address1}`);
  console.log(`   - 個数: 100個`);
  console.log(`   - 商品名: ${areaTag}`);
  console.log(`   - タグ: ${areaTag}`);
}

async function main() {
  console.log('🚀 13エリアのテンプレートファイルを一括更新します');
  console.log('   - 配送先: 各エリアの県庁（locations.jsonから読み込み）');
  console.log('   - 配送元: 統一（東京都 江東区 豊洲センタービル - Plus shippingで設定）');
  console.log('   - タグ: 配送先:エリア名のみ');
  console.log('   - 商品名: 配送先:エリア名\n');

  for (const locationData of locationsData) {
    await updateTemplate(locationData);
  }

  console.log('\n\n🎉 全13件のテンプレートファイル更新が完了しました！\n');
}

// スクリプトを実行
main().catch((error) => {
  console.error('❌ 予期しないエラーが発生しました:', error);
  process.exit(1);
});
