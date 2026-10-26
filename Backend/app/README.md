# NexTech Backend

Bun / Elysia / Drizzle / PostgreSQLのAPIです。`.env.example` を `.env` へコピーし、
`DATABASE_URL` を設定してください。全体の起動手順は
[Contributing Guide](../../CONTRIBUTING.md#3-ローカルでの起動) を参照してください。

```bash
bun install --frozen-lockfile
bun run db:migrate
bun run dev
```

既存の0000〜0004と履歴を維持し、0005で認証セッション、0006でイベント保存・
通知設定・通知の3テーブルを追加します。
既存テーブルの作り直しやDBボリューム削除は不要です。
`bun run db:seed` は開発用データの投入です。本番DBでは実行しないでください。

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
RUN_DB_TESTS=1 TEST_DATABASE_URL=postgresql://user:password@localhost:5432/nextech_test bun test
```

登録・認証、権限制御、申込・繰り上げ・再申込、受付、更新のロールバック、
非公開イベント、Refresh Tokenのローテーションを検証します。
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

## APIの境界条件

- タグ検索の `tagIds` はUUIDのカンマ区切りで、いずれかに一致する条件（OR）です。
- ページ範囲外では `data: []` を返しますが、`pagination.total` は絞り込み後の総件数を維持します。
  公開検索、自分の申込、主催者イベント、申込管理、管理者一覧で共通です。
- イベント開始後・開催終了後の申込キャンセルは422です。中止・下書き状態のイベントの
  開始前の申込はキャンセル可能ですが、待機者の繰り上げは行いません。
- 受付は有効な主催者の公開中イベントに限定し、申込が `confirmed` の場合のみ可能です。
  受付と中止・キャンセルはイベント行→申込行の順でロックします。
- 中止済みイベントは下書きに戻せず、再公開もできません。同じ中止状態への再指定は可能です。
- `inactive/suspended` の主催者のイベントは、従来API・v1の公開一覧/詳細・保存一覧から除外します。
  新規申込・受付・公開・繰り上げ・リマインド・おすすめ通知も停止します。
  一般メンバーの運営操作は拒否しますが、管理者の調査・編集・中止操作は維持します。
- 従来の `/api/events/:id` もUUIDを検証し、不正形式はSQLを実行せず400を返します。

これらの回帰テストは `test/regressions.integration.test.ts` に含まれます。
DB構造・既存データの変更や追加マイグレーションはありません。

## 要件定義書への対応（API v1.3）

要件5.2〜5.8の対応表・権限・推薦/集計の定義は
[要件とAPIの対応](../../docs/API_REQUIREMENTS.md) を参照してください。

- `PATCH /api/v1/events/:eventId/status`: 主催者による自組織イベントの公開状態変更
- `GET /api/v1/me/recommended-events`: 参加履歴の主催者・タグに関連する後継イベント
- `/api/v1/admin/organizers`・`/api/v1/admin/registrations`: 運営向け横断検索・詳細
- `PATCH /api/v1/admin/organizers/:organizerId/status`: 理由付きの停止・復帰
- `POST /api/v1/admin/reviews`・`GET /api/v1/admin/moderation-actions`: 確認済み記録・運営履歴
- `/api/v1/admin/{events|organizers|registrations}/:id/history`: 対象別履歴
- `/api/v1/admin/analytics/monthly-participants`・`popular-organizers`・`breakdown`: 推移・人気主催者・軸別集計

キーワード検索は主催者名も対象とし、参加者管理では申込番号でも検索できます。
申込締切未設定のレスポンスは `null` です。日付検索・集計は東京時間、待機順位は現在順位です。
APIの操作数は57です。Frontendの接続・本番運用の設定は含みません。

イベント編集には取得済みの `Event.version` を `expectedVersion` として必ず送ってください。
古い版は409 `VERSION_CONFLICT`、未指定は400です。増員時は待機者を先着順に繰り上げます。
認証は論理削除済みアカウントを拒否し、IP取得には転送ヘッダーではなくソケット接続元を使います。
プロキシ配下と複数プロセスでのレート制限の制約も、上記対応表の「編集・認証の安全性」を参照してください。
