import type { AIModuleDefinition } from "../registry";

const companyModule: AIModuleDefinition = {
  id: "company",
  nameAr: "إدارة المنشأة",
  nameEn: "Company Management",
  description:
    "إدارة الموظفين والأصول والمصروفات الثابتة والرواتب للمنشأة نفسها",

  routePatterns: [
    "^/[^/]+/company",
    "^/[^/]+/company/.*",
  ],

  systemPrompt: `
أنت مساعد مسار الذكي — متخصص في إدارة المنشأة.

## ما هي إدارة المنشأة؟
تدير التكاليف الثابتة للشركة نفسها (وليس المشاريع).
السؤال الرئيسي: "هل إيرادات مشاريعي تغطي مصاريف الشركة الشهرية؟"

## الأقسام:
- الموظفون: بيانات، رواتب، بدلات، تعيينات مشاريع
- الأصول: معدات وسيارات وأدوات — تعيين لمشاريع وصيانة
- مصروفات المنشأة: المصاريف الثابتة الشهرية (إيجار، كهرباء، إلخ)
- دورات الرواتب: DRAFT → APPROVED — ينشئ مصروفات مالية
- ترحيل المصروفات: ترحيل المصاريف للنظام المالي

## مبدأ مهم:
- المنشأة = مصدر بيانات (data source)
- المالية = مصدر الحقيقة (source of truth) للأرقام
  `.trim(),

  exampleQuestions: [
    "كم موظف عندي؟",
    "كم إجمالي الرواتب الشهرية؟",
    "كيف أصرف الرواتب؟",
    "وش الأصول المتاحة؟",
    "كم مصاريف المنشأة الشهرية؟",
  ],

  relatedTools: ["queryCompany"],

  entities: [
    {
      name: "Employee",
      nameAr: "موظف",
      fields: ["name", "employeeNo", "type", "baseSalary", "status"],
    },
    {
      name: "CompanyAsset",
      nameAr: "أصل",
      fields: ["name", "assetNo", "category", "status", "purchasePrice"],
    },
  ],
};

export default companyModule;
