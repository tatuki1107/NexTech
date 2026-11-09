# 参加者画面のデザインレビュー

2026-11-09。ローカルのデモ環境で、390 × 844 と 1100 × 800 のブラウザ表示を確認。主催者・管理者画面は対象外。

| 順番 | 画面と確認結果 | スクリーンショット |
| --- | --- | --- |
| 1 | 一覧・検索：入力欄の四辺を表示し、フォーカスを明示。開催日・タグ・場所のメニューが同じ動きで開閉し、Esc で閉じると操作元にフォーカスが戻る。タグで絞り込める。 | [一覧](screenshots/participant-review/participant-review-01-search.jpg) |
| 2 | 検索結果0件：未開催と検索不一致を区別し、「検索条件をクリア」から一覧に復帰できる。 | [検索結果0件](screenshots/participant-review/participant-review-02-empty.jpg) |
| 3 | 詳細検索：画面下端からせり上がる。Tab のフォーカスを内側に保ち、Esc で閉じられる。 | [検索条件モーダル](screenshots/participant-review/participant-review-03-filters.jpg) |
| 4 | イベント詳細・申込取消：確認を本文から分離し、対象イベントと操作を明記。最初のフォーカスは「申込を残す」。そのボタンと Esc の両方で、申込を維持したまま閉じられる。 | [取消確認](screenshots/participant-review/participant-review-04-cancellation.jpg) |
| 5 | 保存済み：一覧と詳細で画像の対応が明確。保存済みから開いた詳細の「戻る」は保存済みへ、直接開いた詳細からはイベント一覧へ戻る。 | [保存済み](screenshots/participant-review/participant-review-05-saved.jpg) |
| 6 | マイページ：参加予定のカードと関連イベントの空状態を区別できる。取消確認を閉じた後も、参加予定カードが残っている。 | [マイページ](screenshots/participant-review/participant-review-06-mypage.jpg) |
| 7 | PC幅：モバイル版の1列構成を維持し、固定ナビの下に本文がはみ出して見える問題を解消。 | [PC幅の一覧](screenshots/participant-review/participant-review-07-desktop.jpg) |

## 残課題と確認範囲

- 一覧カードの開催形式は後続対応で表示を追加済み。[追加後のテスト計画・結果](participant-test-plan.md)を参照。
- PCでは1列を維持しているため、複数イベントを横並びで比較する用途には向かない。PC向けの一覧レイアウトは今回変更していない。
- 今回は既存の申込を維持するため、取消の確定操作は行っていない。スクリーンリーダー実機と色の全組み合わせのコントラスト検証も対象外。動きを減らす設定への配慮はCSSで維持している。
