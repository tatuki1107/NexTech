# NexTech Backend

Bun / Elysia / Drizzle / PostgreSQLのAPIです。`.env.example` を `.env` へコピーし、
`DATABASE_URL` を設定してください。全体の起動手順は
[Contributing Guide](../../CONTRIBUTING.md#3-ローカルでの起動) を参照してください。

```bash
bun install --frozen-lockfile
bun run db:migrate
bun run dev
```

既存の0000〜0006と履歴を維持し、0007で参加条件と履歴のイベント・ユーザーIDを
追加・バックフィルし、二重エンコード済みJSON履歴を補正します。0008で管理者公開停止フラグを追加します。
既存テーブルの作り直しやDBボリューム削除は不要です。
`bun run db:seed` は開発用データの投入です。本番DBでは実行しないでください。
Seedには `SEED_ADMIN_EMAIL`・`SEED_ADMIN_PASSWORD`・`SEED_USER_PASSWORD` の指定が必要です。

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
RUN_DB_TESTS=1 TEST_DATABASE_URL=postgresql://user:password@localhost:55432/nextech_test bun test
```

登録・認証、権限制御、申込・繰り上げ・再申込、受付、更新のロールバック、
非公開イベント、Refresh Tokenのローテーションを検証します。
並列申込・同一ユーザーの同時申込、全保護操作の未認証拒否、実レスポンスのOpenAPI契約、
主催者公開・管理者停止と復帰、管理操作履歴、月別人数・申込率・期間比較も検証します。
`DB_PREPARE=false` はprepared statement非対応の検証用接続向けで、通常は設定不要です。

## 画面接続向けの追加API

以下のパスは `/api/v1` 配下で、すべてBearer認証が必要です。
一覧は `page`（既定1）と `perPage`（既定20、最大100）でページ指定できます。

| メソッド | パス | 用途 |
| --- | --- | --- |
| GET | `/me/saved-events` | 保存したイベント一覧。`view=upcoming/past` で絞り込み |
| PUT / DELETE | `/me/saved-events/:eventId` | イベント保存・解除（再実行可能） |
| GET | `/me/favorite-categories` | フォロー中のカテゴリ一覧 |
| GET | `/me/favorite-organizers` | フォロー中の主催者一覧 |
| GET | `/me/organizers` | 所有・所属主催者と `memberRole` の一覧 |
| GET / PATCH | `/me/notification-settings` | 通知設定取得・部分更新 |
| GET | `/me/notifications` | 通知一覧・未読総数。`unreadOnly=true` で未読のみ |
| PUT | `/me/notifications/:notificationId/read` | 本人の通知を既読化 |
| PUT | `/me/notifications/read-all` | 本人の通知を一括既読化 |

通知設定は `registrationUpdates`・`eventReminders` が既定true、`recommendations` が
既定falseです。OFFは以後の通知生成を抑止し、過去の通知は削除しません。
申込・キャンセル・繰り上げ・イベント中止の通知は業務処理と同じトランザクションで保存します。
フォロー中のカテゴリ・主催者のイベントが公開された場合、希望者へおすすめ通知を生成します。
非公開・限定公開イベントはおすすめ通知の対象外です。再公開では重複通知しません。

保存一覧は現在の閲覧権限を再確認し、非公開化されたイベントを第三者に表示しません。
下書きは一覧対象外です。保存しても閲覧権限は付与されません。
所属主催者は所有者カラムも確認するため、既存のメンバー行がない所有者も取得できます。

### リマインド

```bash
bun run notifications:remind
```

参加確定済み・公開中のイベントについて、開始23〜24時間前と開始まで1時間以内に
アプリ内通知を生成します。通知キーの一意制約で再実行・多重起動時の重複を防ぎます。
設定OFF、キャンセル済み、待機中、受付済み、開始済み、中止イベントは対象外です。
日時変更は別の通知キーとして扱います。

本コマンドを1分間隔で実行するスケジューラを運用側で設定してください。
このPRでは常駐タイマーや外部の定期実行設定を追加しません。
実行しなかった時間帯の通知は後日バックフィルしません。
メール・Web Push・外部配信サービスへの送信は含まず、アプリ内通知のみです。

FrontendのlocalStorage保存からの移行・実際のAPI接続は別作業です。

## 要件定義書に対応した追加API

全54操作を [OpenAPI](openapi/index.yaml) に定義しています。

| API | 用途 |
| --- | --- |
| `PATCH /events/:eventId/status` | 所属主催者の公開・下書き・中止・完了 |
| `GET /events/:eventId/history` | 所属主催者・管理者による変更履歴取得 |
| `GET /me/related-events` | 過去参加イベントとタグ・主催者が関連する後継イベント |
| `GET /admin/events/:eventId` | 下書き・非公開を含む管理者詳細 |
| `GET /admin/organizers`・`GET /admin/organizers/:organizerId` | 主催者検索・詳細 |
| `PATCH /admin/organizers/:organizerId/status` | 主催者の停止・復帰（理由必須） |
| `GET /admin/registrations`・`GET /admin/registrations/:registrationId` | 参加情報検索・詳細・履歴 |
| `POST /admin/reviews`・`GET /admin/moderation-actions` | 確認済み操作・管理履歴 |
| `GET /admin/analytics/popular-organizers` | 人気主催者ランキング |
| `GET /admin/analytics/report` | カテゴリ・主催者・開催形式別集計と直前同日数の期間比較 |

イベント検索は `organizerName`、参加者検索は `keyword` の申込ID部分一致を受け付けます。
管理対象一覧は `keyword/from/to/status/page/perPage` で検索します。
イベントは開催日、主催者は登録日、参加情報は申込日を期間条件に使います。
月別開催数は参加人数・受付人数・申込数・定員・申込率を含み、0件の月も返します。
集計期間はAsia/Tokyoの暦日で両端を含み、公開中・開催終了済みイベントを対象にします。
`registrationCount` は待機を含むキャンセル以外の申込、`participantCount` は参加枠使用人数、
`applicationRate` は参加枠使用人数÷定員×100です。

管理者の状態変更は理由必須です。管理者が下書きへ戻したイベントの再公開は管理者のみ可能です。
中止・完了は終端状態で、完了操作は開催終了後のみ可能です。
主催者の停止はイベントを物理削除せず、公開参照と新規申込を停止します。
既存申込のキャンセルと権限のある履歴確認は引き続き可能です。
