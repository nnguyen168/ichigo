import { toHiragana, toRomaji } from "wanakana";
import type { ScriptChar, ScriptGroup, ScriptTrainerDef } from "../types";

/**
 * Kana data. Hiragana is the source of truth; katakana is derived with wanakana.
 * Mnemonics are short memory hooks — learners remember better if they tweak them into their own.
 */

type Row = [char: string, romaji: string, hiraganaMnemonic: string, katakanaMnemonic: string];

const BASIC: { id: string; label: string; rows: Row[] }[] = [
  {
    id: "vowels",
    label: "Vowels あいうえお",
    rows: [
      ["あ", "a", "A cross with a big swirl — someone shouting \"Ahh!\"", "ア looks like an Axe."],
      ["い", "i", "Two eels side by side: \"eel\" → i.", "イ is an Easel leaning on a wall."],
      ["う", "u", "A person bent over: \"Uh… I feel sick.\"", "ウ is う wearing a hat — same sound."],
      ["え", "e", "A ninja doing a high kick: \"Eh!\"", "エ is an Elevator's steel I-beam."],
      ["お", "o", "A golfer swings, the ball flies off: \"Oh!\"", "オ is an Opera singer, arms spread wide."],
    ],
  },
  {
    id: "k",
    label: "K-row かきくけこ",
    rows: [
      ["か", "ka", "A Karate chop with a little shout (the dot): \"Ka!\"", "カ is か without its shout."],
      ["き", "ki", "A Key with two teeth.", "キ is a simpler Key."],
      ["く", "ku", "A Cuckoo's open beak.", "ク is a Cook's bent arm."],
      ["け", "ke", "A Keg next to its tap.", "ケ looks like a slanted K: Ke."],
      ["こ", "ko", "Two Cozy worms lying together.", "コ is the Corner of a box."],
    ],
  },
  {
    id: "s",
    label: "S-row さしすせそ",
    rows: [
      ["さ", "sa", "A Sad face under a cross.", "サ is さ simplified — two posts and a bar."],
      ["し", "shi", "A fishhook: SHe caught a fish.", "シ — a face smiling up: SHe smiles. Strokes rise from bottom-left (vs ツ)."],
      ["す", "su", "A Swing with a loop.", "ス is a Sumo wrestler mid-step."],
      ["せ", "se", "A mouth with a fang, Saying \"se\".", "セ is せ simplified."],
      ["そ", "so", "A zigzag thread being SOwn.", "ソ — two drops falling down: SOw. The long stroke goes down (vs ン)."],
    ],
  },
  {
    id: "t",
    label: "T-row たちつてと",
    rows: [
      ["た", "ta", "Looks like the letters t and a.", "タ is ク with a stroke inside: a TAco."],
      ["ち", "chi", "A Cheerleader turning around.", "チ is a CHIcken's footprint."],
      ["つ", "tsu", "A TSUnami wave.", "ツ — drops falling from above: TSUnami. Strokes go down (vs シ)."],
      ["て", "te", "A TEnnis racket swung sideways.", "テ is a TElephone pole."],
      ["と", "to", "A TOe with a splinter in it.", "ト is a TOtem pole with a branch."],
    ],
  },
  {
    id: "n",
    label: "N-row なにぬねの",
    rows: [
      ["な", "na", "A NAughty cat by a cross.", "ナ is a cross: \"NAh, it's tilted.\""],
      ["に", "ni", "A KNEE next to a stick.", "ニ — two lines; 二 means two (ni)."],
      ["ぬ", "nu", "NOOdles with chopsticks.", "ヌ is chopsticks picking up NOOdles."],
      ["ね", "ne", "A cat (NEko) with a curled tail.", "ネ is a NEt hanging from a pole."],
      ["の", "no", "A single loop: a NO-entry sign.", "ノ is a single slash: NO!"],
    ],
  },
  {
    id: "h",
    label: "H-row はひふへほ",
    rows: [
      ["は", "ha", "A post and a dancer: \"HA-ha!\" (as a particle, read \"wa\").", "ハ is a laughing mouth: HA!"],
      ["ひ", "hi", "A big grin: \"HEE hee!\"", "ヒ is the HEEl of a shoe."],
      ["ふ", "fu", "Mount FUji with clouds around it.", "フ is a hook: \"FOOd hook.\""],
      ["へ", "he", "A hill: \"HEY, a hill!\" (as a particle, read \"e\").", "ヘ is the same hill."],
      ["ほ", "ho", "は with a chimney: a HOme.", "ホ is a HOly cross with legs."],
    ],
  },
  {
    id: "m",
    label: "M-row まみむめも",
    rows: [
      ["ま", "ma", "A MAma with a long skirt and a loop.", "マ is a MAsk."],
      ["み", "mi", "Looks like the number 21: ME at 21.", "ミ — three lines: ME, ME, ME."],
      ["む", "mu", "A cow saying MOO, with its tail.", "ム is a MUscly arm."],
      ["め", "me", "め means \"eye\" in Japanese — a crossed-out eye.", "メ is an X: X marks ME."],
      ["も", "mo", "A fishhook with two bars: catch MOre fish.", "モ is も without the hook."],
    ],
  },
  {
    id: "y",
    label: "Y-row やゆよ",
    rows: [
      ["や", "ya", "A YAk with a horn.", "ヤ is the same YAk."],
      ["ゆ", "yu", "A fish swimming: YUmmy.", "ユ is a U-turn: YU-turn."],
      ["よ", "yo", "A YO-yo on a string.", "ヨ is a backwards E in a YOga pose."],
    ],
  },
  {
    id: "r",
    label: "R-row らりるれろ",
    rows: [
      ["ら", "ra", "A RApper with a cap.", "ラ is a lid on フ: a RAmen bowl."],
      ["り", "ri", "REEds by a river.", "リ is the same REEds."],
      ["る", "ru", "A ROUte that loops back at the end.", "ル is two legs on a ROUte."],
      ["れ", "re", "A man kneeling, RE-tying his shoe.", "レ is a checkmark: REcorded."],
      ["ろ", "ro", "る without the loop: a ROad with no roundabout.", "ロ is a square ROBot head."],
    ],
  },
  {
    id: "w",
    label: "わ, を, ん",
    rows: [
      ["わ", "wa", "A WAve curling outward.", "ワ is a WAter cup."],
      ["を", "wo", "Someone in a cape: \"WOah!\" (pronounced \"o\"; used only as a particle).", "ヲ is フ with a bar — rare in katakana."],
      ["ん", "n", "Looks like a lowercase n.", "ン — one drop and a stroke going UP: Nnn (vs ソ)."],
    ],
  },
];

