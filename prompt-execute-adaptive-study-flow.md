# تنفيذ نظام الدراسة المرنة (Adaptive Study Flow)

## السياق
بناءً على تقرير التحليل في `docs/analysis-study-flow-report.md`، نريد تعديل نظام دراسات التسعير ليكون مرناً — الواجهة تتكيف مع اختيار المستخدم عند الإنشاء.

## القواعد العامة
- ابدأ في **Plan Mode** لكل مرحلة
- اقرأ الملف المستهدف قبل أي تعديل
- لا تستخدم `@ts-ignore` أو `any`
- كل النصوص العربية عبر next-intl (أضف مفاتيح الترجمة)
- `organizationId` في كل query
- بعد كل مرحلة: `pnpm build --filter web` للتحقق
- RTL / Arabic-first

---

## ملخص التغيير

### الأنواع الثلاثة فقط:

| النوع | studyType | الوصف | المراحل الظاهرة |
|-------|-----------|-------|-----------------|
| دراسة كاملة من الصفر | `FULL_STUDY` | حساب الكميات والمواصفات والتسعير خطوة بخطوة | الكميات → المواصفات → تسعير التكلفة → التسعير → عرض السعر → مشروع |
| تسعير تكلفة | `COST_PRICING` | لديّ كميات جاهزة وأريد تحديد المواصفات والتسعير | الكميات (جدول فارغ) → المواصفات → تسعير التكلفة → التسعير → عرض السعر → مشروع |
| تسعير سريع | `QUICK_PRICING` | إدخال بنود وأسعار مباشرة بدون تفاصيل | التسعير → عرض السعر |

### نطاقات العمل (workScopes):
- `STRUCTURAL` — أعمال إنشائية
- `FINISHING` — أعمال تشطيبات
- `MEP` — كهروميكانيكية
- `CUSTOM` — بنود مخصصة

تظهر خطوة النطاق فقط لـ FULL_STUDY و COST_PRICING.
QUICK_PRICING لا يحتاج نطاق — يدخل بنود حرة.

---

## المرحلة 1: تعديل Schema + Migration

### 1.1 اقرأ أولاً:
```
packages/database/prisma/schema.prisma
```
ابحث عن: `enum StudyType`, `enum StudyEntryPoint`, `model CostStudy`

### 1.2 التعديلات:

#### تعديل enum StudyType:
```prisma
enum StudyType {
  FULL_PROJECT        // ← سيبقى للتوافق مع البيانات القديمة (backward compat)
  CUSTOM_ITEMS        // ← سيبقى للتوافق
  LUMP_SUM_ANALYSIS   // ← سيبقى للتوافق
  FULL_STUDY          // ← جديد: دراسة كاملة من الصفر
  COST_PRICING        // ← جديد: تسعير تكلفة
  QUICK_PRICING       // ← جديد: تسعير سريع
}
```

**مهم**: لا تحذف القيم القديمة — اتركها للتوافق مع الدراسات الموجودة.

#### إضافة حقل workScopes على CostStudy:
```prisma
model CostStudy {
  // ... الحقول الموجودة ...
  workScopes    String[]    @default([])    // ["STRUCTURAL", "FINISHING", "MEP", "CUSTOM"]
}
```

### 1.3 بعد التعديل:
```bash
pnpm --filter database db:push
pnpm --filter database generate
```

### 1.4 تحقق:
- تأكد أن `fix-zod-decimal.mjs` يعمل بعد generate
- تأكد أن الحقل الجديد ظهر في Prisma Client

---

## المرحلة 2: تعديل API — إنشاء الدراسة

### 2.1 اقرأ أولاً:
```
packages/api/modules/quantities/procedures/create.ts
```

### 2.2 التعديلات:

#### تعديل Zod input schema:
أضف `workScopes` كحقل اختياري:
```typescript
workScopes: z.array(z.enum(["STRUCTURAL", "FINISHING", "MEP", "CUSTOM"])).optional().default([]),
```

