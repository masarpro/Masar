# برومبت المرحلة الثانية — جدول المواد وتسعير التكلفة وصفحة التسعير (مسار)

> **متطلب أساسي:** المرحلة الأولى يجب أن تكون مكتملة (جدول StudyStage، شريط 6 مراحل، نقاط الدخول المتعددة).

أنت تعمل على مشروع مسار — نظام إدارة مشاريع مقاولات. المشروع مبني بـ Next.js App Router + ORPC + Prisma + PostgreSQL + TypeScript + Tailwind CSS + shadcn/ui.

## السياق

في المرحلة الأولى أنشأنا الهيكل الأساسي: جدول StudyStage بـ 6 مراحل، شريط المراحل الجديد، نقاط الدخول المتعددة. الآن في المرحلة الثانية نبني المحتوى الفعلي لـ 3 مراحل:
- **المواصفات** (② مرحلة مستقلة جديدة + جدول المواد BOM)
- **تسعير التكلفة** (③ صفحة جديدة بالكامل مع سيناريوهات العمالة)
- **التسعير / سعر البيع** (④ صفحة هامش الربح منفصلة عن التكلفة)

**البنية الحالية:**
```
apps/web/modules/saas/pricing/              → Frontend
  components/studies/                       → مكونات الدراسات
  components/finishing/                     → مكونات التشطيبات (فيها specs/ و wizard/)
  components/pipeline/                      → مكونات خط العمل (فيها CostingPageContent, MarkupMethodSelector, etc.)
  components/pricing/                       → مكونات التسعير
  lib/                                      → المكتبات والحسابات
    derivation-engine.ts                    → محرك اشتقاق التشطيبات (50 KB)
    mep-derivation-engine.ts               → محرك اشتقاق MEP (80 KB)
    finishing-categories.ts                 → 26 فئة تشطيبات
    finishing-templates.ts                  → قوالب تشطيبات
    pricing-calculations.ts                → معادلات التسعير
    costing-constants.ts                   → ثوابت التكاليف
    specs/                                 → المواصفات
      spec-types.ts
      spec-calculator.ts
      catalog/                             → كتالوجات (8 ملفات)
        paint-catalog.ts, plaster-catalog.ts, flooring-catalog.ts, ...
  constants/prices.ts                      → أسعار المواد والعمالة

packages/api/modules/quantities/procedures/  → Backend
  finishing-item-create.ts
  finishing-item-batch-spec-update.ts
  costing.ts                                → إجراءات التكاليف الحالية
  markup.ts                                 → إجراءات هوامش الربح الحالية
```

**اقرأ هذه الملفات أولاً قبل أي تعديل:**
1. `packages/database/prisma/schema.prisma` — تحديداً: CostStudy, FinishingItem, MEPItem, StructuralItem, CostingItem, SectionMarkup, MaterialBOM (إذا لم يُضف بعد)
2. `apps/web/modules/saas/pricing/lib/derivation-engine.ts` — افهم كيف يشتق الكميات من buildingConfig
3. `apps/web/modules/saas/pricing/lib/specs/spec-calculator.ts` — افهم كيف يحسب المواد من المواصفات
4. `apps/web/modules/saas/pricing/lib/specs/catalog/` — اقرأ ملف أو اثنين لفهم بنية الكتالوج
5. `apps/web/modules/saas/pricing/lib/finishing-categories.ts` — الفئات الـ 26
6. `apps/web/modules/saas/pricing/lib/pricing-calculations.ts` — معادلات التسعير الحالية
7. `apps/web/modules/saas/pricing/components/finishing/specs/BillOfMaterials.tsx` — كومبوننت المواد المجمعة الحالي
8. `apps/web/modules/saas/pricing/components/finishing/specs/ItemSpecEditor.tsx` — محرر المواصفات الحالي
9. `apps/web/modules/saas/pricing/components/pipeline/CostingPageContent.tsx` — صفحة التكاليف الحالية
10. `apps/web/modules/saas/pricing/components/pipeline/CostingTable.tsx`
11. `apps/web/modules/saas/pricing/components/pipeline/MarkupMethodSelector.tsx`
12. `apps/web/modules/saas/pricing/components/pipeline/UniformMarkupForm.tsx`
13. `apps/web/modules/saas/pricing/components/pipeline/SectionMarkupForm.tsx`
14. `apps/web/modules/saas/pricing/components/pipeline/ProfitAnalysis.tsx`
15. `packages/api/modules/quantities/procedures/costing.ts`
16. `packages/api/modules/quantities/procedures/markup.ts`
17. `apps/web/modules/saas/pricing/constants/prices.ts`

---

## المهام المطلوبة (4 مهام)

---

### المهمة 1: إنشاء جداول MaterialBOM و CostingLabor في قاعدة البيانات

**الملف:** `packages/database/prisma/schema.prisma`

