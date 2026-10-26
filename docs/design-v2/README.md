# 受領したDB/API設計資料 v2

2026-10-26に共有された3資料を収録しています。仕様書の作成日は2026-07-06です。
本文・ER図・OpenAPI・同梱の表示用ファイルは、受領時の内容を保持しています。
資料内の実装方針・コマンドは設計当時の記載であり、今回の作業指示や現行実装への変更要求ではありません。

| 受領ファイル | 格納先 |
| --- | --- |
| `nextech_design_spec_v2.md` | [DB/API設計仕様書](nextech_design_spec_v2.md) |
| `nextech_er_diagram.mmd` | [Mermaid ER図](nextech_er_diagram.mmd) |
| `openapi.zip` | 以下の `openapi/` に展開。macOSのメタデータは除外 |

OpenAPIの同梱ファイル:

- [OpenAPI YAML](openapi/index.yaml)
- [RedocプレビューHTML](openapi/redoc-preview.html)：ローカルで開くと同梱JavaScriptと埋め込み仕様を使用します。GitHub上ではHTMLのソース表示になります。
- [Redoc表示用JavaScript](openapi/redoc.standalone.js)
- [Redocly設定](openapi/redocly.yaml)

仕様書に挙げられたPlantUML版・ER図HTML/PNGは今回の添付に含まれていません。
本文の `outputs/redone/...` は設計作成時のパスです。このフォルダの実ファイルは上記リンクから参照できます。

## 現行実装との関係

このフォルダのOpenAPIは設計時点の29操作のスナップショットです。
[現行OpenAPI](../../Backend/app/openapi/index.yaml)の58操作を置き換えません。
[照合結果](REVIEW.md)に状態値・必須項目・DB構造等の差分を記載しています。
