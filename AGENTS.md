# Repository instructions

このリポジトリで作業するAIエージェントは、変更前に次の文書を確認してください。

- `docs/CODING_RULES.md`：実装、命名、設計、セキュリティ、完了条件
- `CONTRIBUTING.md`：変更手順、コミット、Pull Request、検証方法

## 作業方針

- 依頼された目的に必要な範囲だけを変更する。
- 既存の構成と命名を確認してから、新しい構造を追加する。
- 新しい依存パッケージや大きな設計変更は、必要性と影響を説明して合意を得る。
- 秘密情報や個人情報をコード、ログ、テストデータへ含めない。
- 変更後は、影響範囲に応じて型チェック、Lint、ビルド、テストを実行する。
- 検証できなかった項目がある場合は、その理由を明確に報告する。

## プロジェクト構成

- `Frontend/`：Next.js、React、TypeScript、Tailwind CSS
- `Backend/app/`：Bun、Elysia、TypeScript

Frontend固有の追加指示は `Frontend/AGENTS.md` にあります。
