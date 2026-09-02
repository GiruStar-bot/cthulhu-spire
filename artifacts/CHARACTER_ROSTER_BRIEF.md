# CHARACTER ROSTER BRIEF — Abyss of R'lyeh / アビスオブルルイエ

> 目的: 別AIエージェントが現行キャラ案を再検討するための一次資料。
> ソース: `src/game/enemies.ts`, `biomes.ts`, `floors.ts`, `combat.ts` `encounterIds`, `characters.ts`, `idleFrames.ts`, `public/art/pixel/`
> 日付: 2026-09-02
> ルール: **ゲームロジックの数値・IDは現行実装の事実。** 見た目の文章はピクセル立ち絵と待機動画に基づく要約。再検討時は ID を壊さず提案すること。

---

## 0. このファイルの使い方（他AI向け）

1. §1 のデザイン柱を守ったまま、§5 の各キャラを再評価する。
2. 提案は必ず `id`（英語スラッグ）単位で出す。改名してよいが、マッピング表を付ける。
3. HP / 行動パターン / trait は戦闘バランス。見た目と噛み合っていない場合は「見た目を合わせる」か「パターンを合わせる」かを明示する。
4. 出力してほしいもの:
   - 残すべきキャラ / 統合すべき重複 / 足りない役割
   - 各バイオームの「顔」が立っているか
   - 10層ボス梯子のカタルシス
   - ピクセル化未着手（プレイヤー、村落NPC）の優先度

変更禁止（再検討対象外、実装契約）:

- マゼンタ背景（RGB 255,0,255）クロマキー前提
- ピクセルアート。実写・美麗イラストへ戻さない
- 可愛い外見 × 恐ろしい中身 のギャップ
- 外宇宙モブ（void / colour）はルルイエ側モブと同一戦闘に出ない
- デッキ上限 20、村落+貝殻経済、魂に刻む遺物 は別システム。キャラ案に巻き込まない

---

## 1. ゲームとビジュアルの柱

ジャンル: 2D ローグライク・デッキビルダー。階層型ダンジョン（1–100層）。
舞台: 夢経由でルルイエへ沈降する。クトゥルフ神話（ルルイエ / ムー / 外宇宙）。
見た目方針: **全年齢に見えるドット絵。中身は神話ホラー。** AI感・過剰表現を避け、物理の通ったファンタジー。
描画: `PixelSprite` / `CreatureMedia`。待機は静止画、一部はマゼンタ背景 MP4 ループ。

プレイヤーは「探究者」か「信者」。戦闘は手札カード。敵はパターン行動。10層ごとユニークボス。5層ごとに村落。

---

## 2. プレイヤーキャラ（ピクセル未着手）

現行アートは旧写実 `public/art/investigator.jpg` / `cultist.jpg`。ピクセル化されていない。再検討時は敵と同じドット絵に揃える案を出してよい。

| id | 日本語 | 肩書 | HP | SAN | スターター | 性格 |
|---|---|---|---|---|---|---|
| investigator | 探究者 | 壊れた学者 | 78 | 50 | 打撃×5, 結界×4, 精読×1 | 手順を守る生存者。肉体厚、精神脆 |
| cultist | 信者 | 自ら開く器 | 66 | 42 | 鞭撃×5, 印×4, 囁き×1 | 自分で扉を開ける。肉体薄、精神は既に半分消費 |

村落NPC（戦闘外、ピクセル未着手）:

- 女将 `landlady` — 海賊酒場のねえちゃん。ビール瓶カードを売る
- 鍛冶 `smith` — 表向き「鍛冶屋」。裏で剣/弓/重装/軽装の抽選

---

## 3. バイオーム

縦の沈降（通常ルート。void/colour は割り込み）:

| 階層 | biome id | 日本語 | 役割 |
|---|---|---|---|
| 1–19 | reef | 礁の層 | 導入。深きもの、珊瑚、翼 |
| 20–39 | street | 沈んだ街 | 教団、塩、鐘 |
| 40–59 | mu | ムーの残骸 | 蛇人、石化の落とし子 |
| 60–79 | fold | 曲がる石 | 非ユークリッド、嘘の意図 |
| 80–100 | throne | 緑の広間 | 終盤。門番、腐肉、使徒、口 |
| 割込 | void | 外宇宙 | ミーゴ、シャガイ、吸血獣。ルルイエ勢と混在しない |
| 割込 | colour | 色の井戸 | 「星から来た色」専用寄り |

