# برومبتات تنفيذ إصلاح قسم دراسات التكلفة — مسار
# Pricing/Studies Module Fix — Claude Code Execution Prompts

> **ملاحظة:** كل مرحلة مستقلة. نفّذ مرحلة واحدة ← راجع النتيجة ← ثم انتقل للتالية.
> **ملاحظة:** أعلم جوّدت بالانتهاء من كل مرحلة قبل الانتقال للتالية.
> **ملاحظة:** المراحل 1-7 = إصلاح الكود. المراحل 8-10 = إعادة تصميم الواجهة.

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

# ════════════════════════════════════════════════════════════════════════════
# ██████████████████████████████████████████████████████████████████████████
#                    إعادة تصميم الواجهة (المراحل 8-10)
#                    UI REDESIGN (Phases 8-10)
# ██████████████████████████████████████████████████████████████████████████
# ════════════════════════════════════════════════════════════════════════════

> **⚠️ قاعدة ذهبية:** لا نحذف أي مكون موجود. لا نعيد كتابة أي محرك حساب.
> نحن فقط نُعيد ترتيب الواجهة ونُحسّن التنقل. كل المكونات الموجودة
> (StructuralItemsEditor, BuildingSetupWizard, FinishingItemsEditor, MEPItemsEditor,
> QuantitiesDashboard, CostingPageContent, SellingPricePageContent, etc.)
> تبقى كما هي 100% — فقط نضعها في إطار أجمل وأوضح.

---

# ════════════════════════════════════════════════════════════════
# المرحلة 8: إنشاء مكون التنقل الجديد (Study Pipeline Stepper)
# Phase 8: New Navigation — Pipeline Stepper + Study Overview
# الوقت المتوقع: 60-90 دقيقة
# ════════════════════════════════════════════════════════════════

```
ابدأ بوضع Plan Mode واقرأ هذه الملفات بالكامل أولاً:
- apps/web/modules/saas/pricing/components/shell/PricingShell.tsx
- apps/web/modules/saas/pricing/components/shell/PricingNavigation.tsx
- apps/web/modules/saas/pricing/components/shell/PricingSubPageHeader.tsx
- apps/web/modules/saas/pricing/components/shell/constants.ts
- apps/web/modules/saas/pricing/components/studies/CostStudyOverview.tsx
- apps/web/modules/saas/pricing/components/studies/StudyHeaderCard.tsx
- apps/web/modules/saas/pricing/components/studies/SummaryStatsCards.tsx
- app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[studyId]/page.tsx

واقرأ أيضاً كنماذج لمكونات shadcn المتاحة:
- ابحث عن Tabs component: grep -r "from.*@/components/ui/tabs" apps/web/ --include="*.tsx" -l (واقرأ أول نتيجة)
- ابحث عن Badge component: grep -r "from.*@/components/ui/badge" apps/web/ --include="*.tsx" -l (واقرأ أول نتيجة)
- ابحث عن Card component: grep -r "from.*@/components/ui/card" apps/web/ --include="*.tsx" -l (واقرأ أول نتيجة)

المطلوب 3 مهام:

═══ المهمة 8A: إنشاء مكون StudyPipelineStepper ═══

أنشئ ملف جديد:
`apps/web/modules/saas/pricing/components/studies/StudyPipelineStepper.tsx`

هذا مكون يعرض مراحل الدراسة كشريط تقدم أفقي (Stepper) في أعلى كل صفحة داخل الدراسة.

**التصميم:**

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│   ① الكميات ──────── ② المواصفات ──────── ③ التكلفة ──────── ④ السعر ──────── ⑤ العرض   │
│   ✅ مكتمل          ● الحالي             ○ قادم             ○ قادم            ○ قادم    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**المواصفات التقنية:**

```typescript
"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils"; // أو المسار الصحيح لدالة cn
import { Calculator, ClipboardList, Coins, Tag, FileText } from "lucide-react";

