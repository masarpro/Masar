# برومبتات تنفيذ إصلاح قسم دراسات التكلفة — مسار
# Pricing/Studies Module Fix — Claude Code Execution Prompts

> **ملاحظة:** كل مرحلة مستقلة. نفّذ مرحلة واحدة ← راجع النتيجة ← ثم انتقل للتالية.
> **ملاحظة:** أعلم جوّدت بالانتهاء من كل مرحلة قبل الانتقال للتالية.

---

# ════════════════════════════════════════════════════════════════
# المرحلة 1: حذف الكود الميت وتنظيف الملفات المهملة
# Phase 1: Dead Code Removal
# الوقت المتوقع: 15-20 دقيقة
# ════════════════════════════════════════════════════════════════

```
ابدأ بوضع Plan Mode واقرأ هذه الملفات أولاً:
- apps/web/modules/saas/pricing/components/studies/finishing/_deprecated/ (اقرأ أسماء الملفات فقط)
- apps/web/modules/saas/pricing/components/studies/finishing/ (اقرأ index.ts أو أي barrel exports)

المطلوب:

1. **حذف مجلد _deprecated بالكامل:**
   احذف المجلد التالي وكل محتوياته:
   `apps/web/modules/saas/pricing/components/studies/finishing/_deprecated/`
   
   الملفات المتوقعة (14 ملف، ~2,667 سطر):
   - AddEditFinishingItemDialog.tsx
   - BuildingConfigPanel.tsx
   - FinishingCategoryCard.tsx
   - FinishingGroupSection.tsx
   - FinishingItemRow.tsx
   - FinishingSummary.tsx
   - FloorSelector.tsx
   - QuickAddTemplates.tsx
   - calculators/DirectAreaCalculator.tsx
   - calculators/LinearCalculator.tsx
   - calculators/LumpSumCalculator.tsx
   - calculators/PerUnitCalculator.tsx
   - calculators/RoomByRoomCalculator.tsx
   - calculators/WallDeductionCalculator.tsx

2. **تنظيف أي imports متبقية:**
   ابحث في كامل المشروع عن أي import يشير إلى `_deprecated` في مجلد pricing:
   ```bash
   grep -r "_deprecated" apps/web/modules/saas/pricing/ --include="*.ts" --include="*.tsx"
   ```
   إذا وجدت أي imports، احذفها.

3. **تحقق أن البناء يعمل:**
   ```bash
   cd apps/web && pnpm type-check
   ```
   إذا كان هناك أخطاء، أصلحها.

لا تعدّل أي ملفات أخرى. فقط حذف الكود الميت.
```

---

# ════════════════════════════════════════════════════════════════
# المرحلة 2: استخراج الثوابت والدوال المكررة
# Phase 2: Extract Duplicated Constants & Utilities
# الوقت المتوقع: 30-40 دقيقة
# ════════════════════════════════════════════════════════════════

