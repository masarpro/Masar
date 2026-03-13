# تقرير تحليل نظام الدراسات — الوضع الحالي

> تاريخ التقرير: 2026-03-13
> الغرض: تحليل الوضع الحالي لنظام إنشاء وإدارة دراسات التسعير — بدون تنفيذ أي تغييرات

---

## 1. Schema قاعدة البيانات

### 1.1 نموذج CostStudy — الحقول المتعلقة بالنوع والنطاق

| الحقل | النوع | القيمة الافتراضية | ملاحظات |
|-------|-------|-------------------|---------|
| `studyType` | `StudyType` enum | `FULL_PROJECT` | نوع الدراسة — **محفوظ في DB** ✅ |
| `entryPoint` | `StudyEntryPoint` enum | `FROM_SCRATCH` | نقطة البداية في المراحل — **محفوظ في DB** ✅ |
| `workScopes` | `String[]` | `[]` | نطاقات العمل المختارة — **محفوظ في DB** ✅ |
| `contractValue` | `Decimal(15,2)` | `null` | قيمة العقد (للمقطوعية) |
| `costingMethod` | `String?` | `null` | `"manual"` / `"database"` / `"import"` |
| `markupMethod` | `String?` | `null` | `"uniform"` / `"per_section"` / `"manual"` |

**ملاحظة مهمة**: `workScopes` موجود كحقل `String[]` في CostStudy ويُحفظ في قاعدة البيانات. القيم المتاحة: `["STRUCTURAL", "FINISHING", "MEP", "CUSTOM"]`

### 1.2 قيم StudyType enum (6 قيم)

```
FULL_PROJECT        — دراسة كاملة (قديم — backward compat)
CUSTOM_ITEMS        — بنود مخصصة (قديم — backward compat)
LUMP_SUM_ANALYSIS   — تحليل مقطوعية
FULL_STUDY          — دراسة كاملة من الصفر (جديد)
COST_PRICING        — تسعير تكلفة (جديد)
QUICK_PRICING       — تسعير سريع (جديد)
```

### 1.3 قيم StudyEntryPoint enum (6 قيم)

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

### 1.6 نموذج StudyStage (سجلات المراحل)

```
id, costStudyId, stage (StageType), status (StageStatus),
assigneeId, approvedById, approvedAt, notes, sortOrder
Unique: [costStudyId, stage]
```

عند إنشاء دراسة يتم إنشاء **6 سجلات** StudyStage — واحد لكل مرحلة.

### 1.7 النماذج المرتبطة

| النموذج | الوصف | حقول رئيسية |
|---------|-------|-------------|
| `StructuralItem` | بنود إنشائية | category, quantity, concreteVolume, steelWeight, materialCost, laborCost, totalCost |
| `FinishingItem` | بنود تشطيبات | category, floorId, area, quantity, qualityLevel, materialPrice, laborPrice, scope (nullable) |
| `MEPItem` | بنود كهروميكانيكية | category, itemType, floorId, roomId, scope (default "per_room"), quantity |
| `LaborItem` | بنود عمالة | laborType, workerType, quantity, dailyRate, durationDays |
| `CostingItem` | بنود التكلفة المُولّدة | section (STRUCTURAL/FINISHING/MEP/LABOR/MANUAL), sourceItemId, quantity, materialUnitCost, laborUnitCost, totalCost |
| `ManualItem` | بنود يدوية | description, unit, quantity, section, notes |
| `SectionMarkup` | هوامش القطاعات | section (STRUCTURAL/FINISHING/MEP/LABOR), markupPercent |
| `Quote` | عروض الأسعار | quoteNumber, quoteType, subtotal, totalAmount |
| `MaterialBOM` | قائمة المواد | materialName, quantity, unit, wastagePercent, unitPrice |
| `CostingLabor` | عمالة التكلفة | section, laborMethod, description, quantity, rate |

---

## 2. wizard الإنشاء الحالي

### 2.1 كيف يعمل حالياً

يوجد تطبيقان:
- **CreateCostStudyForm.tsx** — Dialog بخطوتين (النسخة الرئيسية)
- **CreateStudyPage.tsx** — صفحة كاملة

**Dialog — خطوتان**:
| الخطوة | المحتوى |
|--------|---------|
| **الخطوة 1** | اختيار هدف الدراسة (3 خيارات) + نطاق العمل (4 checkboxes — يظهر فقط لـ FULL_STUDY و COST_PRICING) |
| **الخطوة 2** | بيانات الدراسة (اسم، عميل، نوع مشروع) |

