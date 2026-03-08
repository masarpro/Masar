# تقرير تحليل شامل — قسم دراسات التسعير (Pricing Studies)

> **تاريخ التقرير:** 2026-03-08
> **المشروع:** Masar — منصة إدارة المشاريع الإنشائية
> **النطاق:** قسم دراسات التسعير وحصر الكميات بالكامل

---

## 1. هيكل الملفات (File Structure)

### 1.1 شجرة الملفات الكاملة

```
📦 pricing-studies
├── 📂 packages/database/prisma/
│   ├── schema.prisma                    # النماذج: CostStudy, StructuralItem, FinishingItem, MEPItem, LaborItem, Quote, SpecificationTemplate
│   └── queries/cost-studies.ts          # 1163 سطر — كل عمليات قاعدة البيانات
│
├── 📂 packages/api/modules/
│   ├── quantities/
│   │   ├── router.ts                    # الموجّه الرئيسي — 22 إجراء
│   │   └── procedures/                  # 22 ملف إجراء ORPC
│   │       ├── create.ts
│   │       ├── get-by-id.ts
│   │       ├── list.ts
│   │       ├── update.ts
│   │       ├── delete.ts
│   │       ├── duplicate.ts
│   │       ├── recalculate.ts
│   │       ├── structural-item-create.ts
│   │       ├── structural-item-update.ts
│   │       ├── structural-item-delete.ts
│   │       ├── finishing-item-create.ts
│   │       ├── finishing-item-update.ts
│   │       ├── finishing-item-delete.ts
│   │       ├── finishing-item-reorder.ts
│   │       ├── finishing-item-batch-spec-update.ts
│   │       ├── mep-item-create.ts
│   │       ├── building-config-update.ts
│   │       ├── quote-create.ts          # يشمل list, create, getById, update, delete
│   │       ├── spec-template-list.ts
│   │       ├── spec-template-create.ts
│   │       ├── spec-template-update.ts
│   │       ├── spec-template-delete.ts
│   │       └── spec-template-set-default.ts
│   └── pricing/
│       ├── router.ts                    # يربط quantities + quotations + leads
│       └── procedures/leads/            # 16 ملف — ربط الفرص بالدراسات
│           ├── link-cost-study.ts
│           ├── unlink-cost-study.ts
│           ├── link-quotation.ts
│           └── unlink-quotation.ts
│
├── 📂 apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/
│   ├── studies/
│   │   ├── page.tsx                     # قائمة الدراسات
│   │   ├── new/page.tsx                 # إعادة توجيه
│   │   ├── loading.tsx
│   │   └── [studyId]/
│   │       ├── page.tsx                 # نظرة عامة على الدراسة
│   │       ├── structural/page.tsx      # محرر الأعمال الإنشائية
│   │       ├── finishing/page.tsx        # محرر التشطيبات
│   │       ├── mep/page.tsx             # محرر الأعمال الكهروميكانيكية
│   │       └── pricing/page.tsx         # محرر التسعير
│   ├── leads/                           # إدارة الفرص
│   └── quotations/                      # عروض الأسعار
│
└── 📂 apps/web/modules/saas/pricing/
    ├── components/
    │   ├── dashboard/
    │   │   └── PricingDashboard.tsx      # لوحة المعلومات الرئيسية
    │   ├── shell/
    │   │   ├── PricingNavigation.tsx     # التنقل بين الأقسام
    │   │   └── constants.ts             # ثوابت التنقل
    │   ├── studies/
    │   │   ├── QuantitiesList.tsx        # قائمة الدراسات مع الفلاتر والإحصائيات
    │   │   ├── CostStudyCard.tsx         # بطاقة الدراسة
    │   │   ├── CostStudyOverview.tsx     # نظرة عامة شاملة
    │   │   ├── CreateCostStudyForm.tsx   # نموذج إنشاء دراسة جديدة
    │   │   ├── StudyHeaderCard.tsx       # رأس الدراسة
    │   │   ├── SummaryStatsCards.tsx     # بطاقات الإحصائيات
    │   │   ├── StructuralItemsEditor.tsx # محرر العناصر الإنشائية
    │   │   ├── StructuralAccordion.tsx   # أكورديون الأقسام الإنشائية
    │   │   ├── FinishingItemsEditor.tsx  # محرر التشطيبات
    │   │   ├── MEPItemsEditor.tsx        # محرر MEP
    │   │   ├── PricingEditor.tsx         # محرر التسعير والنسب
    │   │   ├── sections/                 # 7 أقسام إنشائية
    │   │   │   ├── FoundationsSection.tsx
    │   │   │   ├── ColumnsSection.tsx
    │   │   │   ├── BeamsSection.tsx
    │   │   │   ├── SlabsSection.tsx
    │   │   │   ├── StairsSection.tsx
    │   │   │   ├── BlocksSection.tsx
    │   │   │   └── PlainConcreteSection.tsx
    │   │   ├── shared/                  # مكونات مشتركة
    │   │   │   ├── CalculationResultsPanel.tsx
    │   │   │   ├── ConcreteTypeSelect.tsx
    │   │   │   ├── DimensionsCard.tsx
    │   │   │   ├── ElementHeaderRow.tsx
    │   │   │   ├── RebarBarsInput.tsx
    │   │   │   ├── RebarMeshInput.tsx
    │   │   │   ├── RebarWeightBadge.tsx
    │   │   │   └── StirrupsInput.tsx
    │   │   └── finishing/               # حوارات التشطيبات
    │   │       ├── PaintItemDialog.tsx        # 1,256 سطر
    │   │       ├── PlasterItemDialog.tsx      # 1,022 سطر
    │   │       ├── ThermalInsulationItemDialog.tsx  # 535 سطر
    │   │       ├── WaterproofingItemDialog.tsx      # 512 سطر
    │   │       └── _deprecated/              # 14 ملف مهمل
    │   └── finishing/                   # نظام التشطيبات الذكي
    │       ├── BuildingSetupWizard.tsx   # معالج إعداد المبنى (4 خطوات)
    │       ├── BuildingSummaryBar.tsx
    │       ├── QuantitiesDashboard.tsx   # لوحة كميات التشطيبات
    │       ├── QuantitiesTable.tsx
    │       ├── QuantityRowExpanded.tsx
    │       ├── ManualItemAdder.tsx
    │       ├── KnowledgeNotification.tsx
    │       ├── CascadeNotification.tsx
    │       ├── BillOfMaterials.tsx
    │       ├── ItemSpecEditor.tsx
    │       ├── SpecBulkEditor.tsx
    │       └── TemplateManager.tsx
    ├── lib/
    │   ├── structural-calculations.ts   # حسابات الخرسانة والحديد
    │   ├── derivation-engine.ts         # محرك اشتقاق الكميات (1523 سطر)
    │   ├── merge-quantities.ts          # دمج الكميات المشتقة والمحفوظة
    │   ├── knowledge-extractor.ts       # استخلاص المعرفة من التعديلات
    │   ├── finishing-categories.ts      # 26 فئة تشطيبات (997 سطر)
    │   ├── finishing-links.ts           # روابط بين عناصر التشطيبات
    │   ├── finishing-templates.ts       # قوالب التشطيبات
    │   ├── finishing-types.ts           # أنواع التشطيبات
    │   ├── smart-building-types.ts      # أنماط المبنى الذكي
    │   └── specs/
    │       └── spec-calculator.ts       # حاسبة المواصفات
    ├── constants/
    │   ├── prices.ts                    # أسعار المواد
    │   ├── blocks.ts                    # أنواع البلوك
    │   ├── slabs.ts                     # أنواع الأسقف
    │   └── index.ts                     # تصدير مركزي
    └── types/
        ├── index.ts
        ├── foundations.ts
        ├── slabs.ts
        ├── columns.ts
        ├── beams.ts
        └── blocks.ts
```

