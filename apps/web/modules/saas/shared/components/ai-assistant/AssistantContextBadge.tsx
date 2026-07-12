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
    <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg bg-chart-4/15 px-3 py-1.5 text-xs text-chart-4 dark:bg-chart-4/20 dark:text-chart-4">
      <MapPin size={14} className="shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}
