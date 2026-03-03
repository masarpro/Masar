"use client";

import { useSession } from "@saas/auth/hooks/use-session";
import { useParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { getQuickActions } from "./quick-actions";
import type { AssistantContextType, SavedChat } from "./types";
import { usePageContext } from "./usePageContext";

const AssistantContext = createContext<AssistantContextType | null>(null);

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return ctx;
}

export function AssistantProvider({
  children,
  organizationName,
}: PropsWithChildren<{ organizationName: string }>) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const params = useParams<{ organizationSlug?: string }>();
  const organizationSlug = params.organizationSlug ?? "";
  const pageContext = usePageContext();
  const quickActions = getQuickActions(pageContext.section);
  const { user } = useSession();
  const userName = user?.name || "";
  const fetchedSlugRef = useRef("");

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Clear unread when opened
  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  // Fetch chat list on mount and when organization changes
  const refreshChats = useCallback(async () => {
    if (!organizationSlug) return;
    setIsLoadingChats(true);
    try {
      const res = await fetch(
        `/api/ai/assistant/chats?organizationSlug=${encodeURIComponent(organizationSlug)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setSavedChats(data.chats ?? []);
      }
    } catch (e) {
      console.error("Failed to load chats", e);
    } finally {
      setIsLoadingChats(false);
    }
  }, [organizationSlug]);

  useEffect(() => {
    if (organizationSlug && organizationSlug !== fetchedSlugRef.current) {
      fetchedSlugRef.current = organizationSlug;
      refreshChats();
    }
  }, [organizationSlug, refreshChats]);

  const deleteChat = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/ai/assistant/chats/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationSlug }),
        });
        setSavedChats((prev) => prev.filter((c) => c.id !== id));
        if (activeChatId === id) {
          setActiveChatId(null);
        }
      } catch (e) {
        console.error("Failed to delete chat", e);
      }
    },
    [organizationSlug, activeChatId],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }

      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, toggle]);

  return (
    <AssistantContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggle,
        pageContext,
        quickActions,
        organizationSlug,
        organizationName,
        userName,
        unreadCount,
        incrementUnread: () => setUnreadCount((prev) => prev + 1),
        activeChatId,
        setActiveChatId,
        savedChats,
        refreshChats,
        isLoadingChats,
        deleteChat,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}