### 1.2 إحصائيات الملفات

| الفئة | عدد الملفات | إجمالي الأسطر (تقريبي) |
|-------|------------|----------------------|
| قاعدة البيانات (Schema + Queries) | 2 | ~1,600 |
| إجراءات API | 22 | ~2,500 |
| صفحات Next.js | 7 | ~350 |
| مكونات React | 50+ | ~15,000 |
| مكتبات الحساب | 6 | ~5,000 |
| الثوابت والأنماط | 8 | ~2,000 |
| مكونات مهملة (_deprecated) | 14 | ~3,000 |
| **الإجمالي** | **~109** | **~29,450** |

---

## 2. قاعدة البيانات (Database Schema)

### 2.1 نموذج CostStudy — الدراسة الرئيسية

**الملف:** `packages/database/prisma/schema.prisma` (أسطر 1147-1200)

```prisma
model CostStudy {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdById     String
  createdBy       User     @relation(fields: [createdById], references: [id])

  // بيانات أساسية
  name            String?
  customerName    String?
  customerId      String?
  projectType     String?
  landArea        Float?
  buildingArea    Float?
  numberOfFloors  Int?
  hasBasement     Boolean  @default(false)
  finishingLevel  String?

  // تكاليف مجمعة (تُحسب تلقائياً)
  structuralCost  Decimal  @default(0) @db.Decimal(15, 2)
  finishingCost   Decimal  @default(0) @db.Decimal(15, 2)
  mepCost         Decimal  @default(0) @db.Decimal(15, 2)
  laborCost       Decimal  @default(0) @db.Decimal(15, 2)

  // نسب التسعير
  overheadPercent    Decimal @default(5)  @db.Decimal(5, 2)
  profitPercent      Decimal @default(10) @db.Decimal(5, 2)
  contingencyPercent Decimal @default(3)  @db.Decimal(5, 2)
  vatIncluded        Boolean @default(true)

  // النتيجة النهائية
  totalCost       Decimal  @default(0) @db.Decimal(15, 2)
  buildingConfig  Json?    // إعدادات المبنى (JSON)
  status          String   @default("draft")
  notes           String?

  // العلاقات
  structuralItems StructuralItem[]
  finishingItems  FinishingItem[]
  mepItems        MEPItem[]
  laborItems      LaborItem[]
  quotes          Quote[]
  lead            Lead?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 2.2 نموذج StructuralItem — العناصر الإنشائية

**الملف:** `packages/database/prisma/schema.prisma` (أسطر 1203-1233)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `category` | String | الفئة (foundations, columns, beams, slabs, stairs, blocks, plain_concrete) |
| `subCategory` | String? | الفئة الفرعية |
| `name` | String | اسم العنصر |
| `quantity` | Int | العدد |
| `unit` | String | الوحدة (افتراضي: m3) |
| `concreteVolume` | Decimal | حجم الخرسانة |
| `concreteType` | String? | نوع الخرسانة (C30, C35, C40) |
| `steelWeight` | Decimal | وزن الحديد |
| `steelRatio` | Decimal? | نسبة التسليح |
| `wastagePercent` | Decimal | نسبة الهدر (افتراضي: 10%) |
| `materialCost` | Decimal | تكلفة المواد |
| `laborCost` | Decimal | تكلفة العمالة |
| `totalCost` | Decimal | التكلفة الإجمالية |
| `sortOrder` | Int | ترتيب العرض |

### 2.3 نموذج FinishingItem — عناصر التشطيبات

**الملف:** `packages/database/prisma/schema.prisma` (أسطر 1236-1294)

هذا النموذج هو الأكثر تعقيداً — يشمل 39 حقلاً:

| المجموعة | الحقول | الوصف |
|----------|--------|-------|
| **الموقع** | `floorId`, `floorName` | الطابق المرتبط |
| **الأبعاد** | `area`, `length`, `height`, `width`, `perimeter`, `quantity`, `unit` | القياسات |
| **الحساب الذكي** | `calculationMethod`, `calculationData` (JSON) | طريقة حساب الكمية |
| **الربط الذكي** | `dataSource`, `sourceItemId`, `sourceFormula`, `isEnabled`, `groupKey`, `scope` | ربط بإعدادات المبنى |
| **المواصفات** | `qualityLevel`, `brand`, `specifications`, `specData` (JSON) | المواصفات والجودة |
| **التكاليف** | `materialPrice`, `laborPrice`, `materialCost`, `laborCost`, `totalCost`, `wastagePercent` | الأسعار والتكاليف |

**أنماط الحساب (calculationMethod):**
- `roomByRoom` — حساب غرفة بغرفة
- `wallDeduction` — مساحة الجدران ناقص الفتحات
- `perUnit` — لكل وحدة
- `directArea` — مساحة مباشرة
- `linear` — طولي
- `lumpSum` — مقطوعية

**مصادر البيانات (dataSource):**
- `auto` — مشتق تلقائياً من إعدادات المبنى
- `manual` — إدخال يدوي
- `estimated` — تقدير

### 2.4 نموذج MEPItem — الأعمال الكهروميكانيكية

**الملف:** `packages/database/prisma/schema.prisma` (أسطر 1318-1339)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `category` | String | الفئة (electrical, plumbing, hvac) |
| `itemType` | String | نوع العنصر |
| `name` | String | الاسم |
| `quantity` | Decimal | الكمية |
| `unit` | String | الوحدة |
| `unitPrice` | Decimal | سعر الوحدة |
| `totalCost` | Decimal | التكلفة الإجمالية |

### 2.5 نموذج LaborItem — العمالة

**الملف:** `packages/database/prisma/schema.prisma` (أسطر 1342-1365)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `laborType` | String | نوع العمل |
| `workerType` | String | نوع العامل |
| `quantity` | Int | العدد |
| `dailyRate` | Decimal | الأجر اليومي |
| `durationDays` | Int | مدة العمل بالأيام |
| `insuranceCost` | Decimal | تكلفة التأمين |
| `housingCost` | Decimal | تكلفة السكن |
| `otherCosts` | Decimal | تكاليف أخرى |
| `totalCost` | Decimal | التكلفة الإجمالية |

### 2.6 نموذج Quote — عروض الأسعار

**الملف:** `packages/database/prisma/schema.prisma` (أسطر 1368-1408)

| المجموعة | الحقول | الوصف |
|----------|--------|-------|
| **الرقم** | `quoteNumber` | تلقائي: QT-YYYY-NNNN |
| **العميل** | `clientName`, `clientCompany`, `clientPhone`, `clientEmail`, `clientAddress` | بيانات العميل |
| **التسعير** | `subtotal`, `overheadAmount`, `profitAmount`, `vatAmount`, `totalAmount` | المبالغ |
| **الإعدادات** | `validUntil`, `paymentTerms`, `deliveryTerms` | شروط العرض |
| **العرض** | `showUnitPrices`, `showQuantities`, `showItemDescriptions`, `includeTerms`, `includeCoverPage` | خيارات العرض |
| **الفئات** | `selectedCategories` (JSON) | الفئات المختارة للعرض |
| **الحالة** | `status` | draft / issued / accepted / rejected |

### 2.7 نموذج SpecificationTemplate — قوالب المواصفات

**الملف:** `packages/database/prisma/schema.prisma` (أسطر 1297-1315)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `name` | String | الاسم بالعربية |
| `nameEn` | String? | الاسم بالإنجليزية |
| `specs` | Json | بنية المواصفات |
| `isDefault` | Boolean | القالب الافتراضي |
| `isSystem` | Boolean | قالب نظام (غير قابل للحذف) |
| `organizationId` | String | لكل منظمة |

### 2.8 علاقات قاعدة البيانات

```
Organization ──1:N──► CostStudy ──1:N──► StructuralItem
                                  ──1:N──► FinishingItem
                                  ──1:N──► MEPItem
                                  ──1:N──► LaborItem
                                  ──1:N──► Quote
                                  ──1:1──► Lead (اختياري)

