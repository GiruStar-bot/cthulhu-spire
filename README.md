# Abyss of R'lyeh（アビスオブルルイエ）

『Slay the Spire』のローグライク・デッキビルドと、『Escape from Tarkov』の永続ハクスラ（拠点＝ハブ）を融合した、クトゥルフ神話の 2D 潜航。

| | |
|---|---|
| リポジトリ | [GiruStar-bot/cthulhu-spire](https://github.com/GiruStar-bot/cthulhu-spire)（`main`） |
| 公開デモ | https://girustar-bot.github.io/cthulhu-spire/ |
| スタック | React 19 · Vite · Tailwind CSS v4 · Zustand 5 · TypeScript |
| 配布 | 静的サイト。`main` への push で GitHub Pages（`.github/workflows/pages.yml`） |

**現行の実装コードを正（Source of Truth）とする。**  
`docs/` 配下の旧稿（無限沈降・ハブなし案）は参考のみ。実装と食い違う記述は無視する。作業は新規構築ではなく、既存ファイルの拡張・修正。

---

## プレイサイクル（実装済み）

```
title → hub（探索開始 / デッキ編成 / 魔改造 / 戦利品）
     → prepare（潜航前点検）
     → map / combat / event / rest …
     → end（死亡・帰還）
     → hub
```

| 画面 | 役割 | ファイル |
|---|---|---|
| タイトル | プレイ / 設定 / クレジットのみ | `src/components/game/TitleScreen.tsx` |
| ハブ | 拠点。4タブの中継 | `src/components/game/HubScreen.tsx` |
| 潜航前 | 名前・ステ振り・遺物持込・潜航開始 | `src/components/game/PrepareView.tsx` |
| シーン | `title` \| `hub` \| `prepare` \| 戦闘系 \| 終了系 | `src/game/store.ts` |

ハブのタブ:

1. **探索開始** — ステ振りと潜航
2. **デッキ編成** — 所持カードから最大 20 枚。同名は 4 枚まで（`COPY_LIMIT`）
3. **魔改造** — ルーンをソケットへ着脱。カードの `sockets` は 1〜3。`socketRune` / `unsocketRune`
4. **戦利品** — 魂に刻んだ遺物・所持カード・ルーン

---

## システム（現行）

- **デッキ:** 上限 20、同名 4 枚。`src/store/useCollectionStore.ts`
- **魔改造:** DnD ソケット。ゴーストは透過 PNG 単体（`dataTransfer.setDragImage`）。枠・発光・テキストは追従しない。`src/components/loadout/CardForgeScreen.tsx`
- **遺物:** 永久コレクション + ラン持込 6 枠（`MAX_LOADOUT`）。点検画面の `profile.loadoutIds` が持込の正。撃破時に tier + ロールでインスタンス生成。`src/game/relics.ts`、`PlayerProfile.collection`
- **プロファイル:** 名前・ステ・刻んだ遺物は `localStorage`（`src/game/profile.ts`）
- **戦闘一時データ:** 現在 HP、階層、`CombatState` はラン限り。ハブ帰還で捨てる
- **進行:** 直線沈降。10 層ごと中ボス、50 層ごと大ボス。デモは第 100 層で一旦閉じる

### データ境界（未完成）

| 層 | 内容 | 永続 |
|---|---|---|
| `profile` | 名前、ステ、刻んだ遺物 | する（`profile.ts`） |
| `useCollectionStore` | 所持カード、デッキ、ルーン | **しない** |
| `CombatState` / ラン | HP、階層、手札 | しない |

---

## UI ルール

ピクセル／レトロ（SFC〜PS1 インディー）を拘束する。

禁止: `rounded-lg`、グラスモーフィズム、`backdrop-blur`、グラデ影。  
必須: `rounded-none`、`border-2` / `border-4`、ソリッド影（例 `shadow-[3px_3px_0_0_#000]`）。  
基盤: `src/components/ui/PixelButton.tsx`、`PixelWindow.tsx`。

違反として残っている箇所（修正対象）:

- `src/components/game/Hud.tsx`（HP バー）
- `src/components/game/CardView.tsx`（バッジ）
- `src/components/game/RestView.tsx`

`rounded-full` は洗い出して角形または八角形へ。

### アセット

- ルーン・カード・遺物アイコンは透過 PNG。`public/art/pixel/runes/*.png`
- 新規 DnD も「画像単体が動く」方式を踏襲する
- 立ち絵・待機動画はマゼンタ `#FF00FF` クロマキー。`src/lib/imageUtils.ts` の `chromaKeyImageData`（tolerance / feather）を再利用
- キャラ絵の方針: 不気味可愛い（Eerie Chibi）、完全正面・全身・武器なし
- 生成済み画像は `incoming/` に id 名で置き、パス書き換えまで一括する:

```
npm run apply-art -- --kind cards
# incoming/cards/ の画像を public/art/pixel/cards/ へ反映し cards.ts を書き換え

npm run apply-art -- --kind enemies
# incoming/enemies/ の画像を public/art/pixel/ へ反映し enemies.ts を書き換え
```

`incoming/` は受け皿のため git 管理外。

不足リスト: [`artifacts/ASSET_REQUEST.md`](artifacts/ASSET_REQUEST.md)

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

## 既知の負債（優先）

1. **`CardInst` と `CardInstance` の分裂**  
   戦闘実体（`src/game/types.ts`、`socketedRunes?` / `runeMods?`）とハブ所持（`useCollectionStore`、`sockets` / `socketedRunes: string[]`）が別型。開始時スナップショットはあるが未統合。単一型にするか、変換を確定させる。
2. **`useCollectionStore` が persist していない**  
   リロードでデッキ・ルーン・装備が消える。`zustand/middleware` の `persist` を `profile.ts` と同様に当てる。
3. **`rounded-full` 残存**（上記 UI ルール）。
4. **`docs/GAME_VISION.md` 等がハブなし構想のまま。** 実装（ハブあり）と矛盾。docs の書き換えは未判断。

---

## ドキュメントの扱い

| ファイル | 扱い |
|---|---|
| この README | 現行実装の入口 |
| `src/game/store.ts` ほか実装 | Source of Truth |
| `docs/GAME_VISION.md` など | 旧構想。ハブなし記述は無視 |
| `AGENTS.project.md` | GitHub push の運用 |
