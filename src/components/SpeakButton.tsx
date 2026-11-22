import { useApp } from "../app/context";
import { SpeakerIcon, TurtleIcon } from "./icons";

interface Props {
  text: string;
  slow?: boolean;
  vary?: boolean;
  label?: string;
  className?: string;
}

/** Plays target-language text (markup is stripped before speaking). */
export function SpeakButton({ text, slow, vary, label, className = "" }: Props) {
  const { say, pack } = useApp();
  const name = label ?? (slow ? "Play slowly" : "Play");
  return (
    <button
      type="button"
      className={`btn-secondary !px-3 ${className}`}
      onClick={() => void say(pack.plainText(text), { slow, vary })}
      aria-label={name}
      title={name}
    >
      {slow ? <TurtleIcon /> : <SpeakerIcon />}
      {label && <span>{label}</span>}
    </button>
  );
}
