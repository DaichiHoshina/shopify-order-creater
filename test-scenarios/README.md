# 📦 Shopify Order Creator - テストシナリオ集

## 📖 概要

このディレクトリには、プラスシッピングの配送料金計算・キャンペーン適用テストのための注文データ（JSON形式）が格納されています。

**合計47個のテストシナリオ** を用意しており、様々なテスト観点をカバーしています。

## 📁 ディレクトリ構成

```
test-scenarios/
├── campaign/           # キャンペーン関連テスト（5個）
│   ├── coupon-single-yamato.json
│   ├── coupon-single-sagawa.json
│   ├── coupon-bulk.json
│   ├── coupon-sagawa-only.json
│   └── coupon-remaining-zero.json
├── shipping-area/      # 配送エリアパターン（20個）
│   ├── tokyo-to-osaka.json
│   ├── tokyo-to-okinawa.json
│   ├── tokyo-to-hokkaido.json
│   ├── hokkaido-to-tokyo.json
│   ├── tokyo-to-tokyo.json
│   └── ... (その他15個)
├── service-type/       # 便種パターン（15個）
│   ├── yamato-takkyubin.json         # ヤマト運輸 宅急便
│   ├── yamato-nekopos.json           # ヤマト運輸 ネコポス
│   ├── yamato-dm.json                # ヤマト運輸 DM便
│   ├── yamato-yu-packet.json         # ヤマト運輸 クロネコゆうパケット
│   ├── yamato-compact.json           # ヤマト運輸 宅急便コンパクト
│   ├── yamato-cool-chilled.json      # ヤマト運輸 宅急便（冷蔵）
│   ├── yamato-cool-frozen.json       # ヤマト運輸 宅急便（冷凍）
│   ├── sagawa-land-sg000.json        # 佐川急便 飛脚宅配便（SG:000）
│   ├── sagawa-sg140.json             # 佐川急便 飛脚宅配便（SG:140）
│   ├── sagawa-sg150.json             # 佐川急便 飛脚宅配便（SG:150）
│   ├── sagawa-cool-chilled.json      # 佐川急便 飛脚クール便（冷蔵）
│   ├── sagawa-cool-frozen.json       # 佐川急便 飛脚クール便（冷凍）
│   ├── japanpost-yupack-pickup.json  # 日本郵便 ゆうパック（集荷）
│   ├── japanpost-yupack-dropoff.json # 日本郵便 ゆうパック（持込）
│   └── japanpost-cool.json           # 日本郵便 ゆうパッククール便
├── packing-size/       # 梱包サイズパターン（4個）
│   ├── size-60.json
│   ├── size-80.json
│   ├── size-100.json
│   └── size-120.json
├── boundary/           # 境界値テスト（3個）
│   ├── remaining-count-1.json
│   ├── campaign-start-edge.json
│   └── campaign-end-edge.json
└── README.md           # このファイル
```

## 🎯 テスト観点一覧

### 1. キャンペーン関連（campaign/）

| ファイル名 | テストID | 概要 |
|----------|---------|------|
| coupon-single-yamato.json | TC-CALC-001 | 単品購入×ヤマト運輸でクーポン適用 |
| coupon-single-sagawa.json | TC-CALC-002 | 単品購入×佐川急便（SG:000）でクーポン適用 |
| coupon-bulk.json | TC-CALC-005 | 一括購入でクーポン非適用 |
| coupon-sagawa-only.json | TC-CALC-003 | 佐川限定クーポン×ヤマト運輸で非適用 |
| coupon-remaining-zero.json | TC-CALC-006 | 残回数0でクーポン非適用 |

### 2. 配送エリアパターン（shipping-area/）

全国の主要都市間の配送パターンをカバー：

- **通常エリア**: 東京→大阪、神奈川→千葉など
- **離島エリア**: 東京→沖縄（高額料金）
- **北海道**: 東京→北海道、北海道→東京
- **同一都道府県**: 東京→東京、大阪→大阪
- **長距離**: 北海道→沖縄（最長距離・最高額）
- **各地方**: 東北、北陸、中部、関西、中国、四国、九州

