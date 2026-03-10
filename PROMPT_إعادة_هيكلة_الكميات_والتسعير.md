# برومبت تنفيذ إعادة هيكلة قسم دراسة الكميات والتسعير — مسار
## للاستخدام مع Claude Code — مقسّم إلى ٧ مراحل

---

# ⚠️ تعليمات عامة لكل المراحل

```
قبل البدء بأي مرحلة:
1. ابدأ بـ Plan Mode واقرأ كل الملفات المذكورة في القسم "اقرأ أولاً"
2. لا تعدّل أي ملف غير مذكور صراحة في "الملفات المطلوب تعديلها"
3. لا تمس أبداً الملفات في "القائمة الحمراء" أدناه
4. استخدم اللغة العربية في كل UI text ومفاتيح الترجمة
5. اتبع أنماط الكود الموجودة في المشروع (oRPC, Zod, React Query, shadcn/ui)
6. كل endpoint جديد يستخدم subscriptionProcedure مع verifyOrganizationAccess
7. أضف مفاتيح الترجمة في ar.json و en.json
8. بعد كل مرحلة فرعية، شغّل: pnpm type-check && pnpm lint
```

## القائمة الحمراء — لا تمس هذه الملفات أبداً:

```
packages/api/lib/structural-calculations.ts     (1,538 سطر)
packages/api/lib/mep-derivation-engine.ts        (2,493 سطر)
apps/web/modules/saas/pricing/components/structural/FoundationsSection.tsx  (863 سطر)
apps/web/modules/saas/pricing/components/structural/BlocksSection.tsx       (827 سطر)
apps/web/modules/saas/pricing/components/structural/SlabsSection.tsx        (1,289 سطر)
apps/web/modules/saas/pricing/components/structural/StairsSection.tsx       (666 سطر)
apps/web/modules/saas/pricing/components/finishing/PaintItemDialog.tsx      (1,256 سطر)
apps/web/modules/saas/pricing/components/finishing/PlasterItemDialog.tsx    (1,022 سطر)
apps/web/modules/saas/pricing/components/FloorDetailsStep.tsx              (687 سطر)
```

---

# المرحلة ١: البنية التحتية (Infrastructure)

## المرحلة ١.١: تعديل Prisma Schema

### اقرأ أولاً:
```
packages/database/prisma/schema.prisma    — ابحث عن model CostStudy وكل العلاقات المرتبطة
packages/database/prisma/schema.prisma    — ابحث عن enum الموجودة (StudySection, etc.)
```

### المطلوب:

**١.١.أ — إضافة Enums جديدة:**

أضف في schema.prisma بعد آخر enum:

```prisma
enum StudyType {
  FULL_PROJECT
  CUSTOM_ITEMS
  LUMP_SUM_ANALYSIS
}

enum StageStatus {
  NOT_STARTED
  DRAFT
  IN_REVIEW
  APPROVED
}

enum LaborCostType {
  PER_SQM
  PER_CBM
  PER_UNIT
  PER_LM
  LUMP_SUM
  SALARY
}
```

**١.١.ب — إضافة حقول على CostStudy الموجود:**

أضف هذه الحقول على model CostStudy **بدون حذف أو تعديل أي حقل موجود**:

```prisma
// أضف هذه الحقول في نهاية model CostStudy:

  // نوع الدراسة
  studyType            StudyType     @default(FULL_PROJECT)

  // حالة كل مرحلة
  quantitiesStatus     StageStatus   @default(DRAFT)
  specsStatus          StageStatus   @default(NOT_STARTED)
  costingStatus        StageStatus   @default(NOT_STARTED)
  pricingStatus        StageStatus   @default(NOT_STARTED)
  quotationStatus      StageStatus   @default(NOT_STARTED)

  // من يعمل على كل مرحلة (ربط بـ User)
  quantitiesAssigneeId String?
  specsAssigneeId      String?
  costingAssigneeId    String?
  pricingAssigneeId    String?

  // للمقطوعية
  contractValue        Decimal?      @db.Decimal(15, 2)

  // ربط بعرض سعر مالي وبمشروع
  generatedQuotationId String?
  convertedProjectId   String?

  // علاقات جديدة
  costingItems         CostingItem[]
  manualItems          ManualItem[]
  sectionMarkups       SectionMarkup[]
```

**١.١.ج — إنشاء Models جديدة:**

