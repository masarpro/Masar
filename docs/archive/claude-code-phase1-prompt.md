# برومبت المرحلة الأولى — إعادة هيكلة قسم التسعير (مسار)

أنت تعمل على مشروع مسار — نظام إدارة مشاريع مقاولات. المشروع مبني بـ Next.js App Router + ORPC + Prisma + PostgreSQL + TypeScript + Tailwind CSS + shadcn/ui.

## السياق والهدف

نحن نعيد هيكلة قسم التسعير ودراسات الكميات. الهدف من المرحلة الأولى هو **الفصل الأساسي** — تحويل الدراسة من 5 مراحل متداخلة إلى 6 مراحل مستقلة بنقاط دخول متعددة.

**البنية الحالية للمشروع:**
```
apps/web/modules/saas/pricing/              → Frontend
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/  → Pages
packages/api/modules/quantities/            → Backend (studies API)
packages/api/modules/pricing/               → Backend (pricing/leads API)
packages/api/modules/finance/               → Backend (quotations API)
packages/database/prisma/schema.prisma      → Database schema
```

**اقرأ هذه الملفات أولاً قبل أي تعديل لتفهم البنية الحالية:**
1. `packages/database/prisma/schema.prisma` — ابحث عن model CostStudy (سطر ~1202) و StructuralItem و FinishingItem و MEPItem و StageStatus enum
2. `apps/web/modules/saas/pricing/components/shell/constants.ts` — ثوابت التنقل
3. `apps/web/modules/saas/pricing/components/shell/PricingNavigation.tsx` — شريط التنقل
4. `apps/web/modules/saas/pricing/components/studies/StudyPipelineStepper.tsx` — شريط المراحل الحالي (5 مراحل)
5. `apps/web/modules/saas/pricing/components/studies/CreateCostStudyForm.tsx` — نموذج إنشاء دراسة
6. `packages/api/modules/quantities/procedures/stages.ts` — إجراءات المراحل (approve/reopen/assign)
7. `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/new/page.tsx`
8. `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[studyId]/page.tsx`

---

## المهام المطلوبة (4 مهام)

---

### المهمة 1: إنشاء جدول StudyStage في قاعدة البيانات

**الملف:** `packages/database/prisma/schema.prisma`

**أ) أضف enum جديد `StageType`:**
```prisma
enum StageType {
  QUANTITIES
  SPECIFICATIONS
  COSTING
  PRICING
  QUOTATION
  CONVERSION
}
```

**ب) أضف enum جديد `StudyEntryPoint`:**
```prisma
enum StudyEntryPoint {
  FROM_SCRATCH        // دراسة كاملة من الصفر
  HAS_QUANTITIES      // لديه كميات جاهزة — يبدأ من المواصفات
  HAS_SPECS           // لديه كميات ومواصفات — يبدأ من التكلفة
  QUOTATION_ONLY      // يريد عرض سعر فقط
  LUMP_SUM_ANALYSIS   // تحليل مقطوعية
  CUSTOM_ITEMS        // بنود مخصصة (بند أو بندين)
}
```

**ج) أضف model `StudyStage`:**
```prisma
model StudyStage {
  id            String      @id @default(cuid())
  costStudyId   String
  costStudy     CostStudy   @relation(fields: [costStudyId], references: [id], onDelete: Cascade)
  stage         StageType
  status        StageStatus @default(NOT_STARTED)
  assigneeId    String?
  assignee      User?       @relation("StageAssignee", fields: [assigneeId], references: [id])
  approvedById  String?
  approvedBy    User?       @relation("StageApprover", fields: [approvedById], references: [id])
  approvedAt    DateTime?
  notes         String?
  sortOrder     Int         @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([costStudyId, stage])
  @@index([costStudyId])
  @@map("study_stages")
}
```

**د) عدّل model CostStudy — أضف هذه الحقول:**
```prisma
// في model CostStudy أضف:
  entryPoint    StudyEntryPoint  @default(FROM_SCRATCH)
  stages        StudyStage[]
```