```
ابدأ بوضع Plan Mode واقرأ هذه الملفات بالكامل أولاً:
- apps/web/modules/saas/pricing/lib/utils.ts
- apps/web/modules/saas/pricing/components/pipeline/CostingTable.tsx
- apps/web/modules/saas/pricing/components/pipeline/CostingSummary.tsx
- apps/web/modules/saas/pricing/components/pipeline/SectionMarkupForm.tsx
- apps/web/modules/saas/pricing/components/pipeline/LumpSumAnalysis.tsx
- apps/web/modules/saas/pricing/components/pipeline/ProfitAnalysis.tsx
- apps/web/modules/saas/pricing/components/mep/MEPDashboard.tsx
- apps/web/modules/saas/pricing/components/mep/MEPCategorySection.tsx

المطلوب 4 مهام:

═══ المهمة 2A: استخراج SECTION_LABELS و SECTION_COLORS ═══

أنشئ ملف جديد:
`apps/web/modules/saas/pricing/lib/costing-constants.ts`

المحتوى: استخرج من الملفات الثلاثة (CostingTable.tsx، CostingSummary.tsx، SectionMarkupForm.tsx) التعريفات المكررة لـ:
- SECTION_LABELS (Record<string, string>) — تسميات الأقسام
- SECTION_COLORS (Record<string, string>) — ألوان الأقسام (إن وُجدت)

ثم:
- في كل من الملفات الثلاثة: احذف التعريف المحلي واستبدله بـ import من الملف الجديد
- تأكد أن كل الأقسام موجودة: STRUCTURAL, FINISHING, MEP, LABOR, MANUAL

═══ المهمة 2B: إزالة fmt() المكررة ═══

في كل من هذه الملفات الخمسة:
1. pipeline/CostingTable.tsx (السطر ~59) — دالة `fmt(n: number | null)`
2. pipeline/LumpSumAnalysis.tsx (السطر ~27) — دالة `fmt(n: number)`
3. pipeline/ProfitAnalysis.tsx (السطر ~33) — دالة `fmt(n: number)`
4. pipeline/SectionMarkupForm.tsx (السطر ~46) — دالة `fmt(n: number)`
5. pipeline/CostingSummary.tsx (السطر ~26) — دالة `formatNum(n: number)`

كلها تفعل: `n.toLocaleString("ar-SA")` أو ما يشبهه.

الحل:
- اقرأ `lib/utils.ts` أولاً وابحث عن `formatNumber` أو `formatCurrency`
- إذا كانت `formatNumber()` موجودة وتؤدي نفس الغرض: استخدمها مباشرة
- إذا لم تكن موجودة أو كانت مختلفة: أضف دالة `formatNumber(n: number | null | undefined): string` في `lib/utils.ts`
- في كل ملف من الخمسة: احذف الدالة المحلية واستبدل كل استخداماتها بـ `formatNumber` المستوردة من `../lib/utils` أو المسار المناسب
- **انتبه:** CostingTable.tsx تقبل `null` — تأكد أن الدالة الموحدة تتعامل مع `null`

═══ المهمة 2C: استخراج ICON_MAP المشترك ═══

أنشئ ملف جديد:
`apps/web/modules/saas/pricing/lib/mep-icons.ts`

المحتوى: استخرج من MEPDashboard.tsx (السطر ~25-31) و MEPCategorySection.tsx (السطر ~22-29):
```typescript
import { Zap, Droplets, Wind, Flame, Wifi, Settings } from "lucide-react";

export const MEP_ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Zap, Droplets, Wind, Flame, Wifi, Settings,
};
```

ثم:
- في MEPDashboard.tsx: احذف التعريف المحلي لـ ICON_MAP واستبدله بـ import { MEP_ICON_MAP } من الملف الجديد
- في MEPCategorySection.tsx: نفس الشيء
- إذا كانت الملفات تستخدم اسم `ICON_MAP` بدلاً من `MEP_ICON_MAP`، يمكنك عمل:
  `import { MEP_ICON_MAP as ICON_MAP } from "../lib/mep-icons";`
  أو تغيير كل الاستخدامات — الأفضل تغيير كل الاستخدامات لـ MEP_ICON_MAP

═══ المهمة 2D: إعادة تسمية أنواع الحسابات المتشابهة ═══

اقرأ هذه الملفات:
- apps/web/modules/saas/pricing/types/columns.ts
- apps/web/modules/saas/pricing/lib/calculations.ts

المشكلة: `ColumnInput` معرّف في مكانين بمحتوى مختلف. نفس الشيء لـ `BeamInput`, `SlabInput`, `FoundationInput`.

الحل:
- في `lib/calculations.ts` فقط: أعد تسمية الأنواع المبسطة:
  - `ColumnInput` → `ColumnCalcInput`
  - `BeamInput` → `BeamCalcInput`
  - `SlabInput` → `SlabCalcInput`
  - `FoundationInput` → `FoundationCalcInput`
- حدّث كل الاستخدامات في نفس الملف وأي ملفات تستورد منه (ابحث بـ grep)
- لا تعدّل الأنواع في `types/` — تلك خاصة بالمكونات

═══ التحقق النهائي ═══

```bash
cd apps/web && pnpm type-check
```
أصلح أي أخطاء ناتجة عن التغييرات.
```

---

# ════════════════════════════════════════════════════════════════
# المرحلة 3: إنشاء دوال مساعدة لتحويل Decimal وتوحيد الاستجابات
# Phase 3: Decimal Helpers + API Consistency
# الوقت المتوقع: 45-60 دقيقة
# ════════════════════════════════════════════════════════════════

