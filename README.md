# NexTech

## Development documents

- [Documentation index](docs/README.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Coding Rules](docs/CODING_RULES.md)

## 開発環境

ルートの `.env.example` を `.env` にコピーし、ローカル用DBの設定を確認してください。
Dockerで一式起動する手順、Bunで個別に起動する手順、既存DBボリュームの注意点は
[Contributing Guide](CONTRIBUTING.md#3-ローカルでの起動) に記載しています。
参加者画面・主催者画面・コンポーネントの配置は [Frontend README](Frontend/README.md) を参照してください。

## 参加者画面のAPI接続

ブラウザは同一オリジンの `/api/events` に接続し、Next.jsサーバーがBackendへ転送します。
Next.js側の `INTERNAL_API_BASE_URL` にBackendのURLを設定してください。
ローカル実行時の既定値は `http://localhost:3001`、Docker Composeでは
`http://backend:3001` が設定されています。この変数はブラウザへ公開しません。

## 現在の制約

認証・申込・キャンセルのAPIは `/api/v1` に実装済みです。
仕様と検証手順は [Backend README](Backend/app/README.md) を参照してください。
画面側の認証・申込接続は今回の対象外です。詳細画面では操作を無効化し、
準備中であることを表示しています。マイページの参加一覧はサンプル表示です。
人数集計では `pending`、`confirmed`、`checked_in`、`no_show` を参加枠の使用数として扱い、
`waitlisted` と `cancelled` は除外します。
