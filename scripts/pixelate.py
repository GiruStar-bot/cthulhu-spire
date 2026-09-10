#!/usr/bin/env python3
"""
Geminiで生成した「滑らかすぎる」画像を、既存アセットに近いドット絵感に
後処理するスクリプト。縮小→減色→最近傍補間で拡大、という手順で
ブロック状の陰影・限定的な色数を強制的に作り出す。
使い方:
    python3 pixelate.py 入力ファイル.png [出力ファイル.png] [--block N] [--colors N]
    python3 pixelate.py 入力フォルダ/ [出力フォルダ/]   # フォルダ一括処理
  --block:  縮小倍率(大きいほど粗いドット絵になる)。デフォルト6
  --colors: 減色後の色数。デフォルト24
必要ライブラリ: Pillow
    pip install Pillow
"""
import argparse
from pathlib import Path

from PIL import Image


def pixelate(img: Image.Image, block: int = 6, colors: int = 24) -> Image.Image:
    im = img.convert("RGBA")
    w, h = im.size
    small = im.resize((max(1, w // block), max(1, h // block)), Image.BILINEAR)
    # RGBだけ減色し、アルファチャンネルは維持する
    rgb = small.convert("RGB")
    quantized = rgb.quantize(colors=colors, method=Image.MEDIANCUT).convert("RGB")
    alpha = small.split()[3]
    small_rgba = Image.merge("RGBA", (*quantized.split(), alpha))
    # 最近傍補間で元のサイズに拡大 -> くっきりした四角いピクセルになる
    result = small_rgba.resize((w, h), Image.NEAREST)
    return result


def process_file(src: Path, dst: Path, block: int, colors: int) -> None:
    img = Image.open(src)
    result = pixelate(img, block=block, colors=colors)
    dst.parent.mkdir(parents=True, exist_ok=True)
    result.save(dst)
    print(f"  {src.name} -> {dst}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("src")
    parser.add_argument("dst", nargs="?")
    parser.add_argument("--block", type=int, default=6)
    parser.add_argument("--colors", type=int, default=24)
    args = parser.parse_args()
    src_path = Path(args.src)
    if src_path.is_dir():
        dst_dir = Path(args.dst) if args.dst else src_path / "pixelated"
        exts = {".jpg", ".jpeg", ".png", ".webp"}
        files = [f for f in src_path.iterdir() if f.suffix.lower() in exts]
        print(f"{len(files)}件のファイルを処理します...")
        for f in files:
            process_file(f, dst_dir / f"{f.stem}.png", args.block, args.colors)
        print(f"完了。出力先: {dst_dir}")
    else:
        dst_path = Path(args.dst) if args.dst else src_path.with_name(f"{src_path.stem}_pixelated.png")
        process_file(src_path, dst_path, args.block, args.colors)
        print("完了。")


if __name__ == "__main__":
    main()