#### تعديل منطق الإنشاء:
عند `prisma.costStudy.create`:
- أضف `workScopes: input.workScopes` في data
- **لا تغيّر** منطق entryPoint الحالي — هو يعمل بشكل صحيح
- إذا كان `studyType` أحد القيم الجديدة (FULL_STUDY, COST_PRICING, QUICK_PRICING)، حدد entryPoint تلقائياً:

```typescript
// تحويل الأنواع الجديدة إلى entryPoint
let entryPoint = input.entryPoint;
if (input.studyType === "FULL_STUDY") {
  entryPoint = "FROM_SCRATCH";
} else if (input.studyType === "COST_PRICING") {
  entryPoint = "HAS_QUANTITIES";
} else if (input.studyType === "QUICK_PRICING") {
  entryPoint = "QUOTATION_ONLY"; // أو CUSTOM_ITEMS — حسب المنطق الحالي
}
```

#### تعديل منطق حالات المراحل عند الإنشاء:
حسب التقرير، عند الإنشاء يتم تحديد أي مراحل DRAFT وأي NOT_STARTED. تأكد أن:
- `FULL_STUDY`: كل المراحل تبدأ من الكميات (مثل FROM_SCRATCH الحالي)
- `COST_PRICING`: الكميات = DRAFT (جدول فارغ)، الباقي NOT_STARTED
- `QUICK_PRICING`: التسعير = DRAFT، الباقي NOT_STARTED أو SKIPPED

**ملاحظة مهمة**: حسب التقرير، entryPoint يحدد أي المراحل "متخطاة" في الواجهة عبر `index < entryPointStartIndex`. لذلك:
- `COST_PRICING` → `entryPoint = "FROM_SCRATCH"` (نعم FROM_SCRATCH) لكن الكميات ستكون جدول فارغ (التمييز سيكون في الواجهة)
- أو أنشئ entryPoint جديد إذا كان أسهل

**اختر الطريقة الأبسط التي لا تكسر السلوك الحالي.**

### 2.3 تعديل get-by-id:
اقرأ: `packages/api/modules/quantities/procedures/get-by-id.ts`
- تأكد أن `workScopes` يُرجع مع بيانات الدراسة (Prisma يعيدها تلقائياً إذا كانت في select)

### 2.4 تحقق:
```bash
pnpm build --filter api
```

---

## المرحلة 3: تعديل wizard الإنشاء — تبسيط إلى 3 خيارات

### 3.1 اقرأ أولاً:
```
apps/web/modules/saas/pricing/components/studies/CreateCostStudyForm.tsx
```
وأيضاً إذا وُجد:
```
apps/web/modules/saas/pricing/components/studies/CreateStudyPage.tsx
```

### 3.2 التعديلات:

#### الخطوة 1 — اختيار النوع (3 خيارات فقط):

استبدل الخيارات الـ 5 الحالية بـ 3:

```typescript
const STUDY_GOALS = [
  {
    id: "full_study",
    icon: Building2,  // أو أي أيقونة مناسبة
    studyType: "FULL_STUDY" as const,
    // العنوان والوصف من الترجمة
    showScope: true,
  },
  {
    id: "cost_pricing", 
    icon: Calculator,
    studyType: "COST_PRICING" as const,
    showScope: true,
  },
  {
    id: "quick_pricing",
    icon: Zap,
    studyType: "QUICK_PRICING" as const,
    showScope: false,
  },
] as const;
```

#### الخطوة 2 — نطاق العمل (يظهر فقط إذا showScope = true):

تظهر فقط لـ FULL_STUDY و COST_PRICING:
```typescript
const WORK_SCOPES = [
  { id: "STRUCTURAL", icon: "🏗️" },
  { id: "FINISHING",  icon: "🎨" },
  { id: "MEP",        icon: "⚡" },
  { id: "CUSTOM",     icon: "📝" },
];
```
- multi-select (checkboxes)
- يجب اختيار واحد على الأقل

