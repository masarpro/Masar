"use client";

import { useChat } from "@ai-sdk/react";
import { useLocale, useTranslations } from "next-intl";
import { RotateCcw, Sparkles, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useAssistant } from "./AssistantProvider";
import { AssistantContextBadge } from "./AssistantContextBadge";
import { AssistantInput } from "./AssistantInput";
import { AssistantMessages } from "./AssistantMessages";
import { AssistantQuickActions } from "./AssistantQuickActions";

export function AssistantPanel() {
  const {
    isOpen,
    setIsOpen,
    pageContext,
    quickActions,
    organizationSlug,
    organizationName,
  } = useAssistant();
  const t = useTranslations("assistant");
  const locale = useLocale();
  const [inputValue, setInputValue] = useState("");

  const contextBody = {
    organizationSlug,
    organizationName,
    currentPage: pageContext.route,
    currentSection: pageContext.section,
    projectId: pageContext.projectId,
    projectName: pageContext.projectName,
    locale,
  };

  const { messages, setMessages, status, sendMessage } = useChat({
    transport: {
      async sendMessages({ messages: msgs, abortSignal }) {
        const response = await fetch("/api/ai/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: msgs, context: contextBody }),
          signal: abortSignal,
        });
        if (!response.body) {
          throw new Error("No response body");
        }
        return response.body as ReadableStream;
      },
      reconnectToStream() {
        throw new Error("Unsupported");
      },
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInputValue("");
  }, [inputValue, isLoading, sendMessage]);

  const handleQuickAction = useCallback(
    (prompt: string) => {
      sendMessage({ text: prompt });
    },
    [sendMessage],
  );

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setInputValue("");
  }, [setMessages]);

  // Map messages to the format AssistantMessages expects
  const mappedMessages = messages.map((msg) => {
    const textContent =
      msg.parts
        ?.filter(
          (p): p is { type: "text"; text: string } => p.type === "text",
        )
        .map((p) => p.text)
        .join("") ?? "";

    // Extract tool invocations from parts (tool parts have type "tool-{name}" or "dynamic-tool")
    const toolInvocations: { toolName: string; state: "call" | "result" | "partial-call" }[] = [];
    for (const p of msg.parts ?? []) {
      if (p.type.startsWith("tool-")) {
        const part = p as { type: string; state?: string; toolName?: string };
        const toolName = part.toolName ?? p.type.replace("tool-", "");
        toolInvocations.push({
          toolName,
          state: (part.state as "call" | "result" | "partial-call") ?? "result",
        });
      }
    }

    return {
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: textContent,
      toolInvocations: toolInvocations.length > 0 ? toolInvocations : undefined,
    };
  });

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
        {mappedMessages.length === 0 ? (
          <AssistantQuickActions
            actions={quickActions}
            locale={locale}
            onAction={handleQuickAction}
          />
        ) : (
          <AssistantMessages
            messages={mappedMessages}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Input */}
      <AssistantInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
