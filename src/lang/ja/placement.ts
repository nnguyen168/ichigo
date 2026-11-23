import type { BandInfo, PlacementItem } from "../types";

/**
 * Placement check: pick the meaning of a sentence. Distractors differ in the grammar point being
 * tested (tense, negation, direction of an action, conditional vs. reason…), so recognizing the words
 * alone is not enough. Six items per band; the check uses four at random.
 *
 * Status: written by Claude, not yet native-reviewed.
 */

export const bands: BandInfo[] = [
  { band: 1, label: "A1", local: "around JLPT N5", readingAids: true },
  { band: 2, label: "A2", local: "around JLPT N4", readingAids: true },
  { band: 3, label: "B1", local: "around JLPT N3", readingAids: false },
  { band: 4, label: "B2", local: "around JLPT N2", readingAids: false },
];

export const placementItems: PlacementItem[] = [
  // ── A1 / N5 ─────────────────────────────────────────────────────────
  {
    id: "p1.1",
    band: 1,
    text: "[毎朝|まいあさ] コーヒー を [飲|の]みます",
    en: "I drink coffee every morning.",
    distractors: ["I drank coffee this morning.", "I don't drink coffee in the morning.", "I want coffee every morning."],
  },
  {
    id: "p1.2",
    band: 1,
    text: "[昨日|きのう]^は [雨|あめ] でした",
    en: "It was rainy yesterday.",
    distractors: ["It will rain tomorrow.", "It isn't raining today.", "Yesterday was sunny."],
  },
  {
    id: "p1.3",
    band: 1,
    text: "この [本|ほん]^は [高|たか]くない です",
    en: "This book isn't expensive.",
    distractors: ["This book is very expensive.", "That book was cheap.", "Is this book expensive?"],
  },
  {
    id: "p1.4",
    band: 1,
    text: "[週末|しゅうまつ] [友達|ともだち] と [映画|えいが] を [見|み]ました",
    en: "I watched a movie with a friend on the weekend.",
    distractors: [
      "I'll watch a movie with a friend this weekend.",
      "My friend watched a movie alone on the weekend.",
      "I didn't watch a movie on the weekend.",
    ],
  },
  {
    id: "p1.5",
    band: 1,
    text: "[私|わたし] の [部屋|へや] に [猫|ねこ] が います",
    en: "There is a cat in my room.",
    distractors: ["My cat isn't in the room.", "I want a cat in my room.", "There is a dog in my room."],
  },
  {
    id: "p1.6",
    band: 1,
    text: "[何時|なんじ] に [寝|ね]ますか",
    en: "What time do you go to bed?",
    distractors: ["What time did you wake up?", "How long do you sleep?", "Are you sleepy?"],
  },

  // ── A2 / N4 ─────────────────────────────────────────────────────────
  {
    id: "p2.1",
    band: 2,
    text: "[雨|あめ] が [降|ふ]って いる ので、[出|で]かけません",
    en: "It's raining, so I won't go out.",
    distractors: ["Even though it's raining, I'll go out.", "If it rains, I won't go out.", "It stopped raining, so I'll go out."],
  },
  {
    id: "p2.2",
    band: 2,
    text: "[日本|にほん]^へ [行|い]った こと が あります",
    en: "I have been to Japan before.",
    distractors: ["I'm going to Japan soon.", "I have never been to Japan.", "I want to go to Japan someday."],
  },
  {
    id: "p2.3",
    band: 2,
    text: "[窓|まど] を [開|あ]けて も いい ですか",
    en: "May I open the window?",
    distractors: ["Please open the window.", "You must not open the window.", "Did you open the window?"],
  },
  {
    id: "p2.4",
    band: 2,
    text: "[宿題|しゅくだい] を [忘|わす]れて しまいました",
    en: "I (unfortunately) forgot my homework.",
    distractors: ["I finished my homework.", "Don't forget your homework.", "I'll do my homework later."],
  },
  {
    id: "p2.5",
    band: 2,
    text: "[先生|せんせい] に [褒|ほ]められました",
    en: "I was praised by the teacher.",
    distractors: ["I praised the teacher.", "The teacher scolded me.", "I want the teacher to praise me."],
  },
  {
    id: "p2.6",
    band: 2,
    text: "[暑|あつ]かったら、エアコン を つけて ください",
    en: "If it's hot, please turn on the air conditioner.",
    distractors: [
      "It was hot, so I turned on the air conditioner.",
      "Even if it's hot, don't use the air conditioner.",
      "Please turn off the air conditioner.",
    ],
  },

  // ── B1 / N3 ─────────────────────────────────────────────────────────
  {
    id: "p3.1",
    band: 3,
    text: "[会議|かいぎ] に [間|ま]に[合|あ]う ように、[早|はや]めに [家|いえ] を [出|で]た",
    en: "I left home early so that I'd make it to the meeting.",
    distractors: [
      "I left home early, but I was late for the meeting.",
      "The meeting started early, so I left home.",
      "I didn't need to leave home early for the meeting.",
    ],
  },
  {
    id: "p3.2",
    band: 3,
    text: "[彼|かれ]^は [忙|いそが]しい のに、[手伝|てつだ]って くれた",
    en: "Even though he was busy, he helped me.",
    distractors: ["He was busy, so he couldn't help me.", "He was busy, so I helped him.", "He pretended to be busy so he wouldn't have to help."],
  },
  {
    id: "p3.3",
    band: 3,
    text: "この [店|みせ]^は [安|やす]い だけ で なく、おいしい",
    en: "This restaurant is not only cheap but also tasty.",
    distractors: ["This restaurant is cheap, but not tasty.", "This restaurant is only good because it's cheap.", "This restaurant used to be cheap and tasty."],
  },
  {
    id: "p3.4",
    band: 3,
    text: "[子供|こども] の [頃|ころ]、よく [祖母|そぼ] の [家|いえ] に [遊|あそ]び に [行|い]った もの だ",
    en: "As a child, I often used to go and play at my grandmother's house.",
    distractors: [
      "My child often goes to play at my grandmother's house.",
      "As a child, I never visited my grandmother.",
      "I'd like to visit my grandmother's house with my children.",
    ],
  },
  {
    id: "p3.5",
    band: 3,
    text: "[部長|ぶちょう] に [言|い]われて、[報告書|ほうこくしょ] を [書|か]き[直|なお]す こと に なった",
    en: "The manager told me to, so I ended up having to rewrite the report.",
    distractors: ["I told the manager to rewrite the report.", "I decided on my own to stop writing the report.", "The manager rewrote the report for me."],
  },
  {
    id: "p3.6",
    band: 3,
    text: "[試験|しけん] の [結果|けっか]^は [思|おも]った より よかった",
    en: "The exam results were better than I expected.",
    distractors: ["The exam results were worse than I expected.", "I think the exam results will be good.", "The exam was as hard as I thought it would be."],
  },

  // ── B2 / N2 ─────────────────────────────────────────────────────────
  {
    id: "p4.1",
    band: 4,
    text: "[彼|かれ] の [説明|せつめい]^は [分|わ]かり にくい と いう より、[長|なが]すぎる",
    en: "It's not so much that his explanation is hard to follow — it's too long.",
    distractors: [
      "His explanation is easy to follow but too long.",
      "His explanation was short but hard to follow.",
      "He says the explanation is too long to understand.",
    ],
  },
  {
    id: "p4.2",
    band: 4,
    text: "[値段|ねだん] が [高|たか]い わり に、[品質|ひんしつ]^は いまいち だ",
    en: "For how expensive it is, the quality isn't great.",
    distractors: ["Because it's expensive, the quality is excellent.", "It's cheap and the quality is so-so.", "The quality is great considering the low price."],
  },
  {
    id: "p4.3",
    band: 4,
    text: "[一度|いちど] [引|ひ]き[受|う]けた [以上|いじょう]、[最後|さいご] まで やる べき だ",
    en: "Once you've taken something on, you should see it through to the end.",
    distractors: [
      "You should only accept work you can finish.",
      "Having accepted it once, you don't have to do it again.",
      "If you can't finish it, you should refuse from the start.",
    ],
  },
  {
    id: "p4.4",
    band: 4,
    text: "[忙|いそが]しい から と いって、[連絡|れんらく] しない の^は よくない",
    en: "Being busy is no excuse for not getting in touch.",
    distractors: ["I was busy, so I couldn't contact you.", "If you're busy, you don't need to contact me.", "It's better not to contact people who are busy."],
  },
  {
    id: "p4.5",
    band: 4,
    text: "[雨|あめ] が [降|ふ]ろう が [降|ふ]る まい が、[試合|しあい]^は [行|おこな]われる",
    en: "The match will go ahead whether or not it rains.",
    distractors: ["The match is cancelled if it rains.", "It might rain, so the match may be postponed.", "Whether the match goes ahead depends on the rain."],
  },
  {
    id: "p4.6",
    band: 4,
    text: "[彼女|かのじょ]^は [泣|な]き[出|だ]さん ばかり の [顔|かお] を して いた",
    en: "She looked as if she was about to burst into tears.",
    distractors: ["She had just finished crying.", "She cried only a little.", "She was laughing so hard she almost cried."],
  },
];