#### الخطوة 3 — بيانات أساسية:
كما هي حالياً: اسم الدراسة (اختياري)، العميل (اختياري)، نوع المشروع.

#### عند الإرسال:
```typescript
const payload = {
  organizationId,
  studyType: selectedGoal.studyType,  // FULL_STUDY | COST_PRICING | QUICK_PRICING
  workScopes: selectedGoal.showScope ? selectedScopes : [],
  name: formData.name || undefined,
  customerName: formData.customerName || undefined,
  projectType: formData.projectType,
  // القيم الافتراضية:
  landArea: 1,
  buildingArea: 1,
  numberOfFloors: 1,
  hasBasement: false,
  finishingLevel: "medium",
};
```

#### بعد الإنشاء — التوجيه:
```typescript
if (studyType === "FULL_STUDY") {
  router.push(`/pricing/studies/${id}/quantities`);
} else if (studyType === "COST_PRICING") {
  router.push(`/pricing/studies/${id}/quantities`); // جدول فارغ
} else if (studyType === "QUICK_PRICING") {
  router.push(`/pricing/studies/${id}/pricing`); // مباشر للتسعير
}
```

### 3.3 مفاتيح الترجمة:
أضف في ملفات الترجمة العربية والإنجليزية (`messages/ar.json`, `messages/en.json`):

```json
{
  "pricing": {
    "studies": {
      "create": {
        "selectGoal": "ماذا تريد أن تفعل؟",
        "selectGoalDescription": "اختر نوع العمل المناسب لاحتياجك",
        "goals": {
          "full_study": {
            "title": "دراسة كاملة من الصفر",
            "description": "حساب الكميات والمواصفات والتسعير خطوة بخطوة",
            "badge": "جميع المراحل"
          },
          "cost_pricing": {
            "title": "تسعير تكلفة",
            "description": "لديّ كميات جاهزة وأريد تحديد المواصفات والتسعير",
            "badge": "يتخطى محرك الكميات"
          },
          "quick_pricing": {
            "title": "تسعير سريع",
            "description": "إدخال بنود وأسعار مباشرة بدون تفاصيل",
            "badge": "مباشر لعرض السعر"
          }
        },
        "selectScope": "ما نطاق العمل؟",
        "selectScopeDescription": "يمكن اختيار أكثر من خيار",
        "scopes": {
          "STRUCTURAL": "أعمال إنشائية",
          "FINISHING": "أعمال تشطيبات",
          "MEP": "كهروميكانيكية",
          "CUSTOM": "بنود مخصصة"
        },
        "editConfig": "تعديل صيغة الدراسة",
        "studyConfig": "صيغة الدراسة"
      }
    }
  }
}
```

### 3.4 تحقق:
```bash
pnpm build --filter web
```

---

## المرحلة 4: شريط إعدادات الدراسة (StudyConfigBar) + زر تعديل

### 4.1 أنشئ مكون جديد:
```
apps/web/modules/saas/pricing/components/studies/StudyConfigBar.tsx
```

هذا شريط صغير يظهر أعلى صفحة الدراسة (تحت StudyHeaderCard أو بداخله).

#### التصميم:
```
┌──────────────────────────────────────────────────────────────┐
│  📋 دراسة كاملة من الصفر  •  🏗️ إنشائي، 🎨 تشطيبات  [✏️ تعديل]  │
└──────────────────────────────────────────────────────────────┘
```

- Badge/chip لنوع الدراسة (لون مميز لكل نوع)
- Chips لنطاقات العمل (إذا وُجدت)
- زر "تعديل" صغير (أيقونة قلم)
- RTL layout