**أ) أضف enum `LaborMethod`:**
```prisma
enum LaborMethod {
  PER_UNIT                  // بالوحدة (ريال/م² أو ريال/م³ أو ريال/نقطة)
  PER_SQM                   // بالمتر المسطح الشامل
  LUMP_SUM                  // بالمقطوعية (مبلغ إجمالي)
  MONTHLY_SALARY            // بالراتب الشهري
  SUBCONTRACTOR_INCLUSIVE    // مقاول باطن شامل (مواد + مصنعية)
}
```

**ب) أضف enum `BOQSection` (إذا لم يكن موجوداً كـ enum — قد يكون موجوداً كـ String):**
```prisma
enum BOQSectionType {
  STRUCTURAL
  FINISHING
  MEP
  LABOR
  MANUAL
  GENERAL
}
```

**ج) أضف model `MaterialBOM`:**
```prisma
model MaterialBOM {
  id                String      @id @default(cuid())
  costStudyId       String
  costStudy         CostStudy   @relation(fields: [costStudyId], references: [id], onDelete: Cascade)

  // ربط بالبند الأصل
  parentItemId      String      // ID البند في جدول FinishingItem أو MEPItem أو StructuralItem
  parentItemType    BOQSectionType  // STRUCTURAL, FINISHING, MEP
  parentCategory    String?     // الفئة الفرعية (paint, plaster, flooring, ELECTRICAL, etc.)

  // بيانات المادة
  materialName      String      // اسم المادة (إسمنت، رمل، دهان جوتن، الخ)
  materialNameEn    String?     // الاسم بالإنجليزية
  materialCode      String?     // كود المادة (إذا وجد)

  // الكميات
  quantity          Decimal     @db.Decimal(15, 4)  // الكمية الصافية
  unit              String      // الوحدة (كجم، م³، لتر، م²، عدد)
  consumptionRate   Decimal?    @db.Decimal(10, 4)  // معدل الاستهلاك (كمية المادة لكل وحدة من البند)
  wastagePercent    Decimal     @default(0) @db.Decimal(5, 2)
  effectiveQuantity Decimal     @db.Decimal(15, 4)  // الكمية بعد الهالك

  // للتسعير لاحقاً (تُملأ في مرحلة التكلفة)
  unitPrice         Decimal?    @db.Decimal(15, 2)  // سعر الوحدة
  totalPrice        Decimal?    @db.Decimal(15, 2)  // الإجمالي

  // فلترة
  floorId           String?     // الدور (إذا كان البند مرتبط بدور)
  floorName         String?
  roomId            String?     // الغرفة (إذا كان البند مرتبط بغرفة)
  roomName          String?

  sortOrder         Int         @default(0)
  isEnabled         Boolean     @default(true)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  @@index([costStudyId])
  @@index([costStudyId, parentItemType])
  @@index([parentItemId])
  @@map("material_bom")
}
```

**د) أضف model `CostingLabor`:**
```prisma
model CostingLabor {
  id              String          @id @default(cuid())
  costStudyId     String
  costStudy       CostStudy       @relation(fields: [costStudyId], references: [id], onDelete: Cascade)

  // ربط بالقسم
  section         BOQSectionType  // STRUCTURAL, FINISHING, MEP
  subSection      String?         // فئة فرعية (مثلاً: نجارة، حدادة، صبّ)

  // طريقة الحساب
  laborMethod     LaborMethod

  // بيانات العمالة
  description     String          // وصف (نجّار، حدّاد، كهربائي، مقاول سباكة)
  unit            String          // الوحدة (م²، م³، طن، بلوكة، شهر، مقطوعية)
  quantity        Decimal         @db.Decimal(15, 4)  // الكمية أو العدد
  rate            Decimal         @db.Decimal(15, 2)  // المعدل (سعر الوحدة أو الراتب)
  durationMonths  Int?            // المدة بالأشهر (للراتب)

  // تكاليف إضافية (للراتب)
  insuranceCost   Decimal?        @db.Decimal(15, 2)
  housingCost     Decimal?        @db.Decimal(15, 2)
  transportCost   Decimal?        @db.Decimal(15, 2)
  otherCosts      Decimal?        @db.Decimal(15, 2)

  // الإجمالي
  totalCost       Decimal         @db.Decimal(15, 2)

  sortOrder       Int             @default(0)
  isEnabled       Boolean         @default(true)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([costStudyId])
  @@index([costStudyId, section])
  @@map("costing_labor")
}
```

**هـ) عدّل model CostStudy — أضف العلاقات:**
```prisma
// في model CostStudy أضف:
  materialBOM       MaterialBOM[]
  costingLabor      CostingLabor[]

  // إعدادات التسعير الجديدة
  costingMethod     String?       // طريقة التسعير: "manual" | "database" | "import"
  overheadCost      Decimal?      @db.Decimal(15, 2)  // مصاريف عامة (مبلغ)
  adminCost         Decimal?      @db.Decimal(15, 2)  // مصاريف إدارية (مبلغ)
  adminPercent      Decimal?      @db.Decimal(5, 2)   // مصاريف إدارية (نسبة)
  storageCostPercent Decimal?     @db.Decimal(5, 2)   // نسبة التشوين الافتراضية

  // طريقة هامش الربح
  markupMethod      String?       // "uniform" | "per_section" | "manual"
  uniformMarkupPercent Decimal?   @db.Decimal(5, 2)   // هامش موحد
```

