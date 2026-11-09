# 参加者画面のデモ画像

`bun run db:seed` で投入する3イベント専用の素材です。内蔵の画像生成ツールで制作し、横幅900pxのWebPに変換しました。イベント名・日時などの情報は画像に焼き込まず、画面のテキストで表示します。

| アセット | 生成プロンプトの Subject |
| --- | --- |
| [web-api.webp](../Frontend/public/demo-events/web-api.webp) | A laptop on a developer workbench with restrained code-like colored lines, and a slim server unit, midnight navy with electric blue and icy cyan accents. |
| [ui-design.webp](../Frontend/public/demo-events/ui-design.webp) | Tactile interface design workshop: stacked abstract interface panels and color swatches on a tabletop, soft lilac, deep indigo and warm coral accents. |
| [cloud.webp](../Frontend/public/demo-events/cloud.webp) | A compact cluster of miniature server racks and translucent interconnected cloud-like shapes, rich teal and mint against dark blue-green. |

生成プロンプトは次の共通部分に、表の Subject を差し込んでいます。

> Use case: stylized-concept. Asset type: wide banner for a Japanese tech event discovery card and its detail page. Subject: {Subject} Style: refined editorial 3D still life, soft directional light, tactile finishes, crisp recognizable silhouette even at phone thumbnail size. Landscape full bleed; put important shapes across the middle horizontal third so a centered 3:1 crop and 2:1 crop both work. Edge-to-edge coherent scene. No words, no readable typography, no letters, no logos or watermark.
