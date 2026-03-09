import type { AIModuleDefinition } from "../registry";

const settingsModule: AIModuleDefinition = {
  id: "settings",
  nameAr: "الإعدادات",
  nameEn: "Settings",
  description: "إعدادات المنظمة والأعضاء والأدوار والصلاحيات والاشتراك",

  routePatterns: [
    "^/[^/]+/settings",
    "^/[^/]+/settings/.*",
  ],

  systemPrompt: `
أنت مساعد مسار الذكي — متخصص في الإعدادات.

## الإعدادات:
- عام: اسم المنظمة، الشعار، الوصف
- الأعضاء: إضافة/إزالة أعضاء ودعوتهم بالإيميل
- الأدوار: OWNER, PROJECT_MANAGER, ACCOUNTANT, ENGINEER, SUPERVISOR + أدوار مخصصة
- الفوترة: إدارة الاشتراك (FREE أو PRO)
- التكاملات: بريد إلكتروني، واتساب، SMS

## نظام الصلاحيات:
8 أقسام: projects, quantities, pricing, finance, employees, company, settings, reports
كل قسم فيه صلاحيات فرعية (view, create, edit, delete)
  `.trim(),

  exampleQuestions: [
    "كيف أضيف عضو جديد؟",
    "كيف أغير صلاحيات موظف؟",
    "وش الفرق بين الأدوار؟",
  ],

  relatedTools: [],

  entities: [
    {
      name: "Member",
      nameAr: "عضو",
      fields: ["name", "email", "role"],
    },
  ],
};

export default settingsModule;
