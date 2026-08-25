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

## 現行デモについて

公開中の Web デモは**旧骨格**です。

- 一面／二面／三面
- マップのノード選択
- 三面ボスで勝利

本線の無限登攀へ作り替える前の、戦闘・カード・正気の検証用です。

---

## ローカル起動

```bash
git clone https://github.com/GiruStar-bot/cthulhu-spire.git
cd cthulhu-spire
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## 操作（現行デモ）

1. 登攀を始める → クラスを選ぶ
2. マップで道を選ぶ
3. カードをタップ（対象が必要なら敵をタップ）
4. ターン終了

## 技術

- React 19 + Vite + Tailwind v4 + zustand
- `main` への push で `gh-pages` に自動デプロイ
