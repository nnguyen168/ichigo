import { useApp } from "../app/context";

interface Props {
  text: string;
  className?: string;
  /** Force romaji on/off; default follows the learner's romaji setting. */
  romaji?: boolean;
  /** Force furigana on/off; default follows the learner's setting. */
  furigana?: boolean;
}

/** Target-language text with furigana (ruby) and the optional romaji crutch underneath. */
export function JaText({ text, className = "", romaji, furigana }: Props) {
  const { pack, romajiOn, furiganaOn } = useApp();
  const showRomaji = romaji ?? romajiOn;
  const showFurigana = furigana ?? furiganaOn;
  const segments = pack.parseText(text);
  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className="jp leading-[1.9]" lang={pack.code}>
        {segments.map((s, i) =>
          s.reading && showFurigana ? (
            <ruby key={i}>
              {s.base}
              <rt>{s.reading}</rt>
            </ruby>
          ) : (
            <span key={i}>{s.base}</span>
          ),
        )}
      </span>
      {showRomaji && pack.romanize && (
        <span className="text-[0.55em] font-normal tracking-wide text-muted leading-snug">{pack.romanize(text)}</span>
      )}
    </span>
  );
}