**و) أنشئ Migration:**
```bash
cd packages/database
npx prisma migrate dev --name add-material-bom-and-costing-labor
```

---

### المهمة 2: بناء صفحة المواصفات المستقلة + محرك BOM

هذه المهمة هي الأكبر. الهدف: صفحة مواصفات مستقلة تعرض جدول الكميات (من المرحلة السابقة) وتسمح باختيار المواصفات لكل بند، ثم تستخرج جدول المواد المُجمّع (BOM).

#### 2أ) أنشئ المكونات الجديدة

**أنشئ المجلد:** `apps/web/modules/saas/pricing/components/specifications/`

**الملفات المطلوبة:**

**① `SpecificationsPageContent.tsx` — المكوّن الرئيسي:**

```
المكوّن يعرض:
1. شريط اختيار طريقة التطبيق:
   - "كامل المشروع" (مواصفات موحدة)
   - "بحسب الدور" (كل دور بمواصفات مختلفة)
   - "بحسب الغرفة" (تخصيص دقيق)

2. شريط القوالب السريعة:
   - أزرار: [اقتصادي] [متوسط] [فاخر] [قالب محفوظ ▾]
   - الضغط على أحدها يطبّق مجموعة مواصفات كاملة دفعة واحدة

3. جدول البنود مع المواصفات:
   - إذا "كامل المشروع": جدول واحد بكل البنود
   - إذا "بحسب الدور": accordion لكل دور، وداخله جدول البنود
   - إذا "بحسب الغرفة": accordion لكل دور > accordion لكل غرفة > جدول البنود

4. أسفل الجدول: قسم جدول المواد المُجمّع (BOM)
```

**Props:**
```typescript
interface SpecificationsPageContentProps {
  studyId: string;
  buildingConfig: SmartBuildingConfig | null;
  finishingItems: FinishingItem[];
  mepItems: MEPItem[];
  structuralItems: StructuralItem[];
}
```

**② `SpecQuickTemplateBar.tsx` — شريط القوالب:**
```
3 أزرار ثابتة (اقتصادي، متوسط، فاخر) + dropdown لقوالب محفوظة.
عند الضغط:
- يستدعي API لتطبيق القالب على جميع البنود (أو البنود المحددة)
- يُحدّث الجدول
- يُعيد حساب BOM
```

استخدم القوالب الموجودة في `apps/web/modules/saas/pricing/lib/finishing-templates.ts` والكتالوجات في `lib/specs/catalog/`.

**③ `SpecItemRow.tsx` — صف البند في الجدول:**
```
يعرض:
- اسم البند
- الكمية والوحدة (للقراءة فقط — يأتي من مرحلة الكميات)
- المواصفات المختارة (نص ملخص)
- زر [تعديل] يفتح SpecItemDialog
```

**④ `SpecItemDialog.tsx` — حوار تعديل مواصفات بند:**
```
حوار (Dialog) يظهر عند الضغط على [تعديل].
يعرض حقول المواصفات حسب نوع البند:
- لياسة: النوع (إسمنتية/جبسية)، السماكة، الطبقات، المعجون
- دهان: العلامة، عدد الطبقات، النوع
- أرضيات: المادة (سيراميك/بورسلين/رخام)، المقاس، النوعية
- أبواب: المادة (خشب/حديد/ألمنيوم)، المقاس، الماركة
- كهرباء: نوع الكيبل، نوع المقبس، الماركة
- ... وهكذا

استخدم البنية الموجودة في:
- `apps/web/modules/saas/pricing/components/finishing/specs/ItemSpecEditor.tsx`
- `apps/web/modules/saas/pricing/lib/specs/spec-types.ts`
- الكتالوجات في `lib/specs/catalog/`

أزرار:
- [حفظ] — يحفظ للبند الحالي فقط
- [تطبيق على كل الأدوار] — يطبّق نفس المواصفات على نفس البند في جميع الأدوار
- [تطبيق على كل البنود المشابهة] — يطبّق على كل بنود نفس الفئة
```

