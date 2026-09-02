# Abyss of R'lyeh

クトゥルフ神話のデッキビルド＋永続ハクスラ。  
Slay the Spire の戦闘と、Escape from Tarkov の拠点（ハブ）を合わせた 2D 潜航。

**プレイ:** [girustar-bot.github.io/cthulhu-spire](https://girustar-bot.github.io/cthulhu-spire/)  
**リポジトリ:** [GiruStar-bot/cthulhu-spire](https://github.com/GiruStar-bot/cthulhu-spire)（`main`）

実装コードを正とする。`docs/` の旧稿（無限沈降・ハブなし）は参考のみ。食い違う記述はコードを優先する。

---

## プレイサイクル（実装済み）

`title` → `hub` → ダンジョン（`combat` / `event` / `rest` …）→ 死亡・帰還 → `hub`

| 画面 | 役割 | 主なファイル |
|---|---|---|
| タイトル | プレイ / 設定 / クレジット | `src/components/game/TitleScreen.tsx` |
| ハブ | 探索開始・デッキ編成・魔改造・戦利品 | `src/components/game/HubScreen.tsx` |
| 潜航前 | 名前・ステ振り・遺物持込・潜航開始 | `src/components/game/PrepareView.tsx` |
| 戦闘以降 | カード戦闘・村・イベント | `src/components/game/CombatView.tsx` ほか |
| シーン管理 | Zustand | `src/game/store.ts` |

ハブの4タブ:

1. **探索開始** — ステ振りと潜航
2. **デッキ編成** — 所持カードから最大20枚（同名は4枚まで）
3. **魔改造** — ルーンをソケットへ着脱（DnD。ゴーストは透過PNGのみ）
4. **戦利品** — 刻んだ遺物・所持カード・ルーン

---

## システム（現行）

- **デッキ:** 上限20、同名4枚（`COPY_LIMIT`）。戦闘開始時に `useCollectionStore.deck` を `CardInst` へ変換する。
- **ルーン:** 8種（atk / blk / draw / cost / san / str / poison / heal）。透過PNG。`socketRune` / `unsocketRune`。
- **遺物:** 永久コレクション + ラン持込6枠（`RELIC_SLOTS`）。
- **進行:** 直線沈降。10層ごと中ボス、50層ごと大ボス。デモは第100層で一旦閉じる。
- **プロファイル:** 名前・ステ・コレクションは `localStorage`（`src/game/profile.ts`）。
- **見た目:** ピクセルUI（`PixelButton` / `PixelWindow`）。マゼンタクロマキーは `src/lib/imageUtils.ts`。

---

## スタック

React 19 · Vite · Tailwind CSS v4 · Zustand 5 · TypeScript  
静的サイト。`main` への push で GitHub Pages に自動デプロイ（`.github/workflows/pages.yml`）。

---

## 開発

```bash
npm i
npm run dev
npm run typecheck
```

Pages のベースパスは `VITE_BASE=/cthulhu-spire/`。

アセット:

- ルーン `public/art/pixel/runes/*.png`
- カード絵 `public/art/pixel/cards/`
- 戦闘背景・敵 `public/art/pixel/`

足りない絵のリスト: [`artifacts/ASSET_REQUEST.md`](artifacts/ASSET_REQUEST.md)

---

## 既知の負債（次タスク候補）

1. **`CardInst` と `CardInstance` が並存。** 戦闘実体とハブ所持が別型。魔改造結果は開始時スナップショットで渡しているが、型は未統合。
2. **`useCollectionStore` が persist していない。** リロードでデッキ・ルーン・装備遺物が消える。`profile.ts` と同様に Zustand persist が必要。
3. **`rounded-full` が残る。** `Hud.tsx` / `CardView.tsx` / `RestView.tsx` など。角形に置換する。

---

## ドキュメント

| ファイル | 扱い |
|---|---|
| この README | 現行実装の入口 |
| `src/game/store.ts` ほか | Source of Truth |
| `docs/GAME_VISION.md` など | 旧構想。ハブなし記述は無視 |
| `AGENTS.project.md` | 更新のたびに GitHub へ push する運用 |