Organization ──1:N──► SpecificationTemplate

User ──1:N──► CostStudy (createdBy)
```

---

## 3. واجهة API (Backend Procedures)

### 3.1 هيكل الموجّه (Router)

**الملف:** `packages/api/modules/quantities/router.ts`

```typescript
export const quantitiesRouter = {
  // إدارة الدراسات
  list,                    // GET  — قائمة الدراسات مع فلاتر وبحث
  getById,                 // GET  — تفاصيل دراسة واحدة
  create,                  // POST — إنشاء دراسة جديدة
  update,                  // PUT  — تحديث دراسة
  delete: deleteCostStudy, // DELETE — حذف دراسة
  duplicate,               // POST — نسخ دراسة مع جميع العناصر
  recalculate,             // POST — إعادة حساب المجاميع

  // العناصر الإنشائية
  structuralItem: {
    create,                // POST — إضافة عنصر إنشائي
    update,                // PUT  — تحديث عنصر إنشائي
    delete,                // DELETE — حذف عنصر إنشائي
  },

  // عناصر التشطيبات
  finishingItem: {
    create,                // POST — إضافة عنصر تشطيب
    createBatch,           // POST — إضافة دفعة عناصر
    update,                // PUT  — تحديث عنصر تشطيب
    delete,                // DELETE — حذف عنصر تشطيب
    reorder,               // PUT  — إعادة ترتيب العناصر
    batchSpecUpdate,       // PUT  — تحديث مواصفات دفعة
  },

  // إعدادات المبنى
  buildingConfig: {
    update,                // PUT  — تحديث + cascade تلقائي
  },

  // الأعمال الكهروميكانيكية
  mepItem: {
    create,                // POST — إضافة عنصر MEP
    createBatch,           // POST — إضافة دفعة عناصر MEP
    // ⚠️ لا يوجد update أو delete فردي
  },

  // عروض الأسعار
  quote: {
    list,                  // GET  — قائمة العروض
    create,                // POST — إنشاء عرض
    getById,               // GET  — تفاصيل عرض
    update,                // PUT  — تحديث عرض
    delete,                // DELETE — حذف عرض
  },

  // قوالب المواصفات
  specTemplate: {
    list,                  // GET  — قائمة القوالب
    create,                // POST — إنشاء قالب
    update,                // PUT  — تحديث قالب
    delete,                // DELETE — حذف قالب
    setDefault,            // PUT  — تعيين كافتراضي
  },
}
```

### 3.2 التحقق من الصلاحيات

كل إجراء يستخدم:
```typescript
await verifyOrganizationAccess(organizationId, userId, {
  section: "pricing",
  action: "studies" | "view" | "pricing"
});
```

### 3.3 بوابات الميزات (Feature Gates)

```typescript
// حفظ الدراسة يتطلب اشتراك
await enforceFeatureAccess(organizationId, "cost-study.save", context.user);
```

### 3.4 ⚠️ نقص في API

| العملية | الحالة | ملاحظة |
|---------|--------|--------|
| تحديث عنصر MEP | **مفقود** | لا يوجد `mepItem.update` — يمكن فقط الإنشاء والحذف |
| حذف عنصر MEP فردي | **مفقود** | لا يوجد `mepItem.delete` |
| تحديث عنصر عمالة | **مفقود** | لا يوجد `laborItem.update` |
| حذف عنصر عمالة | **مفقود** | لا يوجد `laborItem.delete` في الراوتر |

---

## 4. الأعمال الإنشائية (Structural Works)

### 4.1 الأقسام السبعة

| القسم | المكوّن | الوصف |
|-------|---------|-------|
| الخرسانة العادية | `PlainConcreteSection` | عناصر خرسانة بدون تسليح |
| الأساسات | `FoundationsSection` | منفصلة، مشتركة، شريطية، لبشة |
| الأعمدة | `ColumnsSection` | أعمدة مع حسابات التسليح |
| الكمرات | `BeamsSection` | كمرات وجسور أرضية |
| الأسقف | `SlabsSection` | أسقف صلبة، هوردي، مضلّعة |
| البلوك | `BlocksSection` | جدران البلوك بأنواعها |
| السلالم | `StairsSection` | عناصر السلالم |

### 4.2 محرك الحسابات الإنشائية

**الملف:** `apps/web/modules/saas/pricing/lib/structural-calculations.ts`

الدوال الرئيسية:

```typescript
calculateIsolatedFoundation(input)  // أساس منفصل
calculateStripFoundation(input)     // أساس شريطي
calculateRaftFoundation(input)      // لبشة
calculateColumn(input)              // عمود مع تسليح
calculateBeam(input)                // كمرة
calculateSlab(input)                // سقف
calculateBlocks(input)              // جدار بلوك
calculateStairs(input)              // سلم
calculatePlainConcrete(input)       // خرسانة عادية
```

**كل دالة تحسب:**
1. حجم الخرسانة (م³)
2. وزن حديد التسليح (كجم) — عبر أقطار وتباعد الأسياخ
3. نسبة التسليح (%)
4. تكلفة المواد والعمالة

### 4.3 المكونات المشتركة (Shared Components)

| المكوّن | الوظيفة |
|---------|---------|
| `ElementHeaderRow` | صف مضغوط: الاسم، النوع، الكمية، نوع الخرسانة |
| `DimensionsCard` | حقول أبعاد قابلة للتحرير مع حجم محسوب |
| `RebarMeshInput` | إدخال شبكة حديد اتجاهين (قصير/طويل أو X/Y) |
| `RebarBarsInput` | عدد الأسياخ والقطر |
| `StirrupsInput` | قطر الكانات والتباعد |
| `RebarWeightBadge` | عرض وزن الحديد المحسوب |
| `ConcreteTypeSelect` | قائمة منسدلة: C20, C25, C30, C35, C40 |
| `CalculationResultsPanel` | عرض حجم الخرسانة، وزن الحديد، التكاليف |

### 4.4 أنواع الأساسات

```typescript
type FoundationType = "isolated" | "combined" | "strip" | "raft";
```

- **منفصل (Isolated):** إدخال أبعاد + شبكة حديد سفلية/علوية
- **مشترك (Combined):** مثل المنفصل + أبعاد مضاعفة
- **شريطي (Strip):** أبعاد + كانات وتباعد
- **لبشة (Raft):** مساحة كاملة + شبكة X/Y

### 4.5 أنواع البلوك

```typescript
// من constants/blocks.ts
type BlockType = "hollow" | "solid" | "insulated" | "fire_rated" | "lightweight" | "aac";
type WallCategory = "external" | "internal" | "partition" | "boundary" | "retaining" | "parapet";
```

### 4.6 أنواع الأسقف

```typescript
// من constants/slabs.ts
type SlabType = "solid" | "hollow" | "ribbed";
```

---

## 5. أعمال التشطيبات (Finishing Works)

### 5.1 نظام التشطيبات الذكي — نظرة عامة

نظام التشطيبات هو **أكثر الأقسام تعقيداً** ويتكون من:

1. **معالج إعداد المبنى** (BuildingSetupWizard) — 4 خطوات
2. **محرك اشتقاق الكميات** (Derivation Engine) — 1523 سطر
3. **نظام دمج الكميات** (Merge Quantities) — مزج المشتق والمحفوظ
4. **15 مجموعة تشطيبات** مع 26 فئة تفصيلية
5. **نظام ربط ذكي** بإعدادات المبنى مع تحديث تتابعي (Cascade)
6. **نظام مواصفات** مع قوالب قابلة لإعادة الاستخدام

### 5.2 معالج إعداد المبنى (Building Setup Wizard)

**الملف:** `apps/web/modules/saas/pricing/components/finishing/BuildingSetupWizard.tsx`

**4 خطوات:**

| الخطوة | العنوان | المحتوى |
|--------|---------|---------|
| 1 | هيكل المبنى | مساحة الأرض، محيط المبنى، عدد الطوابق |
| 2 | تفاصيل الطوابق | تعريف كل طابق: المساحة، الارتفاع، النوع، الغرف، الفتحات |
| 3 | العناصر الخارجية | الأسوار، الحدائق، الأفنية |
| 4 | المراجعة | مراجعة وتأكيد الإعدادات |

**أنواع الطوابق:**
```typescript
type FloorType = "BASEMENT" | "GROUND" | "UPPER" | "ANNEX" | "ROOF" | "MEZZANINE";
```

**إعدادات الغرف:**
```typescript
interface RoomConfig {
  id: string;
  name: string;
  length: number;
  width: number;
  type: RoomType; // bedroom, living, majlis, kitchen, bathroom, hall, corridor, storage, laundry, maid_room, other
  hasFalseCeiling?: boolean;
}
```

### 5.3 محرك اشتقاق الكميات (Derivation Engine)

**الملف:** `apps/web/modules/saas/pricing/lib/derivation-engine.ts` (1523 سطر)

```typescript
export function deriveAllQuantities(config: SmartBuildingConfig): DerivedQuantity[]
```

**يولّد كميات تلقائياً لـ 15 مجموعة:**

| # | المجموعة | الاشتقاق |
|---|----------|---------|
| 1 | العزل | من مساحات الجدران الخارجية والسقف |
| 2 | اللياسة | من مساحات الجدران والأسقف مع خصم الفتحات |
| 3 | الدهانات | مرتبط باللياسة مع إضافة طبقات |
| 4 | الأرضيات | من مساحات الطوابق |
| 5 | كسوة الجدران | من مساحات جدران المطابخ والحمامات |
| 6 | الأسقف المستعارة | من مساحات الغرف ذات السقف المستعار |
| 7 | الأبواب | من عدد الغرف والمداخل |
| 8 | النوافذ | من عدد الفتحات المعرّفة |
| 9 | الأدوات الصحية | من عدد الحمامات |
| 10 | المطبخ | من مساحة المطبخ |
| 11 | السلالم | من عدد الطوابق |
| 12 | الواجهة | من المحيط × الارتفاع |
| 13 | الأعمال الخارجية | من مساحة الفناء والسور |
| 14 | أعمال السطح | من مساحة السقف |
| 15 | الديكور | تقدير مقطوعي |

**نظام Cascade (التحديث التتابعي):**
```typescript
const CASCADE_MAP: Record<string, string[]> = {
  waterproofing_roof: ["thermal_roof", "roof_finishing"],
  external_plaster: ["facade_paint", "stone_facade"],
  bathroom_fixtures: ["vanities"],
};
```

### 5.4 نظام دمج الكميات (Merge Quantities)

**الملف:** `apps/web/modules/saas/pricing/lib/merge-quantities.ts`

```typescript
export function mergeQuantities(
  derived: DerivedQuantity[],
  saved: SavedFinishingItem[],
): MergedQuantityItem[]
```

**قواعد الدمج:**
1. **عنصر في المشتق والمحفوظ معاً** → استخدم القيم المحفوظة (المستخدم قد يكون عدّل يدوياً)
2. **عنصر في المشتق فقط** → إضافة كعنصر جديد غير محفوظ
3. **عنصر في المحفوظ فقط** → إبقاء كعنصر يدوي
4. **مفتاح المطابقة:** `category|subCategory|floorId|scope`
5. **علم `isManualOverride`:** يُضبط إذا كان `dataSource === "manual"` والكمية تختلف عن المشتقة بأكثر من 0.01
6. **علم `isStale`:** نفس `isManualOverride` — يشير لحاجة المراجعة

### 5.5 مجموعات التشطيبات الـ 15

**الملف:** `apps/web/modules/saas/pricing/lib/finishing-categories.ts`

| # | المجموعة | الرمز | الأيقونة |
|---|----------|-------|---------|
| 1 | أعمال العزل | INSULATION | Shield |
| 2 | أعمال اللياسة | PLASTERING | Brush |
| 3 | أعمال الدهانات | PAINTING | Palette |
| 4 | أعمال الأرضيات | FLOORING | Grid |
| 5 | كسوة الجدران | WALL_CLADDING | Layers |
| 6 | الأسقف المستعارة | FALSE_CEILING | ArrowDown |
| 7 | أعمال الأبواب | DOORS | DoorOpen |
| 8 | أعمال النوافذ | WINDOWS | Frame |
| 9 | الأعمال الصحية | SANITARY | Droplet |
| 10 | أعمال المطابخ | KITCHEN | Utensils |
| 11 | السلالم | STAIRS | TrendingUp |
| 12 | الواجهة | FACADE | Building |
| 13 | أعمال خارجية | EXTERNAL | TreePine |
| 14 | أعمال السطح | ROOF_WORKS | Home |
| 15 | الديكور | DECOR | Star |

### 5.6 حوارات التشطيبات المتخصصة

**4 حوارات متخصصة:**

| الحوار | الملف | الأسطر | الميزات الخاصة |
|--------|-------|--------|---------------|
| الدهانات | `PaintItemDialog.tsx` | 1,256 | ربط باللياسة، طبقات التأسيس والمعجون، حسابات التغطية |
| اللياسة | `PlasterItemDialog.tsx` | 1,022 | حساب غرفة بغرفة، خصم الفتحات، كميات المواد |
| العزل الحراري | `ThermalInsulationItemDialog.tsx` | 535 | قيم Lambda وR، امتثال SBC |
| العزل المائي | `WaterproofingItemDialog.tsx` | 512 | طبقات، أولاد، تداخل |

---

## 6. الأعمال الكهروميكانيكية (MEP Works)

### 6.1 الهيكل

**المكوّن:** `MEPItemsEditor.tsx`

**3 فئات:**
- **كهربائية (Electrical):** توصيلات، مفاتيح، لوحات
- **سباكة (Plumbing):** أنابيب، صمامات، خزانات
- **تكييف (HVAC):** وحدات، مجاري هواء

### 6.2 ⚠️ قيود حالية

| القيد | الوصف |
|-------|-------|
| لا يوجد تحديث فردي | لا يمكن تعديل عنصر MEP — فقط إنشاء وحذف |
| لا يوجد حذف فردي في الراوتر | عملية الحذف غير موجودة في `mepItem` |
| لا اشتقاق من المبنى | عناصر MEP لا ترتبط بإعدادات المبنى |
| لا حسابات تفصيلية | لا يوجد محرك حساب مثل الإنشائي أو التشطيبات |

---

## 7. التسعير والنسب (Pricing & Markup)

### 7.1 مكوّن التسعير

**الملف:** `apps/web/modules/saas/pricing/components/studies/PricingEditor.tsx` (262 سطر)

```typescript
// أسطر 51-61 — حساب التكاليف
const directCost = study.structuralCost + study.finishingCost + study.mepCost + study.laborCost;
const overhead = directCost * (study.overheadPercent / 100);
const profit = directCost * (study.profitPercent / 100);
const contingency = directCost * (study.contingencyPercent / 100);
const subtotal = directCost + overhead + profit + contingency;
const vat = study.vatIncluded ? subtotal * 0.15 : 0;
```

### 7.2 النسب الافتراضية

| النسبة | القيمة الافتراضية | قابلة للتعديل |
|--------|-------------------|--------------|
| المصاريف العامة (Overhead) | 5% | نعم |
| الربح (Profit) | 10% | نعم |
| الاحتياطي (Contingency) | 3% | نعم |
| الضريبة (VAT) | 15% | تشغيل/إيقاف فقط |

### 7.3 ⚠️ مشكلة: حقول الإدخال للقراءة فقط

حقول النسب في `PricingEditor` معلّمة كـ `readOnly` — لا يمكن تعديلها من واجهة التسعير. التعديل يتم فقط عند تحديث الدراسة نفسها.

### 7.4 عرض عروض الأسعار

المكوّن يعرض قائمة عروض الأسعار المرتبطة بالدراسة مع:
- رقم العرض
- اسم العميل
- المبلغ الإجمالي
- الحالة

---

## 8. عروض الأسعار (Quotations)

### 8.1 نظام الترقيم

```typescript
// تلقائي: QT-YYYY-NNNN
// مثال: QT-2026-0001, QT-2026-0002
```

### 8.2 حالات العرض

| الحالة | الوصف |
|--------|-------|
| `draft` | مسودة |
| `issued` | صادر |
| `accepted` | مقبول |
| `rejected` | مرفوض |

### 8.3 خيارات العرض

| الخيار | الافتراضي | الوصف |
|--------|-----------|-------|
| `showUnitPrices` | true | عرض أسعار الوحدات |
| `showQuantities` | true | عرض الكميات |
| `showItemDescriptions` | true | عرض أوصاف البنود |
| `includeTerms` | true | تضمين الشروط والأحكام |
| `includeCoverPage` | true | تضمين صفحة غلاف |

### 8.4 ربط الفرص (Leads Integration)

```
Lead ──1:1──► CostStudy   (عبر costStudyId)
Lead ──1:1──► Quotation   (عبر quotationId)
```

إجراءات الربط:
- `linkCostStudy` / `unlinkCostStudy`
- `linkQuotation` / `unlinkQuotation`

---

## 9. قوالب المواصفات (Specification Templates)

### 9.1 الهيكل

| النوع | الوصف |
|-------|-------|
| قوالب نظام (`isSystem: true`) | معرّفة مسبقاً، غير قابلة للحذف |
| قوالب مخصصة | لكل منظمة |
| قالب افتراضي (`isDefault: true`) | واحد لكل منظمة |

### 9.2 العمليات

```typescript
specTemplate.list()       // قائمة القوالب (نظام + مخصصة)
specTemplate.create()     // إنشاء قالب جديد
specTemplate.update()     // تحديث قالب
specTemplate.delete()     // حذف قالب (غير نظام)
specTemplate.setDefault() // تعيين كافتراضي (transaction)
```

### 9.3 تطبيق المواصفات

```typescript
finishingItem.batchSpecUpdate()  // تحديث مواصفات دفعة من عناصر التشطيبات
// يُحدّث: specData, qualityLevel, brand, specifications
```

---

## 10. حسابات التكاليف (Cost Calculations)

### 10.1 دالة إعادة الحساب الرئيسية

**الملف:** `packages/database/prisma/queries/cost-studies.ts` (أسطر 316-371)

```typescript
export async function recalculateCostStudyTotals(id: string) {
  // 1. تجميع تكاليف كل نوع بالتوازي
  const [structural, finishing, mep, labor] = await Promise.all([
    db.structuralItem.aggregate({ where: { costStudyId: id }, _sum: { totalCost: true } }),
    db.finishingItem.aggregate({ where: { costStudyId: id }, _sum: { totalCost: true } }),
    db.mEPItem.aggregate({ where: { costStudyId: id }, _sum: { totalCost: true } }),
    db.laborItem.aggregate({ where: { costStudyId: id }, _sum: { totalCost: true } }),
  ]);

  // 2. تحويل Decimal إلى Number
  const structuralCost = Number(structural._sum.totalCost ?? 0);
  const finishingCost  = Number(finishing._sum.totalCost ?? 0);
  const mepCost        = Number(mep._sum.totalCost ?? 0);
  const laborCost      = Number(labor._sum.totalCost ?? 0);

  // 3. جلب نسب الدراسة
  const study = await db.costStudy.findUnique({
    where: { id },
    select: { overheadPercent: true, profitPercent: true, contingencyPercent: true, vatIncluded: true },
  });

  // 4. حساب التكلفة النهائية
  const subtotal    = structuralCost + finishingCost + mepCost + laborCost;
  const overhead    = subtotal * (Number(study.overheadPercent) / 100);
  const profit      = subtotal * (Number(study.profitPercent) / 100);
  const contingency = subtotal * (Number(study.contingencyPercent) / 100);
  const beforeVat   = subtotal + overhead + profit + contingency;
  const vat         = study.vatIncluded ? beforeVat * 0.15 : 0;
  const totalCost   = beforeVat + vat;

  // 5. تحديث الدراسة
  await db.costStudy.update({
    where: { id },
    data: { structuralCost, finishingCost, mepCost, laborCost, totalCost },
  });
}
```

### 10.2 معادلة التسعير

```
التكلفة المباشرة = إنشائي + تشطيبات + كهروميكانيكي + عمالة
المصاريف العامة = التكلفة المباشرة × نسبة المصاريف العامة%
الربح = التكلفة المباشرة × نسبة الربح%
الاحتياطي = التكلفة المباشرة × نسبة الاحتياطي%
قبل الضريبة = التكلفة المباشرة + المصاريف العامة + الربح + الاحتياطي
الضريبة = قبل الضريبة × 15% (إذا مفعّلة)
الإجمالي = قبل الضريبة + الضريبة
```

### 10.3 متى يُعاد الحساب؟

| الحدث | يُعاد الحساب؟ |
|-------|--------------|
| إنشاء عنصر إنشائي | ✅ نعم |
| تحديث عنصر إنشائي | ✅ نعم |
| حذف عنصر إنشائي | ✅ نعم |
| إنشاء عنصر تشطيب | ✅ نعم |
| تحديث عنصر تشطيب | ✅ نعم |
| حذف عنصر تشطيب | ✅ نعم |
| إنشاء دفعة تشطيبات | ✅ نعم (مرة واحدة) |
| تحديث إعدادات المبنى | ✅ نعم (عبر cascade) |
| إنشاء عنصر MEP | ✅ نعم |
| تغيير النسب (overhead/profit) | ⚠️ يتطلب حفظ يدوي |

---

## 11. الربط بين الأقسام (Section Linking)

### 11.1 مخطط تدفق البيانات

```
إعدادات المبنى (BuildingConfig)
    │
    ├──► [Cascade] ──► عناصر التشطيبات المرتبطة
    │                    │
    │                    ├──► recalculateCostStudyTotals()
    │                    │         │
    │                    │         ├──► SUM(structuralItem.totalCost) → structuralCost
    │                    │         ├──► SUM(finishingItem.totalCost) → finishingCost
    │                    │         ├──► SUM(mepItem.totalCost) → mepCost
    │                    │         ├──► SUM(laborItem.totalCost) → laborCost
    │                    │         └──► حساب overhead + profit + contingency + VAT
    │                    │                   │
    │                    │                   └──► تحديث CostStudy.totalCost
    │                    │
    │                    └──► الواجهة تقرأ القيم المحدّثة
    │
    └──► محرك الاشتقاق (Frontend) ──► عرض الكميات المقترحة
