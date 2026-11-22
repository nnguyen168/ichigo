/**
 * Text-to-speech via the browser's built-in speechSynthesis (free, offline on most devices).
 * Voice quality depends on the OS; Apple and Google Japanese voices are decent.
 */

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!speechSupported()) return Promise.resolve([]);
  if (voicesPromise) return voicesPromise;
  voicesPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const now = synth.getVoices();
    if (now.length) return resolve(now);
    const done = () => resolve(synth.getVoices());
    synth.addEventListener("voiceschanged", done, { once: true });
    // Some browsers never fire the event.
    setTimeout(done, 1500);
  });
  return voicesPromise;
}

export async function voicesFor(locale: string): Promise<SpeechSynthesisVoice[]> {
  const lang = locale.split("-")[0]!;
  const voices = await loadVoices();
  return voices.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(lang));
}

export interface SpeakOptions {
  locale: string;
  voiceURI?: string;
  rate?: number;
  /** Pick a random voice of the language (high-variability listening practice). */
  varyVoice?: boolean;
}

export async function speak(text: string, opts: SpeakOptions): Promise<void> {
  if (!speechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voices = await voicesFor(opts.locale);
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = opts.locale;
  utter.rate = opts.rate ?? 0.95;
  let voice = voices.find((v) => v.voiceURI === opts.voiceURI);
  if (opts.varyVoice && voices.length > 1) voice = voices[Math.floor(Math.random() * voices.length)];
  if (voice) utter.voice = voice;
  return new Promise((resolve) => {
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    synth.speak(utter);
  });
}
