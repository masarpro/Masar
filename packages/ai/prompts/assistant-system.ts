import {
  getCompanyKnowledge,
  getExecutionKnowledge,
  getFinanceKnowledge,
  getNavigationKnowledge,
  getOwnerPortalKnowledge,
  getProjectsKnowledge,
  getQuantitiesKnowledge,
  getSettingsKnowledge,
  getSubcontractsKnowledge,
} from "./modules";

export interface AssistantContext {
  userName: string;
  userRole: string;
  locale: string;

  organizationName: string;
  organizationSlug: string;
  organizationId: string;

  currentPage: string;
  currentSection: string;

  projectId?: string;
  projectName?: string;
  projectStatus?: string;
  projectProgress?: number;
  projectBudget?: number;

  contextData?: Record<string, unknown>;
}

export function buildSystemPrompt(context: AssistantContext): string {
  const identity = buildIdentity(context);

  const relevantModules = getRelevantModules(context.currentSection);
  const knowledge = relevantModules
    .map((mod) =>
      getModuleKnowledge(mod, context.locale, context.organizationSlug),
    )
    .join("\n\n");

  const dynamicContext = buildDynamicContext(context);
  const nav = getNavigationKnowledge(
    context.locale,
    context.organizationSlug,
  );
  const rules = buildRules(context);

  return `${identity}\n\n${knowledge}\n\n${dynamicContext}\n\n${nav}\n\n${rules}`;
}

export function getRelevantModules(section: string): string[] {
  const sectionModules: Record<string, string[]> = {
    dashboard: ["projects", "finance"],
    projects: ["projects", "execution"],
    "project-overview": ["projects", "execution"],
    "project-execution": ["execution"],
    "project-field": ["execution"],
    "project-finance": ["finance", "subcontracts"],
    "project-timeline": ["projects"],
    "project-documents": ["projects"],
    "project-changes": ["projects"],
    "project-chat": ["projects"],
    "project-team": ["projects"],
    "project-insights": ["projects"],
    "project-owner": ["owner-portal"],
    finance: ["finance"],
    quantities: ["quantities"],
    company: ["company"],
    settings: ["settings"],
    notifications: ["projects", "finance"],
    chatbot: ["projects", "finance"],
    leads: ["projects"],
    pricing: ["quantities", "finance"],
  };

  return sectionModules[section] ?? ["projects", "finance"];
}

function getModuleKnowledge(
  moduleName: string,
  locale: string,
  organizationSlug: string,
): string {
  const moduleMap: Record<string, (locale: string) => string> = {
    projects: getProjectsKnowledge,
    finance: getFinanceKnowledge,
    execution: getExecutionKnowledge,
    quantities: getQuantitiesKnowledge,
    company: getCompanyKnowledge,
    subcontracts: getSubcontractsKnowledge,
    settings: getSettingsKnowledge,
    "owner-portal": getOwnerPortalKnowledge,
  };

  const fn = moduleMap[moduleName];
  if (fn) return fn(locale);
  return "";
}

function buildIdentity(context: AssistantContext): string {
  return `# هويتك
أنت "مساعد مسار" — المساعد الذكي لمنصة مسار لإدارة مشاريع المقاولات في السعودية.

- اسمك: مساعد مسار
- لغتك الأساسية: العربية. إذا سألك المستخدم بالإنجليزية، جاوب بالإنجليزية
- شخصيتك: ودود، محترف، مختصر، عملي
- المستخدم الحالي: ${context.userName} — دوره: ${context.userRole}
- المنظمة: ${context.organizationName}
- العملة: ريال سعودي (ر.س / SAR)`;
}

function buildDynamicContext(context: AssistantContext): string {
  const sectionNames: Record<string, string> = {
    dashboard: "لوحة التحكم",
    projects: "المشاريع",
    "project-overview": "نظرة عامة على المشروع",
    "project-execution": "التنفيذ",
    "project-finance": "مالية المشروع",
    "project-timeline": "الجدول الزمني",
    "project-documents": "المستندات",
    "project-chat": "المحادثات",
    "project-field": "العمل الميداني",
    "project-changes": "أوامر التغيير",
    "project-team": "الفريق",
    "project-insights": "التحليلات",
    "project-owner": "بوابة المالك",
    finance: "المالية",
    quantities: "حصر الكميات",
    company: "إدارة المنشأة",
    settings: "الإعدادات",
    notifications: "الإشعارات",
    chatbot: "المحادثة الذكية",
    leads: "العملاء المحتملين",
    pricing: "التسعير",
  };

  let result = `## السياق الحالي
- الصفحة: ${sectionNames[context.currentSection] ?? "عام"}`;

  if (context.projectId && context.projectName) {
    result += `\n- المشروع: ${context.projectName}`;
    if (context.projectStatus) result += ` | الحالة: ${context.projectStatus}`;
    if (context.projectProgress != null)
      result += ` | الإنجاز: ${context.projectProgress}%`;
    if (context.projectBudget != null)
      result += ` | الميزانية: ${context.projectBudget.toLocaleString()} ر.س`;
  }

  if (context.contextData) {
    for (const [key, value] of Object.entries(context.contextData)) {
      result += `\n- ${key}: ${value}`;
    }
  }

  return result;
}

function buildRules(context: AssistantContext): string {
  return `## قواعد مهمة — التزم بها دائماً:
1. أجب بالعربية إلا إذا سألك بالإنجليزية
2. كن مختصراً ومباشراً — لا تكتب مقالات طويلة
3. إذا سأل عن كيفية عمل شيء، أعطه الخطوات بوضوح مع رابط الصفحة
4. لا تخترع بيانات — إذا ما تعرف أو ما عندك معلومات، قل ذلك بوضوح
5. أنت read-only — لا تقدر تعدل بيانات، فقط تقرأ وتجاوب
6. استخدم المصطلحات السعودية في البناء والمقاولات
7. عند اقتراح التنقل، استخدم المسار الكامل: /app/${context.organizationSlug}/...
8. إذا استخدمت أداة (tool) وفشلت أو رجعت فارغة، أخبر المستخدم بدلاً من الاختراع
9. الأرقام المالية: استخدم فاصلة للآلاف ونقطة للكسور (مثال: 1,500,000.00 ر.س)
10. لا تتحدث عن تفاصيل تقنية (API, database, endpoints) — المستخدم مقاول وليس مبرمج
11. استخدم تنسيق Markdown في ردودك: عناوين (###)، قوائم (-/1.)، **bold** للأرقام المهمة
12. الروابط: اكتبها بصيغة Markdown: [النص](/app/${context.organizationSlug}/path)`;
}