背景ファイル: `public/art/pixel/bg/{reef,street,mu,fold,throne,void,colour,title,loadout,death}.jpg`

外宇宙出現率（通常/精鋭のみ。ボス梯子には乗らない）:

- 8層未満: 0%
- 8–15: 18%
- 16–49: 28%
- 50+: 38%
- 複数体は floor>=40 で 45%、それ以外 22%

HPスケール: `round(base * (1 + (floor-1)*0.03))`  ※以下の HP は全て **1層換算の基礎値**。

---

## 4. 10層ボス梯子（現行の「顔」）

| 層 | ids | 日本語 | 基礎HP | 備考 |
|---|---|---|---|---|
| 10 | priest | 尖塔の大司祭 | 168 | 最初のユニーク。待機動画あり |
| 20 | choir, choir | 塩の唱者 ×2 | 42 each | 片方が残るともう一体召喚 (trait choir) |
| 30 | nurse | 深きものの乳母 | 112 | ブロック中被ダメ半減 |
| 40 | flock, flock | 飢えた翼 ×2 | 52 each | 多段。byakhee の Pallete 近縁 |
| 50 | herald | 呼び声の使徒 | 214 | 大ボス扱い (%50) |
| 60 | warden | 曲がる幾何の番 | 108 | 意図を偽表示 (liar) |
| 70 | bell | 溺れた街の鐘 | 118 | ターン終了時プレイヤーブロック破壊 |
| 80 | nyar | 門番ナイアルラト | 124 | 攻撃/スキル封印 |
| 90 | iha | 緑の腐肉、イハ | 96 | HP半分で分裂 |
| 100 | mouth | 口そのもの | 268 | 最深。最終ボス |

再検討ポイント: 20層・40層が「単体ユニーク」ではなくペア。梯子のカタルシスが途切れるか。

---

## 5. 敵キャラ総覧

凡例

- role: mob / elite / unique-boss
- idle: still = `public/art/pixel/{id}.jpg` のみ。video = マゼンタMP4ループ
- trait: 特殊ルール。空なら通常

### 5.1 礁 reef

#### acolyte / 侍祭
- role: mob（街バイオーム所属だが 1–39 の通常プールに混ざる）
- biome: street / 基礎HP 32
- 見た目: 街の下級聖職。ピクセル立ち絵あり
- 行動: 攻撃7 → 攻撃11 → 防御8
- idle: still
- 再検討: 礁の導入層に「街の侍祭」が出る。バイオーム純度が低い

#### drowned / 溺れた眷属
- role: mob
- biome: reef / HP 44
- 見た目: 溺死体寄りの深きもの眷属
- 行動: 攻撃9 → 防御10 → 攻撃6×2
- idle: still
- 旧動画クリップは `deepone` を流用していた（ピクセル後は drowned.jpg）

#### coral / 礁の衛士
- role: mob / 低層エリート候補
- biome: reef / HP 48
- 見た目: サンゴとフジツボの付いた魚人騎士。骨の三叉槍。丸い目、青緑肌、甲冑。**待機動画あり**（呼吸、槍の上下、口の開閉）
- 行動: 防御10 → 攻撃10 → 攻撃6×2
- idle: **video** `art/pixel/coral/idle.mp4`
- 位置づけ: 礁の「顔」。タンク寄り

#### byakhee / 翼ある飢え
- role: mob / 低層エリート
- biome: reef / HP 38
- 見た目: 飛行する飢え。翼
- 行動: 弱体2 → 攻撃13 → 攻撃8
- idle: still
- 近縁: flock（飢えた翼）が別ID。差別化が薄い可能性

#### starveling / 飢えし仔
- role: elite（20層帯の精鋭、高層通常にも混入）
- biome: reef / HP 86
- 見た目: 礁の精鋭。仔だが体は大きい想定
- 行動: 筋力+2 → 攻撃16 → 攻撃8×2 → 防御14
- idle: still
- 旧クリップは deepone 流用

#### nurse / 深きものの乳母
- role: unique-boss (30F)
- biome: reef / HP 112 / **trait: nurse**（ブロック残存中、被ダメージ半減）
- 見た目: 守る・育てる歪んだ母性
- 行動: 防御16 → 攻撃12 → 防御20 → 攻撃9×2 → 筋力+2
- idle: still
- 再検討: 30層で「守る」ギミックは分かりやすい。ビジュアルが母性を伝えているか

