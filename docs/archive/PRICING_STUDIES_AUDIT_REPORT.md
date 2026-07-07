# تقرير تدقيق شامل — قسم دراسات التكلفة (Pricing/Studies)
# Comprehensive Audit Report — Cost Studies Module

> **تاريخ التقرير:** 2026-03-10
> **النطاق:** `apps/web/modules/saas/pricing/` + `packages/api/modules/quantities/` + `packages/database/prisma/queries/cost-studies.ts`

---

## الفهرس

1. [إحصائيات عامة](#1-إحصائيات-عامة)
2. [هيكل الملفات والصفحات](#2-هيكل-الملفات-والصفحات)
3. [تدفق البيانات والعمارة](#3-تدفق-البيانات-والعمارة)
4. [خريطة المكونات والعلاقات](#4-خريطة-المكونات-والعلاقات)
5. [طبقة قاعدة البيانات](#5-طبقة-قاعدة-البيانات)
6. [طبقة الـ API](#6-طبقة-الـ-api)
7. [الأكواد المكررة والمتشابهة](#7-الأكواد-المكررة-والمتشابهة)
8. [مشاكل الترجمة (i18n)](#8-مشاكل-الترجمة-i18n)
9. [مشاكل الأداء](#9-مشاكل-الأداء)
10. [مشاكل الأنماط والاتساق](#10-مشاكل-الأنماط-والاتساق)ds
11. [الأكواد الميتة والمهملة](#11-الأكواد-الميتة-والمهملة)
12. [الإيجابيات](#12-الإيجابيات)
13. [السلبيات](#13-السلبيات)
14. [خطة التحسين المقترحة](#14-خطة-التحسين-المقترحة)

---

## 1. إحصائيات عامة

| المقياس | القيمة |
|---------|--------|
| إجمالي ملفات الوحدة (pricing module) | **181 ملف** |
| إجمالي أسطر الكود | **~55,000 سطر** |
| ملفات الـ API (procedures) | **32 ملف** (~3,558 سطر) |
| استعلامات قاعدة البيانات (cost-studies.ts) | **1,387 سطر** (~35 دالة مُصدّرة) |
| صفحات Next.js (app router) | **~20 صفحة** |
| ملفات مكونات (components) | **120+ مكون** |
| ملفات مكتبات حسابية (lib) | **40+ ملف** |
| ملفات أنواع (types) | **7 ملفات** |
| ملفات ثوابت (constants) | **4 ملفات** |
| ملفات مهملة (_deprecated) | **14 ملف** (~2,667 سطر) |

---

## 2. هيكل الملفات والصفحات

### 2.1 صفحات Next.js (App Router)

```
app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/
├── page.tsx                          # قائمة الدراسات
├── loading.tsx
├── new/page.tsx                      # إنشاء دراسة جديدة
├── [studyId]/
│   ├── page.tsx                      # نظرة عامة + Tabs
│   ├── loading.tsx
│   ├── structural/page.tsx           # محرر الأعمال الإنشائية
│   ├── finishing/page.tsx            # محرر التشطيبات
│   ├── mep/page.tsx                  # محرر الكهروميكانيكية
│   ├── quantities/
│   │   ├── layout.tsx
│   │   └── page.tsx                  # ملخص الكميات
│   ├── specifications/page.tsx       # المواصفات
│   ├── costing/page.tsx              # التكلفة
│   ├── selling-price/page.tsx        # سعر البيع
│   └── pricing/page.tsx              # التسعير
```

### 2.2 وحدة المكونات (Components)

```
modules/saas/pricing/components/
├── shell/                           # الإطار والتنقل
│   ├── PricingShell.tsx
│   ├── PricingSubPageHeader.tsx
│   ├── PricingNavigation.tsx
│   └── constants.ts
├── studies/                         # مكونات الدراسات
│   ├── index.ts                     # التصديرات الرئيسية
│   ├── QuantitiesList.tsx
│   ├── CostStudyCard.tsx
│   ├── CreateCostStudyDialog.tsx
│   ├── CreateCostStudyForm.tsx
│   ├── CostStudyOverview.tsx
│   ├── StudyHeaderCard.tsx
│   ├── SummaryStatsCards.tsx
│   ├── StructuralItemsEditor.tsx
│   ├── StructuralAccordion.tsx
│   ├── FinishingItemsEditor.tsx
│   ├── MEPItemsEditor.tsx
│   ├── PricingEditor.tsx
│   ├── sections/                    # أقسام الإنشائي (7 مكونات)
│   │   ├── PlainConcreteSection.tsx
│   │   ├── FoundationsSection.tsx
│   │   ├── ColumnsSection.tsx
│   │   ├── BeamsSection.tsx
│   │   ├── SlabsSection.tsx
│   │   ├── BlocksSection.tsx
│   │   └── StairsSection.tsx
│   ├── shared/                      # مكونات مشتركة (8 مكونات)
│   │   ├── CalculationResultsPanel.tsx
│   │   ├── ConcreteTypeSelect.tsx
│   │   ├── DimensionsCard.tsx
│   │   ├── ElementHeaderRow.tsx
│   │   ├── RebarBarsInput.tsx
│   │   ├── RebarMeshInput.tsx
│   │   ├── RebarWeightBadge.tsx
│   │   └── StirrupsInput.tsx
│   └── finishing/                   # حوارات التشطيبات
│       ├── PlasterItemDialog.tsx
│       ├── PaintItemDialog.tsx
│       ├── ThermalInsulationItemDialog.tsx
│       ├── WaterproofingItemDialog.tsx
│       └── _deprecated/            # ⚠️ 14 ملف مهمل (2,667 سطر)
├── finishing/                       # مكونات التشطيب الرئيسية
│   ├── BuildingSetupWizard.tsx
│   ├── BuildingSummaryBar.tsx
│   ├── CascadeNotification.tsx
│   ├── KnowledgeNotification.tsx
│   ├── ManualItemAdder.tsx
│   ├── QuantitiesDashboard.tsx
│   ├── QuantitiesTable.tsx
│   ├── QuantityRowExpanded.tsx
│   ├── specs/                       # نظام المواصفات (4 مكونات)
│   │   ├── BillOfMaterials.tsx
│   │   ├── ItemSpecEditor.tsx
│   │   ├── SpecBulkEditor.tsx
│   │   └── TemplateManager.tsx
│   └── wizard/                      # معالج إعداد المبنى (4 خطوات)
│       ├── BuildingStructureStep.tsx
│       ├── ExteriorStep.tsx
│       ├── FloorDetailsStep.tsx
│       └── ReviewStep.tsx
├── mep/                             # مكونات الكهروميكانيكية (7 مكونات)
│   ├── MEPDashboard.tsx
│   ├── MEPCategorySection.tsx
│   ├── MEPItemDialog.tsx
│   ├── MEPItemRow.tsx
│   ├── MEPManualAdder.tsx
│   ├── MEPSummaryBar.tsx
│   └── MEPBuildingRequired.tsx
├── pipeline/                        # خط سير العمل
│   ├── CostingPageContent.tsx
│   ├── CostingTable.tsx
│   ├── CostingSummary.tsx
│   ├── LumpSumAnalysis.tsx
│   ├── ProfitAnalysis.tsx
│   ├── SectionMarkupForm.tsx
│   └── SellingPricePageContent.tsx
├── leads/                           # العملاء المحتملين (20 مكون)
├── quotations/                      # عروض الأسعار
│   ├── QuotationsList.tsx
│   └── QuotationsHeaderActions.tsx
```

### 2.3 المكتبات والحسابات (lib/)

```
modules/saas/pricing/lib/
├── index.ts
├── utils.ts                         # formatCurrency, formatNumber, getUnitLabel
├── calculations.ts                  # حسابات القواعد والأعمدة والبلاطات
├── structural-calculations.ts       # حسابات إنشائية متقدمة
├── pricing-calculations.ts          # حسابات التسعير النهائية
├── smart-building-types.ts          # أنواع المبنى الذكي (SmartBuildingConfig)
├── finishing-types.ts               # أنواع التشطيبات
├── finishing-categories.ts          # فئات التشطيب
├── finishing-templates.ts           # قوالب المواصفات
├── finishing-links.ts               # روابط التنقل
├── derivation-engine.ts             # محرك اشتقاق الكميات (~1,523 سطر)
├── merge-quantities.ts              # دمج الكميات (~395 سطر)
├── knowledge-extractor.ts           # استخراج المعرفة
├── plaster-config.ts                # إعدادات البياض
├── paint-config.ts                  # إعدادات الدهانات
├── insulation-config.ts             # إعدادات العزل
├── mep-categories.ts                # فئات MEP (6 فئات + 30+ فرعية)
├── mep-prices.ts                    # أسعار MEP (~80+ بند)
├── mep-derivation-engine.ts         # محرك اشتقاق MEP (~1,500 سطر)
├── mep-merge.ts                     # دمج بنود MEP (~150 سطر)
├── mep-room-profiles.ts             # ملفات الغرف لـ MEP (12 نوع غرفة)
├── cutting/                         # نظام قص الحديد
│   ├── index.ts
│   ├── types.ts
│   ├── saudi-rebar-specs.ts
│   ├── cutting-optimizer.ts
│   └── remnant-manager.ts
│   └── waste-analyzer.ts
└── specs/                           # نظام المواصفات
    ├── spec-types.ts
    ├── spec-calculator.ts
    ├── selling-units.ts
    ├── system-templates.ts
    └── catalog/                     # كتالوج المواصفات (8 ملفات)
        ├── index.ts
        ├── plaster-catalog.ts
        ├── paint-catalog.ts
        ├── insulation-catalog.ts
        ├── flooring-catalog.ts
        ├── walls-ceiling-catalog.ts
        ├── doors-windows-catalog.ts
        ├── sanitary-kitchen-catalog.ts
        └── exterior-catalog.ts
```

---

## 3. تدفق البيانات والعمارة

### 3.1 الطبقات المعمارية

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js Pages (App Router)              │
│  page.tsx → يستدعي مكونات العرض مع organizationSlug      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              React Components (modules/saas/pricing/)    │
│  - useQuery / useMutation (TanStack React Query v5)      │
│  - orpc client (type-safe RPC)                           │
│  - sonner (toast notifications)                          │
│  - useTranslations (next-intl)                           │
└──────────────────────┬──────────────────────────────────┘
                       │ ORPC calls
┌──────────────────────▼──────────────────────────────────┐
│              API Procedures (packages/api/)               │
│  - protectedProcedure (قراءة فقط)                        │
│  - subscriptionProcedure (كتابة + ميزات مدفوعة)         │
│  - verifyOrganizationAccess() (صلاحيات)                  │
│  - Zod validation (input schemas)                        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Database Queries (packages/database/)        │
│  - Prisma 7 ORM                                          │
│  - Decimal → Number conversion                           │
│  - Auto-recalculate totals after changes                 │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              PostgreSQL Database                          │
│  - CostStudy + StructuralItem + FinishingItem            │
│  - MEPItem + LaborItem + Quote + CostingItem             │
│  - SpecTemplate + ManualItem + SectionMarkup             │
└─────────────────────────────────────────────────────────┘
```

### 3.2 تدفق بيانات MEP (كمثال)

```
1. المستخدم يُنشئ buildingConfig في قسم التشطيبات
   └→ building-config-update.ts يحفظ في DB

2. المستخدم يفتح صفحة MEP
   └→ MEPItemsEditor يقرأ study + buildingConfig
      └→ deriveMEPQuantities() يشتق البنود من buildingConfig
         └→ mergeMEPQuantities() يدمج المشتق مع المحفوظ
            └→ MEPDashboard يعرض النتيجة
               └→ المستخدم يحفظ → createBatch API

3. المستخدم يُعدّل buildingConfig
   └→ building-config-update.ts:
      ├→ يحدث بنود التشطيب (cascade)
      └→ يحذف بنود MEP التلقائية (deleteAutoMEPItems)
         └→ عند زيارة صفحة MEP مجدداً → إعادة اشتقاق
```

### 3.3 خط سير العمل (Pipeline)

```
الكميات → المواصفات → التكلفة → سعر البيع → عرض السعر
  (1)        (2)         (3)        (4)          (5)

كل مرحلة لها StageStatus: PENDING → IN_PROGRESS → COMPLETED → APPROVED
```

---

## 4. خريطة المكونات والعلاقات

### 4.1 سلسلة الاعتماديات الرئيسية

```
MEPItemsEditor.tsx
├── imports: MEPDashboard, MEPItemDialog, MEPBuildingRequired
├── imports: deriveMEPQuantities (from mep-derivation-engine)
├── imports: mergeMEPQuantities (from mep-merge)
├── uses: orpc.pricing.studies.mepItem.* (API calls)
└── uses: orpc.pricing.studies.getById (study query)

MEPDashboard.tsx
├── imports: MEPSummaryBar
├── imports: MEPCategorySection
├── imports: MEPManualAdder
├── imports: MEP_CATEGORIES, MEP_CATEGORY_ORDER
└── imports: formatCurrency (from utils)

MEPCategorySection.tsx
├── imports: MEPItemRow
├── imports: MEP_CATEGORIES, getMEPSubCategoryName
└── imports: formatCurrency (from utils)

FinishingItemsEditor.tsx
├── imports: QuantitiesDashboard / BuildingSetupWizard
├── imports: CascadeNotification
├── imports: derivation-engine
├── imports: merge-quantities
└── uses: orpc.pricing.studies.finishingItem.*
```

### 4.2 الـ Router (API)

```typescript
quantitiesRouter = {
  // CRUD أساسي
  list, getById, create, update, delete, duplicate, recalculate,

  // عناصر إنشائية
  structuralItem: { create, update, delete },

  // عناصر تشطيب
  finishingItem: { create, createBatch, update, delete, reorder, batchSpecUpdate },

  // إعدادات المبنى
  buildingConfig: { update },

  // عناصر MEP
  mepItem: { create, createBatch, update, delete, toggleEnabled },

  // عروض أسعار
  quote: { list, create, getById, update, delete },

  // قوالب مواصفات
  specTemplate: { list, create, update, delete, setDefault },

  // مراحل العمل
  stages: { get, approve, reopen, assign },

  // بنود يدوية
  manualItem: { list, create, update, delete, reorder },

  // ملخص الكميات
  quantitiesSummary,

  // مواصفات إنشائية
  structuralSpecs: { get, set },

  // التكلفة
  costing: { generate, getItems, updateItem, bulkUpdate, setSectionLabor, getSummary },

  // هامش الربح
  markup: { getSettings, setUniform, setSectionMarkups, getProfitAnalysis }
}
```

---

## 5. طبقة قاعدة البيانات

### 5.1 النماذج الرئيسية (Prisma Schema)

| النموذج | الحقول Decimal | العلاقات | ملاحظات |
|---------|---------------|----------|---------|
| CostStudy | 11 حقل عشري | structuralItems, finishingItems, mepItems, laborItems, quotes, boqItems, costingItems, manualItems, sectionMarkups | النموذج المركزي |
| StructuralItem | 8 حقول عشرية | costStudy | quantity, concreteVolume, steelWeight, etc. |
| FinishingItem | 12 حقل عشري | costStudy | area, length, height, materialPrice, etc. |
| MEPItem | 10 حقول عشرية | costStudy | quantity, materialPrice, laborPrice, etc. |
| LaborItem | 5 حقول عشرية | costStudy | dailyRate, insurance, housing, etc. |
| Quote | 5 حقول عشرية | costStudy | subtotal, overhead, profit, vat, total |

### 5.2 دوال قاعدة البيانات (35+ دالة)

```
# إدارة الدراسة
getOrganizationCostStudies()     → قائمة مع تصفية وصفحات
getCostStudyById()               → دراسة واحدة مع كل العلاقات
createCostStudy()                → إنشاء
updateCostStudy()                → تحديث بيانات أساسية
deleteCostStudy()                → حذف مع cascade
duplicateCostStudy()             → نسخ كامل مع كل البنود
recalculateCostStudyTotals()     → إعادة حساب المجاميع

# بنود إنشائية
createStructuralItem()
updateStructuralItem()
deleteStructuralItem()

# بنود تشطيب
createFinishingItem()
createFinishingItemsBatch()      → إنشاء دفعة
updateFinishingItem()
deleteFinishingItem()
reorderFinishingItems()          → إعادة ترتيب
getFinishingItemsForCascade()    → للتحديث التتابعي
batchUpdateFinishingItems()      → تحديث جماعي
batchUpdateFinishingItemSpecs()  → تحديث مواصفات جماعي
updateBuildingConfig()           → تحديث إعدادات المبنى

# بنود MEP
createMEPItem()                  → مع حساب التكلفة
createMEPItemsBatch()            → دفعة مع حسابات
updateMEPItem()                  → مع إعادة حساب + تحويل auto→manual
deleteMEPItem()
toggleMEPItemEnabled()           → تفعيل/تعطيل
deleteAutoMEPItems()             → حذف البنود التلقائية

# بنود عمالة
createLaborItem()
deleteLaborItem()

# عروض أسعار
createQuote()                    → ترقيم تلقائي QT-YYYY-NNNN
getQuoteById()
updateQuote()
deleteQuote()
getQuotesByCostStudyId()

# قوالب مواصفات
getSpecTemplates()
createSpecTemplate()
updateSpecTemplate()
deleteSpecTemplate()
setDefaultSpecTemplate()
```

### 5.3 حساب التكلفة

```
# MEP:
wastageMultiplier = 1 + (wastagePercent / 100)
materialCost = quantity × materialPrice × wastageMultiplier
laborCost = quantity × laborPrice    ← بدون هدر
unitPrice = materialPrice + laborPrice
totalCost = materialCost + laborCost

# إجمالي الدراسة:
structuralCost + finishingCost + mepCost + laborCost
+ overhead (%)
+ profit (%)
+ contingency (%)
+ VAT (15% if enabled)
= totalCost
```

---

## 6. طبقة الـ API

### 6.1 أنماط الإجراءات

| النمط | الاستخدام | عدد الإجراءات |
|-------|----------|--------------|
| `protectedProcedure` | قراءة فقط | ~8 |
| `subscriptionProcedure` | كتابة + ميزات مدفوعة | ~24 |

**نمط المصادقة الموحد:**
```typescript
.handler(async ({ input, context }) => {
    await verifyOrganizationAccess(organizationId, context.user.id, { section: "pricing", action: "studies" });
    const study = await getCostStudyById(costStudyId, organizationId);
    if (!study) throw new ORPCError("NOT_FOUND", { message: "..." });
    // ... business logic
})
```

### 6.2 تحويل Decimal → Number

كل الإجراءات تحوّل الحقول العشرية يدوياً:
```typescript
return {
    ...item,
    quantity: Number(item.quantity),
    materialPrice: Number(item.materialPrice),
    // ... etc
};
```

---

## 7. الأكواد المكررة والمتشابهة

### 7.1 تكرار `ICON_MAP` (مرتان)

**الملفات:**
- `components/mep/MEPDashboard.tsx:25-31`
- `components/mep/MEPCategorySection.tsx:22-29`

```typescript
// نفس التعريف بالضبط في ملفين
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    Zap, Droplets, Wind, Flame, Wifi, Settings,
};
```

**الحل:** استخراج إلى `lib/mep-icons.ts` واستيراده في المكونين.

---

### 7.2 تكرار `fmt()` / `formatNum()` (5 مرات)

**الملفات:**
| الملف | الدالة |
|-------|--------|
| `pipeline/CostingTable.tsx:59` | `fmt(n: number \| null)` |
| `pipeline/LumpSumAnalysis.tsx:27` | `fmt(n: number)` |
| `pipeline/ProfitAnalysis.tsx:33` | `fmt(n: number)` |
| `pipeline/SectionMarkupForm.tsx:46` | `fmt(n: number)` |
| `pipeline/CostingSummary.tsx:26` | `formatNum(n: number)` |

كلها تفعل نفس الشيء: `n.toLocaleString("ar-SA")`

**الحل:** استخدام `formatNumber()` الموجودة في `lib/utils.ts` بدلاً من إعادة التعريف.

---

### 7.3 تكرار `SECTION_LABELS` و `SECTION_COLORS` (3 مرات)

**الملفات:**
- `pipeline/CostingTable.tsx:43-57`
- `pipeline/CostingSummary.tsx:18-24`
- `pipeline/SectionMarkupForm.tsx:30-44`

```typescript
// نفس التعريف في 3 ملفات
const SECTION_LABELS: Record<string, string> = {
    STRUCTURAL: "إنشائي",
    FINISHING: "تشطيبات",
    MEP: "كهروميكانيكية",
    LABOR: "عمالة",
    MANUAL: "يدوي",
};
```

**الحل:** استخراج إلى `lib/costing-constants.ts` أو `constants/sections.ts`.

---

### 7.4 تكرار أنواع الحسابات (Type Definitions)

**المشكلة:** `ColumnInput`, `BeamInput`, `SlabInput`, `FoundationInput` معرّفة في مكانين:

| الموقع 1 | الموقع 2 |
|----------|----------|
| `types/columns.ts:13` (مفصّلة) | `lib/calculations.ts:123` (مبسّطة) |
| `types/beams.ts:13` | `lib/calculations.ts:214` |
| `types/foundations.ts` | `lib/calculations.ts:18` |

**ملاحظة:** ليست متطابقة تماماً — إصدارات الـ types أكثر تفصيلاً وتخدم غرضاً مختلفاً (واجهة المكونات vs معاملات الحساب). لكن الأسماء المتشابهة تسبب ارتباكاً.

**الحل:** إعادة تسمية أنواع الحسابات إلى `ColumnCalcInput`, `BeamCalcInput`, etc.

---

### 7.5 تكرار تحويل Decimal → Number

كل إجراء API يكتب نفس كود التحويل يدوياً. مثال:
```typescript
// يتكرر في 15+ ملف
return {
    ...item,
    quantity: Number(item.quantity),
    materialPrice: Number(item.materialPrice),
    laborPrice: Number(item.laborPrice),
    // ... 5-10 حقول أخرى
};
```

**الحل:** إنشاء دالة مساعدة `convertDecimalFields()` في مكان مشترك:
```typescript
function convertStudyDecimals(study) { /* ... */ }
function convertMEPItemDecimals(item) { /* ... */ }
function convertFinishingItemDecimals(item) { /* ... */ }
```

---

## 8. مشاكل الترجمة (i18n)

### 8.1 نصوص عربية مكتوبة مباشرة في الكود (8 مواضع)

| الملف | السطر | النص المكتوب مباشرة |
|-------|-------|---------------------|
| `mep/MEPBuildingRequired.tsx` | 27 | `"إعدادات المبنى مطلوبة"` |
| `mep/MEPBuildingRequired.tsx` | 30-31 | وصف كامل بالعربية |
| `mep/MEPDashboard.tsx` | 88 | `"تم تحديث إعدادات المبنى..."` |
| `mep/MEPDashboard.tsx` | 100 | `"حفظ البنود الجديدة"` |
| `mep/MEPDashboard.tsx` | 108 | `"بنود الأعمال الكهروميكانيكية"` |
| `mep/MEPDashboard.tsx` | 123 | `"إعادة اشتقاق"` |
| `mep/MEPItemDialog.tsx` | عدة | `"تعديل بند MEP"`, `"اسم البند"`, etc. |
| `mep/MEPManualAdder.tsx` | عدة | `"إضافة بند MEP يدوي"`, `"اختر الفئة"`, etc. |

**ملاحظة:** مفاتيح الترجمة موجودة بالفعل في `ar.json` و `en.json` (تمت إضافتها في المرحلة 7) لكن المكونات لا تستخدمها بعد.

### 8.2 مكونات لا تستخدم `useTranslations()`

- `MEPBuildingRequired.tsx` — يستورد `useTranslations` لكن لا يستخدمه
- `MEPDashboard.tsx` — لا يستورد `useTranslations`
- `MEPItemDialog.tsx` — لا يستورد `useTranslations`
- `MEPManualAdder.tsx` — لا يستورد `useTranslations`
- `MEPCategorySection.tsx` — لا يستورد `useTranslations`
- `MEPItemRow.tsx` — لا يستورد `useTranslations`
- `MEPSummaryBar.tsx` — لا يستورد `useTranslations`

**السبب:** مكونات MEP الجديدة (المراحل 4-5) لم تُدمج بعد مع نظام الترجمة.

### 8.3 مفاتيح ترجمة مكررة

مفاتيح MEP موجودة في مسارين مختلفين في ملفات JSON:
1. `studies.mep.*` (تحت pricing.studies)
2. `pricing.mep.*` (تحت pricing مباشرة)

يجب توحيد المسار واستخدام واحد فقط.

---

## 9. مشاكل الأداء

### 9.1 تحميل كل البنود دفعة واحدة

**المشكلة:** `getCostStudyById()` يحمّل جميع البنود (structural + finishing + MEP + labor + quotes + costingItems + manualItems) بدون تصفية أو صفحات.

```typescript
// cost-studies.ts: getCostStudyById
include: {
    structuralItems: true,    // قد تكون مئات
    finishingItems: true,     // قد تكون مئات
    mepItems: true,           // قد تكون مئات
    laborItems: true,
    quotes: true,
    costingItems: true,
    manualItems: true,
    sectionMarkups: true,
}
```

**التأثير:** للدراسات الكبيرة (مبنى 10 طوابق + 50 غرفة) قد تكون الاستجابة بطيئة.

**الحل المقترح:** تحميل البنود عند الحاجة فقط (lazy loading per tab) أو إضافة `select` لتقليل الحقول المحمّلة.

---

### 9.2 إعادة حساب المجاميع مع كل تغيير

**المشكلة:** `recalculateCostStudyTotals()` يُستدعى بعد كل عملية create/update/delete. يقوم بـ 4 عمليات aggregate منفصلة:

```typescript
// 4 استعلامات aggregate في كل مرة
const structural = await db.structuralItem.aggregate({ _sum: { totalCost: true } });
const finishing  = await db.finishingItem.aggregate({ _sum: { totalCost: true } });
const mep        = await db.mEPItem.aggregate({ _sum: { totalCost: true }, where: { isEnabled: true } });
const labor      = await db.laborItem.aggregate({ _sum: { totalCost: true } });
```

**التأثير:** ~4 استعلامات SQL إضافية مع كل عملية تعديل.

**الحل المقترح:**
- دمج الحسابات في transaction واحدة
- أو استخدام trigger في قاعدة البيانات
- أو تأخير إعادة الحساب (debounce) عند العمليات الجماعية

---

### 9.3 محرك اشتقاق MEP على الـ Frontend

**المشكلة:** `deriveMEPQuantities()` (~1,500 سطر) يعمل على الـ client-side في `useMemo`. يُنفَّذ مع كل تغيير في `buildingConfig` أو `study`.

**التأثير:** قد يسبب بطءاً على الأجهزة الضعيفة مع مباني كبيرة.

**الحل المقترح:** نقل المحرك إلى Web Worker أو تنفيذه على السيرفر (Server Action).

---

## 10. مشاكل الأنماط والاتساق

### 10.1 خلط `protectedProcedure` و `subscriptionProcedure`

**المشكلة:** بعض إجراءات القراءة تستخدم `subscriptionProcedure` (يتطلب اشتراك مدفوع) بدلاً من `protectedProcedure`:

| الإجراء | النوع الحالي | النوع الصحيح |
|---------|-------------|-------------|
| `quoteGetById` | subscriptionProcedure | protectedProcedure |
| `quoteList` | subscriptionProcedure | protectedProcedure |
| `specTemplateList` | subscriptionProcedure | protectedProcedure |

---

### 10.2 غياب التحقق من المدخلات (Input Validation)

**المشكلة:** مخططات Zod تقبل `z.number()` بدون قيود:
```typescript
// لا يمنع القيم السالبة
quantity: z.number(),
materialPrice: z.number(),
laborPrice: z.number(),
```

**الحل:** إضافة `.min(0)` أو `.nonnegative()` للحقول المالية والكمية.

---

### 10.3 عدم توحيد استجابة العمليات الجماعية

| العملية | الاستجابة |
|---------|----------|
| `createBatch` (finishing) | `{ success: true }` — بدون تفاصيل |
| `createBatch` (MEP) | `{ success: true }` — بدون تفاصيل |
| `create` (single) | يُرجع العنصر المُنشأ كاملاً |
| `reorder` | لا يُرجع شيئاً |

**الحل:** توحيد الاستجابة لتُرجع `{ success: true, count: N }` على الأقل.

---

### 10.4 رسائل الخطأ بالعربية فقط

كل رسائل `ORPCError` مكتوبة بالعربية فقط:
```typescript
throw new ORPCError("NOT_FOUND", { message: "دراسة التكلفة غير موجودة" });
```

**المشكلة:** لا يدعم التبديل بين اللغات. الـ API يجب أن يُرجع مفاتيح ترجمة أو يعتمد على لغة المستخدم.

---

## 11. الأكواد الميتة والمهملة

### 11.1 مجلد `_deprecated` (14 ملف, ~2,667 سطر)

```
components/studies/finishing/_deprecated/
├── AddEditFinishingItemDialog.tsx
├── BuildingConfigPanel.tsx
├── FinishingCategoryCard.tsx
├── FinishingGroupSection.tsx
├── FinishingItemRow.tsx
├── FinishingSummary.tsx
├── FloorSelector.tsx
├── QuickAddTemplates.tsx
├── calculators/
│   ├── DirectAreaCalculator.tsx
│   ├── LinearCalculator.tsx
│   ├── LumpSumCalculator.tsx
│   ├── PerUnitCalculator.tsx
│   ├── RoomByRoomCalculator.tsx
│   └── WallDeductionCalculator.tsx
```

**التوصية:** حذف هذا المجلد بالكامل. ~2,667 سطر من الكود لا يُستخدم ويزيد حجم المشروع.

---

## 12. الإيجابيات

### معمارية ممتازة
- فصل واضح بين الطبقات (UI → API → DB)
- استخدام ORPC لضمان أمان الأنواع بين Client و Server
- هيكل مجلدات منظم ومنطقي

### نظام اشتقاق ذكي
- محرك اشتقاق التشطيبات (~1,523 سطر) ومحرك MEP (~1,500 سطر) يوفران آلاف الساعات
- نظام دمج (merge) ذكي يحافظ على التعديلات اليدوية
- التحويل التلقائي من auto → manual عند تعديل الكميات

### نظام Cascade متقدم
- تحديث buildingConfig يُحدّث بنود التشطيب تلقائياً
- حذف بنود MEP التلقائية مع إعادة اشتقاقها عند الحاجة

### نظام مواصفات شامل
- كتالوج مواصفات (8 فئات)
- قوالب نظامية + قوالب مخصصة
- ربط المواصفات بالبنود

### أدوات حساب متقدمة
- حسابات إنشائية (خرسانة + حديد + قص)
- حسابات تشطيب (مساحات + خصم فتحات)
- حسابات MEP (كهرباء + سباكة + تكييف + حريق + تيار خفيف)
- حسابات تكلفة مع هدر ونسب ربح

### قابلية التوسع
- نظام الفئات (Categories) مرن ويسهل إضافة أنواع جديدة
- نظام الـ Pipeline يسمح بتتبع تقدم العمل عبر مراحل
- نظام الأدوار يحدد صلاحيات الوصول

### أمان البيانات
- التحقق من الصلاحيات في كل إجراء API
- التحقق من ملكية الدراسة قبل أي عملية
- Zod validation على كل المدخلات
- Cascade delete عند حذف الدراسة

---

## 13. السلبيات

### مشاكل حرجة (Critical)

| # | المشكلة | الملف | التأثير |
|---|---------|-------|--------|
| C1 | تحميل كل البنود دفعة واحدة في `getById` | `cost-studies.ts` | بطء مع الدراسات الكبيرة |
| C2 | نصوص عربية مكتوبة مباشرة في مكونات MEP | `MEP*.tsx` (7 ملفات) | لا يدعم الإنجليزية |
| C3 | ~2,667 سطر كود مهمل في `_deprecated/` | `finishing/_deprecated/` | تضخم المشروع |

### مشاكل متوسطة (Medium)

| # | المشكلة | الملف | التأثير |
|---|---------|-------|--------|
| M1 | تكرار `fmt()` في 5 ملفات | `pipeline/*.tsx` | صيانة مضاعفة |
| M2 | تكرار `SECTION_LABELS` في 3 ملفات | `pipeline/*.tsx` | عدم اتساق |
| M3 | تكرار `ICON_MAP` في ملفين | `MEPDashboard + MEPCategorySection` | صيانة مضاعفة |
| M4 | تكرار تحويل Decimal يدوياً في 15+ إجراء | `procedures/*.ts` | صيانة مضاعفة |
| M5 | مفاتيح ترجمة MEP مكررة في مسارين | `ar.json / en.json` | ارتباك |
| M6 | خلط `subscriptionProcedure` للقراءة | `quote-create.ts`, `spec-template-list.ts` | قيود غير ضرورية |
| M7 | غياب `.min(0)` على الحقول المالية | كل إجراءات الإنشاء/التحديث | بيانات غير صالحة |

### مشاكل بسيطة (Low)

| # | المشكلة | التأثير |
|---|---------|--------|
| L1 | استجابة `createBatch` لا تُرجع تفاصيل | عدم اتساق |
| L2 | رسائل خطأ API بالعربية فقط | لا يدعم i18n |
| L3 | أسماء أنواع متشابهة (`ColumnInput` في مكانين) | ارتباك المطورين |
| L4 | محرك الاشتقاق على الـ client | بطء على أجهزة ضعيفة |

---

## 14. خطة التحسين المقترحة

### المرحلة A: تنظيف سريع (1-2 ساعة)

- [ ] **A1:** حذف مجلد `_deprecated/` بالكامل (~2,667 سطر)
- [ ] **A2:** استخراج `ICON_MAP` المشترك إلى ملف واحد
- [ ] **A3:** استبدال `fmt()` المكررة بـ `formatNumber()` من `utils.ts`
- [ ] **A4:** استخراج `SECTION_LABELS` و `SECTION_COLORS` إلى ملف مشترك
- [ ] **A5:** توحيد مسار مفاتيح الترجمة MEP (حذف أحد المسارين)

### المرحلة B: ربط الترجمة (2-3 ساعات)

- [ ] **B1:** إضافة `useTranslations()` لجميع مكونات MEP (7 ملفات)
- [ ] **B2:** استبدال النصوص المكتوبة مباشرة بمفاتيح ترجمة
- [ ] **B3:** مراجعة رسائل toast في MEP (عربية مباشرة → مفاتيح ترجمة)
- [ ] **B4:** تحويل رسائل خطأ API لتدعم اللغتين

### المرحلة C: تحسين جودة الكود (2-3 ساعات)

- [ ] **C1:** إنشاء دوال مساعدة لتحويل Decimal:
  ```typescript
  // packages/api/lib/decimal-helpers.ts
  export function convertMEPItemDecimals(item) { /* ... */ }
  export function convertFinishingItemDecimals(item) { /* ... */ }
  export function convertStudyDecimals(study) { /* ... */ }
  ```
- [ ] **C2:** إضافة `.min(0)` / `.nonnegative()` لحقول Zod المالية
- [ ] **C3:** تصحيح نوع الإجراء لعمليات القراءة (quote/spec-template list)
- [ ] **C4:** إعادة تسمية أنواع الحسابات لتمييزها عن أنواع المكونات
- [ ] **C5:** توحيد استجابة `createBatch` لتُرجع `{ success: true, count: N }`

### المرحلة D: تحسين الأداء (4-6 ساعات)

- [ ] **D1:** تحميل البنود عند الحاجة (lazy load per tab):
  ```
  getById → يحمّل البيانات الأساسية فقط
  getStructuralItems → إجراء منفصل
  getFinishingItems → إجراء منفصل
  getMEPItems → إجراء منفصل
  ```
- [ ] **D2:** دمج استعلامات `recalculateCostStudyTotals()` في transaction واحدة
- [ ] **D3:** تقييم نقل محرك الاشتقاق إلى Web Worker

### المرحلة E: تحسينات مستقبلية (اختيارية)

- [ ] **E1:** إضافة caching للحسابات الثقيلة (React.memo + useMemo)
- [ ] **E2:** إضافة pagination للبنود في الدراسات الكبيرة
- [ ] **E3:** إضافة real-time collaboration (Optimistic Updates)
- [ ] **E4:** إنشاء Dashboard تحليلي لمقارنة الدراسات
- [ ] **E5:** إضافة export لـ Excel/PDF للتقارير

---

> **ملاحظة:** هذا التقرير يعكس حالة الكود في تاريخ 2026-03-10. يُوصى بتحديثه بعد كل مرحلة تحسين لتتبع التقدم.
