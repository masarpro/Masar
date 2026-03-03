"use client";

import { cn } from "@ui/lib";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale, useTranslations } from "next-intl";
import { History, Maximize2, Minimize2, RotateCcw, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAssistant } from "./AssistantProvider";
import { AssistantContextBadge } from "./AssistantContextBadge";
import { AssistantInput } from "./AssistantInput";
import { AssistantMessages } from "./AssistantMessages";
import { AssistantSuggestions } from "./AssistantSuggestions";
import { AssistantHistory } from "./AssistantHistory";
import { AssistantWelcome } from "./AssistantWelcome";

export function AssistantPanel() {
  const {
    isOpen,
    setIsOpen,
    pageContext,
    quickActions,
    organizationSlug,
    organizationName,
    userName,
    incrementUnread,
    activeChatId,
    setActiveChatId,
    savedChats,
    refreshChats,
    isLoadingChats,
    deleteChat,
  } = useAssistant();
  const t = useTranslations("assistant");
  const locale = useLocale();
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const savingRef = useRef(false);
  const prevSaveLenRef = useRef(0);

  const contextBody = {
    organizationSlug,
    organizationName,
    currentPage: pageContext.route,
    currentSection: pageContext.section,
    projectId: pageContext.projectId,
    projectName: pageContext.projectName,
    locale,
  };

  const contextBodyRef = useRef(contextBody);
  contextBodyRef.current = contextBody;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/assistant",
        prepareSendMessagesRequest({ messages }) {
          return {
            body: {
              messages,
              context: contextBodyRef.current,
            },
          };
        },
      }),
    [],
  );

  const { messages, setMessages, status, sendMessage, error } = useChat({
    transport,
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Track new assistant messages for unread badge
  const prevMsgCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant" && !isOpen) {
        incrementUnread();
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, isOpen, incrementUnread]);

  // Auto-save after each assistant response completes
  useEffect(() => {
    if (
      messages.length > 0 &&
      messages.length !== prevSaveLenRef.current &&
      messages[messages.length - 1]?.role === "assistant" &&
      !isLoading &&
      !savingRef.current
    ) {
      prevSaveLenRef.current = messages.length;
      saveChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isLoading]);

  const saveChat = async () => {
    savingRef.current = true;
    setSaveStatus("saving");
    try {
      const messagesToSave = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => {
          const textContent =
            m.parts
              ?.filter(
                (p): p is { type: "text"; text: string } => p.type === "text",
              )
              .map((p) => p.text)
              .join("") ?? "";
          return {
            id: m.id,
            role: m.role,
            content: textContent,
          };
        });

      if (!activeChatId) {
        // Create new chat
        const res = await fetch("/api/ai/assistant/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationSlug,
            messages: messagesToSave,
            metadata: {
              section: pageContext.section,
              projectId: pageContext.projectId,
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setActiveChatId(data.chat.id);
          refreshChats();
        }
      } else {
        // Update existing chat
        await fetch(`/api/ai/assistant/chats/${activeChatId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationSlug,
            messages: messagesToSave,
          }),
        });
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      console.error("Failed to save chat", e);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      savingRef.current = false;
    }
  };

  // Load a previously saved chat
  const loadChat = useCallback(
    async (chatId: string) => {
      try {
        const res = await fetch(
          `/api/ai/assistant/chats/${chatId}?organizationSlug=${encodeURIComponent(organizationSlug)}`,
        );
        if (res.ok) {
          const data = await res.json();
          const loadedMessages = (data.chat.messages as Array<{ id?: string; role: string; content: string; createdAt?: string }>).map(
            (m, i) => ({
              id: m.id || `loaded-${i}`,
              role: m.role as "user" | "assistant",
              parts: [{ type: "text" as const, text: m.content }],
              createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
            }),
          );
          setMessages(loadedMessages);
          setActiveChatId(chatId);
          prevSaveLenRef.current = loadedMessages.length;
        }
      } catch (e) {
        console.error("Failed to load chat", e);
      }
    },
    [organizationSlug, setMessages, setActiveChatId],
  );

  // Open/close animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isLoading || text.length > 2000) return;
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
    setActiveChatId(null);
    setInputValue("");
    setShowHistory(false);
    prevSaveLenRef.current = 0;
  }, [setMessages, setActiveChatId]);

  // Map messages to the format AssistantMessages expects
  const mappedMessages = messages.map((msg) => {
    const textContent =
      msg.parts
        ?.filter(
          (p): p is { type: "text"; text: string } => p.type === "text",
        )
        .map((p) => p.text)
        .join("") ?? "";

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

  const lastAssistantMsg = [...mappedMessages]
    .reverse()
    .find((m) => m.role === "assistant");
  const showSuggestions =
    !isLoading &&
    mappedMessages.length > 0 &&
    mappedMessages[mappedMessages.length - 1]?.role === "assistant";

  if (!isVisible) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[59] bg-black/20 transition-opacity duration-200 sm:hidden",
          isAnimating ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <div
        id="assistant-panel"
        role="dialog"
        aria-label={t("title")}
        className={cn(
          "fixed z-[60] flex flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl",
          "transition-all duration-200 ease-out",
          // Mobile
          "bottom-[96px] inset-x-4 h-[70vh]",
          // Desktop
          "sm:bottom-[88px] sm:inset-x-auto sm:inset-inline-start-6",
          isExpanded
            ? "sm:h-[min(85vh,800px)] sm:w-[560px]"
            : "sm:h-[min(70vh,600px)] sm:w-[400px]",
          // Animation
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2",
        )}
      >
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
              onClick={() => {
                setShowHistory(true);
                refreshChats();
              }}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={locale === "ar" ? "المحادثات السابقة" : "Chat History"}
            >
              <History size={16} />
              {savedChats.length > 0 && (
                <span className="absolute -top-0.5 -end-0.5 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>
            {/* Expand/Collapse — desktop only */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
              title={isExpanded ? t("collapse") : t("expand")}
            >
              {isExpanded ? (
                <Minimize2 size={16} />
              ) : (
                <Maximize2 size={16} />
              )}
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

        {/* Gradient line */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

        {/* Context Badge */}
        <AssistantContextBadge pageContext={pageContext} />

        {/* Body */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* History overlay */}
          <AssistantHistory
            chats={savedChats}
            isLoading={isLoadingChats}
            activeChatId={activeChatId}
            onSelectChat={(chatId) => {
              loadChat(chatId);
              setShowHistory(false);
            }}
            onDeleteChat={async (chatId) => {
              await deleteChat(chatId);
              if (chatId === activeChatId) {
                setMessages([]);
                prevSaveLenRef.current = 0;
              }
            }}
            onClose={() => setShowHistory(false)}
            locale={locale}
            isOpen={showHistory}
          />

          {mappedMessages.length === 0 ? (
            <AssistantWelcome
              userName={userName}
              locale={locale}
              quickActions={quickActions}
              onAction={handleQuickAction}
            />
          ) : (
            <>
              <AssistantMessages
                messages={mappedMessages}
                isLoading={isLoading}
                locale={locale}
                error={!!error}
              />
              {showSuggestions && lastAssistantMsg && (
                <AssistantSuggestions
                  section={pageContext.section}
                  lastMessage={lastAssistantMsg.content}
                  locale={locale}
                  onSuggestion={handleQuickAction}
                />
              )}
            </>
          )}
        </div>

        {/* Input + Save Status */}
        <div>
          {saveStatus !== "idle" && (
            <div className="flex items-center justify-center gap-1 pb-1">
              {saveStatus === "saving" && (
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                  {locale === "ar" ? "يحفظ..." : "Saving..."}
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="text-[10px] text-green-600/60 flex items-center gap-1">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {locale === "ar" ? "تم الحفظ" : "Saved"}
                </span>
              )}
              {saveStatus === "error" && (
                <span className="text-[10px] text-red-500/60">
                  {locale === "ar" ? "فشل الحفظ" : "Save failed"}
                </span>
              )}
            </div>
          )}
          <AssistantInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  );
}
