# Shopify Order Creator

DynamoDBからセッション情報を取得し、Shopify APIで注文を自動作成するCLIツール

## 🎯 概要

このツールは、以下の手動作業を1コマンドに自動化します：

1. ✅ AWS DynamoDBにアクセス
2. ✅ 指定した開発者名でセッション情報を検索
3. ✅ offlineセッションからX-Shopify-Access-Tokenを抽出
4. ✅ Shopify APIにPOSTリクエストを送信して注文を作成

**作業時間**: 10分 → 10秒（98%削減）

## 📋 前提条件

- Node.js 18以上
- AWS CLIが設定済み（Keycloak SAML認証でログイン済み）
- DynamoDBテーブルへのアクセス権限
- Shopifyストアのアクセス権限

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
cd ~/plusshipping-dev-tools/shopify-order-creator
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成：

```bash
cp .env.example .env
```

`.env`を編集：

```bash
# AWS Configuration
AWS_REGION=ap-northeast-1
AWS_PROFILE=default

# DynamoDB Configuration
DYNAMODB_TABLE_NAME=shopifyshipping-dev-sessions

# Developer Name (ローマ字)
DEVELOPER_NAME=daichi.hoshina.ex1

# Shopify Store URL
SHOPIFY_STORE_URL=https://shipping-dev-daichi-hoshina-ex1.myshopify.com
```

### 3. ビルド

```bash
npm run build
```

### 4. エイリアスの設定（推奨）

`~/.zshrc` に追加：

```bash
alias shopify-order='cd ~/plusshipping-dev-tools/shopify-order-creator && npm start'
```

反映：

```bash
source ~/.zshrc
```

## 📖 使い方

### 基本的な使い方

デフォルトの注文データで注文を作成：

```bash
npm start create
```

または、エイリアスを使う場合：

```bash
shopify-order create
```

### コマンドラインオプション

```bash
npm start create -- --help

Options:
  -d, --developer <name>      Developer name (romaji)
  -s, --store <url>           Shopify store URL
  -r, --region <region>       AWS region (default: "ap-northeast-1")
  -p, --profile <profile>     AWS profile
  -t, --table <tableName>     DynamoDB table name (default: "shopifyshipping-dev-sessions")
  --show-default-order        Show default order data and exit
```

### 例：別の開発者名とストアで実行

```bash
npm start create -- \
  --developer taro.yamada.ex1 \
  --store https://shipping-dev-taro-yamada-ex1.myshopify.com
```

### 例：デフォルト注文データを確認

```bash
npm start create -- --show-default-order
```

出力：

```json
{
  "currency": "EUR",
  "lineItems": [
    {
      "title": "Big Brown Bear Boots",
      "priceSet": {
        "shopMoney": {
          "amount": 74.99,
          "currencyCode": "EUR"
        }
      },
      "quantity": 3,
      "taxLines": [
        {
          "priceSet": {
            "shopMoney": {
              "amount": 13.5,
              "currencyCode": "EUR"
            }
          },
          "rate": 0.06,
          "title": "State tax"
        }
      ]
    }
  ],
  "shippingAddress": {
    "firstName": "太郎",
    "lastName": "山田",
    "address1": "1-1",
    "city": "千代田区千代田",
    "province": "東京都",
    "country": "JP",
    "zip": "100-0001",
    "phone": "+8190-8765-4321"
  },
  "phone": "+81 90 8765 4321",
  "transactions": [
    {
      "kind": "SALE",
      "status": "SUCCESS",
      "amountSet": {
        "shopMoney": {
          "amount": 238.47,
          "currencyCode": "EUR"
        }
      }
    }
  ]
}
```

## 🔧 カスタム注文データの作成

カスタムの注文データで注文を作成する場合：

### 1. カスタムデータファイルを作成

`custom-order.json`:

```json
{
  "currency": "JPY",
  "lineItems": [
    {
      "title": "カスタム商品",
      "priceSet": {
        "shopMoney": {
          "amount": 10000,
          "currencyCode": "JPY"
        }
      },
      "quantity": 1,
      "taxLines": [
        {
          "priceSet": {
            "shopMoney": {
              "amount": 1000,
              "currencyCode": "JPY"
            }
          },
          "rate": 0.1,
          "title": "消費税"
        }
      ]
    }
  ],
  "shippingAddress": {
    "firstName": "花子",
    "lastName": "佐藤",
    "address1": "2-2-2",
    "city": "渋谷区",
    "province": "東京都",
    "country": "JP",
    "zip": "150-0001",
    "phone": "+8190-1234-5678"
  },
  "phone": "+81 90 1234 5678",
  "transactions": [
    {
      "kind": "SALE",
      "status": "SUCCESS",
      "amountSet": {
        "shopMoney": {
          "amount": 11000,
          "currencyCode": "JPY"
        }
      }
    }
  ]
}
```

