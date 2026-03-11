# تقرير تدقيق إعادة هيكلة التسعير — مسار
التاريخ: 2026-03-11

---

## ملخص تنفيذي

| المقياس | العدد |
|---------|-------|
| المكونات المطلوبة في الخطة | 25 |
| المكونات المنشأة فعلاً | 25 (100%) |
| المكونات المرتبطة بصفحة أو مكون آخر | 24 |
| المكونات اليتيمة (غير مستوردة) | 1 (`QuickPricingPageContent`) |
| صفحات page.tsx تستخدم V2 | 4 (costing, specifications, pricing, quotation) |
| صفحات page.tsx لا تزال على V1 | 1 (`selling-price` → `SellingPricePageContent`) |
| أخطاء TypeScript حقيقية (غير module resolution) | ~700+ (أغلبها ORPC `{}` type و implicit any) |

---

## حالة كل مرحلة

### المرحلة 1: إعادة الهيكلة الأساسية

| البند | الحالة | التفاصيل |
|-------|--------|----------|
| فصل المواصفات عن الكميات | ✅ | `SpecificationsPageContentV2` منفصل في `specifications/`، الكميات في `QuantitiesSubTabs` → `CostStudyOverview` |
| فصل التسعير النهائي عن تسعير التكلفة | ✅ | `CostingPageContentV2` (5 تبويبات) منفصل عن `PricingPageContentV2` (4 طرق هامش) |
| شاشة الإنشاء الذكية (نقاط دخول) | ✅ | `CreateStudyPage` → 5 أهداف، badges مراحل، redirect ذكي |
| تحديث القائمة الجانبية (Sidebar) | ✅ | `PRICING_NAV_SECTIONS` (dashboard, studies, quotations, leads) + `STUDY_NAV_ITEMS` (7 مراحل: overview → quantities → specs → costing → pricing → quotation → convert) |
| شريط المراحل الجديد (Pipeline Stepper) | ✅ | `StudyPipelineStepper` مستورد في `StudyPageShell` ويظهر في كل صفحة دراسة |
| نظام اعتماد المراحل | ✅ | `StageApprovalButton` مستخدم في `QuantitiesSubTabs` + V1 pipeline components |

### المرحلة 2: تحسين الكميات

| البند | الحالة | التفاصيل |
|-------|--------|----------|
| تبويبات الكميات (إنشائي/تشطيبات/MEP/يدوي) | ✅ | `QuantitiesSubTabs` → 4 tabs: `StructuralItemsEditor`, `FinishingItemsEditor`, `MEPItemsEditor`, `ManualItemsTable` |
| محرر الإنشائي المتقدم | ✅ | `StructuralItemsEditor` → `StructuralAccordion` → sections: Foundations, Columns, Beams, Slabs, Stairs, Blocks, PlainConcrete |
| محرر التشطيبات | ✅ | `FinishingItemsEditor` مستورد في `QuantitiesSubTabs` + `QuantitiesPageContent` |
| محرر الكهروميكانيكية | ✅ | `MEPItemsEditor` مستورد في `QuantitiesSubTabs` + `QuantitiesPageContent` |
| ملخص الكميات | ✅ | `QuantitiesSummary` مستخدم في `QuantitiesSubTabs` |
| طرق العرض المتعددة (للتشطيبات) | ⚠️ | `viewMode` موجود في `FinishingCostingTab` (cards/quick) و `QuantitiesDashboard` (byCategory) — لكن ليس بحسب الدور/البند كما في الخطة |
| حذف الأسعار من صفحة الكميات | ✅ | الكميات تعرض فقط كميات ووحدات بدون أسعار |

### المرحلة 3: تحسين المواصفات

| البند | الحالة | التفاصيل |
|-------|--------|----------|
| واجهة المواصفات الجديدة | ✅ | `SpecificationsPageContentV2` مفعل في `specifications/page.tsx` |
| قوالب المواصفات (اقتصادي/متوسط/فاخر) | ✅ | `SpecQuickTemplateBar` → 3 مستويات: اقتصادي، متوسط، فاخر |
| محرر المواصفات السطري | ✅ | `InlineSpecEditor` موجود (مستورد في V1 `SpecificationsPageContent`) |
| جدول المواد (BOM) | ✅ | `BOMSection` مستورد في `SpecificationsPageContentV2` |

### المرحلة 4: تحسين تسعير التكلفة

