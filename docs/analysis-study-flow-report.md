# تقرير تحليل نظام الدراسات — الوضع الحالي

> تاريخ التقرير: 2026-03-12
> الغرض: تحليل الوضع الحالي لنظام إنشاء وإدارة دراسات التسعير — بدون تنفيذ أي تغييرات

---

## 1. Schema قاعدة البيانات

### 1.1 نموذج CostStudy — الحقول المتعلقة بالنوع والنطاق

| الحقل | النوع | القيمة الافتراضية | ملاحظات |
|-------|-------|-------------------|---------|
| `studyType` | `StudyType` enum | `FULL_PROJECT` | نوع الدراسة |
| `entryPoint` | `StudyEntryPoint` enum | `FROM_SCRATCH` | نقطة البداية في المراحل |
| `quantitiesStatus` | `StageStatus` enum | `DRAFT` | حالة مرحلة الكميات |
| `specsStatus` | `StageStatus` enum | `NOT_STARTED` | حالة مرحلة المواصفات |
| `costingStatus` | `StageStatus` enum | `NOT_STARTED` | حالة مرحلة التكلفة |
| `pricingStatus` | `StageStatus` enum | `NOT_STARTED` | حالة مرحلة التسعير |
| `quotationStatus` | `StageStatus` enum | `NOT_STARTED` | حالة مرحلة عرض السعر |
| `contractValue` | `Decimal(15,2)` | `null` | قيمة العقد (للمقطوعية) |
| `costingMethod` | `String?` | `null` | `"manual"` / `"database"` / `"import"` |
| `markupMethod` | `String?` | `null` | `"uniform"` / `"per_section"` / `"manual"` |

### 1.2 قيم StudyType enum الحالية (3 قيم)

```
FULL_PROJECT        — دراسة كاملة
CUSTOM_ITEMS        — بنود مخصصة
LUMP_SUM_ANALYSIS   — تحليل مقطوعية
```

### 1.3 قيم StudyEntryPoint enum الحالية (6 قيم)

```
FROM_SCRATCH        — من الصفر (كل المراحل)
HAS_QUANTITIES      — لديّ كميات (يتخطى الكميات)
HAS_SPECS           — لديّ مواصفات (يتخطى الكميات + المواصفات)
QUOTATION_ONLY      — عرض سعر فقط (يتخطى للمرحلة 5)
LUMP_SUM_ANALYSIS   — تحليل مقطوعية (يتخطى للتكلفة)
CUSTOM_ITEMS        — بنود مخصصة (كل المراحل)
```

### 1.4 قيم StageStatus enum (4 حالات)

```
NOT_STARTED  — لم تبدأ
DRAFT        — مسودة (نشطة)
IN_REVIEW    — قيد المراجعة
APPROVED     — معتمدة
```

### 1.5 قيم StageType enum (6 مراحل)

```
QUANTITIES      — الكميات
SPECIFICATIONS  — المواصفات
COSTING         — تسعير التكلفة
PRICING         — التسعير
QUOTATION       — عرض السعر
CONVERSION      — التحويل لمشروع
```

### 1.6 هل يوجد حقل scope/نطاق عمل في CostStudy؟

**لا** — لا يوجد حقل `scope` أو `workScope` في نموذج `CostStudy` نفسه.

لكن `scope` موجود في النماذج الفرعية:
- **FinishingItem**: `scope String?` — نطاق البند (per_floor, whole_building, etc.)
- **MEPItem**: `scope String @default("per_room")` — نطاق البند

هذا يعني أن نطاق العمل المختار عند الإنشاء (إنشائي/تشطيبات/MEP/مخصص) **لا يُحفظ في قاعدة البيانات** حالياً.

### 1.7 النماذج المرتبطة

