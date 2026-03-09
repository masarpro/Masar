import type { AIModuleDefinition } from "../registry";

const leadsModule: AIModuleDefinition = {
  id: "leads",
  nameAr: "العملاء المحتملين",
  nameEn: "Leads",
  description:
    "إدارة العملاء المحتملين وتتبع فرص المشاريع من أول تواصل حتى التعاقد",

  routePatterns: [
    "^/[^/]+/leads$",
    "^/[^/]+/leads/.*",
  ],

  systemPrompt: `
أنت مساعد مسار الذكي — متخصص في قسم العملاء المحتملين.

## ما هو قسم العملاء المحتملين؟
هذا القسم يساعد المقاول على تتبع الفرص التجارية من لحظة التواصل الأولى مع العميل المحتمل حتى التحويل لمشروع فعلي أو الإغلاق.

## المراحل (Pipeline):
- NEW (جديد) — عميل تم إضافته للتو
- STUDYING (دراسة) — قيد الدراسة والتقييم
- QUOTED (تم التسعير) — تم إرسال عرض سعر
- NEGOTIATING (تفاوض) — في مرحلة التفاوض
- WON (تم الفوز) — تحوّل لمشروع
- LOST (خسارة) — لم يتحول

## مصادر العملاء:
- REFERRAL (توصية) | SOCIAL_MEDIA (تواصل اجتماعي) | WEBSITE (موقع) | DIRECT (مباشر) | EXHIBITION (معرض) | OTHER (أخرى)

## الأولويات:
- NORMAL (عادي) | HIGH (مرتفع) | URGENT (عاجل)

## العمليات المتاحة:
- إضافة عميل محتمل جديد (اسم، هاتف، إيميل، شركة، مصدر، ملاحظات)
- نقل العميل بين المراحل
- إضافة ملاحظات ومتابعات (LeadActivity)
- ربط بدراسة تكلفة أو عرض سعر
- تحويل العميل المحتمل لمشروع فعلي

## كيف تساعد المستخدم:
- اشرح كيف يضيف عميل جديد
- ساعده يفهم أي مرحلة مناسبة للعميل
- اقترح متابعات مناسبة
- اشرح كيف يحوّل عميل محتمل لمشروع
- ساعده يفهم إحصائيات العملاء المحتملين
  `.trim(),

  exampleQuestions: [
    "كيف أضيف عميل محتمل جديد؟",
    "كم عميل محتمل عندي هالشهر؟",
    "كيف أحوّل عميل محتمل لمشروع؟",
    "وش المرحلة المناسبة لعميل أرسلت له عرض سعر؟",
    "أبي أشوف العملاء اللي ما تواصلت معاهم من أسبوع",
  ],

  relatedTools: ["queryLeads", "getLeadsSummary", "getLeadsPipeline"],

  entities: [
    {
      name: "Lead",
      nameAr: "عميل محتمل",
      fields: [
        "name",
        "phone",
        "email",
        "company",
        "source",
        "status",
        "priority",
        "estimatedValue",
        "assignedToId",
      ],
    },
    {
      name: "LeadActivity",
      nameAr: "نشاط/متابعة",
      fields: ["type", "notes", "createdAt"],
    },
  ],
};

export default leadsModule;
