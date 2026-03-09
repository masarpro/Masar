import type { AIModuleDefinition } from "../registry";

const quantitiesModule: AIModuleDefinition = {
  id: "quantities",
  nameAr: "حصر الكميات والتسعير",
  nameEn: "Quantities & Pricing",
  description:
    "دراسات التكلفة وحصر الكميات — إنشائي وتشطيبات وكهروميكانيكا وعمالة",

  routePatterns: [
    "^/[^/]+/quantities",
    "^/[^/]+/quantities/.*",
    "^/[^/]+/pricing/studies",
    "^/[^/]+/pricing/studies/.*",
  ],

  systemPrompt: `
أنت مساعد مسار الذكي — متخصص في حصر الكميات ودراسات التكلفة.

## دراسات التكلفة (Cost Studies):
تحليل تكاليف المشروع قبل التعاقد.

## 4 أنواع بنود:
1. إنشائي (Structural): أساسات، أعمدة، بلاطات — كميات خرسانة وحديد
2. تشطيبات (Finishing): أرضيات، دهانات، سيراميك — حسب الغرفة والمساحة
3. MEP (كهرباء وميكانيكا وسباكة): كهرباء، صحي، تكييف، حريق
4. عمالة (Labor): نوع العامل، العدد، الأجرة اليومية، المدة

## بيانات الدراسة:
- اسم الدراسة، العميل، نوع المشروع
- مساحة الأرض، مساحة البناء، عدد الأدوار
- نسب: أعباء إدارية، ربح، طوارئ، ضريبة

## عروض الأسعار (Quotes):
- تُنشأ من دراسة التكلفة
- رقم عرض فريد، بيانات العميل، الشروط
- إجمالي مع أعباء وربح وضريبة

## كيف تساعد المستخدم:
- ساعده يعرف كميات المواد (كم طن حديد، كم متر مكعب خرسانة)
- اشرح تفاصيل البنود والتكاليف
- قارن بين الدراسات
- ساعده يبحث في مادة محددة عبر كل الدراسات
  `.trim(),

  exampleQuestions: [
    "كم طن حديد يحتاج مشروع فيلا الرياض؟",
    "كم تكلفة البلاط في دراسة التكلفة؟",
    "وش أغلى بند في المشروع؟",
    "كم دراسة تكلفة عندي؟",
    "أبي أقارن تكلفة الخرسانة بين دراستين",
  ],

  relatedTools: ["queryCostStudies", "getCostStudyDetails", "searchMaterials"],

  entities: [
    {
      name: "CostStudy",
      nameAr: "دراسة تكلفة",
      fields: [
        "name",
        "customerName",
        "projectType",
        "landArea",
        "buildingArea",
        "numberOfFloors",
        "totalCost",
      ],
    },
    {
      name: "StructuralItem",
      nameAr: "بند إنشائي",
      fields: [
        "category",
        "name",
        "quantity",
        "unit",
        "materialCost",
        "laborCost",
        "totalCost",
      ],
    },
    {
      name: "FinishingItem",
      nameAr: "بند تشطيب",
      fields: [
        "category",
        "name",
        "floorName",
        "area",
        "materialPrice",
        "laborPrice",
        "totalCost",
      ],
    },
    {
      name: "MEPItem",
      nameAr: "بند كهروميكانيكا",
      fields: [
        "system",
        "description",
        "quantity",
        "unit",
        "materialCost",
        "laborCost",
        "totalCost",
      ],
    },
    {
      name: "LaborItem",
      nameAr: "بند عمالة",
      fields: [
        "name",
        "workerType",
        "quantity",
        "dailyRate",
        "durationDays",
        "totalCost",
      ],
    },
  ],
};

export default quantitiesModule;
