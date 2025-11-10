# Plus Shipping CLI (`ps-cli`)

Plus Shipping 店舗管理用のコマンドラインツールです。配送元データの管理、Shopify注文の一括作成、Kubernetes環境へのデプロイを統合的に行えます。

## 目次

- [セットアップ](#セットアップ)
- [設定ファイル](#設定ファイル)
- [コマンド一覧](#コマンド一覧)
  - [shops - Shop一覧表示](#shops---shop一覧表示)
  - [shop-info - Shop詳細情報表示](#shop-info---shop詳細情報表示)
  - [consignor generate - 配送元SQL生成](#consignor-generate---配送元sql生成)
  - [consignor deploy - 配送元データデプロイ](#consignor-deploy---配送元データデプロイ)
  - [consignor rollback - 配送元データロールバック](#consignor-rollback---配送元データロールバック)
  - [order-create - Shopify注文一括作成](#order-create---shopify注文一括作成)
- [使用例](#使用例)

---

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. TypeScriptビルド（本番用）

```bash
npm run build
```

### 3. 開発環境での実行

```bash
npm run cli -- <command> [options]
```

### 4. 本番環境での実行（ビルド後）

```bash
npm link  # グローバルにインストール
ps-cli <command> [options]
```

---

## 設定ファイル

### `config/shops.yaml`

各Shopの設定とKubernetes環境情報を管理します。

```yaml
shops:
  81-test-store-plan-silver:
    shopify_shop_id: "81-test-store-plan-silver.myshopify.com"
    store_id: 404
    environments:
      tes:
        namespace: "store"
        context: "arn:aws:eks:ap-northeast-1:691177763108:cluster/shopifyshipping-tes-main"
        db_name: "store_management"
        db_config_map: "store-management-env"
        db_secret: "store-management-env"
    credentials:
      sagawa_detail_id: 556
      yamato_detail_id: 528
      japan_post_detail_id: 0
```

---

## コマンド一覧

### `shops` - Shop一覧表示

利用可能なShopの一覧を表示します。

```bash
npm run cli -- shops
```

**出力例:**
```
📋 利用可能なShop一覧
  - 81-test-store-plan-silver
```

---

### `shop-info` - Shop詳細情報表示

指定したShopの詳細情報を表示します。

```bash
npm run cli -- shop-info --shop <shop-name>
```

**オプション:**
- `-s, --shop <shop>` (必須): Shop名

**使用例:**
```bash
npm run cli -- shop-info --shop 81-test-store-plan-silver
```

**出力例:**
```
📋 Shop情報: 81-test-store-plan-silver

基本情報
  Shopify Shop ID: 81-test-store-plan-silver.myshopify.com
  Store ID: 404

環境情報

  TES:
    Namespace: store
    Context: arn:aws:eks:ap-northeast-1:691177763108:cluster/shopifyshipping-tes-main
    DB Name: store_management
    ConfigMap: store-management-env
    Secret: store-management-env

配送業者認証情報
  佐川急便 Detail ID: 556
  ヤマト運輸 Detail ID: 528
```

---

### `consignor generate` - 配送元SQL生成

13エリアの配送元データを登録するSQLファイルを生成します。

```bash
npm run cli -- consignor generate --shop <shop-name> [options]
```

**オプション:**
- `-s, --shop <shop>` (必須): Shop名
- `-t, --test-data`: テストデータモード（`application_status: accepted`、既存detail_id使用）
- `-o, --output <dir>`: 出力ディレクトリ（デフォルト: `sql-output-store-management/`）

**使用例:**

1. テストデータ用SQLを生成:
```bash
npm run cli -- consignor generate --shop 81-test-store-plan-silver --test-data
```

2. 本番用SQLを生成（`application_status: not_applied`）:
```bash
npm run cli -- consignor generate --shop 81-test-store-plan-silver
```

**出力:**
```
📦 Plus Shipping 配送元SQL生成
✓ Shop: 81-test-store-plan-silver.myshopify.com
ℹ Store ID: 404
✓ SQLファイルを生成しました: /path/to/insert_test_consignors.sql
⚠ テストデータモード: 既存のdetail_idを使用しています

📊 生成内容
  - 配送元数: 13エリア
  - application_status: accepted
```

---

### `consignor deploy` - 配送元データデプロイ

生成した配送元データをKubernetes環境のDBに直接デプロイします。

```bash
npm run cli -- consignor deploy --shop <shop-name> --env <env> [options]
```

**オプション:**
- `-s, --shop <shop>` (必須): Shop名
- `-e, --env <env>` (必須): 環境名（`tes`, `stg`, `prd`等）
- `--dry-run`: Dry-runモード（SQLのみ表示、実行しない）

**使用例:**

1. テスト環境にデプロイ:
```bash
npm run cli -- consignor deploy --shop 81-test-store-plan-silver --env tes
```

2. Dry-runモード（SQL確認のみ）:
```bash
npm run cli -- consignor deploy --shop 81-test-store-plan-silver --env tes --dry-run
```

**動作:**
- Kubernetesコンテキストを自動切り替え
- MySQLクライアントPodを確保
- DB接続情報を取得（ConfigMap + Secret）
- SQLを実行
- 登録データを確認
- 元のコンテキストに復元

---

### `consignor rollback` - 配送元データロールバック

デプロイした配送元データを削除します（ロールバック用）。

```bash
npm run cli -- consignor rollback --shop <shop-name> --env <env>
```

**オプション:**
- `-s, --shop <shop>` (必須): Shop名
- `-e, --env <env>` (必須): 環境名

**使用例:**
```bash
npm run cli -- consignor rollback --shop 81-test-store-plan-silver --env tes
```

**動作:**
- 13エリアの配送元データを削除
- 確認プロンプトが表示されます

---

### `order-create` - Shopify注文一括作成

13エリアの配送元パターンでShopify注文を一括作成します。

```bash
npm run cli -- order-create --shop <shop-name> [options]
```

**オプション:**
- `-s, --shop <shop>` (必須): Shop名
- `-t, --access-token <token>`: Shopifyアクセストークン（環境変数 `SHOPIFY_ACCESS_TOKEN` でも設定可）
- `-a, --areas <areas...>`: 作成するエリア（例: `hokkaido-to-tokyo kanto-to-tokyo`）
- `--dry-run`: Dry-runモード（実際には注文を作成しない）

**エリア一覧:**
- `hokkaido-to-tokyo` - 北海道
- `kita-tohoku-to-tokyo` - 北東北
- `minami-tohoku-to-tokyo` - 南東北
- `kanto-to-tokyo` - 関東
- `shinetsu-to-tokyo` - 信越
- `hokuriku-to-tokyo` - 北陸
- `chubu-to-tokyo` - 中部
- `kansai-to-tokyo` - 関西
- `chugoku-to-tokyo` - 中国
- `shikoku-to-tokyo` - 四国
- `kyushu-to-tokyo` - 九州
- `okinawa-to-tokyo` - 沖縄
- `remote-island-to-tokyo` - 離島

**使用例:**

1. 全13エリアの注文を作成（対話式）:
```bash
export SHOPIFY_ACCESS_TOKEN="shpat_xxxxx"
npm run cli -- order-create --shop 81-test-store-plan-silver
```

2. 特定エリアのみ作成:
```bash
npm run cli -- order-create --shop 81-test-store-plan-silver -a hokkaido-to-tokyo kanto-to-tokyo
```

3. Dry-runモード:
```bash
npm run cli -- order-create --shop 81-test-store-plan-silver --dry-run
```

**動作:**
- 各エリアのテンプレートファイル（`test-scenarios/consignor-area/`）を読み込み
- Shopify API形式に変換
- 注文を作成
- APIレート制限のため、各注文間で10秒待機
- 最終結果を表示（成功/失敗件数）

---

## 使用例

### 典型的なワークフロー

#### 1. 新しいShopのセットアップ

```bash
# 1. Shop一覧を確認
npm run cli -- shops

# 2. Shop情報を確認
npm run cli -- shop-info --shop 81-test-store-plan-silver

# 3. テストデータ用の配送元SQLを生成
npm run cli -- consignor generate --shop 81-test-store-plan-silver --test-data

# 4. テスト環境にデプロイ（Dry-run）
npm run cli -- consignor deploy --shop 81-test-store-plan-silver --env tes --dry-run

# 5. テスト環境にデプロイ（実行）
npm run cli -- consignor deploy --shop 81-test-store-plan-silver --env tes
```

#### 2. 注文テストデータ作成

```bash
# 環境変数設定
export SHOPIFY_ACCESS_TOKEN="shpat_xxxxx"

# 全13エリアの注文を作成
npm run cli -- order-create --shop 81-test-store-plan-silver
```

#### 3. ロールバック

```bash
# 配送元データを削除
npm run cli -- consignor rollback --shop 81-test-store-plan-silver --env tes
```

---

## トラブルシューティング

### Kubernetesコンテキストエラー

```bash
# 現在のコンテキストを確認
kubectl config current-context

# 利用可能なコンテキストを確認
kubectl config get-contexts
```

### DB接続エラー

- `config/shops.yaml` のConfigMap名、Secret名が正しいか確認
- Kubernetes環境にアクセス権限があるか確認

### テンプレートファイルが見つからない

- `test-scenarios/consignor-area/` ディレクトリにテンプレートファイルが存在するか確認

---

## アーキテクチャ

### ディレクトリ構成

```
src/
├── cli/
│   ├── index.ts              # CLIメインエントリーポイント
│   ├── commands/
│   │   ├── consignor.ts      # 配送元関連コマンド
│   │   ├── order.ts          # 注文作成関連コマンド
│   │   └── shop.ts           # Shop情報管理コマンド
│   └── utils/
│       ├── config.ts         # 設定ファイル管理
│       ├── kubernetes.ts     # Kubernetes操作
│       └── logger.ts         # ロガー
├── generators/
│   └── consignor-sql.ts      # SQL生成ジェネレーター
└── types/
    └── index.ts              # 型定義

config/
└── shops.yaml                # Shop設定ファイル

test-scenarios/
└── consignor-area/          # 13エリアの注文テンプレート
```

### 技術スタック

- **CLI Framework**: commander
- **対話式プロンプト**: inquirer
- **ターミナル装飾**: chalk, ora
- **YAML解析**: js-yaml
- **Kubernetes操作**: kubectl (CLI)
- **TypeScript**: 厳格な型付け

---

## 開発者向け

### 新しいShopの追加

`config/shops.yaml` に新しいエントリを追加:

```yaml
shops:
  new-shop-name:
    shopify_shop_id: "new-shop.myshopify.com"
    store_id: 999
    environments:
      tes:
        namespace: "store"
        context: "your-kubernetes-context"
        db_name: "store_management"
        db_config_map: "store-management-env"
        db_secret: "store-management-env"
    credentials:
      sagawa_detail_id: 0
      yamato_detail_id: 0
      japan_post_detail_id: 0
```

### 新しいコマンドの追加

1. `src/cli/commands/` に新しいコマンドファイルを作成
2. `src/cli/index.ts` にコマンドを登録
3. 必要に応じて `src/types/index.ts` に型定義を追加

---

## ライセンス

ISC