```prisma
model CostingItem {
  id               String          @id @default(cuid())
  costStudyId      String
  organizationId   String

  section          String          // STRUCTURAL, FINISHING, MEP, LABOR, MANUAL
  sourceItemId     String?         // ID من StructuralItem أو FinishingItem أو MEPItem أو ManualItem
  sourceItemType   String?         // نوع البند المصدر

  description      String
  unit             String
  quantity         Decimal         @db.Decimal(15, 4)

  // تسعير المواد
  materialUnitCost Decimal?        @db.Decimal(15, 2)
  materialTotal    Decimal?        @db.Decimal(15, 2)

  // تسعير المصنعيات
  laborType        LaborCostType?
  laborUnitCost    Decimal?        @db.Decimal(15, 2)
  laborQuantity    Decimal?        @db.Decimal(15, 4)
  laborWorkers     Int?            // عدد العمال (للراتب)
  laborSalary      Decimal?        @db.Decimal(15, 2) // الراتب الشهري
  laborMonths      Int?            // عدد الأشهر
  laborTotal       Decimal?        @db.Decimal(15, 2)

  // تشوين
  storageCostPercent Decimal?      @db.Decimal(5, 2)
  storageCostFixed   Decimal?      @db.Decimal(15, 2)
  storageTotal       Decimal?      @db.Decimal(15, 2)

  // مصاريف أخرى
  otherCosts       Decimal?        @db.Decimal(15, 2)

  // إجمالي
  totalCost        Decimal?        @db.Decimal(15, 2)

  sortOrder        Int             @default(0)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  costStudy        CostStudy       @relation(fields: [costStudyId], references: [id], onDelete: Cascade)
  organization     Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([costStudyId, section])
  @@index([organizationId])
}

model ManualItem {
  id               String          @id @default(cuid())
  costStudyId      String
  organizationId   String

  description      String
  unit             String
  quantity         Decimal         @db.Decimal(15, 4)
  section          String?         // تصنيف اختياري
  notes            String?

  sortOrder        Int             @default(0)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  costStudy        CostStudy       @relation(fields: [costStudyId], references: [id], onDelete: Cascade)
  organization     Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([costStudyId])
  @@index([organizationId])
}

model SectionMarkup {
  id               String          @id @default(cuid())
  costStudyId      String
  organizationId   String

  section          String          // STRUCTURAL, FINISHING, MEP, LABOR
  markupPercent    Decimal         @db.Decimal(5, 2)

  costStudy        CostStudy       @relation(fields: [costStudyId], references: [id], onDelete: Cascade)
  organization     Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([costStudyId, section])
  @@index([organizationId])
}
```

**١.١.د — أضف العلاقة العكسية في Organization:**

ابحث عن model Organization وأضف:
```prisma
  costingItems     CostingItem[]
  manualItems      ManualItem[]
  sectionMarkups   SectionMarkup[]
```

### التحقق:
```bash
pnpm --filter database db:push
pnpm --filter database generate
pnpm type-check
```

---

## المرحلة ١.٢: Migration للبيانات الموجودة

### اقرأ أولاً:
```
packages/database/prisma/seed.ts   — لفهم نمط الـ seed
```

### المطلوب:

أنشئ migration script في `packages/database/scripts/migrate-study-stages.ts`:

```typescript
// هذا السكريبت يُعيّن كل الدراسات الموجودة كـ:
// - studyType = FULL_PROJECT
// - كل المراحل = APPROVED (لأنها دراسات قديمة مكتملة)

import { prisma } from '../src/client';

async function main() {
  const result = await prisma.costStudy.updateMany({
    where: {
      studyType: null, // فقط الدراسات التي لم تُحدّث بعد
    },
    data: {
      studyType: 'FULL_PROJECT',
      quantitiesStatus: 'APPROVED',
      specsStatus: 'APPROVED',
      costingStatus: 'APPROVED',
      pricingStatus: 'APPROVED',
      quotationStatus: 'NOT_STARTED',
    },
  });
  console.log(`Updated ${result.count} existing studies`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

أضف في `package.json` الخاص بـ `packages/database`:
```json
"migrate:stages": "tsx scripts/migrate-study-stages.ts"
```

---

## المرحلة ١.٣: API Endpoints للمراحل

### اقرأ أولاً:
```
packages/api/modules/quantities/           — كل الملفات لفهم البنية
packages/api/modules/quantities/router.ts  — لفهم هيكل الـ router
packages/api/lib/procedures.ts             — لفهم subscriptionProcedure
packages/api/lib/permissions.ts            — لفهم verifyOrganizationAccess
```

### المطلوب:

أنشئ ملف `packages/api/modules/quantities/stages.ts`:

```typescript
// Endpoints:
// 1. studies.getStages(studyId) — جلب حالة كل المراحل
// 2. studies.approveStage(studyId, stage) — اعتماد مرحلة
//    - يتحقق أن المرحلة السابقة معتمدة
//    - يتحقق من الصلاحية (quantities.pricing للمرحلة ④)
//    - يُحدّث الحالة إلى APPROVED
//    - يُحدّث المرحلة التالية إلى DRAFT
// 3. studies.reopenStage(studyId, stage) — إعادة فتح مرحلة
//    - يتحقق أن المستخدم OWNER أو PM
//    - يُلغي اعتماد هذه المرحلة وكل المراحل اللاحقة
// 4. studies.assignStage(studyId, stage, userId) — تعيين مسؤول لمرحلة
```

**قواعد الاعتماد:**
```
- لا يمكن اعتماد مرحلة إذا المرحلة السابقة ليست APPROVED
- اعتماد مرحلة = تحويلها لـ APPROVED + تحويل التالية لـ DRAFT
- إعادة فتح مرحلة = تحويلها لـ DRAFT + تحويل كل اللاحقة لـ NOT_STARTED
- الترتيب: quantities → specs → costing → pricing → quotation
```

**Zod Schemas:**
```typescript
const stageEnum = z.enum(['quantities', 'specs', 'costing', 'pricing', 'quotation']);