```
ابدأ بوضع Plan Mode واقرأ هذه الملفات أولاً:
- packages/api/modules/quantities/ (اقرأ هيكل المجلد)
- packages/api/modules/quantities/procedures/ (اقرأ أسماء الملفات)
- اقرأ أي 3 ملفات procedures تحتوي على تحويل Decimal يدوي — مثلاً:
  - mep-item-create.ts
  - finishing-item-create.ts  
  - structural-item-create.ts
- packages/database/prisma/queries/cost-studies.ts (اقرأ أول 100 سطر + ابحث عن recalculateCostStudyTotals)

المطلوب 3 مهام:

═══ المهمة 3A: إنشاء دوال تحويل Decimal ═══

أنشئ ملف جديد:
`packages/api/lib/decimal-helpers.ts`

بناءً على ما قرأته من ملفات الـ procedures، أنشئ دوال تحويل لكل نوع:

```typescript
import type { Prisma } from "@prisma/client";

// دالة عامة لتحويل أي حقل Decimal إلى Number
function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

// CostStudy — 11 حقل عشري
export function convertStudyDecimals(study: any) {
  return {
    ...study,
    structuralCost: toNumber(study.structuralCost),
    finishingCost: toNumber(study.finishingCost),
    mepCost: toNumber(study.mepCost),
    laborCost: toNumber(study.laborCost),
    totalCost: toNumber(study.totalCost),
    overheadPercent: toNumber(study.overheadPercent),
    profitPercent: toNumber(study.profitPercent),
    contingencyPercent: toNumber(study.contingencyPercent),
    overheadAmount: toNumber(study.overheadAmount),
    profitAmount: toNumber(study.profitAmount),
    contingencyAmount: toNumber(study.contingencyAmount),
    // أضف أي حقول أخرى تجدها
  };
}

// StructuralItem — 8 حقول عشرية
export function convertStructuralItemDecimals(item: any) { /* ... */ }

// FinishingItem — 12 حقل عشري
export function convertFinishingItemDecimals(item: any) { /* ... */ }

// MEPItem — 10 حقول عشرية
export function convertMEPItemDecimals(item: any) { /* ... */ }

// LaborItem — 5 حقول عشرية
export function convertLaborItemDecimals(item: any) { /* ... */ }

// Quote — 5 حقول عشرية
export function convertQuoteDecimals(quote: any) { /* ... */ }

// CostingItem
export function convertCostingItemDecimals(item: any) { /* ... */ }

// SectionMarkup
export function convertSectionMarkupDecimals(markup: any) { /* ... */ }
```

**مهم جداً:** اقرأ الملفات الفعلية لتحديد أسماء الحقول الدقيقة. لا تخمن — اقرأ الكود.

═══ المهمة 3B: استبدال التحويل اليدوي في كل الـ procedures ═══

ابحث عن كل الـ procedures التي تحوّل Decimal يدوياً:
```bash
grep -rn "Number(item\." packages/api/modules/quantities/procedures/ --include="*.ts"
grep -rn "Number(study\." packages/api/modules/quantities/procedures/ --include="*.ts"
grep -rn "Number(quote\." packages/api/modules/quantities/procedures/ --include="*.ts"
```

في كل ملف وجدته:
- أضف import للدالة المناسبة من `@api/lib/decimal-helpers`
  (تحقق من مسار الـ import الصحيح بحسب tsconfig paths — ربما `../../lib/decimal-helpers` أو `@/lib/decimal-helpers`)
- استبدل كتلة التحويل اليدوي بالدالة المناسبة

مثال — قبل:
```typescript
return {
  ...item,
  quantity: Number(item.quantity),
  materialPrice: Number(item.materialPrice),
  laborPrice: Number(item.laborPrice),
  totalCost: Number(item.totalCost),
};
```

بعد:
```typescript
return convertMEPItemDecimals(item);
```

**انتبه:**
- بعض الـ procedures تضيف حقول إضافية بعد التحويل (مثل count أو metadata) — لا تحذفها
- إذا كان الكود يفعل spread + حقول إضافية:
  ```typescript
  return { ...convertMEPItemDecimals(item), extraField: value };
  ```

═══ المهمة 3C: تصحيح subscriptionProcedure → protectedProcedure للقراءة ═══

اقرأ هذه الملفات وابحث عن نوع الـ procedure:
- ملف quote-list أو quote الذي يحتوي على `quoteList` procedure
- ملف quote-get-by-id أو ما يكافئه
- ملف spec-template-list أو ما يكافئه

في كل ملف:
- إذا كان يستخدم `subscriptionProcedure` لعملية **قراءة فقط** (list أو getById):
  غيّره إلى `protectedProcedure`
- لا تغيّر عمليات الكتابة (create, update, delete) — هذه صحيحة كـ subscriptionProcedure

═══ التحقق النهائي ═══

```bash
cd packages/api && pnpm type-check
cd apps/web && pnpm type-check
```
```