const DAKUTEN: { id: string; label: string; intro: string; chars: string[] }[] = [
  {
    id: "dakuten-gzd",
    label: "Voiced: が ざ だ rows",
    intro:
      "Two small marks (゛, dakuten) voice the consonant: k→g, s→z, t→d. じ and ぢ are both \"ji\"; ず and づ are both \"zu\" (じ/ず are far more common).",
    chars: ["が", "ぎ", "ぐ", "げ", "ご", "ざ", "じ", "ず", "ぜ", "ぞ", "だ", "ぢ", "づ", "で", "ど"],
  },
  {
    id: "dakuten-bp",
    label: "Voiced: ば and ぱ rows",
    intro: "Dakuten on the h-row gives b: は→ば. A small circle (゜, handakuten) gives p: は→ぱ.",
    chars: ["ば", "び", "ぶ", "べ", "ぼ", "ぱ", "ぴ", "ぷ", "ぺ", "ぽ"],
  },
];

const YOON: { id: string; label: string; intro: string; chars: string[] }[] = [
  {
    id: "yoon",
    label: "Combined sounds きゃ しゅ ちょ…",
    intro:
      "A small ゃ ゅ ょ after an i-sound kana merges into one beat: き + ゃ = きゃ (kya), し + ょ = しょ (sho). A small っ doubles the next consonant: きって = kitte (a short pause before t).",
    chars: [
      "きゃ", "きゅ", "きょ", "しゃ", "しゅ", "しょ", "ちゃ", "ちゅ", "ちょ",
      "にゃ", "にゅ", "にょ", "ひゃ", "ひゅ", "ひょ", "みゃ", "みゅ", "みょ", "りゃ", "りゅ", "りょ",
    ],
  },
  {
    id: "yoon-voiced",
    label: "Combined voiced ぎゃ じゃ びゃ…",
    intro: "The same trick with voiced kana: ぎ + ゃ = ぎゃ (gya), じ + ょ = じょ (jo).",
    chars: ["ぎゃ", "ぎゅ", "ぎょ", "じゃ", "じゅ", "じょ", "びゃ", "びゅ", "びょ", "ぴゃ", "ぴゅ", "ぴょ"],
  },
];