// المراحل الخمس
const PIPELINE_STEPS = [
  { id: "quantities",      icon: Calculator,     pathSuffix: "" },           // الصفحة الافتراضية للدراسة
  { id: "specifications",  icon: ClipboardList,  pathSuffix: "/specifications" },
  { id: "costing",         icon: Coins,          pathSuffix: "/costing" },
  { id: "selling-price",   icon: Tag,            pathSuffix: "/selling-price" },
  { id: "quotation",       icon: FileText,       pathSuffix: "/pricing" },   // أو /quotation حسب المسار الحالي
] as const;

interface StudyPipelineStepperProps {
  studyId: string;
  organizationSlug: string;
  // يمكن تمرير currentStage من الـ study data لتحديد أي مراحل مكتملة
  completedStages?: string[];
}

export function StudyPipelineStepper({ studyId, organizationSlug, completedStages = [] }: StudyPipelineStepperProps) {
  const t = useTranslations("pricing.studies.pipeline");
  const pathname = usePathname();
  
  const basePath = `/${organizationSlug}/pricing/studies/${studyId}`;
  
  // حدد المرحلة الحالية من الـ pathname
  // ...
  
  return (
    // شريط أفقي بخلفية خفيفة
    // كل خطوة: أيقونة + اسم + خط يربط بالتالية
    // الخطوة المكتملة: لون أخضر/أساسي + ✓
    // الخطوة الحالية: لون أساسي مع تأثير active
    // الخطوة القادمة: رمادي باهت
    // كل خطوة هي Link يوجّه للصفحة المناسبة
    // RTL-aware: الاتجاه من اليمين لليسار
  );
}
```

**تعليمات التصميم:**
- استخدم `cn()` للأنماط الشرطية (هذا النمط مستخدم في كل المشروع)
- استخدم Tailwind فقط — لا CSS modules
- اجعل المكون responsive: على الشاشات الصغيرة، الأيقونات فقط بدون نصوص
- الألوان: استخدم `bg-primary` و `text-primary` و `text-muted-foreground` (ألوان shadcn)
- الخط بين الخطوات: `<div className="h-0.5 flex-1 bg-border" />` أو مشابه
- RTL: استخدم `flex-row-reverse` أو `direction: rtl` حسب ما يفعله المشروع (اقرأ كيف يتعاملون مع RTL)

**أضف مفاتيح الترجمة في ar.json و en.json:**
```json
"pricing.studies.pipeline": {
  "quantities": "الكميات",
  "specifications": "المواصفات",
  "costing": "تسعير التكلفة",
  "sellingPrice": "سعر البيع",
  "quotation": "عرض السعر",
  "completed": "مكتمل",
  "current": "الحالي",
  "upcoming": "قادم"
}
```

═══ المهمة 8B: إنشاء مكون QuantitiesSubTabs ═══

أنشئ ملف جديد:
`apps/web/modules/saas/pricing/components/studies/QuantitiesSubTabs.tsx`

هذا مكون يعرض tabs فرعية داخل مرحلة "الكميات":

```
┌────────────────────────────────────────────────────────────┐
│  [🏗️ إنشائي]    [🎨 تشطيبات]    [⚡ كهروميكانيكية]    [📋 ملخص]  │
└────────────────────────────────────────────────────────────┘
```

**المواصفات:**

```typescript
"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building2, PaintBucket, Zap, FileSpreadsheet } from "lucide-react";

