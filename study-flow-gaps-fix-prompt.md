# برومبت سد فجوات نظام الدراسات — 4 مراحل

> **الهدف**: إصلاح 5 فجوات في نظام إنشاء وإدارة دراسات التسعير بناءً على تقرير التحليل
> **القاعدة الذهبية**: اقرأ أولاً، لا تخمّن أبداً. لا تعدّل ملفاً قبل قراءته بالكامل.
> **التشغيل**: `$env:CLAUDE_CODE_MAX_OUTPUT_TOKENS=64000` ثم نفّذ كل Phase على حدة

---

## Phase 1: فصل COST_PRICING عن FULL_STUDY + إصلاح entryPoint

### السياق
حالياً `COST_PRICING` يُعامَل بالضبط مثل `FULL_STUDY` — نفس المراحل الـ 6، ونفس الـ `entryPoint = FROM_SCRATCH`. المطلوب: COST_PRICING يتخطى مرحلة الكميات التفصيلية (المحركات) ويبدأ من جدول فارغ يدوي، ويعرض المراحل المناسبة فقط.

### اقرأ أولاً (إلزامي)
```bash
cat apps/web/modules/saas/pricing/hooks/useStudyConfig.ts
cat packages/api/modules/quantities/procedures/create.ts
cat packages/api/modules/quantities/procedures/update-config.ts
```

### التعديلات المطلوبة

#### 1.1 تعديل `apps/web/modules/saas/pricing/hooks/useStudyConfig.ts`

**المنطق الحالي** (خاطئ):
```typescript
// COST_PRICING يقع مع FULL_STUDY في نفس case
case "FULL_STUDY":
case "FULL_PROJECT":
case "COST_PRICING":  // ← هذا هو المشكل
  return all 6 stages
```

**المطلوب**:
- افصل `COST_PRICING` في case خاص به
- المراحل المفعّلة لـ `COST_PRICING`: `["QUANTITIES", "SPECIFICATIONS", "COSTING", "PRICING", "QUOTATION", "CONVERSION"]` — نفس الـ 6 لكن مع flag خاص `isEmptyTableMode = true` (هذا موجود أصلاً ✅)
- **أو** إذا القرار التصميمي هو إخفاء Quantities: `["COSTING", "PRICING", "QUOTATION", "CONVERSION"]` — 4 مراحل فقط

**⚠️ قرار تصميمي مطلوب**: اختر أحد المسارين:
- **المسار أ** (موصى به): أبقِ الـ 6 مراحل لكن مرحلة الكميات تعرض جدول فارغ (الوضع الحالي مع تحسين الجدول — Phase 3). هذا أقل تأثيراً على الكود.
- **المسار ب**: أزل مرحلة الكميات والمواصفات من COST_PRICING واعرض 4 مراحل فقط (costing → pricing → quotation → convert). هذا يتطلب تعديل entryPoint.

**نفّذ المسار أ** — أبقِ الـ 6 مراحل مع الفروقات التالية:

```typescript
// أضف حالة خاصة لـ COST_PRICING
case "COST_PRICING": {
  return {
    enabledStageTypes: ["QUANTITIES", "SPECIFICATIONS", "COSTING", "PRICING", "QUOTATION", "CONVERSION"],
    enabledTabs: getEnabledTabs(workScopes),
    isEmptyTableMode: true,        // ← هذا موجود أصلاً ✅
    isCostPricingMode: true,       // ← flag جديد — يُستخدم لتخصيص UI
    skipCalculationEngines: true,  // ← flag جديد — يمنع تشغيل محركات الحساب
  };
}
```

**أضف** الـ flags الجديدة (`isCostPricingMode`, `skipCalculationEngines`) إلى return type الخاص بالـ hook. تأكد من إرجاع `false` لها في باقي الـ cases.

#### 1.2 لا تعدّل `create.ts` في هذه المرحلة

الـ `entryPoint` لـ COST_PRICING يبقى `FROM_SCRATCH` — لأننا في المسار أ نُبقي جميع المراحل. الفرق هو في الـ UI (جدول فارغ) وليس في الـ stages المُنشأة.

### التحقق
```bash
cd /home/user/Masar
grep -n "COST_PRICING" apps/web/modules/saas/pricing/hooks/useStudyConfig.ts
grep -n "isCostPricingMode" apps/web/modules/saas/pricing/hooks/useStudyConfig.ts
pnpm type-check 2>&1 | head -50
```

---

## Phase 2: مزامنة Sidebar مع Stepper + إصلاح PipelineBar