### 2.2 خيارات الهدف — 3 أنواع

| القيمة | الأيقونة | العنوان | يظهر النطاق؟ | صفحة البداية |
|--------|----------|---------|-------------|-------------|
| `FULL_STUDY` | Building2 | الدراسة الشاملة | ✅ نعم | `quantities` |
| `COST_PRICING` | ClipboardList | تسعير التكلفة | ✅ نعم | `quantities` |
| `QUICK_PRICING` | Zap | التسعير السريع | ❌ لا | `pricing` |

### 2.3 خيارات نطاق العمل (multi-select)

| المفتاح | الأيقونة | العنوان |
|---------|----------|---------|
| `STRUCTURAL` | 🏗️ | أعمال إنشائية |
| `FINISHING` | 🎨 | تشطيبات |
| `MEP` | ⚡ | كهروميكانيكية |
| `CUSTOM` | 📝 | يدوي/مخصص |

### 2.4 الحقول المُرسلة عند الإنشاء

```typescript
{
  organizationId: string,
  name: string,
  customerName?: string,
  projectType: string,           // residential, commercial, industrial, warehouse, mixed
  studyType: "FULL_STUDY" | "COST_PRICING" | "QUICK_PRICING",
  workScopes: string[],          // مثال: ["STRUCTURAL", "FINISHING"]
  landArea: 1,
  buildingArea: 1,
  numberOfFloors: 1,
  hasBasement: false,
  finishingLevel: "medium",
}
```

### 2.5 تحويل studyType إلى entryPoint (في API create.ts)

```typescript
FULL_STUDY    → FROM_SCRATCH    (يبدأ من الكميات)
COST_PRICING  → FROM_SCRATCH    (يبدأ من الكميات — ⚠️ ليس HAS_QUANTITIES!)
QUICK_PRICING → QUOTATION_ONLY  (يبدأ من عرض السعر)
```

### 2.6 بعد الإنشاء — التوجيه

| studyType | التوجيه |
|-----------|---------|
| FULL_STUDY | `/pricing/studies/{id}/quantities` |
| COST_PRICING | `/pricing/studies/{id}/quantities` |
| QUICK_PRICING | `/pricing/studies/{id}/pricing` |

### 2.7 تعديل إعدادات الدراسة (EditStudyConfigDialog)

- يوجد Dialog لتعديل studyType و workScopes بعد الإنشاء
- يستدعي `orpc.pricing.studies.updateConfig` → API `update-config.ts`
- يحفظ التغييرات في DB ✅

---

## 3. شريط المراحل (Pipeline)

### 3.1 المراحل الحالية — StudyPipelineStepper

6 مراحل في `PIPELINE_STAGES`:

| # | المفتاح | StageType | الاسم العربي | الأيقونة | المسار |
|---|---------|-----------|-------------|----------|--------|
| 1 | quantities | QUANTITIES | الكميات | Calculator | `/quantities` |
| 2 | specifications | SPECIFICATIONS | المواصفات | ClipboardList | `/specifications` |
| 3 | costing | COSTING | تسعير التكلفة | Receipt | `/costing` |
| 4 | pricing | PRICING | التسعير | DollarSign | `/pricing` |
| 5 | quotation | QUOTATION | عرض السعر | FileText | `/quotation` |
| 6 | convert | CONVERSION | مشروع | FolderKanban | `/convert` |

### 3.2 هل هي ثابتة أم ديناميكية؟

**ديناميكية جزئياً** — المراحل معرّفة كثوابت لكن يتم **فلترتها** عبر `enabledStageTypes` prop:
- `StudyPipelineStepper` يقبل prop `enabledStageTypes` ويفلتر المراحل المعروضة
- `StudyPageShell` يمرر `enabledStageTypes` من `useStudyConfig` hook

### 3.3 منطق فلترة المراحل حسب studyType (useStudyConfig hook)

| studyType | المراحل المفعّلة |
|-----------|----------------|
| **FULL_STUDY** / FULL_PROJECT | جميع الـ 6: quantities, specifications, costing, pricing, quotation, convert |
| **COST_PRICING** | جميع الـ 6: quantities, specifications, costing, pricing, quotation, convert |
| **QUICK_PRICING** / CUSTOM_ITEMS | فقط 2: pricing, quotation |
| LUMP_SUM_ANALYSIS | فقط 2: costing, pricing |

### 3.4 منطق حالات المراحل