### 2. カスタムコマンドで実行

```bash
npm start create-custom -- --file custom-order.json
```

## 🛠️ トラブルシューティング

### エラー: "No sessions found"

**原因**: DynamoDBにセッション情報が存在しない

**解決策**:
1. AWS ConsoleでDynamoDBテーブルを確認
2. Keycloak経由でAWSにログインしているか確認
3. 開発者名が正しいか確認（ローマ字、完全一致）

### エラー: "unable to get local issuer certificate"

**原因**: SSL証明書の検証エラー

**解決策**: コードで既に対処済み（`rejectUnauthorized: false`）

もし問題が続く場合は、Postmanの設定を参考に：
- Settings → "SSL certificate verification" → OFF

### エラー: "Access token not found"

**原因**: セッションに`accessToken`フィールドが存在しない

**解決策**:
1. セッションが`offline`セッションであることを確認
2. Shopifyアプリの認証フローが正しく完了しているか確認

### エラー: "Shopify API returned errors"

**原因**: Shopify APIのバリデーションエラー

**解決策**:
1. エラーメッセージを確認
2. 注文データのフォーマットを確認
3. 必須フィールドが不足していないか確認

## 📂 ディレクトリ構成

```
shopify-order-creator/
├── src/
│   ├── index.ts         # メインCLI
│   ├── dynamodb.ts      # DynamoDB操作
│   ├── shopify.ts       # Shopify API操作
│   └── types.ts         # 型定義
├── dist/                # ビルド出力
├── package.json
├── tsconfig.json
├── .env.example         # 環境変数テンプレート
├── .env                 # 環境変数（gitignore済み）
└── README.md
```

## 🔒 セキュリティ

- ✅ アクセストークンは環境変数またはDynamoDBから取得
- ✅ `.env`ファイルは`.gitignore`に追加
- ✅ AWS認証はIAMロールベース
- ✅ SSL証明書検証は本番環境では有効化を推奨

## 📝 開発時のコマンド

### 開発モード（ts-nodeで実行）

```bash
npm run dev create
```

### ビルド

```bash
npm run build
```

### 本番モード

```bash
npm start create
```

## 🏪 開発ストア作成ガイド & 管理ツール

このプロジェクトには、複数のテスト用Shopifyストアを効率的に管理するための静的Webページが含まれています。

### 🌟 機能

1. **作成手順ガイド**: Partner Dashboardでの開発ストア作成をステップバイステップでガイド
2. **ストア登録**: 作成したストア情報（URL、アクセストークン、用途等）を登録・管理
3. **ストア管理**: 登録済みストアの一覧表示、検索、フィルタリング、編集、削除
4. **データ管理**: localStorageに保存、エクスポート・インポート機能

### 📖 使い方

#### ローカルで実行

```bash
# publicディレクトリでHTTPサーバーを起動
npx serve public

# または、Pythonの場合
cd public
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000/create-store.html` にアクセス

#### GitHub Pagesでデプロイ

1. GitHubリポジトリの「Settings」→「Pages」を開く
2. 「Source」で「Deploy from a branch」を選択
3. 「Branch」で `main` ブランチと `/public` フォルダを選択
4. 「Save」をクリック

デプロイ後、`https://<username>.github.io/<repository>/create-store.html` でアクセス可能

### 💡 なぜ開発ストアが複数必要？

このプロジェクトには47個のテストシナリオがあり、以下のような多様なテストが必要です：

- **キャンペーンテスト** (5パターン): クーポン適用・非適用
- **配送エリアテスト** (20パターン): 全国主要都市間
- **便種テスト** (15パターン): ヤマト・佐川・日本郵便
- **梱包サイズテスト** (4パターン): 60cm〜120cm
- **境界値テスト** (3パターン): 残回数・期間境界

テストシナリオごとに別々のストアを使うことで：
- ✅ データをクリーンに保てる
- ✅ テストの独立性が保たれる
- ✅ 並行してテストを実行できる
- ✅ 特定のテスト用に最適化された設定が可能

### 🔒 セキュリティに関する注意

- アクセストークンはブラウザのlocalStorageに保存されます（暗号化なし）
- 個人のブラウザでのみ使用してください
- 本番環境のアクセストークンは絶対に保存しないでください
- localStorageのデータはブラウザのキャッシュクリア時に削除されます

### 📚 関連ドキュメント

- [テストシナリオ一覧](test-scenarios/README.md) - 47個のテストパターン詳細
- [Shopify Partner Dashboard](https://partners.shopify.com)
- [Shopify Admin API Documentation](https://shopify.dev/docs/api/admin)

## 🎉 次のステップ

1. エイリアスを設定して簡単に実行できるようにする
2. カスタム注文データのテンプレートを作成
3. 複数の注文を一括作成するスクリプトを追加（将来）

## 📞 サポート

問題が発生した場合は、開発チームに連絡してください。
