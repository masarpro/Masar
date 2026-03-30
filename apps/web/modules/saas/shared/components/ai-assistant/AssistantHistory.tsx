"use client";

import { cn } from "@ui/lib";
import { History, MessageSquare, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { SavedChat } from "./types";

function formatRelativeTime(dateStr: string, locale: string, t: (key: string, values?: Record<string, string | number>) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("history.time.justNow");
  if (diffMins < 60) return t("history.time.minutesAgo", { count: diffMins });
  if (diffHours < 24) return t("history.time.hoursAgo", { count: diffHours });
  if (diffDays === 1) return t("history.time.yesterday");
  if (diffDays < 7) return t("history.time.daysAgo", { count: diffDays });
  return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US");
}

function ChatListItem({
  chat,
  isActive,
  onSelect,
  onDelete,
  locale,
}: {
  chat: SavedChat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  locale: string;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const t = useTranslations("assistant");

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg text-start transition-colors group",
        isActive
          ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
          : "hover:bg-muted/50",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {chat.title || t("history.defaultTitle")}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {formatRelativeTime(chat.updatedAt, locale, t)}
        </p>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        className={cn(
          "p-1 rounded-md transition-all shrink-0",
          confirmDelete
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100",
          confirmDelete
            ? "bg-red-50 dark:bg-red-950/30 text-red-500"
            : "hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500",
        )}
        title={t("history.delete")}
      >
        {confirmDelete ? (
          <span className="text-[10px] text-red-500 font-medium px-1">
            {t("history.confirmDelete")}
          </span>
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>
    </button>
  );
}

export function AssistantHistory({
  chats,
  isLoading,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  onClose,
  locale,
  isOpen,
}: {
  chats: SavedChat[];
  isLoading: boolean;
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onClose: () => void;
  locale: string;
  isOpen: boolean;
}) {
  const t = useTranslations("assistant");

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 bg-background flex flex-col",
        "transition-transform duration-200",
        isOpen
          ? "translate-x-0"
          : "ltr:translate-x-full rtl:-translate-x-full",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4" />
          <span className="text-sm font-medium">
            {t("history.title")}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-8">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <span>
              {t("history.empty")}
            </span>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                onSelect={() => onSelectChat(chat.id)}
                onDelete={() => onDeleteChat(chat.id)}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