---

# ════════════════════════════════════════════════════════════════
# المرحلة 4: تحسين Zod Validation + توحيد استجابات Batch
# Phase 4: Input Validation + Batch Response Consistency
# الوقت المتوقع: 30-40 دقيقة
# ════════════════════════════════════════════════════════════════

```
ابدأ بوضع Plan Mode واقرأ هذه الملفات أولاً:
- packages/api/modules/quantities/procedures/ (كل الملفات التي تحتوي create أو update)
- ابحث عن كل ملفات الـ batch:
  ```bash
  grep -rn "createBatch\|createFinishingItemsBatch\|createMEPItemsBatch" packages/api/modules/quantities/ --include="*.ts" -l
  ```

المطلوب مهمتان:

═══ المهمة 4A: إضافة .min(0) للحقول المالية والكمية ═══

ابحث عن كل مخططات Zod في الـ procedures:
```bash
grep -rn "z.number()" packages/api/modules/quantities/procedures/ --include="*.ts"
```

لكل حقل مالي أو كمي (quantity, price, cost, rate, amount, percent, weight, volume, area, length, height, width, thickness):
- غيّر `z.number()` إلى `z.number().min(0)` أو `z.number().nonnegative()`
- **استثناء:** إذا كان الحقل يمكن أن يكون سالباً بشكل منطقي (مثل adjustment أو discount)، اتركه

مثال — قبل:
```typescript
quantity: z.number(),
materialPrice: z.number(),
laborPrice: z.number(),
wastagePercent: z.number(),
```

بعد:
```typescript
quantity: z.number().nonnegative(),
materialPrice: z.number().nonnegative(),
laborPrice: z.number().nonnegative(),
wastagePercent: z.number().min(0).max(100),
```

**ملاحظة خاصة بالنسب المئوية:**
- overheadPercent, profitPercent, contingencyPercent, wastagePercent: أضف `.min(0).max(100)`
- إذا كان الحقل `.optional()` أو `.nullable()`، ضع `.min(0)` قبل `.optional()`

═══ المهمة 4B: توحيد استجابة createBatch ═══

ابحث عن كل procedures من نوع batch:
```bash
grep -rn "success: true" packages/api/modules/quantities/procedures/ --include="*.ts"
```

لكل procedure يُرجع `{ success: true }` فقط:
- غيّره ليُرجع `{ success: true, count: N }` حيث N هو عدد العناصر المُنشأة

مثال — قبل:
```typescript
return { success: true };
```

بعد:
```typescript
return { success: true, count: items.length }; // أو count: input.items.length
```

اقرأ سياق كل procedure لتحديد كيف تحسب `count` — ربما من `input.items.length` أو من نتيجة العملية.

═══ التحقق ═══

```bash
cd packages/api && pnpm type-check
```
```

---

# ════════════════════════════════════════════════════════════════
# المرحلة 5: إصلاح الترجمة — مكونات MEP
# Phase 5: i18n Fix — MEP Components
# الوقت المتوقع: 45-60 دقيقة
# ════════════════════════════════════════════════════════════════