**⑤ `BOMSection.tsx` — قسم جدول المواد المُجمّع:**
```
يعرض جدول المواد المستخرجة من المواصفات المختارة.
لكل بند في جدول الكميات → يُستخرج المواد المطلوبة بالكميات الفعلية.

مثال:
┌──────────────────────────────────────────────────┐
│ لياسة جدران داخلية — إسمنتية 15مم — 450 م²       │
│   إسمنت: 2,250 كجم (5 كجم/م²)                   │
│   رمل: 6.75 م³ (0.015 م³/م²)                    │
│   شبك: 450 م² (1 م²/م²)                         │
│                                                  │
│ دهان داخلي — جوتن ماتكس — 3 طبقات — 450 م²       │
│   برايمر: 45 لتر (0.1 لتر/م²)                   │
│   دهان جوتن ماتكس: 135 لتر (0.3 لتر/م² × 3)    │
│   معجون: 90 كجم (0.2 كجم/م²)                    │
└──────────────────────────────────────────────────┘

استخدم المنطق الموجود في:
- `apps/web/modules/saas/pricing/components/finishing/specs/BillOfMaterials.tsx`
- `apps/web/modules/saas/pricing/lib/specs/spec-calculator.ts`
```

#### 2ب) أنشئ محرك BOM

**أنشئ ملف:** `apps/web/modules/saas/pricing/lib/bom-engine.ts`

هذا الملف يستخرج المواد من المواصفات المختارة:

```typescript
// المدخل: بند تشطيبات مع مواصفاته
// المخرج: مصفوفة مواد مع الكميات

interface BOMInput {
  itemId: string;
  itemType: "STRUCTURAL" | "FINISHING" | "MEP";
  category: string;        // paint, plaster, flooring, ELECTRICAL, etc.
  quantity: number;
  unit: string;
  specData: Record<string, any>;  // المواصفات المختارة
  floorId?: string;
  floorName?: string;
  roomId?: string;
  roomName?: string;
}

interface BOMOutput {
  materialName: string;
  materialNameEn?: string;
  quantity: number;
  unit: string;
  consumptionRate: number;    // معدل الاستهلاك لكل وحدة من البند
  wastagePercent: number;
  effectiveQuantity: number;  // بعد الهالك
}

function generateBOM(input: BOMInput): BOMOutput[] {
  // حسب الفئة، استخرج المواد
  // مثلاً:
  // - لياسة إسمنتية: إسمنت (5 كجم/م²) + رمل (0.015 م³/م²) + شبك (إذا في المواصفات)
  // - دهان: برايمر (0.1 لتر/م²) + دهان (0.3 لتر/م² × عدد الطبقات) + معجون (إذا في المواصفات)
  // - أرضيات: بلاط (1 م²/م²) + لاصق (5 كجم/م²) + فاصل (0.5 كجم/م²)
}
```

**المنطق:** اقرأ `spec-calculator.ts` و `BillOfMaterials.tsx` الحاليين واستخرج منهم معدلات الاستهلاك. الهدف هو جمع كل المنطق المتفرق في ملف واحد نظيف.

**معدلات الاستهلاك الأساسية (استخرجها من الملفات الحالية أو استخدم هذه كافتراضي):**

| البند | المادة | المعدل | الوحدة |
|-------|--------|--------|--------|
| لياسة إسمنتية | إسمنت | 5 | كجم/م² |
| لياسة إسمنتية | رمل | 0.015 | م³/م² |
| دهان (طبقة واحدة) | دهان | 0.1 | لتر/م² |
| دهان | برايمر | 0.1 | لتر/م² |
| دهان | معجون | 0.2 | كجم/م² |
| سيراميك/بورسلين | بلاط | 1.0 | م²/م² |
| سيراميك/بورسلين | لاصق | 5.0 | كجم/م² |
| سيراميك/بورسلين | فاصل (روبة) | 0.5 | كجم/م² |
| رخام | رخام | 1.0 | م²/م² |
| رخام | إسمنت لاصق | 6.0 | كجم/م² |
| عزل مائي | رولات عزل | 1.15 | م²/م² |
| عزل مائي | برايمر بيتومين | 0.3 | لتر/م² |
| عزل حراري | ألواح عزل | 1.05 | م²/م² |

#### 2ج) أنشئ API endpoints للمواصفات

**أنشئ ملف:** `packages/api/modules/quantities/procedures/specifications.ts`

```typescript
// الإجراءات المطلوبة:

// 1. getSpecifications(studyId)
//    يرجع: جدول الكميات مع المواصفات الحالية لكل بند
//    المصدر: FinishingItem.specData + MEPItem (الحقول ذات العلاقة) + StructuralItem.concreteType

// 2. updateItemSpec(studyId, itemId, itemType, specData)
//    يحدّث المواصفات لبند واحد
//    itemType: "finishing" | "mep" | "structural"
//    specData: الكائن الذي يحتوي المواصفات الجديدة

// 3. applyTemplateToAll(studyId, templateLevel: "economic" | "medium" | "luxury")
//    يطبّق قالب مواصفات على جميع البنود
//    يستخدم القوالب من finishing-templates.ts

// 4. applySpecToFloor(studyId, itemCategory, floorId, specData)
//    يطبّق مواصفات على جميع بنود فئة معينة في دور معين

// 5. applySpecToAllFloors(studyId, itemId, specData)
//    يطبّق مواصفات بند على نفس البند في جميع الأدوار

// 6. generateBOM(studyId)
//    يستخرج جدول المواد المُجمّع من المواصفات المختارة
//    يحفظ النتيجة في جدول MaterialBOM
//    يرجع المواد المستخرجة

// 7. getBOM(studyId)
//    يرجع جدول المواد المحفوظ

// 8. refreshBOM(studyId)
//    يعيد حساب BOM بعد تغيير المواصفات
```

