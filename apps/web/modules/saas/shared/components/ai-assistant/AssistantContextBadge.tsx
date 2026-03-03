"use client";

import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import type { PageContext } from "./types";

interface AssistantContextBadgeProps {
  pageContext: PageContext;
}

export function AssistantContextBadge({
  pageContext,
}: AssistantContextBadgeProps) {
  const t = useTranslations("assistant.contextBadge");

  if (pageContext.section === "unknown") return null;

  const sectionLabel = t(pageContext.section);

  const label = pageContext.projectName
    ? `${pageContext.projectName} | ${sectionLabel}`
    : sectionLabel;

  return (
    <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
      <MapPin size={14} className="shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}
