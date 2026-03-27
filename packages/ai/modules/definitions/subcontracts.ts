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

  relatedTools: ["querySubcontracts", "getSubcontractDetails"],

  entities: [
    {
      name: "SubcontractContract",
      nameAr: "عقد باطن",
      fields: ["contractNo", "contractorName", "value", "status"],
    },
    {
      name: "SubcontractPayment",
      nameAr: "دفعة مقاول",
      fields: ["paymentNo", "amount", "date", "paymentMethod"],
    },
    {
      name: "SubcontractClaim",
      nameAr: "مطالبة مقاول",
      fields: ["claimNo", "amount", "status", "periodStart", "periodEnd"],
    },
  ],
};

export default subcontractsModule;