**لا تحذف** الحقول القديمة (quantitiesStatus, specsStatus, costingStatus, pricingStatus, quotationStatus, quantitiesAssigneeId, specsAssigneeId, costingAssigneeId, pricingAssigneeId) — اتركها مؤقتاً للتوافق مع الكود الحالي. سنحذفها في مرحلة لاحقة.

**هـ) أضف العلاقات في model User:**
ابحث عن model User وأضف:
```prisma
  stageAssignments  StudyStage[]  @relation("StageAssignee")
  stageApprovals    StudyStage[]  @relation("StageApprover")
```

**و) أنشئ migration:**
```bash
cd packages/database
npx prisma migrate dev --name add-study-stages
```

**ز) أنشئ ملف seed/migration script لترحيل البيانات الحالية:**
أنشئ ملف `packages/database/prisma/migrations/seed-study-stages.ts` يقوم بما يلي:
- لكل CostStudy موجودة، أنشئ 6 سجلات StudyStage
- انسخ الحالات من الحقول القديمة:
  - quantitiesStatus → StudyStage(QUANTITIES).status
  - specsStatus → StudyStage(SPECIFICATIONS).status
  - costingStatus → StudyStage(COSTING).status
  - pricingStatus → StudyStage(PRICING).status
  - quotationStatus → StudyStage(QUOTATION).status
  - CONVERSION يبدأ NOT_STARTED
- انسخ المسؤولين:
  - quantitiesAssigneeId → StudyStage(QUANTITIES).assigneeId
  - specsAssigneeId → StudyStage(SPECIFICATIONS).assigneeId
  - costingAssigneeId → StudyStage(COSTING).assigneeId
  - pricingAssigneeId → StudyStage(PRICING).assigneeId
- حدد sortOrder: QUANTITIES=1, SPECIFICATIONS=2, COSTING=3, PRICING=4, QUOTATION=5, CONVERSION=6

---

### المهمة 2: تعديل شريط المراحل من 5 إلى 6 مراحل

**الملف:** `apps/web/modules/saas/pricing/components/studies/StudyPipelineStepper.tsx`

**المراحل الحالية (5):**
```
① الكميات → ② المواصفات → ③ تسعير التكلفة → ④ التسعير → ⑤ عرض السعر
```

**المراحل الجديدة (6):**
```
① الكميات → ② المواصفات → ③ تسعير التكلفة → ④ التسعير (البيع) → ⑤ عرض السعر → ⑥ التحويل لمشروع
```

**التعديلات المطلوبة:**

أ) عدّل مصفوفة المراحل لتشمل 6 مراحل:
```typescript
const PIPELINE_STAGES = [
  {
    key: "QUANTITIES" as const,
    label: "الكميات",
    labelEn: "Quantities",
    icon: Calculator, // من lucide-react
    path: "quantities",
    description: "حساب كميات المشروع",
  },
  {
    key: "SPECIFICATIONS" as const,
    label: "المواصفات",
    labelEn: "Specifications",
    icon: ClipboardList,
    path: "specifications",
    description: "تحديد المواصفات لكل بند",
  },
  {
    key: "COSTING" as const,
    label: "تسعير التكلفة",
    labelEn: "Costing",
    icon: Receipt,
    path: "costing",
    description: "تحديد تكلفة المواد والمصنعيات",
  },
  {
    key: "PRICING" as const,
    label: "التسعير",
    labelEn: "Pricing",
    icon: DollarSign,
    path: "pricing",
    description: "تحديد سعر البيع وهامش الربح",
  },
  {
    key: "QUOTATION" as const,
    label: "عرض السعر",
    labelEn: "Quotation",
    icon: FileText,
    path: "quotation",
    description: "إصدار عرض السعر",
  },
  {
    key: "CONVERSION" as const,
    label: "مشروع",
    labelEn: "Project",
    icon: FolderKanban,
    path: "convert",
    description: "التحويل لمشروع تنفيذي",
  },
] as const;
```

ب) حالة كل مرحلة تأتي من جدول StudyStage الجديد. عدّل الكومبوننت ليقبل:
```typescript
interface StudyPipelineStepperProps {
  studyId: string;
  stages: Array<{
    stage: StageType;
    status: StageStatus;
    assigneeId?: string | null;
  }>;
  entryPoint: StudyEntryPoint;
  currentStage?: StageType;
}
```

