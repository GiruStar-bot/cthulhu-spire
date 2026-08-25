# クトゥルスパイア / Cthulhu Spire

Slay the Spire × クトゥルフ神話のデッキビルディング・ローグライク。

> 知識は力であり、同時に滅びへの道である。黒き尖塔に、終わりはない。

**本線方針（正）:** [docs/GAME_VISION.md](docs/GAME_VISION.md)

**プレイ（現行デモ）:** [girustar-bot.github.io/cthulhu-spire](https://girustar-bot.github.io/cthulhu-spire/)

---

## 確定しているゲーム像

死ぬまで続く無限登攀。死亡でその人生はリセットされる。

| | 本線 |
|--|------|
| 終了 | 体力0のみ。クリア／エンディングなし |
| 進行 | 階層 1, 2, 3… を直線で登る（マップ分岐なし） |
| 通常階層 | 戦闘が主。カード・回復・正気イベント等がランダム混在 |
| 10の倍数 | **中ボス**（必ず接敵） |
| 50の倍数 | **大ボス**（必ず接敵） |
| 引き継ぎ | 死亡するまで体力・正気・デッキ・遺物を保持 |
| テーマ | 知識は両刃。正気は通貨。恐怖を優先 |

詳細・未確定項目は [docs/GAME_VISION.md](docs/GAME_VISION.md)。

---

## v0.3 要素

- **プロファイル**: 名前 / 体・心・意志 スタット配分 / localStorage持続
- **遺物**: 永久コレクション + 6スロットロードアウト + 階層依存ハッスル
- **オーディオ**: BGM (title/map/combat) + SFX
- **Prepare画面**: クラス選択の代替

---

## 開発

```bash
npm i
npm run dev
```

GitHub Pages: `main` への push で自動デプロイ。
