# برومبت المرحلة الثالثة — عروض الأسعار المتقدمة (مسار)

> **متطلب أساسي:** المرحلة الأولى (StudyStage، 6 مراحل، نقاط الدخول) والمرحلة الثانية (MaterialBOM، CostingLabor، صفحات المواصفات وتسعير التكلفة والتسعير) يجب أن تكونا مكتملتين.

أنت تعمل على مشروع مسار — نظام إدارة مشاريع مقاولات. المشروع مبني بـ Next.js App Router + ORPC + Prisma + PostgreSQL + TypeScript + Tailwind CSS + shadcn/ui.

---

## السياق

### ما تم إنجازه

**المرحلة الأولى:** أنشأنا جدول `StudyStage` بـ 6 مراحل (QUANTITIES → SPECIFICATIONS → COSTING → PRICING → QUOTATION → CONVERSION)، شريط مراحل جديد، 6 نقاط دخول عند إنشاء دراسة.

**المرحلة الثانية:** أنشأنا جدول `MaterialBOM` (المواد المُجمّعة)، جدول `CostingLabor` (العمالة بـ 5 طرق حساب)، صفحة المواصفات المستقلة مع محرك BOM، صفحة تسعير التكلفة الجديدة، صفحة التسعير/هامش الربح المنفصلة.

### ما نبنيه الآن

**المرحلة الثالثة: عروض الأسعار المتقدمة** — ربط مرحلة عرض السعر (⑤) من الدراسة بقسم `pricing/quotations` الحالي، مع إضافة 4 صيغ عرض وتخصيص الأعمدة والصفوف.

### النظام الحالي لعروض الأسعار

**هام جداً — المشروع لديه نظامان لعروض الأسعار يجب فهمهما:**

**النظام الأول: `Quote` (مرتبط بالدراسة مباشرة)**
- Model: `Quote` في schema.prisma
- مرتبط بـ `CostStudy` عبر `costStudyId`
- يحتوي: quoteNumber, quoteType, clientName, subtotal, overheadAmount, profitAmount, vatAmount, totalAmount, validUntil
- خيارات عرض: showUnitPrices, showQuantities, showItemDescriptions, selectedCategories
- له pdfUrl
- الإجراءات: في `packages/api/modules/quantities/procedures/quote-create.ts` وملفات مشابهة

**النظام الثاني: `Quotation` (النظام المالي الرسمي)**
- Model: `Quotation` في schema.prisma
- مرتبط بـ `Client` و `Lead` (اختياري)
- يحتوي: quotationNo (تسلسلي)، بيانات عميل كاملة، status (DRAFT→SENT→VIEWED→ACCEPTED→REJECTED→EXPIRED→CONVERTED)
- بنود: `QuotationItem[]` (description, quantity, unit, unitPrice, totalPrice, sortOrder)
- شروط: paymentTerms, deliveryTerms, warrantyTerms
- تتبع: viewedAt, sentAt, acceptedAt, rejectedAt
- تحويل لفاتورة: convertToInvoice
- يستخدم قوالب `FinanceTemplate` للتصدير
- الإجراءات: في `packages/api/modules/finance/procedures/` (8 endpoints)

**صفحات pricing/quotations الحالية:**
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/
  quotations/
    page.tsx                    → قائمة عروض الأسعار (QuotationsList)
    new/page.tsx                → إنشاء عرض سعر (QuotationForm — 1,207 سطر!)
    [quotationId]/
      page.tsx                  → تفاصيل عرض السعر
      preview/page.tsx          → معاينة عرض السعر (QuotationPreview)
```

**مكونات pricing/quotations الحالية:**
```
apps/web/modules/saas/pricing/components/quotations/
  QuotationForm.tsx             → 1,207 سطر — نموذج إنشاء/تعديل العرض
  QuotationPreview.tsx          → معاينة العرض
  QuotationsHeaderActions.tsx   → أزرار رأس الصفحة
  QuotationsList.tsx            → جدول قائمة العروض
