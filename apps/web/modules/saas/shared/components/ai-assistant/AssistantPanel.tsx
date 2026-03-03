"use client";

import { useLocale, useTranslations } from "next-intl";
import { RotateCcw, Sparkles, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useAssistant } from "./AssistantProvider";
import { AssistantContextBadge } from "./AssistantContextBadge";
import { AssistantInput } from "./AssistantInput";
import { AssistantMessages } from "./AssistantMessages";
import { AssistantQuickActions } from "./AssistantQuickActions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AssistantPanel() {
  const { isOpen, setIsOpen, pageContext, quickActions } = useAssistant();
  const t = useTranslations("assistant");
  const locale = useLocale();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Temporary mock response
    setTimeout(() => {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "مرحباً! أنا مساعد مسار، سأكون جاهز قريباً لمساعدتك. 🚀",
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 1500);
  }, [input, isLoading]);

  const handleQuickAction = useCallback(
    (prompt: string) => {
      setInput("");
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: prompt,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      setTimeout(() => {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "مرحباً! أنا مساعد مسار، سأكون جاهز قريباً لمساعدتك. 🚀",
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);
      }, 1500);
    },
    [],
  );

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setInput("");
    setIsLoading(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-[96px] md:bottom-[88px] start-4 sm:start-6 z-[60] flex h-[min(70vh,600px)] w-[calc(100vw-32px)] sm:w-[400px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-blue-600" />
          <span className="text-sm font-bold">{t("title")}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("newChat")}
            title={t("newChat")}
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("close")}
            title={t("close")}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Context Badge */}
      <AssistantContextBadge pageContext={pageContext} />

      {/* Body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {messages.length === 0 ? (
          <AssistantQuickActions
            actions={quickActions}
            locale={locale}
            onAction={handleQuickAction}
          />
        ) : (
          <AssistantMessages messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* Input */}
      <AssistantInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