**سجّل الإجراءات في الـ router** (اقرأ كيف يتم تسجيل الإجراءات الحالية في `packages/api/modules/quantities/router.ts` أو ما شابه).

#### 2د) عدّل صفحة المواصفات

**الملف:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[studyId]/specifications/page.tsx`

هذه الصفحة موجودة (كانت placeholder أو فيها محتوى قديم). عدّلها لتستخدم `SpecificationsPageContent` الجديد:

```tsx
// الصفحة تجلب بيانات الدراسة + البنود + المواصفات
// ثم تعرض SpecificationsPageContent

// يجب التحقق:
// - مرحلة الكميات يجب أن تكون APPROVED قبل الوصول لهذه الصفحة
// - إذا لم تكن معتمدة، أظهر رسالة "يجب اعتماد الكميات أولاً" مع رابط للرجوع
```

---

### المهمة 3: بناء صفحة تسعير التكلفة الجديدة

هذه الصفحة تأخذ جدول الكميات + المواصفات + المواد المُجمّعة (BOM) وتسمح بإدخال الأسعار.

#### 3أ) أنشئ المكونات

**أنشئ المجلد:** `apps/web/modules/saas/pricing/components/costing-v2/`

(نستخدم `-v2` لتمييزها عن المكونات الحالية في `pipeline/`. بعد الاستقرار يمكن حذف القديمة.)

**الملفات:**

**① `CostingPageContentV2.tsx` — المكوّن الرئيسي:**

```
يعرض:
1. تبويبات: [إنشائي] [تشطيبات] [كهروميكانيكية] [عمالة] [ملخص]

2. أعلى كل تبويب قسم:
   - مصدر الأسعار: ○ إدخال يدوي  ○ قاعدة أسعار مسار  ○ استيراد
   - نسبة التشوين الافتراضية: [___]%

3. محتوى كل تبويب مختلف (انظر أدناه)
```

**② `StructuralCostingTab.tsx` — تبويب تسعير الإنشائي:**

```
يعرض:
┌──────────────────────────────────────────────────────┐
│ طريقة حساب عمالة الإنشائي:                           │
│ ┌────────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ ● مقاول باطن   │ │ ○ بالمتر     │ │ ○ بالراتب   │ │
│ │   بالوحدة      │ │   المسطح     │ │   الشهري    │ │
│ └────────────────┘ └──────────────┘ └──────────────┘ │
└──────────────────────────────────────────────────────┘

إذا "مقاول باطن بالوحدة":
┌────────────────────────────────────────────────────────────┐
│ البند             │ الكمية │ الوحدة │ سعر المادة │ المصنعية │ التشوين% │ الإجمالي │
│───────────────────┼────────┼────────┼────────────┼──────────┼─────────┼──────────│
│ خرسانة C25        │ 171    │ م³     │ [280]      │          │ [2]     │ حساب     │
│   ├ نجارة (طوبار) │ 850    │ م²     │            │ [35]     │         │          │
│   ├ حدادة (تسليح) │ 6.3    │ طن     │            │ [800]    │         │          │
│   └ صبّ           │ 171    │ م³     │            │ [25]     │         │          │
│ حديد تسليح        │ 6.3    │ طن     │ [3200]     │ (شامل)   │ [2]     │          │
│ بلوك 20سم         │ 3500   │ بلوكة  │ [4.5]      │ [2.5]    │ [2]     │          │
│ طوبار             │ 850    │ م²     │ [15]       │ (شامل)   │ [2]     │          │
└────────────────────────────────────────────────────────────┘

إذا "بالمتر المسطح":
┌────────────────────────────────────────────────┐
│ مصنعيات عظم شاملة بالمتر المسطح               │
│ السعر: [___] ريال/م²                           │
│ مساحة البناء: 300 م² (من بيانات الدراسة)       │
│ الإجمالي: ___ ريال                             │
│                                                │
│ + مواد (تُسعّر منفصلة):                        │
│ خرسانة: 171 م³ × [280] = 47,880 ريال          │
│ حديد: 6.3 طن × [3200] = 20,160 ريال           │
│ بلوك: 3500 × [4.5] = 15,750 ريال              │
│ = إجمالي المواد: 83,790 ريال                   │
│ + مصنعيات: ___ ريال                            │
│ + تشوين: [2]%                                  │
└────────────────────────────────────────────────┘

