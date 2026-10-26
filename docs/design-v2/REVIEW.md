# 設計資料v2とdevの照合結果

確認日: 2026-10-26

対象コミット: `10baa1db954f4c03e2f4aeb181b256ac1cfde27c`（PR #17マージ後のdev）

## 確認結果

受領OpenAPIにある29操作は、すべて現行OpenAPI・実装ルートに存在します。
ただし、同じURLでも入力・状態値・出力の契約が変わっているため、そのまま現行クライアントの仕様には使えません。
以下は差分のレビューであり、受領資料への追従として実装を変更したものではありません。

| 対象 | 受領資料 | 現行dev |
| --- | --- | --- |
| API操作数 | 29 | 58 |
| DBテーブル数 | ER図に15 | スキーマ・最新スナップショットに19 |
| 受領資料にのみ存在するAPI操作 | なし | 全29操作のメソッド・パスを維持 |
| 受領ER図にのみ存在するテーブル | なし | 全15テーブルを維持 |
| YAML内部の参照 | 未解決の `$ref` なし | 現行OpenAPI lintも成功 |
| 同梱Redocの埋め込み仕様 | 受領YAMLと内容一致 | 現行58操作の表示ではない |

## 優先して解消すべき仕様の差分

### 1. イベント・申込の状態名に互換性がない

| 対象 | 受領仕様書・OpenAPI | 現行devでの扱い |
| --- | --- | --- |
| イベントの公開停止 | `suspended` | イベントを `draft` にし、`moderation_actions` の運営停止記録で主催者による再公開を制限 |
| イベントの終了 | `closed` | `completed`。募集締切は状態ではなく締切日時・開始日時で判定 |
| 受付済みの申込 | `attended` | `checked_in` |
| 申込の初期状態 | `pending` の記載なし | DB・APIの許容状態に `pending` がある。通常の申込APIは `confirmed/waitlisted` を返す |

資料の値をそのまま状態フィルタ・状態変更へ送ると、バリデーションで拒否されます。
一方、主催者の状態には現行でも `suspended` が存在するので、イベントの状態と混同しないでください。

根拠: [受領仕様の状態一覧](nextech_design_spec_v2.md#34-ステータス)、[現行DB](../../Backend/app/src/db/schema.ts)、[公開状態変更処理](../../Backend/app/src/services/event-status.ts)。

### 2. イベント編集にexpectedVersionが必要

受領OpenAPIの `EventUpdateRequest` は任意項目だけの部分更新です。
現行 `PATCH /events/:eventId` は `expectedVersion` が必須で、未指定は400、版の競合は409 `VERSION_CONFLICT` です。
受領仕様だけで編集画面を接続すると更新に失敗します。

根拠: [イベント編集ルート](../../Backend/app/src/routes/organizers.ts)、[現行の編集・認証ルール](../API_REQUIREMENTS.md#編集認証の安全性)。

### 3. 定員と下書きの入力条件が異なる

- 受領仕様書・OpenAPIでは定員は0以上ですが、現行API・DBは指定するなら1以上です。
- 現行ではタイトルのみで下書きを作成でき、未入力のカテゴリ・形式・日時・定員は `null` になります。
- 公開・完了への変更時には説明・カテゴリ・形式・日時・定員・開催場所が必要です。
- 受領OpenAPIでは作成時に9項目が必須で、締切も必須です。現行は締切なしの公開も許容します。
- `participationConditions` は現行で追加済みの任意項目です。作成・更新・詳細取得に対応します。

根拠: [現行イベント入力](../../Backend/app/src/routes/organizers.ts)、[公開時検証](../../Backend/app/src/services/event-validation.ts)、[追加マイグレーション](../../Backend/app/drizzle/0007_event_drafts_conditions.sql)。

## ER図とDBの差分

| 対象 | 差分 | 読み替え・対応 |
| --- | --- | --- |
| `registration_status_histories` | 受領ER図の `event_id/user_id` は実DBにない | `registration_id` から `registrations` を参照してイベント・利用者を取得する。追加カラムが必須という意味ではない |
| `events` | 受領ER図に `participation_conditions` がない | 現行では参加条件を専用カラムで保存する |
| カテゴリ→イベント | 受領ER図は各イベントにカテゴリ1件必須 | 現行では未完成下書きのカテゴリは任意。公開時には必須 |
| `auth_sessions` | 受領ER図・テーブル一覧にない | 現行ではリフレッシュセッションを保存する |
| `user_saved_events` | 受領ER図・テーブル一覧にない | 現行では保存イベントを保持する |
| `user_notification_settings` / `user_notifications` | 受領ER図・テーブル一覧にない | 現行では通知設定・通知を保持する |
| 申込の一意性 | 受領本文は「未キャンセル申込は1件まで」 | 実DBはイベント・利用者の組が全状態で一意。キャンセル後の再申込では既存行を再利用し、状態履歴を追記する |

根拠: [受領ER図](nextech_er_diagram.mmd)、[現行スキーマ](../../Backend/app/src/db/schema.ts)、[最新DBスナップショット](../../Backend/app/drizzle/meta/0007_snapshot.json)、[申込処理](../../Backend/app/src/routes/registrations.ts)。

## API・運用方針の追加差分

- 現行は保存イベント・通知・通知設定・所属主催者一覧・トークン更新・推薦・受付取消・主催者による状態変更・運営管理詳細/履歴・追加集計など29操作が増えています。
- 受領資料は自動通知をMVP対象外としていますが、現行には通知・リマインド処理があります。口コミ・決済等も実装されたという意味ではありません。
- 受領本文は定員確認を `confirmed` 件数としていますが、現行では `pending/confirmed/checked_in/no_show` が枠を使用します。受付済みを除外すると定員超過につながります。
- 受領本文の申込手順は公開状態等の確認をロック前に記載しています。現行ではイベント行をロックしたトランザクション内で状態・期間・重複・定員を確認します。この順序を維持する必要があります。
- 受領資料の権限表は公開停止・復帰を管理者のみとしています。現行では主催者も自組織の状態を変更できますが、運営による公開停止の解除は管理者に限ります。
- 受領OpenAPIのアクセストークン有効期限の例は3600秒、現行の契約・実装は900秒です。現行には `/auth/refresh` があります。
- 受領OpenAPIのローカルURLは `http://localhost:3000/api/v1` ですが、Backendの既定値は `http://localhost:3001/api/v1` です。現行Frontendが全v1ルートを中継しているわけではありません。

根拠: [現行OpenAPI](../../Backend/app/openapi/index.yaml)、[要件との対応・集計定義](../API_REQUIREMENTS.md)、[Backend手順](../../Backend/app/README.md)。

## 確認範囲

- 受領2ファイルとZIP内の4ファイルはバイト単位で原本一致を確認。macOSメタデータは展開対象外。
- YAML構文・全ローカル `$ref`・Redoc HTMLの埋め込み仕様との一致を確認。
- APIのメソッド・パスを現行58操作と照合し、受領29操作の未実装がないことを確認。
- ER図の15テーブル・各カラムを最新スナップショットと照合し、主要な外部キー・制約をスキーマと照合。
- この変更は資料追加のみ。DBを使う実行時テスト、Redocのブラウザ描画・ER図レンダリングは今回の確認範囲に含めていません。

現行クライアントの実装には [BackendのOpenAPI](../../Backend/app/openapi/index.yaml) を使用してください。
受領資料を最新版へ改訂する場合は、上記の差分を反映し、ER図とRedocの埋め込み仕様も同時に更新する必要があります。