```
مقفل (Locked):    status === "NOT_STARTED" && !isSkipped && !isCurrent
نشط (Active):     status === "DRAFT" (نقطة متحركة)
قيد المراجعة:      status === "IN_REVIEW" (أيقونة ساعة)
مكتمل (Approved): status === "APPROVED" (علامة ✓)
متخطّى (Skipped): index < entryPointStartIndex (سهم ←)
```

### 3.5 PipelineBar (تطبيق ثانوي)

فلترة إضافية:
- **LUMP_SUM_ANALYSIS**: يخفي quotation، يغيّر تسمية selling-price إلى "الربحية"
- **QUICK_PRICING / CUSTOM_ITEMS**: يعرض فقط selling-price و quotation

---

## 4. صفحات المراحل

### 4.1 صفحة الكميات (Quantities)

**الملفات**:
- `apps/web/modules/saas/pricing/components/studies/QuantitiesSubTabs.tsx`
- `apps/web/modules/saas/pricing/components/pipeline/QuantitiesPageContent.tsx`

**التبويبات — ديناميكية بناءً على workScopes** ✅:

```typescript
// من useStudyConfig
if (!scopes || scopes.length === 0) {
  return ["structural", "finishing", "mep", "manual"]; // fallback للدراسات القديمة
}
// وإلا: فقط التبويبات المطابقة لـ workScopes
```

| workScope | التبويب المعروض | المكوّن |
|-----------|----------------|--------|
| STRUCTURAL | إنشائي | `StructuralItemsEditor` |
| FINISHING | تشطيبات | `FinishingItemsEditor` |
| MEP | كهروميكانيكي | `MEPItemsEditor` |
| CUSTOM | يدوي | `ManualItemsTable` |

**وضع الجدول الفارغ** (`isEmptyTableMode`):
- يُفعّل عندما `studyType === "COST_PRICING"` ✅
- يعرض `ManualItemsTable` بدلاً من المحررات الذكية
- كل تبويب يظهر جدول يدوي فارغ مع filterSection مطابق

### 4.2 صفحة المواصفات (Specifications)

**الملف**: `apps/web/modules/saas/pricing/components/specifications/SpecificationsPageContentV2.tsx`

**سلوك**:
- تتحقق من اعتماد مرحلة QUANTITIES — إذا لم تُعتمد تعرض شاشة قفل
- التبويبات تُفلتر بناءً على workScopes (تزيل "manual" من القائمة)
- عرض BOM (قائمة المواد)

**تعتمد على**: اعتماد مرحلة الكميات

### 4.3 صفحة التكلفة (Costing)

**الملف**: `apps/web/modules/saas/pricing/components/costing-v2/CostingPageContentV2.tsx`

**التبويبات — ديناميكية بناءً على workScopes** ✅:
```typescript
if (workScopes.length === 0) {
  enabledTabs = ["structural", "finishing", "mep"];
} else {
  // فلترة حسب workScopes
}
enabledTabs.push("labor", "summary"); // دائماً
```

| تبويب | المكوّن |
|-------|--------|
| Structural | `StructuralCostingTab` |
| Finishing | `FinishingCostingTab` |
| MEP | `MEPCostingTab` |
| Labor | `LaborOverviewTab` |
| Summary | `CostingSummaryTab` |

**تعتمد على**: اعتماد مرحلة المواصفات — تولّد CostingItems تلقائياً

### 4.4 صفحة التسعير (Pricing)

**الملف**: `apps/web/modules/saas/pricing/components/pricing-v2/PricingPageContentV2.tsx`

**تعرض**:
- بطاقة التكلفة الإجمالية والتكلفة لكل م²
- اختيار طريقة الهوامش (4 طرق: uniform, per-section, manual price, per-sqm)
- نماذج ديناميكية حسب الطريقة المختارة
- قسم مصاريف إضافية (إدارية، طوارئ، ضريبة)
- جدول تعديل الأسعار لكل بند
- بطاقة تحليل الربحية

**فلترة**:
- `enabledSections` تُفلتر بناءً على workScopes ✅
- قسم خاص لـ LUMP_SUM_ANALYSIS عندما `contractValue > 0`

**تعتمد على**: اعتماد مرحلة التكلفة

### 4.5 صفحة سعر البيع (Selling Price)

**المسار**: `/selling-price/page.tsx` → **يعيد التوجيه** إلى `/pricing`
(ليست صفحة مستقلة — redirect فقط)

### 4.6 صفحة عرض السعر (Quotation)

تعرض إدارة عروض الأسعار. لا فلترة خاصة حسب studyType.

