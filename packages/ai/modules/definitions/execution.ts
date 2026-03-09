import type { AIModuleDefinition } from "../registry";

const executionModule: AIModuleDefinition = {
  id: "execution",
  nameAr: "التنفيذ والعمل الميداني",
  nameEn: "Execution & Field",
  description:
    "متابعة مراحل التنفيذ والأنشطة والتقارير اليومية والمشاكل الميدانية",

  routePatterns: [
    "^/[^/]+/projects/[^/]+/execution",
    "^/[^/]+/projects/[^/]+/field",
    "^/[^/]+/projects/[^/]+/field/.*",
    "^/[^/]+/projects/[^/]+/timeline",
  ],

  systemPrompt: `
أنت مساعد مسار الذكي — متخصص في التنفيذ والعمل الميداني.

## التنفيذ (Execution):
- مراحل التنفيذ (Milestones): كل مشروع فيه مراحل متتالية
- كل مرحلة لها: اسم، تواريخ، وزن (%)، تقدم (%)
- حالات المرحلة: PLANNED → IN_PROGRESS → COMPLETED | DELAYED | CANCELLED
- نسبة إنجاز المشروع = مجموع (وزن المرحلة × نسبة إنجازها)

## الأنشطة (Activities):
- حالات: NOT_STARTED → IN_PROGRESS → COMPLETED | DELAYED | ON_HOLD | CANCELLED
- كل نشاط: عنوان، مدة، تواريخ مخططة وفعلية، مسار حرج (isCritical)
- ارتباطات تتابعية (dependencies) بين الأنشطة

## العمل الميداني:
- التقارير اليومية: تاريخ، طقس، عمال، معدات، ملاحظات، صور
- المشاكل: درجات خطورة (LOW/MEDIUM/HIGH/CRITICAL)، حالات (OPEN→RESOLVED→CLOSED)
- تحديثات التقدم: نسب إنجاز مع ملاحظات

## كيف تساعد المستخدم:
- ساعده يتابع تقدم الأنشطة والمراحل
- حلل التأخيرات وأسبابها
- اشرح المسار الحرج
- ساعده يفهم صحة الجدول الزمني
  `.trim(),

  exampleQuestions: [
    "في أي مرحلة مشروع المدارس؟",
    "هل المشروع متأخر؟",
    "كم يوم تأخير في مشروع X؟",
    "وش الأنشطة المتأخرة؟",
    "متى موعد تسليم المشروع؟",
  ],

  relatedTools: [
    "queryExecution",
    "queryTimeline",
    "getProjectActivities",
    "getProjectMilestones",
    "getDelayAnalysis",
  ],

  entities: [
    {
      name: "ProjectMilestone",
      nameAr: "مرحلة",
      fields: [
        "title",
        "status",
        "progress",
        "plannedStart",
        "plannedEnd",
        "actualStart",
        "actualEnd",
      ],
    },
    {
      name: "ProjectActivity",
      nameAr: "نشاط",
      fields: [
        "title",
        "status",
        "progress",
        "duration",
        "isCritical",
        "plannedStart",
        "plannedEnd",
      ],
    },
    {
      name: "ProjectIssue",
      nameAr: "مشكلة",
      fields: ["title", "severity", "status", "assigneeId"],
    },
  ],
};

export default executionModule;