### 3. 便種パターン（service-type/）

#### ヤマト運輸（7種類）

| ファイル名 | サービス名 | 特徴 |
|----------|----------|------|
| yamato-takkyubin.json | 宅急便 | 標準サービス |
| yamato-nekopos.json | ネコポス | 全国一律料金 |
| yamato-dm.json | DM便 | 全国一律料金 |
| yamato-yu-packet.json | クロネコゆうパケット | 全国一律料金 |
| yamato-compact.json | 宅急便コンパクト | 小型荷物向け |
| yamato-cool-chilled.json | 宅急便（冷蔵） | クール便・冷蔵 |
| yamato-cool-frozen.json | 宅急便（冷凍） | クール便・冷凍 |

#### 佐川急便（5種類）

| ファイル名 | サービス名 | 特徴 |
|----------|----------|------|
| sagawa-land-sg000.json | 飛脚宅配便（SG:000） | 標準陸便 |
| sagawa-sg140.json | 飛脚宅配便（SG:140） | オプションサービス |
| sagawa-sg150.json | 飛脚宅配便（SG:150） | オプションサービス |
| sagawa-cool-chilled.json | 飛脚クール便（冷蔵） | クール便・冷蔵 |
| sagawa-cool-frozen.json | 飛脚クール便（冷凍） | クール便・冷凍 |

#### 日本郵便（3種類）

| ファイル名 | サービス名 | 特徴 |
|----------|----------|------|
| japanpost-yupack-pickup.json | ゆうパック（集荷） | 集荷サービス |
| japanpost-yupack-dropoff.json | ゆうパック（持込） | 持込割引 |
| japanpost-cool.json | ゆうパッククール便 | クール便 |

### 4. 梱包サイズパターン（packing-size/）

| ファイル名 | サイズ | 重量制限 | 用途 |
|----------|-------|---------|------|
| size-60.json | 60cm | 2kg以内 | 小型荷物 |
| size-80.json | 80cm | 5kg以内 | 中型荷物 |
| size-100.json | 100cm | 10kg以内 | 大型荷物 |
| size-120.json | 120cm | 15kg以内 | 特大荷物 |

### 5. 境界値テスト（boundary/）

| ファイル名 | テストID | 概要 |
|----------|---------|------|
| remaining-count-1.json | BOUNDARY-001 | クーポン残回数1→0の遷移 |
| campaign-start-edge.json | BOUNDARY-002 | キャンペーン開始日時の境界 |
| campaign-end-edge.json | BOUNDARY-003 | キャンペーン終了日時の境界 |

## 🚀 使い方

### 基本的な使い方

```bash
# 単一のテストシナリオで注文を作成
npm start create-custom -- --data-file test-scenarios/campaign/coupon-single-yamato.json

# 配送エリアテスト（東京→大阪）
npm start create-custom -- --data-file test-scenarios/shipping-area/tokyo-to-osaka.json

# 便種テスト（佐川急便SG:000）
npm start create-custom -- --data-file test-scenarios/service-type/sagawa-land-sg000.json
```

### 複数シナリオの一括実行

```bash
# キャンペーン関連のテストを全て実行
for file in test-scenarios/campaign/*.json; do
  echo "Testing: $file"
  npm start create-custom -- --data-file "$file"
  sleep 2
done

# 配送エリアテストを全て実行
for file in test-scenarios/shipping-area/*.json; do
  echo "Testing: $file"
  npm start create-custom -- --data-file "$file"
  sleep 2
done
```

### JSONファイルの構造

各JSONファイルは以下の構造になっています：

```json
{
  "description": "テストの説明",
  "test_id": "TEST-001",
  "order": {
    // Shopify Order形式のデータ
    "email": "...",
    "line_items": [...],
    "shipping_address": {...},
    "shipping_lines": [...]
  },
  "shipping_metadata": {
    // 配送メタデータ（プラスシッピング固有）
    "carrier": "yamato",
    "service_type": "...",
    "packing_size": 60,
    "consignor_prefecture": "東京都",
    "destination_prefecture": "大阪府"
  },
  "test_expectations": {
    // 期待される結果（テスト検証用）
    "coupon_applied": true,
    "total_shipping_fee": 1
  }
}
```