### السياق
- `StudyPipelineStepper` يفلتر المراحل عبر `enabledStageTypes` ✅
- `StudySidebar` يعرض جميع العناصر دائماً ويعتمد فقط على `entryPoint` — تناقض بصري
- `PipelineBar` يستخدم منطق فلترة خاص به بدل `useStudyConfig`

### اقرأ أولاً (إلزامي)
```bash
cat apps/web/modules/saas/pricing/components/studies/StudySidebar.tsx
cat apps/web/modules/saas/pricing/components/studies/StudyPipelineStepper.tsx
cat apps/web/modules/saas/pricing/components/studies/StudyPageShell.tsx
cat apps/web/modules/saas/pricing/components/pipeline/PipelineBar.tsx
```

### التعديلات المطلوبة

#### 2.1 تعديل `StudySidebar.tsx`

**الحالي**: يستخدم `ENTRY_POINT_START_INDEX` لتحديد المراحل المعطّلة بصرياً — لا يخفي أي مرحلة.

**المطلوب**:
1. استقبل prop جديد `enabledStageTypes: StageType[]` (نفس اللي يستقبله `StudyPipelineStepper`)
2. افلتر عناصر التنقل بحيث تظهر فقط المراحل الموجودة في `enabledStageTypes`
3. المراحل غير الموجودة في القائمة → **أخفِها تماماً** (لا تعطّلها بصرياً فقط)
4. عنصر "نظرة عامة" (overview) يظهر دائماً

**مثال — قبل**:
```tsx
// يعرض دائماً 7 عناصر (overview + 6 stages)
{SIDEBAR_ITEMS.map((item) => (
  <SidebarItem key={item.key} disabled={isBeforeEntryPoint(item)} />
))}
```

**مثال — بعد**:
```tsx
// يفلتر حسب enabledStageTypes
const visibleItems = SIDEBAR_ITEMS.filter(
  (item) => item.key === "overview" || enabledStageTypes.includes(item.stageType)
);
{visibleItems.map((item) => (
  <SidebarItem key={item.key} />
))}
```

#### 2.2 تعديل `StudyPageShell.tsx` — تمرير enabledStageTypes للـ Sidebar

**الحالي**: يمرر `enabledStageTypes` فقط لـ `StudyPipelineStepper`.

**المطلوب**: مرّر نفس الـ `enabledStageTypes` لـ `StudySidebar` أيضاً.

```tsx
// قبل
<StudySidebar study={study} entryPoint={entryPoint} />

// بعد
<StudySidebar study={study} entryPoint={entryPoint} enabledStageTypes={enabledStageTypes} />
```

#### 2.3 تعديل `PipelineBar.tsx` — توحيد منطق الفلترة

**الحالي**: يستخدم منطق فلترة خاص:
- LUMP_SUM_ANALYSIS: يخفي quotation، يغيّر تسمية
- QUICK_PRICING / CUSTOM_ITEMS: يعرض فقط selling-price و quotation

**المطلوب**:
1. اقرأ الملف بالكامل وافهم المنطق الحالي قبل أي تعديل
2. استبدل منطق الفلترة المحلي بقراءة `enabledStageTypes` من `useStudyConfig`
3. إذا كان `PipelineBar` يُستخدم في سياق مختلف عن StudyPageShell، استقبل `enabledStageTypes` كـ prop بدلاً من استدعاء الـ hook مباشرة
4. **حافظ** على التسميات الخاصة (مثل "الربحية" بدل "سعر البيع" لـ LUMP_SUM) — هذا label override وليس فلترة

### التحقق
```bash
# تأكد من عدم وجود منطق فلترة مكرر
grep -n "LUMP_SUM\|QUICK_PRICING\|CUSTOM_ITEMS" apps/web/modules/saas/pricing/components/pipeline/PipelineBar.tsx
grep -n "enabledStageTypes" apps/web/modules/saas/pricing/components/studies/StudySidebar.tsx
pnpm type-check 2>&1 | head -50
```

---

## Phase 3: تحسين الجدول الفارغ لـ COST_PRICING

### السياق
حالياً عندما `isEmptyTableMode = true`، كل تبويب (إنشائي/تشطيبات/MEP) يعرض نفس `ManualItemsTable` بأعمدة بسيطة (وصف، وحدة، كمية، قسم، ملاحظات). المطلوب: جدول مخصص لكل تبويب يطابق أعمدة مخرجات المحركات.

