# クトゥルスパイア / Cthulhu Spire

Slay the Spire × クトゥルフ神話のデッキビルディング・ローグライク（Webデモ）。

> 知識は力であり、同時に滅びへの道である。

## プレイ

GitHub Pages で公開されます。

`https://girustar-bot.github.io/cthulhu-spire/`

## ローカル起動

```bash
npm install
npm run dev
```

ブラウザで表示された URL を開く。

```bash
npm run build
npm run preview
```

## 操作

1. 登攀を始める → クラスを選ぶ
2. マップで道を選ぶ
3. カードをタップしてプレイ（対象が必要なときは敵をタップ）
4. ターン終了

## 技術

- React 19 + Vite + Tailwind v4 + zustand
- 静的サイトとして GitHub Pages にデプロイ