| النموذج | الوصف | حقول رئيسية |
|---------|-------|-------------|
| `StructuralItem` | بنود إنشائية | category, quantity, concreteVolume, steelWeight, totalCost |
| `FinishingItem` | بنود تشطيبات | category, floorId, area, quantity, qualityLevel, materialPrice, laborPrice |
| `MEPItem` | بنود كهروميكانيكية | category, itemType, floorId, roomId, scope, quantity |
| `LaborItem` | بنود عمالة | laborType, workerType, quantity, dailyRate, durationDays |
| `CostingItem` | بنود التكلفة | section, sourceItemId, description, quantity, materialUnitCost, laborUnitCost |
| `ManualItem` | بنود يدوية | description, unit, quantity, section, notes |
| `SectionMarkup` | هوامش القطاعات | section (STRUCTURAL/FINISHING/MEP/LABOR), markupPercent |
| `StudyStage` | سجلات المراحل | stage (StageType), status (StageStatus), assigneeId |
| `Quote` | عروض الأسعار | quoteNumber, quoteType, subtotal, totalAmount, status |
| `MaterialBOM` | قائمة المواد | materialName, quantity, unit, wastagePercent, unitPrice |
| `CostingLabor` | عمالة التكلفة | section, laborMethod, description, quantity, rate |

---

## 2. wizard الإنشاء الحالي

### 2.1 كيف يعمل حالياً

الإنشاء يتم عبر **wizard من 3 خطوات** (أحياناً خطوتين):

| الخطوة | المحتوى | ملاحظات |
|--------|---------|---------|
| **الخطوة 1** | اختيار هدف الدراسة (5 خيارات) | اختيار إلزامي |
| **الخطوة 2** | اختيار نطاق العمل (4 checkboxes) | تظهر فقط لـ: full_study, cost_pricing, lump_sum |
| **الخطوة 3** | بيانات الدراسة (اسم، عميل، نوع مشروع) | حقول أساسية |

### 2.2 خيارات الهدف (الخطوة 1) — 5 خيارات حالية

| القيمة | العنوان | الوصف | يظهر النطاق؟ |
|--------|---------|-------|-------------|
| `full_study` | دراسة كاملة من الصفر | حساب الكميات والمواصفات والتسعير خطوة بخطوة | ✅ نعم |
| `cost_pricing` | تسعير تكلفة | لديّ كميات جاهزة وأريد تحديد المواصفات والتسعير | ✅ نعم |
| `quick_pricing` | تسعير سريع | إدخال بنود وأسعار مباشرة بدون تفاصيل | ❌ لا |
| `lump_sum` | تحليل مقطوعية | لديّ عقد بمبلغ إجمالي وأريد تحليل التكلفة الفعلية | ✅ نعم |
| `contract_import` | استيراد عقد وتحويل لمشروع | لديّ عقد متكامل وأريد تحويله لمشروع تنفيذي | ❌ لا |

### 2.3 خيارات نطاق العمل (الخطوة 2)

4 خيارات (multi-select بـ checkboxes):
- 🏗️ أعمال إنشائية (structural)
- 🎨 أعمال تشطيبات (finishing)
- ⚡ كهروميكانيكية (mep)
- 📝 بنود مخصصة (custom)

### 2.4 الحقول المُرسلة عند الإنشاء

```typescript
{
  organizationId: string,      // إلزامي
  name: string?,               // اختياري
  customerName: string?,       // اختياري
  projectType: string,         // إلزامي (residential, commercial, etc.)
  studyType: StudyType,        // يُشتق من الهدف المختار
  entryPoint: StudyEntryPoint, // يُشتق من الهدف المختار
  contractValue: number?,      // فقط لـ lump_sum
  landArea: 1,                 // قيمة افتراضية
  buildingArea: 1,             // قيمة افتراضية
  numberOfFloors: 1,           // قيمة افتراضية
  hasBasement: false,          // قيمة افتراضية
  finishingLevel: "medium",    // قيمة افتراضية
}
```

### 2.5 تحويل الهدف إلى studyType و entryPoint

| الهدف (goal) | studyType | entryPoint |
|-------------|-----------|------------|
| `full_study` | `FULL_PROJECT` | `FROM_SCRATCH` |
| `cost_pricing` | `FULL_PROJECT` | `HAS_QUANTITIES` |
| `quick_pricing` | `CUSTOM_ITEMS` | `CUSTOM_ITEMS` |
| `lump_sum` | `LUMP_SUM_ANALYSIS` | `LUMP_SUM_ANALYSIS` |
| `contract_import` | `FULL_PROJECT` | `FROM_SCRATCH` |

### 2.6 الصفحة الأولى بعد الإنشاء

| الهدف | الصفحة |
|-------|--------|
| `full_study` | `/structural` |
| `cost_pricing` | `/specifications` |
| `quick_pricing` | `/quick-pricing` |
| `lump_sum` | `/costing` |
| `contract_import` | `/quantities` |