إذا "بالراتب":
┌─────────────────────────────────────────────────────────────┐
│ الوظيفة    │ العدد │ الراتب │ المدة (شهر) │ تأمين │ سكن    │ الإجمالي │
│────────────┼───────┼────────┼─────────────┼───────┼────────┼──────────│
│ [نجار]     │ [3]   │ [3000] │ [4]         │ [200] │ [500]  │ = حساب   │
│ [حداد]     │ [2]   │ [3000] │ [3]         │ [200] │ [500]  │ = حساب   │
│ [عامل]     │ [5]   │ [2000] │ [5]         │ [150] │ [400]  │ = حساب   │
│ [+ إضافة]  │       │        │             │       │        │          │
└─────────────────────────────────────────────────────────────┘
│ + مواد (تُسعّر منفصلة) — نفس جدول المواد أعلاه            │
```

**الكميات** (خرسانة، حديد، بلوك، طوبار) **تأتي تلقائياً من مرحلة الكميات** (StructuralItem). المستخدم يُدخل الأسعار فقط.

**③ `FinishingCostingTab.tsx` — تبويب تسعير التشطيبات:**

```
يأخذ جدول المواد المُجمّع (BOM) من مرحلة المواصفات ويعرضه مع حقول الأسعار:

┌─────────────────────────────────────────────────────────────────┐
│ البند وموادّه                │ الكمية │ سعر المادة │ إجمالي المادة │
│─────────────────────────────┼────────┼────────────┼───────────────│
│ ▼ لياسة جدران داخلية (450م²)│        │            │               │
│   ├ إسمنت                   │ 2,250  │ [0.35]كجم  │ = 788         │
│   ├ رمل                     │ 6.75   │ [50] م³    │ = 338         │
│   └ شبك                     │ 450    │ [8] م²     │ = 3,600       │
│   إجمالي المواد              │        │            │ 4,725         │
│   المصنعية:                  │ 450 م² │ [25] ر/م²  │ = 11,250      │
│   التشوين: [2]%              │        │            │ = 319         │
│   ──────── إجمالي البند ─────│        │            │ = 16,294      │
│                              │        │            │               │
│ ▼ دهان داخلي (450م²)         │        │            │               │
│   ├ برايمر                   │ 45 لتر │ [15] لتر   │ = 675         │
│   ├ دهان                     │ 135 لتر│ [45] لتر   │ = 6,075       │
│   └ معجون                    │ 90 كجم │ [12] كجم   │ = 1,080       │
│   إجمالي المواد              │        │            │ 7,830         │
│   المصنعية:                  │ 450 م² │ [18] ر/م²  │ = 8,100       │
│   التشوين: [2]%              │        │            │ = 319         │
│   ──────── إجمالي البند ─────│        │            │ = 16,249      │
└─────────────────────────────────────────────────────────────────┘

⚠️ لكل بند، يمكن تغيير طريقة المصنعية:
  ○ بالوحدة (ر/م²)  ○ بالمقطوعية (مبلغ إجمالي)  ○ مقاول باطن (شامل مواد)
```

**④ `MEPCostingTab.tsx` — تبويب تسعير الكهروميكانيكية:**

نفس بنية التشطيبات لكن مع خصوصية:
- يمكن تسعير قسم كامل بالمقطوعية (مثلاً: "الكهرباء كاملة: 85,000 ريال شامل")
- أو تسعير كل بند على حدة

```
┌──────────────────────────────────────────────────────────────┐
│ طريقة تسعير الكهرباء:                                        │
│ ○ تفصيلي (بند بند)  ● مقطوعية شاملة                         │
│                                                              │
│ إذا "مقطوعية شاملة":                                        │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ أعمال الكهرباء — مقاول باطن                              │ │
│ │ المبلغ: [85,000] ريال (شامل مواد ومصنعية وتشوين)        │ │
│ │ ⓘ يحتوي: 45 نقطة إنارة، 38 مخرج، 8 نقاط تكييف...      │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ طريقة تسعير السباكة:                                         │
│ ● تفصيلي (بند بند)  ○ مقطوعية شاملة                         │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ (نفس بنية التشطيبات — BOM + أسعار)                      │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**⑤ `LaborOverviewTab.tsx` — تبويب ملخص العمالة:**

يجمع كل بنود العمالة من الأقسام الثلاثة في مكان واحد:

```
┌──────────────────────────────────────────────────────────────┐
│ ملخص العمالة                                                 │
│                                                              │
│ ▼ إنشائي (طريقة: مقاول باطن بالوحدة)                        │
│   نجارة: 850 م² × 35 = 29,750                               │
│   حدادة: 6.3 طن × 800 = 5,040                               │
│   صبّ: 171 م³ × 25 = 4,275                                  │
│   بنّاء: 3,500 × 2.5 = 8,750                                │
│   إجمالي إنشائي: 47,815                                      │
│                                                              │
│ ▼ تشطيبات (طريقة: مصنعيات بالوحدة)                           │
│   لياسة: 450 م² × 25 = 11,250                               │
│   دهان: 450 م² × 18 = 8,100                                 │
│   أرضيات: 300 م² × 30 = 9,000                               │
│   ...                                                        │
│   إجمالي تشطيبات: 52,350                                     │
│                                                              │
│ ▼ كهروميكانيكية                                               │
│   كهرباء: مقطوعية شاملة = (مضمّن في 85,000)                  │
│   سباكة: مصنعيات = 22,000                                    │
│   إجمالي MEP: 22,000 (+ 85,000 شامل)                        │
│                                                              │
│ ═══════════════════                                          │
│ إجمالي العمالة: 122,165 ريال                                 │
└──────────────────────────────────────────────────────────────┘
```

