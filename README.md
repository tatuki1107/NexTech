# NexTech

## Development documents

- [Contributing Guide](CONTRIBUTING.md)
- [Coding Rules](docs/CODING_RULES.md)

## 参加者画面のAPI接続

ブラウザは同一オリジンの `/api/events` に接続し、Next.jsサーバーがBackendへ転送します。
Next.js側の `INTERNAL_API_BASE_URL` にBackendのURLを設定してください。
ローカル実行時の既定値は `http://localhost:3001`、Docker Composeでは
`http://backend:3001` が設定されています。この変数はブラウザへ公開しません。

## 現在の制約

参加申込・キャンセルの認証付きAPIは未実装です。詳細画面では操作を無効化し、
準備中であることを表示しています。マイページの参加一覧はサンプル表示です。
人数集計では `pending`、`confirmed`、`checked_in`、`no_show` を参加枠の使用数として扱い、
`waitlisted` と `cancelled` は除外します。