```

**الهدف: نبني فوق النظام الحالي ونوسّعه — لا نستبدله.**

---

## الملفات التي يجب قراءتها أولاً

**قبل أي تعديل، اقرأ هذه الملفات بالترتيب:**

1. `packages/database/prisma/schema.prisma` — ابحث عن:
   - model `Quote` (مرتبط بـ CostStudy)
   - model `Quotation` + `QuotationItem` (النظام المالي)
   - model `CostStudy` (الحقول الجديدة من المراحل 1+2)
   - model `MaterialBOM` (من المرحلة 2)
   - model `StudyStage` (من المرحلة 1)
   - enum `QuotationStatus`
   - model `FinanceTemplate`
   - model `Client`

2. `apps/web/modules/saas/pricing/components/quotations/QuotationForm.tsx` — **اقرأه بالكامل** لفهم البنية الحالية
3. `apps/web/modules/saas/pricing/components/quotations/QuotationPreview.tsx`
4. `apps/web/modules/saas/pricing/components/quotations/QuotationsList.tsx`
5. `apps/web/modules/saas/pricing/components/quotations/QuotationsHeaderActions.tsx`

6. `packages/api/modules/finance/procedures/` — اقرأ ملفات عروض الأسعار:
   - `create-quotation.ts` (أو الاسم المشابه)
   - `list-quotations.ts` (أو الاسم المشابه)

7. `packages/api/modules/quantities/procedures/quote-create.ts` — إنشاء Quote من دراسة
8. `packages/api/modules/quantities/procedures/get-quotes.ts`

9. `packages/api/modules/pricing/router.ts` — افهم كيف يتم ربط quotations في الـ router

10. `apps/web/modules/saas/pricing/lib/pricing-calculations.ts` — معادلات التسعير

---

## المهام المطلوبة (5 مهام)

---

### المهمة 1: توسيع قاعدة البيانات لدعم صيغ العرض

**الملف:** `packages/database/prisma/schema.prisma`

**أ) أضف enum `QuotationFormat`:**
```prisma
enum QuotationFormat {
  DETAILED_BOQ      // تفصيلي — كميات + مواصفات + سعر لكل بند
  PER_SQM           // بالمتر المربع — مواصفات + سعر/م²
  LUMP_SUM          // مقطوعية — مواصفات + مبلغ إجمالي فقط
  CUSTOM            // مخصص — يختار المستخدم ما يظهر
}
```

**ب) أضف enum `QuotationGrouping`:**
```prisma
enum QuotationGrouping {
  BY_SECTION        // بحسب القسم (إنشائي، تشطيبات، MEP)
  BY_FLOOR          // بحسب الدور
  BY_ITEM           // بحسب نوع البند
  FLAT              // بدون تجميع
}
```

**ج) أضف model `QuotationDisplayConfig`:**
```prisma
model QuotationDisplayConfig {
  id                String              @id @default(cuid())
  quotationId       String?             @unique
  quotation         Quotation?          @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  quoteId           String?             @unique
  quote             Quote?              @relation(fields: [quoteId], references: [id], onDelete: Cascade)

  // الصيغة
  format            QuotationFormat     @default(DETAILED_BOQ)
  grouping          QuotationGrouping   @default(BY_SECTION)

  // الأعمدة المعروضة
  showItemNumber    Boolean             @default(true)
  showDescription   Boolean             @default(true)
  showSpecifications Boolean            @default(true)
  showQuantity      Boolean             @default(true)
  showUnit          Boolean             @default(true)
  showUnitPrice     Boolean             @default(true)
  showItemTotal     Boolean             @default(true)

  // الأقسام المعروضة
  showStructural    Boolean             @default(true)
  showFinishing     Boolean             @default(true)
  showMEP           Boolean             @default(true)
  showManualItems   Boolean             @default(true)
  showMaterialDetails Boolean           @default(false)

  // المجاميع
  showSectionSubtotal Boolean           @default(true)
  showSubtotal      Boolean             @default(true)
  showDiscount      Boolean             @default(true)
  showVAT           Boolean             @default(true)
  showGrandTotal    Boolean             @default(true)
  showPricePerSqm   Boolean            @default(false)

  // بيانات إضافية لصيغة المتر المربع
  totalArea         Decimal?            @db.Decimal(15, 2)
  pricePerSqm       Decimal?            @db.Decimal(15, 2)

  // بيانات إضافية لصيغة المقطوعية
  lumpSumAmount     Decimal?            @db.Decimal(15, 2)
  lumpSumDescription String?

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@map("quotation_display_configs")
}
```

**د) أضف العلاقة في model Quotation:**
```prisma
// في model Quotation أضف:
  displayConfig     QuotationDisplayConfig?

  // ربط بالدراسة (جديد — لسحب البيانات)
  costStudyId       String?
  costStudy         CostStudy?          @relation(fields: [costStudyId], references: [id])