## 📝 カスタマイズ方法

### 新しいテストシナリオの追加

1. 既存のJSONファイルをコピー
2. 必要な項目を修正
3. `description`と`test_id`をユニークな値に変更

```bash
# 例: 新しい配送エリアテストを作成
cp test-scenarios/shipping-area/tokyo-to-osaka.json \
   test-scenarios/shipping-area/tokyo-to-kyoto.json
```

### 特定の項目のみ変更する場合

```javascript
// jqコマンドを使ってJSONを編集する例
jq '.shipping_address.province = "京都府"' \
  test-scenarios/shipping-area/tokyo-to-osaka.json > \
  test-scenarios/shipping-area/tokyo-to-kyoto.json
```

## 🧪 テスト実施時の注意点

### 1. データベースの準備

テストシナリオによっては、事前にデータベースの準備が必要です：

```sql
-- キャンペーンクーポンの付与（campaign/のテスト用）
INSERT INTO campaign_coupon_statuses (shopify_shop_id, campaign_id, remaining_count)
VALUES ('your-shop.myshopify.com', 6, 5);

-- 料金プランの設定（全テスト共通）
INSERT INTO shop_shipping_fee_plans (shop_id, plan_id, shipping_count)
VALUES ('your-shop.myshopify.com', 1, 0);
```

### 2. 環境変数の設定

`.env`ファイルに必要な情報を設定してください：

```bash
# Shopify店舗情報
SHOPIFY_STORE_URL=your-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx

# DynamoDB設定（オプション）
DEVELOPER_NAME=your-name-in-romaji
AWS_REGION=ap-northeast-1
```

### 3. テスト結果の確認

- **Shopify管理画面**: 注文が正しく作成されているか確認
- **データベース**: クーポン消費履歴、残回数を確認
- **ログ**: エラーログを確認

## 🔍 トラブルシューティング

### エラー: 注文が作成できない

```bash
# 環境変数を確認
cat .env

# アクセストークンの有効性を確認
curl -X GET "https://${SHOPIFY_STORE_URL}/admin/api/2024-01/shop.json" \
  -H "X-Shopify-Access-Token: ${SHOPIFY_ACCESS_TOKEN}"
```

### エラー: クーポンが適用されない

```sql
-- クーポンステータスを確認
SELECT * FROM campaign_coupon_statuses
WHERE shopify_shop_id = 'your-shop.myshopify.com';

-- キャンペーン期間を確認
SELECT id, campaign_type, start_at, end_at
FROM campaigns
WHERE id IN (6, 7);
```

## 📚 関連ドキュメント

- [プロジェクトREADME](../README.md)
- [1円キャンペーン仕様書](/Users/daichi/ghq/gitlab.mitsui.titanweb.cloud/b001/campaign-1yen-specification.md)
- [統合テスト計画書](/Users/daichi/ghq/gitlab.mitsui.titanweb.cloud/b001/campaign-integration-test-plan.md)
- [テストデータ作成ガイド](/Users/daichi/ghq/gitlab.mitsui.titanweb.cloud/b001/test-data-setup-guide.md)

## 📊 テストシナリオ統計

| カテゴリ | ファイル数 | テスト観点 |
|---------|----------|----------|
| キャンペーン | 5 | クーポン適用・非適用パターン |
| 配送エリア | 20 | 全国主要都市間の組み合わせ |
| 便種 | 15 | 3社×複数サービスタイプ |
| 梱包サイズ | 4 | 60cm～120cmの4サイズ |
| 境界値 | 3 | 残回数・期間境界 |
| **合計** | **47** | **包括的なテストカバレッジ** |

---

**作成日**: 2025-11-07
**最終更新日**: 2025-11-07
**バージョン**: 1.0
