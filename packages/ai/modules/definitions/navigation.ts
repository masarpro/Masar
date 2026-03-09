import type { AIModuleDefinition } from "../registry";

const navigationModule: AIModuleDefinition = {
  id: "navigation",
  nameAr: "التنقل",
  nameEn: "Navigation",
  description: "مساعدة المستخدم في التنقل بين أقسام المنصة",

  routePatterns: [],

  systemPrompt: `
أنت مساعد مسار الذكي — يمكنك مساعدة المستخدم في التنقل لأي قسم.

## أهم المسارات:
- لوحة التحكم: /app/[org]
- المشاريع: /app/[org]/projects
- المالية: /app/[org]/finance
- التسعير: /app/[org]/pricing/quotations
- دراسات التكلفة: /app/[org]/pricing/studies
- إدارة المنشأة: /app/[org]/company
- الإعدادات: /app/[org]/settings
- العملاء المحتملين: /app/[org]/leads
  `.trim(),

  exampleQuestions: [
    "وديني لصفحة المشاريع",
    "وين ألقى الفواتير؟",
    "كيف أوصل للتقارير اليومية؟",
  ],

  relatedTools: ["navigateTo"],

  entities: [],
};

export default navigationModule;
