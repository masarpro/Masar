"use client";

import { useTranslations } from "next-intl";
import type { AssistantSection } from "./types";

interface AssistantSuggestionsProps {
  section: AssistantSection;
  lastMessage: string;
  locale: string;
  onSuggestion: (text: string) => void;
}

function getSuggestions(
  section: AssistantSection,
  lastMessage: string,
  t: (key: string) => string,
): string[] {
  const msg = lastMessage.toLowerCase();

  // Keyword-based contextual suggestions
  if (msg.includes("فاتور") || msg.includes("invoice")) {
    return [t("suggestions.overdueInvoices"), t("suggestions.monthlySummary"), t("suggestions.bankBalances")];
  }
  if (msg.includes("مشروع") || msg.includes("project")) {
    return [t("suggestions.moreDetails"), t("suggestions.openIssues"), t("suggestions.budget")];
  }
  if (msg.includes("تنفيذ") || msg.includes("execution") || msg.includes("تقرير")) {
    return [t("suggestions.dailyReports"), t("suggestions.criticalIssues"), t("suggestions.progress")];
  }
  if (msg.includes("موظف") || msg.includes("employee") || msg.includes("منشأة")) {
    return [t("suggestions.employeeCount"), t("suggestions.assets"), t("suggestions.payroll")];
  }

  // Section-based fallback
  const sectionSuggestions: Partial<Record<AssistantSection, string[]>> = {
    dashboard: [t("suggestions.projectSummary"), t("suggestions.financialSummary"), t("suggestions.openIssues")],
    finance: [t("suggestions.overdueInvoices"), t("suggestions.bankBalances"), t("suggestions.expenseSummary")],
    projects: [t("suggestions.projectList"), t("suggestions.financialSummary"), t("suggestions.anyIssues")],
    company: [t("suggestions.employeeCount"), t("suggestions.assets"), t("suggestions.companyExpenses")],
  };

  return (
    sectionSuggestions[section] ??
    [t("suggestions.projectSummary"), t("suggestions.financialSummary"), t("suggestions.howToUse")]
  );
}

export function AssistantSuggestions({
  section,
  lastMessage,
  locale,
  onSuggestion,
}: AssistantSuggestionsProps) {
  const t = useTranslations("assistant");
  const suggestions = getSuggestions(section, lastMessage, t);

  return (
    <div className="flex flex-wrap gap-1.5 border-t border-border/50 px-3 py-2">
      {suggestions.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => onSuggestion(text)}
          className="whitespace-nowrap rounded-full border border-blue-200 bg-blue-50/50 px-3 py-1.5 text-xs text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