ج) المراحل التي تسبق نقطة الدخول تظهر مع أيقونة "تخطي" (skip). مثلاً إذا entryPoint = HAS_QUANTITIES فمرحلة الكميات تظهر كـ "تم تخطيها" بلون رمادي وأيقونة skip.

د) الألوان حسب الحالة:
- NOT_STARTED: رمادي فاتح مع أيقونة دائرة فارغة
- DRAFT: أزرق فاتح مع أيقونة قلم
- IN_REVIEW: أصفر/برتقالي مع أيقونة ساعة
- APPROVED: أخضر مع أيقونة ✓
- SKIPPED (للمراحل قبل نقطة الدخول): رمادي مع أيقونة →

هـ) تصميم الشريط: أفقي (horizontal stepper) مع خط يربط المراحل. استخدم Tailwind فقط. يجب أن يكون responsive — على الموبايل يتحول لقائمة عمودية مضغوطة.

---

### المهمة 3: إنشاء صفحة اختيار نقطة الدخول عند إنشاء دراسة جديدة

**عدّل الملف:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/new/page.tsx`
**وعدّل:** `apps/web/modules/saas/pricing/components/studies/CreateCostStudyForm.tsx`

**التصميم المطلوب:**

الصفحة تتكون من جزئين:

**الجزء الأول — بيانات الدراسة الأساسية (يظهر دائماً):**
- اسم الدراسة (نص)
- اسم العميل (نص — اختياري)
- نوع المشروع (select: سكني، تجاري، صناعي، حكومي، أخرى)
- المساحة (رقم — م²)
- عدد الأدوار (رقم)

**الجزء الثاني — اختيار نقطة الدخول (بطاقات):**

صمم 6 بطاقات (cards) بتخطيط grid (3 أعمدة على الديسكتوب، 2 على التابلت، 1 على الموبايل):

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ 🏗️                  │  │ 📋                  │  │ 💰                  │
│ دراسة كاملة         │  │ لديّ كميات جاهزة     │  │ لديّ كميات ومواصفات  │
│ من الصفر            │  │                     │  │                     │
│                     │  │ أريد تحديد مواصفات  │  │ أريد التسعير فقط    │
│ حساب الكميات        │  │ وتسعير              │  │                     │
│ والمواصفات والتسعير │  │                     │  │                     │
│                     │  │ تبدأ من: المواصفات   │  │ تبدأ من: التكلفة    │
│ تبدأ من: الكميات    │  │                     │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ 📄                  │  │ 🔍                  │  │ ⚡                  │
│ إصدار عرض سعر      │  │ تحليل مقطوعية      │  │ بنود مخصصة         │
│                     │  │                     │  │                     │
│ كل شيء جاهز أريد   │  │ لديّ عقد بمبلغ      │  │ بند واحد أو عدة    │
│ عرض سعر فقط        │  │ إجمالي أريد تحليله  │  │ بنود فقط           │
│                     │  │                     │  │                     │
│ تبدأ من: عرض السعر  │  │ مسار تحليل خاص     │  │ مسار مبسّط          │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

**سلوك البطاقات:**
- البطاقة المختارة تحصل على border أزرق (border-primary) وخلفية فاتحة
- كل بطاقة تحتوي على أيقونة كبيرة، عنوان، وصف قصير، وتوضيح من أين تبدأ
- البطاقة الافتراضية المختارة: "دراسة كاملة من الصفر"

**عند الضغط على "إنشاء الدراسة":**
1. يُنشأ CostStudy مع الحقل الجديد `entryPoint`
2. تُنشأ 6 سجلات StudyStage تلقائياً
3. المراحل التي تسبق نقطة الدخول تحصل على status = APPROVED (تلقائياً)
4. مرحلة نقطة الدخول تحصل على status = DRAFT
5. باقي المراحل تبقى NOT_STARTED
6. يتم التوجيه (redirect) إلى صفحة الدراسة

**مثال:** إذا اختار "لديّ كميات جاهزة" (HAS_QUANTITIES):
- QUANTITIES → APPROVED (تخطّى)
- SPECIFICATIONS → DRAFT (يبدأ هنا)
- COSTING → NOT_STARTED
- PRICING → NOT_STARTED
- QUOTATION → NOT_STARTED
- CONVERSION → NOT_STARTED

**التعديلات في الـ Backend:**

عدّل إجراء الإنشاء في `packages/api/modules/quantities/procedures/create.ts`:
- أضف حقل `entryPoint` في الـ input schema (مع default: FROM_SCRATCH)
- بعد إنشاء CostStudy، أنشئ 6 سجلات StudyStage بالمنطق أعلاه
- استخدم `prisma.$transaction` لضمان الإنشاء الذري

---

### المهمة 4: تعديل شريط التنقل الجانبي والمسارات

**الملفات:**
- `apps/web/modules/saas/pricing/components/shell/constants.ts`
- `apps/web/modules/saas/pricing/components/shell/PricingNavigation.tsx`
- `apps/web/modules/saas/pricing/components/studies/StudyPageShell.tsx`

**أ) عدّل ثوابت التنقل في constants.ts:**

عند فتح دراسة معينة، التنقل الجانبي يتغير ليعرض مراحل الدراسة:

```typescript
export const STUDY_NAV_ITEMS = [
  { id: "overview",       label: "نظرة عامة",     labelEn: "Overview",       path: "",               icon: LayoutDashboard },
  { id: "quantities",     label: "الكميات",        labelEn: "Quantities",     path: "quantities",     icon: Calculator,      stage: "QUANTITIES" },
  { id: "specifications", label: "المواصفات",      labelEn: "Specifications", path: "specifications", icon: ClipboardList,   stage: "SPECIFICATIONS" },
  { id: "costing",        label: "تسعير التكلفة",   labelEn: "Costing",        path: "costing",        icon: Receipt,         stage: "COSTING" },
  { id: "pricing",        label: "التسعير",         labelEn: "Pricing",        path: "pricing",        icon: DollarSign,      stage: "PRICING" },
  { id: "quotation",      label: "عرض السعر",       labelEn: "Quotation",      path: "quotation",      icon: FileText,        stage: "QUOTATION" },
  { id: "convert",        label: "تحويل لمشروع",   labelEn: "Convert",        path: "convert",        icon: FolderKanban,    stage: "CONVERSION" },
] as const;
```

**ب) عدّل PricingNavigation.tsx:**

عندما يكون المستخدم داخل دراسة (URL يحتوي `/studies/[studyId]`)، أظهر قائمة التنقل الخاصة بالدراسة مع حالة كل مرحلة:

- كل عنصر في القائمة يعرض أيقونة حالة صغيرة بجانبه:
  - ✅ أخضر = APPROVED
  - 🔵 أزرق = DRAFT أو IN_REVIEW
  - ⭕ رمادي = NOT_STARTED
  - ➡️ رمادي باهت = SKIPPED (مرحلة قبل نقطة الدخول)

- المراحل المقفلة (التي لا يمكن الوصول إليها لأن المرحلة السابقة لم تُعتمد) تكون بلون باهت وغير قابلة للضغط (disabled)
  - الاستثناء: المراحل المتخطاة بسبب نقطة الدخول تكون قابلة للعرض (view only)

**ج) أضف الصفحات الجديدة (إذا لم تكن موجودة):**

تأكد من وجود هذه الصفحات في:
`apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[studyId]/`

```
specifications/page.tsx  ← قد تكون موجودة، تأكد
costing/page.tsx         ← قد تكون موجودة، تأكد  
pricing/page.tsx         ← قد تكون موجودة، تأكد
quotation/page.tsx       ← جديدة (بدلاً من selling-price)
convert/page.tsx         ← جديدة بالكامل
```

لكل صفحة جديدة أو تحتاج تعديل، أنشئها كـ placeholder بسيط:

```tsx
// مثال: quotation/page.tsx
import { PricingSubPageHeader } from "@/modules/saas/pricing/components/shell/PricingSubPageHeader";

