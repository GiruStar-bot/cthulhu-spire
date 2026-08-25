import type { CharacterDef } from "./types";

export const CHARACTERS: Record<string, CharacterDef> = {
  investigator: {
    id: "investigator",
    name: "探究者",
    title: "壊れた学者",
    blurb:
      "手順を守る生存者。打撃、結界、そして照らすほどに深く切る記録。肉体は厚い。精神は脆い。",
    art: "/art/investigator.jpg",
    maxHp: 78,
    maxSanity: 50,
    starter: [
      "strike",
      "strike",
      "strike",
      "strike",
      "strike",
      "ward",
      "ward",
      "ward",
      "ward",
      "study",
    ],
  },
  cultist: {
    id: "cultist",
    name: "信者",
    title: "自ら開く器",
    blurb:
      "力は、自分で開ける扉。鞭撃、儀式、供物。肉体は薄い。精神は、すでに半分使われている。",
    art: "/art/cultist.jpg",
    maxHp: 66,
    maxSanity: 42,
    starter: [
      "lash",
      "lash",
      "lash",
      "lash",
      "lash",
      "sigil",
      "sigil",
      "sigil",
      "sigil",
      "whisper",
    ],
  },
};
