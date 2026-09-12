# Abyss of R'lyeh（アビスオブルルイエ）更新版 README 案

以下の内容で `README.md` を全面更新することを提案します。**古い記述（魔改造/CardForgeScreen/戦利品タブ/マゼンタクロマキー/chibi方針）は全て今回のセッションで置き換え・廃止済みのため削除**しています。

---

```markdown
# Abyss of R'lyeh（アビスオブルルイエ）

『Slay the Spire』のローグライク・デッキビルドと、『Escape from Tarkov』の永続ハクスラ（拠点＝ハブ）を融合した、クトゥルフ神話の2D潜航。

| | |
|---|---|
| リポジトリ | [GiruStar-bot/cthulhu-spire](https://github.com/GiruStar-bot/cthulhu-spire)（`main`） |
| 公開デモ | https://girustar-bot.github.io/cthulhu-spire/ |
| スタック | React 19 · Vite · Tailwind CSS v4 · Zustand 5 · TypeScript |
| 配布 | 静的サイト。`main` への push で GitHub Pages（`.github/workflows/pages.yml`） |

**現行の実装コードを正（Source of Truth）とする。** `docs/` 配下の旧稿は参考のみ。

---

## プレイサイクル

```
title → hub（探索開始 / デッキ編成 / 装備 / 売却 / ショップ / カードパック）
     → prepare（潜航前点検）
     → map / combat / event / rest …
     → end（死亡・帰還）
     → hub
```

ハブのタブ（`HubTab`、`src/components/game/HubScreen.tsx`）:

1. **探索開始**（`descend`） — ステ振りと潜航（`PrepareView.tsx`）
2. **デッキ編成**（`deck`） — **2段階の没入型UI**。一覧画面（保存済みデッキがタイル表示、「＋新規デッキ」）→ 選択/新規作成で編集画面（左上「戻る」、右上「デッキ保存」。デッキ切り替えタブは廃止済み）
3. **装備**（`equipment`） — 5部位管理、ルーンソケット、**装備プリセット**（`profile.equipmentPresets`、UID参照で保存し常に最新の装備状態を反映）
4. **売却**（`sell`） — ダンジョン外からも売却可能。同名カードは重ね表示、デッキ使用分は保護、`COPY_LIMIT`超過分の一括選択あり
5. **ショップ**（`shop`） — 基本カードパック（お試し実装）
6. **カードパック**（`packs`） — **没入型フルスクリーン**（サイドバー・ヘッダー非表示、左上「戻る」のみ）。アーキタイプ別パック9種＋開封演出（`PackShopScreen.tsx`, `PackOpenSequence.tsx`）

旧「戦利品」タブは、デッキ編成画面の所持カード一覧と機能重複のため廃止済み。旧「魔改造」画面（`CardForgeScreen.tsx`）は装備画面のルーンソケットに統合済み。

---

## アーキタイプ（10種）

`src/game/types.ts`の`Archetype`型：`generic` / `fanatic`（狂信） / `knight`（騎士） / `poison`（毒） / `outer`（外宇宙） / `elder`（旧神） / `deep`（深き者） / `offering`（供物） / `shadow`（影） / `greatold`（旧支配者）

- 各アーキタイプにデッキシナジー（8/12/16枚で段階バフ）、装備全身セット効果、専用カードパックがある。
- `elder`（旧神）と`greatold`（旧支配者）は当初同じ括りだったが、神話上の区別（Elder Gods / Great Old Ones）に合わせて分離済み。
- 「全なる者」（元ヨグ・ソトース、`yog_sothoth`）関連の**新アーキタイプ「全」は未実装**（構想段階。全スキル/バフを内包する専用カード＋シークレットパックとして計画中）。

---

## ラスボス「全なる者」（第100層）

- `src/game/enemies.ts`の`yog_sothoth`。HP 9999（意図的に理不尽な数値、バランス調整は今後）。
- 専用背景`beyond`biome（`src/game/biomes.ts`）。翼蛇×無数の発光する球体で構成された非人型デザイン。
- 専用デッキは複数アーキタイプの代表カードを混成（`eldersign`, `star_sword`, `yog_gun`等）。将来的に「全」専用カードに置き換え予定。

---

## UIシステム（今回のセッションで大幅刷新）

- **`.panel`ベースの共通スタイル**：`src/styles.css`。旧`border-2 border-white`の生スタイルは全画面で置き換え済み。
- **`border-image`による本物の額縁**：カードはレア度別（スターター/コモン/アンコモン/レア）＋神話ジャンル専用（`greatold`/`elder`/`outer`は発光アニメーション付き、レア度に優先）のフレーム画像を使用。9-slice方式で可変サイズに対応。
- **戦闘中の手札**：扇状（ファン）配置＋ドロー時のアニメーション（`CombatView.tsx`の`fanPose`関数）。
- **敵の死亡演出**：塵化ディゾルブ（`mask-image`合成＋パーティクル）。旧来の縮小演出は廃止。
- **エネミー立ち絵**：**マゼンタクロマキー方針は廃止**。Gemini/Grokで**黒背景＋透過PNGをそのまま使用**（追加の背景除去処理は不要、むしろ有害と判明したため行わない）。キャラクターデザイン方針も「不気味可愛いchibi」から**「NOT chibi、ドット絵の塊感を強く残す」**へ変更。背景とのコントラスト（明度）を意識した配色指示が必須。
- **キャッシュ対策**：`src/lib/asset.ts`の`asset()`が`VITE_COMMIT_SHA`をクエリパラメータに付与。`public/`直下の画像・音声を差し替えても、ビルドごとに確実に最新版が読み込まれる。

---

## 音響

- BGM：`title`/`combat`/`boss`/`rest`/`event`が実装済み（`reward`は意図的に無音）。DOVA-SYNDROME由来、クレジット表記不要。
- 効果音：`attack`/`block`/`hurt`/`step`/`lose`/`select`は実音源。`ui`/`hover`/`draw`/`win`/`reward`等は依然オシレーターの仮ビープ音（本実装は今後）。

---

## アセットパイプライン

```bash
npm run apply-art -- --kind cards|enemies|equipment
# incoming/ の画像を public/art/pixel/ へ反映しコードを書き換え