```

### 11.2 هل الربط يعمل فعلاً؟

**✅ نعم — مؤكد بالكود:**

**المسار:** تحديث عنصر تشطيب (UI) → `finishingItemUpdate` إجراء → `updateFinishingItem()` → `recalculateCostStudyTotals()` → تجميع كل `finishingItem.totalCost` → تحديث `CostStudy.finishingCost`

**الأدلة:**
- `finishingItemUpdate` (procedures/finishing-item-update.ts سطر 7) يستدعي `updateFinishingItem(id, costStudyId, data)`
- `updateFinishingItem` (cost-studies.ts سطر 620) يستدعي `recalculateCostStudyTotals(costStudyId)` في سطر 663
- `recalculateCostStudyTotals` (cost-studies.ts سطر 322) يجمع `finishingItem.totalCost`

### 11.3 هل التسعير يستخدم الأقسام الأربعة؟

**✅ نعم — لكن بأسلوب القراءة فقط (Read-Only):**

```typescript
// PricingEditor.tsx أسطر 51-55
const directCost =
  study.structuralCost +   // ← من قاعدة البيانات
  study.finishingCost +    // ← من قاعدة البيانات
  study.mepCost +          // ← من قاعدة البيانات
  study.laborCost;         // ← من قاعدة البيانات