const approveStageInput = z.object({
  organizationId: z.string(),
  studyId: z.string(),
  stage: stageEnum,
});
```

أضف الـ router الجديد في `packages/api/modules/quantities/router.ts`.

---

## المرحلة ١.٤: مكون PipelineBar

### اقرأ أولاً:
```
apps/web/modules/saas/pricing/components/   — لفهم بنية المكونات
apps/web/modules/ui/components/             — لفهم مكونات UI الأساسية
apps/web/messages/ar.json                   — لفهم بنية الترجمة
```

### المطلوب:

أنشئ `apps/web/modules/saas/pricing/components/pipeline/PipelineBar.tsx`:

```
المكون يعرض شريط أفقي بـ 5 مراحل:
① الكميات → ② المواصفات → ③ تسعير التكلفة → ④ التسعير → ⑤ عرض السعر

كل مرحلة تظهر بحالة:
- NOT_STARTED: رمادي + أيقونة ○
- DRAFT: أزرق + أيقونة 🔵
- IN_REVIEW: برتقالي + أيقونة ⏳
- APPROVED: أخضر + أيقونة ✅

المرحلة الحالية (الصفحة المفتوحة) لها border مميز.
كل مرحلة قابلة للنقر (link) تنقل للصفحة المقابلة.
بين كل مرحلتين سهم →

Props:
- studyId: string
- currentStage: 'quantities' | 'specifications' | 'costing' | 'selling-price' | 'quotation'
- stages: { quantities: StageStatus, specs: StageStatus, costing: StageStatus, pricing: StageStatus, quotation: StageStatus }
- studyType: StudyType (إذا كان LUMP_SUM_ANALYSIS، المرحلة ④ تظهر "تحليل الربحية" والمرحلة ⑤ لا تظهر)

استخدم:
- Tailwind CSS
- RTL layout
- shadcn/ui Badge و cn() للألوان
- lucide-react icons
- next-intl للترجمة
```

أنشئ أيضاً `apps/web/modules/saas/pricing/components/pipeline/StageApprovalButton.tsx`:

```
زر يظهر في أسفل كل صفحة مرحلة:
- إذا المرحلة DRAFT أو IN_REVIEW: يعرض "اعتماد [اسم المرحلة] والانتقال لـ [المرحلة التالية]"
- إذا المرحلة APPROVED: يعرض "✅ تم الاعتماد" (disabled) + زر صغير "إعادة فتح" (للمالك فقط)
- يستدعي studies.approveStage mutation
- بعد النجاح: invalidate + redirect للمرحلة التالية
```

### مفاتيح الترجمة (أضفها في ar.json و en.json):
```json
{
  "pricing.pipeline.quantities": "الكميات",
  "pricing.pipeline.specifications": "المواصفات",
  "pricing.pipeline.costing": "تسعير التكلفة",
  "pricing.pipeline.sellingPrice": "التسعير",
  "pricing.pipeline.quotation": "عرض السعر",
  "pricing.pipeline.profitability": "تحليل الربحية",
  "pricing.pipeline.approve": "اعتماد {stage} والانتقال لـ {next}",
  "pricing.pipeline.approved": "تم الاعتماد",
  "pricing.pipeline.reopen": "إعادة فتح",
  "pricing.pipeline.notStarted": "لم تبدأ",
  "pricing.pipeline.draft": "مسودة",
  "pricing.pipeline.inReview": "قيد المراجعة"
}
```

---

# المرحلة ٢: مرحلة الكميات (Quantities Stage)

## المرحلة ٢.١: صفحة wrapper للكميات

### اقرأ أولاً:
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[id]/structural/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[id]/finishing/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[id]/mep/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[id]/layout.tsx
```