#### flock / 飢えた翼
- role: unique-boss (40F ×2)
- biome: reef / HP 52
- 見た目: byakhee の群れ版
- 行動: 攻撃5×3 → 弱体2 → 攻撃11 → 攻撃4×3
- idle: still（旧クリップ byakhee 流用）
- 再検討: 単体ユニークではなくペア。byakhee と絵が被る

---

### 5.2 沈んだ街 street

#### choir / 塩の唱者
- role: unique-boss (20F ×2) / 通常には出ない
- biome: street / HP 42 / **trait: choir**（場に1体だけになると追加召喚）
- 見た目: 塩の聖歌隊。侍祭に近い聖職シルエット
- 行動: 攻撃8 → 畏怖1 → 攻撃6×2 → 防御8
- idle: still（旧クリップ acolyte 流用）
- 再検討: acolyte とのビジュアル差。召喚が「合唱」として読めるか

#### priest / 尖塔の大司祭
- role: unique-boss (10F)
- biome: street / HP 168
- 見た目: 紫の尖り帽子と金縁ローブ。フードの闇に紫の目。口元の触手、緑のオーブ付き杖、左手に書。石の台座。**待機動画あり**（呼吸、杖の光、裾のうねり）
- 行動: 畏怖1 → 攻撃18 → 攻撃9×2 → 筋力+3 → 攻撃22
- idle: **video** `art/pixel/priest/idle.mp4`
- 位置づけ: ゲームの看板ボス。最初に「この世界は教団だ」と教える

#### bell / 溺れた街の鐘
- role: unique-boss (70F)
- biome: street / HP 118 / **trait: bell**（敵ターン後、プレイヤーのブロックを0にする）
- 見た目: 沈んだ街の鐘そのもの、または鐘を体にした存在
- 行動: 攻撃15 → 畏怖1 → 攻撃7×2 → 筋力+2 → 攻撃20
- idle: still
- 再検討: 70層なのに biome は street（20–39）。梯子とバイオームがズレる

---

### 5.3 ムー mu

#### serpent / ムーの蛇人
- role: mob / elite
- biome: mu / HP 54
- 見た目: 蛇人。古代ムーの残党
- 行動: 弱体2 → 攻撃12 → 防御9 → 攻撃7×2
- idle: still

#### spawn / ガタノトアの落とし子
- role: mob / elite
- biome: mu / HP 62
- 見た目: 見る者を石化させる神の落とし子。不定形寄り
- 行動: 畏怖1 → 攻撃11 → 筋力+2 → 攻撃15
- idle: still
- 再検討: 石化は lore にあるが、戦闘 trait に石化がない。フレーバーだけ

---

### 5.4 曲がる石 fold

#### warden / 曲がる幾何の番
- role: unique-boss (60F)
- biome: fold / HP 108 / **trait: liar**（表示インテントが本物と違う）
- 見た目: 非ユークリッドの番人。曲がる角度
- 行動: 攻撃16 → 防御14 → 弱体2 → 攻撃8×2 → 筋力+2
- idle: still
- 再検討: fold の通常モブが warden しかいない。60層まで「曲がる石」の雑魚が空

---

### 5.5 緑の広間 throne

#### nyar / 門番ナイアルラト
- role: unique-boss (80F)
- biome: throne / HP 124 / **trait: seal**（攻撃カード or スキルカードを一時封印）
- 見た目: ナイアルラトホテプの門番態
- 行動: 封印(attack)+弱体1 → 攻撃16 → 封印(skill) → 攻撃9×2 → 筋力+3
- idle: still
- 再検討: 固有名が重い。80層ゲートとして妥当か、最終手前にしてはHPが口より低いのは意図的

#### iha / 緑の腐肉、イハ
- role: unique-boss (90F)
- biome: throne / HP 96 / **trait: split**（HPが半分を切ると同名クローン1体）
- 見た目: 緑の腐肉塊。分裂する肉
- 行動: 攻撃14 → 防御10 → 攻撃8×2 → 畏怖1 → 筋力+2
- idle: still
- 再検討: 基礎HPが90層にして低い（分裂前提）。クローンが同じ絵で「死体が残る」問題は死亡後1秒で消す仕様で緩和済み

