# NexTech API

Bun、Elysia、Drizzle ORM、PostgreSQLで実装したNexTech MVP APIです。APIの正本は
[`openapi/index.yaml`](openapi/index.yaml)です。

## Local setup

```bash
cp .env.example .env
docker compose -f ../../docker-compose.yml up -d database
bun install
bun run db:migrate
bun run db:seed
bun run dev
```

APIは `http://localhost:3001/api/v1`、リクエストを送信できるSwagger UIは `http://localhost:3001/docs`、
閲覧専用のRedocは `http://localhost:3001/redoc`、
ヘルスチェックは `http://localhost:3001/health` です。
ローカルのPostgreSQLとの衝突を避けるため、ComposeのDBはホスト側の `55432` ポートで公開します。

## Commands

- `bun run db:generate`: Drizzleスキーマからマイグレーションを生成
- `bun run db:migrate`: 未適用のSQLマイグレーションを順番に適用
- `bun run db:seed`: 開発用マスタ、ユーザー、イベントを再実行可能な形で投入
- `bun test`: 単体・契約テスト
- `bun run typecheck`: TypeScript型チェック
- `bun run openapi:lint`: OpenAPIの構文、参照、操作数を検証

本番環境ではSeedを実行しないでください。`JWT_SECRET`には32文字以上のランダム値を設定し、
`ALLOWED_ORIGINS`には許可するFrontend originだけを指定します。
