# NexTech Frontend

## 起動・検証

このディレクトリで次を実行します。Backendは別途起動してください。

```bash
npm ci
npm run dev
```

画面は `http://localhost:3000`、現在の疎通確認APIは `http://localhost:3001/api` です。

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
└── (participant)/             # 参加者向け画面。URLには含まれない
    ├── layout.tsx             # 参加者用レイアウト
    ├── layout.module.css      # 参加者だけに適用する色・背景
    └── page.tsx               # URL: /
```

主催者ブランチを取り込むと `app/organizer/` が追加され、URLは `/organizer` になります。
主催者用レイアウトと部品はその配下の `layout.tsx`、`_components/` に置いてください。
現段階では主催者用ファイルや仮画面を追加していません。

参加者固有の部品は `app/(participant)/_components/`、両画面で実際に使う共通部品は
`app/_components/` に置きます。これらのディレクトリは最初の部品が必要になった時点で作成します。
画面固有のスタイルはCSS Modulesまたはその画面のTailwindクラスで管理し、
`globals.css` に参加者用の背景・レイアウト・要素セレクターを追加しないでください。
共通ヘッダーやサイドバーをルート `app/layout.tsx` に追加すると全画面へ適用されるため、
利用者別のレイアウト配下へ追加してください。

## 後続PRを取り込む際の注意

PR #4のDB・参加者画面は、今回の整理には含めていません。
取り込む際は参加者ページ（`events`、`mypage`、`saved`など）を `(participant)` 配下へ、
参加者専用部品を `_components` 配下へ配置し、importも更新してください。
参加者用のCSSはCSS Modules等で参加者配下へ限定し、API Route Handlerは
`app/api/` に置きます。URLは従来の `/events/...`、`/mypage`、`/api/...` を維持します。