#### Props:
```typescript
interface StudyConfigBarProps {
  studyType: string;
  workScopes: string[];
  onEdit?: () => void;  // يفتح dialog التعديل
  canEdit?: boolean;     // إذا الدراسة ليست APPROVED
}
```

### 4.2 أنشئ مكون EditStudyConfigDialog:
```
apps/web/modules/saas/pricing/components/studies/EditStudyConfigDialog.tsx
```

Dialog يسمح بتعديل:
- نوع الدراسة (3 خيارات)
- نطاقات العمل (multi-select)

**تحذير**: إذا كان التغيير سيؤثر على بيانات موجودة (مثلاً تغيير من FULL_STUDY إلى QUICK_PRICING وهناك بنود في الكميات)، يظهر تحذير.

### 4.3 أنشئ API endpoint للتعديل:
في `packages/api/modules/quantities/procedures/` أنشئ:
```
update-config.ts
```

```typescript
// Input
{
  studyId: string,
  organizationId: string,
  studyType?: StudyType,
  workScopes?: string[],
}
// Logic:
// 1. تحقق من الصلاحيات
// 2. حدّث الحقول
// 3. إذا تغيّر studyType: أعد حساب حالات المراحل
// 4. أرجع الدراسة المحدّثة
```

سجّل هذا الـ procedure في الـ router الموجود.

### 4.4 ادمج في صفحة الدراسة:

اقرأ: `apps/web/modules/saas/pricing/components/studies/CostStudyOverview.tsx`

أضف `StudyConfigBar` فيها (أو في StudyPageShell إذا كان أنسب لأنه يظهر في كل الصفحات).

### 4.5 تحقق:
```bash
pnpm build --filter web
```

---

## المرحلة 5: Stepper و Sidebar ديناميكي

### 5.1 أنشئ hook مساعد:
```
apps/web/modules/saas/pricing/hooks/useStudyConfig.ts
```

```typescript
export function useStudyConfig(study: { studyType: string; workScopes: string[]; entryPoint: string }) {
  // المراحل المفعّلة حسب النوع
  const enabledStages = useMemo(() => {
    switch (study.studyType) {
      case "FULL_STUDY":
      case "FULL_PROJECT": // backward compat
        return ["quantities", "specifications", "costing", "pricing", "quotation", "convert"];
      case "COST_PRICING":
        return ["quantities", "specifications", "costing", "pricing", "quotation", "convert"];
        // الكميات = جدول فارغ (يتم التمييز في صفحة الكميات)
      case "QUICK_PRICING":
      case "CUSTOM_ITEMS": // backward compat
        return ["pricing", "quotation"];
      case "LUMP_SUM_ANALYSIS":
        return ["costing", "pricing"]; // كما هو حالياً
      default:
        return ["quantities", "specifications", "costing", "pricing", "quotation", "convert"];
    }
  }, [study.studyType]);

  // التبويبات المفعّلة حسب النطاق
  const enabledTabs = useMemo(() => {
    const scopes = study.workScopes;
    if (!scopes || scopes.length === 0) {
      // fallback: كل التبويبات (للدراسات القديمة)
      return ["structural", "finishing", "mep", "manual"];
    }
    const tabs: string[] = [];
    if (scopes.includes("STRUCTURAL")) tabs.push("structural");
    if (scopes.includes("FINISHING")) tabs.push("finishing");
    if (scopes.includes("MEP")) tabs.push("mep");
    if (scopes.includes("CUSTOM")) tabs.push("manual");
    return tabs;
  }, [study.workScopes]);

  // هل هذا وضع الجدول الفارغ؟
  const isEmptyTableMode = study.studyType === "COST_PRICING";

  // هل هذا تسعير سريع؟
  const isQuickPricing = study.studyType === "QUICK_PRICING" || study.studyType === "CUSTOM_ITEMS";

  return { enabledStages, enabledTabs, isEmptyTableMode, isQuickPricing };
}
```

### 5.2 تعديل StudyPipelineStepper:

اقرأ: `apps/web/modules/saas/pricing/components/studies/StudyPipelineStepper.tsx`

#### التعديل:
- استقبل `studyType` و `workScopes` كـ props (أو اقرأهم من context/query)
- استخدم `useStudyConfig` للحصول على `enabledStages`
- **فلتر** مصفوفة `PIPELINE_STAGES` لعرض فقط المراحل في `enabledStages`
- إذا كان QUICK_PRICING: لا تعرض stepper أصلاً (أو اعرض stepper مبسط بخطوتين فقط)

```typescript
const { enabledStages } = useStudyConfig({ studyType, workScopes, entryPoint });
const visibleStages = PIPELINE_STAGES.filter(s => enabledStages.includes(s.key));
```

### 5.3 تعديل PipelineBar:

اقرأ: `apps/web/modules/saas/pricing/components/pipeline/PipelineBar.tsx`

نفس المنطق — فلتر المراحل المعروضة حسب `enabledStages`.

### 5.4 تعديل Sidebar:

اقرأ: `apps/web/modules/saas/shared/components/sidebar/use-sidebar-menu.ts`

ابحث عن المكان الذي يُضاف فيه 6 عناصر فرعية عند وجود studyId. عدّل ليفلتر العناصر حسب `enabledStages`.

**ملاحظة**: الـ sidebar قد لا يملك access مباشر لبيانات الدراسة. الخيارات:
- مرر studyType و workScopes عبر URL params
- أو استخدم React Query cache (إذا البيانات محملة)
- أو أضف query خفيف لجلب studyType و workScopes فقط

اختر الطريقة الأبسط التي لا تضيف request إضافي (استخدم cache إذا ممكن).

### 5.5 تحقق:
```bash
pnpm build --filter web
```
ثم اختبر يدوياً:
- أنشئ دراسة FULL_STUDY → تأكد أن كل المراحل تظهر
- أنشئ دراسة QUICK_PRICING → تأكد أن فقط التسعير وعرض السعر يظهران
- تأكد أن الدراسات القديمة (FULL_PROJECT, CUSTOM_ITEMS) لا تتأثر

---

## المرحلة 6: فلترة التبويبات حسب النطاق (workScopes)

### 6.1 اقرأ أولاً:
```
apps/web/modules/saas/pricing/components/studies/QuantitiesSubTabs.tsx
apps/web/modules/saas/pricing/components/pipeline/QuantitiesPageContent.tsx
apps/web/modules/saas/pricing/components/pipeline/SpecificationsPageContent.tsx
```

### 6.2 التعديلات:

#### في QuantitiesSubTabs أو QuantitiesPageContent:
- استقبل `enabledTabs` من `useStudyConfig`
- فلتر التبويبات المعروضة:

```typescript
const { enabledTabs } = useStudyConfig(study);
const ALL_TABS = [
  { key: "structural", label: t("structural"), icon: Building2 },
  { key: "finishing",  label: t("finishing"),  icon: Paintbrush },
  { key: "mep",        label: t("mep"),        icon: Zap },
  { key: "manual",     label: t("manual"),     icon: PenLine },
];
const visibleTabs = ALL_TABS.filter(tab => enabledTabs.includes(tab.key));
```

- إذا تبويب واحد فقط → لا تعرض tabs أصلاً (اعرض المحتوى مباشرة)
- إذا أكثر من واحد → اعرض tabs كالمعتاد

#### في SpecificationsPageContent:
نفس المنطق — فلتر تبويبات المواصفات (إنشائي، تشطيبات، MEP) حسب `enabledTabs`.

### 6.3 تحقق:
```bash
pnpm build --filter web
```

---

## المرحلة 7: وضع الجدول الفارغ (COST_PRICING)

