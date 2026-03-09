import type { AIModuleDefinition } from "../registry";

const subcontractsModule: AIModuleDefinition = {
  id: "subcontracts",
  nameAr: "عقود الباطن",
  nameEn: "Subcontracts",
  description: "إدارة عقود مقاولي الباطن ودفعاتهم وأوامر التغيير",

  routePatterns: [
    "^/[^/]+/projects/[^/]+/finance/subcontracts",
  ],

  systemPrompt: `
أنت مساعد مسار الذكي — متخصص في عقود الباطن.

## عقود الباطن:
- إنشاء عقد: رقم تلقائي، اسم المقاول، وصف، قيمة، تواريخ
- حالات: DRAFT → ACTIVE → COMPLETED أو TERMINATED أو SUSPENDED
- شروط الدفع: جدول دفعات العقد
- أوامر تغيير: زيادة أو نقص قيمة العقد
- دفعات المقاول = مصروفات مشروع (وليست مصروفات منظمة)
  `.trim(),

  exampleQuestions: [
    "كيف أنشئ عقد باطن؟",
    "كم دفعنا لمقاول الباطن؟",
    "كيف أضيف أمر تغيير على عقد باطن؟",
  ],

  relatedTools: ["queryCompany"],

  entities: [
    {
      name: "SubcontractContract",
      nameAr: "عقد باطن",
      fields: ["contractNo", "contractorName", "value", "status"],
    },
  ],
};

export default subcontractsModule;