### 4.7 ملخص الفلترة الحالية في صفحات المراحل

| الصفحة | فلترة حسب studyType؟ | فلترة حسب workScopes؟ |
|--------|---------------------|----------------------|
| الكميات | ✅ نعم (isEmptyTableMode لـ COST_PRICING) | ✅ نعم (التبويبات ديناميكية) |
| المواصفات | ❌ لا | ✅ نعم (التبويبات ديناميكية — تزيل manual) |
| التكلفة | ❌ لا | ✅ نعم (التبويبات ديناميكية) |
| التسعير | ⚠️ جزئي (LUMP_SUM فقط) | ✅ نعم (enabledSections) |
| عرض السعر | ❌ لا | ❌ لا |

---

## 5. التنقل (Navigation)

### 5.1 هيكل التنقل

**3 مستويات**:

1. **PricingNavigation** (شريط علوي): لوحة التحكم ← الدراسات ← عروض الأسعار ← العملاء المحتملون
2. **StudySidebar** (جانبي — داخل الدراسة): نظرة عامة + 6 مراحل
3. **StudyPipelineStepper** (شريط المراحل البصري): المراحل المفعّلة فقط

### 5.2 StudySidebar

**الملف**: `apps/web/modules/saas/pricing/components/studies/StudySidebar.tsx`

- يعرض عناصر التنقل بناءً على `ENTRY_POINT_START_INDEX`
- المراحل المتخطاة (قبل entryPoint) تظهر معطّلة بصرياً
- **لا يفلتر حسب studyType** — يعتمد فقط على entryPoint

### 5.3 StudyPageShell (الغلاف الرئيسي)

**الملف**: `apps/web/modules/saas/pricing/components/studies/StudyPageShell.tsx`

يعرض:
1. **StudyHeaderCard** — اسم الدراسة، العميل، الحالة، زر الرجوع
2. **StudyConfigBar** — شارة نوع الدراسة (ملونة) + chips نطاقات العمل + زر تعديل
3. **StudyPipelineStepper** — المراحل المفلترة عبر `enabledStageTypes`
4. المحتوى (children)

### 5.4 StudyConfigBar

**الملف**: `apps/web/modules/saas/pricing/components/studies/StudyConfigBar.tsx`

يعرض:
- شارة نوع الدراسة بألوان مختلفة:
  - FULL_STUDY/FULL_PROJECT → أزرق
  - COST_PRICING → كهرماني (amber)
  - QUICK_PRICING/CUSTOM_ITEMS → أخضر زمردي
  - LUMP_SUM_ANALYSIS → بنفسجي
- chips لنطاقات العمل مع أيقونات emoji
- زر تعديل (قلم) يفتح EditStudyConfigDialog

---

## 6. مخرجات محركات الحساب

### 6.1 المحرك الإنشائي (structural-calculations.ts)

**الأنواع الرئيسية الصادرة**:

```typescript
// نتيجة الأساسات
IsolatedFoundationResult {
  concreteVolume: number,       // حجم الخرسانة (م³)
  plainConcreteVolume: number,  // خرسانة عادية (م³)
  formworkArea: number,         // مساحة الشدات (م²)
  rebarDetails: RebarDetail[],  // تفاصيل حديد التسليح
  totals: { netWeight, grossWeight, wasteWeight, wastePercentage, stocksNeeded }
  costs: { concrete, rebar, ... }
}

// نتيجة البلاطات
EnhancedSlabResult {
  concreteVolume: number,
  totalRebarWeight: number,
  formworkArea: number,
  concreteCost, rebarCost, formworkCost, laborCost, totalCost: number,
  rebarLayers: RebarDetail[]
}
```

**الأعمدة الشائعة**: الفئة، الاسم، الكمية، الوحدة، حجم الخرسانة، وزن الحديد، مساحة الشدات، التكلفة.

### 6.2 محرك اشتقاق التشطيبات (derivation-engine.ts)

**الخرج**: `DerivedQuantity[]`

```typescript
DerivedQuantity {
  categoryKey: string,
  subCategory?: string,
  floorId?: string,
  floorName?: string,
  scope: "per_floor" | "whole_building" | "external" | "roof",
  quantity: number,
  unit: string,
  wastagePercent: number,
  effectiveQuantity: number,
  dataSource: "auto_building" | "auto_linked" | "auto_derived" | "manual" | "estimated",
  sourceDescription: string,
  calculationBreakdown?: {
    type: "direct_area" | "wall_deduction" | "room_by_room" | "per_unit" | "linear" | "lump_sum" | "derived",
    details: Record<string, unknown>,
    formula: string
  },
  isEnabled: boolean,
  groupKey, groupName, groupIcon, groupColor: string
}
```

