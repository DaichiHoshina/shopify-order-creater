# Development Guide

## 📋 目次

1. [開発環境のセットアップ](#開発環境のセットアップ)
2. [ビルド・実行](#ビルド実行)
3. [CI/CD](#cicd)
4. [リリース手順](#リリース手順)
5. [Dockerの使い方](#dockerの使い方)

---

## 開発環境のセットアップ

### 必要な環境

- Node.js 18.x 以上
- npm 9.x 以上
- AWS CLI（DynamoDB使用時）

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な情報を設定
```

---

## ビルド・実行

### 開発モード

```bash
# TypeScriptを直接実行（開発時）
npm run dev

# Webサーバーを開発モードで起動
npm run dev:web
```

### プロダクションビルド

```bash
# TypeScriptをビルド
npm run build

# ビルド成果物を実行
npm start

# Webサーバーを起動
npm run web
```

---

## CI/CD

### GitHub Actions ワークフロー

このプロジェクトには2つのワークフローが設定されています：

#### 1. CI (Continuous Integration)

**トリガー**:
- `main`または`develop`ブランチへのプッシュ
- `main`または`develop`ブランチへのプルリクエスト

**実行内容**:
- Node.js 18.x と 20.x でビルドテスト
- 依存関係のインストール
- TypeScriptのビルド
- ビルド成果物の確認

**ワークフローファイル**: `.github/workflows/ci.yml`

```yaml
# プルリクエスト時に自動実行される
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

#### 2. CD (Continuous Deployment)

**トリガー**:
- `v*.*.*`形式のタグがプッシュされた時（例: `v1.0.0`）

**実行内容**:
- アプリケーションのビルド
- パッケージアーカイブの作成
- 変更履歴の自動生成
- GitHubリリースの作成
- 成果物のアップロード

**ワークフローファイル**: `.github/workflows/cd.yml`

---

## リリース手順

### 1. バージョンアップ

```bash
# package.jsonのバージョンを更新
npm version patch  # パッチバージョン (1.0.0 -> 1.0.1)
npm version minor  # マイナーバージョン (1.0.0 -> 1.1.0)
npm version major  # メジャーバージョン (1.0.0 -> 2.0.0)
```

### 2. タグのプッシュ

```bash
# タグを確認
git tag

# タグをリモートにプッシュ（CDワークフローが自動実行される）
git push origin v1.0.0

# または全てのタグをプッシュ
git push --tags
```

### 3. GitHubリリースの確認

1. GitHubリポジトリの「Releases」タブを開く
2. 新しいリリースが自動作成されていることを確認
3. 成果物（tarファイル）がアップロードされていることを確認
4. 変更履歴が記載されていることを確認

### 4. リリースノートの編集（オプション）

1. GitHubの「Releases」ページで作成されたリリースを開く
2. 「Edit release」をクリック
3. リリースノートを詳細に記載
4. スクリーンショットや追加情報を追加
5. 「Update release」をクリック

---

## Dockerの使い方

### Dockerイメージのビルド

```bash
# ローカルでDockerイメージをビルド
docker build -t shopify-order-creator:latest .

# 特定のバージョンでビルド
docker build -t shopify-order-creator:1.0.0 .
```

### Dockerコンテナの実行

```bash
# CLIモードで実行
docker run --rm \
  -v $(pwd)/.env:/app/.env \
  shopify-order-creator:latest \
  create

# Webサーバーモードで実行
docker run --rm -p 3000:3000 \
  -v $(pwd)/.env:/app/.env \
  shopify-order-creator:latest \
  node dist/server.js

# インタラクティブモード
docker run --rm -it \
  -v $(pwd)/.env:/app/.env \
  shopify-order-creator:latest \
  /bin/sh
```

### Docker Composeの使用（オプション）

`docker-compose.yml`を作成して使用する場合：

```yaml
version: '3.8'

services:
  shopify-order-creator:
    build: .
    image: shopify-order-creator:latest
    env_file:
      - .env
    ports:
      - "3000:3000"
    command: node dist/server.js
```

実行方法：
```bash
# サービスを起動
docker-compose up

# バックグラウンドで起動
docker-compose up -d

# ログを確認
docker-compose logs -f

# サービスを停止
docker-compose down
```

---

## オプション機能

### npm パッケージとして公開

`.github/workflows/cd.yml`のコメントアウトされた`publish-npm`ジョブを有効化：

1. npm tokenを取得（https://www.npmjs.com/settings/tokens）
2. GitHubのSecretsに`NPM_TOKEN`を追加
3. `cd.yml`の該当部分のコメントを解除
4. タグをプッシュすると自動的にnpmに公開される

### Docker Hubに公開

`.github/workflows/cd.yml`のコメントアウトされた`publish-docker`ジョブを有効化：

1. Docker Hubのアカウントを作成
2. GitHubのSecretsに以下を追加：
   - `DOCKER_USERNAME`: Docker Hubのユーザー名
   - `DOCKER_PASSWORD`: Docker Hubのパスワード（またはアクセストークン）
3. `cd.yml`の`your-dockerhub-username`を実際のユーザー名に変更
4. コメントを解除
5. タグをプッシュすると自動的にDocker Hubに公開される

---

## トラブルシューティング

### CI/CDワークフローが失敗する場合

1. **ビルドエラー**:
   ```bash
   # ローカルでビルドテスト
   npm ci
   npm run build
   ```

2. **権限エラー**:
   - GitHubのSettings > Actions > General で権限を確認
   - `Workflow permissions`が`Read and write permissions`になっているか確認

3. **タグが認識されない**:
   ```bash
   # タグの形式を確認（v1.0.0形式であること）
   git tag -l
   ```

### Dockerビルドが失敗する場合

```bash
# ビルドログを詳細表示
docker build --no-cache --progress=plain -t shopify-order-creator:latest .

# .dockerignoreを確認
cat .dockerignore
```

---

## 参考資料

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm publish documentation](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [Docker best practices](https://docs.docker.com/develop/dev-best-practices/)

---

**最終更新日**: 2025-11-07
