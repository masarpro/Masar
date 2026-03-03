"use client";

import { useEffect, useRef } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AssistantMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function AssistantMessages({
  messages,
  isLoading,
}: AssistantMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) return null;

  const showTyping =
    isLoading && messages[messages.length - 1]?.role === "user";

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`max-w-[85%] whitespace-pre-wrap rounded-2xl p-3 text-sm leading-relaxed ${
            msg.role === "user"
              ? "ms-auto rounded-ee-sm bg-blue-600 text-white"
              : "rounded-es-sm bg-muted"
          }`}
        >
          {msg.content}
        </div>
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

      <div ref={bottomRef} />
    </div>
  );
}
