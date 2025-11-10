/**
 * Shopifyストアに13配送元エリアのLocationを作成するスクリプト
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';

// .env ファイルを読み込み
dotenv.config();

// 環境変数から設定を取得
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ エラー: .env ファイルに SHOPIFY_STORE_URL と SHOPIFY_ACCESS_TOKEN を設定してください');
  process.exit(1);
}

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

/**
 * ShopifyのGraphQL APIでLocationを作成
 */
async function createLocation(
  storeUrl: string,
  accessToken: string,
  locationData: LocationData
): Promise<any> {
  const domain = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const apiUrl = `https://${domain}/admin/api/2024-10/graphql.json`;

  console.log(`📦 Creating location: ${locationData.name}`);
  console.log(`   住所: ${locationData.province} ${locationData.city} ${locationData.address1}`);

  const mutation = `
    mutation locationAdd($input: LocationAddInput!) {
      locationAdd(input: $input) {
        location {
          id
          name
          address {
            address1
            address2
            city
            province
            zip
            country
            phone
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      name: locationData.name,
      address: {
        address1: locationData.address1,
        address2: locationData.address2,
        city: locationData.city,
        provinceCode: locationData.province_code,
        countryCode: locationData.country_code,
        zip: locationData.zip,
        phone: locationData.phone,
      },
    },
  };

  try {
    const response = await axios.post(
      apiUrl,
      {
        query: mutation,
        variables,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );

    if (response.data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }

    const { locationAdd } = response.data.data;

    if (locationAdd.userErrors && locationAdd.userErrors.length > 0) {
      const errorMessages = locationAdd.userErrors.map((e: any) => `${e.message} (${e.field})`).join(', ');
      throw new Error(`Shopify validation errors: ${errorMessages}`);
    }

    return locationAdd.location;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('   ❌ Axios Error:', error.response?.data || error.message);
      throw new Error(`Failed to create location: ${error.response?.data?.errors || error.message}`);
    }
    throw error;
  }
}

/**
 * 既存のLocationを取得（GraphQL）
 */
async function getExistingLocations(
  storeUrl: string,
  accessToken: string
): Promise<any[]> {
  const domain = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const apiUrl = `https://${domain}/admin/api/2024-10/graphql.json`;

  const query = `
    query {
      locations(first: 50) {
        nodes {
          id
          name
          address {
            address1
            city
            province
            zip
            country
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      apiUrl,
      { query },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );

    if (response.data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data.data.locations.nodes || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('   ❌ Axios Error:', error.response?.data || error.message);
      throw new Error(`Failed to get locations: ${error.response?.data?.errors || error.message}`);
    }
    throw error;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 Shopifyストアに13配送元エリアのLocationを作成します\n');
  console.log(`📍 ストア: ${SHOPIFY_STORE_URL}`);
  console.log(`🔑 アクセストークン: ${SHOPIFY_ACCESS_TOKEN?.substring(0, 10)}...\n`);

  // 既存のLocationを確認
  console.log('📋 既存のLocationを確認中...\n');
  const existingLocations = await getExistingLocations(SHOPIFY_STORE_URL!, SHOPIFY_ACCESS_TOKEN!);
  console.log(`   既存Location数: ${existingLocations.length}件\n`);

  if (existingLocations.length > 0) {
    console.log('   既存のLocation一覧:');
    existingLocations.forEach((loc) => {
      console.log(`   - ${loc.name} (ID: ${loc.id})`);
    });
    console.log('\n');
  }

  // Locationデータを読み込み
  const locationsPath = path.join(__dirname, '..', 'data', 'locations.json');
  const locationsData: LocationData[] = JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));

  const results: any[] = [];
  let successCount = 0;
  let skipCount = 0;
  let failureCount = 0;

  for (let i = 0; i < locationsData.length; i++) {
    const locationData = locationsData[i];
    console.log(`\n[${i + 1}/${locationsData.length}] 📦 ${locationData.area} を処理中...`);

    // 既に同じ名前のLocationが存在するかチェック
    const existing = existingLocations.find((loc) => loc.name === locationData.name);
    if (existing) {
      console.log(`   ⏭️  スキップ: 既に存在します (ID: ${existing.id})`);
      results.push({
        area: locationData.area,
        name: locationData.name,
        skipped: true,
        locationId: existing.id,
      });
      skipCount++;
      continue;
    }

    try {
      const location = await createLocation(SHOPIFY_STORE_URL!, SHOPIFY_ACCESS_TOKEN!, locationData);
      console.log(`   ✅ 成功！Location ID: ${location.id}`);

      results.push({
        area: locationData.area,
        name: locationData.name,
        success: true,
        locationId: location.id,
      });

      successCount++;

      // API レート制限を考慮して3秒待機
      if (i < locationsData.length - 1) {
        console.log(`   ⏳ 3秒待機中...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`   ❌ 失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);

      results.push({
        area: locationData.area,
        name: locationData.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      failureCount++;

      // エラーが発生しても3秒待機
      if (i < locationsData.length - 1) {
        console.log(`   ⏳ 3秒待機中...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  // 結果サマリーを表示
  console.log('\n\n📊 ===== 実行結果サマリー =====\n');
  console.log(`✅ 成功: ${successCount}件`);
  console.log(`⏭️  スキップ: ${skipCount}件`);
  console.log(`❌ 失敗: ${failureCount}件`);
  console.log(`📦 合計: ${locationsData.length}件\n`);

  // 詳細結果
  console.log('📋 詳細結果:\n');
  results.forEach((result, index) => {
    const status = result.skipped ? '⏭️ ' : result.success ? '✅' : '❌';
    const detail = result.skipped
      ? `既存 Location ID: ${result.locationId}`
      : result.success
      ? `Location ID: ${result.locationId}`
      : `Error: ${result.error}`;
    console.log(`${status} [${index + 1}] ${result.name}`);
    console.log(`   ${detail}\n`);
  });

  // Location IDマッピングをJSON出力
  const locationMapping: { [key: string]: string } = {};
  results.forEach((result) => {
    if (result.success || result.skipped) {
      locationMapping[result.area] = result.locationId;
    }
  });

  const mappingPath = path.join(__dirname, '..', 'data', 'location-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(locationMapping, null, 2));
  console.log(`\n💾 Location IDマッピングを保存しました: ${mappingPath}\n`);

  if (successCount + skipCount === locationsData.length) {
    console.log('🎉 全13件のLocation作成/確認が完了しました！\n');
  } else {
    console.log(`⚠️ ${failureCount}件のLocationが失敗しました。\n`);
  }
}

// スクリプトを実行
main().catch((error) => {
  console.error('❌ 予期しないエラーが発生しました:', error);
  process.exit(1);
});
