# تقرير شامل: قسم التسعير والدراسات (Pricing/Studies)

> **مرجع تطويري شامل** لقسم `pricing/studies` في مشروع مسار
> **التاريخ:** 2026-03-10
> **إجمالي الملفات:** ~171 ملف

---

## جدول المحتويات

1. [نظرة عامة على القسم](#1-نظرة-عامة-على-القسم)
2. [هيكل الملفات الكامل](#2-هيكل-الملفات-الكامل)
3. [الروابط والصفحات](#3-الروابط-والصفحات)
4. [قاعدة البيانات](#4-قاعدة-البيانات)
5. [إجراءات API](#5-إجراءات-api)
6. [منطق التسعير والحسابات](#6-منطق-التسعير-والحسابات)
7. [الميزات الذكية](#7-الميزات-الذكية)
8. [خط سير العمل (Pipeline)](#8-خط-سير-العمل-pipeline)
9. [رحلة المستخدم الكاملة](#9-رحلة-المستخدم-الكاملة)
10. [الصلاحيات والأدوار](#10-الصلاحيات-والأدوار)
11. [الأقسام الفرعية](#11-الأقسام-الفرعية)
12. [المشاكل والتحسينات المحتملة](#12-المشاكل-والتحسينات-المحتملة)

---

## 1. نظرة عامة على القسم

### الغرض
قسم التسعير والدراسات هو المحرك الأساسي لعملية ما قبل التعاقد في مشروع مسار. يغطي دورة حياة كاملة من:
- **استقبال العميل المحتمل** (Lead)
- **إعداد دراسة التكلفة** (Cost Study) بالطريقة الذكية أو اليدوية
- **حساب الكميات** للعناصر الإنشائية والتشطيبات والكهروميكانيكية
- **تحديد المواصفات** والأسعار
- **إصدار عرض السعر** (Quotation)
- **تحويل العميل لمشروع** فعلي

### التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|----------|
| **Next.js App Router** | الصفحات والتوجيه |
| **ORPC** | إجراءات API (بديل tRPC) |
| **React Query** | إدارة حالة البيانات والتخزين المؤقت |
| **Prisma** | ORM لقاعدة البيانات |
| **PostgreSQL** | قاعدة البيانات |
| **TypeScript** | لغة البرمجة |
| **Tailwind CSS + shadcn/ui** | واجهة المستخدم |
| **S3 (Cloudflare R2)** | تخزين الملفات |

### البنية المعمارية
```
apps/web/modules/saas/pricing/     → واجهة المستخدم (Frontend)
packages/api/modules/quantities/   → إجراءات الكميات والدراسات (Backend)
packages/api/modules/pricing/      → إجراءات التسعير والعملاء المحتملين (Backend)
packages/api/modules/finance/      → إجراءات عروض الأسعار والمالية (Backend)
packages/database/prisma/          → نماذج قاعدة البيانات (Schema)
```

---

## 2. هيكل الملفات الكامل

### 2.1 ملفات الصفحات (Pages) — 20 صفحة

```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/
├── page.tsx                                          → لوحة المعلومات الرئيسية
├── studies/
│   ├── page.tsx                                      → قائمة الدراسات
│   ├── new/page.tsx                                  → إنشاء دراسة جديدة
│   └── [studyId]/
│       ├── page.tsx                                  → نظرة عامة على الدراسة
│       ├── quantities/page.tsx                       → الكميات
│       ├── structural/page.tsx                       → العناصر الإنشائية
│       ├── finishing/page.tsx                         → التشطيبات
│       ├── mep/page.tsx                              → الكهروميكانيكية
│       ├── specifications/page.tsx                   → المواصفات
│       ├── costing/page.tsx                          → التكاليف
│       ├── pricing/page.tsx                          → التسعير
│       └── selling-price/page.tsx                    → سعر البيع
├── quotations/
│   ├── page.tsx                                      → قائمة عروض الأسعار
│   ├── new/page.tsx                                  → إنشاء عرض سعر
│   └── [quotationId]/
│       ├── page.tsx                                  → تفاصيل عرض السعر
│       └── preview/page.tsx                          → معاينة عرض السعر
└── leads/
    ├── page.tsx                                      → قائمة العملاء المحتملين
    ├── new/page.tsx                                  → إضافة عميل محتمل
    └── [leadId]/
        ├── page.tsx                                  → تفاصيل العميل
        └── edit/page.tsx                             → تعديل العميل
```

### 2.2 المكونات (Components) — 92 ملف

#### Dashboard (لوحة المعلومات)
```
components/dashboard/
└── PricingDashboard.tsx                              → لوحة معلومات القسم الرئيسية
```

#### Shell (الهيكل والتنقل)
```
components/shell/
├── PricingShell.tsx                                   → الهيكل الخارجي للقسم
├── PricingNavigation.tsx                              → شريط التنقل الجانبي
├── PricingSubPageHeader.tsx                            → رأس الصفحات الفرعية
├── constants.ts                                       → ثوابت التنقل والمسارات
└── index.ts
```

#### Studies (الدراسات) — 28 ملف
```
components/studies/
├── CostStudyCard.tsx                                  → بطاقة عرض الدراسة
├── CostStudyOverview.tsx                              → نظرة عامة على الدراسة
├── CreateCostStudyForm.tsx                             → نموذج إنشاء دراسة
├── FinishingItemsEditor.tsx                            → محرر بنود التشطيبات
├── MEPItemsEditor.tsx                                 → محرر بنود الكهروميكانيكية
├── PricingEditor.tsx                                  → محرر التسعير
├── QuantitiesList.tsx                                 → قائمة الكميات
├── QuantitiesSubTabs.tsx                              → تبويبات فرعية للكميات
├── StructuralAccordion.tsx                             → أكورديون العناصر الإنشائية
├── StructuralItemsEditor.tsx                          → محرر العناصر الإنشائية
├── StudyHeaderCard.tsx                                → بطاقة رأس الدراسة
├── StudyPageShell.tsx                                 → هيكل صفحة الدراسة
├── StudyPipelineStepper.tsx                            → شريط مراحل الدراسة (5 مراحل)
├── SummaryStatsCards.tsx                               → بطاقات إحصائية ملخصة
├── index.ts
│
├── finishing/                                         → حوارات بنود التشطيبات
│   ├── PaintItemDialog.tsx                            → حوار بند الدهان
│   ├── PlasterItemDialog.tsx                          → حوار بند اللياسة
│   ├── ThermalInsulationItemDialog.tsx                → حوار بند العزل الحراري
│   └── WaterproofingItemDialog.tsx                    → حوار بند العزل المائي
│
├── sections/                                          → أقسام العناصر الإنشائية
│   ├── FoundationsSection.tsx                         → قسم الأساسات
│   ├── ColumnsSection.tsx                             → قسم الأعمدة
│   ├── BeamsSection.tsx                               → قسم الكمرات
│   ├── SlabsSection.tsx                               → قسم البلاطات
│   ├── StairsSection.tsx                              → قسم الدرج
│   ├── BlocksSection.tsx                              → قسم البلوك
│   ├── PlainConcreteSection.tsx                       → قسم الخرسانة العادية
│   └── index.ts
│
└── shared/                                            → مكونات مشتركة
    ├── CalculationResultsPanel.tsx                     → لوحة نتائج الحسابات
    ├── ConcreteTypeSelect.tsx                          → اختيار نوع الخرسانة
    ├── DimensionsCard.tsx                              → بطاقة الأبعاد
    ├── ElementHeaderRow.tsx                            → صف رأس العنصر
    ├── RebarBarsInput.tsx                              → إدخال قضبان التسليح
    ├── RebarMeshInput.tsx                              → إدخال شبك التسليح
    ├── RebarWeightBadge.tsx                            → شارة وزن التسليح
    ├── StirrupsInput.tsx                               → إدخال الكانات
    └── index.ts
```

#### Finishing (التشطيبات) — 12 ملف
```
components/finishing/
├── BuildingSetupWizard.tsx                             → معالج إعداد المبنى (4 خطوات)
├── BuildingSummaryBar.tsx                              → شريط ملخص المبنى
├── CascadeNotification.tsx                            → إشعار التحديثات المتسلسلة
├── KnowledgeNotification.tsx                          → إشعار استخراج المعرفة
├── ManualItemAdder.tsx                                → إضافة بنود يدوية
├── QuantitiesDashboard.tsx                            → لوحة الكميات
├── QuantitiesTable.tsx                                → جدول الكميات
├── QuantityRowExpanded.tsx                            → صف كمية موسّع
│
├── specs/                                             → المواصفات
│   ├── BillOfMaterials.tsx                            → جدول المواد
│   ├── ItemSpecEditor.tsx                             → محرر مواصفات البند
│   ├── SpecBulkEditor.tsx                             → محرر مجمّع للمواصفات
│   └── TemplateManager.tsx                            → مدير القوالب
│
└── wizard/                                            → خطوات المعالج
    ├── BuildingStructureStep.tsx                       → خطوة هيكل المبنى
    ├── ExteriorStep.tsx                               → خطوة الخارجي
    ├── FloorDetailsStep.tsx                           → خطوة تفاصيل الأدوار
    └── ReviewStep.tsx                                 → خطوة المراجعة
```

#### MEP (كهروميكانيكية) — 7 ملفات
```
components/mep/
├── MEPBuildingRequired.tsx                            → تنبيه: يتطلب إعداد المبنى
├── MEPCategorySection.tsx                             → قسم فئة MEP
├── MEPDashboard.tsx                                   → لوحة MEP الرئيسية
├── MEPItemDialog.tsx                                  → حوار بند MEP
├── MEPItemRow.tsx                                     → صف بند MEP
├── MEPManualAdder.tsx                                 → إضافة بنود يدوية
└── MEPSummaryBar.tsx                                  → شريط ملخص MEP
```

#### Pipeline (خط سير العمل) — 17 ملف
```
components/pipeline/
├── PipelineBar.tsx                                    → شريط المراحل
├── StageApprovalButton.tsx                            → زر الموافقة على المرحلة
├── QuantitiesPageContent.tsx                           → محتوى صفحة الكميات
├── QuantitiesSummary.tsx                              → ملخص الكميات
├── SpecificationsPageContent.tsx                       → محتوى صفحة المواصفات
├── StructuralSpecs.tsx                                → مواصفات إنشائية
├── CostingPageContent.tsx                             → محتوى صفحة التكاليف
├── CostingTable.tsx                                   → جدول التكاليف
├── CostingSummary.tsx                                 → ملخص التكاليف
├── LaborCostInput.tsx                                 → إدخال تكلفة العمالة
├── ManualItemsTable.tsx                               → جدول البنود اليدوية
├── LumpSumAnalysis.tsx                                → تحليل المبلغ الإجمالي
├── MarkupMethodSelector.tsx                           → اختيار طريقة هامش الربح
├── UniformMarkupForm.tsx                              → نموذج هامش موحد
├── SectionMarkupForm.tsx                              → نموذج هامش حسب القسم
├── SellingPricePageContent.tsx                         → محتوى صفحة سعر البيع
└── ProfitAnalysis.tsx                                 → تحليل الأرباح
```

#### Pricing (التسعير) — 6 ملفات
```
components/pricing/
├── StructuralPricingSection.tsx                        → قسم تسعير إنشائي
├── FinishingPricingSection.tsx                         → قسم تسعير تشطيبات
├── MEPPricingSection.tsx                              → قسم تسعير كهروميكانيكية
├── PricingItemRow.tsx                                 → صف بند تسعير
├── PricingSettingsCard.tsx                             → بطاقة إعدادات التسعير
└── PricingSummaryBar.tsx                              → شريط ملخص التسعير
```

#### Quotations (عروض الأسعار) — 4 ملفات
```
components/quotations/
├── QuotationForm.tsx                                  → نموذج عرض السعر
├── QuotationPreview.tsx                               → معاينة عرض السعر
├── QuotationsHeaderActions.tsx                         → أزرار رأس عروض الأسعار
└── QuotationsList.tsx                                 → قائمة عروض الأسعار
```

#### Leads (العملاء المحتملون) — 25 ملف
```
components/leads/
├── CreateLeadButton.tsx                               → زر إنشاء عميل
├── CreateLeadForm.tsx                                 → نموذج إنشاء
├── CreateLeadPage.tsx                                 → صفحة إنشاء
├── EditLeadForm.tsx                                   → نموذج تعديل
├── EditLeadPage.tsx                                   → صفحة تعديل
├── LeadsListPage.tsx                                  → صفحة القائمة
├── LeadsTable.tsx                                     → الجدول الرئيسي
├── LeadsFilters.tsx                                   → فلاتر البحث
├── LeadCard.tsx                                       → بطاقة العميل
├── LeadDetailPage.tsx                                 → صفحة التفاصيل
├── LeadHeader.tsx                                     → رأس صفحة العميل
├── LeadInfoTab.tsx                                    → تبويب المعلومات
├── LeadActivityTab.tsx                                → تبويب النشاطات
├── LeadFilesTab.tsx                                   → تبويب الملفات
├── LeadLinkedTab.tsx                                  → تبويب الربط (دراسات/عروض)
├── LeadStatsCards.tsx                                 → بطاقات إحصائية
├── LeadStatusBadge.tsx                                → شارة الحالة
├── LeadPriorityIndicator.tsx                          → مؤشر الأولوية
├── ActivityFeedItem.tsx                               → عنصر سجل النشاط
├── CommentBox.tsx                                     → صندوق التعليقات
├── LeadFileUploadZone.tsx                             → منطقة رفع الملفات
├── PendingFilesUpload.tsx                             → ملفات قيد الرفع
├── UpdateLeadStatusDialog.tsx                         → حوار تحديث الحالة
├── ConvertToProjectDialog.tsx                         → حوار التحويل لمشروع
├── LinkCostStudyDialog.tsx                            → حوار ربط دراسة تكلفة
└── LinkQuotationDialog.tsx                            → حوار ربط عرض سعر
```

### 2.3 المكتبات والحسابات (lib/) — 48 ملف

#### الحسابات الأساسية
```
lib/
├── calculations.ts                                    → حسابات إنشائية أساسية (687 سطر)
├── structural-calculations.ts                         → حسابات إنشائية متقدمة (49 KB)
├── pricing-calculations.ts                            → معادلات التسعير
├── merge-quantities.ts                                → دمج الكميات
├── costing-constants.ts                               → ثوابت التكاليف والأقسام
├── utils.ts                                           → أدوات مساعدة
└── index.ts
```

#### محركات الاشتقاق الذكية
```
lib/
├── derivation-engine.ts                               → محرك اشتقاق التشطيبات (50 KB)
├── mep-derivation-engine.ts                           → محرك اشتقاق MEP (80 KB)
├── knowledge-extractor.ts                             → مستخرج المعرفة من البنود اليدوية (617 سطر)
├── smart-building-types.ts                            → أنواع المبنى الذكي (143 سطر)
```

#### التشطيبات
```
lib/
├── finishing-types.ts                                 → أنواع التشطيبات
├── finishing-categories.ts                            → 26 فئة في 15 مجموعة عمل
├── finishing-templates.ts                             → قوالب التشطيبات
├── finishing-links.ts                                 → روابط التشطيبات
├── paint-config.ts                                    → إعدادات الدهان
├── plaster-config.ts                                  → إعدادات اللياسة
└── insulation-config.ts                               → إعدادات العزل
```

#### الكهروميكانيكية (MEP)
```
lib/
├── mep-categories.ts                                  → فئات: كهرباء، سباكة، تكييف، حريق...
├── mep-icons.ts                                       → أيقونات الفئات
├── mep-prices.ts                                      → أسعار MEP
├── mep-room-profiles.ts                               → ملفات تعريف الغرف (10 أنواع)
└── mep-merge.ts                                       → دمج بنود MEP
```

#### مُحسّن القص (Cutting Optimizer)
```
lib/cutting/
├── cutting-optimizer.ts                               → خوارزمية القص 1D (الإصدار V5)
├── types.ts                                           → أنواع البيانات
├── waste-analyzer.ts                                  → محلل الهالك
├── remnant-manager.ts                                 → مدير البواقي
├── saudi-rebar-specs.ts                               → مواصفات حديد التسليح السعودية
└── index.ts
```

#### المواصفات والكتالوج
```
lib/specs/
├── spec-types.ts                                      → أنواع المواصفات
├── spec-calculator.ts                                 → حاسبة المواصفات
├── selling-units.ts                                   → وحدات البيع
├── system-templates.ts                                → قوالب النظام
└── catalog/
    ├── index.ts
    ├── doors-windows-catalog.ts                       → كتالوج أبواب ونوافذ
    ├── exterior-catalog.ts                            → كتالوج خارجي
    ├── flooring-catalog.ts                            → كتالوج أرضيات
    ├── insulation-catalog.ts                          → كتالوج عزل
    ├── paint-catalog.ts                               → كتالوج دهان
    ├── plaster-catalog.ts                             → كتالوج لياسة
    ├── sanitary-kitchen-catalog.ts                    → كتالوج أدوات صحية ومطابخ
    └── walls-ceiling-catalog.ts                       → كتالوج جدران وأسقف
```

### 2.4 الأنواع (types/) — 7 ملفات
```
types/
├── index.ts                                           → تصدير جميع الأنواع
├── foundations.ts                                     → أنواع الأساسات
├── columns.ts                                         → أنواع الأعمدة
├── beams.ts                                           → أنواع الكمرات
├── slabs.ts                                           → أنواع البلاطات
├── blocks.ts                                          → أنواع البلوك
└── mep.ts                                             → أنواع الكهروميكانيكية
```

### 2.5 الثوابت (constants/) — 4 ملفات
```
constants/
├── index.ts
├── prices.ts                                          → جميع أسعار المواد والعمالة
├── blocks.ts                                          → ثوابت البلوك
└── slabs.ts                                           → ثوابت البلاطات
```

---

## 3. الروابط والصفحات

### 3.1 جميع مسارات URL

| المسار | الصفحة | الوصف |
|--------|--------|-------|
| `/app/[org]/pricing` | Dashboard | لوحة المعلومات الرئيسية |
| `/app/[org]/pricing/studies` | Studies List | قائمة دراسات التكلفة |
| `/app/[org]/pricing/studies/new` | New Study | إنشاء دراسة جديدة |
| `/app/[org]/pricing/studies/[studyId]` | Study Overview | نظرة عامة على الدراسة |
| `/app/[org]/pricing/studies/[studyId]/quantities` | Quantities | مرحلة الكميات |
| `/app/[org]/pricing/studies/[studyId]/structural` | Structural | العناصر الإنشائية |
| `/app/[org]/pricing/studies/[studyId]/finishing` | Finishing | التشطيبات |
| `/app/[org]/pricing/studies/[studyId]/mep` | MEP | الكهروميكانيكية |
| `/app/[org]/pricing/studies/[studyId]/specifications` | Specifications | المواصفات |
| `/app/[org]/pricing/studies/[studyId]/costing` | Costing | التكاليف |
| `/app/[org]/pricing/studies/[studyId]/pricing` | Pricing | التسعير |
| `/app/[org]/pricing/studies/[studyId]/selling-price` | Selling Price | سعر البيع |
| `/app/[org]/pricing/quotations` | Quotations List | قائمة عروض الأسعار |
| `/app/[org]/pricing/quotations/new` | New Quotation | إنشاء عرض سعر |
| `/app/[org]/pricing/quotations/[quotationId]` | Quotation Detail | تفاصيل عرض السعر |
| `/app/[org]/pricing/quotations/[quotationId]/preview` | Quotation Preview | معاينة عرض السعر |
| `/app/[org]/pricing/leads` | Leads List | قائمة العملاء المحتملين |
| `/app/[org]/pricing/leads/new` | New Lead | إضافة عميل محتمل |
| `/app/[org]/pricing/leads/[leadId]` | Lead Detail | تفاصيل العميل |
| `/app/[org]/pricing/leads/[leadId]/edit` | Edit Lead | تعديل العميل |

### 3.2 التنقل الرئيسي (Navigation)

```typescript
// apps/web/modules/saas/pricing/components/shell/constants.ts
PRICING_NAV_SECTIONS = [
  { id: "dashboard", path: "",           icon: HomeIcon },
  { id: "studies",   path: "studies",    icon: Calculator },
  { id: "quotations", path: "quotations", icon: FileSpreadsheet },
  { id: "leads",    path: "leads",       icon: UserSearch }
]
```

---

## 4. قاعدة البيانات

### 4.1 النماذج الأساسية (Models)

#### CostStudy — دراسة التكلفة (الكيان الأساسي)
**الملف:** `packages/database/prisma/schema.prisma` (سطر 1202-1290)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `id` | String (PK) | معرف فريد |
| `organizationId` | String (FK) | المنظمة |
| `createdById` | String (FK) | المنشئ |
| `name` | String? | اسم الدراسة |
| `customerName` | String? | اسم العميل |
| `customerId` | String? | معرف العميل |
| `projectType` | String | نوع المشروع |
| `landArea` | Decimal(15,4) | مساحة الأرض |
| `buildingArea` | Decimal(15,4) | مساحة البناء |
| `numberOfFloors` | Int | عدد الأدوار |
| `hasBasement` | Boolean | يوجد بدروم |
| `finishingLevel` | String | مستوى التشطيب |
| `structuralCost` | Decimal(15,2) | تكلفة إنشائية |
| `finishingCost` | Decimal(15,2) | تكلفة تشطيبات |
| `mepCost` | Decimal(15,2) | تكلفة كهروميكانيكية |
| `laborCost` | Decimal(15,2) | تكلفة عمالة |
| `overheadPercent` | Decimal(5,2) | نسبة المصاريف العامة (افتراضي: 5%) |
| `profitPercent` | Decimal(5,2) | نسبة الربح (افتراضي: 10%) |
| `contingencyPercent` | Decimal(5,2) | نسبة الاحتياط (افتراضي: 3%) |
| `vatIncluded` | Boolean | تضمين ضريبة القيمة المضافة |
| `totalCost` | Decimal(15,2) | التكلفة الإجمالية |
| `buildingConfig` | Json? | إعدادات المبنى الذكي |
| `status` | String | الحالة (draft) |
| `studyType` | StudyType | نوع الدراسة |
| `quantitiesStatus` | StageStatus | حالة مرحلة الكميات |
| `specsStatus` | StageStatus | حالة مرحلة المواصفات |
| `costingStatus` | StageStatus | حالة مرحلة التكاليف |
| `pricingStatus` | StageStatus | حالة مرحلة التسعير |
| `quotationStatus` | StageStatus | حالة مرحلة عرض السعر |
| `quantitiesAssigneeId` | String? | مسؤول الكميات |
| `specsAssigneeId` | String? | مسؤول المواصفات |
| `costingAssigneeId` | String? | مسؤول التكاليف |
| `pricingAssigneeId` | String? | مسؤول التسعير |
| `contractValue` | Decimal(15,2)? | قيمة العقد |
| `structuralSpecs` | Json? | مواصفات إنشائية |
| `notes` | Text? | ملاحظات |

**العلاقات:**
- `structuralItems` → StructuralItem[] (البنود الإنشائية)
- `finishingItems` → FinishingItem[] (بنود التشطيبات)
- `mepItems` → MEPItem[] (بنود الكهروميكانيكية)
- `laborItems` → LaborItem[] (بنود العمالة)
- `costingItems` → CostingItem[] (بنود التكاليف)
- `manualItems` → ManualItem[] (البنود اليدوية)
- `sectionMarkups` → SectionMarkup[] (هوامش الأقسام)
- `quotes` → Quote[] (عروض الأسعار)
- `lead` → Lead? (العميل المحتمل)

---

#### StructuralItem — بند إنشائي
**الملف:** سطر 1293-1326

| الحقل | النوع | الوصف |
|-------|------|-------|
| `category` | String | الفئة (foundations, columns, beams, slabs...) |
| `subCategory` | String? | فئة فرعية |
| `name` | String | اسم البند |
| `dimensions` | Json? | الأبعاد |
| `quantity` | Decimal(15,4) | الكمية |
| `unit` | String | الوحدة |
| `concreteVolume` | Decimal(15,4)? | حجم الخرسانة (م³) |
| `concreteType` | String? | نوع الخرسانة (C20, C25...) |
| `steelWeight` | Decimal(15,4)? | وزن الحديد (كجم) |
| `steelRatio` | Decimal(5,2)? | نسبة الحديد |
| `wastagePercent` | Decimal(5,2) | نسبة الهالك (افتراضي: 10%) |
| `materialCost` | Decimal(15,2) | تكلفة المواد |
| `laborCost` | Decimal(15,2) | تكلفة العمالة |
| `totalCost` | Decimal(15,2) | التكلفة الإجمالية |

---

#### FinishingItem — بند تشطيبات
**الملف:** سطر 1329-1390

| الحقل | النوع | الوصف |
|-------|------|-------|
| `category` | String | الفئة (paint, plaster, flooring...) |
| `floorId` | String? | معرف الطابق |
| `floorName` | String? | اسم الطابق |
| `area` | Decimal(15,2)? | المساحة |
| `length/height/width` | Decimal? | الأبعاد |
| `perimeter` | Decimal(15,2)? | المحيط |
| `quantity` | Decimal(15,2)? | الكمية |
| `unit` | String | الوحدة (افتراضي: m2) |
| `calculationMethod` | String? | طريقة الحساب |
| `calculationData` | Json? | بيانات الحساب |
| `dataSource` | String? | مصدر البيانات (auto_building, manual...) |
| `isEnabled` | Boolean | مفعّل |
| `scope` | String? | النطاق (per_floor, whole_building...) |
| `qualityLevel` | String? | مستوى الجودة (economic, medium, luxury) |
| `specData` | Json? | بيانات المواصفات |
| `wastagePercent` | Decimal(5,2) | نسبة الهالك |
| `materialPrice/laborPrice` | Decimal(15,2) | سعر الوحدة |
| `materialCost/laborCost` | Decimal(15,2) | التكلفة |

---

#### MEPItem — بند كهروميكانيكي
**الملف:** سطر 1414-1474

| الحقل | النوع | الوصف |
|-------|------|-------|
| `category` | String | الفئة (ELECTRICAL, PLUMBING, HVAC, FIREFIGHTING...) |
| `subCategory` | String | فئة فرعية |
| `itemType` | String? | نوع البند |
| `floorId/floorName` | String? | الطابق |
| `roomId/roomName` | String? | الغرفة |
| `scope` | String | النطاق (per_room, per_floor, building) |
| `quantity` | Decimal(15,2) | الكمية |
| `unit` | String | الوحدة (افتراضي: عدد) |
| `calculationMethod` | String | طريقة الحساب |
| `dataSource` | String | مصدر البيانات |
| `qualityLevel` | String? | مستوى الجودة |
| `materialPrice/laborPrice` | Decimal(15,2) | أسعار الوحدة |
| `wastagePercent` | Decimal(5,2) | الهالك (افتراضي: 10%) |
| `unitPrice` | Decimal(15,2) | سعر الوحدة |
| `isEnabled` | Boolean | مفعّل |

---

#### LaborItem — بند عمالة
**الملف:** سطر 1477-1503

| الحقل | النوع | الوصف |
|-------|------|-------|
| `laborType` | String | نوع العمالة |
| `workerType` | String | نوع العامل |
| `name` | String | الاسم |
| `quantity` | Int | العدد |
| `dailyRate` | Decimal(15,2) | الأجر اليومي |
| `durationDays` | Int | المدة بالأيام |
| `insuranceCost` | Decimal(15,2) | تكلفة التأمين |
| `housingCost` | Decimal(15,2) | تكلفة السكن |
| `otherCosts` | Decimal(15,2) | تكاليف أخرى |
| `totalCost` | Decimal(15,2) | الإجمالي |

---

#### CostingItem — بند التكاليف المفصّلة
**الملف:** سطر 4809-4856

| الحقل | النوع | الوصف |
|-------|------|-------|
| `section` | String | القسم (STRUCTURAL, FINISHING, MEP, LABOR, MANUAL) |
| `sourceItemId` | String? | معرف البند المصدر |
| `description` | String | الوصف |
| `unit` | String | الوحدة |
| `quantity` | Decimal(15,4) | الكمية |
| `materialUnitCost` | Decimal(15,2)? | تكلفة وحدة المواد |
| `materialTotal` | Decimal(15,2)? | إجمالي المواد |
| `laborType` | LaborCostType? | نوع تكلفة العمالة |
| `laborUnitCost` | Decimal(15,2)? | تكلفة وحدة العمالة |
| `laborTotal` | Decimal(15,2)? | إجمالي العمالة |
| `storageCostPercent` | Decimal(5,2)? | نسبة التخزين |
| `storageTotal` | Decimal(15,2)? | إجمالي التخزين |
| `otherCosts` | Decimal(15,2)? | تكاليف أخرى |
| `totalCost` | Decimal(15,2)? | الإجمالي |

---

#### ManualItem — بند يدوي
**الملف:** سطر 4858-4879

| الحقل | النوع | الوصف |
|-------|------|-------|
| `description` | String | الوصف |
| `unit` | String | الوحدة |
| `quantity` | Decimal(15,4) | الكمية |
| `section` | String? | القسم |
| `notes` | String? | ملاحظات |

---

#### SectionMarkup — هامش ربح القسم
**الملف:** سطر 4881-4895

| الحقل | النوع | الوصف |
|-------|------|-------|
| `section` | String | القسم (STRUCTURAL, FINISHING, MEP, LABOR) |
| `markupPercent` | Decimal(5,2) | نسبة الهامش |
| **فهرس فريد:** `[costStudyId, section]` | | |

---

#### Quote — عرض سعر (مرتبط بالدراسة)
**الملف:** سطر 1506-1546

| الحقل | النوع | الوصف |
|-------|------|-------|
| `quoteNumber` | String (UNIQUE) | رقم العرض |
| `quoteType` | String | نوع العرض |
| `clientName/Company/Phone/Email` | String? | بيانات العميل |
| `subtotal` | Decimal(15,2) | المجموع الفرعي |
| `overheadAmount` | Decimal(15,2) | مبلغ المصاريف العامة |
| `profitAmount` | Decimal(15,2) | مبلغ الربح |
| `vatAmount` | Decimal(15,2) | مبلغ الضريبة |
| `totalAmount` | Decimal(15,2) | الإجمالي |
| `validUntil` | DateTime | صالح حتى |
| `showUnitPrices/Quantities/ItemDescriptions` | Boolean | خيارات العرض |
| `selectedCategories` | Json? | الفئات المختارة |
| `pdfUrl` | String? | رابط PDF |

---

#### Quotation — عرض السعر الرسمي
**الملف:** سطر 3469-3540

| الحقل | النوع | الوصف |
|-------|------|-------|
| `quotationNo` | String (UNIQUE) | رقم عرض السعر |
| `clientId` | String? (FK) | معرف العميل |
| `clientName/Company/Phone/Email/TaxNumber` | String? | بيانات العميل |
| `status` | QuotationStatus | الحالة |
| `subtotal` | Decimal(15,2) | المجموع الفرعي |
| `discountPercent/Amount` | Decimal | الخصم |
| `vatPercent/Amount` | Decimal | الضريبة |
| `totalAmount` | Decimal(15,2) | الإجمالي |
| `validUntil` | DateTime | صالح حتى |
| `paymentTerms/deliveryTerms/warrantyTerms` | Text? | الشروط |
| `templateId` | String? | قالب المستند |
| `viewedAt/sentAt/acceptedAt/rejectedAt` | DateTime? | تواريخ التتبع |

**العلاقات:** `items` → QuotationItem[], `invoices` → FinanceInvoice[], `lead` → Lead?

---

#### QuotationItem — بند عرض السعر
**الملف:** سطر 3543-3563

| الحقل | النوع | الوصف |
|-------|------|-------|
| `description` | Text | الوصف |
| `quantity` | Decimal(15,3) | الكمية |
| `unit` | String? | الوحدة |
| `unitPrice` | Decimal(15,2) | سعر الوحدة |
| `totalPrice` | Decimal(15,2) | الإجمالي |
| `sortOrder` | Int | الترتيب |

---

#### Lead — العميل المحتمل
**الملف:** سطر 4630-4681

| الحقل | النوع | الوصف |
|-------|------|-------|
| `name` | String | الاسم الكامل |
| `phone/email/company` | String? | بيانات التواصل |
| `clientType` | ClientType | نوع العميل (فرد/شركة) |
| `projectType` | ProjectType? | نوع المشروع |
| `projectLocation` | String? | موقع المشروع |
| `estimatedArea` | Decimal? | المساحة التقديرية (م²) |
| `estimatedValue` | Decimal? | القيمة التقديرية (ريال) |
| `status` | LeadStatus | الحالة |
| `source` | LeadSource | المصدر |
| `priority` | LeadPriority | الأولوية |
| `assignedToId` | String? | مسؤول المتابعة |
| `expectedCloseDate` | DateTime? | تاريخ الإغلاق المتوقع |
| `costStudyId` | String? (UNIQUE) | دراسة التكلفة المرتبطة |
| `quotationId` | String? (UNIQUE) | عرض السعر المرتبط |
| `convertedProjectId` | String? (UNIQUE) | المشروع المحوّل |

**العلاقات:** `files` → LeadFile[], `activities` → LeadActivity[]

---

#### LeadFile — ملف العميل المحتمل

| الحقل | النوع | الوصف |
|-------|------|-------|
| `name` | String | اسم الملف الأصلي |
| `fileUrl` | String | رابط S3 |
| `storagePath` | String | مسار التخزين |
| `fileSize` | Int? | الحجم بالبايت |
| `mimeType` | String? | نوع الملف |
| `category` | LeadFileCategory | الفئة |

#### LeadActivity — نشاط العميل المحتمل

| الحقل | النوع | الوصف |
|-------|------|-------|
| `type` | LeadActivityType | نوع النشاط |
| `content` | String? | نص التعليق |
| `metadata` | Json? | بيانات إضافية |

---

### 4.2 التعدادات (Enums)

#### StudyType — نوع الدراسة
```
FULL_PROJECT        → مشروع كامل
CUSTOM_ITEMS        → بنود مخصصة
LUMP_SUM_ANALYSIS   → تحليل مبلغ إجمالي
```

#### StageStatus — حالة المرحلة
```
NOT_STARTED  → لم تبدأ
DRAFT        → مسودة
IN_REVIEW    → قيد المراجعة
APPROVED     → معتمدة
```

#### LaborCostType — نوع تكلفة العمالة
```
PER_SQM    → لكل متر مربع
PER_CBM    → لكل متر مكعب
PER_UNIT   → لكل وحدة
PER_LM     → لكل متر طولي
LUMP_SUM   → مبلغ مقطوع
SALARY     → راتب شهري
```

#### QuotationStatus — حالة عرض السعر
```
DRAFT      → مسودة
SENT       → مُرسل
VIEWED     → تمت المشاهدة
ACCEPTED   → مقبول
REJECTED   → مرفوض
EXPIRED    → منتهي الصلاحية
CONVERTED  → تم التحويل لمشروع
```

#### LeadStatus — حالة العميل المحتمل
```
NEW         → جديد
STUDYING    → قيد الدراسة
QUOTED      → تم التسعير
NEGOTIATING → قيد التفاوض
WON         → تم الفوز
LOST        → تم الخسارة
```

#### LeadSource — مصدر العميل
```
REFERRAL      → إحالة
SOCIAL_MEDIA  → وسائل التواصل
WEBSITE       → الموقع
DIRECT        → مباشر
EXHIBITION    → معرض
OTHER         → أخرى
```

#### LeadPriority — أولوية العميل
```
NORMAL  → عادي
HIGH    → عالي
URGENT  → عاجل
```

#### LeadFileCategory — فئة الملف
```
BLUEPRINT    → مخطط
STRUCTURE    → هيكل
SITE_PHOTO   → صورة موقع
SCOPE        → نطاق العمل
OTHER        → أخرى
```

#### LeadActivityType — نوع النشاط
```
COMMENT               → تعليق
STATUS_CHANGE         → تغيير حالة
FILE_UPLOADED         → رفع ملف
FILE_DELETED          → حذف ملف
COST_STUDY_LINKED     → ربط دراسة
COST_STUDY_UNLINKED   → فك ربط دراسة
QUOTATION_LINKED      → ربط عرض سعر
QUOTATION_UNLINKED    → فك ربط عرض سعر
ASSIGNED              → تعيين مسؤول
CONVERTED             → تحويل لمشروع
```

#### BOQSection — أقسام جدول الكميات
```
STRUCTURAL  → إنشائي
FINISHING   → تشطيبات
MEP         → كهروميكانيكية
LABOR       → عمالة
GENERAL     → عام
```

#### ClientType — نوع العميل
```
INDIVIDUAL  → فرد
COMMERCIAL  → تجاري/شركة
```

### 4.3 مخطط العلاقات

```
CostStudy (الكيان المركزي)
├── structuralItems → StructuralItem[]
├── finishingItems → FinishingItem[]
├── mepItems → MEPItem[]
├── laborItems → LaborItem[]
├── costingItems → CostingItem[]
├── manualItems → ManualItem[]
├── sectionMarkups → SectionMarkup[]
├── quotes → Quote[]
├── boqItems → ProjectBOQItem[]
└── lead → Lead?

Lead (قمع المبيعات)
├── costStudy → CostStudy? (واحد لواحد)
├── quotation → Quotation? (واحد لواحد)
├── files → LeadFile[]
└── activities → LeadActivity[]

Quotation (المستند الرسمي)
├── items → QuotationItem[]
├── invoices → FinanceInvoice[]
├── client → Client?
└── lead → Lead?
```

---

## 5. إجراءات API

### 5.1 إجراءات الكميات (Quantities) — ~37 endpoint

**المسار:** `packages/api/modules/quantities/procedures/`

#### CRUD الدراسات
| الإجراء | الملف | الوصف |
|---------|------|-------|
| `create` | `create.ts` | إنشاء دراسة تكلفة جديدة |
| `list` | `list.ts` | قائمة الدراسات |
| `getById` | `get-by-id.ts` | استرجاع دراسة بالمعرف |
| `update` | `update.ts` | تحديث بيانات الدراسة |
| `delete` | `delete.ts` | حذف دراسة |
| `duplicate` | `duplicate.ts` | نسخ دراسة كاملة |
| `recalculate` | `recalculate.ts` | إعادة حساب التكاليف |

#### البنود الإنشائية (Structural Items)
| الإجراء | الملف | الوصف |
|---------|------|-------|
| `structuralItemCreate` | `structural-item-create.ts` | إنشاء بند إنشائي |
| `structuralItemUpdate` | `structural-item-update.ts` | تحديث بند إنشائي |
| `structuralItemDelete` | `structural-item-delete.ts` | حذف بند إنشائي |
| `getStructuralItems` | `get-structural-items.ts` | استرجاع البنود الإنشائية |
| `structuralSpecs` | `structural-specs.ts` | إدارة المواصفات الإنشائية |

#### بنود التشطيبات (Finishing Items)
| الإجراء | الملف | الوصف |
|---------|------|-------|
| `finishingItemCreate` | `finishing-item-create.ts` | إنشاء بند (فردي ومجمّع) |
| `finishingItemUpdate` | `finishing-item-update.ts` | تحديث بند |
| `finishingItemDelete` | `finishing-item-delete.ts` | حذف بند |
| `finishingItemReorder` | `finishing-item-reorder.ts` | إعادة ترتيب البنود |
| `finishingItemBatchSpecUpdate` | `finishing-item-batch-spec-update.ts` | تحديث مجمّع للمواصفات |
| `getFinishingItems` | `get-finishing-items.ts` | استرجاع بنود التشطيبات |
| `buildingConfigUpdate` | `building-config-update.ts` | تحديث إعدادات المبنى |

#### بنود الكهروميكانيكية (MEP Items)
| الإجراء | الملف | الوصف |
|---------|------|-------|
| `mepItemCreate` | `mep-item-create.ts` | إنشاء بند (فردي ومجمّع) |
| `mepItemUpdate` | `mep-item-update.ts` | تحديث بند |
| `mepItemDelete` | `mep-item-delete.ts` | حذف بند |
| `mepItemToggle` | `mep-item-toggle.ts` | تفعيل/تعطيل بند |
| `getMepItems` | `get-mep-items.ts` | استرجاع بنود MEP |

#### العمالة والبنود اليدوية
| الإجراء | الملف | الوصف |
|---------|------|-------|
| `getLaborItems` | `get-labor-items.ts` | استرجاع بنود العمالة |
| `manualItems.*` | `manual-items.ts` | CRUD + إعادة ترتيب البنود اليدوية |

#### عروض الأسعار (Quotes)
| الإجراء | الملف | الوصف |
|---------|------|-------|
| `quoteCreate/list/get/update/delete` | `quote-create.ts` | CRUD لعروض الأسعار |
| `getQuotes` | `get-quotes.ts` | استرجاع العروض |

#### قوالب المواصفات (Spec Templates)
| الإجراء | الملف | الوصف |
|---------|------|-------|
| `specTemplateList` | `spec-template-list.ts` | قائمة القوالب |
| `specTemplateCreate` | `spec-template-create.ts` | إنشاء قالب |
| `specTemplateUpdate` | `spec-template-update.ts` | تحديث قالب |
| `specTemplateDelete` | `spec-template-delete.ts` | حذف قالب |
| `specTemplateSetDefault` | `spec-template-set-default.ts` | تعيين قالب افتراضي |

#### سير العمل والمراحل (Stages)
| الإجراء | الملف | الوصف |
|---------|------|-------|
| `getStages` | `stages.ts` | استرجاع حالة المراحل |
| `approveStage` | `stages.ts` | الموافقة على مرحلة |
| `reopenStage` | `stages.ts` | إعادة فتح مرحلة |
| `assignStage` | `stages.ts` | تعيين مسؤول للمرحلة |

#### التكاليف (Costing)
| الإجراء | الملف | الوصف |
|---------|------|-------|
| `generateCosting` | `costing.ts` | توليد بنود التكاليف |
| `getCostingItems` | `costing.ts` | استرجاع بنود التكاليف |
| `updateCostingItem` | `costing.ts` | تحديث بند تكاليف |
| `bulkUpdateCostingItems` | `costing.ts` | تحديث مجمّع |
| `setSectionLabor` | `costing.ts` | تحديد عمالة القسم |
| `getCostingSummary` | `costing.ts` | ملخص التكاليف |

#### هوامش الربح (Markup)
| الإجراء | الملف | الوصف |
|---------|------|-------|
| `getMarkupSettings` | `markup.ts` | استرجاع إعدادات الهامش |
| `setUniformMarkup` | `markup.ts` | تحديد هامش موحد |
| `setSectionMarkups` | `markup.ts` | تحديد هوامش حسب القسم |
| `getProfitAnalysis` | `markup.ts` | تحليل الأرباح |

#### الملخصات
| الإجراء | الملف | الوصف |
|---------|------|-------|
| `getQuantitiesSummary` | `quantities-summary.ts` | ملخص الكميات |

---

### 5.2 إجراءات التسعير (Pricing) — ~17 endpoint

**المسار:** `packages/api/modules/pricing/procedures/`

**Router:** `packages/api/modules/pricing/router.ts` يجمع:
- `studies.*` — إجراءات الكميات
- `quotations.*` — إجراءات عروض الأسعار من المالية
- `leads.*` — إجراءات العملاء المحتملين

#### العملاء المحتملون (Leads)
| الإجراء | الملف | الوصف |
|---------|------|-------|
| `create` | `leads/create.ts` | إنشاء عميل محتمل |
| `list` | `leads/list.ts` | قائمة العملاء |
| `getById` | `leads/get-by-id.ts` | استرجاع عميل |
| `update` | `leads/update.ts` | تحديث بيانات العميل |
| `delete` | `leads/delete.ts` | حذف عميل |
| `updateStatus` | `leads/update-status.ts` | تحديث حالة العميل |
| `addActivity` | `leads/add-activity.ts` | إضافة نشاط/تعليق |
| `getStats` | `leads/get-stats.ts` | إحصائيات العملاء |
| `convertToProject` | `leads/convert-to-project.ts` | تحويل لمشروع |

#### ربط الدراسات والعروض
| الإجراء | الملف | الوصف |
|---------|------|-------|
| `linkCostStudy` | `leads/link-cost-study.ts` | ربط دراسة تكلفة بالعميل |
| `unlinkCostStudy` | `leads/unlink-cost-study.ts` | فك ربط دراسة |
| `linkQuotation` | `leads/link-quotation.ts` | ربط عرض سعر بالعميل |
| `unlinkQuotation` | `leads/unlink-quotation.ts` | فك ربط عرض سعر |

#### ملفات العملاء
| الإجراء | الملف | الوصف |
|---------|------|-------|
| `getUploadUrl` | `leads/files/get-upload-url.ts` | الحصول على رابط رفع |
| `saveFile` | `leads/files/save-file.ts` | حفظ ملف |
| `deleteFile` | `leads/files/delete-file.ts` | حذف ملف |

---

### 5.3 إجراءات عروض الأسعار (Finance/Quotations)

**المسار:** `packages/api/modules/finance/procedures/`

| الإجراء | الملف | الوصف |
|---------|------|-------|
| `createQuotation` | `create-quotation.ts` | إنشاء عرض سعر رسمي |
| `updateQuotation` | `create-quotation.ts` | تحديث عرض السعر |
| `updateItems` | `create-quotation.ts` | تحديث بنود العرض |
| `updateStatus` | `create-quotation.ts` | تحديث الحالة |
| `deleteQuotation` | `create-quotation.ts` | حذف عرض السعر |
| `convertToInvoice` | `create-quotation.ts` | تحويل لفاتورة |
| `listQuotations` | `list-quotations.ts` | قائمة عروض الأسعار |
| `getQuotationById` | `list-quotations.ts` | استرجاع عرض سعر |

---

### 5.4 إجراءات جدول الكميات للمشروع (Project BOQ)

**المسار:** `packages/api/modules/project-boq/procedures/`

| الإجراء | الملف | الوصف |
|---------|------|-------|
| `list/create/update/delete` | CRUD | إدارة بنود BOQ |
| `bulkCreate/bulkDelete/bulkUpdatePrices` | Bulk | عمليات مجمّعة |
| `reorder` | `reorder.ts` | إعادة ترتيب |
| `assignPhase/getByPhase` | Phase | ربط بالمراحل |
| `copyFromCostStudy` | `copy-from-cost-study.ts` | نسخ من دراسة تكلفة |
| `copyFromQuotation` | `copy-from-quotation.ts` | نسخ من عرض سعر |
| `importFromData` | `import-from-data.ts` | استيراد بيانات |

---

## 6. منطق التسعير والحسابات

### 6.1 حساب تكلفة البند

**الملف:** `apps/web/modules/saas/pricing/lib/pricing-calculations.ts`

```
تكلفة المواد = الكمية × سعر المواد × (1 + نسبة الهالك / 100)
تكلفة العمالة = الكمية × سعر العمالة
إجمالي البند = تكلفة المواد + تكلفة العمالة
```

### 6.2 حساب الإجمالي مع الهوامش

```
التكلفة المباشرة = مجموع تكاليف جميع البنود
المصاريف العامة (Overhead) = التكلفة المباشرة × نسبة المصاريف العامة
الربح (Profit) = التكلفة المباشرة × نسبة الربح
الاحتياط (Contingency) = التكلفة المباشرة × نسبة الاحتياط
المجموع الفرعي = التكلفة المباشرة + المصاريف + الربح + الاحتياط
ضريبة القيمة المضافة (VAT) = المجموع الفرعي × 15% (إذا مفعّلة)
الإجمالي النهائي = المجموع الفرعي + الضريبة
```

### 6.3 طرق هامش الربح (Markup)

**الملف:** `packages/api/modules/quantities/procedures/markup.ts`

#### الطريقة الأولى: هامش موحد (Uniform Markup)
```
سعر البيع = التكلفة المباشرة + المصاريف العامة + الربح + الاحتياط
الضريبة = سعر البيع × 15%
الإجمالي = سعر البيع + الضريبة
```

#### الطريقة الثانية: هامش حسب القسم (Per-Section Markup)
```
لكل قسم (إنشائي، تشطيبات، كهروميكانيكية، عمالة، يدوي):
  إجمالي القسم مع الهامش = إجمالي القسم × (1 + نسبة هامش القسم / 100)

الإجمالي مع الهوامش = مجموع أقسام مع هوامش
سعر البيع = الإجمالي مع الهوامش + المصاريف العامة
الضريبة = سعر البيع × 15%
الإجمالي = سعر البيع + الضريبة
```

### 6.4 حساب الهالك (Wastage)

```
الكمية الفعلية = الكمية × (1 + نسبة الهالك / 100)

النسب الافتراضية:
- إنشائي: 10%
- تشطيبات: 0-5% (حسب البند)
- كهروميكانيكية: 10%
```

### 6.5 الحسابات الإنشائية

**الملف:** `apps/web/modules/saas/pricing/lib/calculations.ts` (687 سطر)
**الملف:** `apps/web/modules/saas/pricing/lib/structural-calculations.ts` (49 KB)

#### الأساسات (Foundations)
```
حجم الخرسانة = الطول × العرض × العمق × العدد
حساب التسليح:
  القضبان الرئيسية = (عدد_قضبان_X × الطول_X + عدد_قضبان_Y × الطول_Y) × الوزن × العدد
  الشبك العلوي = نفس المعادلة × 0.5
  الوزن لكل متر = القطر² × 0.00617 كجم/م
مساحة الطوبار = (2×(الطول+العرض)×العمق + الطول×العرض) × العدد
```

#### الأعمدة (Columns)
```
حجم الخرسانة = (العرض/100 × العمق/100 × الارتفاع) × العدد
التسليح الرئيسي = عدد القضبان × (الارتفاع + 0.8) × الوزن × العدد
الكانات:
  المحيط = 2×(العرض+العمق-0.08) + 0.3 (تراكب)
  العدد = (الارتفاع×1000) / التباعد + 1
الطوبار = 2×(العرض+العمق) × الارتفاع × العدد × 1.5
```

#### الكمرات (Beams)
```
حجم الخرسانة = (العرض/100 × الارتفاع/100 × الطول) × العدد
التسليح:
  قضبان علوية = عدد_علوي × (الطول + 0.6) × الوزن × العدد
  قضبان سفلية = عدد_سفلي × (الطول + 0.6) × الوزن × العدد
  كانات = (الطول×1000/التباعد + 1) × المحيط × الوزن
الطوبار = (العرض + 2×الارتفاع) × الطول × العدد × 1.2
```

#### البلاطات (Slabs)
```
بلاطة مصمتة: المساحة × (السماكة/100)
بلاطة هوردي:
  الخرسانة = (عدد الأضلاع × الطول × عرض الضلع × (ارتفاع البلوك + 0.05)) + (المساحة × 0.05)
  البلوك = المساحة / (تباعد الأضلاع × 0.4) × 2.5
  عدد الأضلاع = المساحة / تباعد الأضلاع
```

#### الدرج (Stairs)
```
حجم الخرسانة:
  البلاطة = مساحة المشوار × السماكة
  الدرجات = (عدد القوائم × العرض × ارتفاع القائمة × عمق النائمة) / 2
  الصدفة = مساحة الصدفة × السماكة
الطوبار = المساحة الإجمالية × 1.5
```

### 6.6 ثوابت الأسعار

**الملف:** `apps/web/modules/saas/pricing/constants/prices.ts`

#### أسعار الخرسانة (ريال/م³)
| النوع | السعر |
|-------|-------|
| C20 | 250 |
| C25 | 280 |
| C30 | 310 |
| C35 | 350 |
| C40 | 400 |

#### أسعار حديد التسليح
- **سعر الطن:** 3,200 ريال (~3.2 ريال/كجم)

#### أوزان حديد التسليح (كجم/م)
| القطر (مم) | 6 | 8 | 10 | 12 | 14 | 16 | 18 | 20 | 22 | 25 | 28 | 32 |
|-----------|---|---|----|----|----|----|----|----|----|----|----|----|
| الوزن | 0.222 | 0.395 | 0.617 | 0.888 | 1.21 | 1.58 | 1.998 | 2.47 | 2.98 | 3.85 | 4.83 | 6.31 |

#### أطوال المخزون القياسية
- معظم الأقطار: **12 متر**
- قطر 8 مم: **6 متر**

#### أسعار التشطيبات (مجموعات: اقتصادي/متوسط/فاخر)
- **اللياسة:** داخلية/خارجية/سقف/معجون
- **الدهان:** داخلي/خارجي (مواد + عمالة)
- **الأرضيات:** سيراميك، بورسلين، رخام، جرانيت، باركيه، فينيل
- **الكهرباء:** إنارة، مخارج، تكييف، لوحات، تأريض
- **السباكة:** تغذية، صرف، أدوات صحية، خزانات
- **التكييف:** سبليت، مجاري هواء، مخفية
- **أبواب ونوافذ:** داخلية/خارجية/مرآب وألمنيوم

### 6.7 ثوابت التكاليف والأقسام

**الملف:** `apps/web/modules/saas/pricing/lib/costing-constants.ts`

```typescript
SECTION_ORDER  = ["STRUCTURAL", "FINISHING", "MEP", "LABOR", "MANUAL"]
SECTION_LABELS = {
  STRUCTURAL: "إنشائي",
  FINISHING:  "تشطيبات",
  MEP:        "كهروميكانيكية",
  LABOR:      "عمالة",
  MANUAL:     "يدوي"
}
```

---

## 7. الميزات الذكية

### 7.1 محرك اشتقاق التشطيبات (Derivation Engine)

**الملف:** `apps/web/modules/saas/pricing/lib/derivation-engine.ts` (50 KB)

يشتق تلقائياً كميات التشطيبات من إعدادات المبنى الذكي (SmartBuildingConfig):

#### العزل (Insulation)
```
العزل المائي = مساحة الأساسات + مساحة السطح + مساحة الحمامات
العزل الحراري = المحيط × ارتفاع الجدار الخارجي + مساحة السطح
```

#### اللياسة والدهان (لكل طابق)
```
مساحة الجدران:
  إذا وُجدت غرف: مجموع (محيط الغرفة × ارتفاع الطابق) - الفتحات
  إذا لم توجد: تقدير = √(المساحة) × 4 × 1.3
مساحة الأسقف: مساحة الطابق
الإجمالي = (مساحة الجدران + مساحة الأسقف) × (1 + نسبة الهالك)
```

#### الأرضيات (Flooring)
```
المساحة = مساحة الطابق × (1 + نسبة الهالك)
معالجة خاصة: حمامات vs غرف عادية
```

#### بلاط الجدران (Wall Tiling)
```
الحمامات: مساحة جدران الحمام × ارتفاع البلاط
المطبخ: مساحة جدران المطبخ × 0.6 متر (ارتفاع الرشّاش)
```

#### الأسقف المستعارة (False Ceiling)
```
للغرف المحددة: مساحة الغرفة × (1 + نسبة الهالك)
```

#### الأبواب والنوافذ
```
العدد من مصفوفة الفتحات: تصنيف حسب النوع (داخلي/خارجي)
```

#### الأدوات الصحية
```
لكل حمام: 1 مرحاض + 1 مغسلة + 1 دش
مضروب في معامل تكرار الطابق
```

---

### 7.2 محرك اشتقاق الكهروميكانيكية (MEP Derivation Engine)

**الملف:** `apps/web/modules/saas/pricing/lib/mep-derivation-engine.ts` (80 KB)

يشتق بنود MEP من إعدادات المبنى وملفات تعريف الغرف.

#### ملفات تعريف الغرف (Room Profiles)

**الملف:** `apps/web/modules/saas/pricing/lib/mep-room-profiles.ts`

**10 أنواع غرف مع متطلبات MEP معيارية:**

| نوع الغرفة | التكييف (BTU/م²) | الإنارة (م²/سبوت) | المستوى (lux) | مخارج 13A | تكييف 20A |
|------------|------------------|-------------------|--------------|----------|----------|
| bedroom | 700 | 2.5 | 200 | 4 | 1 |
| living | 800 | 2.0 | 300 | 6 | 1 |
| majlis | 800 | 2.0 | 300 | 6 | 1 |
| kitchen | 900 | 1.5 | 500 | 6 | 0 |
| bathroom | - | 3.0 | 150 | 1 | 0 |
| corridor | - | 3.0 | 100 | 2 | 0 |
| storage | - | 4.0 | 100 | 1 | 0 |

#### الكهرباء لكل غرفة
```
عدد الإضاءات = مساحة الغرفة / تغطية السبوت
المخارج = حسب نوع الغرفة (13A عادي, 20A تكييف, 32A فرن)
```

#### السباكة لكل غرفة
```
الأدوات الصحية = حسب نوع الغرفة
أنابيب التغذية = حسب وحدات التجهيز
الصرف = حسب وحدات الصرف
```

#### التكييف لكل غرفة
```
قدرة التكييف = معامل BTU × مساحة الغرفة
أنابيب الفريون = حسب القدرة
```

#### بنود على مستوى المبنى
```
خزانات مياه = حسب المساحة وعدد السكان
مضخات = حسب الطلب الإجمالي
تأريض = حسب الحمل الكهربائي
إطفاء حريق = حسب النوع والمساحة
تيار خفيف (شبكات) = حسب عدد الغرف والطوابق
```

---

### 7.3 معالج إعداد المبنى (Building Setup Wizard)

**الملف:** `apps/web/modules/saas/pricing/components/finishing/BuildingSetupWizard.tsx`

**4 خطوات:**

1. **هيكل المبنى (Building Structure Step)**
   - تعريف الطوابق: النوع، المساحة، الارتفاع، التكرار

2. **تفاصيل الأدوار (Floor Details Step)**
   - تعريف الغرف: الاسم، الأبعاد، النوع، سقف مستعار
   - تعريف الفتحات: النوع، الأبعاد، العدد، خارجي/داخلي

3. **الخارجي (Exterior Step)**
   - المحيط، السور، الحديقة، الفناء

4. **المراجعة (Review Step)**
   - التحقق واشتقاق جميع الكميات تلقائياً

#### هيكل البيانات (SmartBuildingConfig)
```typescript
SmartBuildingConfig {
  totalLandArea: number           // مساحة الأرض الإجمالية
  buildingPerimeter: number       // محيط المبنى
  landPerimeter?: number          // محيط الأرض
  fenceHeight?: number            // ارتفاع السور
  hasCourtyard?: boolean          // يوجد فناء
  hasGarden?: boolean             // توجد حديقة
  gardenPercentage?: number       // نسبة الحديقة
  floors: SmartFloorConfig[]      // الطوابق
}

SmartFloorConfig {
  id, name, area, height
  floorType                       // نوع الطابق
  isRepeated, repeatCount         // تكرار
  rooms?: RoomConfig[]            // الغرف
  openings?: OpeningConfig[]      // الفتحات
}

RoomConfig {
  id, name, length, width
  type: RoomType                  // نوع الغرفة
  hasFalseCeiling?: boolean       // سقف مستعار
}
```

---

### 7.4 مستخرج المعرفة (Knowledge Extractor)

**الملف:** `apps/web/modules/saas/pricing/lib/knowledge-extractor.ts` (617 سطر)

يستخرج معلومات المبنى من البنود اليدوية ويُنشئ اشتقاقات متسلسلة:

| المصدر | ما يُستخرج | ما يُشتق |
|--------|----------|---------|
| بند لياسة | إعدادات الغرف | عزل، دهان، أرضيات، بلاط، أسقف |
| بند دهان | بيانات الغرف | لياسة وبنود مرتبطة |
| بند أرضيات | أبعاد الغرف | أسقف مستعارة ولياسة |
| بند لياسة خارجية | محيط المبنى | واجهات، عزل حراري، أسوار |

---

### 7.5 التحديثات المتسلسلة (Cascade Updates)

عند تغيير إعدادات المبنى:
1. يُعاد اشتقاق جميع بنود التشطيبات
2. يُعاد اشتقاق جميع بنود MEP
3. يظهر إشعار `CascadeNotification` للمستخدم
4. البنود اليدوية لا تتأثر

---

### 7.6 مُحسّن القص (Cutting Optimizer)

**الملف:** `apps/web/modules/saas/pricing/lib/cutting/cutting-optimizer.ts`

**خوارزمية 1D Cutting Stock (الإصدار V5):**

1. **تجميع القطع** حسب الطول (تقريب لأقرب مم)
2. **ترتيب تنازلي** حسب الطول
3. **لكل مجموعة:**
   - إذا الطول > طول المخزون → حساب وصلات التراكب
     - طول التراكب = `REBAR_SPECIFICATIONS.lapLength(القطر)`
     - قضبان إضافية = `ceil(الطول / (طول المخزون - طول التراكب))`
   - إذا الطول ≤ طول المخزون → تجميع قطع متعددة في قضيب واحد
4. **حساب الهالك:**
   - `الهالك% = (إجمالي الخام - إجمالي الصافي) / إجمالي الخام × 100`

**المكونات المساعدة:**
- `waste-analyzer.ts` — تحليل وإحصاء الهالك
- `remnant-manager.ts` — إدارة البواقي القابلة لإعادة الاستخدام
- `saudi-rebar-specs.ts` — مواصفات حديد التسليح السعودية

---

## 8. خط سير العمل (Pipeline)

### 8.1 المراحل الخمس

**الملف:** `packages/api/modules/quantities/procedures/stages.ts`

```
المرحلة 1: الكميات (Quantities)
    ↓ [موافقة]
المرحلة 2: المواصفات (Specifications)
    ↓ [موافقة]
المرحلة 3: التكاليف (Costing)
    ↓ [موافقة]
المرحلة 4: سعر البيع (Selling Price)
    ↓ [موافقة]
المرحلة 5: عرض السعر (Quotation)
```

### 8.2 تدفق الحالات

```
NOT_STARTED → DRAFT → IN_REVIEW → APPROVED
                ↑                    │
                └────── إعادة فتح ───┘
```

**القواعد:**
- لا يمكن الموافقة على مرحلة إلا إذا كانت المرحلة السابقة **معتمدة (APPROVED)**
- إعادة فتح مرحلة يُعيد جميع المراحل اللاحقة إلى **NOT_STARTED**
- كل مرحلة يمكن تعيين مسؤول لها (assignee)

### 8.3 تعيين المسؤولين

```
quantitiesAssigneeId  → مسؤول الكميات
specsAssigneeId       → مسؤول المواصفات
costingAssigneeId     → مسؤول التكاليف
pricingAssigneeId     → مسؤول التسعير
```

---

## 9. رحلة المستخدم الكاملة

### 9.1 من Lead إلى مشروع

```
┌─────────────────┐
│  1. إنشاء Lead  │ ← بيانات العميل + نوع المشروع + المساحة
└────────┬────────┘
         ↓
┌─────────────────┐
│ 2. إنشاء دراسة │ ← اختيار نوع الدراسة (FULL_PROJECT / CUSTOM_ITEMS / LUMP_SUM)
└────────┬────────┘
         ↓
┌─────────────────┐
│ 3. ربط الدراسة │ ← ربط الدراسة بالعميل المحتمل
│    بالعميل      │
└────────┬────────┘
         ↓
┌─────────────────────────────┐
│ 4. مرحلة الكميات           │
│   أ. إعداد المبنى (ذكي)    │ ← معالج 4 خطوات
│   ب. بنود إنشائية          │ ← أساسات، أعمدة، كمرات، بلاطات
│   ج. بنود تشطيبات (مشتقة)  │ ← اشتقاق تلقائي من إعدادات المبنى
│   د. بنود MEP (مشتقة)      │ ← اشتقاق تلقائي
│   هـ. بنود يدوية            │ ← إضافة حرة
│   → موافقة                  │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────┐
│ 5. مرحلة المواصفات         │
│   - اختيار مواصفات لكل بند │ ← من الكتالوج أو يدوياً
│   - تطبيق قوالب            │ ← قوالب مواصفات محفوظة
│   → موافقة                  │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────┐
│ 6. مرحلة التكاليف          │
│   - توليد بنود التكاليف    │ ← تلقائي من الكميات
│   - تحديد تكلفة المواد     │
│   - تحديد تكلفة العمالة    │ ← 6 طرق حساب
│   - تكاليف التخزين         │
│   → موافقة                  │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────┐
│ 7. مرحلة سعر البيع         │
│   - اختيار طريقة الهامش    │ ← موحد أو حسب القسم
│   - مصاريف عامة + ربح      │
│   - احتياط + ضريبة          │
│   - تحليل الأرباح          │
│   → موافقة                  │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────┐
│ 8. مرحلة عرض السعر         │
│   - إنشاء عرض سعر رسمي    │
│   - اختيار البنود والفئات  │
│   - إضافة الشروط           │
│   - معاينة وتصدير PDF      │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────┐
│ 9. ربط عرض السعر بالعميل   │
│ 10. تحويل العميل لمشروع    │ ← ConvertToProject
│ 11. نسخ BOQ للمشروع        │ ← copyFromCostStudy
└─────────────────────────────┘
```

### 9.2 الطريقة الذكية (SMART) vs اليدوية (MANUAL)

| الجانب | الطريقة الذكية | الطريقة اليدوية |
|--------|---------------|----------------|
| **إعداد المبنى** | معالج 4 خطوات | لا يوجد |
| **التشطيبات** | اشتقاق تلقائي | إضافة يدوية بند بند |
| **MEP** | اشتقاق من ملفات الغرف | إضافة يدوية |
| **التحديثات** | متسلسلة عند التغيير | يدوية |
| **الدقة** | عالية (مبنية على أبعاد حقيقية) | تعتمد على خبرة المستخدم |
| **السرعة** | أسرع بكثير | أبطأ |
| **مصدر البيانات** | `dataSource: "auto_building"` | `dataSource: "manual"` |

---

## 10. الصلاحيات والأدوار

### 10.1 واجهة الصلاحيات (PricingPermissions)

**الملف:** `packages/database/prisma/permissions.ts`

```typescript
interface PricingPermissions {
  view: boolean;                // عرض القسم
  studies: boolean;             // إدارة الدراسات
  quotations: boolean;          // إدارة عروض الأسعار
  pricing: boolean;             // الوصول للتسعير
  leads: boolean;               // إدارة العملاء المحتملين
  editQuantities: boolean;      // تعديل الكميات
  approveQuantities: boolean;   // اعتماد الكميات
  editSpecs: boolean;           // تعديل المواصفات
  approveSpecs: boolean;        // اعتماد المواصفات
  editCosting: boolean;         // تعديل التكاليف
  approveCosting: boolean;      // اعتماد التكاليف
  editSellingPrice: boolean;    // تعديل سعر البيع
  generateQuotation: boolean;   // إصدار عرض سعر
  convertToProject: boolean;    // تحويل لمشروع
}
```

### 10.2 صلاحيات الأدوار الافتراضية

| الصلاحية | Owner | PM | Accountant | Engineer | Supervisor |
|----------|-------|-----|-----------|----------|-----------|
| `view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `studies` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `quotations` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `pricing` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `leads` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `editQuantities` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `approveQuantities` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `editSpecs` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `approveSpecs` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `editCosting` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `approveCosting` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `editSellingPrice` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `generateQuotation` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `convertToProject` | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 11. الأقسام الفرعية

### 11.1 Dashboard (لوحة المعلومات)

**المسار:** `/app/[org]/pricing`
**المكوّن:** `PricingDashboard.tsx`

نظرة عامة على:
- عدد الدراسات النشطة
- عدد العملاء المحتملين
- عروض الأسعار المعلقة
- إحصائيات الأداء

---

### 11.2 Leads (العملاء المحتملون)

**المسار:** `/app/[org]/pricing/leads`

#### الميزات:
- **قائمة العملاء** مع فلاتر (الحالة، المصدر، الأولوية، المسؤول)
- **بطاقات إحصائية** (إجمالي، جديد، قيد الدراسة، تم الفوز)
- **صفحة التفاصيل** بـ 4 تبويبات:
  - المعلومات الأساسية
  - النشاطات والتعليقات
  - الملفات (مخططات، صور، نطاق عمل)
  - الروابط (دراسات وعروض مرتبطة)

#### دورة حياة العميل:
```
NEW → STUDYING → QUOTED → NEGOTIATING → WON / LOST
جديد   قيد الدراسة  تم التسعير   قيد التفاوض    فاز / خسر
```

#### إدارة الملفات:
- رفع مباشر إلى S3
- فئات: مخطط، هيكل، صورة موقع، نطاق عمل، أخرى
- معاينة وحذف

---

### 11.3 Studies (دراسات التكلفة)

**المسار:** `/app/[org]/pricing/studies`

#### أنواع الدراسات:
| النوع | الوصف |
|-------|-------|
| `FULL_PROJECT` | مشروع كامل (إنشائي + تشطيبات + MEP) |
| `CUSTOM_ITEMS` | بنود مخصصة (اختيار حر) |
| `LUMP_SUM_ANALYSIS` | تحليل مبلغ إجمالي |

#### الأقسام داخل الدراسة:

**إنشائي (Structural):**
- 7 فئات: أساسات، أعمدة، كمرات، بلاطات، درج، بلوك، خرسانة عادية
- حسابات تلقائية: خرسانة، حديد، طوبار
- دعم أنواع مختلفة من البلاطات (مصمتة، هوردي)

**تشطيبات (Finishing):**
- 26 فئة في 15 مجموعة عمل
- معالج إعداد المبنى الذكي
- اشتقاق تلقائي أو إضافة يدوية
- مواصفات وكتالوج مواد

**كهروميكانيكية (MEP):**
- 6 فئات: كهرباء، سباكة، تكييف، إطفاء حريق، تيار خفيف، خاصة
- ملفات تعريف غرف ذكية
- 10 أنواع غرف معيارية

---

### 11.4 Quotations (عروض الأسعار)

**المسار:** `/app/[org]/pricing/quotations`

#### الميزات:
- إنشاء عرض سعر من دراسة تكلفة أو من الصفر
- اختيار البنود والفئات
- خيارات العرض (إظهار/إخفاء الأسعار، الكميات، الأوصاف)
- شروط الدفع والتسليم والضمان
- معاينة قبل الإصدار
- تتبع (مشاهدة، إرسال، قبول، رفض)
- تحويل لفاتورة

#### دورة حياة العرض:
```
DRAFT → SENT → VIEWED → ACCEPTED → CONVERTED
                  └──→ REJECTED
                  └──→ EXPIRED
```

---

## 12. المشاكل والتحسينات المحتملة

### 12.1 نقاط ضعف مكتشفة

#### الأداء (Performance)
1. **ملفات كبيرة جداً:** `derivation-engine.ts` (50 KB) و `mep-derivation-engine.ts` (80 KB) — يُفضل تقسيمها لوحدات أصغر
2. **حسابات على العميل:** معظم الحسابات تتم في المتصفح — قد يكون بطيئاً للمشاريع الكبيرة
3. **عدم وجود تخزين مؤقت للكتالوج:** كتالوجات المواصفات تُحمّل كاملة في كل مرة

#### المنطق (Logic)
4. **تقدير المحيط التقريبي:** عند عدم وجود غرف محددة، يُستخدم `√(area) × 4 × 1.3` — قد لا يكون دقيقاً لأشكال غير منتظمة
5. **أسعار ثابتة في الكود:** أسعار المواد ثابتة في `constants/prices.ts` — يُفضل قاعدة بيانات أسعار قابلة للتحديث
6. **عدم دعم العملات المتعددة:** الأسعار بالريال فقط

#### قاعدة البيانات (Database)
7. **حقول Json غير محددة النوع:** `buildingConfig`, `calculationData`, `specData` — صعبة الاستعلام والفهرسة
8. **عدم وجود Soft Delete:** حذف الدراسة يحذف كل شيء (Cascade) — لا استرجاع
9. **حقل `status` نصي:** في CostStudy يُستخدم String بدلاً من Enum — غير آمن

#### واجهة المستخدم (UX)
10. **عدم دعم العمل بدون إنترنت:** لا يوجد وضع offline
11. **عدم وجود محفوظات (History):** لا يمكن تتبع تغييرات الأسعار أو الكميات عبر الزمن
12. **عدم وجود تصدير Excel:** التصدير مقصور على PDF لعروض الأسعار

### 12.2 اقتراحات للتطوير

#### قريب المدى
1. **نقل الأسعار لقاعدة البيانات** — لتحديثها دون نشر كود جديد
2. **إضافة Soft Delete** — للدراسات والعملاء المحتملين
3. **تقسيم محركات الاشتقاق** — لتحسين الصيانة والاختبار
4. **إضافة محفوظات الأسعار** — لتتبع تغييرات الأسعار عبر الزمن

#### متوسط المدى
5. **نقل الحسابات الثقيلة للخادم** — خاصة مُحسّن القص والاشتقاق
6. **إضافة تصدير Excel/CSV** — للكميات والتكاليف
7. **نظام إشعارات** — عند تغيير حالة المرحلة أو تعيين مسؤول
8. **مقارنة الدراسات** — مقارنة دراستين جنباً إلى جنب

#### بعيد المدى
9. **ذكاء اصطناعي للتسعير** — تقدير أسعار بناءً على مشاريع سابقة
10. **تكامل مع موردين** — أسعار محدّثة تلقائياً من الموردين
11. **نسخة موبايل** — لاستخدام الموقع
12. **دعم مشاريع متعددة المباني** — دراسة واحدة لمجمع سكني

---

## ملاحق

### أ. الملفات الحرجة (Quick Reference)

| الملف | الغرض |
|-------|-------|
| `packages/database/prisma/schema.prisma` | مخطط قاعدة البيانات |
| `packages/database/prisma/permissions.ts` | تعريف الصلاحيات |
| `packages/api/modules/quantities/procedures/` | إجراءات الكميات (37 ملف) |
| `packages/api/modules/pricing/procedures/` | إجراءات التسعير والعملاء (17 ملف) |
| `packages/api/modules/pricing/router.ts` | الموجّه الرئيسي |
| `apps/web/modules/saas/pricing/lib/pricing-calculations.ts` | معادلات التسعير |
| `apps/web/modules/saas/pricing/lib/calculations.ts` | حسابات إنشائية |
| `apps/web/modules/saas/pricing/lib/derivation-engine.ts` | محرك اشتقاق التشطيبات |
| `apps/web/modules/saas/pricing/lib/mep-derivation-engine.ts` | محرك اشتقاق MEP |
| `apps/web/modules/saas/pricing/lib/knowledge-extractor.ts` | مستخرج المعرفة |
| `apps/web/modules/saas/pricing/lib/cutting/cutting-optimizer.ts` | مُحسّن القص |
| `apps/web/modules/saas/pricing/constants/prices.ts` | ثوابت الأسعار |
| `apps/web/modules/saas/pricing/components/shell/constants.ts` | ثوابت التنقل |

### ب. إحصائيات الملفات

| القسم | عدد الملفات |
|-------|------------|
| المكونات (Components) | 92 |
| المكتبات (lib/) | 48 |
| الصفحات (Pages) | 20 |
| الأنواع (types/) | 7 |
| الثوابت (constants/) | 4 |
| **الإجمالي** | **171** |

### ج. عدد Endpoints

| الوحدة | عدد الإجراءات |
|-------|------------|
| الكميات (Quantities) | ~37 |
| العملاء المحتملون (Leads) | ~17 |
| عروض الأسعار (Quotations) | ~8 |
| جدول الكميات للمشروع (Project BOQ) | ~18 |
| **الإجمالي** | **~80** |