const KATAKANA_INTRO =
  "Katakana spells the same sounds as hiragana. It is used mainly for foreign words (コーヒー, coffee), names and emphasis. The bar ー lengthens the vowel before it: コーヒー = koohii.";

function romajiOf(kana: string): string {
  // Hepburn romaji for display; wanakana gives "di"/"du" for ぢ/づ — show the pronunciation instead.
  if (kana === "ぢ") return "ji";
  if (kana === "づ") return "zu";
  if (kana === "を") return "wo";
  return toRomaji(kana);
}

/** Hiragana → katakana for kana characters only (leaves Latin text alone). */
function hiraToKata(s: string): string {
  return s.replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}

function build(): { groups: ScriptGroup[]; chars: ScriptChar[] } {
  const groups: ScriptGroup[] = [];
  const chars: ScriptChar[] = [];
  for (const script of ["hiragana", "katakana"] as const) {
    const conv = (s: string) => (script === "hiragana" ? s : hiraToKata(s));
    for (const g of BASIC) {
      const gid = `${script}-${g.id}`;
      groups.push({
        id: gid,
        script,
        label: conv(g.label),
        intro: script === "katakana" && g.id === "vowels" ? KATAKANA_INTRO : undefined,
      });
      for (const [ch, romaji, hm, km] of g.rows) {
        chars.push({
          id: `${script}:${ch}`,
          char: conv(ch),
          romaji,
          group: gid,
          mnemonic: script === "hiragana" ? hm : km,
        });
      }
    }
    for (const g of [...DAKUTEN, ...YOON]) {
      const gid = `${script}-${g.id}`;
      groups.push({ id: gid, script, label: conv(g.label), intro: g.intro });
      for (const ch of g.chars) {
        chars.push({ id: `${script}:${ch}`, char: conv(ch), romaji: romajiOf(ch), group: gid });
      }
    }
  }
  return { groups, chars };
}

const { groups, chars } = build();

const LOOKALIKES: string[][] = [
  ["シ", "ツ"], ["ソ", "ン"], ["ぬ", "め"], ["ね", "れ", "わ"], ["る", "ろ"], ["さ", "ち"],
  ["は", "ほ"], ["き", "さ"], ["い", "り"], ["こ", "に"], ["ク", "タ", "ケ"], ["コ", "ユ", "ロ"],
  ["ウ", "ワ", "ラ"], ["チ", "テ"], ["ノ", "メ"], ["マ", "ア"], ["ス", "ヌ"],
];

/** Strict check for script drills: accepts Hepburn and Kunrei spellings (shi/si, tsu/tu, n/nn). */
export function checkKanaTyped(char: ScriptChar, input: string): boolean {
  const typed = input.trim().toLowerCase();
  if (!typed) return false;
  const target = toHiragana(char.char);
  const asKana = toHiragana(typed === "nn" ? "n" : typed);
  if (asKana === target) return true;
  const alt: Record<string, string[]> = { ぢ: ["じ"], づ: ["ず"], を: ["お"], ぢゃ: ["じゃ"], ぢゅ: ["じゅ"], ぢょ: ["じょ"] };
  return (alt[target] ?? []).includes(asKana);
}

function distractors(char: ScriptChar, count: number): ScriptChar[] {
  const sameScript = chars.filter((c) => c.id !== char.id && c.id.split(":")[0] === char.id.split(":")[0]);
  const looks = new Set(LOOKALIKES.find((set) => set.includes(char.char)) ?? []);
  const pool: ScriptChar[] = [];
  const add = (c: ScriptChar) => {
    if (!pool.includes(c) && c.char !== char.char) pool.push(c);
  };
  shuffle(sameScript.filter((c) => looks.has(c.char))).forEach(add);
  shuffle(sameScript.filter((c) => c.group === char.group)).forEach(add);
  shuffle(sameScript).forEach(add);
  return pool.slice(0, count);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export const kanaTrainer: ScriptTrainerDef = {
  groups,
  chars,
  checkTyped: checkKanaTyped,
  distractors,
};
