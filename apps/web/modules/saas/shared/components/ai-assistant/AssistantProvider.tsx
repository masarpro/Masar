"use client";

import { useParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { getQuickActions } from "./quick-actions";
import type { AssistantContextType } from "./types";
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
  const params = useParams<{ organizationSlug?: string }>();
  const organizationSlug = params.organizationSlug ?? "";
  const pageContext = usePageContext();
  const quickActions = getQuickActions(pageContext.section);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger when focused on input/textarea
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
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}