### 7.1 المفهوم:
عندما يكون `studyType === "COST_PRICING"`:
- صفحة الكميات تعرض **جدول فارغ** بدلاً من محركات الحساب
- الأعمدة نفس أعمدة مخرجات محرك الحساب (حسب النطاق)
- المستخدم يملأ يدوياً
- البيانات تُحفظ في نفس النماذج (StructuralItem, FinishingItem, MEPItem, ManualItem)

### 7.2 اقرأ أولاً:
```
apps/web/modules/saas/pricing/components/pipeline/QuantitiesPageContent.tsx
apps/web/modules/saas/pricing/components/studies/StructuralItemsEditor.tsx
apps/web/modules/saas/pricing/components/studies/FinishingItemsEditor.tsx
apps/web/modules/saas/pricing/components/studies/MEPItemsEditor.tsx
```

### 7.3 الخيار الأبسط:
بدلاً من إنشاء مكون جديد بالكامل، عدّل المكونات الحالية لتدعم "وضع الإدخال اليدوي":

#### للإنشائي (StructuralItemsEditor):
إذا `isEmptyTableMode`:
- اعرض جدول بسيط فارغ بالأعمدة: الفئة، الاسم/الوصف، الوحدة، الكمية، حجم الخرسانة (م³)، وزن الحديد (كجم)
- زر "إضافة بند" يضيف صف فارغ
- المستخدم يملأ يدوياً
- يُحفظ كـ StructuralItem عبر API الحالي (`structuralItemCreate`)
- **لا تعرض** أقسام الأساسات/الأعمدة/الكمرات ومعالجات الحساب — فقط الجدول البسيط

#### للتشطيبات (FinishingItemsEditor):
إذا `isEmptyTableMode`:
- اعرض جدول فارغ بالأعمدة: الفئة، الفئة الفرعية، الطابق، الوصف، الوحدة، الكمية
- زر "إضافة بند"
- يُحفظ كـ FinishingItem

#### للـ MEP:
نفس النمط.

#### البديل (إذا كان أبسط):
أنشئ مكون واحد `EmptyQuantitiesTable.tsx` يعمل لكل الأنواع:
```typescript
interface EmptyQuantitiesTableProps {
  studyId: string;
  section: "STRUCTURAL" | "FINISHING" | "MEP" | "CUSTOM";
  existingItems: any[];
  onItemAdded: () => void;
}
```
ثم استخدمه في كل تبويب إذا `isEmptyTableMode`.

**اختر الطريقة الأبسط.**

### 7.4 تحقق:
```bash
pnpm build --filter web
```

---

## المرحلة 8: وضع التسعير السريع (QUICK_PRICING)

### 8.1 اقرأ أولاً:
ابحث عن الصفحة والمكون الحالي:
```bash
grep -rn "quick-pricing\|QuickPricing\|quickPricing" --include="*.tsx" --include="*.ts" apps/web/modules/saas/pricing/
```

حسب التقرير، يوجد `QuickPricingStandalone` ويتم التوجيه إليه من `/quick-pricing`.

### 8.2 التعديلات:
اقرأ المكون الحالي وقيّم:
- هل يعمل بشكل مستقل؟ (حسب التقرير: نعم)
- هل يحفظ البيانات بشكل صحيح؟
- هل ينتقل لعرض السعر بعد الانتهاء؟

إذا كان يعمل بشكل جيد، فقط تأكد أن:
1. Stepper يعرض فقط: التسعير → عرض السعر (المرحلة 5 أعلاه تغطي هذا)
2. Sidebar يعرض فقط الصفحات المناسبة (المرحلة 5 أعلاه)
3. StudyConfigBar يعرض "تسعير سريع" بدون نطاقات

### 8.3 تحقق:
```bash
pnpm build --filter web
```

---

## المرحلة 9: تحديث صفحة النظرة العامة (Overview)

### 9.1 اقرأ أولاً:
```
apps/web/modules/saas/pricing/components/studies/CostStudyOverview.tsx
apps/web/modules/saas/pricing/components/studies/StudyHeaderCard.tsx
```

