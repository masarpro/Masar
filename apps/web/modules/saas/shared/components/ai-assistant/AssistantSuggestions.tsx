"use client";

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
  locale: string,
): string[] {
  const isAr = locale === "ar";
  const msg = lastMessage.toLowerCase();

  // Keyword-based contextual suggestions
  if (msg.includes("فاتور") || msg.includes("invoice")) {
    return isAr
      ? ["فواتير متأخرة", "ملخص الشهر", "أرصدة البنوك"]
      : ["Overdue invoices", "Monthly summary", "Bank balances"];
  }
  if (msg.includes("مشروع") || msg.includes("project")) {
    return isAr
      ? ["تفاصيل أكثر", "المشاكل المفتوحة", "الميزانية"]
      : ["More details", "Open issues", "Budget"];
  }
  if (msg.includes("تنفيذ") || msg.includes("execution") || msg.includes("تقرير")) {
    return isAr
      ? ["التقارير اليومية", "المشاكل الحرجة", "نسبة الإنجاز"]
      : ["Daily reports", "Critical issues", "Progress"];
  }
  if (msg.includes("موظف") || msg.includes("employee") || msg.includes("منشأة")) {
    return isAr
      ? ["عدد الموظفين", "الأصول", "الرواتب"]
      : ["Employee count", "Assets", "Payroll"];
  }

  // Section-based fallback
  const sectionSuggestions: Partial<Record<AssistantSection, string[]>> = {
    dashboard: isAr
      ? ["ملخص مشاريعي", "ملخص مالي", "مشاكل مفتوحة"]
      : ["Project summary", "Financial summary", "Open issues"],
    finance: isAr
      ? ["فواتير متأخرة", "أرصدة البنوك", "ملخص المصروفات"]
      : ["Overdue invoices", "Bank balances", "Expense summary"],
    projects: isAr
      ? ["قائمة المشاريع", "ملخص مالي", "أي مشاكل؟"]
      : ["Project list", "Financial summary", "Any issues?"],
    company: isAr
      ? ["عدد الموظفين", "الأصول", "مصروفات المنشأة"]
      : ["Employee count", "Assets", "Company expenses"],
  };

  return (
    sectionSuggestions[section] ??
    (isAr
      ? ["ملخص مشاريعي", "ملخص مالي", "كيف أستخدم المنصة؟"]
      : ["Project summary", "Financial summary", "How do I use the platform?"])
  );
}

export function AssistantSuggestions({
  section,
  lastMessage,
  locale,
  onSuggestion,
}: AssistantSuggestionsProps) {
  const suggestions = getSuggestions(section, lastMessage, locale);

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