| البند | الحالة | التفاصيل |
|-------|--------|----------|
| CostingPageContentV2 مفعل في الراوت | ✅ | `costing/page.tsx` يستورد `CostingPageContentV2` |
| 5 تبويبات (إنشائي/تشطيبات/MEP/عمالة/ملخص) | ✅ | `StructuralCostingTab`, `FinishingCostingTab`, `MEPCostingTab`, `LaborOverviewTab`, `CostingSummaryTab` |
| بطاقات قابلة للتوسيع | ✅ | `expandedItems`/`expandedSections` + `ChevronDown` في `FinishingCostingTab` و `LaborOverviewTab` |
| سيناريوهات العمالة المتعددة | ✅ | 6 أنواع: `PER_SQM`, `PER_CBM`, `PER_UNIT`, `PER_LM`, `LUMP_SUM`, `SALARY` في `LaborOverviewTab` |
| طرق عرض متعددة (cards/quick) | ✅ | `viewMode` في `FinishingCostingTab` |

### المرحلة 5: التسعير وعرض السعر

| البند | الحالة | التفاصيل |
|-------|--------|----------|
| PricingPageContentV2 مفعل في الراوت | ✅ | `pricing/page.tsx` يستورد `PricingPageContentV2` |
| 4 طرق حساب الهامش | ✅ | `uniform`, `per_section`, `manual_price`, `per_sqm` |
| ProfitAnalysisCard | ✅ | مستورد في `PricingPageContentV2` |
| أنماط عرض السعر الـ 4 | ✅ | `DETAILED_BOQ`, `PER_SQM`, `LUMP_SUM`, `CUSTOM` في `QuotationFormatSelector` |
| QuotationPreviewV2 مفعل | ✅ | عبر `QuotationPreviewSwitch` → يختار V1 أو V2 حسب البيانات |
| QuotationCustomizer | ✅ | خيارات عرض الأعمدة + التجميع |
| QuotationDataForm | ✅ | بيانات العميل والتواريخ والشروط |

### المرحلة 6: السيناريوهات المتقدمة

| البند | الحالة | التفاصيل |
|-------|--------|----------|
| تحليل المقطوعية | ✅ | `LumpSumAnalysisSection` مستورد في `PricingPageContentV2` (يظهر عند `studyType === LUMP_SUM_ANALYSIS`) |
| استيراد الكميات | ✅ | `ImportItemsDialog` مستورد في `QuantitiesSubTabs` (يظهر في تبويب البنود اليدوية) |
| التسعير السريع | ⚠️ | `QuickPricingPageContent` **منشأ لكن غير مرتبط** — لا يوجد `page.tsx` له ولا مسار (route) |
| نقاط الدخول المتعددة | ✅ | `CreateStudyPage` → 5 أهداف مع redirect ذكي + stage badges |

---

## المكونات اليتيمة (منشأة لكن غير مرتبطة)

| الملف | السبب المحتمل | الإصلاح المطلوب |
|-------|---------------|-----------------|
| `pricing-v2/QuickPricingPageContent.tsx` | لا يوجد مسار (route) `pricing/quick/page.tsx` ولا يُستورد في أي ملف | إنشاء `apps/web/app/.../pricing/studies/[studyId]/quick-pricing/page.tsx` أو ربطه داخل `pricing/page.tsx` كوضع بديل |

---

## صفحات لا تزال تستخدم V1

| الصفحة (page.tsx) | المكون القديم | المكون الجديد المطلوب |
|-------------------|--------------|----------------------|
| `studies/[studyId]/selling-price/page.tsx` | `SellingPricePageContent` (V1) | **ملاحظة:** هذه الصفحة تبدو متكررة مع `pricing/page.tsx` الذي يستخدم `PricingPageContentV2`. يمكن إما حذفها أو تحويلها إلى redirect |

**ملاحظات:**
- `quantities/page.tsx` → redirect إلى الصفحة الرئيسية ✅ (الكميات في CostStudyOverview)
- `finishing/page.tsx` → redirect ✅
- `mep/page.tsx` → redirect ✅
- `structural/page.tsx` → redirect ✅

---

## تعديلات الـ Sidebar

| التعديل | الحالة |
|---------|--------|
| `PRICING_NAV_SECTIONS` (Dashboard, Studies, Quotations, Leads) | ✅ موجود في `shell/constants.ts` |
| `STUDY_NAV_ITEMS` (Overview → Quantities → Specs → Costing → Pricing → Quotation → Convert) | ✅ 7 عناصر مع ربط stage |
| `StudyPipelineStepper` في `StudyPageShell` | ✅ مرتبط |
| عدم وجود رابط "التسعير السريع" في القائمة | ⚠️ لا يوجد مسار `/pricing/quick` ضمن التنقل |

---

## أخطاء TypeScript المؤثرة (أعلى 10 ملفات)