#### herald / 呼び声の使徒
- role: unique-boss (50F 大ボス)
- biome: throne / HP 214
- 見た目: 呼び声を運ぶ使徒。終盤の先触れなのに 50層で登場
- 行動: 畏怖1+弱体2 → 攻撃16×2 → 筋力+3 → 攻撃24 → 防御18
- idle: still
- 再検討: biome は throne（80+）なのに 50層ボス。梯子とバイオームの不一致

#### mouth / 口そのもの
- role: unique-boss (100F 最深)
- biome: throne / HP 268
- 見た目: 口が存在そのもの。最終不吉
- 行動: 畏怖2 → 攻撃12×3 → 筋力+4 → 攻撃28 → 攻撃18×2
- idle: still
- 位置づけ: 到達報酬。クトゥルフ本体そのものではない（本体はタイトル映像側）

---

### 5.6 外宇宙 void / colour（ルルイエ勢と同時出現しない）

#### migo / ミーゴ
- role: mob (void割込)
- biome: void / HP 40
- 見た目: 蟹菌の飛行体。脳を運ぶ
- 行動: 攻撃8 → 畏怖1 → 攻撃5×2
- idle: still

#### shan / シャガイの昆虫
- role: mob (void割込)
- biome: void / HP 36
- 見た目: 寄生する昆虫
- 行動: 畏怖1 → 攻撃9 → 攻撃6×2
- idle: still
- 再検討: migo と役割が近い（低HP、畏怖、多段）

#### starvamp / 星の吸血獣
- role: mob / void elite
- biome: void / HP 56
- 見た目: 透明寄りの星の吸血鬼
- 行動: 攻撃14 → 攻撃7×2 → 防御8
- idle: still
- 再検討: 吸血なのに回復 trait がない

#### colour / 星から来た色
- role: mob (colour割込。遭遇すると背景が色の井戸)
- biome: colour / HP 48
- 見た目: 色そのもの。輪郭が不安定
- 行動: 弱体2 → 攻撃10 → 畏怖1 → 攻撃13
- idle: still
- 再検討: バイオーム専用モブが1種だけ。色の井戸が薄い

---

## 6. 通常・精鋭の出現プール（実装）

通常 combat:

- 1–19: acolyte, drowned, coral
- 20–39: + byakhee
- 40–59: serpent, spawn, coral
- 60–79: spawn, serpent, byakhee
- 80+: spawn, serpent, starveling
- 複数体率: 12% (<12F) / 35% (12–39) / 50% (40+)

精鋭 elite:

- <20: coral or byakhee
- 20–39: starveling
- 40–69: spawn or serpent
- 70+: (spawn+serpent) or (starveling+byakhee)

欠落（再検討で埋めたい穴）:

- fold に通常モブがいない
- colour が1体
- street の通常は acolyte のみ（choir/priest/bell はボス）
- 高層通常が mu の蛇人・落とし子に偏る
- 待機動画は priest, coral のみ。他は静止画

---

## 7. 視覚パイプライン（再検討時に守る）

```
public/art/pixel/{id}.jpg          マゼンタ背景の立ち絵
public/art/pixel/{id}/idle.mp4     任意。IDLE_VIDEO[id] に足せば戦闘でループ
public/art/pixel/bg/{biome}.jpg    戦闘背景。床は画面下30%
```

戦闘表示: `EnemyView` → 動画があれば `CreatureMedia`（video + canvas クロマキー）、なければ `PixelSprite`。
死亡: 縦に縮み (scale-y-0, 1秒) のあと DOM から消える。死体は残さない。
クリック判定: キャラ本体（動画/キャンバス）。HPバーではない。

新規キャラを足す最小手順:

1. マゼンタJPGを `public/art/pixel/{newId}.jpg`
2. `ENEMIES[newId]` を追加（id, name, biome, maxHp, pattern, trait?）
3. `encounterIds` のプールかボス梯子に入れる
4. 動画があるなら `IDLE_VIDEO[newId]`

---

## 8. 現行の弱点（再検討の起点）