python3 scripts/pixelate.py 入力画像 [出力画像] [--block N] [--colors N]
# Gemini/Grok生成画像が滑らかすぎる場合のドット絵化後処理(必要な場合のみ。基本は生成プロンプト側でピクセルアート感を強制する運用)
```

キャラクター/敵イラスト生成の標準プロンプト方針（Gemini/Grok共通）:
- 黒背景RGB(0,0,0)、生成後は追加の透過処理をしない（既に正しく透過済みのため）
- 「Simple, low-detail character design」等、単純化の指示を必ず入れる（装飾を描写に含めすぎると単純化指示が効かなくなるため、装飾要素は最小限に絞って記述する）
- 背景の明度とキャラクターの明度が十分コントラストを持つよう明記する
- 「Do not draw any light beam/glow/outline around the silhouette」を必ず入れる（光源表現がキャラの輪郭にオレンジ発光やハローとして出力される事故を防ぐ）
- 正面向き・左右対称を強めに指示する（"perfectly mirror-symmetric, shoulders squared, not angled"）
- 腕を広げる等のポーズでは「全身が必ずフレームに収まる」ことを明記する

---

## 開発

```bash
npm i
npm run dev
npm run typecheck
```

Pages のベースパスは `VITE_BASE=/cthulhu-spire/`。

コミット方針（`AGENTS.project.md`）:
- 機能・アセット・ロジックを更新したら `main` へ push する
- ゲームで使う `public/art/` はリポジトリに含めてよい
- `node_modules/`、`.env`、シークレットは禁止

---

## 既知の負債

1. **`CardInst` と `CardInstance` の分裂**（要再確認。前回READMEから未解決の可能性あり）
2. **「全」アーキタイプ・専用カードが未実装**（構想のみ）
3. **効果音の一部が仮のオシレーター音のまま**（`ui`/`hover`/`draw`/`win`/`reward`）
4. **カードパックがショップ画面（基本版）とカードパック画面（属性別・演出込み）で二重実装**：将来的に基本版を廃止するか統合するか要判断

---

## ドキュメントの扱い

| ファイル | 扱い |
|---|---|
| この README | 現行実装の入口。**大きな機能追加のたびに更新すること** |
| `src/game/store.ts` ほか実装 | Source of Truth |
| `AGENTS.project.md` | GitHub push の運用（変更なし） |
```

---

上記を`README.md`にそのまま上書きしてください。「既知の負債1」（CardInst分裂）は私の方で今回裏取りできていないので、実装側で現状を確認の上、解消済みなら削除してください。
