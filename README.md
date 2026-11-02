# NexTech

## Development documents

- [Contributing Guide](CONTRIBUTING.md)
- [Coding Rules](docs/CODING_RULES.md)
- [設計・API資料一覧](docs/README.md)

## 開発環境

ルートの `.env.example` を `.env` にコピーし、ローカル用DBの設定を確認してください。
Dockerで一式起動する手順、Bunで個別に起動する手順、既存DBボリュームの注意点は
[Contributing Guide](CONTRIBUTING.md#3-ローカルでの起動) に記載しています。
参加者画面・主催者画面・コンポーネントの配置は [Frontend README](Frontend/README.md) を参照してください。

## 参加者画面のAPI接続

ブラウザは同一オリジンの `/api/v1/*` に接続し、Next.jsサーバーがBackendへ転送します。
Next.js側の `INTERNAL_API_BASE_URL` にBackendのURLを設定してください。
ローカル実行時の既定値は `http://localhost:3001`、Docker Composeでは
`http://backend:3001` が設定されています。この変数はブラウザへ公開しません。

## 接続済みの参加者機能

認証・申込・キャンセルのAPIは `/api/v1` に実装済みです。
仕様と検証手順は [Backend README](Backend/app/README.md) を参照してください。
参加者画面の新規登録・ログイン、検索・詳細、申込・キャンセル、マイページ、保存、
興味・フォロー、通知・既読、プロフィール・通知設定をAPIに接続しています。
認証はHttpOnly Cookieで扱います。[接続仕様と検証手順](docs/PARTICIPANT_API.md) を参照してください。
主催者画面のAPI接続は別作業です。
人数集計では `pending`、`confirmed`、`checked_in`、`no_show` を参加枠の使用数として扱い、
`waitlisted` と `cancelled` は除外します。