```
ابدأ بوضع Plan Mode واقرأ هذه الملفات أولاً:

ملفات الترجمة:
- apps/web/messages/ar.json (ابحث عن القسم pricing.studies.mep و pricing.mep — كلاهما)
- apps/web/messages/en.json (نفس الأقسام)

مكونات MEP (اقرأها كلها بالكامل):
1. apps/web/modules/saas/pricing/components/mep/MEPBuildingRequired.tsx
2. apps/web/modules/saas/pricing/components/mep/MEPDashboard.tsx
3. apps/web/modules/saas/pricing/components/mep/MEPItemDialog.tsx
4. apps/web/modules/saas/pricing/components/mep/MEPManualAdder.tsx
5. apps/web/modules/saas/pricing/components/mep/MEPCategorySection.tsx
6. apps/web/modules/saas/pricing/components/mep/MEPItemRow.tsx
7. apps/web/modules/saas/pricing/components/mep/MEPSummaryBar.tsx

واقرأ أيضاً مكون تشطيبات يستخدم useTranslations كنموذج:
- apps/web/modules/saas/pricing/components/finishing/QuantitiesDashboard.tsx (أو أي مكون finishing يستخدم useTranslations)

المطلوب 3 مهام:

═══ المهمة 5A: توحيد مسار مفاتيح الترجمة ═══

المشكلة: مفاتيح MEP موجودة في مسارين في ملفات JSON:
1. `pricing.studies.mep.*` — تحت studies
2. `pricing.mep.*` — تحت pricing مباشرة

الحل:
- حدد أي المسارين فيه محتوى أكثر/أحدث (اقرأ كلاهما)
- وحّد الكل تحت مسار واحد: `pricing.studies.mep.*`
- إذا كان هناك مفاتيح في `pricing.mep.*` غير موجودة في `pricing.studies.mep.*`، انقلها
- بعد التأكد أن كل المفاتيح موجودة في `pricing.studies.mep.*`، احذف `pricing.mep` بالكامل
- افعل هذا في ar.json و en.json

═══ المهمة 5B: ربط useTranslations في كل مكونات MEP ═══

لكل مكون من السبعة أعلاه:

1. أضف import في أعلى الملف (إذا لم يكن موجوداً):
   ```typescript
   import { useTranslations } from "next-intl";
   ```

2. في بداية المكون (داخل الـ function component):
   ```typescript
   const t = useTranslations("pricing.studies.mep");
   ```
   أو حسب المسار الذي استخدمته في المكونات الأخرى — اقرأ مكون finishing كنموذج.

3. استبدل كل النصوص العربية المكتوبة مباشرة بمفاتيح ترجمة:

   **MEPBuildingRequired.tsx:**
   - `"إعدادات المبنى مطلوبة"` → `t("buildingRequired.title")`
   - الوصف الكامل بالعربية → `t("buildingRequired.description")`
   
   **MEPDashboard.tsx:**
   - `"تم تحديث إعدادات المبنى..."` → `t("dashboard.buildingUpdated")`
   - `"حفظ البنود الجديدة"` → `t("dashboard.saveNewItems")`
   - `"بنود الأعمال الكهروميكانيكية"` → `t("dashboard.title")`
   - `"إعادة اشتقاق"` → `t("dashboard.rederive")`
   
   **MEPItemDialog.tsx:**
   - `"تعديل بند MEP"` → `t("itemDialog.editTitle")`
   - `"اسم البند"` → `t("itemDialog.itemName")`
   - وكل النصوص الأخرى...
   
   **MEPManualAdder.tsx:**
   - `"إضافة بند MEP يدوي"` → `t("manualAdder.title")`
   - `"اختر الفئة"` → `t("manualAdder.selectCategory")`
   - وكل النصوص الأخرى...

   **MEPCategorySection.tsx, MEPItemRow.tsx, MEPSummaryBar.tsx:**
   - ابحث عن أي نص عربي وبدّله

4. **مهم:** لكل مفتاح جديد تنشئه (مثل `buildingRequired.title`)، تأكد أنه موجود في ar.json و en.json:
   - إذا لم يكن موجوداً، أضفه
   - في ar.json: ضع النص العربي الأصلي
   - في en.json: ضع ترجمة إنجليزية مناسبة

═══ المهمة 5C: ترجمة رسائل toast في MEP ═══

ابحث عن كل استخدامات `toast.success()`, `toast.error()`, `toast.info()` في مكونات MEP:
```bash
grep -rn "toast\." apps/web/modules/saas/pricing/components/mep/ --include="*.tsx"
```

لكل رسالة toast مكتوبة بالعربية مباشرة:
- بدّلها بمفتاح ترجمة: `toast.success(t("messages.saved"))` مثلاً
- أضف المفاتيح في ar.json و en.json

═══ التحقق ═══

```bash
cd apps/web && pnpm type-check
```

تحقق أن كل النصوص العربية المكتوبة مباشرة قد اختفت من مكونات MEP:
```bash
# هذا يجب ألا يُرجع نتائج (أو نتائج قليلة جداً فقط للتعليقات)
grep -rn '"[ء-ي]' apps/web/modules/saas/pricing/components/mep/ --include="*.tsx"
```
```

---

