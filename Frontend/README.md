# NexTech Frontend

## 起動・検証

このディレクトリで次を実行します。Backendは別途起動してください。

```bash
npm ci
npm run dev
```

画面は `http://localhost:3000` です。DB・Backendの起動と環境変数の設定は
[Contributing Guide](../CONTRIBUTING.md#3-ローカルでの起動) を参照してください。
ブラウザは同一オリジンの `/api/events` に接続し、Next.jsがBackendへ転送します。

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## ファイル配置

```text
app/
├── layout.tsx                 # 全画面共通のhtml/body
├── globals.css                # Tailwindと全画面共通の基本設定のみ
├── favicon.ico
├── api/events/route.ts        # ブラウザからBackendへの窓口
└── (participant)/             # 参加者向け画面。URLには含まれない
    ├── layout.tsx             # 参加者用レイアウト
    ├── layout.module.css      # 参加者だけに適用するスタイル
    ├── _components/
    │   ├── ParticipantShell.tsx       # 参加者ヘッダー・ナビゲーション
    │   ├── EventCard.tsx              # 一覧・保存済みのイベントカード
    │   ├── EventImagePlaceholder.tsx  # イベント画像未設定時の表示
    │   ├── EventSearch.tsx            # イベント一覧の検索・取得
    │   ├── EventDetail.tsx            # イベント詳細の表示
    │   ├── EventDetailError.tsx       # 詳細取得に失敗したときの表示
    │   ├── EventAction.tsx            # 申込・キャンセルの準備中表示
    │   ├── BookmarkButton.tsx         # ブラウザ内のブックマーク
    │   └── MyEvents.tsx               # マイページのサンプル参加一覧
    ├── _lib/event-detail.ts   # 詳細データ取得・検証・表示用日時変換
    ├── page.tsx              # URL: /
    ├── events/[id]/           # URL: /events/:id
    ├── search/               # URL: /search
    ├── saved/                # URL: /saved
    ├── mypage/               # URL: /mypage
    ├── notifications/        # URL: /notifications
    ├── interests/            # URL: /interests
    └── settings/             # URL: /settings
```

主催者ブランチを取り込むと `app/organizer/` が追加され、URLは `/organizer` になります。
主催者用レイアウトと部品はその配下の `layout.tsx`、`_components/` に置いてください。
現段階では主催者用ファイルや仮画面を追加していません。

参加者固有の部品は `app/(participant)/_components/`、両画面で実際に使う共通部品は
`app/_components/` に置きます。共有する実装が必要になるまで、共通部品の空ディレクトリは作りません。
1つのファイルには主な表示コンポーネントを1つ置き、ファイル名とコンポーネント名を揃えます。
ページはルーティング・データ取得・表示の組み立てに留め、表示部品を `_components` に分けます。
画面固有のスタイルはCSS Modulesまたはその画面のTailwindクラスで管理し、
`globals.css` に参加者用の背景・レイアウト・要素セレクターを追加しないでください。
共通ヘッダーやサイドバーをルート `app/layout.tsx` に追加すると全画面へ適用されるため、
利用者別のレイアウト配下へ追加してください。

## organizerの追加

主催者ブランチは `app/organizer/` とその `_components/Sidebar.tsx` をそのまま追加できます。
参加者のCSSは `.participant` のCSS Module配下に限定しているため、主催者画面へ適用されません。
PR #6の整理コミットを取り込み済みです。`/events/...`、`/mypage`、`/api/...` などのURLは維持しています。
