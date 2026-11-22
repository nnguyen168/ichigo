import type { Register, SeedChunk, SlotOption, TopicId } from "../types";

/**
 * Core seed deck: high-frequency, high-utility chunks for an adult beginner.
 * Markup: [漢字|かんじ] furigana · ^は/^へ particles read wa/e · space = word boundary · {} = slot.
 *
 * Status: written by Claude, NOT yet reviewed by a native speaker. Flag anything odd in the app.
 */

type Opts = {
  lit?: string;
  cue?: string;
  note?: string;
  register?: Register;
  slot?: [text: string, en: string][];
};

let counter = 0;
function c(topic: TopicId, level: 1 | 2 | 3, text: string, en: string, opts: Opts = {}): SeedChunk {
  counter += 1;
  const slot: SlotOption[] | undefined = opts.slot?.map(([t, e]) => ({ text: t, en: e }));
  return {
    id: `ja.${topic}.${String(counter).padStart(3, "0")}`,
    topic,
    level,
    text,
    en,
    lit: opts.lit,
    cue: opts.cue,
    note: opts.note,
    register: opts.register ?? "polite",
    slot,
  };
}

export const seedDeck: SeedChunk[] = [
  // ── Survival: keep any conversation alive ─────────────────────────────
  c("survival", 1, "すみません", "Excuse me. / Sorry.", {
    cue: "Getting a waiter's attention",
    note: "Works for getting attention, apologizing, and even thanking someone who went out of their way.",
  }),
  c("survival", 1, "ありがとう ございます", "Thank you.", { cue: "Someone hands you something" }),
  c("survival", 1, "わかりません", "I don't understand.", { note: "Also means \"I don't know.\"" }),
  c("survival", 1, "わかりました", "Got it. / Understood.", { cue: "Confirming you understood instructions" }),
  c("survival", 1, "もう [一度|いちど] お[願|ねが]いします", "One more time, please.", {
    lit: "more · one time · please",
    cue: "You didn't catch what someone said",
  }),
  c("survival", 1, "ゆっくり お[願|ねが]いします", "Slowly, please.", { cue: "Someone is speaking too fast" }),
  c("survival", 1, "これ^は [日本語|にほんご] で [何|なん] ですか", "What is this in Japanese?", {
    lit: "this · as for · Japanese · in · what · is?",
    cue: "Pointing at an object",
  }),
  c("survival", 1, "{} って [何|なん] ですか", "What does \"{}\" mean?", {
    lit: "{} · (quoting) · what · is?",
    cue: "Someone used a word you don't know",
    slot: [["おでん", "oden"], ["[駅弁|えきべん]", "ekiben"], ["[積読|つんどく]", "tsundoku"]],
    note: "って is a casual quote marker — very handy for asking about any word.",
  }),
  c("survival", 1, "[日本語|にほんご] が [少|すこ]し [話|はな]せます", "I can speak a little Japanese.", {
    lit: "Japanese · (subject) · a little · can speak",
  }),
  c("survival", 1, "[日本語|にほんご] を [勉強|べんきょう]して います", "I'm studying Japanese."),
  c("survival", 2, "[英語|えいご]^は [話|はな]せますか", "Can you speak English?", {
    cue: "Last resort when you're stuck",
  }),
  c("survival", 1, "ちょっと [待|ま]って ください", "Just a moment, please."),
  c("survival", 2, "[書|か]いて ください", "Please write it down."),
  c("survival", 1, "[大丈夫|だいじょうぶ] です", "I'm okay. / No thanks.", {
    note: "Context decides: \"I'm fine\", \"It's okay\", or a polite \"No thank you\" (e.g. to a bag offer).",
  }),
  c("survival", 2, "[今|いま]、[何|なん] と [言|い]いましたか", "What did you just say?"),
  c("survival", 2, "[助|たす]けて ください", "Please help me."),
  c("survival", 2, "どういたしまして", "You're welcome.", {
    note: "Textbook phrase; in daily life people often just say いえいえ.",
  }),
  c("survival", 1, "いえいえ", "Not at all. / No, no.", {
    register: "neutral",
    note: "A light reply to thanks or compliments.",
  }),

  // ── Greetings ─────────────────────────────────────────────────────────
  c("greetings", 1, "こんにち^は", "Hello. / Good afternoon.", { note: "The final は is read \"wa\"." }),
  c("greetings", 1, "おはよう ございます", "Good morning."),
  c("greetings", 1, "こんばん^は", "Good evening."),
  c("greetings", 1, "はじめまして", "Nice to meet you.", { cue: "Meeting someone for the first time" }),
  c("greetings", 1, "よろしく お[願|ねが]いします", "Nice to meet you. / I look forward to working with you.", {
    note: "Said after introducing yourself. Literally \"please treat me well\".",
  }),
  c("greetings", 2, "お[元気|げんき] ですか", "How have you been?", {
    note: "Used when you haven't seen someone for a while, not as a daily \"how are you\".",
  }),
  c("greetings", 2, "[元気|げんき] です", "I'm doing well."),
  c("greetings", 2, "お[久|ひさ]しぶり です", "Long time no see."),
  c("greetings", 1, "じゃあ、また", "See you.", { register: "casual" }),
  c("greetings", 2, "おやすみなさい", "Good night."),
  c("greetings", 2, "さようなら", "Goodbye.", { note: "Sounds final or formal; friends say じゃあ、また." }),
  c("greetings", 3, "[失礼|しつれい]します", "Excuse me (entering or leaving).", {
    cue: "Entering an office or leaving a meeting",
  }),

  // ── Self-introduction ─────────────────────────────────────────────────
  c("self", 1, "[私|わたし] の [名前|なまえ]^は {} です", "My name is {}.", {
    slot: [["トム", "Tom"], ["アナ", "Ana"], ["ケン", "Ken"]],
    note: "Replace with your own name in katakana.",
  }),
  c("self", 1, "お[名前|なまえ]^は [何|なん] ですか", "What's your name?"),
  c("self", 1, "[私|わたし]^は {} です", "I'm {}.", {
    slot: [["[学生|がくせい]", "a student"], ["アメリカ[人|じん]", "American"], ["エンジニア", "an engineer"]],
    note: "Japanese often drops 私は when it's obvious who you mean.",
  }),
  c("self", 1, "{} から [来|き]ました", "I'm from {}.", {
    lit: "{} · from · came",
    slot: [["アメリカ", "America"], ["ベトナム", "Vietnam"], ["イギリス", "the UK"], ["カナダ", "Canada"]],
  }),
  c("self", 1, "どこ から [来|き]ましたか", "Where are you from?"),
  c("self", 1, "{} に [住|す]んで います", "I live in {}.", {
    slot: [["[東京|とうきょう]", "Tokyo"], ["ロンドン", "London"], ["ハノイ", "Hanoi"], ["ニューヨーク", "New York"]],
  }),
  c("self", 2, "どこ に [住|す]んで いますか", "Where do you live?"),
  c("self", 2, "{}[歳|さい] です", "I'm {} years old.", {
    slot: [["[三十|さんじゅう]", "30"], ["[二十五|にじゅうご]", "25"], ["[四十|よんじゅう]", "40"]],
    note: "Exception: 20 years old is [二十歳|はたち].",
  }),
  c("self", 2, "[日本語|にほんご] を [始|はじ]めた ばかり です", "I just started learning Japanese.", {
    lit: "Japanese · started · just · am",
  }),
  c("self", 1, "{} が [好|す]き です", "I like {}.", {
    slot: [["[日本|にほん]", "Japan"], ["アニメ", "anime"], ["ラーメン", "ramen"], ["[音楽|おんがく]", "music"]],
  }),
  c("self", 2, "[日本|にほん]^は [初|はじ]めて です", "It's my first time in Japan."),

  // ── Work & study ──────────────────────────────────────────────────────
  c("work", 1, "[仕事|しごと]^は [何|なん] ですか", "What do you do for work?"),
  c("work", 1, "[仕事|しごと]^は {} です", "I work as {}.", {
    lit: "job · as for · {} · is",
    slot: [["エンジニア", "an engineer"], ["[先生|せんせい]", "a teacher"], ["[会社員|かいしゃいん]", "an office worker"], ["デザイナー", "a designer"]],
  }),
  c("work", 2, "{} で [働|はたら]いて います", "I work at {}.", {
    slot: [["[会社|かいしゃ]", "a company"], ["[病院|びょういん]", "a hospital"], ["[学校|がっこう]", "a school"], ["レストラン", "a restaurant"]],
  }),
  c("work", 2, "{} の [仕事|しごと] を して います", "I work in {}.", {
    slot: [["[営業|えいぎょう]", "sales"], ["[教育|きょういく]", "education"], ["[医療|いりょう]", "healthcare"], ["[金融|きんゆう]", "finance"]],
  }),
  c("work", 2, "リモート で [働|はたら]いて います", "I work remotely."),
  c("work", 1, "お[疲|つか]れ[様|さま] です", "Thanks for your hard work.", {
    note: "Everyday greeting between colleagues — hello, goodbye and thanks in one.",
  }),
  c("work", 2, "[毎日|まいにち] [忙|いそが]しい です", "I'm busy every day."),
  c("work", 2, "[会議|かいぎ]^は [何時|なんじ] から ですか", "What time does the meeting start?"),
  c("work", 3, "[少々|しょうしょう] お[待|ま]ち ください", "Please wait a moment.", {
    register: "polite",
    note: "Formal; you'll hear it from staff more than say it.",
  }),
  c("work", 2, "[確認|かくにん]します", "I'll check."),
  c("work", 2, "[仕事|しごと]^は [楽|たの]しい です", "My work is fun."),
  c("work", 2, "[今日|きょう]^は [休|やす]み です", "I'm off today."),

  // ── Family ────────────────────────────────────────────────────────────
  c("family", 1, "[家族|かぞく]^は [何人|なんにん] ですか", "How many people are in your family?"),
  c("family", 1, "{}[家族|かぞく] です", "We're a family of {}.", {
    slot: [["[四人|よにん]", "four"], ["[三人|さんにん]", "three"], ["[五人|ごにん]", "five"], ["[二人|ふたり]", "two"]],
  }),
  c("family", 1, "{} が います", "I have {}.", {
    lit: "{} · (subject) · exists",
    slot: [["[兄|あに]", "an older brother"], ["[姉|あね]", "an older sister"], ["[弟|おとうと]", "a younger brother"], ["[妹|いもうと]", "a younger sister"]],
    note: "います is for living things; ある/あります for objects.",
  }),
  c("family", 1, "[兄弟|きょうだい]^は いますか", "Do you have any siblings?"),
  c("family", 2, "[子供|こども] が [二人|ふたり] います", "I have two children."),
  c("family", 2, "[結婚|けっこん]して います", "I'm married."),
  c("family", 2, "[独身|どくしん] です", "I'm single."),
  c("family", 2, "{}^は [日本人|にほんじん] です", "My {} is Japanese.", {
    slot: [["[妻|つま]", "wife"], ["[夫|おっと]", "husband"], ["[彼女|かのじょ]", "girlfriend"], ["[彼氏|かれし]", "boyfriend"], ["[友達|ともだち]", "friend"]],
  }),
  c("family", 2, "[父|ちち]^は {} です", "My father is {}.", {
    slot: [["[先生|せんせい]", "a teacher"], ["[会社員|かいしゃいん]", "an office worker"], ["[医者|いしゃ]", "a doctor"]],
    note: "Your own father is 父; someone else's is お父さん.",
  }),
  c("family", 2, "[両親|りょうしん]^は {} に [住|す]んで います", "My parents live in {}.", {
    slot: [["ベトナム", "Vietnam"], ["カナダ", "Canada"], ["[大阪|おおさか]", "Osaka"]],
  }),
  c("family", 2, "{} を [飼|か]って います", "I have a {}.", {
    slot: [["[犬|いぬ]", "dog"], ["[猫|ねこ]", "cat"]],
    note: "飼う = to keep a pet.",
  }),

  // ── Food & ordering ───────────────────────────────────────────────────
  c("food", 1, "{} を ください", "{}, please.", {
    cue: "Ordering at a café",
    slot: [["コーヒー", "Coffee"], ["お[水|みず]", "Water"], ["ビール", "Beer"], ["これ", "This one"], ["メニュー", "The menu"]],
  }),
  c("food", 1, "[二人|ふたり] です", "Two people.", {
    cue: "Restaurant staff ask how many are in your group",
  }),
  c("food", 1, "これ に します", "I'll have this.", { cue: "Pointing at the menu" }),
  c("food", 1, "おすすめ^は [何|なん] ですか", "What do you recommend?"),
  c("food", 1, "いただきます", "(said before eating)", {
    register: "neutral",
    note: "Gratitude for the meal. Say it every time — people notice.",
  }),
  c("food", 1, "ごちそうさまでした", "Thank you for the meal (after eating).", {
    note: "Also said to staff when leaving a restaurant.",
  }),
  c("food", 1, "おいしい です", "It's delicious."),
  c("food", 1, "お[会計|かいけい] お[願|ねが]いします", "The bill, please."),
  c("food", 2, "{} が [食|た]べられません", "I can't eat {}.", {
    slot: [["[肉|にく]", "meat"], ["[魚|さかな]", "fish"], ["[卵|たまご]", "eggs"], ["えび", "shrimp"]],
  }),
  c("food", 2, "{}^は [入|はい]って いますか", "Does it have {} in it?", {
    slot: [["[肉|にく]", "meat"], ["[卵|たまご]", "egg"], ["ナッツ", "nuts"], ["[豚肉|ぶたにく]", "pork"]],
  }),
  c("food", 2, "[辛|から]い ですか", "Is it spicy?"),
  c("food", 2, "[英語|えいご] の メニュー^は ありますか", "Do you have an English menu?"),
  c("food", 2, "[持|も]ち[帰|かえ]り で お[願|ねが]いします", "To go, please."),
  c("food", 2, "ここ で [食|た]べます", "I'll eat here."),
  c("food", 2, "もう [一|ひと]つ ください", "One more, please."),
  c("food", 2, "[予約|よやく]して います", "I have a reservation."),
  c("food", 2, "お[腹|なか] が すきました", "I'm hungry."),
  c("food", 2, "{} が [大好|だいす]き です", "I love {}.", {
    slot: [["すし", "sushi"], ["ラーメン", "ramen"], ["[天|てん]ぷら", "tempura"], ["カレー", "curry"]],
  }),
  c("food", 2, "[食|た]べ[物|もの]^は [何|なに] が [好|す]き ですか", "What food do you like?"),

  // ── Getting around ────────────────────────────────────────────────────
  c("travel", 1, "{}^は どこ ですか", "Where is {}?", {
    slot: [["トイレ", "the toilet"], ["[駅|えき]", "the station"], ["[出口|でぐち]", "the exit"], ["コンビニ", "a convenience store"]],
  }),
  c("travel", 1, "{} まで お[願|ねが]いします", "To {}, please.", {
    cue: "Telling a taxi driver where to go",
    slot: [["[空港|くうこう]", "the airport"], ["[東京駅|とうきょうえき]", "Tokyo Station"], ["この [住所|じゅうしょ]", "this address"]],
  }),
  c("travel", 1, "{} に [行|い]きたい です", "I want to go to {}.", {
    slot: [["[日本|にほん]", "Japan"], ["[京都|きょうと]", "Kyoto"], ["[北海道|ほっかいどう]", "Hokkaido"], ["[沖縄|おきなわ]", "Okinawa"]],
  }),
  c("travel", 2, "この [電車|でんしゃ]^は {} に [行|い]きますか", "Does this train go to {}?", {
    slot: [["[新宿|しんじゅく]", "Shinjuku"], ["[京都|きょうと]", "Kyoto"], ["[空港|くうこう]", "the airport"]],
  }),
  c("travel", 2, "[道|みち] に [迷|まよ]いました", "I'm lost."),
  c("travel", 2, "ここ から [遠|とお]い ですか", "Is it far from here?"),
  c("travel", 2, "[歩|ある]いて [何分|なんぷん] ですか", "How many minutes is it on foot?"),
  c("travel", 2, "まっすぐ [行|い]って ください", "Please go straight."),
  c("travel", 2, "{} に [曲|ま]がって ください", "Please turn {}.", {
    slot: [["[右|みぎ]", "right"], ["[左|ひだり]", "left"]],
  }),
  c("travel", 2, "[切符|きっぷ]^は どこ で [買|か]えますか", "Where can I buy a ticket?"),
  c("travel", 2, "[写真|しゃしん] を [撮|と]って も いい ですか", "May I take a photo?"),
  c("travel", 2, "チェックイン お[願|ねが]いします", "Check-in, please."),
  c("travel", 3, "[荷物|にもつ] を [預|あず]けられますか", "Can I leave my luggage here?"),
  c("travel", 2, "ワイファイ^は ありますか", "Is there Wi-Fi?"),

  // ── Shopping ──────────────────────────────────────────────────────────
  c("shopping", 1, "これ^は いくら ですか", "How much is this?"),
  c("shopping", 1, "{}^は ありますか", "Do you have {}?", {
    slot: [["[大|おお]きい サイズ", "a larger size"], ["[小|ちい]さい サイズ", "a smaller size"], ["[他|ほか] の [色|いろ]", "other colors"]],
  }),
  c("shopping", 1, "[見|み]て いる だけ です", "I'm just looking."),
  c("shopping", 1, "カード で [払|はら]えますか", "Can I pay by card?"),
  c("shopping", 2, "[袋|ふくろ]^は いりません", "I don't need a bag."),
  c("shopping", 2, "[試着|しちゃく]して も いい ですか", "May I try it on?"),
  c("shopping", 2, "[現金|げんきん] だけ ですか", "Is it cash only?"),
  c("shopping", 2, "{}^は どこ に ありますか", "Where can I find {}?", {
    slot: [["[薬|くすり]", "medicine"], ["[牛乳|ぎゅうにゅう]", "milk"], ["[電池|でんち]", "batteries"]],
  }),
  c("shopping", 2, "[高|たか]い です ね", "That's expensive, isn't it?"),

  // ── Hobbies ───────────────────────────────────────────────────────────
  c("hobbies", 1, "[趣味|しゅみ]^は [何|なん] ですか", "What are your hobbies?"),
  c("hobbies", 1, "[趣味|しゅみ]^は {} です", "My hobby is {}.", {
    slot: [["[料理|りょうり]", "cooking"], ["[読書|どくしょ]", "reading"], ["[旅行|りょこう]", "traveling"], ["ゲーム", "video games"]],
  }),
  c("hobbies", 1, "[週末|しゅうまつ]^は [何|なに] を しますか", "What do you do on weekends?"),
  c("hobbies", 2, "よく {} を [見|み]ます", "I often watch {}.", {
    slot: [["[映画|えいが]", "movies"], ["アニメ", "anime"], ["ドラマ", "dramas"], ["サッカー", "soccer"]],
  }),
  c("hobbies", 2, "{} を する の が [好|す]き です", "I like doing {}.", {
    slot: [["[料理|りょうり]", "cooking"], ["[旅行|りょこう]", "traveling"], ["スポーツ", "sports"]],
  }),
  c("hobbies", 2, "[最近|さいきん]、{} を [始|はじ]めました", "I recently started {}.", {
    slot: [["ヨガ", "yoga"], ["ジョギング", "jogging"], ["[日本語|にほんご]", "Japanese"]],
  }),
  c("hobbies", 2, "どんな [音楽|おんがく] を [聴|き]きますか", "What kind of music do you listen to?"),
  c("hobbies", 2, "[一緒|いっしょ] に [行|い]きませんか", "Would you like to go together?"),
  c("hobbies", 1, "いい です ね", "Sounds good! / That's nice."),
  c("hobbies", 2, "[楽|たの]しかった です", "It was fun."),
  c("hobbies", 2, "{} が [上手|じょうず] です ね", "You're good at {}!", {
    slot: [["[日本語|にほんご]", "Japanese"], ["[料理|りょうり]", "cooking"], ["[英語|えいご]", "English"]],
    note: "If someone says this to you, the humble reply is まだまだです.",
  }),
  c("hobbies", 2, "まだまだ です", "I still have a long way to go.", {
    note: "The modest reply to a compliment.",
  }),

  // ── Time & plans ──────────────────────────────────────────────────────
  c("time", 1, "[今|いま] [何時|なんじ] ですか", "What time is it now?"),
  c("time", 1, "{} です", "It's {}.", {
    cue: "Telling the time",
    slot: [["[三時|さんじ]", "3 o'clock"], ["[四時|よじ]", "4 o'clock"], ["[七時|しちじ]", "7 o'clock"], ["[九時|くじ]", "9 o'clock"]],
    note: "Irregular: 4時 = よじ, 7時 = しちじ, 9時 = くじ.",
  }),
  c("time", 2, "{} に [起|お]きます", "I get up at {}.", {
    slot: [["[六時|ろくじ]", "6"], ["[七時|しちじ]", "7"], ["[八時|はちじ]", "8"]],
  }),
  c("time", 1, "[今日|きょう]^は [何曜日|なんようび] ですか", "What day of the week is it today?"),
  c("time", 1, "[明日|あした]^は [暇|ひま] ですか", "Are you free tomorrow?"),
  c("time", 2, "{}^は [大丈夫|だいじょうぶ] です", "{} works for me.", {
    slot: [["[明日|あした]", "Tomorrow"], ["[週末|しゅうまつ]", "The weekend"], ["[土曜日|どようび]", "Saturday"]],
  }),
  c("time", 2, "[何時|なんじ] に [会|あ]いましょうか", "What time shall we meet?"),
  c("time", 2, "[昨日|きのう]^は [何|なに] を しましたか", "What did you do yesterday?"),
  c("time", 2, "[遅|おく]れて すみません", "Sorry I'm late."),
  c("time", 2, "[時間|じかん] が ありません", "I don't have time."),
  c("time", 2, "いつ ですか", "When is it?"),
  c("time", 2, "じゃあ、また [今度|こんど]", "Maybe next time, then.", { register: "casual" }),
  c("time", 2, "[休|やす]み^は [何曜日|なんようび] ですか", "Which day are you off?"),

  // ── Opinions & feelings ───────────────────────────────────────────────
  c("opinions", 1, "そう です ね", "That's right. / Let me see…", {
    note: "Agreeing, or buying time to think — extremely common.",
  }),
  c("opinions", 1, "[本当|ほんとう] ですか", "Really?"),
  c("opinions", 1, "すごい です ね", "That's amazing!"),
  c("opinions", 1, "なるほど", "I see.", { register: "neutral" }),
  c("opinions", 1, "[私|わたし] も そう [思|おも]います", "I think so too."),
  c("opinions", 2, "どう [思|おも]いますか", "What do you think?"),
  c("opinions", 2, "{} と [思|おも]います", "I think it's {}.", {
    slot: [["いい", "good"], ["[難|むずか]しい", "difficult"], ["おもしろい", "interesting"]],
  }),
  c("opinions", 2, "[日本語|にほんご]^は [難|むずか]しい です が、おもしろい です", "Japanese is hard, but interesting."),
  c("opinions", 2, "ちょっと [難|むずか]しい です", "It's a bit difficult.", {
    note: "Also a polite way to say no to a request.",
  }),
  c("opinions", 2, "{} の ほう が [好|す]き です", "I prefer {}.", {
    slot: [["[夏|なつ]", "summer"], ["[冬|ふゆ]", "winter"], ["[猫|ねこ]", "cats"], ["[犬|いぬ]", "dogs"]],
  }),
  c("opinions", 2, "{}^は どう でしたか", "How was {}?", {
    slot: [["[旅行|りょこう]", "the trip"], ["[週末|しゅうまつ]", "the weekend"], ["[映画|えいが]", "the movie"]],
  }),
  c("opinions", 2, "よかった です", "That's good to hear.", { note: "Also \"It was good.\"" }),
  c("opinions", 2, "[楽|たの]しみ です", "I'm looking forward to it."),
  c("opinions", 2, "[疲|つか]れました", "I'm tired."),
  c("opinions", 2, "[嬉|うれ]しい です", "I'm happy."),
  c("opinions", 2, "[残念|ざんねん] です", "That's a shame."),
];