interface QuantitiesSubTabsProps {
  studyId: string;
  organizationSlug: string;
  defaultTab?: string;
  children?: React.ReactNode; // لا نستخدمه — كل tab يحمّل مكونه
}
```

**مهم جداً:** هذا المكون يستخدم shadcn Tabs (Client-side tabs، ليس routes).
كل tab يعرض المكون الموجود حالياً:
- tab "structural" → يعرض `<StructuralItemsEditor />` **كما هو بدون أي تعديل**
- tab "finishing" → يعرض `<FinishingItemsEditor />` **كما هو بدون أي تعديل**
- tab "mep" → يعرض `<MEPItemsEditor />` **كما هو بدون أي تعديل**
- tab "summary" → يعرض `<QuantitiesList />` أو ملخص الكميات **كما هو**

اقرأ المكونات الموجودة لمعرفة الـ props التي تحتاجها وابعثها لها.

═══ المهمة 8C: تحديث صفحة النظرة العامة (Study Overview) ═══

اقرأ الملف:
`app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[studyId]/page.tsx`

واقرأ:
`apps/web/modules/saas/pricing/components/studies/CostStudyOverview.tsx`

**الوضع الحالي:** هذه الصفحة تعرض نظرة عامة + تنقل بالـ tabs القديمة.

**المطلوب:** حوّلها لتعرض:

1. **StudyHeaderCard** في الأعلى (الموجود حالياً — لا تغييره)
2. **StudyPipelineStepper** تحته (المكون الجديد من المهمة 8A)
3. **QuantitiesSubTabs** كمحتوى افتراضي (المكون الجديد من المهمة 8B)

بحيث يكون التخطيط:

```
┌─────────────────────────────────────────────────┐
│  StudyHeaderCard                                │
│  (اسم الدراسة + المشروع + التاريخ + الحالة)     │
├─────────────────────────────────────────────────┤
│  StudyPipelineStepper                           │
│  ① الكميات ● ── ② المواصفات ── ③ التكلفة ──    │
├─────────────────────────────────────────────────┤
│  SummaryStatsCards                              │
│  (بطاقات إحصائيات — الموجودة حالياً)             │
├─────────────────────────────────────────────────┤
│  QuantitiesSubTabs                              │
│  [إنشائي] [تشطيبات] [كهروميكانيكية] [ملخص]     │
│  ┌─────────────────────────────────────────┐    │
│  │  <StructuralItemsEditor />              │    │
│  │  أو <FinishingItemsEditor />            │    │
│  │  أو <MEPItemsEditor />                  │    │
│  │  (حسب الـ tab المختار)                   │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

**تعليمات مهمة:**
- لا تحذف CostStudyOverview.tsx — يمكنك تعديله أو إنشاء ملف جديد يلفّه
- لا تحذف SummaryStatsCards — أعد استخدامه
- لا تحذف StudyHeaderCard — أعد استخدامه
- المكونات الداخلية (StructuralItemsEditor, FinishingItemsEditor, MEPItemsEditor) تبقى بدون أي تعديل

═══ التحقق ═══

```bash
cd apps/web && pnpm type-check
```

تحقق أن الصفحة تعمل بتشغيل `pnpm dev` وفتح أي دراسة.
```

---

# ════════════════════════════════════════════════════════════════
# المرحلة 9: توحيد صفحات الدراسة تحت التنقل الجديد
# Phase 9: Unify Study Pages Under New Navigation
# الوقت المتوقع: 60-90 دقيقة
# ════════════════════════════════════════════════════════════════

```
ابدأ بوضع Plan Mode واقرأ هذه الملفات أولاً:

صفحات الدراسة الحالية:
- app/.../pricing/studies/[studyId]/page.tsx (النظرة العامة — عدّلناها في المرحلة 8)
- app/.../pricing/studies/[studyId]/structural/page.tsx
- app/.../pricing/studies/[studyId]/finishing/page.tsx
- app/.../pricing/studies/[studyId]/mep/page.tsx
- app/.../pricing/studies/[studyId]/quantities/page.tsx
- app/.../pricing/studies/[studyId]/specifications/page.tsx
- app/.../pricing/studies/[studyId]/costing/page.tsx
- app/.../pricing/studies/[studyId]/selling-price/page.tsx
- app/.../pricing/studies/[studyId]/pricing/page.tsx

وملفات التنقل القديمة:
- apps/web/modules/saas/pricing/components/shell/constants.ts (ابحث عن tabs/navigation links)
- apps/web/modules/saas/pricing/components/shell/PricingNavigation.tsx

المطلوب 3 مهام:

═══ المهمة 9A: تحديث صفحات المراحل لتستخدم التنقل الجديد ═══

