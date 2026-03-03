"use client";

import { useTranslations } from "next-intl";
import { Loader2, SendHorizontal } from "lucide-react";

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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit();
      }
    }
  }

  return (
    <div className="flex items-center gap-2 border-t bg-background p-3">
      <input
        type="text"
        dir="auto"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("placeholder")}
        disabled={isLoading}
        className="flex-1 rounded-lg border bg-muted/30 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-blue-500 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!value.trim() || isLoading}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        aria-label={t("send")}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <SendHorizontal size={18} />
        )}
      </button>
    </div>
  );
}
