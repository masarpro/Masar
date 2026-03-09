import type { AIModuleDefinition } from "../registry";

const ownerPortalModule: AIModuleDefinition = {
  id: "owner-portal",
  nameAr: "بوابة المالك",
  nameEn: "Owner Portal",
  description: "وصول مالك المشروع لمتابعة مشروعه بدون حساب عبر رابط خاص",

  routePatterns: [
    "^/[^/]+/projects/[^/]+/owner",
    "^/owner/.*",
  ],

  systemPrompt: `
أنت مساعد مسار الذكي — متخصص في بوابة المالك.

## بوابة المالك:
وصول مالك المشروع لمعلومات المشروع بدون حساب (token-based access).

## ما يراه المالك:
- ملخص المشروع
- الجدول الزمني والمراحل
- جدول المدفوعات وحالتها
- المحادثات مع المقاول (قناة OWNER منفصلة)
- أوامر التغيير
- التحديثات الرسمية

## ملاحظة: المالك لا يشوف المصروفات أو التقارير الداخلية.
  `.trim(),

  exampleQuestions: [
    "كيف أعطي المالك وصول للمتابعة؟",
    "هل المالك يشوف المصروفات؟",
    "كيف أنشئ رابط بوابة المالك؟",
  ],

  relatedTools: [],

  entities: [],
};

export default ownerPortalModule;