# ════════════════════════════════════════════════════════════════
# المرحلة 6: تحسين الأداء — تقسيم getCostStudyById + recalculate
# Phase 6: Performance — Lazy Loading + Batch Recalculate
# الوقت المتوقع: 60-90 دقيقة
# ════════════════════════════════════════════════════════════════

```
ابدأ بوضع Plan Mode واقرأ هذه الملفات بالكامل أولاً:
- packages/database/prisma/queries/cost-studies.ts (اقرأ بالكامل — 1,387 سطر)
- packages/api/modules/quantities/procedures/get-by-id.ts (أو ما يكافئه)
- packages/api/modules/quantities/router.ts (أو index.ts — لمعرفة كيف يتم تسجيل الـ routes)
- apps/web/modules/saas/pricing/components/studies/StructuralItemsEditor.tsx (أول 50 سطر — لمعرفة كيف يستدعي الـ API)
- apps/web/modules/saas/pricing/components/studies/FinishingItemsEditor.tsx (أول 50 سطر)
- apps/web/modules/saas/pricing/components/studies/MEPItemsEditor.tsx (أول 50 سطر)

المطلوب مهمتان:

═══ المهمة 6A: تقسيم getCostStudyById إلى Lazy Loading ═══

**الوضع الحالي:** `getCostStudyById()` في cost-studies.ts يحمّل كل شيء:
```typescript
include: {
  structuralItems: true,
  finishingItems: true,
  mepItems: true,
  laborItems: true,
  quotes: true,
  costingItems: true,
  manualItems: true,
  sectionMarkups: true,
}
```

**المطلوب:**

1. في `cost-studies.ts`، عدّل `getCostStudyById()`:
   - اجعله يحمّل البيانات الأساسية فقط (بدون البنود الثقيلة):
   ```typescript
   include: {
     sectionMarkups: true,  // خفيفة — عدد قليل
     // لا نحمّل structuralItems, finishingItems, mepItems, etc.
   }
   ```
   
2. أضف دوال جديدة في `cost-studies.ts`:

   ```typescript
   export async function getCostStudyStructuralItems(studyId: string, organizationId: string) {
     return db.structuralItem.findMany({
       where: { costStudyId: studyId, costStudy: { organizationId } },
       orderBy: { sortOrder: "asc" }, // أو كما هو مُرتب حالياً
     });
   }
   
   export async function getCostStudyFinishingItems(studyId: string, organizationId: string) {
     return db.finishingItem.findMany({
       where: { costStudyId: studyId, costStudy: { organizationId } },
       orderBy: { sortOrder: "asc" },
     });
   }
   
   export async function getCostStudyMEPItems(studyId: string, organizationId: string) {
     return db.mEPItem.findMany({
       where: { costStudyId: studyId, costStudy: { organizationId } },
       orderBy: { sortOrder: "asc" },
     });
   }
   
   export async function getCostStudyLaborItems(studyId: string, organizationId: string) { /* ... */ }
   export async function getCostStudyQuotes(studyId: string, organizationId: string) { /* ... */ }
   export async function getCostStudyCostingItems(studyId: string, organizationId: string) { /* ... */ }
   export async function getCostStudyManualItems(studyId: string, organizationId: string) { /* ... */ }
   ```

   **مهم:** اقرأ الكود الحالي لمعرفة:
   - ترتيب العناصر (orderBy)
   - أي فلاتر إضافية (where)
   - أي علاقات فرعية (include) تحتاجها كل بنود

3. أنشئ procedures جديدة في `packages/api/modules/quantities/procedures/`:
   
   أنشئ ملفات:
   - `get-structural-items.ts`
   - `get-finishing-items.ts`
   - `get-mep-items.ts`
   - `get-labor-items.ts`
   - `get-costing-items.ts`
   - `get-manual-items.ts`
   
   كل ملف يتبع نمط الـ procedures الموجودة:
   ```typescript
   export const getStructuralItems = protectedProcedure
     .input(z.object({
       organizationId: z.string(),
       costStudyId: z.string(),
     }))
     .handler(async ({ input, context }) => {
       await verifyOrganizationAccess(input.organizationId, context.user.id, {
         section: "pricing", action: "studies"
       });
       const items = await getCostStudyStructuralItems(input.costStudyId, input.organizationId);
       return items.map(convertStructuralItemDecimals);
     });
   ```

4. سجّل الـ procedures الجديدة في الـ router

5. **حدّث مكونات الـ Frontend:**
   
   في كل من المحررات الثلاثة (StructuralItemsEditor, FinishingItemsEditor, MEPItemsEditor):
   - بدلاً من أخذ البنود من `study.structuralItems`:
   ```typescript
   // قبل
   const { data: study } = useQuery(...getById...);
   const items = study?.structuralItems;
   
   // بعد
   const { data: study } = useQuery(...getById...);
   const { data: items } = useQuery({
     queryKey: ["cost-study", studyId, "structural-items"],
     queryFn: () => orpc.pricing.studies.getStructuralItems({ organizationId, costStudyId: studyId }),
     enabled: !!studyId,
   });
   ```
   
   **انتبه:** اقرأ الكود الفعلي — ربما الاستدعاء مختلف. تتبع النمط الموجود.

═══ المهمة 6B: تجميع recalculateCostStudyTotals في transaction ═══

اقرأ دالة `recalculateCostStudyTotals()` في cost-studies.ts.

**الوضع الحالي:** 4 استعلامات aggregate منفصلة:
```typescript
const structural = await db.structuralItem.aggregate({ _sum: { totalCost: true } });
const finishing = await db.finishingItem.aggregate({ _sum: { totalCost: true } });
const mep = await db.mEPItem.aggregate({ _sum: { totalCost: true }, where: { isEnabled: true } });
const labor = await db.laborItem.aggregate({ _sum: { totalCost: true } });
// ثم update
```

**المطلوب:** لفّ كل الاستعلامات في `db.$transaction()`:

```typescript
export async function recalculateCostStudyTotals(studyId: string, organizationId: string) {
  return db.$transaction(async (tx) => {
    const [structural, finishing, mep, labor] = await Promise.all([
      tx.structuralItem.aggregate({
        where: { costStudyId: studyId },
        _sum: { totalCost: true },
      }),
      tx.finishingItem.aggregate({
        where: { costStudyId: studyId },
        _sum: { totalCost: true },
      }),
      tx.mEPItem.aggregate({
        where: { costStudyId: studyId, isEnabled: true },
        _sum: { totalCost: true },
      }),
      tx.laborItem.aggregate({
        where: { costStudyId: studyId },
        _sum: { totalCost: true },
      }),
    ]);

    const structuralCost = structural._sum.totalCost ?? 0;
    const finishingCost = finishing._sum.totalCost ?? 0;
    const mepCost = mep._sum.totalCost ?? 0;
    const laborCost = labor._sum.totalCost ?? 0;

    // ... باقي الحسابات كما هي ...

    return tx.costStudy.update({
      where: { id: studyId },
      data: { structuralCost, finishingCost, mepCost, laborCost, totalCost, /* ... */ },
    });
  });
}
```

**انتبه:** اقرأ الكود الحالي بالكامل — ربما هناك حسابات إضافية (overhead, profit, contingency, VAT). حافظ على كل المنطق الحالي، فقط لفّه في transaction واستخدم `Promise.all` للاستعلامات المتوازية.

═══ التحقق ═══

```bash
cd packages/database && pnpm type-check
cd packages/api && pnpm type-check
cd apps/web && pnpm type-check
```

إذا كان هناك unit tests:
```bash
pnpm test
```
```