```

**هـ) أضف العلاقة في model Quote:**
```prisma
// في model Quote أضف:
  displayConfig     QuotationDisplayConfig?
```

**و) أضف العلاقة في model CostStudy:**
```prisma
// في model CostStudy أضف (إذا لم تكن موجودة):
  quotations        Quotation[]
```

**ز) أنشئ Migration:**
```bash
cd packages/database
npx prisma migrate dev --name add-quotation-display-config
```

---

### المهمة 2: بناء صفحة اختيار صيغة عرض السعر (من داخل الدراسة)

هذه هي مرحلة ⑤ في الدراسة. عندما يصل المستخدم لهذه المرحلة (بعد اعتماد التسعير)، يظهر له خيار إنشاء عرض سعر.

**أنشئ المجلد:** `apps/web/modules/saas/pricing/components/quotation-builder/`

#### ② `QuotationFormatSelector.tsx` — اختيار الصيغة

```
┌──────────────────────────────────────────────────────────────┐
│ كيف تريد عرض السعر للعميل؟                                   │
│                                                              │
│ ┌────────────────────┐  ┌────────────────────┐               │
│ │   ┌──┬──┬──┬──┐    │  │  ┌──────────────┐  │               │
│ │   │# │وصف│كم│سعر│   │  │  │المساحة: 300م²│ │               │
│ │   ├──┼──┼──┼──┤    │  │  │السعر: ___/م² │  │               │
│ │   │1 │..│..│..│    │  │  │الإجمالي: ___ │  │               │
│ │   └──┴──┴──┴──┘    │  │  └──────────────┘  │               │
│ │ 📊 تفصيلي (BOQ)    │  │ 📐 بالمتر المربع   │               │
│ │ كل بند بالتفصيل   │  │ سعر إجمالي للمتر   │               │
│ └────────────────────┘  └────────────────────┘               │
│                                                              │
│ ┌────────────────────┐  ┌────────────────────┐               │
│ │  ┌──────────────┐  │  │ ☑ كمية  ☐ سعر     │               │
│ │  │ مبلغ وقدره:  │  │  │ ☑ وصف   ☑ مواصفات │               │
│ │  │ 1,200,000 ر  │  │  │ ☐ وحدة  ☑ إجمالي  │               │
│ │  └──────────────┘  │  │                    │               │
│ │ 💰 مقطوعية         │  │ ✏️ مخصص             │               │
│ │ مبلغ إجمالي فقط   │  │ تحكم كامل بالعرض   │               │
│ └────────────────────┘  └────────────────────┘               │
└──────────────────────────────────────────────────────────────┘
```

**السلوك:**
- 4 بطاقات (Cards) قابلة للاختيار (radio-group style)
- البطاقة المختارة: `border-primary bg-primary/5`
- كل بطاقة تحتوي رسم بسيط يوضح الصيغة + عنوان + وصف قصير
- الاختيار يُخزّن في state محلي حتى يضغط "التالي"

**عند اختيار "بالمتر المربع":**
يظهر حقل إضافي: "المساحة الإجمالية: [___] م²" (يتعبأ تلقائياً من بيانات الدراسة CostStudy.buildingArea)
+ حساب تلقائي: "سعر المتر المربع: [حساب تلقائي]"

**عند اختيار "مقطوعية":**
يظهر: "المبلغ الإجمالي: [يتعبأ من التسعير]" + حقل "وصف العرض: [___]"

**عند اختيار "مخصص":**
ينتقل مباشرة لشاشة تخصيص الأعمدة (المهمة 3)

#### ① `StudyQuotationPageContent.tsx` — المكوّن الرئيسي لمرحلة ⑤

```typescript
interface StudyQuotationPageContentProps {
  studyId: string;
  study: CostStudy; // مع العلاقات: stages, materialBOM, costingItems, sectionMarkups
}
```

```
يعرض:
1. شريط علوي: ملخص الدراسة (الاسم، التكلفة، سعر البيع، الهامش)
2. QuotationFormatSelector — اختيار الصيغة
3. بعد الاختيار → زر "إنشاء عرض السعر" أو "تخصيص"
4. إذا يوجد عروض سابقة من هذه الدراسة → يعرضها في قائمة
```

**عدّل صفحة:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[studyId]/quotation/page.tsx`