كل صفحة من صفحات المراحل (specifications, costing, selling-price, pricing) يجب أن تعرض:
1. StudyHeaderCard (كما في الصفحة الرئيسية)
2. StudyPipelineStepper (مع المرحلة الحالية محددة)
3. محتوى الصفحة الأصلي بدون تغيير

**لصفحة specifications/page.tsx:**
```typescript
// اقرأ الصفحة الحالية أولاً
// أضف StudyPipelineStepper فوق المحتوى الحالي
// لا تعدّل المحتوى الأصلي — فقط أضف الـ stepper

export default async function SpecificationsPage({ params }: { params: { studyId: string; organizationSlug: string } }) {
  return (
    <div className="space-y-6">
      {/* Header — أعد استخدام نفس الطريقة المستخدمة في الصفحة الرئيسية */}
      <StudyPageShell studyId={params.studyId} organizationSlug={params.organizationSlug} currentStep="specifications">
        {/* المحتوى الأصلي — كما كان بالضبط */}
        <SpecificationsPageContent ... />
      </StudyPageShell>
    </div>
  );
}
```

**الأفضل: أنشئ مكون StudyPageShell مشترك:**

أنشئ ملف:
`apps/web/modules/saas/pricing/components/studies/StudyPageShell.tsx`

```typescript
"use client";

interface StudyPageShellProps {
  studyId: string;
  organizationSlug: string;
  currentStep: "quantities" | "specifications" | "costing" | "selling-price" | "quotation";
  children: React.ReactNode;
}

export function StudyPageShell({ studyId, organizationSlug, currentStep, children }: StudyPageShellProps) {
  // اقرأ بيانات الدراسة (نفس الـ query المستخدم حالياً)
  // ...
  
  return (
    <div className="space-y-6">
      <StudyHeaderCard study={study} />
      <StudyPipelineStepper 
        studyId={studyId} 
        organizationSlug={organizationSlug} 
        currentStep={currentStep}
        completedStages={...}  // من بيانات الدراسة
      />
      {children}
    </div>
  );
}
```

ثم استخدمه في كل صفحة:
- [studyId]/page.tsx → `<StudyPageShell currentStep="quantities">` + `<QuantitiesSubTabs />`
- specifications/page.tsx → `<StudyPageShell currentStep="specifications">` + محتوى المواصفات الحالي
- costing/page.tsx → `<StudyPageShell currentStep="costing">` + محتوى التكلفة الحالي
- selling-price/page.tsx → `<StudyPageShell currentStep="selling-price">` + محتوى السعر الحالي
- pricing/page.tsx → `<StudyPageShell currentStep="quotation">` + محتوى العرض الحالي

═══ المهمة 9B: إزالة الصفحات المكررة ═══

بعد دمج الإنشائي/التشطيبات/MEP في QuantitiesSubTabs:

الصفحات التالية أصبحت **غير ضرورية** لأن محتواها مدمج في الصفحة الرئيسية:
- `[studyId]/structural/page.tsx`
- `[studyId]/finishing/page.tsx`
- `[studyId]/mep/page.tsx`

**لكن لا تحذفها مباشرة.** بدلاً من ذلك:
- حوّل كل منها إلى redirect للصفحة الرئيسية:

```typescript
// structural/page.tsx
import { redirect } from "next/navigation";

export default function StructuralPage({ params }: { params: { studyId: string; organizationSlug: string } }) {
  redirect(`/${params.organizationSlug}/pricing/studies/${params.studyId}`);
}
```

هذا يضمن أن أي روابط قديمة أو bookmarks لن تنكسر.

نفس الشيء لـ:
- `quantities/page.tsx` → redirect مع query param `?tab=summary`
  (أو اتركها إذا كانت تعرض شيئاً مختلفاً عن الملخص)

═══ المهمة 9C: تحديث التنقل في PricingNavigation/constants ═══

اقرأ ملف constants.ts في shell/ — من المحتمل يحتوي على تعريف روابط التنقل (tabs/links) للدراسة.

