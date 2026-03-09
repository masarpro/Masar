/**
 * AI Module Registry
 * كل ملف في مجلد definitions/ يُسجّل تلقائياً كوحدة معرفية
 */

export interface AIModuleDefinition {
  /** معرّف فريد للوحدة — يطابق route segment */
  id: string;

  /** الاسم بالعربي */
  nameAr: string;

  /** الاسم بالإنجليزي */
  nameEn: string;

  /** وصف مختصر لما يفعله القسم */
  description: string;

  /** الـ route patterns التي تنتمي لهذا القسم */
  routePatterns: string[];

  /** System prompt المخصص لهذا القسم */
  systemPrompt: string;

  /** أمثلة أسئلة يمكن للمستخدم طرحها */
  exampleQuestions: string[];

  /** أسماء الـ tools المرتبطة بهذا القسم */
  relatedTools: string[];

  /** الكيانات (entities) الرئيسية في هذا القسم */
  entities: {
    name: string;
    nameAr: string;
    fields: string[];
  }[];
}

import * as allModules from "./definitions";

/** جلب كل الوحدات المسجّلة */
export function getAllModules(): AIModuleDefinition[] {
  return Object.values(allModules);
}

/** جلب الوحدة المطابقة لـ route معيّن */
export function getModuleByRoute(
  pathname: string,
): AIModuleDefinition | undefined {
  return getAllModules().find((mod) =>
    mod.routePatterns.some((pattern) => {
      const regex = new RegExp(pattern);
      return regex.test(pathname);
    }),
  );
}

/** جلب الوحدة بالمعرّف */
export function getModuleById(id: string): AIModuleDefinition | undefined {
  return getAllModules().find((mod) => mod.id === id);
}
