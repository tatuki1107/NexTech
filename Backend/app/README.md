# NexTech Backend

Bun / Elysia / Drizzle / PostgreSQLのAPIです。`.env.example` を `.env` へコピーし、
`DATABASE_URL` を設定してください。全体の起動手順は
[Contributing Guide](../../CONTRIBUTING.md#3-ローカルでの起動) を参照してください。

```bash
bun install --frozen-lockfile
bun run db:migrate
bun run dev
```

既存の0000〜0004と履歴を維持し、0005で認証セッションテーブルのみを追加します。
既存テーブルの作り直しやDBボリューム削除は不要です。
`bun run db:seed` は開発用データの投入です。本番DBでは実行しないでください。

## エンドポイント

Backendの既定URLは `http://localhost:3001` です。

- `/api`・`/api/db-health`: 従来の疎通・DB接続確認
- `/api/events`・`/api/events/:id`: 既存画面用。`{ events }` / `{ event }` を維持
- `/api/v1`: 認証、プロフィール、イベント検索、お気に入り、申込・キャンセル、主催者管理、受付、管理者API
- `/docs`・`/redoc`・`/openapi.yaml`: OpenAPI仕様
- `/health`: プロセス疎通確認（DB接続確認ではありません）

v1の通常レスポンスは `{ data }`、エラーは `{ error }` です。
イベント状態は `draft/published/cancelled/completed`、受付済み申込は `checked_in` です。
`pending/confirmed/checked_in/no_show` が参加枠を使用します。
再申込はキャンセル済み行を再利用し、履歴を追加します。

## 認証と設定

Access TokenはAuthorizationのBearerヘッダー、Refresh TokenはHttpOnly Cookieで扱います。
`ALLOWED_ORIGINS` は許可する画面URLをカンマ区切りで設定します。
本番では `NODE_ENV=production` と十分にランダムな32文字以上の `JWT_SECRET` が必須です。
開発用の秘密鍵・DBパスワードは本番へ流用しないでください。

今回の統合ではFrontendの表示・既存API接続を維持します。
ログインフォーム、申込ボタン、マイページなどのv1接続は別途必要です。

## 検証

```bash
bun run typecheck
bun test
bun run openapi:lint
```

通常の `bun test` はDB不要で、DB統合テストはスキップします。
統合テストはデータを書き込むため、マイグレーション済みの専用使い捨てDBを使用してください。
共有開発DB・本番DBは指定しないでください。

```bash
# Unix系シェルの例。PowerShellでは $env:変数名 に設定してください。
RUN_DB_TESTS=1 TEST_DATABASE_URL=postgresql://user:password@localhost:5432/nextech_test bun test
```

登録・認証、権限制御、申込・繰り上げ・再申込、受付、更新のロールバック、
非公開イベント、Refresh Tokenのローテーションを検証します。
`DB_PREPARE=false` はprepared statement非対応の検証用接続向けで、通常は設定不要です。
