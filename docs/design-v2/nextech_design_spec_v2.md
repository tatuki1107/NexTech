# NexTech DB/API設計仕様書 v2

作成日: 2026-07-06  
対象: エンジニア向け勉強会・イベントマッチングサービス  
主プロジェクト名: NexTech  
API仕様形式: OpenAPI 3.0.3  
ER図形式: Mermaidを主、PlantUMLを補助

## 1. 作り直し方針

参考記事を踏まえ、成果物を次のように再構成する。

| 項目 | 方針 | 成果物 |
| --- | --- | --- |
| ER図 | Mermaid形式を提出用の正本にする。PlantUMLは編集候補として残し、見る用にHTML/PNGプレビューを用意する。 | `nextech_er_diagram.mmd`, `nextech_er_diagram.puml`, `nextech_er_diagram_preview.html`, `nextech_er_diagram_preview.png` |
| API仕様 | API一覧表ではなく、OpenAPI YAMLを正本にする。Redocで閲覧できるHTMLを付ける。 | `openapi/index.yaml`, `openapi/redoc-preview.html` |
| 仕様書本文 | DB/APIの判断理由、制約、運用上の注意点を本文にまとめ、詳細はER図とOpenAPIへ分離する。 | `nextech_design_spec_v2.md` |

参照記事:

