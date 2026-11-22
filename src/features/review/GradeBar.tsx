import { useEffect, useMemo } from "react";
import { GRADES, previewIntervals, type GradeValue } from "../../core/scheduler";
import type { StudyCard } from "../../core/types";

interface Props {
  card: StudyCard;
  suggested?: GradeValue;
  onGrade: (g: GradeValue) => void;
  disabled?: boolean;
}

const STYLE: Record<GradeValue, string> = {
  1: "text-accent-strong",
  2: "text-warn",
  3: "text-leaf",
  4: "text-leaf",
};

export function GradeBar({ card, suggested, onGrade, disabled }: Props) {
  const intervals = useMemo(() => previewIntervals(card.fsrs, new Date()), [card]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const g = GRADES.find((x) => x.key === e.key);
      if (g && !disabled) onGrade(g.value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onGrade, disabled]);

  return (
    <div>
      <p className="mb-2 text-center text-xs text-muted">
        How well did you recall it?{suggested ? " The highlighted button is a suggestion — you decide." : ""}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {GRADES.map((g) => (
          <button
            key={g.value}
            disabled={disabled}
            onClick={() => onGrade(g.value)}
            className={`btn flex-col !gap-0 border py-2.5 ${
              suggested === g.value ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-accent"
            }`}
          >
            <span className={STYLE[g.value]}>{g.label}</span>
            <span className="text-[11px] font-normal text-muted">{intervals[g.value]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
