"use client";

import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";
import { Sparkles, X } from "lucide-react";
import { useRef } from "react";
import { useAssistant } from "./AssistantProvider";

export function FloatingAssistantButton() {
  const { isOpen, toggle, unreadCount } = useAssistant();
  const t = useTranslations("assistant");
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggle}
      aria-label={t("title")}
      aria-expanded={isOpen}
      aria-controls="assistant-panel"
      aria-haspopup="dialog"
      title={`${t("title")} (${t("shortcut")})`}
      className={cn(
        "fixed bottom-20 md:bottom-6 start-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95",
      )}
    >
      <span
        className={cn(
          "transition-transform duration-300",
          isOpen ? "rotate-180" : "rotate-0",
        )}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </span>

      {/* Unread badge */}
      {unreadCount > 0 && !isOpen && (
        <span className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-in zoom-in-50">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
