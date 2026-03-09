"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  usePageContextStore,
  type PageContext,
} from "../hooks/use-page-context";

interface PageContextProviderProps {
  children: React.ReactNode;
  moduleId: string;
  pageName: string;
  pageNameAr: string;
  pageDescription: string;
  visibleData?: Record<string, any>;
  activeFilters?: Record<string, any>;
  itemCount?: number;
  visibleStats?: Record<string, string | number>;
  tableColumns?: string[];
  formState?: PageContext["formState"];
}

export function PageContextProvider({
  children,
  moduleId,
  pageName,
  pageNameAr,
  pageDescription,
  visibleData = {},
  activeFilters = {},
  itemCount,
  visibleStats,
  tableColumns,
  formState,
}: PageContextProviderProps) {
  const pathname = usePathname();
  const { setContext, clearContext } = usePageContextStore();

  useEffect(() => {
    setContext({
      pageName,
      pageNameAr,
      moduleId,
      currentRoute: pathname,
      pageDescription,
      visibleData: sanitizeForAI(visibleData),
      activeFilters,
      itemCount,
      visibleStats,
      tableColumns,
      formState,
    });

    return () => clearContext();
  }, [
    pathname,
    pageName,
    moduleId,
    JSON.stringify(visibleStats),
    JSON.stringify(activeFilters),
    itemCount,
  ]);

  return <>{children}</>;
}

/**
 * تنظيف البيانات قبل إرسالها للـ AI
 * - حذف الحقول الحساسة
 * - تقليص البيانات الكبيرة (أول 5 عناصر + العدد الكلي)
 * - تحويل Decimal لـ string
 */
function sanitizeForAI(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // تخطي الحقول الحساسة
    if (
      ["password", "token", "secret", "apiKey"].some((s) =>
        key.toLowerCase().includes(s),
      )
    ) {
      continue;
    }

    // تقليص المصفوفات الكبيرة
    if (Array.isArray(value) && value.length > 5) {
      sanitized[key] = {
        _summary: true,
        first5: value.slice(0, 5),
        totalCount: value.length,
      };
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