| الملف | عدد الأخطاء | النوع الرئيسي | الأولوية |
|-------|------------|--------------|---------|
| `quotations/QuotationForm.tsx` | 100 | TS2339 (ORPC `{}` type) | P2 |
| `quotations/QuotationPreview.tsx` | 44 | TS2339 | P2 |
| `finishing/PaintItemDialog.tsx` | 40 | TS7006/TS2339 | P2 |
| `finishing/PlasterItemDialog.tsx` | 31 | TS7006/TS2339 | P2 |
| `costing-v2/StructuralCostingTab.tsx` | 29 | TS7006/TS2345 | P1 |
| `studies/SlabsSection.tsx` | 23 | TS7006/TS2339 | P2 |
| `costing-v2/MEPCostingTab.tsx` | 23 | TS7006/TS2345 | P1 |
| `studies/PricingEditor.tsx` | 20 | TS7006/TS2339 | P2 |
| `costing-v2/FinishingCostingTab.tsx` | 18 | TS7006/TS2345 | P1 |
| `costing-v2/CostingSummaryTab.tsx` | 13 | TS2339/TS7006 | P1 |

> **ملاحظة:** جميع أخطاء TS في ملفات V2 هي من نمط ORPC `{}` type inference. الحل: إضافة `as any` casts على query results و mutation parameters (نفس النمط المطبق على `PricingPageContentV2` و `StudyQuotationPageContent`).

---

## خطة الإصلاح المقترحة (مرتبة بالأولوية)

### P0 — ربط QuickPricingPageContent بالتطبيق
1. إنشاء مسار `pricing/studies/[studyId]/quick-pricing/page.tsx` يستورد `QuickPricingPageContent`
2. أو: ربطه داخل `PricingPageContentV2` كوضع بديل للدراسات من نوع `CUSTOM_ITEMS` / `QUOTATION_ONLY`
3. تحديث `STUDY_NAV_ITEMS` أو `CreateStudyPage` redirect ليوجه لهذا المسار

### P1 — إصلاح أخطاء TypeScript في ملفات costing-v2
1. `StructuralCostingTab.tsx` (29 خطأ) — `as any` casts
2. `MEPCostingTab.tsx` (23 خطأ) — `as any` casts
3. `FinishingCostingTab.tsx` (18 خطأ) — `as any` casts + explicit `(e: any)` types
4. `CostingSummaryTab.tsx` (13 خطأ) — `as any` casts
5. `LaborOverviewTab.tsx` (9 أخطاء) — `as any` casts

### P2 — معالجة صفحة selling-price المتكررة
1. تحويل `selling-price/page.tsx` إلى redirect لـ `pricing/page.tsx` (حيث أن `PricingPageContentV2` يحل محل `SellingPricePageContent`)
2. أو حذف المسار إذا لم يكن مطلوبًا

### P3 — إصلاح أخطاء TypeScript في باقي الملفات
- `QuotationForm.tsx` (100 خطأ)
- `QuotationPreview.tsx` (44 خطأ)
- `PaintItemDialog.tsx` (40 خطأ)
- وباقي الملفات بترتيب الأولوية

### P4 — تحسينات طرق العرض (اختياري)
- إضافة طرق عرض "بحسب الدور" و "بحسب البند" في تبويب التشطيبات (الكميات)
- حاليًا يوجد فقط `byCategory` في `QuantitiesDashboard`

---

## ملخص الملفات الرئيسية وحالة الربط

### ملفات V2 (الإصدارات الجديدة)
| الملف | مرتبط بـ page.tsx | يعمل |
|-------|-------------------|------|
| `CostingPageContentV2` | ✅ `costing/page.tsx` | ✅ |
| `PricingPageContentV2` | ✅ `pricing/page.tsx` | ✅ |
| `SpecificationsPageContentV2` | ✅ `specifications/page.tsx` | ✅ |
| `QuotationPreviewV2` | ✅ عبر `QuotationPreviewSwitch` → `preview/page.tsx` | ✅ |

### مكونات المرحلة 6
| المكون | مرتبط | في أي ملف |
|--------|-------|-----------|
| `LumpSumAnalysisSection` | ✅ | `PricingPageContentV2` (شرطي: `studyType === LUMP_SUM_ANALYSIS`) |
| `ImportItemsDialog` | ✅ | `QuantitiesSubTabs` (تبويب البنود اليدوية) |
| `QuickPricingPageContent` | ❌ | **غير مرتبط — لا يوجد page.tsx** |
| `CreateStudyPage` | ✅ | `studies/new/page.tsx` |

### الملفات القديمة (V1) التي لا تزال تعمل
| الملف | لماذا لا يزال موجودًا |
|-------|----------------------|
| `SellingPricePageContent` | `selling-price/page.tsx` يستورده — متكرر مع `PricingPageContentV2` |
| `CostingPageContent` (V1) | لا يُستورد في أي page.tsx (V2 يحل محله) ✅ |
| `SpecificationsPageContent` (V1) | لا يُستورد في أي page.tsx (V2 يحل محله) ✅ |
| `QuantitiesPageContent` (V1) | لا يُستورد في أي page.tsx ✅ |
