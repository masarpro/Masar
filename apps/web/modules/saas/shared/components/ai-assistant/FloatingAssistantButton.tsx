"use client";

import { useTranslations } from "next-intl";
import { Sparkles, X } from "lucide-react";
import { useAssistant } from "./AssistantProvider";

export function FloatingAssistantButton() {
  const { isOpen, toggle } = useAssistant();
  const t = useTranslations("assistant");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("title")}
      title={`${t("title")} (${t("shortcut")})`}
      className={`fixed bottom-20 md:bottom-6 start-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 ${
        !isOpen ? "animate-pulse" : ""
      }`}
    >
      <span
        className={`transition-transform duration-300 ${isOpen ? "rotate-90" : "rotate-0"}`}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </span>
    </button>
  );
}
