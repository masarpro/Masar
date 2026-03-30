"use client";

import { cn } from "@ui/lib";
import {
  AlertCircle,
  ArrowDown,
  Check,
  Copy,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Markdown from "react-markdown";

interface ToolInvocation {
  toolName: string;
  state: "call" | "result" | "partial-call";
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolInvocations?: ToolInvocation[];
}

interface AssistantMessagesProps {
  messages: Message[];
  isLoading: boolean;
  locale: string;
  error?: boolean;
}

const MessageBubble = memo(function MessageBubble({
  msg,
  locale,
  router,
}: {
  msg: Message;
  locale: string;
  router: ReturnType<typeof useRouter>;
}) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("assistant");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [msg.content]);

  const pendingTools = msg.toolInvocations?.filter(
    (ti) => ti.state === "call" || ti.state === "partial-call",
  );

  if (msg.role === "user") {
    return (
      <div className="ms-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-ee-sm bg-blue-600 p-3 text-sm leading-relaxed text-white">
        {msg.content}
      </div>
    );
  }

  return (
    <div className="group relative max-w-[85%] rounded-2xl rounded-es-sm bg-muted p-3 text-sm leading-relaxed">
      {/* Tool call indicator */}
      {pendingTools && pendingTools.length > 0 && !msg.content && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50/50 px-3 py-2 text-xs text-muted-foreground dark:bg-blue-950/20">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
          <span>
            {pendingTools
              .map((ti) => {
                const key = `tools.${ti.toolName}` as const;
                return t.has(key) ? t(key) : ti.toolName;
              })
              .join("، ")}
          </span>
        </div>
      )}

      {/* Message content with Markdown */}
      {msg.content && (
        <div className="assistant-markdown prose prose-sm max-w-none dark:prose-invert prose-p:mb-2 prose-p:last:mb-0 prose-ul:mb-2 prose-ol:mb-2 prose-li:text-sm prose-headings:text-sm prose-headings:font-bold">
          <Markdown
            components={{
              a: ({ href, children }) => {
                if (href?.startsWith("/app/")) {
                  return (
                    <button
                      type="button"
                      onClick={() => router.push(href)}
                      className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                    >
                      {children}
                    </button>
                  );
                }
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline dark:text-blue-400"
                  >
                    {children}
                  </a>
                );
              },
            }}
          >
            {msg.content}
          </Markdown>
        </div>
      )}

      {/* Copy button — assistant messages only */}
      {msg.content && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute end-1 top-1 rounded-md bg-background/80 p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
          title={t("copy")}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
});

export function AssistantMessages({
  messages,
  isLoading,
  locale,
  error,
}: AssistantMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const router = useRouter();
  const t = useTranslations("assistant");

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    setIsAtBottom(
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold,
    );
  }, []);

  useEffect(() => {
    if (isAtBottom) scrollToBottom();
  }, [messages, isLoading, isAtBottom, scrollToBottom]);

  if (messages.length === 0) return null;

  const showTyping =
    isLoading && messages[messages.length - 1]?.role === "user";

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="assistant-messages flex flex-1 flex-col gap-3 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-label={t("conversationLog")}
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            locale={locale}
            router={router}
          />
        ))}

        {showTyping && (
          <div className="max-w-[85%] rounded-2xl rounded-es-sm bg-muted p-3">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <div className="text-xs">
              <p className="font-medium text-red-700 dark:text-red-400">
                {t("error")}
              </p>
              <p className="mt-0.5 text-red-600/70 dark:text-red-400/70">
                {t("errorRetry")}
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {!isAtBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs shadow-sm transition-colors hover:bg-muted"
        >
          <ArrowDown className="h-3 w-3" />
          <span>{t("newMessages")}</span>
        </button>
      )}
    </div>
  );
}