لتستخدم `StudyQuotationPageContent`.

---

### المهمة 3: بناء شاشة تخصيص الأعمدة والصفوف

#### `QuotationCustomizer.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│ تخصيص عرض السعر                                              │
│                                                              │
│ ═══════ الأعمدة ═══════                                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ☑ رقم البند    ☑ الوصف    ☑ المواصفات                  │ │
│ │ ☑ الكمية       ☑ الوحدة   ☑ سعر الوحدة   ☑ الإجمالي  │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ═══════ الأقسام ═══════                                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ☑ الأعمال الإنشائية        ☑ أعمال التشطيبات            │ │
│ │ ☑ الأعمال الكهروميكانيكية  ☐ البنود اليدوية             │ │
│ │ ☐ تفاصيل المواد                                        │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ═══════ التجميع ═══════                                      │
│ ○ بحسب القسم  ○ بحسب الدور  ○ بحسب البند  ● بدون تجميع    │
│                                                              │
│ ═══════ المجاميع ═══════                                     │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ☑ المجموع الفرعي لكل قسم    ☑ الإجمالي قبل الضريبة    │ │
│ │ ☑ ضريبة القيمة المضافة       ☑ الإجمالي النهائي        │ │
│ │ ☐ تكلفة المتر المربع         ☐ الخصم                   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ═══════ معاينة فورية ═══════                                 │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ (جدول مصغّر يتغيّر فورياً مع كل تغيير في الخيارات)     │ │
│ │  # │ الوصف          │ المواصفات      │ الكمية │ الإجمالي │ │
│ │  1 │ لياسة داخلية   │ إسمنتية 15مم   │ 450 م² │ 16,294  │ │
│ │  2 │ دهان داخلي     │ جوتن 3 طبقات   │ 450 م² │ 16,249  │ │
│ │  . │ ...            │                │        │         │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [← رجوع]  [→ بيانات العرض]                                   │
└──────────────────────────────────────────────────────────────┘
```

**السلوك:**
- كل checkbox يُحدّث المعاينة الفورية (mini preview) في الأسفل
- المعاينة تعرض أول 3-5 بنود فقط كعيّنة
- عند اختيار صيغة BOQ: كل الأعمدة مفعّلة افتراضياً
- عند اختيار بالمتر المربع: الكمية والوحدة وسعر الوحدة مخفية، يظهر فقط المواصفات + السعر/م²
- عند اختيار مقطوعية: لا أعمدة أسعار، فقط المواصفات + المبلغ الإجمالي أسفل الجدول
- الإعدادات تُخزّن في `QuotationDisplayConfig`

**حسب الصيغة، الأعمدة الافتراضية:**

| الصيغة | رقم | وصف | مواصفات | كمية | وحدة | سعر وحدة | إجمالي |
|--------|-----|-----|---------|------|------|----------|--------|
| تفصيلي BOQ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| بالمتر المربع | ☐ | ☑ | ☑ | ☐ | ☐ | ☐ | ☐ |
| مقطوعية | ☐ | ☑ | ☑ | ☐ | ☐ | ☐ | ☐ |
| مخصص | (حر) | (حر) | (حر) | (حر) | (حر) | (حر) | (حر) |

---

### المهمة 4: بناء نموذج بيانات العرض وربطه بالنظام الحالي

#### `QuotationDataForm.tsx` — نموذج بيانات العرض

هذا النموذج يجمع بين بيانات الدراسة وبيانات العميل لإنشاء عرض السعر.

```
┌──────────────────────────────────────────────────────────────┐
│ بيانات عرض السعر                                              │
│                                                              │
│ ═══════ بيانات العميل ═══════                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ العميل: [اختيار من قائمة العملاء ▾] أو [+ عميل جديد]   │ │
│ │                                                          │ │
│ │ الاسم: [______________]   الشركة: [______________]      │ │
│ │ الهاتف: [____________]    البريد: [______________]      │ │
│ │ الرقم الضريبي: [________]                               │ │
│ │                                                          │ │
│ │ ⓘ إذا كان العميل مرتبطاً بـ Lead، تتعبأ البيانات       │ │
│ │   تلقائياً من بيانات العميل المحتمل                      │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ═══════ تفاصيل العرض ═══════                                 │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ رقم العرض: [QTN-2026-0042] (تلقائي)                     │ │
│ │ التاريخ: [10/03/2026] (تلقائي)                           │ │
│ │ صالح حتى: [30 يوم ▾]    ← [09/04/2026]                  │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ═══════ المبالغ ═══════                                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ المجموع الفرعي: 845,480 ريال (من التسعير — قراءة فقط)  │ │
│ │ الخصم:  ○ بدون  ○ نسبة [__]%  ○ مبلغ [______]           │ │
│ │ بعد الخصم: 845,480 ريال                                  │ │
│ │ ضريبة القيمة المضافة (15%): 126,822 ريال                 │ │
│ │ ═══════════════════                                      │ │
│ │ الإجمالي النهائي: 972,302 ريال                            │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ═══════ الشروط ═══════                                       │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ شروط الدفع:    [___________________________________]     │ │
│ │ مدة التنفيذ:   [___________________________________]     │ │
│ │ شروط الضمان:   [___________________________________]     │ │
│ │ ملاحظات:       [___________________________________]     │ │
│ │                [___________________________________]     │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [← رجوع للتخصيص]  [معاينة]  [حفظ كمسودة]  [إصدار العرض]   │
└──────────────────────────────────────────────────────────────┘
```

**⚠️ الربط الحرج مع النظام الحالي:**

عند الضغط على "إصدار العرض"، يجب أن يحدث التالي:

1. **إنشاء `Quotation`** في النظام المالي (model Quotation) عبر `finance.quotations.create`
   - نسخ بيانات العميل
   - نسخ الشروط
   - تعيين costStudyId (الحقل الجديد)

2. **إنشاء `QuotationItem[]`** — بنود العرض:
   - **إذا تفصيلي (BOQ):** كل بند من الدراسة يصبح QuotationItem (description, quantity, unit, unitPrice=sellingPrice, totalPrice)
   - **إذا بالمتر المربع:** QuotationItem واحد أو أقسام قليلة:
     ```
     البند: بناء وتشطيب فيلا سكنية بالمواصفات المرفقة
     الكمية: 300 م²
     الوحدة: م²
     سعر الوحدة: 3,241 ر/م²
     الإجمالي: 972,302 ريال
     ```
   - **إذا مقطوعية:** QuotationItem واحد:
     ```
     البند: بناء وتشطيب فيلا سكنية حسب المواصفات المرفقة
     الكمية: 1
     الوحدة: مقطوعية
     سعر الوحدة: 972,302
     الإجمالي: 972,302
     ```
   - **إذا مخصص:** حسب الأعمدة/الأقسام المفعّلة

3. **إنشاء `QuotationDisplayConfig`** — حفظ إعدادات العرض

4. **إنشاء `Quote`** (مرتبط بالدراسة) — للحفاظ على الربط CostStudy → Quote

5. **تحديث StudyStage** — مرحلة QUOTATION تصبح DRAFT

6. **تحديث Lead** (إذا مرتبط) — حالة العميل المحتمل تتغير لـ QUOTED + نشاط LeadActivity

**⚠️ بعد الإصدار:**
العرض يظهر في **مكانين:**
- داخل الدراسة (مرحلة ⑤)
- في قائمة `pricing/quotations` (الصفحة الحالية)
- وأيضاً قابل للوصول من `finance` (لأن Quotation model مشترك)

#### أنشئ API endpoint جديد:

**ملف:** `packages/api/modules/quantities/procedures/create-study-quotation.ts`

```typescript
// createStudyQuotation(input)
// input: {
//   studyId: string,
//   format: QuotationFormat,
//   displayConfig: QuotationDisplayConfig fields,
//   clientData: { name, company, phone, email, taxNumber },
//   validDays: number,
//   discountType?: "none" | "percent" | "amount",
//   discountValue?: number,
//   paymentTerms?: string,
//   deliveryTerms?: string,
//   warrantyTerms?: string,
//   notes?: string,
// }
//
// العمليات:
// 1. جلب الدراسة مع التسعير والبنود
// 2. حساب البنود حسب الصيغة المختارة (generateQuotationItems)
// 3. إنشاء Quotation عبر finance module (أو مباشرة بنفس المنطق)
// 4. إنشاء QuotationItems
// 5. إنشاء QuotationDisplayConfig
// 6. إنشاء Quote (مرتبط بالدراسة)
// 7. تحديث StudyStage.QUOTATION → DRAFT
// 8. تحديث Lead إذا مرتبط
// 9. إرجاع الـ quotation مع رابطه
//
// كل شيء في prisma.$transaction
```

#### أنشئ helper لتوليد البنود:

**ملف:** `apps/web/modules/saas/pricing/lib/quotation-item-generator.ts`

```typescript
// generateQuotationItems(study, format, displayConfig)
//
// حسب الصيغة:
// - DETAILED_BOQ: يولّد بند لكل StructuralItem + FinishingItem + MEPItem + ManualItem
//   مع حساب سعر البيع (تكلفة + هامش)
//   التجميع حسب displayConfig.grouping
//
// - PER_SQM: يولّد بنود مجمّعة:
//   إذا BY_SECTION: 3 بنود (إنشائي، تشطيبات، MEP) بالسعر الإجمالي / المساحة
//   إذا FLAT: بند واحد بالمساحة × سعر المتر
//
// - LUMP_SUM: بند واحد بالمبلغ الإجمالي
//
// - CUSTOM: حسب الأعمدة والأقسام المفعّلة
```

---

### المهمة 5: بناء معاينة عرض السعر المتقدمة

#### `QuotationPreviewV2.tsx` — معاينة متقدمة تدعم الصيغ الأربع

**⚠️ اقرأ `QuotationPreview.tsx` الحالي أولاً وابنِ فوقه.**

المعاينة يجب أن تعرض العرض كما سيراه العميل — بتنسيق احترافي.

```
┌──────────────────────────────────────────────────────────────┐
│                   🖨️ معاينة عرض السعر                        │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │                                                          │ │
│ │  [شعار الشركة]              عرض سعر                     │ │
│ │  اسم الشركة                 رقم: QTN-2026-0042          │ │
│ │  العنوان                    التاريخ: 10/03/2026          │ │
│ │  الهاتف                     صالح حتى: 09/04/2026         │ │
│ │                                                          │ │
│ │  ──────────────────────────────────────────────────────── │ │
│ │  العميل: أحمد محمد                                       │ │
│ │  الشركة: شركة البناء الحديث                               │ │
│ │  الرقم الضريبي: 300xxxxxxxxx                             │ │
│ │                                                          │ │
│ │  ════ إذا تفصيلي (BOQ) ════                              │ │
│ │  ┌──┬────────────────┬──────────┬─────┬─────┬──────────┐ │ │
│ │  │# │ الوصف          │المواصفات │الكمية│الوحدة│الإجمالي │ │ │
│ │  ├──┼────────────────┼──────────┼─────┼─────┼──────────┤ │ │
│ │  │  │ الأعمال الإنشائية                                │ │ │
│ │  │1 │ خرسانة مسلحة   │ C25      │ 171 │ م³  │ 102,600  │ │ │
│ │  │2 │ حديد تسليح     │ Grade 60 │ 6.3 │ طن  │ 23,650   │ │ │
│ │  │  │ ...                                              │ │ │
│ │  │  │ أعمال التشطيبات                                  │ │ │
│ │  │8 │ لياسة داخلية   │إسمنتية15 │ 450 │ م²  │ 18,738   │ │ │
│ │  │  │ ...                                              │ │ │
│ │  └──┴────────────────┴──────────┴─────┴─────┴──────────┘ │ │
│ │                                                          │ │
│ │  ════ إذا بالمتر المربع ════                             │ │
│ │  المواصفات: (جدول المواصفات الكاملة بدون أسعار)          │ │
│ │  المساحة الإجمالية: 300 م²                               │ │
│ │  سعر المتر المربع: 3,241 ريال/م²                        │ │
│ │  الإجمالي: 972,302 ريال                                  │ │
│ │                                                          │ │
│ │  ════ إذا مقطوعية ════                                   │ │
│ │  المواصفات: (جدول المواصفات الكاملة بدون أسعار)          │ │
│ │  المبلغ الإجمالي: 972,302 ريال                            │ │
│ │  (فقط تسعمائة واثنين وسبعين ألفاً وثلاثمائة واثنين ريال)│ │
│ │                                                          │ │
│ │  ──────────────────────────────────────────────────────── │ │
│ │  الشروط والأحكام:                                        │ │
│ │  • شروط الدفع: ...                                       │ │
│ │  • مدة التنفيذ: ...                                      │ │
│ │  • الضمان: ...                                           │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [تعديل]  [تصدير PDF]  [إرسال بالإيميل]  [نسخ الرابط]       │
└──────────────────────────────────────────────────────────────┘
```

**تصدير PDF:**
- استخدم نظام القوالب الحالي `FinanceTemplate` إذا أمكن
- أو استخدم `@react-pdf/renderer` أو HTML-to-PDF
- اقرأ كيف يتم تصدير PDF حالياً في المشروع وابنِ بنفس الطريقة

**المبلغ بالحروف:**
أنشئ دالة `numberToArabicWords(amount: number): string` تحوّل المبلغ لنص عربي.

#### عدّل قائمة عروض الأسعار الحالية:

**الملف:** `apps/web/modules/saas/pricing/components/quotations/QuotationsList.tsx`

أضف عمود "الصيغة" في الجدول يعرض نوع الصيغة (BOQ / م² / مقطوعية / مخصص).

أضف عمود "الدراسة" يعرض اسم الدراسة المرتبطة (إذا وجدت) مع رابط لفتحها.

أضف فلتر للصيغة في شريط الفلاتر.

#### عدّل صفحة تفاصيل عرض السعر:

**الملف:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/quotations/[quotationId]/page.tsx`