عدّل الروابط لتعكس الهيكل الجديد:

```typescript
// قبل (مثال):
export const STUDY_TABS = [
  { id: "overview", ... },
  { id: "structural", ... },
  { id: "finishing", ... },
  { id: "mep", ... },
  { id: "quantities", ... },
  { id: "specifications", ... },
  { id: "costing", ... },
  { id: "selling-price", ... },
  { id: "pricing", ... },
];

// بعد:
export const STUDY_PIPELINE_STEPS = [
  { id: "quantities",     label: "الكميات",        path: "" },
  { id: "specifications", label: "المواصفات",      path: "/specifications" },
  { id: "costing",        label: "تسعير التكلفة",  path: "/costing" },
  { id: "selling-price",  label: "سعر البيع",      path: "/selling-price" },
  { id: "quotation",      label: "عرض السعر",      path: "/pricing" },
];
```

**انتبه:** اقرأ الكود الفعلي. ربما التنقل مبني بطريقة مختلفة. المهم هو أن المستخدم يرى 5 خطوات فقط بدلاً من 8+ tabs.

═══ التحقق ═══

```bash
cd apps/web && pnpm type-check
```

تحقق يدوياً:
- افتح أي دراسة → يجب أن ترى الـ stepper + tabs الكميات
- انقر "المواصفات" في الـ stepper → يجب أن ينتقل لصفحة المواصفات مع الـ stepper
- انقر "التكلفة" → صفحة التكلفة مع الـ stepper
- الروابط القديمة (structural/, finishing/, mep/) → يجب أن تعيد التوجيه
```

---

# ════════════════════════════════════════════════════════════════
# المرحلة 10: تحسين صفحة قائمة الدراسات + إنشاء دراسة جديدة
# Phase 10: Study List + Create Study Polish
# الوقت المتوقع: 45-60 دقيقة
# ════════════════════════════════════════════════════════════════

```
ابدأ بوضع Plan Mode واقرأ هذه الملفات أولاً:
- app/.../pricing/studies/page.tsx (صفحة قائمة الدراسات)
- apps/web/modules/saas/pricing/components/studies/CostStudyCard.tsx
- apps/web/modules/saas/pricing/components/studies/CreateCostStudyDialog.tsx
- apps/web/modules/saas/pricing/components/studies/CreateCostStudyForm.tsx
- app/.../pricing/studies/new/page.tsx

المطلوب 3 مهام:

═══ المهمة 10A: تحسين بطاقة الدراسة (CostStudyCard) ═══

اقرأ CostStudyCard.tsx بالكامل وحسّنه:

**أضف شريط تقدم مصغّر** يعرض أي مرحلة وصلت لها الدراسة:

```
┌──────────────────────────────────────────────────┐
│  📐 فيلا حي النرجس                      ⋮ menu │
│  العميل: شركة الأمل                              │
│                                                  │
│  ① ● ── ② ● ── ③ ○ ── ④ ○ ── ⑤ ○               │
│  الكميات  المواصفات  التكلفة  السعر  العرض        │
│                                                  │
│  ┌──────────┬──────────┬──────────┐              │
│  │ إنشائي   │ تشطيبات  │ MEP      │              │
│  │ 23 بند   │ 98 بند   │ 35 بند   │              │
│  └──────────┴──────────┴──────────┘              │
│                                                  │
│  التكلفة: 630,000 ر.س    آخر تعديل: منذ ساعتين  │
└──────────────────────────────────────────────────┘
```

**تعليمات:**
- اقرأ المكون الحالي أولاً — حافظ على كل المعلومات الموجودة
- أضف Mini Pipeline (أيقونات صغيرة ● ● ○ ○ ○ بخط يربطها)
- أضف عدّاد البنود لكل قسم (إذا كانت البيانات متاحة)
- استخدم نفس أنماط الألوان الموجودة في المشروع
- لا تغيّر حجم البطاقة بشكل جذري — فقط أضف المعلومات المفيدة