### المطلوب:

أنشئ صفحة جديدة:
`apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[id]/quantities/page.tsx`

```
هذه الصفحة:
1. تعرض PipelineBar في الأعلى (currentStage = 'quantities')
2. تحتها tabs: [إنشائي] [تشطيبات] [كهروميكانيكية] [إدخال يدوي]
3. كل tab يعرض المكون الموجود من الصفحة الأصلية (embedded)
4. في الأسفل: QuantitiesSummary + StageApprovalButton

لا تنسخ الشاشات الموجودة — استخدمها كمكونات:
- tab إنشائي → يعرض نفس مكون صفحة structural
- tab تشطيبات → يعرض نفس مكون صفحة finishing
- tab كهروميكانيكية → يعرض نفس مكون صفحة mep
- tab إدخال يدوي → مكون جديد ManualItemsTable
```

أنشئ أيضاً:
`apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[id]/quantities/layout.tsx`

---

## المرحلة ٢.٢: إضافة prop showPricing لمكون MEP

### اقرأ أولاً:
```
apps/web/modules/saas/pricing/components/mep/     — كل المكونات
```

### المطلوب:

ابحث عن المكون الذي يعرض جدول بنود MEP (الذي يحتوي عمود "سعر الوحدة" و "الإجمالي").

أضف prop اختياري `showPricing?: boolean` (default = true للتوافق مع الموجود).

عندما `showPricing={false}`:
- أخفِ عمود "سعر الوحدة"
- أخفِ عمود "الإجمالي"  
- أخفِ عمود "المعادلة"
- أبقِ: البند + الكمية + الوحدة + أيقونة التعديل

**لا تغير السلوك الافتراضي** — أضف الشرط فقط.

---

## المرحلة ٢.٣: API وواجهة البنود اليدوية

### اقرأ أولاً:
```
packages/api/modules/quantities/     — لفهم بنية endpoints الكميات
```

### المطلوب:

**API — أنشئ `packages/api/modules/quantities/manual-items.ts`:**

```
Endpoints:
1. manualItems.list(organizationId, studyId) 
   → جلب كل ManualItem للدراسة مرتبة بـ sortOrder
   
2. manualItems.create(organizationId, studyId, { description, unit, quantity, section?, notes? })
   → إنشاء بند يدوي جديد
   → يتحقق أن quantitiesStatus ليس APPROVED
   
3. manualItems.update(organizationId, itemId, { description?, unit?, quantity?, section?, notes? })
   → تحديث بند يدوي
   
4. manualItems.delete(organizationId, itemId)
   → حذف بند يدوي
   
5. manualItems.reorder(organizationId, studyId, itemIds[])
   → إعادة ترتيب البنود
```

**واجهة — أنشئ `ManualItemsTable.tsx`:**

```
جدول بسيط يعرض البنود اليدوية:
- أعمدة: # | الوصف | الوحدة | الكمية | القسم | ملاحظات | إجراءات
- زر "+ إضافة بند" يفتح صف جديد inline
- تعديل inline (click to edit)
- حذف مع تأكيد
- drag-and-drop لإعادة الترتيب (اختياري — يمكن تأجيله)

الوحدات المتاحة (dropdown):
م², م³, م.ط, كجم, طن, حبة, نقطة, مجموعة, شهر, يوم, مقطوع

الأقسام المتاحة (dropdown اختياري):
إنشائي, تشطيبات, كهروميكانيكية, عمالة, أخرى
```

---

## المرحلة ٢.٤: مكون QuantitiesSummary

### المطلوب:

أنشئ `apps/web/modules/saas/pricing/components/pipeline/QuantitiesSummary.tsx`:

```
بطاقة ملخص تظهر في أسفل صفحة الكميات:
┌──────────────────────────────────────────────────┐
│ ملخص الكميات                                      │
│ إنشائي: X بند  │ تشطيبات: Y بند  │ MEP: Z بند   │
│ يدوي: W بند    │ المجموع: N بند                   │
└──────────────────────────────────────────────────┘

يجلب الأعداد من:
- StructuralItem.count(studyId)
- FinishingItem.count(studyId)
- MEPItem.count(studyId)
- ManualItem.count(studyId)

أنشئ endpoint: quantities.getSummary(studyId) يرجع الأعداد.
```

---

# المرحلة ٣: مرحلة المواصفات (Specifications Stage)

## المرحلة ٣.١: صفحة المواصفات