```

**الهندسة: Hub-and-Spoke:**
- **المحور (Hub):** سجل CostStudy في قاعدة البيانات مع التكاليف المجمعة
- **فرع 1 (Finishing):** يمكن اشتقاقه من إعدادات المبنى مع تحديث تتابعي
- **فرع 2 (Structural):** معزول — إدخال يدوي فقط
- **فرع 3 (MEP):** معزول — إدخال يدوي فقط
- **فرع 4 (Pricing):** عرض فقط — يقرأ المجاميع المحسوبة مسبقاً

### 11.4 ⚠️ تناقض في حساب الضريبة

**المشكلة:** `CostStudyOverview.tsx` (سطر 143) يحسب الضريبة بشكل مختلف عن `PricingEditor.tsx` (سطر 61):

```typescript
// CostStudyOverview.tsx — حساب عكسي
const vatAmount = study.vatIncluded ? (totalCost * 0.15 / 1.15) : 0;

// PricingEditor.tsx — حساب مباشر (يطابق recalculateCostStudyTotals)
const vat = study.vatIncluded ? subtotal * 0.15 : 0;
```

**التأثير:** قد يظهر مبلغ ضريبة مختلف في صفحة النظرة العامة مقارنة بصفحة التسعير.

---

## 12. الترجمة (i18n)

### 12.1 مفاتيح الترجمة المتعلقة بالتسعير

**العدد الإجمالي:** ~453 مفتاح ترجمة تحت `pricing.studies`

**الأقسام الرئيسية:**

| القسم | عدد المفاتيح (تقريبي) | الوصف |
|-------|----------------------|-------|
| الجذر | ~40 | عناوين، حالات، إجراءات عامة |
| `form` | ~18 | نموذج إنشاء الدراسة |
| `structural` | ~45 | الأعمال الإنشائية |
| `finishing` | ~30 | تشطيبات عامة |
| `finishing.wizard` | ~25 | معالج إعداد المبنى |
| `finishing.buildingConfig` | ~20 | إعدادات المبنى |
| `finishing.dashboard` | ~50 | لوحة التشطيبات |
| `finishing.linking` | ~15 | ربط الكميات |
| `finishing.waterproofing` | ~25 | العزل المائي |
| `finishing.thermal` | ~20 | العزل الحراري |
| `finishing.plaster` | ~35 | اللياسة |
| `finishing.paint` | ~40 | الدهانات |
| `finishing.specs` | ~15 | المواصفات |
| `finishing.bulk` | ~12 | التحديث الجماعي |
| `finishing.bom` | ~10 | جدول الكميات |
| `finishing.calculator` | ~25 | حاسبة الكميات |
| `finishing.groups` | ~15 | مجموعات التشطيبات |
| `mep` | ~5 | الأعمال الكهروميكانيكية |
| `pricing` | ~3 | التسعير |
| `quotes` | ~10 | عروض الأسعار |

### 12.2 مفاتيح ناقصة أو غير مستخدمة

**⚠️ مفاتيح ناقصة — تقدير 200+ مفتاح:**

المشكلة الأساسية: ملف `finishing-categories.ts` يحتوي 26 فئة تشطيبات بأسماء عربية hardcoded (بدون مفاتيح ترجمة). كل فئة تحتاج:

```
pricing.studies.finishing.categories.{categoryId}.name
pricing.studies.finishing.categories.{categoryId}.description
pricing.studies.finishing.categories.{categoryId}.subcategories.{subId}
pricing.studies.finishing.categories.{categoryId}.qualityLevels.{level}.name
pricing.studies.finishing.categories.{categoryId}.qualityLevels.{level}.priceRange
```

**26 فئة × 5-10 مفاتيح = ~200 مفتاح مفقود**

**أيضاً مفقود:**
- أسماء أنواع البلوك (6 أنواع) — `blocks.ts`
- أسماء فئات الجدران (6 فئات) — `blocks.ts`
- أسماء الأبواب والنوافذ الشائعة — `blocks.ts`
- أسماء الطوابق — `slabs.ts`
- أسماء أنواع الأسقف — `slabs.ts`

### 12.3 نصوص hardcoded بالعربية في الكود

**الملفات المتأثرة وعدد النصوص:**

| الملف | عدد النصوص العربية | أمثلة |
|-------|-------------------|-------|
| `finishing-categories.ts` | ~150+ | `nameAr: "أعمال العزل"`, `priceRangeAr: "15–30 ر.س/م²"` |
| `blocks.ts` | ~25 | `nameAr: 'مفرغ عادي'`, `name: 'باب رئيسي'` |
| `slabs.ts` | ~20 | `nameAr: 'سقف صلب'`, `['أرضي', 'أول', 'ثاني']` |
| `prices.ts` | ~10 | تعليقات عربية |
| `structural-calculations.ts` | ~5 | تعليقات عربية |
| `derivation-engine.ts` | غير مباشر | يستخدم `g.nameAr` من finishing-categories |
| إجراءات API | ~5 | `"دراسة التكلفة غير موجودة"` |

**⚠️ 18 مكوّن React يعتمد على النصوص العربية من `finishing-categories.ts`:**
- FloorDetailsStep, ExteriorStep, ReviewStep, BuildingStructureStep
- PaintItemDialog, PlasterItemDialog, ThermalInsulationItemDialog, WaterproofingItemDialog
- FoundationsSection, ColumnsSection, BeamsSection, SlabsSection, BlocksSection, StairsSection, PlainConcreteSection
- KnowledgeNotification, CalculationResultsPanel, QuickAddTemplates

---

## 13. تحليل جودة الكود

### 13.1 كود مكرر (Duplicated Code)

#### أ. تكرار حوارات التشطيبات (الأخطر)

**4 حوارات شبه متطابقة:**

| الحوار | الأسطر | التكرار |
|--------|--------|---------|
| `PaintItemDialog.tsx` | 1,256 | الأساس |
| `PlasterItemDialog.tsx` | 1,022 | ~70% مشابه |
| `ThermalInsulationItemDialog.tsx` | 535 | ~50% مشابه |
| `WaterproofingItemDialog.tsx` | 512 | ~50% مشابه |

**الأنماط المكررة:**

1. **واجهات متكررة** — `RoomEntry`, `OpeningEntry` معرّفة في كل ملف:
```typescript
// مكرر في PaintItemDialog + PlasterItemDialog
interface RoomEntry {
  name: string;
  wall1: number | "";
  wall2: number | "";
  heightOverride?: number | null;
}

