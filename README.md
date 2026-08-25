# クトゥルスパイア / Cthulhu Spire

Slay the Spire × クトゥルフ神話のデッキビルディング・ローグライク（Webデモ）。

> 知識は力であり、同時に滅びへの道である。

**リポジトリ:** https://github.com/GiruStar-bot/cthulhu-spire

**プレイ（GitHub Pages）:** https://girustar-bot.github.io/cthulhu-spire/

初回だけ、GitHub の **Settings → Pages → Branch を `gh-pages` / root** にすると公開されます。以降は `main` への push で自動更新します。

## ローカル起動

```bash
git clone https://github.com/GiruStar-bot/cthulhu-spire.git
cd cthulhu-spire
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
- 静的サイト。`gh-pages` ブランチへデプロイ