1. **バイオームとボス梯子の不一致** — herald は throne 所属なのに50層。bell は street 所属なのに70層。
2. **fold / colour / street の雑魚不足** — 層の景色がボスでしか変わらない。
3. **近縁の重複** — byakhee と flock、acolyte と choir、drowned と starveling と nurse（深きもの家系が礁に密集）。
4. **lore と mechanics のズレ** — ガタノトアに石化なし、星の吸血獣に吸血なし、色に「汚染」なし。
5. **20F / 40F がペア戦** — 「10層に1体のユニーク」約束が崩れている。
6. **プレイヤーとNPCが旧アート** — 敵だけピクセル。世界観の温度差。
7. **待機動画が2体だけ** — 動くものと止まっているものの差が大きい。
8. **外宇宙4体の役割が近い** — 全部「小さい・畏怖・多段」。tank / exploder / parasite の分化が弱い。

---

## 9. 再検討してほしい問い

- 10体のユニークボスを「層の物語」として並べ直すなら、誰が何層か。
- 礁・街・ムー・石・広間・宇宙・色、それぞれ雑魚3 + 精鋭1 + ボス1 が揃うか。
- 可愛いドットで「名前を見なくても何の神話か分かる」か。
- クトゥルフ本体を出さない方針は維持か。出すなら mouth との差分。
- プレイヤー2クラスは「学者 / 信者」で十分か。第3クラスは要るか。
- 待機動画を量産するなら、優先順位（看板ボス → 層の顔モブ → 残り）。

---

## 10. 機械可読サマリ

```yaml
players:
  - {id: investigator, ja: 探究者, hp: 78, san: 50, pixel: false}
  - {id: cultist, ja: 信者, hp: 66, san: 42, pixel: false}
npcs:
  - {id: landlady, ja: 女将, pixel: false}
  - {id: smith, ja: 鍛冶, pixel: false}
biomes: [reef, street, mu, fold, throne, void, colour]
idle_video: [priest, coral]
enemies:
  - {id: acolyte, ja: 侍祭, biome: street, hp: 32, role: mob, trait: null}
  - {id: drowned, ja: 溺れた眷属, biome: reef, hp: 44, role: mob, trait: null}
  - {id: byakhee, ja: 翼ある飢え, biome: reef, hp: 38, role: mob, trait: null}
  - {id: coral, ja: 礁の衛士, biome: reef, hp: 48, role: mob, trait: null, idle: video}
  - {id: starveling, ja: 飢えし仔, biome: reef, hp: 86, role: elite, trait: null}
  - {id: serpent, ja: ムーの蛇人, biome: mu, hp: 54, role: mob, trait: null}
  - {id: spawn, ja: ガタノトアの落とし子, biome: mu, hp: 62, role: mob, trait: null}
  - {id: migo, ja: ミーゴ, biome: void, hp: 40, role: mob, trait: null}
  - {id: colour, ja: 星から来た色, biome: colour, hp: 48, role: mob, trait: null}
  - {id: starvamp, ja: 星の吸血獣, biome: void, hp: 56, role: mob, trait: null}
  - {id: shan, ja: シャガイの昆虫, biome: void, hp: 36, role: mob, trait: null}
  - {id: priest, ja: 尖塔の大司祭, biome: street, hp: 168, role: boss10, trait: null, idle: video}
  - {id: choir, ja: 塩の唱者, biome: street, hp: 42, role: boss20x2, trait: choir}
  - {id: nurse, ja: 深きものの乳母, biome: reef, hp: 112, role: boss30, trait: nurse}
  - {id: flock, ja: 飢えた翼, biome: reef, hp: 52, role: boss40x2, trait: null}
  - {id: warden, ja: 曲がる幾何の番, biome: fold, hp: 108, role: boss60, trait: liar}
  - {id: bell, ja: 溺れた街の鐘, biome: street, hp: 118, role: boss70, trait: bell}
  - {id: nyar, ja: 門番ナイアルラト, biome: throne, hp: 124, role: boss80, trait: seal}
  - {id: iha, ja: 緑の腐肉イハ, biome: throne, hp: 96, role: boss90, trait: split}
  - {id: herald, ja: 呼び声の使徒, biome: throne, hp: 214, role: boss50, trait: null}
  - {id: mouth, ja: 口そのもの, biome: throne, hp: 268, role: boss100, trait: null}
traits:
  choir: 1体になると追加召喚
  nurse: ブロック中被ダメ半減
  liar: インテント偽装
  bell: 敵ターン後にプレイヤーブロック破壊
  seal: 攻撃 or スキルを封印
  split: HP50%で分裂
```