═══ المهمة 10B: تحسين حوار إنشاء دراسة جديدة ═══

اقرأ CreateCostStudyDialog.tsx و CreateCostStudyForm.tsx بالكامل.

**الوضع الحالي:** حوار بسيط لإدخال اسم الدراسة وربما بعض البيانات.

**المطلوب: أضف اختيار "طريقة البدء"** بعد الحقول الموجودة:

```
┌──────────────────────────────────────────────────────────────┐
│  إنشاء دراسة جديدة                                    ✕    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  اسم الدراسة: [فيلا حي النرجس_______________]               │
│  نوع المشروع: [فيلا ▾]                                      │
│  (+ أي حقول موجودة حالياً — لا تحذفها)                       │
│                                                              │
│  ── كيف تريد البدء؟ ─────────────────────────                │
│                                                              │
│  ┌───────────────────┐  ┌───────────────────┐                │
│  │  🏗️ حساب ذكي      │  │  ✏️ إدخال يدوي    │                │
│  │                   │  │                   │                │
│  │  أدخل معلومات     │  │  أضف بنود         │                │
│  │  المبنى وسنحسب    │  │  الكميات مباشرة   │                │
│  │  لك الكميات       │  │                   │                │
│  │  تلقائياً          │  │                   │                │
│  │                   │  │                   │                │
│  │  [● محدد]         │  │  [○]              │                │
│  └───────────────────┘  └───────────────────┘                │
│                                                              │
│                              [إلغاء]  [✅ إنشاء الدراسة]     │
└──────────────────────────────────────────────────────────────┘
```

**التنفيذ:**
- أضف حقل `quantityMethod` في الـ form: `"SMART"` أو `"MANUAL"`
- الافتراضي: `"SMART"` (الحساب الذكي — هذه الميزة المميزة لمسار)
- بعد الإنشاء:
  - إذا SMART → ينتقل لصفحة الدراسة (tab التشطيبات/المعالج)
  - إذا MANUAL → ينتقل لصفحة الدراسة (tab الإنشائي أو tab الملخص)

**ملاحظة:** لا تحتاج تغيير الـ API لإنشاء الدراسة — فقط خزّن الاختيار في state أو query param واستخدمه للتوجيه بعد الإنشاء.

═══ المهمة 10C: تحسين صفحة القائمة (Studies List) ═══

اقرأ صفحة قائمة الدراسات ومكوناتها.

**تحسينات:**
1. أضف فلتر بحسب الحالة (مسودة / جاري العمل / مكتملة / تم التحويل لمشروع)
2. أضف شريط إحصائيات سريع في الأعلى:

```
┌──────────────────────────────────────────────────────────────┐
│  دراسات التكلفة                          [+ دراسة جديدة]   │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ 12 دراسة   │  │ 5 مكتملة   │  │ 3 محوّلة   │             │
│  │ إجمالي     │  │            │  │ لمشاريع    │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│                                                              │
│  [الكل] [مسودة] [جاري العمل] [مكتملة]     [🔍 بحث...]      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ CostStudyCard│  │ CostStudyCard│  │ CostStudyCard│       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ CostStudyCard│  │ CostStudyCard│  │ CostStudyCard│       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

**تعليمات:**
- إذا كان هناك فلتر حالي → حسّنه
- إذا لم يكن → أضف فلتر tabs بسيط (client-side filtering — لا API جديد)
- استخدم shadcn Badge للأرقام
- البطاقات في grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

═══ التحقق النهائي ═══

```bash
cd apps/web && pnpm type-check
pnpm build  # Build كامل للتأكد
```

تحقق يدوياً من كل السيناريوهات:
1. افتح قائمة الدراسات → البطاقات تظهر بالتصميم الجديد
2. أنشئ دراسة جديدة → الحوار يعرض اختيار طريقة البدء
3. افتح دراسة → الـ stepper ظاهر + الـ sub-tabs تعمل
4. انقر tab إنشائي → StructuralItemsEditor يظهر كما كان
5. انقر tab تشطيبات → BuildingSetupWizard/FinishingItemsEditor يظهر كما كان
6. انقر tab كهروميكانيكية → MEPItemsEditor يظهر كما كان
7. انقل بين المراحل عبر الـ stepper → كل صفحة تعمل
8. الروابط القديمة (structural/, finishing/, mep/) → redirect يعمل
```

