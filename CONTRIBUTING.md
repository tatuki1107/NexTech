# Contributing Guide

NexTechへ変更を加えるときの共通手順です。実装上の詳細は
[コーディングルール](docs/CODING_RULES.md)も確認してください。

## 1. 変更を始める前に

- 変更の目的と完了条件を明確にする。
- 既存のIssueがある場合は、同じ目的の変更が進行していないか確認する。
- 1つの変更では1つの目的を扱う。無関係な修正を混ぜない。
- 大きな仕様変更や新しい依存パッケージの追加は、実装前にチームで合意する。

## 2. ブランチ

ブランチ名は、種類と内容が分かる名前にします。

```text
feature/add-user-profile
fix/login-validation
refactor/api-error-handler
docs/update-coding-rules
```

使用する接頭辞は次のとおりです。

| 接頭辞 | 用途 |
| --- | --- |
| `feature/` | 機能追加 |
| `fix/` | 不具合修正 |
| `refactor/` | 振る舞いを変えない改善 |
| `docs/` | 文書のみの変更 |
| `chore/` | 設定や依存関係などの保守 |

## 3. ローカルでの起動

リポジトリのルートディレクトリを基準にしています。BunとDocker Composeを使用します。

### PostgreSQLの準備

ルートの `.env.example` を `.env` へ、`Backend/app/.env.example` を
`Backend/app/.env` へコピーしてください。コピーはエディタやファイルマネージャーでも構いません。

```bash
cp .env.example .env
cp Backend/app/.env.example Backend/app/.env
docker compose up -d --wait db
```

Backendの `DATABASE_URL` はルート `.env` のDB名・ユーザー名・パスワードと揃えます。
サンプルの認証情報はローカル開発専用です。本番では別の値を使用してください。
接続URL内のパスワードに予約文字がある場合はURLエンコードが必要です。

既存のDBボリュームを使用する場合は、初期化時の認証情報を `.env` に設定します。
環境変数を書き換えるだけでは、既存DBのパスワードは変更されません。

### Frontend

```bash
cd Frontend
bun install
bun run dev
```

### Backend

```bash
cd Backend/app
bun install
bun run db:migrate
bun run dev
```

Frontendは通常 `http://localhost:3000`、Backendは
`http://localhost:3001` で起動します。

### すべてDockerで起動する場合

ルート `.env` を準備したうえで、ルートから次を実行します。

```bash
docker compose up -d --build --wait db backend
docker compose exec -T backend bun run db:migrate
docker compose up -d --build --wait frontend
```

BackendはPostgreSQLのhealthcheck成功後、FrontendはBackendのDB接続確認成功後に起動します。
初回はFrontendを開く前にマイグレーションを適用してください。
DBのホスト公開は `127.0.0.1:5432` のみです。

### 画面・コンポーネントの配置

参加者画面は `Frontend/app/(participant)/`、参加者専用部品はその下の
`_components/` に配置します。コンポーネント名とファイル名を対応させ、
`ParticipantShell.tsx`、`EventCard.tsx` のように役割が分かる名前にしてください。
主催者画面は `Frontend/app/organizer/`、API Route Handlerは `Frontend/app/api/` に配置します。
参加者専用CSSはCSS Modulesで参加者配下に限定し、ルートの `globals.css` は共通設定だけにします。
詳細は [Frontend README](Frontend/README.md) を参照してください。

## 4. コミット

- コミットはレビュー可能な大きさに分ける。
- メッセージは「何をしたか」が分かる簡潔な命令形にする。
- 一時ファイル、秘密情報、デバッグ用ログをコミットしない。

例：

```text
feat: add user profile page
fix: reject invalid login requests
docs: add coding standards
```

主な種類は `feat`、`fix`、`refactor`、`test`、`docs`、`chore` です。

## 5. Pull Request

Pull Requestには次を記載します。

- 変更の目的
- 主な変更内容
- 確認方法と結果
- UI変更がある場合はスクリーンショット
- 影響範囲、既知の制約、残作業

レビューしやすい大きさを保ち、レビュー指摘への対応後は何を変更したか返信します。

## 6. マージ前の確認

変更した範囲に応じて、次を確認します。

### Frontend

```bash
cd Frontend
bun run lint
bun run build
```

### Backend

```bash
cd Backend/app
bun run typecheck
bun test
bun run openapi:lint
```

加えて、次を手動で確認します。

- 変更した機能が期待どおり動作する。
- エラー、データなし、読み込み中の状態が破綻しない。
- UI変更はPCとスマートフォン相当の幅で確認する。
- ブラウザとサーバーに不要なエラーや警告が出ていない。

DB統合テストは専用の使い捨てDBで実行します。手順は
[Backend README](Backend/app/README.md) を参照してください。
既存マイグレーションは書き換えず、追加マイグレーションで変更します。
既存DBボリュームの削除・再作成は不要です。
