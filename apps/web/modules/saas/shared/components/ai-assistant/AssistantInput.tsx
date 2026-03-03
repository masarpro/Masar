"use client";

import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";
import { Loader2, SendHorizontal } from "lucide-react";
import { useEffect, useRef } from "react";

interface AssistantInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function AssistantInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: AssistantInputProps) {
  const t = useTranslations("assistant");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && value.length <= 2000) {
        onSubmit();
      }
    }
  }

  return (
    <div className="relative flex items-end gap-2 border-t border-border/50 bg-background px-3 py-2.5">
      <textarea
        ref={inputRef}
        dir="auto"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("placeholder")}
        disabled={isLoading}
        rows={1}
        aria-label={t("placeholder")}
        className="max-h-[120px] min-h-[36px] flex-1 resize-none bg-transparent py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!value.trim() || isLoading || value.length > 2000}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        aria-label={t("send")}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <SendHorizontal size={18} />
        )}
      </button>
      {value.length > 1500 && (
        <span
          className={cn(
            "absolute bottom-0.5 start-3 text-[10px]",
            value.length > 1900
              ? "text-red-500"
              : "text-muted-foreground/50",
          )}
        >
          {value.length}/2000
        </span>
      )}
    </div>
  );
}