interface OpeningEntry {
  name: string;
  width: number | "";
  height: number | "";
  count: number | "";
}
```

2. **دوال مساعدة متكررة** — `makeRoom()`, `makeDoor()`, `makeWindow()` متطابقة في ملفين

3. **بنية الحوار متكررة** — نفس النمط: `useMutation` + `useState` + `useEffect` + نموذج كبير

**التوصية:** استخلاص `BaseFinishingItemDialog` مشترك — يوفر ~2,500 سطر

#### ب. نمط إعادة الحساب المكرر

في `cost-studies.ts`، استدعاء `recalculateCostStudyTotals(costStudyId)` يتكرر بعد كل عملية CRUD:
```typescript
// يتكرر 11+ مرة في الملف
const item = await db.ENTITY.create({ data: {...} });
await recalculateCostStudyTotals(costStudyId);
return item;
```

#### ج. اختلاف بنية RoomEntry

```typescript
// PaintItemDialog — بسيط
interface RoomEntry { name; wall1; wall2; heightOverride }

// PlasterItemDialog — موسّع
interface RoomEntry { name; wall1; wall2; heightOverride; shape: "rectangular" | "custom"; customWalls?: (number | "")[] }
```

### 13.2 كود غير مستخدم (Dead Code)

| الموقع | الوصف | الحالة |
|--------|-------|--------|
| `finishing/_deprecated/` | 14 ملف مهمل | ✅ آمن للحذف — لا يوجد أي import |
| `getFinishingItemsForCascade()` | دالة في cost-studies.ts | ⚠️ تُستخدم فقط من building-config-update |
| `batchUpdateFinishingItems()` | دالة في cost-studies.ts | ⚠️ تُستخدم فقط من building-config-update |
| Type assertions (`as any`) | في Lead/Quotation forms | ⚠️ يشير لنقص في الأنماط |

**ملفات `_deprecated/` المهملة (14 ملف):**
1. `AddEditFinishingItemDialog.tsx`
2. `BuildingConfigPanel.tsx`
3. `FinishingCategoryCard.tsx`
4. `FinishingGroupSection.tsx`
5. `FinishingItemRow.tsx`
6. `FinishingSummary.tsx`
7. `FloorSelector.tsx`
8. `QuickAddTemplates.tsx`
9. `calculators/DirectAreaCalculator.tsx`
10. `calculators/LinearCalculator.tsx`
11. `calculators/LumpSumCalculator.tsx`
12. `calculators/PerUnitCalculator.tsx`
13. `calculators/RoomByRoomCalculator.tsx`
14. `calculators/WallDeductionCalculator.tsx`

### 13.3 TODO Comments

**عدد TODO/FIXME/HACK: 0**

لم يُعثر على أي تعليقات TODO أو FIXME في كود التسعير. هذا نظيف.

### 13.4 console.log المتروكة

**عدد: 2**

| الملف | السطر | النوع |
|-------|-------|-------|
| `CreateLeadForm.tsx` | 114 | `console.error("Failed to upload file:", ...)` |
| `SlabsSection.tsx` | 428 | `console.error("Calculation error:", error)` |

**ملاحظة:** هذه `console.error` وليست `console.log` — مقبولة جزئياً لكن يُفضل استبدالها بخدمة تسجيل.

### 13.5 أنماط غير متسقة

| النمط | الوصف | الملفات المتأثرة |
|-------|-------|-----------------|
| **بنية RoomEntry** | نسختان مختلفتان في PaintItemDialog vs PlasterItemDialog | 2 ملفين |
| **معالجة الأخطاء** | CreateLeadForm يتحقق من رسالة الاشتراك، باقي الملفات لا | CreateLeadForm vs others |
| **نهج الربط** | PaintItemDialog يستخدم `getDerivationOptions()` + `computeDerivedQuantity()`، بينما PlasterItemDialog أبسط | 4 حوارات |
| **إعادة الحساب** | بعض العمليات تعيد الحساب لكل عنصر، وبعضها مرة واحدة للدفعة | cost-studies.ts |
| **Type assertions** | `as any` في Lead/Quotation forms لكن ليس في Studies | 4 ملفات |

---

## 14. ملخص المميزات الحالية

| # | الميزة | الحالة | ملاحظات |
|---|--------|--------|---------|
| 1 | إنشاء دراسة تكلفة | ✅ مكتمل | مع بيانات المشروع الأساسية |
| 2 | قائمة الدراسات مع بحث وفلاتر | ✅ مكتمل | فلترة بالحالة والبحث النصي |
| 3 | نسخ دراسة (Duplicate) | ✅ مكتمل | ينسخ جميع العناصر في transaction |
| 4 | حذف دراسة | ✅ مكتمل | مع cascade delete |
| 5 | الأعمال الإنشائية — 7 أقسام | ✅ مكتمل | أساسات، أعمدة، كمرات، أسقف، بلوك، سلالم، خرسانة عادية |
| 6 | حسابات الخرسانة والحديد | ✅ مكتمل | حجم، وزن، نسبة تسليح |
| 7 | معالج إعداد المبنى | ✅ مكتمل | 4 خطوات مع غرف وفتحات |
| 8 | اشتقاق كميات التشطيبات تلقائياً | ✅ مكتمل | 15 مجموعة، محرك 1523 سطر |
| 9 | دمج كميات مشتقة ومحفوظة | ✅ مكتمل | مع كشف التعديلات اليدوية |
| 10 | حوار الدهانات التفصيلي | ✅ مكتمل | ربط باللياسة، طبقات، تغطية |
| 11 | حوار اللياسة التفصيلي | ✅ مكتمل | غرفة بغرفة، خصم فتحات، كميات مواد |
| 12 | حوار العزل الحراري | ✅ مكتمل | Lambda, R-value, SBC |
| 13 | حوار العزل المائي | ✅ مكتمل | طبقات، تداخل |
| 14 | تحديث تتابعي (Cascade) | ✅ مكتمل | تغيير المبنى يحدّث التشطيبات |
| 15 | نظام المواصفات والقوالب | ✅ مكتمل | قوالب نظام ومخصصة |
| 16 | تحديث مواصفات جماعي | ✅ مكتمل | Batch spec update |
| 17 | جدول كميات المواد (BOM) | ✅ مكتمل | بالبند ومجمّع |
| 18 | استخلاص المعرفة | ✅ مكتمل | تعلّم من تعديلات المستخدم |
| 19 | حساب التكاليف التلقائي | ✅ مكتمل | overhead + profit + contingency + VAT |
| 20 | عروض الأسعار (Quotations) | ✅ مكتمل | CRUD مع ترقيم تلقائي |
| 21 | ربط الفرص (Leads) | ✅ مكتمل | 1:1 مع الدراسة والعرض |
| 22 | لوحة معلومات التسعير | ✅ مكتمل | إحصائيات وإجراءات سريعة |
| 23 | الأعمال الكهروميكانيكية (MEP) | ⚠️ جزئي | إنشاء فقط — لا تحديث أو حذف فردي |
| 24 | العمالة (Labor) | ⚠️ جزئي | إنشاء وحذف — لا تحديث |
| 25 | تعديل نسب التسعير من واجهة التسعير | ⚠️ جزئي | الحقول readOnly في PricingEditor |
| 26 | تصدير PDF | ⚠️ جزئي | حقل `pdfUrl` موجود لكن المولّد غير واضح |
| 27 | دعم اللغة الإنجليزية | ❌ مفقود | ~200+ مفتاح ترجمة مفقود، نصوص hardcoded |
| 28 | ربط الإنشائي بإعدادات المبنى | ❌ مفقود | لا اشتقاق تلقائي |
| 29 | ربط MEP بإعدادات المبنى | ❌ مفقود | لا اشتقاق تلقائي |

---

## 15. ملخص النواقص والمشاكل (مرتب بالأولوية)

| # | المشكلة | الخطورة | القسم | الوصف |
|---|---------|---------|-------|-------|
| 1 | تناقض حساب الضريبة | **عالية** | التسعير | `CostStudyOverview` يحسب VAT بطريقة `totalCost * 0.15 / 1.15` بينما `PricingEditor` و `recalculateCostStudyTotals` يستخدمان `subtotal * 0.15` — قد يظهر مبلغ ضريبة مختلف |
| 2 | نسبة VAT مكتوبة في الكود | **عالية** | التسعير | 15% hardcoded في 3 أماكن — لا يوجد حقل في الـ Schema لتغييرها |
| 3 | عدم وجود تحديث/حذف MEP | **متوسطة** | MEP | لا يمكن تعديل أو حذف عنصر MEP فردي بعد إنشائه |
| 4 | عدم وجود تحديث/حذف Labor | **متوسطة** | العمالة | نفس المشكلة مع عناصر العمالة |
| 5 | ~200+ مفتاح ترجمة مفقود | **متوسطة** | الترجمة | فئات التشطيبات ومستويات الجودة غير مترجمة |
| 6 | ~215 نص عربي hardcoded | **متوسطة** | الترجمة | في finishing-categories, blocks, slabs, prices |
| 7 | تكرار 4 حوارات تشطيبات | **متوسطة** | جودة الكود | ~3,325 سطر يمكن تقليصها لـ ~1,500 |
| 8 | حقول التسعير readOnly | **متوسطة** | التسعير | لا يمكن تعديل overhead/profit/contingency من صفحة التسعير |
| 9 | Contingency غير معروض في Overview | **منخفضة** | التسعير | صفحة النظرة العامة لا تعرض الاحتياطي |
| 10 | Type assertions (`as any`) | **منخفضة** | جودة الكود | 6+ مواقع في Lead/Quotation forms |
| 11 | 14 ملف deprecated غير محذوف | **منخفضة** | جودة الكود | آمنة للحذف — لا imports |
| 12 | console.error في production | **منخفضة** | جودة الكود | 2 مواقع — يُفضل استخدام logging service |
| 13 | N+1 recalculation | **منخفضة** | أداء | كل عملية CRUD تعيد حساب المجاميع كاملة |
| 14 | فقدان دقة Decimal→Number | **منخفضة** | حسابات | تحويل Prisma Decimal لـ Number قد يفقد دقة |

---

## 16. توصيات التطوير (مرتبة بالأولوية)

| # | التوصية | الجهد المقدّر | التأثير | القسم |
|---|---------|-------------|---------|-------|
| 1 | **إصلاح تناقض حساب VAT** في CostStudyOverview ليطابق recalculateCostStudyTotals | صغير | **عالي** | التسعير |
| 2 | **نقل نسبة VAT لحقل في Schema** بدلاً من hardcoded 15% | صغير | **عالي** | قاعدة البيانات |
| 3 | **إضافة CRUD كامل لـ MEP** (update + delete فردي) | متوسط | **عالي** | MEP |
| 4 | **إضافة CRUD كامل لـ Labor** (update) | متوسط | **عالي** | العمالة |
| 5 | **تفعيل تعديل النسب** من صفحة التسعير (إزالة readOnly) | صغير | **عالي** | التسعير |
| 6 | **استخلاص BaseFinishingItemDialog** مشترك من الحوارات الأربعة | كبير | **متوسط** | جودة الكود |
| 7 | **ترحيل النصوص العربية** من finishing-categories/blocks/slabs لملفات الترجمة | كبير | **متوسط** | الترجمة |
| 8 | **حذف مجلد _deprecated** (14 ملف غير مستخدم) | صغير | **منخفض** | جودة الكود |
| 9 | **إصلاح type assertions** في Lead/Quotation forms | صغير | **منخفض** | جودة الكود |
| 10 | **استبدال console.error** بخدمة تسجيل مناسبة | صغير | **منخفض** | جودة الكود |
| 11 | **توحيد بنية RoomEntry** عبر الحوارات | صغير | **منخفض** | جودة الكود |
| 12 | **إضافة ربط الإنشائي بإعدادات المبنى** (اشتقاق تلقائي) | كبير | **متوسط** | إنشائي |
| 13 | **إضافة ربط MEP بإعدادات المبنى** (اشتقاق تلقائي) | كبير | **متوسط** | MEP |
| 14 | **تجميع إعادة الحساب** (batch recalculation بدل per-item) | متوسط | **منخفض** | أداء |

---

## ملاحظات ختامية

### نقاط القوة
1. **نظام تشطيبات ذكي متقدم** — محرك اشتقاق 1523 سطر مع 15 مجموعة و26 فئة
2. **تحديث تتابعي (Cascade)** يعمل فعلياً بين إعدادات المبنى والتشطيبات
3. **حسابات إنشائية دقيقة** مع حديد التسليح (أقطار، كانات، شبكات)
4. **نظام مواصفات مرن** مع قوالب قابلة لإعادة الاستخدام
5. **تغطية ترجمة جيدة** (~453 مفتاح) للمكونات الرئيسية
6. **لا TODO أو console.log debug** في الكود — نظيف نسبياً
7. **بنية API منظمة** مع ORPC وZod validation

### نقاط الضعف
1. **تكرار كود كبير** في حوارات التشطيبات (~3,325 سطر يمكن تقليصها)
2. **CRUD غير مكتمل** لـ MEP والعمالة
3. **200+ مفتاح ترجمة مفقود** وأكثر من 200 نص عربي hardcoded
4. **تناقض في حساب الضريبة** بين المكونات
5. **14 ملف مهمل** لم يُحذف بعد

---

> **نهاية التقرير**