### اقرأ أولاً:
```
apps/web/modules/saas/pricing/components/SpecBulkEditor.tsx    — المكون الأهم
apps/web/modules/saas/pricing/components/finishing/            — لفهم كيف يُستدعى SpecBulkEditor
```

### المطلوب:

أنشئ صفحة:
`apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[id]/specifications/page.tsx`

```
هذه الصفحة:
1. PipelineBar (currentStage = 'specifications')
2. tabs: [إنشائي] [تشطيبات] [كهروميكانيكية]

Tab إنشائي — مكون جديد StructuralSpecs.tsx:
  جدول بسيط (5-8 صفوف) لتحديد:
  - درجة الخرسانة: dropdown [C25/30, C30/37, C35/45]
  - نوع الحديد: dropdown [Grade 40, Grade 60]
  - نوع البلوك الخارجي: dropdown [20سم عادي, 20سم عازل, 15سم]
  - نوع البلوك الداخلي: dropdown [15سم عادي, 10سم عادي]
  - نوع العزل المائي: dropdown حسب القوالب الموجودة
  - نوع العزل الحراري: dropdown حسب القوالب الموجودة
  
  يُحفظ في CostStudy.structuralSpecs (JSON field جديد — أضفه في schema)

Tab تشطيبات:
  نفس مكون SpecBulkEditor الموجود لكن:
  - يُعرض كصفحة كاملة (ليس dialog)
  - مع أزرار إضافية: [تطبيق نموذج] [حفظ كنموذج] [تخصيص غرفة] [تخصيص دور]
  - "تخصيص غرفة": يفتح نفس SpecBulkEditor مفلتر بغرفة واحدة
  - "تخصيص دور": يفتح نفس SpecBulkEditor مفلتر بدور واحد

Tab كهروميكانيكية:
  مشابه للتشطيبات — لكن مواصفات MEP أبسط (نوع النظام فقط)

3. قسم "المواد المجمّعة" (Bill of Materials):
   ابحث عن المكون الذي يعرض "قائمة المواد" في صفحة التشطيبات الحالية
   واستخدمه هنا كقسم في أسفل الصفحة

4. StageApprovalButton في الأسفل
```

---

## المرحلة ٣.٢: حفظ مواصفات الإنشائي

### المطلوب:

أضف حقل في CostStudy:
```prisma
  structuralSpecs    Json?    // { concreteGrade, steelGrade, externalBlockType, internalBlockType, waterproofType, thermalInsulationType }
```

أنشئ endpoint:
```
quantities.setStructuralSpecs(organizationId, studyId, specs)
quantities.getStructuralSpecs(organizationId, studyId)
```

---

# المرحلة ٤: تسعير التكلفة (Costing Stage)

## المرحلة ٤.١: API تسعير التكلفة

### اقرأ أولاً:
```
packages/api/modules/quantities/   — كل الملفات
packages/database/prisma/schema.prisma — model CostingItem
```

### المطلوب:

أنشئ `packages/api/modules/quantities/costing.ts`:

```
Endpoints:

1. costing.generateItems(organizationId, studyId)
   → يُنشئ CostingItem لكل بند في الدراسة:
     - من StructuralItem → section: 'STRUCTURAL'
     - من FinishingItem (المواد المجمّعة) → section: 'FINISHING'
     - من MEPItem → section: 'MEP'
     - من LaborItem → section: 'LABOR'
     - من ManualItem → section: 'MANUAL'
   → يُنسخ description, unit, quantity من البند الأصلي
   → materialUnitCost, laborType, etc. تكون null (ينتظر الإدخال)
   → لا يُعيد التوليد إذا كانت البنود موجودة (idempotent)

2. costing.getItems(organizationId, studyId, { section? })
   → جلب كل CostingItem مع فلترة اختيارية بالقسم

3. costing.updateItem(organizationId, itemId, data)
   → data يمكن أن يحتوي:
     materialUnitCost, laborType, laborUnitCost, laborQuantity,
     laborWorkers, laborSalary, laborMonths,
     storageCostPercent, storageCostFixed, otherCosts
   → يحسب تلقائياً:
     materialTotal = materialUnitCost × quantity
     laborTotal = حسب laborType:
       PER_SQM/PER_CBM/PER_UNIT/PER_LM: laborUnitCost × laborQuantity
       LUMP_SUM: laborUnitCost (المبلغ المقطوع)
       SALARY: laborWorkers × laborSalary × laborMonths
     storageTotal = (materialTotal + laborTotal) × storageCostPercent/100 + storageCostFixed
     totalCost = materialTotal + laborTotal + storageTotal + otherCosts

4. costing.bulkUpdatePrices(organizationId, studyId, items[])
   → تحديث أسعار عدة بنود دفعة واحدة

5. costing.setSectionLabor(organizationId, studyId, { section, laborType, laborUnitCost, ... })
   → تطبيق مصنعية واحدة على كل بنود قسم
   → مثال: "مصنعية الأرضيات كلها 35 ريال/م²"

6. costing.getSummary(organizationId, studyId)
   → ملخص:
     {
       sections: [
         { section: 'STRUCTURAL', materialTotal, laborTotal, storageTotal, total, itemCount },
         { section: 'FINISHING', ... },
         { section: 'MEP', ... },
         { section: 'LABOR', ... },
         { section: 'MANUAL', ... },
       ],
       grandTotal: { material, labor, storage, other, total },
       overheadPercent, overheadAmount, costWithOverhead
     }
```