export default function QuotationPage() {
  return (
    <div className="space-y-6">
      <PricingSubPageHeader
        title="عرض السعر"
        description="إصدار عرض سعر احترافي"
      />
      <div className="rounded-lg border border-dashed border-muted-foreground/25 p-12 text-center">
        <p className="text-muted-foreground">قيد التطوير — المرحلة القادمة</p>
      </div>
    </div>
  );
}
```

```tsx
// convert/page.tsx
import { PricingSubPageHeader } from "@/modules/saas/pricing/components/shell/PricingSubPageHeader";

export default function ConvertToProjectPage() {
  return (
    <div className="space-y-6">
      <PricingSubPageHeader
        title="التحويل لمشروع"
        description="تحويل الدراسة المعتمدة إلى مشروع تنفيذي"
      />
      <div className="rounded-lg border border-dashed border-muted-foreground/25 p-12 text-center">
        <p className="text-muted-foreground">قيد التطوير — المرحلة القادمة</p>
      </div>
    </div>
  );
}
```

**د) عدّل صفحة نظرة عامة على الدراسة:**

الملف: `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[studyId]/page.tsx`

عدّل هذه الصفحة لتعرض:
1. بطاقة معلومات الدراسة (الاسم، العميل، النوع، المساحة، الأدوار) — الكومبوننت الحالي يبقى
2. شريط المراحل الجديد (StudyPipelineStepper) بـ 6 مراحل
3. بطاقات إحصائية سريعة (الموجودة حالياً)
4. زر "فتح المرحلة النشطة" — يوجّه المستخدم للمرحلة الأولى غير المعتمدة

---

## تعليمات عامة مهمة

### أسلوب الكود:
- التزم بأنماط الكود الحالية في المشروع (اقرأ ملفات مشابهة قبل الكتابة)
- استخدم shadcn/ui للمكونات (Button, Card, Badge, etc.)
- استخدم lucide-react للأيقونات
- كل النصوص بالعربية (RTL) — المشروع يدعم العربية
- استخدم ORPC للـ API procedures (وليس tRPC) — اقرأ الإجراءات الحالية لفهم النمط
- استخدم React Query (useQuery/useMutation) لاستدعاء الـ API

### لا تكسر شيء:
- **لا تحذف أي ملف حالي** — فقط عدّل أو أضف
- **لا تحذف حقول قاعدة البيانات القديمة** — أضف الجديد بجانبها
- **لا تغيّر الـ API الحالية** — أضف endpoints جديدة إذا لزم الأمر
- الصفحات الحالية (structural, finishing, mep, quantities, specifications, costing, selling-price) يجب أن تستمر بالعمل كما هي
- الدراسات الحالية في قاعدة البيانات يجب أن تعمل بدون مشاكل

### الترتيب:
نفّذ المهام بالترتيب:
1. قاعدة البيانات أولاً (المهمة 1)
2. ثم شريط المراحل (المهمة 2) 
3. ثم صفحة الإنشاء (المهمة 3)
4. ثم التنقل والصفحات (المهمة 4)

بعد كل مهمة، تأكد أن المشروع يعمل (`pnpm build` أو `pnpm dev`) قبل الانتقال للمهمة التالية.

### إجراء API للمراحل الجديدة:

أضف في `packages/api/modules/quantities/procedures/` ملف جديد `study-stages.ts`:

```typescript
// المطلوب:
// 1. getStages(studyId) — يرجع جميع المراحل مع حالاتها
// 2. approveStage(studyId, stage) — يوافق على مرحلة (يجب أن تكون المرحلة السابقة APPROVED)
// 3. reopenStage(studyId, stage) — يعيد فتح مرحلة (يُعيد جميع المراحل اللاحقة إلى NOT_STARTED)
// 4. assignStage(studyId, stage, assigneeId) — يعيّن مسؤول
// 5. getActiveStage(studyId) — يرجع أول مرحلة ليست APPROVED (المرحلة النشطة)
```

اقرأ الملف الحالي `stages.ts` لفهم النمط وأعد كتابته بنفس الأسلوب لكن يستخدم جدول StudyStage بدلاً من حقول CostStudy.

**سجّل الـ procedures الجديدة في الـ router:**
اقرأ `packages/api/modules/quantities/router.ts` (أو حيث يتم تسجيل الإجراءات) وأضف الإجراءات الجديدة.