---

# ════════════════════════════════════════════════════════════════
# المرحلة 7: ترجمة رسائل خطأ API + تحسينات أخيرة
# Phase 7: API Error i18n + Final Polish
# الوقت المتوقع: 30-40 دقيقة
# ════════════════════════════════════════════════════════════════

```
ابدأ بوضع Plan Mode واقرأ هذه الملفات:
- اقرأ أي 5 ملفات procedures في packages/api/modules/quantities/procedures/ وابحث عن ORPCError
- اقرأ كيف يتم التعامل مع الأخطاء في Frontend (ابحث عن onError في أي مكون pricing)

المطلوب مهمتان:

═══ المهمة 7A: إنشاء ثوابت رسائل الخطأ ═══

أنشئ ملف:
`packages/api/modules/quantities/lib/error-messages.ts`

```typescript
// رسائل خطأ موحدة — يمكن توسيعها لتدعم i18n لاحقاً
export const STUDY_ERRORS = {
  NOT_FOUND: "STUDY_NOT_FOUND",
  ITEM_NOT_FOUND: "ITEM_NOT_FOUND",
  QUOTE_NOT_FOUND: "QUOTE_NOT_FOUND",
  TEMPLATE_NOT_FOUND: "TEMPLATE_NOT_FOUND",
  ACCESS_DENIED: "ACCESS_DENIED",
  INVALID_STAGE: "INVALID_STAGE",
  ALREADY_EXISTS: "ALREADY_EXISTS",
} as const;
```

═══ المهمة 7B: توحيد رسائل الخطأ في الـ procedures ═══

ابحث عن كل ORPCError:
```bash
grep -rn "ORPCError" packages/api/modules/quantities/ --include="*.ts"
```

في كل موضع:
- بدّل الرسالة العربية المباشرة بثابت:

قبل:
```typescript
throw new ORPCError("NOT_FOUND", { message: "دراسة التكلفة غير موجودة" });
```

بعد:
```typescript
throw new ORPCError("NOT_FOUND", { message: STUDY_ERRORS.NOT_FOUND });
```

**ملاحظة:** الـ Frontend يعرض `error.message` في toast. بتغيير الرسالة إلى مفتاح (key)، يجب على الـ Frontend أن يترجم هذا المفتاح. لكن هذا تحسين مستقبلي — حالياً نوحّد المفاتيح فقط، والـ Frontend سيعرض المفتاح كما هو (وهذا مقبول مؤقتاً لأن الأخطاء نادرة).

**بديل أسهل:** إذا أردت الإبقاء على رسائل مقروءة:
```typescript
export const STUDY_ERRORS = {
  NOT_FOUND: "Cost study not found | دراسة التكلفة غير موجودة",
  ITEM_NOT_FOUND: "Item not found | البند غير موجود",
  // ...
};
```

═══ التحقق النهائي الشامل ═══

```bash
# Type check كل الحزم
cd packages/database && pnpm type-check
cd packages/api && pnpm type-check  
cd apps/web && pnpm type-check