### 6.3 شكل الجدول الفارغ المطلوب لـ "تسعير تكلفة"

بناءً على مخرجات المحركات، الأعمدة المطلوبة في الجدول الفارغ:

**للإنشائي**: الفئة، الوصف، الوحدة، الكمية، ملاحظات
**للتشطيبات**: الفئة، الفئة الفرعية، الطابق، النطاق، الكمية، الوحدة، نسبة الهدر
**للكهروميكانيكي**: الفئة، الفئة الفرعية، النوع، الكمية، الوحدة

**حالياً**: عند `isEmptyTableMode = true` يتم عرض `ManualItemsTable` بنفس الصيغة لجميع التبويبات (description, unit, quantity, section, notes). هذا أبسط من شكل مخرجات المحركات.

---

## 7. الفجوات المكتشفة

### 7.1 ما يعمل بالفعل ✅

| الميزة | الحالة | التفاصيل |
|--------|--------|----------|
| حفظ studyType في DB | ✅ يعمل | 6 قيم في enum، يُحفظ عند الإنشاء |
| حفظ workScopes في DB | ✅ يعمل | حقل String[] في CostStudy |
| تعديل studyType/workScopes | ✅ يعمل | EditStudyConfigDialog + update-config API |
| فلترة مراحل Stepper | ✅ يعمل | useStudyConfig → enabledStageTypes → StudyPipelineStepper |
| فلترة تبويبات Quantities | ✅ يعمل | useStudyConfig → enabledTabs |
| فلترة تبويبات Costing | ✅ يعمل | workScopes filtering في CostingPageContentV2 |
| فلترة أقسام Pricing | ✅ يعمل | enabledSections في PricingPageContentV2 |
| فلترة تبويبات Specs | ✅ يعمل | enabledTabs في SpecificationsPageContentV2 |
| وضع جدول فارغ COST_PRICING | ✅ يعمل جزئياً | isEmptyTableMode يعرض ManualItemsTable |
| عرض نوع الدراسة في الواجهة | ✅ يعمل | StudyConfigBar بألوان مختلفة |

### 7.2 الفجوات المتبقية

#### أ. COST_PRICING — فلترة المراحل

| الفجوة | التفاصيل |
|--------|----------|
| **المراحل المعروضة** | COST_PRICING يعرض **جميع الـ 6 مراحل** تماماً مثل FULL_STUDY — بما فيها Quantities |
| **المتوقع** | COST_PRICING يجب أن يتخطى مرحلة الكميات أو يعرضها بشكل مختلف (جدول فارغ فقط) |
| **في useStudyConfig** | COST_PRICING يقع مع FULL_STUDY في نفس case — كلاهما يفعّل جميع المراحل |
| **entryPoint** | COST_PRICING يُحوّل إلى FROM_SCRATCH (وليس HAS_QUANTITIES) |

#### ب. COST_PRICING — شكل الجدول الفارغ

| الفجوة | التفاصيل |
|--------|----------|
| **الحالي** | `ManualItemsTable` بأعمدة بسيطة: وصف، وحدة، كمية، قسم، ملاحظات |
| **المطلوب** | جدول بنفس أعمدة مخرجات المحركات لكل نوع (إنشائي/تشطيبات/MEP) |
| **الفرق** | المحركات تُخرج حقول متخصصة (concreteVolume, steelWeight, floorId, scope, wastagePercent) بينما ManualItemsTable عام |

#### ج. QUICK_PRICING — التوجيه بعد الإنشاء

| الفجوة | التفاصيل |
|--------|----------|
| **الحالي** | يوجّه إلى `/pricing` وعدد المراحل المعروضة = 2 (pricing, quotation) ✅ |
| **الفجوة** | هل صفحة pricing تعمل بدون بيانات costing؟ تتحقق من اعتماد COSTING stage |
| **المطلوب** | التأكد من أن QUICK_PRICING لا يُقفل على شاشة "اعتمد المرحلة السابقة" |

#### د. Sidebar لا يفلتر حسب studyType

| الفجوة | التفاصيل |
|--------|----------|
| **الحالي** | Sidebar يعرض جميع العناصر دائماً، ويعتمد فقط على entryPoint |
| **الفرق** | Stepper يفلتر عبر enabledStageTypes لكن Sidebar لا يستخدم نفس المنطق |
| **المطلوب** | مزامنة Sidebar مع Stepper — إخفاء نفس المراحل |

