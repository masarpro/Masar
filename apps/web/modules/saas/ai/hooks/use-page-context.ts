/**
 * Hook يجمع سياق الصفحة الحالية لإرساله مع رسائل AI
 *
 * كل صفحة تقدر تسجّل سياقها عبر PageContextProvider
 * المساعد يستقبل هذا السياق تلقائياً مع كل رسالة
 */

import { create } from "zustand";

export interface PageContext {
  /** اسم الصفحة الحالية */
  pageName: string;

  /** اسم الصفحة بالعربي */
  pageNameAr: string;

  /** معرّف الـ module */
  moduleId: string;

  /** الـ route الحالي */
  currentRoute: string;

  /** وصف مختصر لما يراه المستخدم */
  pageDescription: string;

  /** البيانات الرئيسية المعروضة حالياً */
  visibleData: Record<string, any>;

  /** الفلاتر المطبقة حالياً */
  activeFilters: Record<string, any>;

  /** عدد العناصر المعروضة */
  itemCount?: number;

  /** أي إحصائيات مرئية في الصفحة */
  visibleStats?: Record<string, string | number>;

  /** الأعمدة المعروضة في الجدول (إن وجد) */
  tableColumns?: string[];

  /** حالة النموذج (إن كان مفتوح) */
  formState?: {
    isOpen: boolean;
    formType: "create" | "edit" | "view";
    entityName: string;
    currentValues?: Record<string, any>;
  };
}

interface PageContextStore {
  context: PageContext | null;
  setContext: (context: PageContext) => void;
  updateContext: (partial: Partial<PageContext>) => void;
  clearContext: () => void;
}

export const usePageContextStore = create<PageContextStore>((set) => ({
  context: null,
  setContext: (context) => set({ context }),
  updateContext: (partial) =>
    set((state) => ({
      context: state.context ? { ...state.context, ...partial } : null,
    })),
  clearContext: () => set({ context: null }),
}));
