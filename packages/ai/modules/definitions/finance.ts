import type { AIModuleDefinition } from "../registry";

const financeModule: AIModuleDefinition = {
  id: "finance",
  nameAr: "المالية",
  nameEn: "Finance",
  description:
    "إدارة الفواتير والمقبوضات والمصروفات والحسابات البنكية وعروض الأسعار والمحاسبة وسندات القبض والصرف",

  routePatterns: [
    "^/[^/]+/finance",
    "^/[^/]+/finance/.*",
    "^/[^/]+/pricing",
    "^/[^/]+/pricing/.*",
    "^/[^/]+/projects/[^/]+/finance$",
  ],

  systemPrompt: `
أنت مساعد مسار الذكي — متخصص في القسم المالي.

## ما هو القسم المالي؟
يدير كل شيء بعد توقيع العقد: فواتير، مقبوضات، مصروفات، حسابات بنكية، عملاء، تقارير.

## الفرق المهم: التسعير vs المالية
- "التسعير" (pricing): كل شيء قبل التعاقد — حصر كميات + عروض أسعار
- "المالية" (finance): كل شيء بعد التعاقد — فواتير، مدفوعات، مصروفات

## الأقسام:
- الفواتير: DRAFT → SENT → VIEWED → PARTIALLY_PAID → PAID أو OVERDUE/CANCELLED
- المقبوضات: سجل كل دفعة مستلمة
- المصروفات: 26 فئة (مواد، عمالة، معدات، نقل، إيجار...)
- الحسابات البنكية: BANK/CASH/DIGITAL مع أرصدة
- العملاء: بيانات شاملة مع رقم ضريبي
- عروض الأسعار: DRAFT → SENT → VIEWED → ACCEPTED/REJECTED/EXPIRED
- التقارير المالية: إحصائيات وتقارير حسب الفترة

## كيف تساعد المستخدم:
- اشرح كيفية إنشاء فواتير وعروض أسعار
- ساعده يتابع المصروفات والمقبوضات
- اشرح أرصدة الحسابات البنكية
- ساعده يفهم التقارير المالية
  `.trim(),

  exampleQuestions: [
    "كم فاتورة متأخرة عندي؟",
    "كيف أنشئ فاتورة جديدة؟",
    "وش رصيد حساباتي البنكية؟",
    "كيف أحول عرض سعر لفاتورة؟",
    "هل يوجد عرض سعر لشركة الراجحي؟",
  ],

  relatedTools: [
    "queryFinance",
    "queryInvoices",
    "queryZatcaStatus",
    "queryQuotations",
    "getQuotationDetails",
    "getQuotationsSummary",
    "queryAccounting",
    "getAccountingReports",
    "queryVouchers",
  ],

  entities: [
    {
      name: "Invoice",
      nameAr: "فاتورة",
      fields: [
        "invoiceNo",
        "clientName",
        "totalAmount",
        "paidAmount",
        "status",
        "dueDate",
      ],
    },
    {
      name: "Quotation",
      nameAr: "عرض سعر",
      fields: [
        "quotationNo",
        "clientName",
        "totalAmount",
        "status",
        "validUntil",
      ],
    },
    {
      name: "ChartAccount",
      nameAr: "حساب",
      fields: ["code", "nameAr", "type"],
    },
  ],
};

export default financeModule;
