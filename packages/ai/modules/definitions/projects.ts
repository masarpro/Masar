import type { AIModuleDefinition } from "../registry";

const projectsModule: AIModuleDefinition = {
  id: "projects",
  nameAr: "المشاريع",
  nameEn: "Projects",
  description:
    "إدارة المشاريع الإنشائية — إنشاء، متابعة، فريق، مستندات، تحليلات",

  routePatterns: [
    "^/[^/]+/projects$",
    "^/[^/]+/projects/new",
    "^/[^/]+/projects/templates",
    "^/[^/]+/projects/[^/]+$",
    "^/[^/]+/projects/[^/]+/overview",
    "^/[^/]+/projects/[^/]+/documents",
    "^/[^/]+/projects/[^/]+/chat",
    "^/[^/]+/projects/[^/]+/changes",
    "^/[^/]+/projects/[^/]+/team",
    "^/[^/]+/projects/[^/]+/insights",
  ],

  systemPrompt: `
أنت مساعد مسار الذكي — متخصص في قسم المشاريع.

## ما هو قسم المشاريع؟
المشاريع هي قلب المنصة — كل شيء يدور حولها.

## أنواع المشاريع:
- RESIDENTIAL (سكني) | COMMERCIAL (تجاري) | INDUSTRIAL (صناعي) | INFRASTRUCTURE (بنية تحتية) | MIXED (مختلط)

## حالات المشروع:
- ACTIVE (نشط) | COMPLETED (مكتمل) | ON_HOLD (متوقف) | ARCHIVED (مؤرشف)

## العمليات الرئيسية:
- إنشاء مشروع: يحتاج اسم، نوع، عميل، تواريخ، قيمة العقد
- عرض المشاريع: جدول مع فلترة حسب الحالة والبحث
- داشبورد المشروع: بطاقات KPI — التنفيذ، المالية، الجدول الزمني
- أقسام المشروع: نظرة عامة، تنفيذ، عمل ميداني، مالية، جدول زمني، مستندات، أوامر تغيير، محادثات، فريق، تحليلات، بوابة المالك

## أدوار المشروع:
- MANAGER (كل الصلاحيات) | ENGINEER (تنفيذ + فني) | SUPERVISOR (إشراف ميداني) | ACCOUNTANT (مالي) | VIEWER (قراءة فقط)

## كيف تساعد المستخدم:
- اشرح كيفية إنشاء المشاريع
- ساعده يتابع حالة مشاريعه (نشطة، متوقفة، مكتملة)
- اشرح أقسام المشروع المختلفة
- ساعده يضيف أعضاء للفريق
- وفر تفاصيل مالية وتنفيذية عن المشاريع
  `.trim(),

  exampleQuestions: [
    "كم مشروع نشط عندي؟",
    "كيف أنشئ مشروع جديد؟",
    "وش حالة مشروع فيلا الرياض؟",
    "كم قيمة عقد مشروع X؟",
    "أبي ملخص مالي لمشروع المدارس",
  ],

  relatedTools: [
    "queryProjects",
    "getProjectDetails",
    "getProjectFinanceSummary",
    "queryProjectBOQ",
    "queryHandover",
    "queryProjectChat",
  ],

  entities: [
    {
      name: "Project",
      nameAr: "مشروع",
      fields: [
        "name",
        "status",
        "type",
        "contractValue",
        "progress",
        "startDate",
        "endDate",
        "clientName",
      ],
    },
    {
      name: "ProjectMember",
      nameAr: "عضو مشروع",
      fields: ["userId", "role", "assignedAt"],
    },
  ],
};

export default projectsModule;
