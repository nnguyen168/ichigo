import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { bind, unbind } from "wanakana";

interface Props {
  placeholder?: string;
  /** Convert romaji to kana as you type (Japanese answers). Off for romaji answers. */
  toKana?: boolean;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  ariaLabel: string;
}

export interface KanaInputHandle {
  value: () => string;
  clear: () => void;
  focus: () => void;
}

/** Uncontrolled input so wanakana's IME binding can rewrite the value as the learner types. */
export const KanaInput = forwardRef<KanaInputHandle, Props>(function KanaInput(
  { placeholder, toKana = true, onSubmit, disabled, autoFocus, ariaLabel },
  ref,
) {
  const el = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = el.current;
    if (!input || !toKana) return;
    bind(input, { IMEMode: true });
    return () => unbind(input);
  }, [toKana]);

  useImperativeHandle(ref, () => ({
    value: () => el.current?.value ?? "",
    clear: () => {
      if (el.current) el.current.value = "";
    },
    focus: () => el.current?.focus(),
  }));

  return (
    <input
      ref={el}
      className="input jp text-lg"
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      lang={toKana ? "ja" : "en"}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
          e.preventDefault();
          onSubmit(el.current?.value ?? "");
        }
      }}
    />
  );
});
