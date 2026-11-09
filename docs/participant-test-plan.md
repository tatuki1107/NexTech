# 参加者画面のテスト計画と実行結果

対象：参加者画面と接続するAPI。主催者・管理者は既存自動テストの範囲のみ。
手動確認は画像付きの開発デモを使い、既存の申込・保存・設定は変更しない。
更新日：2026-11-09（JST）。

## ブラウザで確認する項目

| ID | 操作 | 期待結果 | 結果 |
| --- | --- | --- | --- |
| UI-01 | 390px・1100px幅で一覧を表示し、3種類のデモカードを比較 | 「会場」「オンライン」「ハイブリッド」が表示され、カテゴリ・残席と重ならない。オンラインの重複表記や横スクロールがない。 | 合格。[スマホ上部](screenshots/participant-test/participant-test-02-mobile.jpg)・[スマホ下部](screenshots/participant-test/participant-test-03-mobile-formats.jpg)・[PC](screenshots/participant-test/participant-test-01-desktop.jpg) |
| UI-02 | 開催日・タグ・場所を開閉し、開催形式で絞る。0件から条件をクリア | メニューが共通の見た目で開閉し、適用後は対象だけが表示され、条件クリアで全件に戻る。 | 合格。3メニューがEscで閉じ、[オンラインで1件](screenshots/participant-test/participant-test-06-online-filter.jpg)、条件クリアで4件に戻った。適用条件の見え方に改善余地あり。 |
| UI-03 | イベント詳細へ移動し、画像・日時・残席・申込導線を確認 | 一覧と同じイベントを表示し、ボタンと下部ナビが重ならない。 | 合格。[詳細](screenshots/participant-test/participant-test-04-detail.jpg)で下部ナビとボタンの間に12pxの間隔を確認。 |
| UI-04 | 保存済みから詳細へ移動して「戻る」 | カードに形式が表示され、詳細から保存済みに戻る。 | 合格。[保存済み](screenshots/participant-test/participant-test-05-saved.jpg)で「会場」を確認し、詳細から `/saved` に戻った。 |
| UI-05 | マイページの各タブを切り替え、参加予定イベントから取消確認を開いて閉じる | タブ状態が切り替わる。取消せず閉じると参加予定は維持される。 | 合格。[3タブ](screenshots/participant-test/participant-test-07-mypage.jpg)を切り替え、[取消確認](screenshots/participant-test/participant-test-08-cancel.jpg)を閉じても申込は維持。 |
| UI-06 | 通知、興味・フォロー、設定、ログイン・新規登録を表示 | 対応する画面と、この検証データに該当する状態が表示される。フォームの送信や設定の変更はしない。 | 合格。[通知](screenshots/participant-test/participant-test-11-notifications.jpg)・[フォロー](screenshots/participant-test/participant-test-09-interests.jpg)・[設定](screenshots/participant-test/participant-test-10-settings.jpg)・[ログイン](screenshots/participant-test/participant-test-12-login.jpg)・[新規登録](screenshots/participant-test/participant-test-13-signup.jpg)。通知は未読データの表示を確認。 |
| UI-07 | 詳細検索で複数条件を適用し、一覧上で1つずつ解除する | 解除した条件だけが消え、残りの条件と件数が更新される。0件でも個別解除できる。 | 合格。[スマホ幅390px](screenshots/participant-test/participant-applied-mobile.jpg)でキーワード・開催日・2タグ・形式・並び順を適用し、キーボードとクリックで個別に解除。[PC幅1100px](screenshots/participant-test/participant-applied-desktop.jpg)で2タグと開催形式を解除し、1→2→1→4件と更新。0→1件への復帰も確認。 |
| UI-08 | 詳細検索で「会場」「オンライン」「ハイブリッド」をそれぞれ適用・解除する | 選択した形式のカードだけが表示され、解除すると全形式に戻る。他条件は残る。 | 合格。[スマホ幅390px](screenshots/participant-test/participant-format-filter-mobile.jpg)・[PC幅1100px](screenshots/participant-test/participant-format-filter-desktop.jpg)で会場1件・オンライン1件・ハイブリッド2件、各解除後は全4件。検索条件ページから指定したタグは、形式だけ解除して再読み込みしても残った。 |
| UI-09 | URLから適用した条件の個別解除・一括クリア後にページを再読み込みする | 解除済み条件は復活しない。個別解除では残りの条件が、一括クリアでは無関係なURLパラメータが残る。 | 合格。Dockerタグの解除後に再読み込みしてもハイブリッド2件。一括クリア後は無関係な `source` だけが残り、再読み込み後も全4件。 |
| UI-10 | 参加URLと申込ボタンが両方表示されるイベント詳細で、保存ボタンからTabを押す | 参加URLにフォーカスが当たり、リンク全体とフォーカス枠が固定ボタンより上に見える。申込ボタンの位置は変わらない。 | 合格。[スマホ幅390×820](screenshots/participant-test/pr30-focus-mobile.jpg)・[PC幅1100×860](screenshots/participant-test/pr30-focus-desktop.jpg)で、Tab後にリンクと固定ボタンの間隔が8px以上あり、固定ボタンの座標が変わらないことを確認。 |

## 自動テスト

| ID | 手順 | 期待結果 | 結果 |
| --- | --- | --- | --- |
| AUTO-01 | Frontendで `npm run lint`、`npm run build`、`bun test` | Lint・型チェック・ビルドと、開催形式・検索条件の再読み込みの回帰テストが通る。 | 合格。41件成功、0件失敗。 |
| AUTO-02 | Backendで `bun run typecheck`、`bun run openapi:lint` | 型とOpenAPI契約の検査が通る。 | 合格。OpenAPIは61操作を検査。 |
| AUTO-03 | 使い捨てのPostgreSQLへ `bun run db:migrate`、`RUN_DB_TESTS=1 TEST_DATABASE_URL=… bun test` | 実DBで認証・検索・保存・申込/取消などの回帰テストが通る。 | 合格。マイグレーション成功、70件成功、0件失敗。 |

## 全体レビュー

- 一覧：形式・カテゴリ・残席をそれぞれ文字で判別できる。3種類すべてでラベル同士の重なりはなかった。PCでは既存の1列構成を維持。
- 対応済み：詳細検索で適用した条件を、一覧直上の「適用中の条件」で確認・個別解除できる（UI-07）。
- 対応済み：詳細検索の開催形式をカードの表示と揃え、「会場」「オンライン」「ハイブリッド」を個別に指定できる（UI-08）。
- 未検証：ブラウザでの認証フォーム送信・取消確定・設定変更、実機のスクリーンリーダー、全画面のコントラスト。認証と申込/取消のバックエンド挙動は使い捨てDBの自動テストで検証した。