### 2.7 فجوات الإنشاء

1. **نطاق العمل (scope) لا يُحفظ في DB** — يُعرض في الواجهة فقط ولا يُرسل للـ API ولا يوجد حقل له في CostStudy
2. **تحويل الأهداف محدود** — 5 أهداف تُحوّل إلى 3 قيم studyType فقط، مما يضيع معلومات (مثلاً: full_study و cost_pricing و contract_import كلها = FULL_PROJECT)
3. **لا يوجد تمييز بين full_study و contract_import في DB** — كلاهما FULL_PROJECT + FROM_SCRATCH

---

## 3. شريط المراحل (Pipeline)

### 3.1 المراحل الحالية

6 مراحل معرّفة في الواجهة الأمامية (`StudyPipelineStepper`):

| # | المفتاح | الاسم العربي | الاسم الإنجليزي | المسار |
|---|---------|-------------|-----------------|--------|
| 1 | `quantities` | الكميات | Quantities | `/quantities` |
| 2 | `specifications` | المواصفات | Specifications | `/specifications` |
| 3 | `costing` | تسعير التكلفة | Costing | `/costing` |
| 4 | `pricing` | التسعير | Pricing | `/pricing` |
| 5 | `quotation` | عرض السعر | Quotation | `/quotation` |
| 6 | `convert` | مشروع | Project | `/convert` |

في الـ Backend (`stages.ts`): 5 مراحل فقط (بدون CONVERSION).

### 3.2 هل هي ثابتة أم ديناميكية؟

**ثابتة (Hardcoded)** — المراحل معرّفة في ثوابت:
- Frontend: `PIPELINE_STAGES` في `StudyPipelineStepper.tsx`
- Frontend: `STAGES` في `PipelineBar.tsx`
- Backend: `STAGE_ORDER` في `stages.ts`

### 3.3 منطق الحالات

```
مقفل (Locked):    !isSkipped && !isCurrent && status === "NOT_STARTED"
نشط (Active):     status === "DRAFT"
قيد المراجعة:      status === "IN_REVIEW"
مكتمل (Approved): status === "APPROVED"
متخطّى (Skipped): index < entryPointStartIndex
```

**عند إنشاء الدراسة** — يُحدد المراحل حسب entryPoint:

| EntryPoint | المراحل المتخطاة | أول مرحلة نشطة |
|------------|-------------------|-----------------|
| `FROM_SCRATCH` | لا شيء | الكميات (#1) |
| `HAS_QUANTITIES` | الكميات | المواصفات (#2) |
| `HAS_SPECS` | الكميات + المواصفات | التكلفة (#3) |
| `QUOTATION_ONLY` | الكميات → التسعير | عرض السعر (#5) |
| `LUMP_SUM_ANALYSIS` | الكميات + المواصفات | التكلفة (#3) |
| `CUSTOM_ITEMS` | لا شيء | الكميات (#1) |

### 3.4 منطق conditional حسب studyType

موجود **جزئياً** في `PipelineBar.tsx` فقط:
- **LUMP_SUM_ANALYSIS**: يخفي مرحلة `quotation`
- **LUMP_SUM_ANALYSIS**: يغيّر تسمية `selling-price` إلى "الربحية" (profitability)

`StudyPipelineStepper` **لا يفلتر** المراحل حسب studyType — يعتمد فقط على entryPoint.

---

## 4. صفحات المراحل

### 4.1 صفحة الكميات (Quantities)

**التبويبات**: 4 تبويبات **ثابتة** دائماً:

| التبويب | المكوّن | شكل العرض |
|---------|--------|-----------|
| إنشائي (Structural) | `StructuralItemsEditor` | Accordion بمجموعات حسب الفئة |
| تشطيبات (Finishing) | `FinishingItemsEditor` | Dashboard بتسلسل طابق → فراغ → بند |
| كهروميكانيكي (MEP) | `MEPItemsEditor` | Dashboard table مع تمكين/تعطيل |
| يدوي (Manual) | `ManualItemsTable` | جدول HTML بسيط |

**لا يوجد أي فلترة** بناءً على studyType أو scope — كل التبويبات تظهر دائماً.

### 4.2 صفحة المواصفات (Specifications)

**التبويبات**: 3 تبويبات ثابتة:
- إنشائي (Structural Specs) — مكوّن مخصص
- تشطيبات (Finishing Specs) — محرر inline مع دمج بيانات الكميات
- كهروميكانيكي (MEP Specs) — placeholder "قريباً"

**لا يوجد فلترة** حسب studyType أو scope.
**تعتمد على**: بيانات الكميات (finishing items + building config).

### 4.3 صفحة التكلفة (Costing)

**تعرض**:
- زر إنشاء/إعادة إنشاء بنود التكلفة
- `CostingTable` (إذا توجد بنود) أو حالة فارغة
- `CostingSummary` (ملخص التكاليف)

**لا يوجد فلترة** حسب studyType أو scope.
**تعتمد على**: بيانات المواصفات.

### 4.4 صفحة التسعير (Pricing)

**تعرض**: `PricingPageContentV2`

**فلترة جزئية**: يتحقق من `studyType === "LUMP_SUM_ANALYSIS"` لإخفاء بعض الأقسام.

### 4.5 صفحة سعر البيع / الربحية (Selling Price)

**هذه الصفحة الوحيدة** التي تطبّق فلترة كاملة حسب studyType:

| studyType | ما يُعرض |
|-----------|----------|
| `LUMP_SUM_ANALYSIS` | مكوّن `LumpSumAnalysis` فقط |
| أي نوع آخر | `MarkupMethodSelector` + نماذج الهوامش (uniform أو per_section) |

**تعتمد على**: بيانات التكلفة والتسعير.

### 4.6 صفحة عرض السعر (Quotation)

تعرض إدارة عروض الأسعار. لا فلترة حسب studyType.

### 4.7 ملخص الفلترة الحالية

| الصفحة | فلترة حسب studyType؟ | فلترة حسب scope؟ |
|--------|---------------------|-----------------|
| الكميات | ❌ لا | ❌ لا |
| المواصفات | ❌ لا | ❌ لا |
| التكلفة | ❌ لا | ❌ لا |
| التسعير | ⚠️ جزئي (LUMP_SUM فقط) | ❌ لا |
| سعر البيع | ✅ نعم (LUMP_SUM مختلف) | ❌ لا |
| عرض السعر | ❌ لا | ❌ لا |

---

## 5. التنقل (Navigation)

### 5.1 هيكل التنقل

**3 مستويات**:

1. **شريط التنقل الرئيسي** (`PricingNavigation`): لوحة التحكم ← الدراسات ← عروض الأسعار ← العملاء المحتملون
2. **Sidebar** (`use-sidebar-menu.ts`): يعرض 6 عناصر فرعية عند دخول دراسة:
   - نظرة عامة، الكميات، المواصفات، التكلفة، التسعير، عرض السعر
3. **شريط المراحل** (`StudyPipelineStepper`): 6 مراحل بأيقونات وحالات

### 5.2 هل الروابط ثابتة أم ديناميكية؟

**ثابتة** — كل العناصر تظهر دائماً بغض النظر عن studyType أو scope.

**الاستثناء الوحيد**: `PipelineBar` يخفي مرحلة quotation لنوع LUMP_SUM_ANALYSIS.

### 5.3 Sidebar

يتحقق من وجود `studyId` في المسار عبر regex:
```typescript
pathname.match(/\/pricing\/studies\/([^/]+)/)
```
إذا وُجد studyId، يضيف 6 عناصر فرعية ثابتة — **بدون أي شرط** على studyType.

---

## 6. مخرجات محركات الحساب

### 6.1 المحرك الإنشائي (structural-calculations.ts)

**الأنواع الرئيسية الصادرة**:

```typescript
// نتيجة الأساسات المنعزلة
IsolatedFoundationResult {
  concreteVolume: number      // حجم الخرسانة (م³)
  plainConcreteVolume: number // خرسانة عادية (م³)
  formworkArea: number        // مساحة الشدات (م²)
  rebarDetails: []            // تفاصيل حديد التسليح
  totals: {
    netWeight, grossWeight, wasteWeight, wastePercentage,
    stocksNeeded: [{ diameter, count, length }]
  }
  costs: { concrete, rebar, ... }
}

// نتيجة البلاطات
EnhancedSlabResult {
  slabType: string
  area, netArea: number
  concreteVolume: number
  formworkArea: number
  blocksCount?: number
  rebarDetails: []
  totals: { ... }
  costs: { ... }
}
```

**الأعمدة الشائعة**: الفئة، الاسم، الكمية، الوحدة، حجم الخرسانة، وزن الحديد، التكلفة الإجمالية.

### 6.2 محرك اشتقاق التشطيبات (derivation-engine.ts)

**الخرج**: `DerivedQuantity[]`

```typescript
DerivedQuantity {
  categoryKey: string          // مفتاح الفئة
  subCategory?: string         // الفئة الفرعية
  floorId?: string             // رقم الطابق
  floorName?: string           // اسم الطابق
  scope: "per_floor" | "whole_building" | "external" | "roof"
  quantity: number             // الكمية
  unit: string                 // الوحدة
  wastagePercent: number       // نسبة الهدر
  effectiveQuantity: number    // الكمية الفعلية
  dataSource: DataSourceType   // مصدر البيانات
  sourceDescription: string    // وصف المصدر
  calculationBreakdown?: {     // تفصيل الحساب
    type: "direct_area" | "wall_deduction" | "room_by_room" | "per_unit" | "linear" | "lump_sum" | "derived"
    details: Record<string, unknown>
  }
  isEnabled: boolean
  groupKey, groupName, groupIcon, groupColor: string
}
```

**الأعمدة للجدول الفارغ في "تسعير تكلفة"**: الفئة، الفئة الفرعية، الطابق، النطاق، الكمية، الوحدة، نسبة الهدر، الكمية الفعلية.

---

## 7. الفجوات المكتشفة

### 7.1 إخفاء مراحل بناءً على نوع الدراسة

| الفجوة | التفاصيل |
|--------|----------|
| **Schema** | `StudyType` enum حالي: 3 قيم (FULL_PROJECT, CUSTOM_ITEMS, LUMP_SUM_ANALYSIS) — يحتاج تعديل ليشمل الأنواع الجديدة أو استخدام entryPoint بشكل أفضل |
| **Backend stages** | إنشاء المراحل في `create.ts` يعتمد على entryPoint فقط — لا يدعم إخفاء مراحل كاملة |
| **StudyPipelineStepper** | لا يفلتر المراحل حسب studyType — يعرض كل شيء دائماً |
| **Sidebar** | لا يفلتر عناصر التنقل حسب studyType — يعرض 6 عناصر دائماً |
| **PipelineBar** | يدعم إخفاء quotation لـ LUMP_SUM فقط — يحتاج توسيع |

### 7.2 إخفاء تبويبات بناءً على نطاق العمل

| الفجوة | التفاصيل |
|--------|----------|
| **Schema** | لا يوجد حقل `scope` أو `workScopes` في CostStudy — نطاق العمل لا يُحفظ |
| **API create** | لا يقبل حقل scope/workScopes |
| **QuantitiesSubTabs** | التبويبات الأربعة ثابتة — لا يوجد منطق إخفاء |
| **SpecificationsPageContent** | التبويبات الثلاثة ثابتة — لا يوجد منطق إخفاء |

### 7.3 جدول فارغ لنوع "تسعير تكلفة"

| الفجوة | التفاصيل |
|--------|----------|
| **Flow** | حالياً `cost_pricing` يُحوّل إلى `FULL_PROJECT + HAS_QUANTITIES` ويوجّه لـ `/specifications` |
| **لا يوجد جدول فارغ** | يجب إنشاء واجهة تسمح بإدخال الكميات يدوياً بنفس أعمدة مخرجات محركات الحساب |
| **البيانات المطلوبة** | الأعمدة: الفئة، الفئة الفرعية، الوصف، الوحدة، الكمية، نسبة الهدر |

### 7.4 وضع مباشر لنوع "تسعير سريع"

| الفجوة | التفاصيل |
|--------|----------|
| **Flow** | حالياً `quick_pricing` يُحوّل إلى `CUSTOM_ITEMS + CUSTOM_ITEMS` ويوجّه لـ `/quick-pricing` |
| **الصفحة موجودة** | `QuickPricingStandalone` — تعمل بشكل مستقل |
| **الفجوة** | المراحل كلها تظهر في الـ stepper والـ sidebar رغم عدم الحاجة لها |
| **المطلوب** | إخفاء كل المراحل عدا التسعير السريع، أو عدم عرض stepper أصلاً |

---

## 8. قائمة الملفات التي تحتاج تعديل

### 8.1 قاعدة البيانات

| الملف | التعديل المطلوب |
|-------|----------------|
| `packages/database/prisma/schema.prisma` | إضافة حقل `workScopes String[]` أو `workScopes Json` إلى CostStudy لحفظ نطاقات العمل المختارة. تحديث enum StudyType إذا لزم الأمر |

### 8.2 API

| الملف | التعديل المطلوب |
|-------|----------------|
| `packages/api/modules/quantities/procedures/create.ts` | إضافة `workScopes` إلى Zod schema والحفظ في DB. تعديل منطق إنشاء المراحل ليراعي نوع الدراسة |
| `packages/api/modules/quantities/procedures/get-by-id.ts` | التأكد من إرجاع `workScopes` و `studyType` |
| `packages/api/modules/quantities/procedures/stages.ts` | تعديل منطق المراحل ليراعي نوع الدراسة (إخفاء/إظهار) |

### 8.3 واجهة الإنشاء

| الملف | التعديل المطلوب |
|-------|----------------|
| `apps/web/modules/saas/pricing/components/studies/CreateCostStudyForm.tsx` | تقليل الخيارات من 5 إلى 3. إرسال workScopes للـ API |
| `apps/web/modules/saas/pricing/components/studies/CreateStudyPage.tsx` | نفس التعديلات (نسخة الصفحة الكاملة) |

### 8.4 شريط المراحل والتنقل

| الملف | التعديل المطلوب |
|-------|----------------|
| `apps/web/modules/saas/pricing/components/studies/StudyPipelineStepper.tsx` | إضافة فلترة المراحل حسب studyType (إخفاء مراحل الكميات لـ COST_PRICING، إخفاء كل المراحل لـ QUICK_PRICING) |
| `apps/web/modules/saas/pricing/components/pipeline/PipelineBar.tsx` | توسيع فلترة المراحل لتشمل الأنواع الجديدة |
| `apps/web/modules/saas/shared/components/sidebar/use-sidebar-menu.ts` | إضافة فلترة عناصر التنقل حسب studyType |

### 8.5 صفحات المراحل

| الملف | التعديل المطلوب |
|-------|----------------|
| `apps/web/modules/saas/pricing/components/studies/QuantitiesSubTabs.tsx` | فلترة التبويبات حسب workScopes المحفوظة |
| `apps/web/modules/saas/pricing/components/studies/QuantitiesList.tsx` | دعم عرض جدول فارغ لنوع COST_PRICING |
| `apps/web/modules/saas/pricing/components/pipeline/QuantitiesPageContent.tsx` | فلترة التبويبات حسب workScopes |
| `apps/web/modules/saas/pricing/components/pipeline/SpecificationsPageContent.tsx` | فلترة التبويبات حسب workScopes |

### 8.6 صفحة النظرة العامة

| الملف | التعديل المطلوب |
|-------|----------------|
| `apps/web/modules/saas/pricing/components/studies/CostStudyOverview.tsx` | عرض نوع الدراسة ونطاقات العمل |
| `apps/web/modules/saas/pricing/components/studies/StudyHeaderCard.tsx` | إضافة عرض نوع الدراسة |

### 8.7 Layout

| الملف | التعديل المطلوب |
|-------|----------------|
| `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[studyId]/layout.tsx` | تمرير studyType للمكونات الفرعية (إذا لزم الأمر) |

---

## 9. ملخص تنفيذي

### الوضع الحالي:
- النظام يدعم 3 أنواع دراسات في DB لكن يعرض 5 خيارات في الواجهة
- نطاق العمل يُعرض عند الإنشاء لكن **لا يُحفظ** في قاعدة البيانات
- المراحل والتبويبات **ثابتة** — لا تتكيف مع نوع الدراسة أو النطاق
- الفلترة الوحيدة الموجودة: إخفاء مرحلة quotation وتغيير تسمية selling-price لنوع LUMP_SUM_ANALYSIS

### الأولويات:
1. **أولوية عالية**: حفظ workScopes في DB (تعديل schema + API)
2. **أولوية عالية**: فلترة المراحل في Stepper و Sidebar حسب studyType
3. **أولوية متوسطة**: فلترة التبويبات حسب workScopes
4. **أولوية متوسطة**: إنشاء واجهة الجدول الفارغ لـ COST_PRICING
5. **أولوية منخفضة**: تبسيط خيارات الإنشاء من 5 إلى 3