### 9.2 التعديلات:

#### في StudyHeaderCard أو CostStudyOverview:
أضف `StudyConfigBar` ليظهر نوع الدراسة ونطاقات العمل مع زر التعديل.

#### تأكد أن صفحة النظرة العامة تعرض:
- الملخص السريع (Stats cards) — فقط للبنود الموجودة فعلاً
- إذا كانت الدراسة QUICK_PRICING: لا تعرض بطاقات الخرسانة والحديد (لا معنى لها)
- الزر "فتح المرحلة النشطة" يوجّه للمرحلة الصحيحة

### 9.3 تحقق:
```bash
pnpm build --filter web
```

---

## المرحلة 10: التوافق مع الدراسات القديمة (Backward Compatibility)

### 10.1 اقرأ:
```
packages/api/modules/quantities/procedures/list.ts
packages/api/modules/quantities/procedures/get-by-id.ts
```

### 10.2 التعديلات:
- الدراسات القديمة التي لديها `studyType = FULL_PROJECT` و `workScopes = []`:
  - يجب أن تعمل كما كانت (كل المراحل، كل التبويبات)
  - `useStudyConfig` يتعامل مع هذا عبر fallback (انظر المرحلة 5.1)

- لا تضف migration لتحديث الدراسات القديمة — اتركها كما هي

### 10.3 اختبار:
- افتح دراسة قديمة (FULL_PROJECT) → يجب أن تعمل بالضبط كما كانت
- أنشئ دراسة جديدة (FULL_STUDY) → يجب أن تعمل مع الفلترة
- أنشئ دراسة (COST_PRICING) → يجب أن تعرض جدول فارغ في الكميات
- أنشئ دراسة (QUICK_PRICING) → يجب أن تفتح مباشرة على التسعير

### 10.4 بناء نهائي:
```bash
pnpm build --filter web
```

---

## ملخص ترتيب التنفيذ

| # | المرحلة | الملفات الرئيسية | تعديل/جديد |
|---|---------|-----------------|-----------|
| 1 | Schema + Migration | `schema.prisma` | تعديل |
| 2 | API create | `create.ts`, `update-config.ts` | تعديل + جديد |
| 3 | wizard الإنشاء | `CreateCostStudyForm.tsx` | تعديل |
| 4 | StudyConfigBar | `StudyConfigBar.tsx`, `EditStudyConfigDialog.tsx` | جديد |
| 5 | Stepper + Sidebar | `StudyPipelineStepper.tsx`, `PipelineBar.tsx`, `use-sidebar-menu.ts`, `useStudyConfig.ts` | تعديل + جديد |
| 6 | فلترة التبويبات | `QuantitiesSubTabs.tsx`, `SpecificationsPageContent.tsx` | تعديل |
| 7 | جدول فارغ | `QuantitiesPageContent.tsx` أو `EmptyQuantitiesTable.tsx` | تعديل + جديد |
| 8 | تسعير سريع | مكون QuickPricing الحالي | مراجعة |
| 9 | Overview | `CostStudyOverview.tsx`, `StudyHeaderCard.tsx` | تعديل |
| 10 | Backward compat | اختبار | لا تعديل |

---

## قواعد هامة

- **لا تحذف** القيم القديمة من enums (FULL_PROJECT, CUSTOM_ITEMS, LUMP_SUM_ANALYSIS)
- **لا تكسر** الدراسات الموجودة — أي دراسة قديمة يجب أن تعمل كما كانت
- **كل الحقول الجديدة** اختيارية أو لها قيم افتراضية
- `workScopes` الافتراضي = `[]` (يعني: كل التبويبات — fallback للقديم)
- اختبر بعد كل مرحلة
- إذا واجهت ملف أكبر من 1000 سطر، لا تعد كتابته — عدّل فقط الأجزاء المطلوبة