**⑥ `CostingSummaryTab.tsx` — تبويب الملخص:**

```
┌──────────────────────────────────────────────────────────────┐
│ ملخص تسعير التكلفة                                           │
│                                                              │
│ ┌───────────────┬──────────┬──────────┬─────────┬──────────┐ │
│ │ القسم         │ المواد   │ المصنعيات│ التشوين │ الإجمالي │ │
│ ├───────────────┼──────────┼──────────┼─────────┼──────────┤ │
│ │ إنشائي        │ 83,790  │ 47,815  │ 2,632  │ 134,237 │ │
│ │ تشطيبات       │ 125,000 │ 52,350  │ 3,547  │ 180,897 │ │
│ │ كهروميكانيكية │ 85,000  │ (شامل)  │ 1,700  │ 86,700  │ │
│ ├───────────────┼──────────┼──────────┼─────────┼──────────┤ │
│ │ الإجمالي      │ 293,790 │ 100,165 │ 7,879  │ 401,834 │ │
│ └───────────────┴──────────┴──────────┴─────────┴──────────┘ │
│                                                              │
│ + مصاريف عامة: [5]% = 20,092                                │
│ + مصاريف إدارية: [3]% = 12,055                              │
│ + احتياطي: [2]% = 8,037                                     │
│ ─────────────────────────                                    │
│ = إجمالي التكلفة: 442,018 ريال                              │
│ = تكلفة المتر المربع: 1,473 ريال/م²                         │
│                                                              │
│ [✅ اعتماد تسعير التكلفة]  [→ التسعير]                      │
└──────────────────────────────────────────────────────────────┘
```

#### 3ب) أنشئ API endpoints للتسعير

**أنشئ ملف:** `packages/api/modules/quantities/procedures/costing-v2.ts`

```typescript
// الإجراءات:

// 1. getCostingData(studyId)
//    يرجع: BOM + CostingLabor + CostingItem الحالية + إعدادات التسعير

// 2. updateMaterialPrice(studyId, bomItemId, unitPrice)
//    يحدّث سعر مادة في BOM ويعيد حساب الإجمالي

// 3. bulkUpdateMaterialPrices(studyId, items: {bomItemId, unitPrice}[])
//    تحديث مجمّع للأسعار

// 4. applyDefaultPrices(studyId)
//    يطبّق أسعار قاعدة مسار (من constants/prices.ts) على كل المواد

// 5. setLaborMethod(studyId, section, laborMethod)
//    يحدد طريقة حساب العمالة لقسم

// 6. upsertLaborItem(studyId, data: CostingLaborInput)
//    إنشاء أو تحديث بند عمالة

// 7. deleteLaborItem(studyId, laborItemId)

// 8. setSubcontractorLumpSum(studyId, section, subCategory, amount)
//    تحديد مبلغ مقطوعية لمقاول باطن (مثل: كهرباء = 85,000)

// 9. updateOverheadSettings(studyId, { overheadPercent, adminPercent, contingencyPercent, storageCostPercent })

// 10. getCostingSummary(studyId)
//     يرجع ملخص التكاليف بالأقسام
```

#### 3ج) عدّل صفحة التكاليف

**الملف:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[studyId]/costing/page.tsx`

عدّلها لتستخدم `CostingPageContentV2`. التحقق: مرحلة المواصفات يجب أن تكون APPROVED.

---

### المهمة 4: بناء صفحة التسعير (هامش الربح) المنفصلة

هذه الصفحة تأخذ إجمالي التكلفة وتسمح بإضافة هامش الربح.

#### 4أ) أنشئ المكونات

**أنشئ المجلد:** `apps/web/modules/saas/pricing/components/pricing-v2/`

**① `PricingPageContentV2.tsx` — المكوّن الرئيسي:**

```
يعرض:
1. بطاقة إجمالي التكلفة (من المرحلة السابقة — للقراءة فقط)

2. اختيار طريقة الهامش:
   ┌────────────────┐ ┌────────────────┐ ┌─────────────────────┐
   │ ● نسبة موحدة  │ │ ○ نسبة لكل    │ │ ○ تعديل يدوي       │
   │                │ │   قسم         │ │   لكل بند           │
   └────────────────┘ └────────────────┘ └─────────────────────┘