---

# ════════════════════════════════════════════════════════════════
# ملخص كل المراحل (1-10)
# ════════════════════════════════════════════════════════════════

```
═══ إصلاح الكود (المراحل 1-7) ═══
المرحلة 1:  حذف الكود الميت (_deprecated) .................. 15-20 دقيقة
المرحلة 2:  استخراج الثوابت المكررة (4 مهام) ............... 30-40 دقيقة
المرحلة 3:  دوال Decimal + تصحيح procedure types ........... 45-60 دقيقة
المرحلة 4:  Zod validation + توحيد batch responses ......... 30-40 دقيقة
المرحلة 5:  ترجمة مكونات MEP (3 مهام) ..................... 45-60 دقيقة
المرحلة 6:  الأداء — lazy loading + transaction ............ 60-90 دقيقة
المرحلة 7:  رسائل خطأ API + تنظيف نهائي .................. 30-40 دقيقة

═══ إعادة تصميم الواجهة (المراحل 8-10) ═══
المرحلة 8:  Pipeline Stepper + Sub-tabs + Study Overview .... 60-90 دقيقة
المرحلة 9:  توحيد الصفحات + Redirects + تنقل جديد ......... 60-90 دقيقة
المرحلة 10: بطاقة الدراسة + حوار الإنشاء + قائمة محسّنة .... 45-60 دقيقة
─────────────────────────────────────────────────────────────────
الإجمالي: ~7-10 ساعات

═══ المشاكل المحلولة ═══

إصلاحات الكود:
✅ C1: تحميل كل البنود دفعة واحدة → lazy loading (المرحلة 6)
✅ C2: نصوص عربية مباشرة في MEP → useTranslations (المرحلة 5)
✅ C3: كود مهمل ~2,667 سطر → محذوف (المرحلة 1)
✅ M1-M7: كل المشاكل المتوسطة → محلولة (المراحل 2-5)
✅ L1-L4: كل المشاكل البسيطة → محلولة (المراحل 2-7)
✅ 9.2: recalculate بـ 4 queries → transaction + Promise.all (المرحلة 6)

تحسينات الواجهة:
✅ تنقل مشتت (8+ tabs) → Pipeline Stepper واضح (5 خطوات) (المرحلة 8)
✅ صفحات منفصلة (structural/finishing/mep) → Sub-tabs مدمجة (المرحلة 8)
✅ كل صفحة بتنقل مختلف → StudyPageShell موحّد (المرحلة 9)
✅ بطاقة الدراسة بسيطة → بطاقة غنية بالمعلومات (المرحلة 10)
✅ إنشاء دراسة بدون توجيه → اختيار طريقة البدء (المرحلة 10)
✅ قائمة بدون فلاتر → فلاتر + إحصائيات (المرحلة 10)

═══ ما لم يتغير (محفوظ 100%) ═══
● StructuralItemsEditor + 7 أقسام (Foundations, Columns, Beams, Slabs, Blocks, Stairs, PlainConcrete)
● BuildingSetupWizard + 4 خطوات (BuildingStructure, Exterior, FloorDetails, Review)
● FinishingItemsEditor + QuantitiesDashboard + QuantitiesTable
● MEPItemsEditor + MEPDashboard + كل مكونات MEP
● محركات الحساب (derivation-engine, mep-derivation-engine, structural-calculations)
● نظام المواصفات (specs/, catalog/, templates)
● Pipeline components (CostingPageContent, SellingPricePageContent, etc.)
● كل الـ API endpoints + DB queries (بعد تحسينها)
● نظام الأدوار والصلاحيات
● buildingConfig كمصدر وحيد للحقيقة
```