- [ER図の作図について、Draw.io, PlantUML, Mermaidを比較してみる。](https://qiita.com/ryamate/items/3779418172c4f5a83212)
- [Redoc & Redocly 入門](https://zenn.dev/eggc/articles/726aa66c271f50)

## 2. 前提

| 項目 | 内容 |
| --- | --- |
| DB | PostgreSQL |
| 主キー | UUID |
| 時刻 | DB保存はUTC、画面表示はAsia/Tokyo |
| API | REST / JSON |
| 認証 | Bearer Token想定 |
| 利用者 | 参加者、主催者、管理者 |
| MVP対象 | 検索、詳細、申込、キャンセル待ち、マイページ、イベント管理、受付、管理者閲覧、基本集計 |
| MVP対象外 | 口コミ、コミュニティ投稿、自動通知、不適切情報の自動検知、決済、外部イベント連携 |

## 3. DB設計

### 3.1 ER図

正式なER図ソースはMermaid版とする。

- Mermaid: `nextech_er_diagram.mmd`
- PlantUML: `nextech_er_diagram.puml`
- PNGプレビュー: `nextech_er_diagram_preview.png`
- HTMLプレビュー: `nextech_er_diagram_preview.html`

Mermaid版では、テーブル、PK、FK、UK、主要カラム、リレーションを管理する。見るだけの場合はHTMLまたはPNGプレビューを使う。

### 3.2 テーブル一覧

| テーブル | 目的 | 主な関連 |
| --- | --- | --- |
| users | 利用者アカウント管理 | user_roles, registrations, organizers |
| user_roles | 参加者、主催者、管理者の権限管理 | users |
| organizers | 主催者情報管理 | users, organizer_members, events |
| organizer_members | 主催者を複数人で運営するための所属管理 | users, organizers |
| categories | イベントカテゴリ管理 | events, user_favorite_categories |
| tags | イベント検索用タグ管理 | event_tags |
| events | イベント本体管理 | organizers, categories, registrations |
| event_tags | イベントとタグの多対多管理 | events, tags |
| registrations | 参加申込、キャンセル待ち、受付状態管理 | users, events |
| registration_status_histories | 申込状態変更履歴 | registrations |
| user_favorite_organizers | 参加者の興味主催者登録 | users, organizers |
| user_favorite_categories | 参加者の興味カテゴリ登録 | users, categories |
| event_change_logs | イベント作成・編集・公開停止の履歴 | events, users |
| moderation_actions | 管理者対応履歴 | users |
| operation_logs | 主要操作の監査ログ | users |

### 3.3 主要制約

| 対象 | 制約 |
| --- | --- |
| users.email | 一意、ログインID |
| organizers.slug | 一意、URL識別子 |
| events.capacity | 0以上 |
| events.start_at / end_at | start_at < end_at |
| events.application_deadline | start_at以前 |
| registrations | 同一イベントに対する同一ユーザーの未キャンセル申込は1件まで |
| registrations.waitlist_position | waitlistedの場合のみ必須 |
| event_tags | event_id + tag_idで一意 |
| favorite系 | user_id + 対象IDで一意 |

### 3.4 ステータス

event.status:

| 値 | 意味 |
| --- | --- |
| draft | 下書き |
| published | 公開中 |
| suspended | 管理者による公開停止 |
| cancelled | 中止 |
| closed | 開催終了または募集終了 |

registration.status:

| 値 | 意味 |
| --- | --- |
| confirmed | 参加確定 |
| waitlisted | キャンセル待ち |
| cancelled | キャンセル済み |
| attended | 当日受付済み |
| no_show | 欠席 |

## 4. 申込・キャンセル待ち設計

参加申込はアクセス集中が起きやすいため、定員超過を防ぐ設計を優先する。

1. イベントがpublishedであることを確認する。
2. 申込期間内であることを確認する。
3. 同一ユーザーの未キャンセル申込がないことを確認する。
4. DBトランザクションを開始する。
5. 対象events行をロックする。
6. confirmed件数を確認する。
7. 空きがあればconfirmedでregistrationsへ登録する。
8. 空きがなく、waitlist_enabledがtrueならwaitlistedで登録する。
9. confirmedのキャンセル時は、waitlistedの先頭をconfirmedへ繰り上げる。
10. すべての状態変更をregistration_status_historiesへ記録する。

## 5. API設計

### 5.1 API正本

API仕様の正本はOpenAPI YAMLとする。

- OpenAPI: `openapi/index.yaml`
- Redoc表示HTML: `openapi/redoc-preview.html`
- Redoc本体: `openapi/redoc.standalone.js`
- Redocly設定: `openapi/redocly.yaml`

`redoc-preview.html`は同じフォルダの`redoc.standalone.js`と、HTML内に埋め込んだOpenAPI定義を使って表示する。

### 5.2 APIグループ

| グループ | 主なAPI |
| --- | --- |
| Auth | ユーザー登録、ログイン、ログアウト |
| Me | 自分のプロフィール、申込一覧、興味登録 |
| Events | イベント検索、詳細、申込、キャンセル |
| Organizers | 主催者情報、イベント作成・編集、参加者一覧、受付 |
| Admin | イベント管理、公開状態変更、集計 |

### 5.3 主要エンドポイント

| メソッド | パス | 概要 |
| --- | --- | --- |
| POST | /auth/signup | ユーザー登録 |
| POST | /auth/login | ログイン |
| GET | /me | 自分のユーザー情報取得 |
| GET | /events | 公開イベント検索 |
| GET | /events/{eventId} | イベント詳細取得 |
| POST | /events/{eventId}/registrations | イベント申込 |
| DELETE | /events/{eventId}/registration | 自分の申込キャンセル |
| GET | /me/registrations | 自分の申込一覧 |
| POST | /organizers | 主催者作成 |
| POST | /organizers/{organizerId}/events | イベント作成 |
| PATCH | /events/{eventId} | イベント編集 |
| GET | /events/{eventId}/registrations | 参加者一覧取得 |
| GET | /events/{eventId}/recruitment-summary | 募集状況取得 |
| POST | /events/{eventId}/registrations/{registrationId}/check-in | 当日受付 |
| GET | /admin/events | 管理者向けイベント一覧 |
| PATCH | /admin/events/{eventId}/status | イベント公開状態変更 |
| GET | /admin/analytics/monthly-events | 月別イベント開催数 |
| GET | /admin/analytics/popular-categories | 人気カテゴリ集計 |

### 5.4 共通レスポンス

成功時は原則として`data`に本体を返す。一覧APIは`pagination`を付ける。

```json
{
  "data": {},
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 100
  }
}
```

エラー時は`error.code`と`error.message`を返す。

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容を確認してください。",
    "details": [
      {
        "field": "title",
        "message": "イベント名は必須です。"
      }
    ]
  }
}
```

### 5.5 共通エラー

| HTTP | code | 内容 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 入力値不正 |
| 401 | AUTH_REQUIRED | 認証が必要 |
| 403 | FORBIDDEN | 権限不足 |
| 404 | NOT_FOUND | 対象なし |
| 409 | CONFLICT | 重複申込、状態競合 |
| 410 | REGISTRATION_CLOSED | 申込期間外 |
| 422 | BUSINESS_RULE_ERROR | 業務ルール違反 |
| 429 | RATE_LIMITED | アクセス過多 |
| 500 | INTERNAL_ERROR | サーバーエラー |

## 6. 権限設計

| 操作 | 未ログイン | 参加者 | 主催者メンバー | 管理者 |
| --- | --- | --- | --- | --- |
| 公開イベント検索 | 可 | 可 | 可 | 可 |
| イベント詳細閲覧 | 可 | 可 | 可 | 可 |
| 参加申込 | 不可 | 可 | 可 | 可 |
| 自分の申込キャンセル | 不可 | 可 | 可 | 可 |
| イベント作成・編集 | 不可 | 不可 | 自分の主催者のみ可 | 可 |
| 参加者一覧閲覧 | 不可 | 不可 | 自分の主催イベントのみ可 | 可 |
| 当日受付 | 不可 | 不可 | 自分の主催イベントのみ可 | 可 |
| 公開停止・復帰 | 不可 | 不可 | 不可 | 可 |
| 集計閲覧 | 不可 | 不可 | 不可 | 可 |

## 7. Redoc/Redoclyでの確認方法

Redoc表示:

```bash
open outputs/redone/openapi/redoc-preview.html
```

Redocly CLIを導入している場合:

```bash
npx @redocly/cli lint outputs/redone/openapi/index.yaml
npx @redocly/cli build-docs outputs/redone/openapi/index.yaml
```

この環境ではRedocly CLIが未導入だったため、今回はYAMLの構文検証まで実施した。

## 8. 実装時の注意点

- `online_url`は公開イベント詳細で無条件に返さず、参加確定者、主催者、管理者に限定する。
- 申込処理はキャッシュ値だけで判断せず、トランザクション内で確定申込数を確認する。
- 管理者の公開停止は物理削除ではなく`suspended`へ変更する。
- イベント、申込、管理者対応は履歴テーブルへ記録する。
- 将来の通知機能は`registration_status_histories`をトリガーにして拡張できる。
- 集計APIはMVPでは都度集計とし、データ増加後に日次集計テーブルやマテリアライズドビューへ移行する。