#### هـ. COST_PRICING و FULL_STUDY — نفس المراحل تماماً

| الفجوة | التفاصيل |
|--------|----------|
| **الحالي** | useStudyConfig يُعاملهما بالضبط نفس المعاملة |
| **المتوقع** | COST_PRICING يجب أن يتخطى محركات حساب الكميات (أو يعرض وضعاً مختلفاً) |
| **isEmptyTableMode** | يُفعّل لـ COST_PRICING ✅ — لكن المراحل نفسها |

#### و. فحص الاعتماد الخطي (Linear Approval Chain)

| الفجوة | التفاصيل |
|--------|----------|
| **الحالي** | كل مرحلة تتحقق من اعتماد المرحلة السابقة (Specs → Quantities APPROVED، Costing → Specs APPROVED...) |
| **المشكل** | عند تخطي مراحل (QUICK_PRICING)، هل المراحل المتخطاة تكون APPROVED تلقائياً؟ |
| **في create.ts** | المراحل قبل entryPoint تُنشأ بحالة APPROVED تلقائياً ✅ |

---

## 8. قائمة الملفات الأساسية وحالتها

### 8.1 الملفات التي تعمل بشكل جيد ✅

| الملف | الوظيفة |
|-------|---------|
| `packages/database/prisma/schema.prisma` | studyType + workScopes محفوظان ✅ |
| `packages/api/modules/quantities/procedures/create.ts` | يقبل studyType + workScopes + يُنشئ stages بشكل صحيح ✅ |
| `packages/api/modules/quantities/procedures/update-config.ts` | يعدّل studyType + workScopes ✅ |
| `apps/web/modules/saas/pricing/hooks/useStudyConfig.ts` | يفلتر المراحل والتبويبات ✅ |
| `apps/web/modules/saas/pricing/components/studies/StudyConfigBar.tsx` | يعرض النوع والنطاق ✅ |
| `apps/web/modules/saas/pricing/components/studies/EditStudyConfigDialog.tsx` | يعدّل النوع والنطاق ✅ |

### 8.2 الملفات التي تحتاج تعديل

| الملف | التعديل المطلوب | الأولوية |
|-------|----------------|---------|
| `hooks/useStudyConfig.ts` | تمييز COST_PRICING عن FULL_STUDY — ربما إزالة quantities أو تعديل مراحلها | عالية |
| `components/studies/StudySidebar.tsx` | استخدام enabledStages من useStudyConfig لفلترة عناصر التنقل بدلاً من الاعتماد على entryPoint فقط | عالية |
| `components/studies/QuantitiesSubTabs.tsx` | تحسين الجدول الفارغ لـ COST_PRICING ليطابق أعمدة مخرجات المحركات | متوسطة |
| `components/pipeline/PipelineBar.tsx` | مزامنة مع useStudyConfig (حالياً يستخدم منطق فلترة خاص به) | متوسطة |
| `components/pricing-v2/PricingPageContentV2.tsx` | التأكد من عدم قفل الصفحة لـ QUICK_PRICING بسبب فحص اعتماد Costing | متوسطة |

---

## 9. ملخص تنفيذي

### الوضع الحالي — أفضل مما هو متوقع:
- **البنية التحتية جاهزة**: studyType و workScopes محفوظان في DB ومتاحان عبر API
- **الفلترة تعمل**: useStudyConfig hook يفلتر المراحل والتبويبات بنجاح
- **الواجهة متكيفة جزئياً**: Stepper يفلتر المراحل، التبويبات تتكيف مع workScopes
- **وضع الجدول الفارغ موجود**: isEmptyTableMode لـ COST_PRICING

### الفجوات الرئيسية:
1. **COST_PRICING = FULL_STUDY في المراحل** — يجب التمييز بينهما
2. **Sidebar لا يتزامن مع Stepper** — يعرض كل المراحل دائماً
3. **الجدول الفارغ بسيط جداً** — ManualItemsTable عام ولا يطابق أعمدة المحركات
4. **QUICK_PRICING قد يُقفل** — يحتاج التأكد من عدم فحص اعتماد مراحل سابقة

### التعديلات المطلوبة — 5 ملفات فقط:
مقارنة بالتقرير السابق (الذي قدّر 15+ ملف)، النظام الحالي يحتاج تعديلات في **5 ملفات فقط** لأن البنية التحتية جاهزة.
