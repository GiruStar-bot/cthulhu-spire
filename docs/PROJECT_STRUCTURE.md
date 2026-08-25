# Project Structure

```
cthulhu-spire/
├── README.md
├── docs/
│   ├── GAME_VISION.md      # 本線のゲーム像・システム（正）
│   ├── DESIGN_PILLARS.md
│   ├── VISION.md
│   ├── TECHNICAL_NOTES.md
│   └── PROJECT_STRUCTURE.md
├── src/                    # 現行 Web デモ（React + Vite）
├── public/art/
└── .github/workflows/pages.yml
```

## 現状

- **公開デモ:** GitHub Pages の Web 版。旧骨格（三面・マップ分岐）
- **本線方針:** `docs/GAME_VISION.md`（無限登攀・死亡リセット）
- 本実装エンジン（Godot 等）は未着手

デモを本線仕様へ作り替えるのが次の実装課題。