---

## المرحلة ٤.٢: واجهة تسعير التكلفة

### المطلوب:

أنشئ صفحة:
`apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[id]/costing/page.tsx`

وأنشئ المكونات:

**CostingTable.tsx:**
```
جدول يعرض CostingItems مجمّعة بحسب القسم:
- أعمدة: البند | الكمية | الوحدة | سعر المادة | إجمالي المادة | المصنعية | إجمالي المصنعية | التشوين | الإجمالي
- كل خلية سعر قابلة للتعديل inline (click to edit)
- عند تغيير سعر → يحسب الإجماليات تلقائياً → يستدعي updateItem
- يعرض subtotal لكل قسم
```

**LaborCostInput.tsx:**
```
مكون لإدخال تكلفة المصنعية:
- dropdown لاختيار النوع: بالمتر المربع | بالمتر المكعب | بالوحدة | بالمتر الطولي | مقطوعية | بالراتب
- حسب النوع المختار:
  PER_SQM/PER_CBM/PER_UNIT/PER_LM: حقل سعر + حقل كمية (auto-filled من البند) → المجموع
  LUMP_SUM: حقل مبلغ واحد → يشمل: [مواد ☐] [مصنعيات ☑️]
  SALARY: حقل عدد العمال + الراتب + المدة بالأشهر → المجموع
```

**CostingSummary.tsx:**
```
ملخص التكاليف في أسفل الصفحة:
جدول: القسم | المواد | المصنعيات | التشوين | المجموع
مع صف إجمالي + حقل "مصاريف عامة %" + إجمالي التكلفة النهائي
```

---

# المرحلة ٥: التسعير — سعر البيع (Selling Price Stage)

## المرحلة ٥.١: تطوير شاشة التسعير الموجودة

### اقرأ أولاً:
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[id]/pricing/page.tsx
apps/web/modules/saas/pricing/components/     — المكونات المرتبطة بالتسعير
```

### المطلوب:

**أنشئ صفحة جديدة** (لا تعدّل الموجودة):
`apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[id]/selling-price/page.tsx`

```
هذه الصفحة تحتوي:

1. PipelineBar (currentStage = 'selling-price')

2. "طريقة الحساب" — radio buttons:
   ○ نسبة موحّدة (الموجود حالياً — مصاريف إدارية% + ربح% + طوارئ%)
   ○ نسبة لكل قسم (جديد — SectionMarkupForm)
   ○ يدوي (مستقبلي — يمكن تركه disabled)

3. عند اختيار "نسبة موحّدة":
   نفس الحقول الموجودة: مصاريف إدارية% + ربح% + طوارئ% + ض.ق.م
   
4. عند اختيار "نسبة لكل قسم" — SectionMarkupForm.tsx:
   جدول: القسم | التكلفة | الهامش% | المجموع
   4 صفوف: إنشائي, تشطيبات, MEP, عمالة
   + صف مصاريف عامة (ثابت من المرحلة ③)
   + صف ض.ق.م 15%
   + صف إجمالي

5. ProfitAnalysis.tsx — يظهر دائماً:
   - التكلفة الإجمالية (من المرحلة ③)
   - سعر البيع (محسوب)
   - الربح المتوقع (مبلغ + نسبة)
   - سعر المتر المربع
   - شريط بياني: التكلفة vs الربح

6. للمقطوعية (studyType === LUMP_SUM_ANALYSIS) — LumpSumAnalysis.tsx:
   - يعرض قيمة العقد (مُدخلة مسبقاً)
   - التكلفة المتوقعة
   - الربح/الخسارة
   - هامش الأمان
   - لا يظهر حقول هامش — لأن سعر البيع محدد مسبقاً

7. StageApprovalButton
```

---

## المرحلة ٥.٢: API هامش الربح

### المطلوب:

أنشئ `packages/api/modules/quantities/markup.ts`:

```
Endpoints:

1. markup.getSettings(organizationId, studyId)
   → يرجع: { method: 'uniform'|'per_section', uniformSettings: {...}, sectionMarkups: [...] }

2. markup.setUniform(organizationId, studyId, { overheadPct, profitPct, contingencyPct, vatIncluded })
   → يُحدّث الحقول الموجودة في CostStudy (overhead%, profit%, vat%)

3. markup.setSectionMarkups(organizationId, studyId, markups[])
   → يُنشئ/يُحدّث SectionMarkup لكل قسم

4. markup.getProfitAnalysis(organizationId, studyId)
   → يرجع:
     {
       totalCost, overheadAmount, sellingPrice, vatAmount, grandTotal,
       profit, profitPercent, pricePerSqm,
       // للمقطوعية:
       contractValue, expectedProfit, profitFromContract, safetyMargin
     }
```

---

# المرحلة ٦: عرض السعر (Quotation Stage)

## المرحلة ٦.١: API عرض السعر

### اقرأ أولاً:
```
packages/api/modules/quantities/     — الـ Quote model والـ endpoints الموجودة
packages/api/modules/finance/        — quotations و clients
```

### المطلوب:

أنشئ `packages/api/modules/quantities/quotation-builder.ts`:

```
Endpoints:

1. quotationBuilder.getPreview(organizationId, studyId, { style, columns?, sections? })
   → style: 'detailed' | 'per_sqm' | 'lump_sum' | 'custom'
   → يرجع:
     {
       items: [...],  // البنود المفلترة حسب sections
       columns: [...], // الأعمدة المفلترة حسب style
       totals: { subtotal, vat, grandTotal, pricePerSqm },
       studyInfo: { name, location, area, floors }
     }

2. quotationBuilder.convertToQuotation(organizationId, studyId, { clientId, validDays, notes, style, columns?, sections? })
   → يُنشئ Quotation + QuotationItems في قسم المالية
   → يُربط بالدراسة (generatedQuotationId)
   → يرجع quotationId

3. quotationBuilder.convertToProject(organizationId, studyId, { name?, startDate?, endDate? })
   → يُنشئ Project جديد
   → يُنشئ ProjectContract بقيمة سعر البيع
   → يُربط بالدراسة (convertedProjectId)
   → يرجع projectId
```

---

## المرحلة ٦.٢: واجهة عرض السعر

### المطلوب:

أنشئ صفحة:
`apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[id]/quotation/page.tsx`

وأنشئ المكونات:

**QuotationStyleSelector.tsx:**
```
4 بطاقات لاختيار النمط:
- تفصيلي: كل بند بسعره
- بالمتر المربع: سعر واحد لكل م²
- مقطوعية: مبلغ إجمالي
- مخصص: اختيار الأعمدة والبنود
```

**QuotationColumnPicker.tsx:**
```
checkboxes لاختيار أعمدة الجدول:
☑️ # ☑️ البند ☑️ الكمية ☑️ الوحدة ☑️ المواصفة ☑️ سعر الوحدة ☑️ الإجمالي

checkboxes لاختيار الأقسام:
☑️ إنشائي ☑️ تشطيبات ☑️ كهروميكانيكية ☑️ عمالة ☑️ يدوي
```

**QuotationPreview.tsx:**
```
معاينة المستند:
- شعار الشركة + بيانات الشركة (من OrganizationFinanceSettings)
- بيانات العميل (إذا اختير)
- جدول البنود حسب النمط المختار
- الإجماليات + ض.ق.م
- الشروط والأحكام (حقل نص)

أزرار:
- تصدير PDF → يستدعي export API
- إرسال للعميل → (مستقبلي)
- تحويل لعرض سعر مالي → يستدعي convertToQuotation
- تحويل لمشروع → يستدعي convertToProject
```

---

# المرحلة ٧: صلاحيات + تكامل + تنقيح

## المرحلة ٧.١: تحديث نظام الصلاحيات

### اقرأ أولاً:
```
packages/api/lib/permissions.ts
packages/api/lib/default-roles.ts      — أو الملف الذي يحتوي صلاحيات الأدوار الافتراضية
```

### المطلوب:

أضف صلاحيات جديدة تحت قسم `quantities`:

```typescript
// الصلاحيات الجديدة:
'quantities.editQuantities'       // تعديل الكميات (مراحلة ①)
'quantities.approveQuantities'    // اعتماد الكميات
'quantities.editSpecs'            // تعديل المواصفات (مرحلة ②)
'quantities.approveSpecs'         // اعتماد المواصفات
'quantities.editCosting'          // تعديل تسعير التكلفة (مرحلة ③)
'quantities.approveCosting'       // اعتماد التسعير
'quantities.editSellingPrice'     // تحديد سعر البيع (مرحلة ④)
'quantities.generateQuotation'    // توليد عرض سعر (مرحلة ⑤)
'quantities.convertToProject'     // تحويل لمشروع