3. حسب الاختيار:
   - نسبة موحدة: حقل واحد [___]% + حساب تلقائي
   - نسبة لكل قسم: جدول بالأقسام مع نسبة لكل قسم
   - تعديل يدوي: تطبيق نسبة أولاً ثم تعديل أسعار البنود يدوياً

4. خيارات إضافية:
   - ضريبة القيمة المضافة: ☑ تشمل (15%)
   
5. تحليل الأرباح:
   - إجمالي التكلفة / سعر البيع / هامش الربح / ريال لكل م²
```

استفد من المكونات الموجودة:
- `MarkupMethodSelector.tsx`
- `UniformMarkupForm.tsx`
- `SectionMarkupForm.tsx`
- `ProfitAnalysis.tsx`

يمكنك إعادة استخدامها أو نسخها وتعديلها في المجلد الجديد.

**② `ProfitAnalysisCard.tsx` — بطاقة تحليل الأرباح:**

```
┌──────────────────────────────────────────────────┐
│ 📊 تحليل الأرباح                                 │
│                                                  │
│ إجمالي التكلفة     442,018 ريال                  │
│ هامش الربح (15%)    66,303 ريال                   │
│ ─────────────────────────────                    │
│ سعر البيع           508,321 ريال                  │
│ ضريبة (15%)         76,248 ريال                   │
│ ═════════════════════════════                    │
│ الإجمالي النهائي    584,569 ريال                  │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ تكلفة المتر المربع │ 1,473 ر/م²              │ │
│ │ سعر بيع المتر      │ 1,694 ر/م²              │ │
│ │ صافي الربح/م²      │ 221 ر/م²                │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

#### 4ب) استخدم API الموجود أو عدّله

اقرأ `packages/api/modules/quantities/procedures/markup.ts` الحالي. إذا كان كافياً استخدمه مباشرة. إذا احتاج تعديلات:

```typescript
// تأكد من وجود هذه الإجراءات (أو أنشئها):

// 1. getMarkupSettings(studyId)
// 2. setUniformMarkup(studyId, markupPercent, vatIncluded)
// 3. setSectionMarkups(studyId, markups: {section, markupPercent}[])
// 4. setManualItemPrices(studyId, items: {itemId, sellingPrice}[])
// 5. getProfitAnalysis(studyId)
//    يرجع: إجمالي التكلفة، سعر البيع، الهامش، تكلفة/م²، سعر/م²
```

#### 4ج) عدّل صفحة التسعير

**الملف:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[studyId]/pricing/page.tsx`

عدّلها لتستخدم `PricingPageContentV2`. التحقق: مرحلة تسعير التكلفة (COSTING) يجب أن تكون APPROVED.

---

## تعليمات عامة مهمة

### قواعد صارمة:
- **لا تحذف أي ملف أو مكوّن حالي** — أنشئ الجديد بجانبه (لذلك نستخدم -v2)
- **لا تكسر الصفحات الحالية** — الصفحات القديمة يجب أن تستمر بالعمل
- **لا تعدّل محركات الاشتقاق** (derivation-engine.ts و mep-derivation-engine.ts) — فقط اقرأ منهم
- **لا تحذف حقول قاعدة البيانات** — أضف الجديد فقط

### أسلوب الكود:
- التزم بأنماط المشروع الحالية (اقرأ ملفات مشابهة أولاً)
- استخدم shadcn/ui: Card, Table, Tabs, Dialog, Button, Input, Select, Badge, Accordion
- استخدم lucide-react للأيقونات
- كل النصوص بالعربية (RTL)
- استخدم ORPC (وليس tRPC)
- استخدم React Query (useQuery/useMutation)
- الأرقام تُعرض بتنسيق عربي: `toLocaleString('ar-SA')`
- العملة: ريال (ر.س)

### الترتيب:
1. قاعدة البيانات أولاً (المهمة 1)
2. ثم صفحة المواصفات + BOM (المهمة 2)
3. ثم صفحة تسعير التكلفة (المهمة 3)
4. ثم صفحة التسعير/الربح (المهمة 4)

بعد كل مهمة تأكد من `pnpm build` ثم انتقل للتالية.

### حجم المكونات:
كل ملف مكوّن يجب ألا يتجاوز 300 سطر. إذا كبر، قسّمه إلى مكونات فرعية.

### ملاحظة عن البيانات:
- الكميات (quantities) تأتي من StructuralItem + FinishingItem + MEPItem — **للقراءة فقط** في مراحل المواصفات والتكاليف
- المواصفات (specData) تُحفظ في FinishingItem.specData و MEPItem (الحقول ذات العلاقة)
- المواد المُجمّعة تُحفظ في جدول MaterialBOM الجديد
- العمالة تُحفظ في جدول CostingLabor الجديد
- أسعار المواد تُحفظ في MaterialBOM.unitPrice و MaterialBOM.totalPrice
- الهامش يُحفظ في CostStudy.uniformMarkupPercent أو SectionMarkup
