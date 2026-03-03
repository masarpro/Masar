"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
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
}

const toolLabels: Record<string, string> = {
  queryProjects: "المشاريع",
  queryFinance: "البيانات المالية",
  queryExecution: "بيانات التنفيذ",
  queryTimeline: "الجدول الزمني",
  queryCompany: "بيانات المنشأة",
  navigateTo: "الروابط",
};

export function AssistantMessages({
  messages,
  isLoading,
}: AssistantMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) return null;

  const showTyping =
    isLoading && messages[messages.length - 1]?.role === "user";

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((msg) => {
        // Tool call in-progress indicator
        const pendingTools = msg.toolInvocations?.filter(
          (t) => t.state === "call" || t.state === "partial-call",
        );

        if (msg.role === "user") {
          return (
            <div
              key={msg.id}
              className="ms-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-ee-sm bg-blue-600 p-3 text-sm leading-relaxed text-white"
            >
              {msg.content}
            </div>
          );
        }

        return (
          <div
            key={msg.id}
            className="max-w-[85%] rounded-2xl rounded-es-sm bg-muted p-3 text-sm leading-relaxed"
          >
            {pendingTools && pendingTools.length > 0 && !msg.content && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>
                  يبحث في{" "}
                  {pendingTools
                    .map((t) => toolLabels[t.toolName] || t.toolName)
                    .join("، ")}
                  ...
                </span>
              </div>
            )}
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
          </div>
        );
      })}

      {showTyping && (
        <div className="max-w-[85%] rounded-2xl rounded-es-sm bg-muted p-3">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
