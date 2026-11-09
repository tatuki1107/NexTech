# NexTech Frontend

## 起動・検証

このディレクトリで次を実行します。Backend・PostgreSQLは別途起動してください。

```bash
npm ci
npm run dev
bun test
npm run lint
npx tsc --noEmit
npm run build
```

通常のURLは `http://localhost:3000` です。
DB・Backend・Docker Composeの手順は [Contributing Guide](../CONTRIBUTING.md#3-ローカルでの起動) を参照してください。

## 管理者画面

`/admin` から、イベント・主催者・参加情報の検索と詳細、運営対応の操作履歴を確認できます。
イベント一覧の「概要」で右側パネルを開き、「詳細を見る」で詳細ページに移動します。
詳細画面から、確認済み記録、イベントの公開停止・復帰、主催者の停止・復帰を実行できます。
「基本集計」では、期間を指定して月別推移とカテゴリ・主催者・開催形式別の内訳を確認できます。
管理者ロールが必要です。Backend の管理者 API で権限を検証します。

## 主催者画面のAPI接続

イベント作成・編集・状態変更、申込管理、受付・受付取消、主催者分析、組織情報・個人通知設定を実APIへ接続しています。
所属主催者を選択して操作します。接続範囲・権限制御・未対応機能は [主催者API接続仕様](../docs/ORGANIZER_API.md) を参照してください。

## 参加者画面のAPI接続

ブラウザは同一オリジンの `/api/v1/*` に接続し、Next.jsがBackendへ中継します。
サーバー側の `INTERNAL_API_BASE_URL` は既定で `http://localhost:3001`、
Docker Composeでは `http://backend:3001` です。ブラウザにこの内部URLを公開しません。

接続済みの機能は新規登録・ログイン・ログアウト、イベント検索・詳細、参加申込・取消、
マイページ、保存イベント、興味・主催者フォロー、通知・既読、プロフィール・通知設定です。
Cookie・セッション更新・各エンドポイント・検証範囲は [参加者API接続仕様](../docs/PARTICIPANT_API.md) を参照してください。

アクセストークンとリフレッシュトークンはHttpOnly Cookieで扱います。
localStorageに認証情報を保存せず、従来の端末内ブックマークは自動移行しません。
個人ページは未ログイン時にログイン導線を表示し、接続失敗とデータなしを区別します。
本番環境ではHTTPSが必要です。

## ファイル配置

```text
app/
├── layout.tsx                   # 全画面共通のhtml/body
├── globals.css                  # Tailwind・全画面共通設定
├── _lib/api-proxy.ts             # 参加者・主催者APIの許可範囲・Cookie・Origin確認
├── _lib/api.ts                   # 共通のHTTPクライアント・セッション更新・ページング
├── api/v1/[...path]/route.ts     # 同一オリジンのBackend中継
├── api/events/route.ts           # 従来の一覧中継（互換用）
├── (participant)/
│   ├── layout.tsx               # 参加者専用CSSとセッションProvider
│   ├── layout.module.css
│   ├── _components/
│   │   ├── ParticipantProvider.tsx # ユーザー・保存状態・未読数
│   │   ├── ParticipantShell.tsx    # ヘッダー・ナビゲーション
│   │   ├── RequireLogin.tsx       # 未ログイン・接続失敗・読込状態
│   │   ├── AuthForm.tsx           # 登録・ログイン
│   │   ├── EventSearch.tsx        # v1イベントの検索・一覧
│   │   ├── EventDetailLoader.tsx  # 認証復元後の詳細・本人の履歴表示
│   │   ├── EventAction.tsx        # 申込・キャンセル確認
│   │   ├── BookmarkButton.tsx     # DBの保存状態を操作
│   │   ├── MyEvents.tsx           # 本人の申込・待機順位・履歴・推薦
│   │   ├── InterestManager.tsx
│   │   ├── NotificationList.tsx
│   │   └── ProfileSettings.tsx
│   ├── _lib/                    # APIクライアント・ページング・型・表示変換
│   ├── login/ / signup/
│   ├── events/[id]/
│   ├── saved/ / mypage/ / search/
│   └── interests/ / notifications/ / settings/
└── organizer/                   # 所属主催者の選択・イベント運営・分析・設定
```

ページはルーティングと組み立てに留め、表示部品・API処理は役割に応じて分けます。
参加者固有のCSSはCSS Modules配下に限定し、`globals.css` やルートlayoutに混在させません。
両画面で実際に共有する部品のみ `app/_components/` に置きます。

## テスト

`test/api-proxy.test.mjs` は中継範囲、Origin、Cookie、認証情報の非公開を確認します。
`test/api-client.test.mjs` は認証更新の同時実行、障害時の扱い、ページングを確認します。
`test/event-search-filter.test.mjs` は検索条件・日付・APIタグ名を確認します。
`test/organizer-api.test.mjs` は主催者中継範囲、下書き、日本時間・複数日開催、状態表示、CSVを確認します。
ブラウザでの確認には実Backendと専用DBを使用し、通常のDBには検証用データを投入しません。