### اقرأ أولاً (إلزامي)
```bash
cat apps/web/modules/saas/pricing/components/studies/QuantitiesSubTabs.tsx
cat apps/web/modules/saas/pricing/components/quantities/ManualItemsTable.tsx

# اقرأ أعمدة مخرجات المحركات لفهم الشكل المطلوب
grep -A 30 "interface.*Result\|type.*Result" apps/web/modules/saas/pricing/utils/structural-calculations.ts | head -60
grep -A 20 "DerivedQuantity" apps/web/modules/saas/pricing/utils/derivation-engine.ts | head -40
```

### التعديلات المطلوبة

#### 3.1 إنشاء مكوّنات جداول فارغة متخصصة

أنشئ 3 مكوّنات جديدة (أو مكوّن واحد مع prop يحدد النوع — الخيار لك حسب حجم الفروقات):

**الموقع**: `apps/web/modules/saas/pricing/components/quantities/`

##### أ. `EmptyStructuralTable.tsx`
أعمدة مطابقة لمخرجات المحرك الإنشائي:
| العمود | النوع | مطلوب؟ |
|--------|-------|--------|
| الفئة (category) | select من فئات StructuralItem | ✅ |
| الوصف (description) | text | ✅ |
| الوحدة (unit) | text | ✅ |
| الكمية (quantity) | number | ✅ |
| حجم الخرسانة (concreteVolume) | number | اختياري |
| وزن الحديد (steelWeight) | number | اختياري |
| ملاحظات (notes) | text | اختياري |

##### ب. `EmptyFinishingTable.tsx`
أعمدة مطابقة لمخرجات محرك التشطيبات:
| العمود | النوع | مطلوب؟ |
|--------|-------|--------|
| الفئة (category) | select | ✅ |
| الفئة الفرعية (subCategory) | text | اختياري |
| الطابق (floorId/floorName) | select/text | اختياري |
| النطاق (scope) | select: per_floor/whole_building/external/roof | ✅ |
| الكمية (quantity) | number | ✅ |
| الوحدة (unit) | text | ✅ |
| نسبة الهدر (wastagePercent) | number, default 0 | اختياري |

##### ج. `EmptyMEPTable.tsx`
أعمدة مطابقة لمخرجات MEP:
| العمود | النوع | مطلوب؟ |
|--------|-------|--------|
| الفئة (category) | select | ✅ |
| الفئة الفرعية (subCategory) | text | اختياري |
| النوع (itemType) | text | ✅ |
| الكمية (quantity) | number | ✅ |
| الوحدة (unit) | text | ✅ |

**⚠️ مهم**:
- كل جدول يحفظ بياناته في نموذج `ManualItem` الموجود (مع `section` المناسب: STRUCTURAL/FINISHING/MEP)
- لا تنشئ نماذج DB جديدة — استخدم `ManualItem` الحالي مع حقل `metadata: Json?` إذا احتجت حقول إضافية
- اقرأ `ManualItem` model في schema.prisma أولاً لتعرف الحقول المتاحة:
  ```bash
  grep -A 15 "model ManualItem" packages/database/prisma/schema.prisma
  ```
- إذا كان `ManualItem` لا يحتوي على حقول كافية (مثل concreteVolume)، **لا تضف حقولاً للـ schema** — بدلاً من ذلك خزّن الحقول الإضافية في حقل `notes` بصيغة مقروءة أو أضف حقل `metadata Json?` إذا لم يكن موجوداً

#### 3.2 تعديل `QuantitiesSubTabs.tsx`

**الحالي**:
```tsx
if (isEmptyTableMode) {
  return <ManualItemsTable filterSection={currentTab} />;
}
```

**المطلوب**:
```tsx
if (isEmptyTableMode) {
  switch (currentTab) {
    case "structural":
      return <EmptyStructuralTable studyId={studyId} />;
    case "finishing":
      return <EmptyFinishingTable studyId={studyId} />;
    case "mep":
      return <EmptyMEPTable studyId={studyId} />;
    case "manual":
    default:
      return <ManualItemsTable filterSection={currentTab} studyId={studyId} />;
  }
}
```

#### 3.3 مفاتيح الترجمة

أضف مفاتيح ترجمة جديدة لأعمدة الجداول في **كلا الملفين**:
- `apps/web/messages/ar.json`
- `apps/web/messages/en.json`

ضع المفاتيح تحت namespace `pricing.studies.emptyTable` أو ما يشابه:
```json
{
  "pricing": {
    "studies": {
      "emptyTable": {
        "category": "الفئة",
        "description": "الوصف",
        "unit": "الوحدة",
        "quantity": "الكمية",
        "concreteVolume": "حجم الخرسانة (م³)",
        "steelWeight": "وزن الحديد (كجم)",
        "subCategory": "الفئة الفرعية",
        "floor": "الطابق",
        "scope": "النطاق",
        "wastagePercent": "نسبة الهدر %",
        "itemType": "النوع",
        "notes": "ملاحظات",
        "addRow": "إضافة صف",
        "deleteRow": "حذف",
        "noItems": "لا توجد بنود — أضف بنوداً يدوياً"
      }
    }
  }
}
```