إذا كان العرض مرتبطاً بدراسة (costStudyId != null):
- أظهر رابط "فتح الدراسة"
- أظهر الصيغة المستخدمة
- أظهر زر "تعديل إعدادات العرض" (يفتح QuotationCustomizer)

#### عدّل معاينة عرض السعر:

**الملف:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/quotations/[quotationId]/preview/page.tsx`

إذا كان العرض مرتبطاً بدراسة ولديه `displayConfig`:
- استخدم `QuotationPreviewV2` بدلاً من المعاينة الحالية
- طبّق الصيغة والإعدادات من `displayConfig`

---

## تعليمات عامة مهمة

### التوافق مع النظام الحالي — أهم شيء:
- **عروض الأسعار المُنشأة من الدراسة** تظهر في قائمة `pricing/quotations` الحالية
- **عروض الأسعار المُنشأة يدوياً** (بدون دراسة) تستمر بالعمل كما هي
- `QuotationForm.tsx` الحالي (1,207 سطر) **لا تحذفه ولا تعدّله** — هو لإنشاء عروض يدوية بدون دراسة
- العروض الجديدة من الدراسة تستخدم المكونات الجديدة في `quotation-builder/`
- كلاهما يستخدمان نفس model `Quotation` في قاعدة البيانات
- كلاهما يظهران في نفس القائمة `QuotationsList`

### الصلاحيات:
- إنشاء عرض سعر من دراسة يتطلب: `pricing.quotations` أو `pricing.pricing`
- معاينة وتصدير تتطلب: `pricing.quotations`
- تحويل لفاتورة يتطلب: `finance.quotations`
- استخدم نفس نمط التحقق من الصلاحيات الحالي في المشروع

### قواعد الكود:
- **لا تحذف أي ملف أو مكوّن حالي** — فقط أضف أو وسّع
- **لا تعدّل QuotationForm.tsx** — هو للعروض اليدوية
- المكونات الجديدة في `quotation-builder/`
- استخدم shadcn/ui: Card, Table, Tabs, Dialog, Button, Checkbox, RadioGroup, Select, Badge, Separator
- استخدم lucide-react للأيقونات
- كل النصوص بالعربية (RTL)
- ORPC للـ API
- React Query للـ data fetching
- الأرقام بتنسيق: `toLocaleString('ar-SA')`
- العملة: ريال (ر.س)
- كل مكوّن ≤ 300 سطر — قسّم إذا كبر

### ترتيب التنفيذ:
1. قاعدة البيانات (المهمة 1)
2. صفحة اختيار الصيغة من الدراسة (المهمة 2)
3. شاشة التخصيص (المهمة 3)
4. نموذج البيانات والربط (المهمة 4) — **الأهم**
5. المعاينة والتعديلات على القائمة (المهمة 5)

بعد كل مهمة: `pnpm build` ثم انتقل للتالية.

### ملخص التدفق الكامل:

```
المستخدم في الدراسة → مرحلة ⑤ عرض السعر
  ↓
اختيار الصيغة (BOQ / م² / مقطوعية / مخصص)
  ↓
تخصيص الأعمدة والصفوف (إذا مخصص أو أراد تعديل)
  ↓
إدخال بيانات العميل والشروط
  ↓
معاينة فورية
  ↓
"إصدار العرض"
  ↓
يُنشأ Quotation + QuotationItems + DisplayConfig + Quote
  ↓
يظهر العرض في:
  • مرحلة ⑤ في الدراسة
  • قائمة pricing/quotations
  • قابل للوصول من finance
  ↓
يمكن: تصدير PDF، إرسال بالإيميل، نسخ رابط، تحويل لفاتورة
```
