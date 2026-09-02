# ASSET REQUEST — 足りない絵（エンジニア視点）

日付: 2026-09-02  
方針: 生成はしない。ファイル名どおり置けばコード側で差し込む。  
共通: ピクセルアート。マゼンタ背景 `#FF00FF`（カード枠付きなら枠内だけ透過で可）。ぼかし・グラデ・角丸禁止。

---

## P0 今すぐ欲しい（新UIが空に見える）

### 1. ルーン宝石 ×8
**受領済み** `public/art/pixel/runes/{atk,blk,cost,draw,heal,poison,san,str}.jpg`

### 2. カード1枚1絵（本編デッキ）
現状: 約35種が **6枚の古い写実カード**（strike/ward/study/lash/rite/tome）を使い回し。デッキ編成グリッドで全部同じ絵に見える。

配置: `public/art/pixel/cards/{id}.png`  
サイズ: **256×384**（幅:高さ = 2:3）または 320×448。カード枠は絵に含めてよい。

固有絵が無い ID（全部ほしい。流用しない）:

| id | 日本語 | 今の流用元 |
|---|---|---|
| strike | 打撃 | **受領済み** pixel/cards/strike.jpg |
| ward | 結界 | card-ward |
| study | 精読 | card-study |
| lash | 鞭撃 | card-lash |
| sigil | 印 | ward 流用 |
| whisper | 囁き | study 流用 |
| precise | 計測打撃 | strike 流用 |
| dressing | 応急処置 | ward 流用 |
| bloodpact | 血契 | rite 流用 |
| insight | 啓示 | study 流用 |
| offering | 供物 | lash 流用 |
| chant | 詠唱 | rite 流用 |
| sweep | 闇の薙ぎ | lash 流用 |
| ironwill | 鉄の意志 | ward 流用 |
| resolve | 覚悟 | study 流用 |
| echo | 残響 | rite 流用 |
| rite | 眼の儀式 | card-rite |
| oath | 血の誓い | rite 流用 |
| bash | 破砕 | strike 流用 |
| tome | 禁断の書 | card-tome |
| eldersign | 古の印 | ward 流用 |
| thecall | 呼び声 | lash 流用 |
| laststand | 最期の抵抗 | strike 流用 |
| dread | 恐怖 | study 流用 |
| frostbite | 凍傷 | ward 流用 |
| all-distortion | 空間の歪み | tome 流用 |
| all-zero | 絶対零度の騙し絵 | rite 流用 |
| all-geo | 地磁気の強制共鳴 | rite 流用 |
| all-vacuum | 擬似真空 | study 流用 |
| all-phase | 位相遅延 | ward 流用 |
| all-blind | 知覚盲点 | tome 流用 |
| all-overclock | シナプス・オーバークロック | lash 流用 |
| all-glass | 骨格のガラス化 | strike 流用 |
| all-necrosis | 壊死の伝播 | study 流用 |
| all-diffuse | 存在確率の拡散 | tome 流用 |

最低ライン: まず **スターター6**（strike, ward, study, lash, sigil, whisper）と **レア顔**（tome, rite, thecall, eldersign）。残りは後続で可。

### 3. 遺物アイコン ×7
現状: ハブの6スロットが文字だけ。

配置: `public/art/pixel/relics/{id}.png`  
サイズ: **64×64**

| id | 日本語 |
|---|---|
| lens | ひび割れたレンズ |
| coral | 乾いた珊瑚 |
| idol | 青白い偶像 |
| candle | 黒い蝋燭 |
| coin | 塩のコイン |
| notebook | 野帳 |
| veil | 薄いヴェール |

---

## P1 次（村落・ショップが潰れて見える）

ショップカードは武器4種＋ビールで約40枚を使い回し。

配置: `public/art/pixel/cards/{id}.png` 同じ規格。

急ぐもの（系統の顔）:

- 剣: `iron_sword`, `ritual_dagger`, `cthugha_blade`
- 弓: `short_bow`, `migo_gun`, `hastur_bow`
- 重装: `iron_shield`, `deep_scale`, `cthulhu_mail`
- 軽装: `buckler`, `yellow_rags`, `colour_robe`
- `beer` ビール瓶（既に card-beer.jpg があるが写実）

残りショップは系統内で1絵を共有しても、系統の顔さえ分かれば当面足りる。

---

## P2 世界の温度差（敵はピクセル、他が旧写実）

| 対象 | 現状 | 欲しいパス |
|---|---|---|
| 探究者 | `art/investigator.jpg` 写実 | `art/pixel/investigator.png` |
| 信者 | `art/cultist.jpg` 写実 | `art/pixel/cultist.png` |
| 女将 | `art/landlady.jpg` | `art/pixel/landlady.png` |
| 鍛冶 | `art/smith.jpg` | `art/pixel/smith.png` |
| 村落背景 | `art/village.jpg` | `art/pixel/bg/village.jpg` |
| 酒場 | `art/inn.jpg` | `art/pixel/bg/inn.jpg` |
| 貝殻通貨 | `art/shell.jpg` | `art/pixel/shell.png` 16–32px |

待機動画（マゼンタMP4）は priest / coral のみ。他は静止画。優先は看板:

1. mouth（100層）
2. nyar（80層）
3. nurse（30層）
4. drowned（導入モブ）

---

## 受け渡し

ファイルをこのチャットに投げれば、上記パスへ置いて配線する。  
名前は表の `id` と一致させてほしい。違う名前なら対応表を一言。
