# Elysia with Bun runtime

## Getting Started
To get started with this template, simply paste this command into your terminal:
```bash
bun create elysia ./elysia-example
```

## Development
To start the development server run:
```bash
bun run dev
```

起動前に `.env.example` を `.env` にコピーし、`DATABASE_URL` を設定してください。
PostgreSQLの準備とマイグレーションの手順は
[Contributing Guide](../../CONTRIBUTING.md#3-ローカルでの起動) を参照してください。

Backendは http://localhost:3001/ で起動します。
疎通確認は `/api`、DB接続確認は `/api/db-health` です。