### التحقق
```bash
# تأكد من وجود المكوّنات الجديدة
ls apps/web/modules/saas/pricing/components/quantities/Empty*.tsx

# تأكد من مفاتيح الترجمة
grep -c "emptyTable" apps/web/messages/ar.json
grep -c "emptyTable" apps/web/messages/en.json

pnpm type-check 2>&1 | head -50
```

---

## Phase 4: إصلاح قفل QUICK_PRICING + تنظيف نهائي

### السياق
- QUICK_PRICING يعرض مرحلتين فقط: pricing + quotation ✅
- لكن صفحة pricing تتحقق من اعتماد مرحلة COSTING — قد تُقفل الصفحة
- في `create.ts`، المراحل قبل entryPoint تُنشأ بحالة APPROVED تلقائياً ✅
- **المشكل المحتمل**: هل فحص الاعتماد يقرأ من StudyStage records أم من منطق آخر؟

### اقرأ أولاً (إلزامي)
```bash
cat apps/web/modules/saas/pricing/components/pricing-v2/PricingPageContentV2.tsx
cat apps/web/modules/saas/pricing/components/costing-v2/CostingPageContentV2.tsx
cat apps/web/modules/saas/pricing/components/specifications/SpecificationsPageContentV2.tsx

# تحقق من كيفية فحص اعتماد المرحلة السابقة
grep -n "APPROVED\|isApproved\|stageStatus\|previousStage\|isLocked" apps/web/modules/saas/pricing/components/pricing-v2/PricingPageContentV2.tsx
grep -n "APPROVED\|isApproved\|stageStatus\|previousStage\|isLocked" apps/web/modules/saas/pricing/components/costing-v2/CostingPageContentV2.tsx
```

### التعديلات المطلوبة

#### 4.1 فحص `PricingPageContentV2.tsx` — إصلاح القفل

**اقرأ الملف أولاً وحدد**:
1. هل يتحقق من `stages.find(s => s.stage === "COSTING")?.status === "APPROVED"`؟
2. أم يتحقق بطريقة أخرى؟

**سيناريو متوقع**: الصفحة تقرأ StudyStage records من API. بما أن `create.ts` يُنشئ المراحل المتخطاة بحالة APPROVED:
- QUICK_PRICING: entryPoint = QUOTATION_ONLY → المراحل (QUANTITIES, SPECIFICATIONS, COSTING, PRICING) = APPROVED تلقائياً
- لذلك الفحص يجب أن يمر ✅

**لكن**: QUOTATION_ONLY entry point يعني stages قبل QUOTATION = APPROVED. هل PRICING stage نفسها تكون APPROVED؟ إذا نعم، المستخدم سيرى مرحلة "مكتملة" بدل "نشطة". تحقق من هذا.

**إذا وجدت مشكلة**:
```typescript
// أضف فحص: إذا كان studyType هو QUICK_PRICING، تخطّ فحص اعتماد المرحلة السابقة
const skipApprovalCheck = studyType === "QUICK_PRICING" || studyType === "CUSTOM_ITEMS";

if (!skipApprovalCheck && previousStageStatus !== "APPROVED") {
  return <LockedStageMessage />;
}
```

**إذا لم تجد مشكلة**: وثّق ذلك في تعليق بالكود ولا تعدّل شيئاً.

#### 4.2 فحص مماثل لـ `CostingPageContentV2.tsx` و `SpecificationsPageContentV2.tsx`

نفس الفحص — تأكد أن المراحل المتخطاة لا تسبب قفل عند أنواع الدراسات التي تتخطاها.

#### 4.3 تعديل `create.ts` — إصلاح QUICK_PRICING stages (إذا لزم)

**اقرأ الملف أولاً**:
```bash
grep -A 30 "QUOTATION_ONLY\|entryPoint" packages/api/modules/quantities/procedures/create.ts
```

**تحقق**: عند `QUICK_PRICING` (entryPoint = QUOTATION_ONLY):
- المراحل (QUANTITIES, SPECIFICATIONS, COSTING) يجب أن تكون APPROVED ✅
- المرحلة PRICING يجب أن تكون **DRAFT** (نشطة) — لأن QUICK_PRICING يبدأ من pricing
- المرحلة QUOTATION يجب أن تكون **NOT_STARTED**