// التوزيع على الأدوار:
OWNER:      كل الصلاحيات
PM:         editQuantities, approveQuantities, editSpecs, approveSpecs, approveCosting, generateQuotation
ACCOUNTANT: editCosting
ENGINEER:   editQuantities, editSpecs
SUPERVISOR: (قراءة فقط — لا صلاحيات كتابة)
```

---

## المرحلة ٧.٢: تحديث التنقل (Sidebar)

### اقرأ أولاً:
```
apps/web/modules/saas/shared/components/sidebar/use-sidebar-menu.ts
```

### المطلوب:

عدّل القائمة الجانبية تحت "التسعير" لتصبح:

```
التسعير
├── الرئيسية
├── دراسات الكميات        ← (موجود)
├── عروض الأسعار           ← (موجود)
```

عند فتح دراسة معينة، تظهر القائمة الفرعية:
```
دراسة: فيلا الرياض
├── نظرة عامة              ← Dashboard الموجود
├── ① الكميات             ← /quantities
├── ② المواصفات           ← /specifications
├── ③ تسعير التكلفة       ← /costing
├── ④ التسعير             ← /selling-price
└── ⑤ عرض السعر           ← /quotation
```

---

## المرحلة ٧.٣: تحديث Dashboard الدراسة

### اقرأ أولاً:
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[id]/page.tsx
apps/web/modules/saas/pricing/components/QuantitiesDashboard.tsx
```

### المطلوب:

عدّل Dashboard الدراسة الموجود ليضيف:

1. **PipelineBar** في أعلى الصفحة
2. **بطاقة نوع الدراسة** إذا كانت مقطوعية (تعرض قيمة العقد)
3. كل بطاقة قسم (إنشائي, تشطيبات, MEP, التسعير) تعرض حالة المرحلة المقابلة
4. الباقي يبقى كما هو بالضبط

---

## المرحلة ٧.٤: تحديث معالج إنشاء الدراسة

### اقرأ أولاً:
```
apps/web/modules/saas/pricing/components/   — ابحث عن مكون إنشاء الدراسة (CreateStudy أو StudyForm)
```

### المطلوب:

أضف في معالج إنشاء الدراسة:

**خطوة جديدة "نوع الدراسة":**
```
○ مشروع شامل (FULL_PROJECT) — الافتراضي
○ بنود مخصصة (CUSTOM_ITEMS) — "صيانة / ترميم / بنود محددة"
○ تحليل مقطوعية (LUMP_SUM_ANALYSIS) — "لدي عقد بقيمة معروفة"
```

**للمقطوعية: حقل "قيمة العقد"** (يظهر فقط عند اختيار LUMP_SUM_ANALYSIS)

**خطوة "نقطة البداية":**
```
○ من الصفر — سأحسب الكميات (→ يفتح مرحلة ①)
○ عندي كميات جاهزة (→ يفتح مرحلة ① tab إدخال يدوي)
○ عندي كميات ومواصفات (→ يعتمد ①② ويفتح ③)
○ عندي كل شيء (→ يعتمد ①②③④ ويفتح ⑤)
```

---

## المرحلة ٧.٥: تحديث Redirects

### المطلوب:

في `next.config.ts` أو في layout الدراسة:

```
/pricing/studies/[id]/structural → /pricing/studies/[id]/quantities?tab=structural
/pricing/studies/[id]/finishing  → /pricing/studies/[id]/quantities?tab=finishing
/pricing/studies/[id]/mep       → /pricing/studies/[id]/quantities?tab=mep
/pricing/studies/[id]/pricing   → /pricing/studies/[id]/selling-price
```

هذه redirects تضمن أن الروابط القديمة تعمل.

---

# ملاحظات ختامية

```
بعد إكمال كل المراحل:

1. شغّل: pnpm type-check && pnpm lint && pnpm build
2. اختبر يدوياً:
   - إنشاء دراسة جديدة (كل الأنواع الثلاثة)
   - المرور بالمراحل الخمسة بالترتيب
   - اعتماد كل مرحلة
   - إعادة فتح مرحلة معتمدة
   - توليد عرض سعر بكل الأنماط
   - تحويل لمشروع
3. تأكد أن الدراسات القديمة تعمل بدون مشاكل
4. تأكد أن كل الصفحات القديمة (structural, finishing, mep, pricing) لا تزال تعمل
```
