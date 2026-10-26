# NexTech 設計・開発資料

## 現行実装の資料

- [要件定義書とAPIの対応](API_REQUIREMENTS.md)
- [現行OpenAPI](../Backend/app/openapi/index.yaml)：API実装に対応する入力・出力・状態値。
- [Backendの起動・検証手順](../Backend/app/README.md)
- [DBスキーマ](../Backend/app/src/db/schema.ts)・[追加マイグレーション](../Backend/app/drizzle/)
- [コーディングルール](CODING_RULES.md)
- [開発への参加手順](../CONTRIBUTING.md)

## 受領した設計資料 v2

- [資料案内](design-v2/README.md)
- [現行devとの照合結果](design-v2/REVIEW.md)

受領資料は2026-07-06付の設計時点の内容です。現行実装と異なる状態名・制約があります。
APIクライアントの実装には、上記の現行OpenAPIと要件対応表を参照してください。