**⚠️ انتبه**: في التقرير QUICK_PRICING يوجّه إلى `/pricing` وليس `/quotation`. لذلك PRICING stage يجب أن تكون DRAFT وليست APPROVED.

**تحقق من الكود الفعلي**: هل `QUOTATION_ONLY` entryPoint يجعل PRICING = APPROVED أيضاً؟ إذا نعم، هذا bug — أصلحه:
```typescript
// entryPoint index لـ QUOTATION_ONLY = index of QUOTATION stage
// المراحل قبل QUOTATION (بما فيها PRICING) تصبح APPROVED
// لكن المستخدم يُوجّه لـ /pricing — تناقض!

// الحل: غيّر entryPoint لـ QUICK_PRICING من QUOTATION_ONLY إلى شيء يبدأ من PRICING
// أو: أنشئ entryPoint جديد: PRICING_ONLY
```

**⚠️ هذا قرار مهم** — اقرأ الكود أولاً وقرر:
- **خيار 1**: غيّر mapping في create.ts: `QUICK_PRICING → PRICING stage = DRAFT` (بدون تغيير enum)
- **خيار 2**: أضف منطق خاص: إذا studyType = QUICK_PRICING، اجعل PRICING = DRAFT حتى لو entryPoint يقول غير كذا

نفّذ الخيار الأبسط الذي لا يتطلب تغيير schema.

#### 4.4 اختبار شامل يدوي

بعد كل التعديلات، نفّذ:
```bash
pnpm type-check 2>&1 | tail -20
pnpm build 2>&1 | tail -20
```

ثم اكتب ملخصاً يشمل:
1. كل ملف تم تعديله مع وصف مختصر للتغيير
2. أي قرارات تصميمية اتخذتها ولماذا
3. أي مشاكل واجهتك أو pre-existing errors وجدتها
4. هل LUMP_SUM_ANALYSIS يحتاج معالجة مشابهة؟ (ملاحظة: التقرير لم يحلله بعمق)

---

## القائمة الحمراء — لا تعدّل هذه الملفات مطلقاً

| الملف | السبب |
|-------|-------|
| `apps/web/modules/saas/pricing/utils/structural-calculations.ts` | محرك حساب إنشائي (~1,538 سطر) |
| `apps/web/modules/saas/pricing/utils/derivation-engine.ts` | محرك اشتقاق تشطيبات (~2,493 سطر) |
| `packages/database/prisma/schema.prisma` | لا تعديلات على الـ schema في هذا البرومبت |
| `apps/web/modules/saas/pricing/components/quantities/StructuralItemsEditor.tsx` | محرر الكميات الإنشائية |
| `apps/web/modules/saas/pricing/components/quantities/FinishingItemsEditor.tsx` | محرر التشطيبات |
| `apps/web/modules/saas/pricing/components/quantities/MEPItemsEditor.tsx` | محرر الكهروميكانيكي |

---

## ملخص الملفات المتأثرة

| # | الملف | Phase | التعديل |
|---|-------|-------|---------|
| 1 | `hooks/useStudyConfig.ts` | 1 | فصل COST_PRICING + flags جديدة |
| 2 | `components/studies/StudySidebar.tsx` | 2 | فلترة عبر enabledStageTypes |
| 3 | `components/studies/StudyPageShell.tsx` | 2 | تمرير enabledStageTypes للـ Sidebar |
| 4 | `components/pipeline/PipelineBar.tsx` | 2 | توحيد منطق الفلترة |
| 5 | `components/studies/QuantitiesSubTabs.tsx` | 3 | استخدام جداول متخصصة |
| 6 | `components/quantities/EmptyStructuralTable.tsx` | 3 | **جديد** — جدول إنشائي فارغ |
| 7 | `components/quantities/EmptyFinishingTable.tsx` | 3 | **جديد** — جدول تشطيبات فارغ |
| 8 | `components/quantities/EmptyMEPTable.tsx` | 3 | **جديد** — جدول MEP فارغ |
| 9 | `messages/ar.json` | 3 | مفاتيح ترجمة جديدة |
| 10 | `messages/en.json` | 3 | مفاتيح ترجمة جديدة |
| 11 | `components/pricing-v2/PricingPageContentV2.tsx` | 4 | إصلاح قفل QUICK_PRICING |
| 12 | `packages/api/modules/quantities/procedures/create.ts` | 4 | إصلاح PRICING stage لـ QUICK_PRICING (إذا لزم) |

**المجموع**: 10 ملفات تعديل + 3 ملفات جديدة (أو أقل حسب ما يكتشفه الكود)