# Build (اختياري لكن مُستحسن)
pnpm build

# Tests
pnpm test
```

تحقق أنه لا يوجد أخطاء. أصلح أي أخطاء.
```

---

# ════════════════════════════════════════════════════════════════
# ملخص المراحل
# ════════════════════════════════════════════════════════════════

```
المرحلة 1: حذف الكود الميت (_deprecated) .................. 15-20 دقيقة
المرحلة 2: استخراج الثوابت المكررة (4 مهام) ............... 30-40 دقيقة
المرحلة 3: دوال Decimal + تصحيح procedure types ........... 45-60 دقيقة
المرحلة 4: Zod validation + توحيد batch responses ......... 30-40 دقيقة
المرحلة 5: ترجمة مكونات MEP (3 مهام) ..................... 45-60 دقيقة
المرحلة 6: الأداء — lazy loading + transaction ............ 60-90 دقيقة
المرحلة 7: رسائل خطأ API + تنظيف نهائي .................. 30-40 دقيقة
─────────────────────────────────────────────────────────────────
الإجمالي: ~4-6 ساعات

المشاكل المحلولة:
✅ C1: تحميل كل البنود دفعة واحدة → lazy loading (المرحلة 6)
✅ C2: نصوص عربية مباشرة في MEP → useTranslations (المرحلة 5)
✅ C3: كود مهمل ~2,667 سطر → محذوف (المرحلة 1)
✅ M1: تكرار fmt() → formatNumber موحدة (المرحلة 2)
✅ M2: تكرار SECTION_LABELS → ملف مشترك (المرحلة 2)
✅ M3: تكرار ICON_MAP → ملف مشترك (المرحلة 2)
✅ M4: تكرار Decimal conversion → دوال مساعدة (المرحلة 3)
✅ M5: مفاتيح ترجمة مكررة → مسار واحد (المرحلة 5)
✅ M6: subscriptionProcedure للقراءة → protectedProcedure (المرحلة 3)
✅ M7: غياب .min(0) → تحسين Zod schemas (المرحلة 4)
✅ L1: batch response بدون تفاصيل → count مُضاف (المرحلة 4)
✅ L2: رسائل خطأ عربية فقط → مفاتيح موحدة (المرحلة 7)
✅ L3: أسماء أنواع متشابهة → CalcInput renamed (المرحلة 2)
✅ 9.2: recalculate بـ 4 queries → transaction + Promise.all (المرحلة 6)
```
