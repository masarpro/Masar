# 🎯 برومبت البناء الخلفي الكامل — Unified Quantities Engine (المراحل 1-5)

> **هذا برومبت طويل جداً ومتكامل.** يبني الخلفية الكاملة لمحرك حساب الكميات الموحَّد للتشطيبات والكهروميكانيكا، مع التسعير وعرض السعر، في **قسم واحد** بدلاً من 5 صفحات منفصلة.
>
> **ابدأ فوراً باستخدام `TodoWrite` لإنشاء قائمة مهام من 5 مهام رئيسية + Phase 0.**
>
> **الوقت المتوقع:** 6-8 ساعات (جلستين على الأقل).
>
> **النتيجة:** Schema + Catalog + Compute Engine + Pricing Engine + 20 API Endpoint، كلها مع tests.
>
> **الواجهة (Frontend) لا تُبنى في هذا البرومبت.** هي في برومبت منفصل لاحقاً.

---

## 📚 خلفية المشروع

### السياق
أنت تعمل على منصة **مسار** (Masar) — SaaS عربي للمقاولين السعوديين الصغار والمتوسطين. تقنياتها: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma + PostgreSQL (Supabase), oRPC + Hono, BetterAuth, Stripe.

**الموقع:** `D:\Masar\Masar` (Windows)

### المشكلة التي نحلّها
نظام التسعير الحالي مقسَّم إلى 5 صفحات منفصلة:
1. الكميات (Quantities)
2. المواصفات (Specifications)
3. التكلفة (Costing)
4. التسعير (Pricing)
5. عرض السعر (Quotation)

المقاول السعودي **لا يفكر بمراحل** — يفكر "أبي أسعر دهان 300 م² بربح 30%". النظام الحالي يفرض عليه التنقل بين 5 صفحات.

### الحل
محرك موحَّد يدمج كل شيء في **بطاقة بند واحدة** فيها 4 أقسام قابلة للطي:
- 📏 الكمية
- 📝 المواصفات
- 💰 التكلفة
- 📊 الربح والسعر النهائي

كل ذلك في صفحة الكميات نفسها. زر "إنشاء عرض سعر" يولّد PDF.

### المبادئ الخمسة الحاكمة
1. **البند هو الوحدة الذرية، لا المبنى** — يمكن تسعير بند واحد بدون أي معالج مبنى
2. **كل بند يعرف ماذا يسأل** — بند الدهان يسأل عن مساحة، بند المقابس يسأل عن عدد
3. **الذاكرة المشتركة ذكية وصريحة** — Context Drawer اختياري يقترح القيم بين البنود
4. **لا مبنى إجباري** — مساحة 500 م² مباشرة بدون أدوار
5. **محرك واحد للتشطيبات والـ MEP** — لا فرق معماري بين بلاط ونقطة كهرباء

---

## 🚨 القائمة الحمراء — ممنوع لمسها أبداً

```
packages/api/modules/quantities/engines/structural-calculations.ts
packages/api/modules/quantities/engines/derivation-engine.ts          ← اقرأ فقط (نستخرج المعادلات)
packages/api/modules/quantities/engines/mep-derivation-engine.ts      ← اقرأ فقط (نستخرج المعادلات)
apps/web/modules/saas/pricing/lib/structural-calculations.ts
apps/web/modules/saas/pricing/components/studies/sections/*
apps/web/modules/saas/pricing/components/studies/StructuralBuildingWizard.tsx
apps/web/modules/saas/pricing/components/studies/StructuralAccordion.tsx
apps/web/modules/saas/pricing/components/studies/BOQSummaryTable.tsx
apps/web/modules/saas/pricing/components/studies/PaintItemDialog.tsx   ← اقرأ فقط (نستخرج المواد)
apps/web/modules/saas/pricing/components/studies/PlasterItemDialog.tsx ← اقرأ فقط
packages/api/modules/quantities/procedures/structural-item-*
packages/api/modules/quantities/procedures/building-config-update.ts
packages/api/modules/quantities/procedures/finishing-item-*
packages/api/modules/quantities/procedures/mep-item-*
```

**يحق لك تعديل/إنشاء:**
- `packages/database/prisma/schema/*` (إضافة جداول جديدة فقط)
- `packages/api/modules/unified-quantities/**` (مودول جديد بالكامل)
- `packages/database/prisma/seeds/*` (seeds جديدة)

---

## ⚙️ قواعد بيئة المشروع (مهمة جداً)

### Windows PowerShell
- استخدم `;` لا `&&` كفاصل
- متغيرات البيئة: `$env:NAME = "value"` لا `export`
- حذف مجلدات: `Remove-Item -Recurse -Force` لا `rm -rf`

### أوامر Database الصحيحة
```powershell
pnpm --filter database push          # ليس db:push
pnpm --filter database generate      # ليس db:generate
pnpm --filter database studio        # لفتح Prisma Studio
```

### بعد كل `prisma generate`
ابحث عن السكربت الموجود فعلاً (قد يكون `fix-zod-decimal.mjs` أو `fix-zod-import.js`):
```powershell
Get-ChildItem -Path . -Filter "fix-zod-*" -Recurse -File | Select-Object FullName
```
ثم شغّله.

### TypeScript Check
```powershell
npx tsc --noEmit
```

### Tests
```powershell
pnpm test
```

### Decimal Fields
- في Prisma: `Decimal? @db.Decimal(15, 4)`
- في Zod: `z.union([z.string(), z.number()]).transform(Number)`
- في Default: `@default(30.0000)` (لا `"30"` ولا `30`)

### RTL Safe (للواجهة لاحقاً — لا تطبيقات هنا)
- `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`
- ممنوع `ml-`, `mr-`, `pl-`, `pr-`

### Multi-tenancy (لكل query)
```typescript
where: { organizationId: input.organizationId }
```

### Procedure Types
- Read: `protectedProcedure`
- Write: `subscriptionProcedure`
- لكل write: `verifyOrganizationAccess()`

---

## 🎬 ابدأ بهذا الإعلان

اكتب في ردك الأول:

```
✅ قرأت برومبت البناء الخلفي الكامل (المراحل 1-5).

سأنشئ قائمة TodoWrite بـ 6 مهام:
0. التشخيص الأولي
1. Schema + Migration
2. Catalog Enrichment
3. Compute Engine
4. Pricing Engine
5. API Endpoints

سأبدأ بـ Phase 0 (التشخيص) قبل أي تنفيذ.
الوقت المتوقع: 6-8 ساعات.
سأتوقف بعد كل مرحلة لتأكيدك قبل المتابعة.
```

ثم أنشئ Todos فوراً واتجه لـ Phase 0.

---

# 📍 Phase 0 — التشخيص الأولي (الأهم)

**هدف هذه المرحلة:** فهم الحالة الحالية بدقة قبل أي تنفيذ.

في الجلسة السابقة، اكتشف Claude Code أن Phase 1-7 المُفترض إنجازها فعلياً غير موجودة في `main`. **لا تفترض أي شيء**. تحقق من كل شيء.

## الخطوة 0.1 — تحقق من git

```powershell
git status
git log --oneline -20
git branch -a
```

**أبلغني إذا:**
- فيه تعديلات غير مرتبطة (uncommitted changes)
- فيه branch اسمه `unified-quantities` أو `phase-1` غير مدموج

## الخطوة 0.2 — تحقق من الـ Schema الحالي

ابحث عن ملف Schema:
```powershell
Get-ChildItem packages/database/prisma -Recurse -Filter "*.prisma" | Select-Object FullName
```

**النتائج المحتملة:**
- ملف واحد `schema.prisma` (~6,000+ سطر) — سننشئ ملف منفصل لجداولنا
- مجلد `schema/` فيه ملفات متعددة — سنضيف ملفنا الخاص

اقرأ Schema وابحث عن:
- نموذج `QuantityItem` — هل موجود؟
- نموذج `QuantityItemContext` — هل موجود؟
- نموذج `ItemCatalogEntry` — هل موجود؟
- نموذج `CostStudy` — موقعه؟ حقوله الحالية؟
- نموذج `Quote` — هل موجود؟
- نماذج قديمة `FinishingItem`, `MEPItem` — اقرأها لفهم الحقول

## الخطوة 0.3 — تحقق من API الحالي

```powershell
Get-ChildItem packages/api/modules -Directory | Select-Object Name
```

**ابحث عن:**
- مجلد `unified-quantities` — هل موجود؟
- مجلد `quantities` — اقرأ `router.ts` لفهم الـ procedures الحالية

## الخطوة 0.4 — تحقق من المحركات القديمة (للقراءة فقط)

```powershell
# هذه ملفات نقرأها فقط - في القائمة الحمراء
Get-ChildItem packages/api/modules/quantities/engines | Select-Object Name, Length
```

تأكد أن الملفات التالية موجودة (سنحتاجها للقراءة في Phase 2):
- `derivation-engine.ts`
- `mep-derivation-engine.ts`

## الخطوة 0.5 — تحقق من السكربت الذي يُصلِح Zod

```powershell
Get-ChildItem -Path . -Filter "fix-zod-*" -File | Select-Object Name
```

سجّل اسمه الفعلي (`fix-zod-decimal.mjs` أو `fix-zod-import.js` أو غيره).

## الخطوة 0.6 — تحقق من Decimal.js

```powershell
Select-String -Path "package.json","apps/web/package.json","packages/api/package.json" -Pattern "decimal"
```

نحتاج `decimal.js` للحسابات الدقيقة.

## ✅ ملخص Phase 0

اكتب لي بهذا الشكل:

```
═══════════════════════════════════════════════════════════════
  📊 Phase 0 — Diagnostic Report
═══════════════════════════════════════════════════════════════

🔍 Git State:
- Current branch: [اسم]
- Status: [clean / dirty]
- Uncommitted changes: [قائمة لو موجودة]

📂 Schema Structure:
- Schema location: [ملف واحد / مجلد]
- File path: [المسار الكامل]
- QuantityItem model: [exists / missing]
- QuantityItemContext: [exists / missing]
- ItemCatalogEntry: [exists / missing]
- Quote model: [exists / missing]
- CostStudy location: [المسار]
- CostStudy fields: [قائمة موجزة]
- FinishingItem fields: [قائمة موجزة - للمرجع]
- MEPItem fields: [قائمة موجزة - للمرجع]

🔧 API Modules:
- unified-quantities module: [exists / missing]
- quantities module router endpoints: [العدد التقريبي]

📚 Old Engines (read-only):
- derivation-engine.ts: [حجم بالأسطر]
- mep-derivation-engine.ts: [حجم بالأسطر]

🔨 Build Tools:
- Zod fix script name: [الاسم الفعلي]
- decimal.js available: [yes / no]

🎯 Plan Confirmation:
بناء على ما وجدت، سأبدأ Phase 1 بـ:
- إنشاء/توسيع schema لـ: [قائمة الجداول]
- إذا CostStudy موجود → سأضيف حقول جديدة فقط
- إذا QuantityItem غير موجود → سأنشئه من الصفر

⏸ في انتظار تأكيدك للبدء بـ Phase 1.
```

**توقف هنا حتى أؤكد لك.**

---

# 📍 Phase 1 — Schema + Migration

**الهدف:** إنشاء 5 جداول جديدة + توسيع `CostStudy`، مع migration نظيف.

**المدة المتوقعة:** 60-90 دقيقة.

## 1.1 — إنشاء ملف Schema الخاص بنا

أنشئ ملف:
```
packages/database/prisma/schema/unified-quantities.prisma
```

(إذا الـ schema ملف واحد `schema.prisma`، أضف الجداول في نهايته في قسم محدَّد بتعليق `// ═══ UNIFIED QUANTITIES ENGINE ═══`)

## 1.2 — نموذج `QuantityItem` (الجدول الرئيسي)

```prisma
model QuantityItem {
  id             String   @id @default(cuid())
  costStudyId    String
  organizationId String

  // === التصنيف ===
  domain         String   // "FINISHING" | "MEP" | "EXTERIOR" | "SPECIAL"
  categoryKey    String   // "paint" | "plaster" | "ceramic" | "electrical_outlet" | ...
  catalogItemKey String   // "finishing.paint.interior" | ...

  // === العرض والترتيب ===
  displayName    String
  sortOrder      Int      @default(0)
  isEnabled      Boolean  @default(true)

  // === الأبعاد المرنة ===
  // 3 قيم رقمية مرنة - معناها يعتمد على calculationMethod
  primaryValue   Decimal? @db.Decimal(15, 4)
  secondaryValue Decimal? @db.Decimal(15, 4)
  tertiaryValue  Decimal? @db.Decimal(15, 4)

  // === طريقة الحساب ===
  calculationMethod String  // 8 طرق: direct_area, length_x_height, length_only,
                             //         per_unit, per_room, polygon, manual, lump_sum

  // === الكمية والوحدة ===
  unit              String   // "m²" | "m" | "unit" | "lump_sum"
  computedQuantity  Decimal  @db.Decimal(15, 4) @default(0)  // قبل الهدر
  wastagePercent    Decimal  @db.Decimal(5, 2) @default(10)
  effectiveQuantity Decimal  @db.Decimal(15, 4) @default(0)  // بعد الهدر

  // === ربط بالسياق المشترك (اختياري) ===
  contextSpaceId String?
  contextScope   String?  // "whole_building" | "per_floor" | "per_room" | "standalone"

  // === خصم الفتحات ===
  deductOpenings Boolean  @default(false)
  openingsArea   Decimal? @db.Decimal(15, 4)

  // === Polygon support (للأشكال غير المنتظمة) ===
  polygonPoints  Json?    // [{x, y}, ...] - للحساب بـ Shoelace formula

  // === ربط بين البنود (Linked Items) ===
  linkedFromItemId String?
  linkQuantityFormula String? // "SAME" | "MINUS_WET_AREAS" | "PLUS_PERCENT"
  linkPercentValue Decimal? @db.Decimal(5, 2)

  // === المواصفات (Specifications) ===
  specMaterialName  String?  @db.VarChar(200)
  specMaterialBrand String?  @db.VarChar(100)
  specMaterialGrade String?  @db.VarChar(50)
  specColor         String?  @db.VarChar(50)
  specSource        String?  @db.VarChar(50)  // "local" | "imported"
  specNotes         String?  @db.Text

  // === التكلفة ===
  materialUnitPrice Decimal? @db.Decimal(15, 4)
  laborUnitPrice    Decimal? @db.Decimal(15, 4)
  materialCost      Decimal? @db.Decimal(15, 2)  // cached
  laborCost         Decimal? @db.Decimal(15, 2)  // cached
  totalCost         Decimal? @db.Decimal(15, 2)  // cached

  // === الربح والتسعير ===
  markupMethod        String   @default("percentage")
  // "percentage" | "fixed_amount" | "manual_price"

  markupPercent       Decimal? @db.Decimal(7, 4)
  markupFixedAmount   Decimal? @db.Decimal(15, 4)
  manualUnitPrice     Decimal? @db.Decimal(15, 4)

  // === النتائج المحسوبة ===
  sellUnitPrice    Decimal? @db.Decimal(15, 4)  // cached
  sellTotalAmount  Decimal? @db.Decimal(15, 2)  // cached
  profitAmount     Decimal? @db.Decimal(15, 2)  // cached
  profitPercent    Decimal? @db.Decimal(7, 4)   // cached

  // === التحكم بالهامش ===
  hasCustomMarkup  Boolean @default(false)

  // === ملاحظات عامة ===
  notes  String? @db.Text

  // === Audit ===
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  updatedById String?

  // === Relations ===
  costStudy      CostStudy             @relation(fields: [costStudyId], references: [id], onDelete: Cascade)
  organization   Organization          @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  contextSpace   QuantityContextSpace? @relation(fields: [contextSpaceId], references: [id], onDelete: SetNull)
  linkedFromItem QuantityItem?         @relation("LinkedItems", fields: [linkedFromItemId], references: [id], onDelete: SetNull)
  linkedItems    QuantityItem[]        @relation("LinkedItems")

  // === Indexes ===
  @@index([organizationId])
  @@index([costStudyId])
  @@index([costStudyId, domain])
  @@index([costStudyId, categoryKey])
  @@index([costStudyId, hasCustomMarkup])
  @@index([linkedFromItemId])
  @@index([contextSpaceId])
}
```

## 1.3 — نموذج `QuantityItemContext`

```prisma
model QuantityItemContext {
  id             String  @id @default(cuid())
  costStudyId    String  @unique  // 1:1 مع الدراسة
  organizationId String

  // === المساحات الكلية (اختيارية كلها) ===
  totalFloorArea        Decimal? @db.Decimal(15, 4)
  totalWallArea         Decimal? @db.Decimal(15, 4)
  totalExteriorWallArea Decimal? @db.Decimal(15, 4)
  totalRoofArea         Decimal? @db.Decimal(15, 4)
  totalPerimeter        Decimal? @db.Decimal(15, 4)
  averageFloorHeight    Decimal? @db.Decimal(8, 2)

  // === فلاغات المبنى ===
  hasBasement Boolean @default(false)
  hasRoof     Boolean @default(true)
  hasYard     Boolean @default(false)

  // === الحوش والسور (لو موجودة) ===
  yardArea    Decimal? @db.Decimal(15, 4)
  fenceLength Decimal? @db.Decimal(15, 4)

  // === ملاحظات ===
  generalNotes String? @db.Text

  // === Audit ===
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // === Relations ===
  costStudy    CostStudy                @relation(fields: [costStudyId], references: [id], onDelete: Cascade)
  organization Organization             @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  spaces       QuantityContextSpace[]
  openings     QuantityContextOpening[]

  @@index([organizationId])
}
```

## 1.4 — نموذج `QuantityContextSpace` (الغرف الاختيارية)

```prisma
model QuantityContextSpace {
  id             String @id @default(cuid())
  contextId      String
  organizationId String

  // === التعريف ===
  name       String  // "صالة المعيشة" | "المطبخ" | ...
  spaceType  String  // "room" | "corridor" | "stairs" | "balcony" | "exterior" | "custom"
  floorLabel String? // "الأرضي" | "الأول" | ...

  // === الأبعاد (مرنة - يمكن إدخال بعضها فقط) ===
  length        Decimal? @db.Decimal(8, 2)
  width         Decimal? @db.Decimal(8, 2)
  height        Decimal? @db.Decimal(8, 2)
  floorArea     Decimal? @db.Decimal(15, 4)  // يدوياً للأشكال غير المنتظمة
  wallPerimeter Decimal? @db.Decimal(15, 4)

  // === Polygon (للأشكال غير المنتظمة) ===
  polygonPoints Json?

  // === المحسوبة تلقائياً ===
  computedFloorArea Decimal? @db.Decimal(15, 4)
  computedWallArea  Decimal? @db.Decimal(15, 4)

  // === Flags ===
  isWetArea  Boolean @default(false) // مطبخ/حمام
  isExterior Boolean @default(false)

  // === Order ===
  sortOrder Int @default(0)

  // === Audit ===
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // === Relations ===
  context      QuantityItemContext @relation(fields: [contextId], references: [id], onDelete: Cascade)
  organization Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  items        QuantityItem[]

  @@index([organizationId])
  @@index([contextId])
}
```

## 1.5 — نموذج `QuantityContextOpening` (الفتحات)

```prisma
model QuantityContextOpening {
  id             String @id @default(cuid())
  contextId      String
  organizationId String

  // === التعريف ===
  name        String  // "باب رئيسي" | "نافذة المطبخ" | ...
  openingType String  // "door" | "window" | "arch" | "skylight" | "custom"

  // === الأبعاد ===
  width        Decimal @db.Decimal(6, 2)
  height       Decimal @db.Decimal(6, 2)
  computedArea Decimal @db.Decimal(10, 4)  // width × height
  count        Int     @default(1)

  // === Flags ===
  isExterior                 Boolean @default(false)
  deductFromInteriorFinishes Boolean @default(true)

  // === ربط بمساحة معينة (اختياري) ===
  spaceId String?

  // === Audit ===
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // === Relations ===
  context      QuantityItemContext @relation(fields: [contextId], references: [id], onDelete: Cascade)
  organization Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([contextId])
}
```

## 1.6 — نموذج `ItemCatalogEntry` (الكتالوج المرجعي)

```prisma
model ItemCatalogEntry {
  id             String  @id @default(cuid())
  itemKey        String  @unique  // "finishing.paint.interior"

  // === التصنيف ===
  domain         String  // "FINISHING" | "MEP" | "EXTERIOR" | "SPECIAL"
  categoryKey    String
  subcategoryKey String?

  // === التسمية ===
  nameAr        String
  nameEn        String
  descriptionAr String? @db.Text
  descriptionEn String? @db.Text

  // === العرض ===
  icon  String  // lucide icon name
  color String? // hex

  // === افتراضيات الحساب ===
  unit                     String
  defaultWastagePercent    Decimal @db.Decimal(5, 2) @default(10)
  defaultCalculationMethod String

  // === الحقول المطلوبة (schema للإدخال) ===
  requiredFields Json
  // مثال: { "primary": { "key": "area", "label": "المساحة", "unit": "m²" } }

  // === افتراضيات التسعير ===
  defaultMaterialUnitPrice Decimal? @db.Decimal(15, 4)
  defaultLaborUnitPrice    Decimal? @db.Decimal(15, 4)

  // === المواد الشائعة ===
  commonMaterials Json?
  // مثال: [{ "nameAr": "جوتن ملكي", "brand": "Jotun", "grade": "فاخر", "suggestedPrice": 25 }]

  // === الألوان الشائعة ===
  commonColors Json?

  // === الاشتقاقات (Linked Items) ===
  linkableFrom String[] // ["finishing.plaster.interior"]

  // === Metadata من المحرك القديم ===
  legacyDerivationType String? // للتتبع
  legacyScope          String?

  // === الترتيب والحالة ===
  displayOrder Int     @default(0)
  isActive     Boolean @default(true)

  // === Audit ===
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([domain])
  @@index([categoryKey])
  @@index([itemKey])
  @@index([isActive, displayOrder])
}
```

## 1.7 — توسيع `CostStudy`

**⚠️ افتح ملف CostStudy أولاً وتحقق من الحقول الموجودة.** أضف فقط الحقول الناقصة.

الحقول المطلوب إضافتها:

```prisma
// === Phase 1 — Unified Quantities Settings ===
globalMarkupPercent Decimal @db.Decimal(7, 4) @default(30.0000)
globalMarkupMethod  String  @default("percentage")

// === VAT Settings ===
includeVAT          Boolean @default(true)
vatIncludedInPrices Boolean @default(false)
vatPercent          Decimal @db.Decimal(5, 2) @default(15.00)

// === إجماليات Cached (تُحدَّث عند كل تعديل) ===
totalMaterialCost  Decimal @db.Decimal(15, 2) @default(0.00)
totalLaborCost     Decimal @db.Decimal(15, 2) @default(0.00)
totalGrossCost     Decimal @db.Decimal(15, 2) @default(0.00)
totalSellAmount    Decimal @db.Decimal(15, 2) @default(0.00)
totalProfitAmount  Decimal @db.Decimal(15, 2) @default(0.00)
totalProfitPercent Decimal @db.Decimal(7, 4)  @default(0.0000)

// === Relations الجديدة ===
quantityItems   QuantityItem[]
quantityContext QuantityItemContext?
```

**هل CostStudy له `Organization` relation؟ تأكد ولا تُعدِّله.**

## 1.8 — تطبيق التغييرات

```powershell
# Format
pnpm --filter database exec prisma format

# Push to DB (احذر: قد يطلب confirmation لو فيه data loss)
pnpm --filter database push

# Generate
pnpm --filter database generate

# Fix Zod (استخدم الاسم الفعلي من Phase 0)
node fix-zod-decimal.mjs   # أو الاسم الذي وجدته

# Type check
npx tsc --noEmit

# Tests
pnpm test
```

**إذا `push` قال "data loss":**
- توقف فوراً
- اقرأ الرسالة بدقة
- أخبرني بالنص الكامل قبل المتابعة

## 1.9 — تحقق من Prisma Studio

```powershell
pnpm --filter database studio
```

افتح http://localhost:5555 وتحقق:
- ✅ `QuantityItem` موجود
- ✅ `QuantityItemContext` موجود
- ✅ `QuantityContextSpace` موجود
- ✅ `QuantityContextOpening` موجود
- ✅ `ItemCatalogEntry` موجود
- ✅ `CostStudy` فيه الحقول الجديدة
- ✅ كل الـ defaults صحيحة

## ✅ معايير اجتياز Phase 1

```
✅ Phase 1 Complete — Schema:

📊 جداول جديدة (5):
- QuantityItem ✓
- QuantityItemContext ✓
- QuantityContextSpace ✓
- QuantityContextOpening ✓
- ItemCatalogEntry ✓

📊 توسيع CostStudy:
- globalMarkupPercent ✓
- إجماليات cached (6 حقول) ✓
- إعدادات VAT ✓
- Relations جديدة ✓

🔧 Build Status:
- prisma format: ✓
- prisma push: ✓ (no data loss)
- prisma generate: ✓
- fix-zod-*: ✓
- tsc --noEmit: ✓ zero errors
- pnpm test: ✓ all passing

📦 Git:
- Commit: feat(unified-quantities): Phase 1 - Schema foundation
- Files: [قائمة]

⏸ في انتظار تأكيدك للبدء بـ Phase 2.
```

**توقف هنا حتى أؤكد.**

---

# 📍 Phase 2 — Catalog Enrichment

**الهدف:** بناء كتالوج بـ 80+ بند، مستخرَج من المحرك القديم + إضافات السوق السعودي.

**المدة المتوقعة:** 90-120 دقيقة.

## 2.1 — بنية المجلد

أنشئ:
```
packages/api/modules/unified-quantities/
└── catalog/
    ├── types.ts              (~150 سطر)
    ├── finishing/
    │   ├── plaster.ts        (~100 سطر) - 4 بنود
    │   ├── paint.ts          (~120 سطر) - 6 بنود
    │   ├── flooring.ts       (~150 سطر) - 8 بنود
    │   ├── walls.ts          (~120 سطر) - 6 بنود
    │   ├── ceiling.ts        (~80 سطر) - 4 بنود
    │   ├── doors.ts          (~100 سطر) - 6 بنود
    │   ├── windows.ts        (~80 سطر) - 4 بنود
    │   ├── insulation.ts     (~100 سطر) - 5 بنود
    │   ├── cladding.ts       (~80 سطر) - 4 بنود
    │   ├── trim.ts           (~60 سطر) - 4 بنود
    │   └── kitchen.ts        (~80 سطر) - 3 بنود
    ├── mep/
    │   ├── electrical.ts     (~150 سطر) - 12 بنود
    │   ├── plumbing.ts       (~150 سطر) - 10 بنود
    │   ├── hvac.ts           (~100 سطر) - 6 بنود
    │   ├── firefighting.ts   (~80 سطر) - 5 بنود
    │   └── low-current.ts    (~80 سطر) - 5 بنود
    ├── exterior.ts           (~120 سطر) - 6 بنود
    ├── special.ts            (~80 سطر) - 4 بنود
    ├── presets.ts            (~150 سطر) - 8 باقات
    └── index.ts              (~60 سطر) - barrel export
```

**ملاحظة:** كل ملف < 200 سطر. لو كبر، قسِّمه.

## 2.2 — `types.ts`

```typescript
import { z } from "zod";

export type CalculationMethod =
  | "direct_area"
  | "length_x_height"
  | "length_only"
  | "per_unit"
  | "per_room"
  | "polygon"
  | "manual"
  | "lump_sum";

export type Domain = "FINISHING" | "MEP" | "EXTERIOR" | "SPECIAL";

export interface RequiredField {
  key: string;
  label: string;
  unit: string;
  defaultSuggestion?: string;  // "fromContext.totalFloorArea" | "linkFrom:itemKey"
  min?: number;
  max?: number;
}

export interface RequiredFieldsSchema {
  primary: RequiredField;
  secondary?: RequiredField;
  tertiary?: RequiredField;
}

export interface CommonMaterial {
  nameAr: string;
  nameEn: string;
  brand?: string;
  grade?: string;       // "فاخر" | "عادي" | "اقتصادي"
  suggestedPrice?: number;
  source?: "local" | "imported";
}

export interface CommonColor {
  nameAr: string;
  nameEn: string;
  hexValue?: string;
}

export interface CatalogEntry {
  itemKey: string;
  domain: Domain;
  categoryKey: string;
  subcategoryKey?: string;

  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;

  icon: string;
  color?: string;

  unit: string;
  defaultWastagePercent: number;
  defaultCalculationMethod: CalculationMethod;
  requiredFields: RequiredFieldsSchema;

  defaultMaterialUnitPrice?: number;
  defaultLaborUnitPrice?: number;

  commonMaterials?: CommonMaterial[];
  commonColors?: CommonColor[];

  linkableFrom?: string[];

  legacyDerivationType?: string;
  legacyScope?: string;

  displayOrder: number;
}

export interface PresetEntry {
  key: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  icon: string;
  itemKeys: string[];  // قائمة catalogItemKey
}
```

## 2.3 — قراءة المحرك القديم لاستخراج البنود

**اقرأ هذه الملفات (للقراءة فقط):**
```powershell
type packages\api\modules\quantities\engines\derivation-engine.ts | Select-Object -First 500
type packages\api\modules\quantities\engines\mep-derivation-engine.ts | Select-Object -First 500
type apps\web\modules\saas\pricing\components\studies\PaintItemDialog.tsx | Select-Object -First 200
```

**استخرج:**
- اسم كل فئة (categoryKey)
- الـ subcategory
- الـ unit
- نسبة الهدر الافتراضية
- المواد والماركات (من Paint/Plaster Dialogs)
- أي أسعار افتراضية

## 2.4 — مثال كامل: `finishing/paint.ts`

```typescript
import type { CatalogEntry } from "../types";

export const PAINT_CATALOG: CatalogEntry[] = [
  {
    itemKey: "finishing.paint.interior",
    domain: "FINISHING",
    categoryKey: "paint",
    subcategoryKey: "interior",

    nameAr: "دهان داخلي",
    nameEn: "Interior Paint",
    descriptionAr: "دهان جدران الغرف والممرات الداخلية",
    descriptionEn: "Interior walls paint for rooms and corridors",

    icon: "Palette",
    color: "#10b981",

    unit: "m²",
    defaultWastagePercent: 10,
    defaultCalculationMethod: "direct_area",
    requiredFields: {
      primary: {
        key: "area",
        label: "مساحة الدهان",
        unit: "m²",
        defaultSuggestion: "linkFrom:finishing.plaster.interior",
      },
    },

    // أسعار السوق السعودي (متوسطات تقديرية)
    defaultMaterialUnitPrice: 18,  // ر.س/م²
    defaultLaborUnitPrice: 7,      // ر.س/م²

    commonMaterials: [
      { nameAr: "جوتن ملكي فاخر", nameEn: "Jotun Royale Premium", brand: "Jotun", grade: "فاخر", suggestedPrice: 25, source: "imported" },
      { nameAr: "جوتن ريجال", nameEn: "Jotun Regal", brand: "Jotun", grade: "عادي", suggestedPrice: 18, source: "imported" },
      { nameAr: "SCIB Super", nameEn: "SCIB Super", brand: "SCIB", grade: "عادي", suggestedPrice: 15, source: "local" },
      { nameAr: "Caparol Premium", nameEn: "Caparol Premium", brand: "Caparol", grade: "فاخر", suggestedPrice: 28, source: "imported" },
      { nameAr: "ناشيونال بنت", nameEn: "National Paint", brand: "National", grade: "اقتصادي", suggestedPrice: 12, source: "local" },
    ],

    commonColors: [
      { nameAr: "أبيض", nameEn: "White", hexValue: "#FFFFFF" },
      { nameAr: "بيج فاتح", nameEn: "Light Beige", hexValue: "#F5F5DC" },
      { nameAr: "رمادي فاتح", nameEn: "Light Gray", hexValue: "#D3D3D3" },
      { nameAr: "أوف وايت", nameEn: "Off White", hexValue: "#FAF9F6" },
    ],

    linkableFrom: ["finishing.plaster.interior"],

    legacyDerivationType: "direct_area",
    legacyScope: "per_floor",

    displayOrder: 200,
  },

  {
    itemKey: "finishing.paint.exterior",
    domain: "FINISHING",
    categoryKey: "paint",
    subcategoryKey: "exterior",

    nameAr: "دهان خارجي",
    nameEn: "Exterior Paint",
    descriptionAr: "دهان الواجهات الخارجية للمبنى",

    icon: "Palette",
    color: "#0ea5e9",

    unit: "m²",
    defaultWastagePercent: 12,
    defaultCalculationMethod: "direct_area",
    requiredFields: {
      primary: {
        key: "area",
        label: "مساحة الدهان الخارجي",
        unit: "m²",
        defaultSuggestion: "linkFrom:finishing.plaster.exterior",
      },
    },

    defaultMaterialUnitPrice: 28,
    defaultLaborUnitPrice: 10,

    commonMaterials: [
      { nameAr: "جوتن جوتاشيلد", nameEn: "Jotun Jotashield", brand: "Jotun", grade: "فاخر", suggestedPrice: 45, source: "imported" },
      { nameAr: "Caparol Amphibolin", brand: "Caparol", grade: "فاخر", suggestedPrice: 50, source: "imported" },
      { nameAr: "SCIB Weathercoat", brand: "SCIB", grade: "عادي", suggestedPrice: 30, source: "local" },
    ],

    linkableFrom: ["finishing.plaster.exterior"],
    legacyDerivationType: "direct_area",
    legacyScope: "external",
    displayOrder: 210,
  },

  // ... 4 بنود دهان أخرى:
  // finishing.paint.decorative
  // finishing.paint.wood
  // finishing.paint.metal
  // finishing.paint.epoxy_floor
];
```

## 2.5 — استمر مع باقي الفئات

اتبع نفس النمط لكل ملف:

### `finishing/plaster.ts` (4 بنود)
- finishing.plaster.interior (لياسة داخلية)
- finishing.plaster.exterior (لياسة خارجية)
- finishing.plaster.repair (ترميم لياسة)
- finishing.plaster.decorative (لياسة ديكور)

### `finishing/flooring.ts` (8 بنود)
- finishing.flooring.ceramic
- finishing.flooring.porcelain
- finishing.flooring.marble
- finishing.flooring.granite
- finishing.flooring.parquet
- finishing.flooring.epoxy
- finishing.flooring.vinyl
- finishing.flooring.terrazzo

### `finishing/walls.ts` (6 بنود)
- finishing.walls.kitchen_ceramic
- finishing.walls.bathroom_ceramic
- finishing.walls.gypsum_board
- finishing.walls.wallpaper
- finishing.walls.wood_panel
- finishing.walls.stone_cladding_interior

### `finishing/ceiling.ts` (4 بنود)
- finishing.ceiling.gypsum_board
- finishing.ceiling.metal_grid
- finishing.ceiling.decorative
- finishing.ceiling.acoustic

### `finishing/doors.ts` (6 بنود)
- finishing.doors.interior_wood
- finishing.doors.hdf
- finishing.doors.exterior_steel
- finishing.doors.fire_rated
- finishing.doors.glass
- finishing.doors.aluminum

### `finishing/windows.ts` (4 بنود)
- finishing.windows.aluminum
- finishing.windows.upvc
- finishing.windows.steel_security
- finishing.windows.shutters

### `finishing/insulation.ts` (5 بنود)
- finishing.insulation.thermal_roof
- finishing.insulation.waterproof_roof
- finishing.insulation.thermal_walls
- finishing.insulation.acoustic
- finishing.insulation.foundation

### `finishing/cladding.ts` (4 بنود)
- finishing.cladding.marble_facade
- finishing.cladding.natural_stone
- finishing.cladding.alucobond
- finishing.cladding.hpl

### `finishing/trim.ts` (4 بنود)
- finishing.trim.ceramic_skirting
- finishing.trim.wood_skirting
- finishing.trim.cornices
- finishing.trim.molding

### `finishing/kitchen.ts` (3 بنود)
- finishing.kitchen.cabinets
- finishing.kitchen.countertop
- finishing.kitchen.backsplash

### `mep/electrical.ts` (12 بند)
- mep.electrical.outlet_normal (مقبس عادي)
- mep.electrical.outlet_3phase (مقبس 3 فاز)
- mep.electrical.outlet_industrial
- mep.electrical.lighting_ceiling
- mep.electrical.lighting_wall
- mep.electrical.lighting_outdoor
- mep.electrical.switch_single
- mep.electrical.switch_double
- mep.electrical.main_panel
- mep.electrical.sub_panel
- mep.electrical.cable_run (كابل/متر)
- mep.electrical.grounding_system

### `mep/plumbing.ts` (10 بنود)
- mep.plumbing.cold_water_point
- mep.plumbing.hot_water_point
- mep.plumbing.drainage_kitchen
- mep.plumbing.drainage_bathroom
- mep.plumbing.water_heater_electric
- mep.plumbing.water_heater_solar
- mep.plumbing.water_tank
- mep.plumbing.pump
- mep.plumbing.pipe_run
- mep.plumbing.fittings_set

### `mep/hvac.ts` (6 بنود)
- mep.hvac.split_unit
- mep.hvac.window_unit
- mep.hvac.central_unit
- mep.hvac.duct_run
- mep.hvac.exhaust_fan
- mep.hvac.ventilation_grille

### `mep/firefighting.ts` (5 بنود)
- mep.firefighting.sprinkler
- mep.firefighting.smoke_detector
- mep.firefighting.heat_detector
- mep.firefighting.extinguisher
- mep.firefighting.fire_panel

### `mep/low-current.ts` (5 بنود)
- mep.low_current.cctv_camera
- mep.low_current.intercom
- mep.low_current.internet_point
- mep.low_current.tv_outlet
- mep.low_current.access_control

### `exterior.ts` (6 بنود)
- exterior.boundary_wall (سور خارجي/متر)
- exterior.main_gate (بوابة رئيسية)
- exterior.secondary_gate (بوابة جانبية)
- exterior.driveway (ممر سيارات)
- exterior.landscaping (تنسيق حدائق)
- exterior.swimming_pool (مسبح)

### `special.ts` (4 بنود)
- special.elevator (مصعد)
- special.water_storage_tank (خزان مياه)
- special.septic_tank (بيارة)
- special.solar_panels (ألواح شمسية)

## 2.6 — `presets.ts` (8 باقات)

```typescript
import type { PresetEntry } from "./types";

export const PRESETS: PresetEntry[] = [
  {
    key: "villa_standard",
    nameAr: "فيلا سكنية نموذجية",
    nameEn: "Standard Villa",
    descriptionAr: "تشطيب قياسي + كهرباء وسباكة وتكييف",
    icon: "Home",
    itemKeys: [
      "finishing.plaster.interior",
      "finishing.plaster.exterior",
      "finishing.paint.interior",
      "finishing.paint.exterior",
      "finishing.flooring.ceramic",
      "finishing.ceiling.gypsum_board",
      "finishing.doors.interior_wood",
      "finishing.windows.aluminum",
      "finishing.insulation.thermal_roof",
      "finishing.insulation.waterproof_roof",
      "finishing.kitchen.cabinets",
      "mep.electrical.outlet_normal",
      "mep.electrical.lighting_ceiling",
      "mep.electrical.main_panel",
      "mep.plumbing.cold_water_point",
      "mep.plumbing.drainage_bathroom",
      "mep.plumbing.water_heater_electric",
      "mep.hvac.split_unit",
    ],
  },
  {
    key: "apartment_standard",
    nameAr: "شقة سكنية",
    nameEn: "Standard Apartment",
    icon: "Building",
    itemKeys: [
      "finishing.plaster.interior",
      "finishing.paint.interior",
      "finishing.flooring.ceramic",
      "finishing.ceiling.gypsum_board",
      "finishing.doors.interior_wood",
      "finishing.kitchen.cabinets",
      "mep.electrical.outlet_normal",
      "mep.electrical.lighting_ceiling",
      "mep.plumbing.cold_water_point",
      "mep.plumbing.drainage_bathroom",
      "mep.hvac.split_unit",
    ],
  },
  {
    key: "warehouse_minimal",
    nameAr: "مستودع تجاري",
    nameEn: "Commercial Warehouse",
    icon: "Warehouse",
    itemKeys: [
      "finishing.plaster.interior",
      "finishing.paint.interior",
      "finishing.flooring.epoxy",
      "mep.electrical.outlet_industrial",
      "mep.electrical.lighting_ceiling",
      "mep.firefighting.sprinkler",
    ],
  },
  {
    key: "shop_retail",
    nameAr: "محل تجاري",
    nameEn: "Retail Shop",
    icon: "Store",
    itemKeys: [
      "finishing.plaster.interior",
      "finishing.paint.interior",
      "finishing.flooring.porcelain",
      "finishing.ceiling.gypsum_board",
      "mep.electrical.outlet_normal",
      "mep.electrical.lighting_ceiling",
      "mep.hvac.split_unit",
      "mep.firefighting.smoke_detector",
    ],
  },
  {
    key: "office_standard",
    nameAr: "مكتب إداري",
    nameEn: "Standard Office",
    icon: "Briefcase",
    itemKeys: [
      "finishing.plaster.interior",
      "finishing.paint.interior",
      "finishing.flooring.vinyl",
      "finishing.ceiling.acoustic",
      "mep.electrical.outlet_normal",
      "mep.electrical.lighting_ceiling",
      "mep.hvac.central_unit",
      "mep.low_current.internet_point",
    ],
  },
  {
    key: "paint_only",
    nameAr: "دهان فقط",
    nameEn: "Paint Only",
    icon: "Palette",
    itemKeys: ["finishing.paint.interior"],
  },
  {
    key: "tiles_only",
    nameAr: "بلاط فقط",
    nameEn: "Tiles Only",
    icon: "Grid3x3",
    itemKeys: ["finishing.flooring.ceramic"],
  },
  {
    key: "mep_only",
    nameAr: "كهروميكانيكا فقط",
    nameEn: "MEP Only",
    icon: "Zap",
    itemKeys: [
      "mep.electrical.outlet_normal",
      "mep.electrical.lighting_ceiling",
      "mep.plumbing.cold_water_point",
      "mep.hvac.split_unit",
    ],
  },
];
```

## 2.7 — `index.ts` (Barrel Export)

```typescript
import type { CatalogEntry, PresetEntry } from "./types";

import { PLASTER_CATALOG } from "./finishing/plaster";
import { PAINT_CATALOG } from "./finishing/paint";
import { FLOORING_CATALOG } from "./finishing/flooring";
import { WALLS_CATALOG } from "./finishing/walls";
import { CEILING_CATALOG } from "./finishing/ceiling";
import { DOORS_CATALOG } from "./finishing/doors";
import { WINDOWS_CATALOG } from "./finishing/windows";
import { INSULATION_CATALOG } from "./finishing/insulation";
import { CLADDING_CATALOG } from "./finishing/cladding";
import { TRIM_CATALOG } from "./finishing/trim";
import { KITCHEN_CATALOG } from "./finishing/kitchen";

import { ELECTRICAL_CATALOG } from "./mep/electrical";
import { PLUMBING_CATALOG } from "./mep/plumbing";
import { HVAC_CATALOG } from "./mep/hvac";
import { FIREFIGHTING_CATALOG } from "./mep/firefighting";
import { LOW_CURRENT_CATALOG } from "./mep/low-current";

import { EXTERIOR_CATALOG } from "./exterior";
import { SPECIAL_CATALOG } from "./special";

import { PRESETS } from "./presets";

export const FULL_CATALOG: CatalogEntry[] = [
  ...PLASTER_CATALOG,
  ...PAINT_CATALOG,
  ...FLOORING_CATALOG,
  ...WALLS_CATALOG,
  ...CEILING_CATALOG,
  ...DOORS_CATALOG,
  ...WINDOWS_CATALOG,
  ...INSULATION_CATALOG,
  ...CLADDING_CATALOG,
  ...TRIM_CATALOG,
  ...KITCHEN_CATALOG,
  ...ELECTRICAL_CATALOG,
  ...PLUMBING_CATALOG,
  ...HVAC_CATALOG,
  ...FIREFIGHTING_CATALOG,
  ...LOW_CURRENT_CATALOG,
  ...EXTERIOR_CATALOG,
  ...SPECIAL_CATALOG,
];

export { PRESETS };
export type { CatalogEntry, PresetEntry };

// Helper functions
export function getCatalogEntry(itemKey: string): CatalogEntry | undefined {
  return FULL_CATALOG.find(e => e.itemKey === itemKey);
}

export function getCatalogByDomain(domain: string): CatalogEntry[] {
  return FULL_CATALOG.filter(e => e.domain === domain);
}

export function getPreset(key: string): PresetEntry | undefined {
  return PRESETS.find(p => p.key === key);
}
```

## 2.8 — Seed للكتالوج

أنشئ:
```
packages/database/seeds/catalog-seed.ts
```

```typescript
import { db } from "../prisma/client";
import { FULL_CATALOG } from "@repo/api/modules/unified-quantities/catalog";

export async function seedCatalog() {
  console.log(`🌱 Seeding ${FULL_CATALOG.length} catalog entries...`);

  for (const entry of FULL_CATALOG) {
    await db.itemCatalogEntry.upsert({
      where: { itemKey: entry.itemKey },
      create: {
        itemKey: entry.itemKey,
        domain: entry.domain,
        categoryKey: entry.categoryKey,
        subcategoryKey: entry.subcategoryKey ?? null,
        nameAr: entry.nameAr,
        nameEn: entry.nameEn,
        descriptionAr: entry.descriptionAr ?? null,
        descriptionEn: entry.descriptionEn ?? null,
        icon: entry.icon,
        color: entry.color ?? null,
        unit: entry.unit,
        defaultWastagePercent: entry.defaultWastagePercent,
        defaultCalculationMethod: entry.defaultCalculationMethod,
        requiredFields: entry.requiredFields as any,
        defaultMaterialUnitPrice: entry.defaultMaterialUnitPrice ?? null,
        defaultLaborUnitPrice: entry.defaultLaborUnitPrice ?? null,
        commonMaterials: (entry.commonMaterials ?? null) as any,
        commonColors: (entry.commonColors ?? null) as any,
        linkableFrom: entry.linkableFrom ?? [],
        legacyDerivationType: entry.legacyDerivationType ?? null,
        legacyScope: entry.legacyScope ?? null,
        displayOrder: entry.displayOrder,
      },
      update: {
        // أعد تحديث الكل (للنسخ القادمة)
        nameAr: entry.nameAr,
        nameEn: entry.nameEn,
        defaultMaterialUnitPrice: entry.defaultMaterialUnitPrice ?? null,
        defaultLaborUnitPrice: entry.defaultLaborUnitPrice ?? null,
        commonMaterials: (entry.commonMaterials ?? null) as any,
        commonColors: (entry.commonColors ?? null) as any,
        // ... باقي الحقول
      },
    });
  }

  console.log(`✅ Seeded ${FULL_CATALOG.length} catalog entries`);
}

// Standalone runner
if (require.main === module) {
  seedCatalog()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
```

أضف إلى `packages/database/package.json`:
```json
"scripts": {
  "seed:catalog": "tsx seeds/catalog-seed.ts"
}
```

## 2.9 — تشغيل Seed والتحقق

```powershell
pnpm --filter database seed:catalog
pnpm --filter database studio
```

في Studio، تحقق:
- ✅ جدول `ItemCatalogEntry` فيه 80+ سجل
- ✅ كل بند له `itemKey` فريد
- ✅ المواد والماركات تظهر في `commonMaterials`

## ✅ معايير اجتياز Phase 2

```
✅ Phase 2 Complete — Catalog:

📊 الكتالوج:
- إجمالي البنود: [العدد] (هدف: 80+)
- التشطيبات: [العدد]
- MEP: [العدد]
- خارجي: [العدد]
- خاص: [العدد]
- Presets: 8

📝 البنود الرئيسية الموجودة:
- ✓ دهان داخلي/خارجي مع 5 ماركات
- ✓ لياسة داخلية/خارجية
- ✓ سيراميك/بورسلين/رخام
- ✓ كهرباء (12 بند)
- ✓ سباكة (10 بنود)
- ✓ تكييف (6 بنود)
- ✓ إطفاء حريق (5 بنود)
- ✓ تيار خفيف (5 بنود)

🔧 Build:
- tsc: ✓
- seed: ✓ (X items inserted)
- Studio verification: ✓

📦 Git: feat(unified-quantities): Phase 2 - Catalog enrichment

⏸ في انتظار تأكيدك للبدء بـ Phase 3.
```

---

# 📍 Phase 3 — Compute Engine (محرك حساب الكميات)

**الهدف:** بناء محرك يحسب الكمية الفعلية لكل بند بناءً على طريقة الحساب.

**المدة المتوقعة:** 90 دقيقة (يشمل الـ tests).

## 3.1 — البنية

```
packages/api/modules/unified-quantities/compute/
├── types.ts                           (~80 سطر)
├── item-computer.ts                   (~200 سطر) - الدالة الرئيسية
├── methods/
│   ├── direct-area.ts                 (~50 سطر)
│   ├── length-x-height.ts             (~80 سطر)
│   ├── length-only.ts                 (~40 سطر)
│   ├── per-unit.ts                    (~30 سطر)
│   ├── per-room.ts                    (~70 سطر)
│   ├── polygon.ts                     (~100 سطر) - مع shoelace
│   ├── manual.ts                      (~30 سطر)
│   └── lump-sum.ts                    (~30 سطر)
├── helpers/
│   ├── polygon-helper.ts              (~80 سطر) - Shoelace formula
│   ├── openings-deductor.ts           (~60 سطر)
│   ├── wastage-applier.ts             (~30 سطر)
│   └── link-resolver.ts               (~80 سطر)
├── __tests__/
│   ├── direct-area.test.ts
│   ├── length-x-height.test.ts
│   ├── length-only.test.ts
│   ├── per-unit.test.ts
│   ├── per-room.test.ts
│   ├── polygon.test.ts
│   ├── manual.test.ts
│   ├── lump-sum.test.ts
│   ├── openings-deductor.test.ts
│   ├── link-resolver.test.ts
│   └── item-computer.integration.test.ts
└── index.ts
```

## 3.2 — `types.ts`

```typescript
import type { QuantityItem, QuantityItemContext, QuantityContextOpening } from "@prisma/client";

export interface ComputeInput {
  item: Partial<QuantityItem> & {
    calculationMethod: string;
    primaryValue?: number | null | string;
    secondaryValue?: number | null | string;
    tertiaryValue?: number | null | string;
    wastagePercent?: number | string;
    deductOpenings?: boolean;
    polygonPoints?: any;
  };
  context?: QuantityItemContext | null;
  openings?: QuantityContextOpening[];
  linkedFromItem?: QuantityItem | null;
}

export interface ComputeOutput {
  computedQuantity: number;     // قبل الهدر، بعد خصم الفتحات
  effectiveQuantity: number;    // بعد الهدر
  openingsArea: number;         // المساحة المخصومة
  breakdown: ComputeBreakdown;
  warnings: string[];
}

export interface ComputeBreakdown {
  type: string;
  formula: string;          // عرض للمستخدم
  steps: string[];          // خطوات تفصيلية
}
```

## 3.3 — `helpers/polygon-helper.ts` (Shoelace)

```typescript
export interface Point {
  x: number;
  y: number;
}

/**
 * حساب مساحة شكل غير منتظم باستخدام Shoelace formula
 */
export function shoelaceArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    sum += points[i].x * points[j].y;
    sum -= points[j].x * points[i].y;
  }
  return Math.abs(sum) / 2;
}

/**
 * حساب محيط شكل غير منتظم
 */
export function polygonPerimeter(points: Point[]): number {
  if (points.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    perimeter += Math.hypot(points[j].x - points[i].x, points[j].y - points[i].y);
  }
  return perimeter;
}

export function validatePolygon(points: unknown): points is Point[] {
  if (!Array.isArray(points)) return false;
  if (points.length < 3) return false;
  return points.every(
    (p) => typeof p === "object" && p !== null && typeof (p as any).x === "number" && typeof (p as any).y === "number"
  );
}
```

## 3.4 — `helpers/openings-deductor.ts`

```typescript
import type { QuantityContextOpening } from "@prisma/client";

export function calculateOpeningsArea(openings: QuantityContextOpening[]): number {
  return openings
    .filter(o => o.deductFromInteriorFinishes)
    .reduce((sum, o) => sum + Number(o.computedArea) * o.count, 0);
}

export function calculateExteriorOpeningsArea(openings: QuantityContextOpening[]): number {
  return openings
    .filter(o => o.isExterior)
    .reduce((sum, o) => sum + Number(o.computedArea) * o.count, 0);
}
```

## 3.5 — `helpers/wastage-applier.ts`

```typescript
export function applyWastage(quantity: number, wastagePercent: number): number {
  if (wastagePercent < 0 || wastagePercent > 100) {
    throw new Error(`نسبة الهدر يجب بين 0-100، القيمة المُدخلة: ${wastagePercent}`);
  }
  return quantity * (1 + wastagePercent / 100);
}
```

## 3.6 — `methods/length-x-height.ts` (المثال الأكثر تعقيداً)

```typescript
import type { ComputeInput, ComputeOutput } from "../types";
import { calculateOpeningsArea } from "../helpers/openings-deductor";
import { applyWastage } from "../helpers/wastage-applier";

export function computeLengthXHeight(input: ComputeInput): ComputeOutput {
  const length = Number(input.item.primaryValue ?? 0);
  const height = Number(input.item.secondaryValue ?? 0);
  const wastage = Number(input.item.wastagePercent ?? 0);

  const grossArea = length * height;
  let openingsArea = 0;
  const warnings: string[] = [];

  if (input.item.deductOpenings) {
    if (input.openings && input.openings.length > 0) {
      openingsArea = calculateOpeningsArea(input.openings);
    } else {
      warnings.push("طُلب خصم الفتحات لكن لم تُعرَّف فتحات في السياق المشترك");
    }
  }

  const netArea = Math.max(0, grossArea - openingsArea);
  const effectiveQuantity = applyWastage(netArea, wastage);

  return {
    computedQuantity: netArea,
    effectiveQuantity,
    openingsArea,
    breakdown: {
      type: "length_x_height",
      formula: `(${length} × ${height}) − ${openingsArea} = ${netArea} م²، مع ${wastage}% هدر = ${effectiveQuantity.toFixed(2)} م²`,
      steps: [
        `الطول: ${length} م`,
        `الارتفاع: ${height} م`,
        `المساحة الإجمالية: ${grossArea.toFixed(2)} م²`,
        `الفتحات المخصومة: ${openingsArea.toFixed(2)} م²`,
        `المساحة الصافية: ${netArea.toFixed(2)} م²`,
        `الكمية الفعّالة (بعد ${wastage}% هدر): ${effectiveQuantity.toFixed(2)} م²`,
      ],
    },
    warnings,
  };
}
```

## 3.7 — باقي الـ methods (نمط مماثل)

اتبع نفس النمط لكل method:
- `direct-area.ts` — `area × (1 + waste/100)`
- `length-only.ts` — `length × (1 + waste/100)`
- `per-unit.ts` — `count` (بلا هدر عادة، لكن يدعم `wastage` لو > 0)
- `per-room.ts` — `countPerRoom × roomsCount`
- `polygon.ts` — يستخدم `shoelaceArea(polygonPoints)` ثم يطبّق الهدر والفتحات
- `manual.ts` — `primaryValue` كما هو
- `lump-sum.ts` — دائماً `1`

## 3.8 — `item-computer.ts` (المنسِّق)

```typescript
import type { ComputeInput, ComputeOutput } from "./types";
import { computeDirectArea } from "./methods/direct-area";
import { computeLengthXHeight } from "./methods/length-x-height";
import { computeLengthOnly } from "./methods/length-only";
import { computePerUnit } from "./methods/per-unit";
import { computePerRoom } from "./methods/per-room";
import { computePolygon } from "./methods/polygon";
import { computeManual } from "./methods/manual";
import { computeLumpSum } from "./methods/lump-sum";
import { resolveLinkedQuantity } from "./helpers/link-resolver";

export function compute(input: ComputeInput): ComputeOutput {
  // 1. إذا البند مرتبط، خذ الكمية من المصدر مع الصيغة
  if (input.item.linkedFromItemId && input.linkedFromItem) {
    return resolveLinkedQuantity(input);
  }

  // 2. وإلا، احسب حسب calculationMethod
  switch (input.item.calculationMethod) {
    case "direct_area":
      return computeDirectArea(input);
    case "length_x_height":
      return computeLengthXHeight(input);
    case "length_only":
      return computeLengthOnly(input);
    case "per_unit":
      return computePerUnit(input);
    case "per_room":
      return computePerRoom(input);
    case "polygon":
      return computePolygon(input);
    case "manual":
      return computeManual(input);
    case "lump_sum":
      return computeLumpSum(input);
    default:
      throw new Error(`Unknown calculation method: ${input.item.calculationMethod}`);
  }
}
```

## 3.9 — اختبارات (مثال على `length-x-height.test.ts`)

```typescript
import { describe, expect, it } from "vitest";
import { computeLengthXHeight } from "../methods/length-x-height";

describe("computeLengthXHeight", () => {
  it("calculates simple area without openings or wastage", () => {
    const result = computeLengthXHeight({
      item: {
        calculationMethod: "length_x_height",
        primaryValue: 10,
        secondaryValue: 3,
        wastagePercent: 0,
      },
    });
    expect(result.computedQuantity).toBe(30);
    expect(result.effectiveQuantity).toBe(30);
    expect(result.openingsArea).toBe(0);
  });

  it("applies wastage correctly", () => {
    const result = computeLengthXHeight({
      item: {
        calculationMethod: "length_x_height",
        primaryValue: 10,
        secondaryValue: 3,
        wastagePercent: 10,
      },
    });
    expect(result.computedQuantity).toBe(30);
    expect(result.effectiveQuantity).toBe(33);
  });

  it("deducts openings when flag is set", () => {
    const result = computeLengthXHeight({
      item: {
        calculationMethod: "length_x_height",
        primaryValue: 10,
        secondaryValue: 3,
        wastagePercent: 0,
        deductOpenings: true,
      },
      openings: [
        { computedArea: 2, count: 2, deductFromInteriorFinishes: true } as any,
      ],
    });
    expect(result.openingsArea).toBe(4);
    expect(result.computedQuantity).toBe(26);
  });

  it("warns when deductOpenings is true but no openings provided", () => {
    const result = computeLengthXHeight({
      item: {
        calculationMethod: "length_x_height",
        primaryValue: 10,
        secondaryValue: 3,
        wastagePercent: 0,
        deductOpenings: true,
      },
    });
    expect(result.warnings).toContain(expect.stringContaining("لم تُعرَّف فتحات"));
  });

  it("returns 0 when net area would be negative (openings > area)", () => {
    const result = computeLengthXHeight({
      item: {
        calculationMethod: "length_x_height",
        primaryValue: 10,
        secondaryValue: 1,
        wastagePercent: 0,
        deductOpenings: true,
      },
      openings: [
        { computedArea: 20, count: 1, deductFromInteriorFinishes: true } as any,
      ],
    });
    expect(result.computedQuantity).toBe(0);
  });

  it("handles string inputs (Decimal serialization)", () => {
    const result = computeLengthXHeight({
      item: {
        calculationMethod: "length_x_height",
        primaryValue: "10.5",
        secondaryValue: "3.2",
        wastagePercent: "10",
      } as any,
    });
    expect(result.computedQuantity).toBeCloseTo(33.6, 2);
    expect(result.effectiveQuantity).toBeCloseTo(36.96, 2);
  });
});
```

**اكتب اختبارات مماثلة لكل method.**

## ✅ معايير اجتياز Phase 3

```
✅ Phase 3 Complete — Compute Engine:

📁 ملفات:
- 8 methods ✓
- 4 helpers ✓
- 11 test files ✓

🧪 Tests:
- اختبارات: [العدد] (هدف: 50+)
- Coverage: [النسبة] (هدف: 80%+)
- Status: ✓ all passing

🔧 Build:
- tsc: ✓
- pnpm test: ✓ all green

📦 Git: feat(unified-quantities): Phase 3 - Compute engine

⏸ في انتظار تأكيدك للبدء بـ Phase 4.
```

---

# 📍 Phase 4 — Pricing Engine (محرك التسعير + Bi-directional)

**الهدف:** بناء محرك يحسب التكلفة + الربح + السعر النهائي مع دعم Bi-directional binding.

**المدة المتوقعة:** 90 دقيقة.

## 4.1 — البنية

```
packages/api/modules/unified-quantities/pricing/
├── types.ts                          (~100 سطر)
├── pricing-calculator.ts             (~200 سطر) - الدالة الرئيسية forward
├── bi-directional-solver.ts          (~180 سطر) - reverse من سعر/إجمالي
├── markup-methods/
│   ├── percentage.ts                 (~50 سطر)
│   ├── fixed-amount.ts               (~50 سطر)
│   └── manual-price.ts               (~50 سطر)
├── vat-applier.ts                    (~70 سطر)
├── study-aggregator.ts               (~150 سطر) - تجميع إجماليات الدراسة
├── __tests__/
│   ├── pricing-calculator.test.ts
│   ├── bi-directional.test.ts
│   ├── vat-applier.test.ts
│   ├── study-aggregator.test.ts
│   └── markup-methods.test.ts
└── index.ts
```

## 4.2 — `types.ts`

```typescript
export type MarkupMethod = "percentage" | "fixed_amount" | "manual_price";

export interface PricingCalculationInput {
  effectiveQuantity: number;
  materialUnitPrice?: number | null | string;
  laborUnitPrice?: number | null | string;
  markupMethod: MarkupMethod;
  markupPercent?: number | null | string;
  markupFixedAmount?: number | null | string;
  manualUnitPrice?: number | null | string;
  globalMarkupPercent?: number;
  hasCustomMarkup: boolean;
}

export interface PricingCalculationOutput {
  // التكلفة
  materialCost: number;
  laborCost: number;
  totalCost: number;
  unitCost: number;

  // البيع
  sellUnitPrice: number;
  sellTotalAmount: number;

  // الربح
  profitAmount: number;
  profitPercent: number;
  actualMarkupPercent: number;

  // Metadata
  effectiveMarkupMethod: MarkupMethod;
  breakdown: string[];
  warnings: string[];
}

export type PricingField =
  | "markup_percent"
  | "markup_fixed_amount"
  | "manual_unit_price"
  | "sell_unit_price"
  | "sell_total_amount"
  | "material_unit_price"
  | "labor_unit_price";

export interface BiDirectionalInput {
  changedField: PricingField;
  newValue: number;
  effectiveQuantity: number;
  materialUnitPrice: number;
  laborUnitPrice: number;
  currentMarkupMethod: MarkupMethod;
  hasCustomMarkup: boolean;
}

export interface BiDirectionalOutput {
  markupMethod: MarkupMethod;
  markupPercent: number | null;
  markupFixedAmount: number | null;
  manualUnitPrice: number | null;
  materialUnitPrice: number;
  laborUnitPrice: number;
  sellUnitPrice: number;
  sellTotalAmount: number;
  profitAmount: number;
  profitPercent: number;
  hasCustomMarkup: boolean;
}
```

## 4.3 — `pricing-calculator.ts` (Forward calculation)

```typescript
import type { PricingCalculationInput, PricingCalculationOutput, MarkupMethod } from "./types";
import { applyPercentageMarkup } from "./markup-methods/percentage";
import { applyFixedAmountMarkup } from "./markup-methods/fixed-amount";
import { applyManualPriceMarkup } from "./markup-methods/manual-price";

export function calculatePricing(input: PricingCalculationInput): PricingCalculationOutput {
  const effectiveQty = Number(input.effectiveQuantity);
  const matUnit = Number(input.materialUnitPrice ?? 0);
  const labUnit = Number(input.laborUnitPrice ?? 0);
  const warnings: string[] = [];

  // 1. التكلفة
  const materialCost = matUnit * effectiveQty;
  const laborCost = labUnit * effectiveQty;
  const totalCost = materialCost + laborCost;
  const unitCost = matUnit + labUnit;

  if (unitCost === 0) {
    warnings.push("التكلفة صفر — لم يتم إدخال أسعار المادة أو العمالة");
  }

  // 2. تحديد الـ markup الفعلي
  // إذا hasCustomMarkup=false: استخدم Global Markup
  let effectiveMethod: MarkupMethod = input.markupMethod;
  let effectivePercent = Number(input.markupPercent ?? 0);

  if (!input.hasCustomMarkup && input.globalMarkupPercent !== undefined) {
    effectiveMethod = "percentage";
    effectivePercent = input.globalMarkupPercent;
  }

  // 3. حساب السعر حسب طريقة الربح
  let sellUnitPrice = 0;
  switch (effectiveMethod) {
    case "percentage":
      sellUnitPrice = applyPercentageMarkup(unitCost, effectivePercent);
      break;
    case "fixed_amount":
      sellUnitPrice = applyFixedAmountMarkup(unitCost, Number(input.markupFixedAmount ?? 0));
      break;
    case "manual_price":
      sellUnitPrice = applyManualPriceMarkup(Number(input.manualUnitPrice ?? 0));
      if (sellUnitPrice === 0) {
        warnings.push("سعر يدوي صفر — لم يتم إدخال السعر");
      }
      break;
  }

  // 4. الإجماليات
  const sellTotalAmount = sellUnitPrice * effectiveQty;
  const profitAmount = sellTotalAmount - totalCost;
  const profitPercent = sellTotalAmount > 0 ? (profitAmount / sellTotalAmount) * 100 : 0;
  const actualMarkupPercent = unitCost > 0 ? (profitAmount / totalCost) * 100 : 0;

  if (profitAmount < 0) {
    warnings.push("⚠️ خسارة! السعر أقل من التكلفة");
  }

  // 5. Breakdown للعرض
  const breakdown: string[] = [
    `تكلفة المادة: ${matUnit} × ${effectiveQty} = ${materialCost.toFixed(2)} ر.س`,
    `تكلفة العمالة: ${labUnit} × ${effectiveQty} = ${laborCost.toFixed(2)} ر.س`,
    `إجمالي التكلفة: ${totalCost.toFixed(2)} ر.س (${unitCost.toFixed(2)} ر.س/وحدة)`,
  ];

  if (effectiveMethod === "percentage") {
    breakdown.push(`الربح: ${effectivePercent}% → سعر الوحدة: ${unitCost.toFixed(2)} × (1 + ${effectivePercent}/100) = ${sellUnitPrice.toFixed(2)} ر.س`);
  } else if (effectiveMethod === "fixed_amount") {
    breakdown.push(`ربح ثابت: ${input.markupFixedAmount} ر.س → سعر الوحدة: ${sellUnitPrice.toFixed(2)} ر.س`);
  } else {
    breakdown.push(`سعر يدوي: ${sellUnitPrice.toFixed(2)} ر.س/وحدة`);
  }

  breakdown.push(`إجمالي البيع: ${sellTotalAmount.toFixed(2)} ر.س`);
  breakdown.push(`صافي الربح: ${profitAmount.toFixed(2)} ر.س (${profitPercent.toFixed(1)}% من البيع)`);

  return {
    materialCost,
    laborCost,
    totalCost,
    unitCost,
    sellUnitPrice,
    sellTotalAmount,
    profitAmount,
    profitPercent,
    actualMarkupPercent,
    effectiveMarkupMethod: effectiveMethod,
    breakdown,
    warnings,
  };
}
```

## 4.4 — `bi-directional-solver.ts` (الذكاء الحقيقي)

```typescript
import type { BiDirectionalInput, BiDirectionalOutput, MarkupMethod } from "./types";

/**
 * يحل المعادلة من أي اتجاه:
 * - تعدّل markup_percent → احسب sell price
 * - تعدّل sell_unit_price → احسب markup ضمنياً واحفظ كـ manual_price
 * - تعدّل sell_total_amount → احسب unit price ثم markup
 * - تعدّل material/labor unit price → أعد حساب كل شيء
 */
export function solvePricing(input: BiDirectionalInput): BiDirectionalOutput {
  let { materialUnitPrice, laborUnitPrice, hasCustomMarkup } = input;
  const { effectiveQuantity, currentMarkupMethod, changedField, newValue } = input;

  let markupMethod: MarkupMethod = currentMarkupMethod;
  let markupPercent: number | null = null;
  let markupFixedAmount: number | null = null;
  let manualUnitPrice: number | null = null;
  let sellUnitPrice = 0;

  switch (changedField) {
    case "material_unit_price":
      materialUnitPrice = newValue;
      // أعد حساب السعر بنفس markup الحالي (سيتم لاحقاً)
      break;

    case "labor_unit_price":
      laborUnitPrice = newValue;
      break;

    case "markup_percent":
      markupMethod = "percentage";
      markupPercent = newValue;
      hasCustomMarkup = true;  // تعديل صريح = هامش خاص
      sellUnitPrice = (materialUnitPrice + laborUnitPrice) * (1 + newValue / 100);
      break;

    case "markup_fixed_amount":
      markupMethod = "fixed_amount";
      markupFixedAmount = newValue;
      hasCustomMarkup = true;
      sellUnitPrice = (materialUnitPrice + laborUnitPrice) + newValue;
      break;

    case "manual_unit_price":
      markupMethod = "manual_price";
      manualUnitPrice = newValue;
      hasCustomMarkup = true;
      sellUnitPrice = newValue;
      break;

    case "sell_unit_price":
      // مستخدم غيّر السعر مباشرة
      // احفظه كـ manual_price، احسب الـ markup الضمني للعرض
      markupMethod = "manual_price";
      manualUnitPrice = newValue;
      sellUnitPrice = newValue;
      hasCustomMarkup = true;

      // احسب نسبة الربح الضمنية للعرض
      const unitCost = materialUnitPrice + laborUnitPrice;
      if (unitCost > 0) {
        const impliedMarkup = ((newValue - unitCost) / unitCost) * 100;
        markupPercent = impliedMarkup;
      }
      break;

    case "sell_total_amount":
      // مستخدم غيّر الإجمالي
      if (effectiveQuantity > 0) {
        const newSellUnitPrice = newValue / effectiveQuantity;
        markupMethod = "manual_price";
        manualUnitPrice = newSellUnitPrice;
        sellUnitPrice = newSellUnitPrice;
        hasCustomMarkup = true;

        const unitCost = materialUnitPrice + laborUnitPrice;
        if (unitCost > 0) {
          markupPercent = ((newSellUnitPrice - unitCost) / unitCost) * 100;
        }
      }
      break;
  }

  // إذا تغيّرت material/labor unit price، أعد حساب السعر بنفس markup الحالي
  if (changedField === "material_unit_price" || changedField === "labor_unit_price") {
    const unitCost = materialUnitPrice + laborUnitPrice;
    switch (markupMethod) {
      case "percentage":
        sellUnitPrice = unitCost * (1 + (markupPercent ?? 0) / 100);
        break;
      case "fixed_amount":
        sellUnitPrice = unitCost + (markupFixedAmount ?? 0);
        break;
      case "manual_price":
        sellUnitPrice = manualUnitPrice ?? 0;
        break;
    }
  }

  const sellTotalAmount = sellUnitPrice * effectiveQuantity;
  const totalCost = (materialUnitPrice + laborUnitPrice) * effectiveQuantity;
  const profitAmount = sellTotalAmount - totalCost;
  const profitPercent = sellTotalAmount > 0 ? (profitAmount / sellTotalAmount) * 100 : 0;

  return {
    markupMethod,
    markupPercent,
    markupFixedAmount,
    manualUnitPrice,
    materialUnitPrice,
    laborUnitPrice,
    sellUnitPrice,
    sellTotalAmount,
    profitAmount,
    profitPercent,
    hasCustomMarkup,
  };
}
```

## 4.5 — `vat-applier.ts`

```typescript
export interface VATResult {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
}

export function applyVAT(
  amount: number,
  vatPercent: number = 15,
  vatIncluded: boolean = false
): VATResult {
  if (vatPercent < 0 || vatPercent > 100) {
    throw new Error(`نسبة VAT غير صحيحة: ${vatPercent}`);
  }

  if (vatIncluded) {
    // المبلغ شامل VAT — استخرج الصافي
    const netAmount = amount / (1 + vatPercent / 100);
    const vatAmount = amount - netAmount;
    return { netAmount, vatAmount, grossAmount: amount };
  } else {
    // المبلغ بدون VAT — أضِف
    const vatAmount = amount * (vatPercent / 100);
    return { netAmount: amount, vatAmount, grossAmount: amount + vatAmount };
  }
}
```

## 4.6 — `study-aggregator.ts`

```typescript
import { db } from "@repo/database";
import { calculatePricing } from "./pricing-calculator";
import { applyVAT } from "./vat-applier";

export interface StudyTotals {
  totalMaterialCost: number;
  totalLaborCost: number;
  totalGrossCost: number;
  totalSellAmount: number;
  totalProfitAmount: number;
  totalProfitPercent: number;
  itemCount: number;
  enabledItemCount: number;
  vat: { netAmount: number; vatAmount: number; grossAmount: number };
}

export async function aggregateStudyTotals(
  costStudyId: string,
  organizationId: string
): Promise<StudyTotals> {
  // 1. اجلب الدراسة + بنودها
  const study = await db.costStudy.findFirst({
    where: { id: costStudyId, organizationId },
    include: { quantityItems: { where: { isEnabled: true } } },
  });

  if (!study) {
    throw new Error(`Study not found: ${costStudyId}`);
  }

  // 2. اجمع الإجماليات
  let totalMaterialCost = 0;
  let totalLaborCost = 0;
  let totalSellAmount = 0;

  for (const item of study.quantityItems) {
    const result = calculatePricing({
      effectiveQuantity: Number(item.effectiveQuantity),
      materialUnitPrice: item.materialUnitPrice,
      laborUnitPrice: item.laborUnitPrice,
      markupMethod: item.markupMethod as any,
      markupPercent: item.markupPercent,
      markupFixedAmount: item.markupFixedAmount,
      manualUnitPrice: item.manualUnitPrice,
      globalMarkupPercent: Number(study.globalMarkupPercent),
      hasCustomMarkup: item.hasCustomMarkup,
    });

    totalMaterialCost += result.materialCost;
    totalLaborCost += result.laborCost;
    totalSellAmount += result.sellTotalAmount;
  }

  const totalGrossCost = totalMaterialCost + totalLaborCost;
  const totalProfitAmount = totalSellAmount - totalGrossCost;
  const totalProfitPercent = totalSellAmount > 0 ? (totalProfitAmount / totalSellAmount) * 100 : 0;

  // 3. VAT
  const vat = applyVAT(totalSellAmount, Number(study.vatPercent), study.vatIncludedInPrices);

  // 4. Cache في DB
  await db.costStudy.update({
    where: { id: costStudyId },
    data: {
      totalMaterialCost,
      totalLaborCost,
      totalGrossCost,
      totalSellAmount,
      totalProfitAmount,
      totalProfitPercent,
    },
  });

  return {
    totalMaterialCost,
    totalLaborCost,
    totalGrossCost,
    totalSellAmount,
    totalProfitAmount,
    totalProfitPercent,
    itemCount: study.quantityItems.length,
    enabledItemCount: study.quantityItems.filter(i => i.isEnabled).length,
    vat,
  };
}
```

## 4.7 — اختبارات

اكتب tests شاملة لـ:
- `pricing-calculator` (15+ test): كل markup method × edge cases
- `bi-directional` (15+ test): كل field × round-trip integrity
- `vat-applier` (8+ test): included/excluded × edge cases
- `study-aggregator` (10+ test): دراسة فارغة، دراسة بـ 5 بنود، بنود معطّلة

**اختبار حرج للـ Bi-directional Round-trip:**
```typescript
it("round-trip: markup_percent → sell_unit_price → markup_percent gives same value", () => {
  const initial = solvePricing({
    changedField: "markup_percent",
    newValue: 30,
    effectiveQuantity: 100,
    materialUnitPrice: 18,
    laborUnitPrice: 7,
    currentMarkupMethod: "percentage",
    hasCustomMarkup: false,
  });

  // sellUnitPrice = 25 × 1.3 = 32.5
  expect(initial.sellUnitPrice).toBeCloseTo(32.5, 4);

  const reverse = solvePricing({
    changedField: "sell_unit_price",
    newValue: initial.sellUnitPrice,
    effectiveQuantity: 100,
    materialUnitPrice: 18,
    laborUnitPrice: 7,
    currentMarkupMethod: initial.markupMethod,
    hasCustomMarkup: true,
  });

  // markupPercent ضمنياً = 30
  expect(reverse.markupPercent).toBeCloseTo(30, 2);
});
```

## ✅ معايير اجتياز Phase 4

```
✅ Phase 4 Complete — Pricing Engine:

📁 ملفات: 8 ملفات + 5 test files

🧪 Tests:
- pricing-calculator: [العدد] test
- bi-directional: [العدد] test (مع round-trip)
- vat-applier: [العدد] test
- study-aggregator: [العدد] test
- markup-methods: [العدد] test
- Total: [الإجمالي]
- Coverage: [النسبة] (هدف: 85%+)

🔧 Build:
- tsc: ✓
- pnpm test: ✓ all green

📦 Git: feat(unified-quantities): Phase 4 - Pricing engine

⏸ في انتظار تأكيدك للبدء بـ Phase 5.
```

---

# 📍 Phase 5 — API Endpoints (~20 endpoint)

**الهدف:** بناء الـ API الكامل الذي تستهلكه الواجهة لاحقاً.

**المدة المتوقعة:** 90-120 دقيقة.

## 5.1 — البنية

```
packages/api/modules/unified-quantities/
├── router.ts                              (~120 سطر)
├── types.ts                               (~80 سطر)
├── procedures/
│   ├── catalog/
│   │   ├── get-catalog.ts                 (~50 سطر)
│   │   ├── get-presets.ts                 (~40 سطر)
│   │   └── apply-preset.ts                (~120 سطر)
│   ├── items/
│   │   ├── get-items.ts                   (~60 سطر)
│   │   ├── upsert-item.ts                 (~180 سطر) - الأهم
│   │   ├── delete-item.ts                 (~60 سطر)
│   │   ├── reorder-items.ts               (~50 سطر)
│   │   ├── duplicate-item.ts              (~80 سطر)
│   │   └── link-items.ts                  (~80 سطر)
│   ├── context/
│   │   ├── get-context.ts                 (~60 سطر)
│   │   ├── update-context.ts              (~80 سطر)
│   │   ├── upsert-space.ts                (~100 سطر)
│   │   ├── delete-space.ts                (~50 سطر)
│   │   ├── upsert-opening.ts              (~90 سطر)
│   │   └── delete-opening.ts              (~50 سطر)
│   ├── pricing/
│   │   ├── update-pricing.ts              (~120 سطر) - bi-directional
│   │   ├── update-global-markup.ts        (~100 سطر)
│   │   ├── get-study-totals.ts            (~70 سطر)
│   │   └── bulk-update-pricing.ts         (~100 سطر)
│   └── settings/
│       └── update-study-settings.ts       (~80 سطر)
├── schemas/
│   ├── quantity-item.schema.ts            (~120 سطر)
│   ├── context.schema.ts                  (~100 سطر)
│   ├── pricing.schema.ts                  (~80 سطر)
│   └── catalog.schema.ts                  (~60 سطر)
└── lib/
    ├── suggestion-engine.ts               (~120 سطر)
    └── verify-access.ts                   (~50 سطر)
```

## 5.2 — مثال: `procedures/items/upsert-item.ts` (الأهم والأكثر تعقيداً)

```typescript
import { subscriptionProcedure } from "@repo/api/orpc";
import { upsertQuantityItemSchema } from "../../schemas/quantity-item.schema";
import { compute } from "../../compute";
import { calculatePricing } from "../../pricing/pricing-calculator";
import { aggregateStudyTotals } from "../../pricing/study-aggregator";
import { db } from "@repo/database";
import { verifyOrganizationAccess } from "../../lib/verify-access";

export const upsertItem = subscriptionProcedure
  .input(upsertQuantityItemSchema)
  .handler(async ({ input, context }) => {
    await verifyOrganizationAccess(context.session, input.organizationId);

    // 1. اجلب السياق + الفتحات
    const quantityContext = await db.quantityItemContext.findUnique({
      where: { costStudyId: input.costStudyId },
      include: { spaces: true, openings: true },
    });

    // 2. اجلب البند المصدر إذا مرتبط
    let linkedFromItem = null;
    if (input.linkedFromItemId) {
      linkedFromItem = await db.quantityItem.findFirst({
        where: { id: input.linkedFromItemId, organizationId: input.organizationId },
      });
    }

    // 3. اجلب إعدادات الدراسة (لـ Global Markup)
    const study = await db.costStudy.findFirst({
      where: { id: input.costStudyId, organizationId: input.organizationId },
    });
    if (!study) throw new Error("Study not found");

    // 4. احسب الكمية
    const quantityResult = compute({
      item: input as any,
      context: quantityContext,
      openings: quantityContext?.openings ?? [],
      linkedFromItem,
    });

    // 5. احسب التسعير
    const pricingResult = calculatePricing({
      effectiveQuantity: quantityResult.effectiveQuantity,
      materialUnitPrice: input.materialUnitPrice,
      laborUnitPrice: input.laborUnitPrice,
      markupMethod: input.markupMethod ?? "percentage",
      markupPercent: input.markupPercent,
      markupFixedAmount: input.markupFixedAmount,
      manualUnitPrice: input.manualUnitPrice,
      globalMarkupPercent: Number(study.globalMarkupPercent),
      hasCustomMarkup: input.hasCustomMarkup ?? false,
    });

    // 6. احفظ البند
    const savedItem = await db.quantityItem.upsert({
      where: { id: input.id ?? "__new__" },
      create: {
        costStudyId: input.costStudyId,
        organizationId: input.organizationId,
        domain: input.domain,
        categoryKey: input.categoryKey,
        catalogItemKey: input.catalogItemKey,
        displayName: input.displayName,
        sortOrder: input.sortOrder ?? 0,
        isEnabled: input.isEnabled ?? true,
        primaryValue: input.primaryValue ?? null,
        secondaryValue: input.secondaryValue ?? null,
        tertiaryValue: input.tertiaryValue ?? null,
        calculationMethod: input.calculationMethod,
        unit: input.unit,
        wastagePercent: input.wastagePercent ?? 10,
        contextSpaceId: input.contextSpaceId ?? null,
        contextScope: input.contextScope ?? null,
        deductOpenings: input.deductOpenings ?? false,
        polygonPoints: input.polygonPoints ?? null,
        linkedFromItemId: input.linkedFromItemId ?? null,
        linkQuantityFormula: input.linkQuantityFormula ?? null,
        linkPercentValue: input.linkPercentValue ?? null,
        specMaterialName: input.specMaterialName ?? null,
        specMaterialBrand: input.specMaterialBrand ?? null,
        specMaterialGrade: input.specMaterialGrade ?? null,
        specColor: input.specColor ?? null,
        specSource: input.specSource ?? null,
        specNotes: input.specNotes ?? null,
        materialUnitPrice: input.materialUnitPrice ?? null,
        laborUnitPrice: input.laborUnitPrice ?? null,
        markupMethod: input.markupMethod ?? "percentage",
        markupPercent: input.markupPercent ?? null,
        markupFixedAmount: input.markupFixedAmount ?? null,
        manualUnitPrice: input.manualUnitPrice ?? null,
        hasCustomMarkup: input.hasCustomMarkup ?? false,
        notes: input.notes ?? null,
        // Computed values
        computedQuantity: quantityResult.computedQuantity,
        effectiveQuantity: quantityResult.effectiveQuantity,
        openingsArea: quantityResult.openingsArea,
        materialCost: pricingResult.materialCost,
        laborCost: pricingResult.laborCost,
        totalCost: pricingResult.totalCost,
        sellUnitPrice: pricingResult.sellUnitPrice,
        sellTotalAmount: pricingResult.sellTotalAmount,
        profitAmount: pricingResult.profitAmount,
        profitPercent: pricingResult.profitPercent,
        createdById: context.session.user.id,
      },
      update: {
        // ... نفس الحقول مع computed values
      },
    });

    // 7. حدِّث إجماليات الدراسة (cached)
    const totals = await aggregateStudyTotals(input.costStudyId, input.organizationId);

    return {
      item: savedItem,
      quantityBreakdown: quantityResult.breakdown,
      pricingBreakdown: pricingResult.breakdown,
      warnings: [...quantityResult.warnings, ...pricingResult.warnings],
      studyTotals: totals,
    };
  });
```

## 5.3 — `procedures/pricing/update-pricing.ts` (Bi-directional)

```typescript
import { subscriptionProcedure } from "@repo/api/orpc";
import { updatePricingSchema } from "../../schemas/pricing.schema";
import { solvePricing } from "../../pricing/bi-directional-solver";
import { aggregateStudyTotals } from "../../pricing/study-aggregator";
import { db } from "@repo/database";
import { verifyOrganizationAccess } from "../../lib/verify-access";

export const updatePricing = subscriptionProcedure
  .input(updatePricingSchema)
  .handler(async ({ input, context }) => {
    await verifyOrganizationAccess(context.session, input.organizationId);

    // 1. اجلب البند الحالي
    const item = await db.quantityItem.findFirst({
      where: { id: input.id, organizationId: input.organizationId },
    });
    if (!item) throw new Error("Item not found");

    // 2. حل المعادلة
    const result = solvePricing({
      changedField: input.changedField,
      newValue: input.newValue,
      effectiveQuantity: Number(item.effectiveQuantity),
      materialUnitPrice: Number(item.materialUnitPrice ?? 0),
      laborUnitPrice: Number(item.laborUnitPrice ?? 0),
      currentMarkupMethod: item.markupMethod as any,
      hasCustomMarkup: item.hasCustomMarkup,
    });

    // 3. احفظ
    const updatedItem = await db.quantityItem.update({
      where: { id: input.id },
      data: {
        materialUnitPrice: result.materialUnitPrice,
        laborUnitPrice: result.laborUnitPrice,
        materialCost: result.materialUnitPrice * Number(item.effectiveQuantity),
        laborCost: result.laborUnitPrice * Number(item.effectiveQuantity),
        totalCost: (result.materialUnitPrice + result.laborUnitPrice) * Number(item.effectiveQuantity),
        markupMethod: result.markupMethod,
        markupPercent: result.markupPercent,
        markupFixedAmount: result.markupFixedAmount,
        manualUnitPrice: result.manualUnitPrice,
        sellUnitPrice: result.sellUnitPrice,
        sellTotalAmount: result.sellTotalAmount,
        profitAmount: result.profitAmount,
        profitPercent: result.profitPercent,
        hasCustomMarkup: result.hasCustomMarkup,
        updatedById: context.session.user.id,
      },
    });

    // 4. حدِّث إجماليات الدراسة
    const totals = await aggregateStudyTotals(item.costStudyId, input.organizationId);

    return { item: updatedItem, studyTotals: totals };
  });
```

## 5.4 — `procedures/pricing/update-global-markup.ts`

```typescript
import { subscriptionProcedure } from "@repo/api/orpc";
import { updateGlobalMarkupSchema } from "../../schemas/pricing.schema";
import { aggregateStudyTotals } from "../../pricing/study-aggregator";
import { calculatePricing } from "../../pricing/pricing-calculator";
import { db } from "@repo/database";
import { verifyOrganizationAccess } from "../../lib/verify-access";

export const updateGlobalMarkup = subscriptionProcedure
  .input(updateGlobalMarkupSchema)
  .handler(async ({ input, context }) => {
    await verifyOrganizationAccess(context.session, input.organizationId);

    // 1. حدِّث globalMarkupPercent في الدراسة
    const study = await db.costStudy.update({
      where: { id: input.costStudyId },
      data: { globalMarkupPercent: input.globalMarkupPercent },
    });

    // 2. اعتماداً على applyMode
    if (input.applyMode === "all_items") {
      // امسح كل التخصيصات وأعد حساب الكل
      const items = await db.quantityItem.findMany({
        where: { costStudyId: input.costStudyId, organizationId: input.organizationId },
      });

      for (const item of items) {
        const result = calculatePricing({
          effectiveQuantity: Number(item.effectiveQuantity),
          materialUnitPrice: item.materialUnitPrice,
          laborUnitPrice: item.laborUnitPrice,
          markupMethod: "percentage",
          markupPercent: input.globalMarkupPercent,
          hasCustomMarkup: false,
        });

        await db.quantityItem.update({
          where: { id: item.id },
          data: {
            markupMethod: "percentage",
            markupPercent: input.globalMarkupPercent,
            markupFixedAmount: null,
            manualUnitPrice: null,
            hasCustomMarkup: false,
            sellUnitPrice: result.sellUnitPrice,
            sellTotalAmount: result.sellTotalAmount,
            profitAmount: result.profitAmount,
            profitPercent: result.profitPercent,
          },
        });
      }
    } else if (input.applyMode === "non_custom_only") {
      // فقط البنود غير المخصصة
      const items = await db.quantityItem.findMany({
        where: {
          costStudyId: input.costStudyId,
          organizationId: input.organizationId,
          hasCustomMarkup: false,
        },
      });

      for (const item of items) {
        const result = calculatePricing({
          effectiveQuantity: Number(item.effectiveQuantity),
          materialUnitPrice: item.materialUnitPrice,
          laborUnitPrice: item.laborUnitPrice,
          markupMethod: "percentage",
          markupPercent: input.globalMarkupPercent,
          hasCustomMarkup: false,
        });

        await db.quantityItem.update({
          where: { id: item.id },
          data: {
            sellUnitPrice: result.sellUnitPrice,
            sellTotalAmount: result.sellTotalAmount,
            profitAmount: result.profitAmount,
            profitPercent: result.profitPercent,
          },
        });
      }
    }

    // 3. حدِّث الإجماليات
    const totals = await aggregateStudyTotals(input.costStudyId, input.organizationId);

    return { study, totals };
  });
```

## 5.5 — Schemas (Zod)

### `schemas/quantity-item.schema.ts`
```typescript
import { z } from "zod";

const decimalInput = z.union([z.string(), z.number()]).transform(Number);
const optionalDecimal = decimalInput.nullable().optional();

export const upsertQuantityItemSchema = z.object({
  id: z.string().optional(),
  costStudyId: z.string(),
  organizationId: z.string(),

  domain: z.enum(["FINISHING", "MEP", "EXTERIOR", "SPECIAL"]),
  categoryKey: z.string().min(1).max(100),
  catalogItemKey: z.string().min(1).max(200),

  displayName: z.string().min(1).max(300),
  sortOrder: z.number().int().default(0),
  isEnabled: z.boolean().default(true),

  primaryValue: optionalDecimal,
  secondaryValue: optionalDecimal,
  tertiaryValue: optionalDecimal,

  calculationMethod: z.enum([
    "direct_area", "length_x_height", "length_only", "per_unit",
    "per_room", "polygon", "manual", "lump_sum"
  ]),

  unit: z.string().min(1).max(20),
  wastagePercent: decimalInput.refine(v => v >= 0 && v <= 100, "نسبة الهدر يجب 0-100").default(10),

  contextSpaceId: z.string().nullable().optional(),
  contextScope: z.enum(["whole_building", "per_floor", "per_room", "standalone"]).nullable().optional(),

  deductOpenings: z.boolean().default(false),
  polygonPoints: z.array(z.object({ x: z.number(), y: z.number() })).nullable().optional(),

  linkedFromItemId: z.string().nullable().optional(),
  linkQuantityFormula: z.enum(["SAME", "MINUS_WET_AREAS", "PLUS_PERCENT"]).nullable().optional(),
  linkPercentValue: optionalDecimal,

  // Specs
  specMaterialName: z.string().max(200).nullable().optional(),
  specMaterialBrand: z.string().max(100).nullable().optional(),
  specMaterialGrade: z.string().max(50).nullable().optional(),
  specColor: z.string().max(50).nullable().optional(),
  specSource: z.string().max(50).nullable().optional(),
  specNotes: z.string().max(2000).nullable().optional(),

  // Pricing
  materialUnitPrice: optionalDecimal,
  laborUnitPrice: optionalDecimal,
  markupMethod: z.enum(["percentage", "fixed_amount", "manual_price"]).default("percentage"),
  markupPercent: optionalDecimal,
  markupFixedAmount: optionalDecimal,
  manualUnitPrice: optionalDecimal,
  hasCustomMarkup: z.boolean().default(false),

  notes: z.string().max(2000).nullable().optional(),
});

export type UpsertQuantityItemInput = z.infer<typeof upsertQuantityItemSchema>;
```

### `schemas/pricing.schema.ts`
```typescript
import { z } from "zod";

const decimalInput = z.union([z.string(), z.number()]).transform(Number);

export const updatePricingSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  organizationId: z.string(),
  changedField: z.enum([
    "markup_percent", "markup_fixed_amount", "manual_unit_price",
    "sell_unit_price", "sell_total_amount",
    "material_unit_price", "labor_unit_price"
  ]),
  newValue: decimalInput,
});

export const updateGlobalMarkupSchema = z.object({
  costStudyId: z.string(),
  organizationId: z.string(),
  globalMarkupPercent: decimalInput.refine(v => v >= 0 && v <= 1000, "النسبة يجب 0-1000"),
  applyMode: z.enum(["all_items", "non_custom_only"]),
});

export const getStudyTotalsSchema = z.object({
  costStudyId: z.string(),
  organizationId: z.string(),
});
```

## 5.6 — `lib/verify-access.ts`

```typescript
import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";

export async function verifyOrganizationAccess(
  session: any,
  organizationId: string
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true },
  });

  if (!user) {
    throw new ORPCError("UNAUTHORIZED", { message: "User not found" });
  }

  if (user.organizationId !== organizationId) {
    throw new ORPCError("FORBIDDEN", { message: "Cross-tenant access denied" });
  }
}
```

## 5.7 — `router.ts`

```typescript
// Catalog
import { getCatalog } from "./procedures/catalog/get-catalog";
import { getPresets } from "./procedures/catalog/get-presets";
import { applyPreset } from "./procedures/catalog/apply-preset";

// Items
import { getItems } from "./procedures/items/get-items";
import { upsertItem } from "./procedures/items/upsert-item";
import { deleteItem } from "./procedures/items/delete-item";
import { reorderItems } from "./procedures/items/reorder-items";
import { duplicateItem } from "./procedures/items/duplicate-item";
import { linkItems } from "./procedures/items/link-items";

// Context
import { getContext } from "./procedures/context/get-context";
import { updateContext } from "./procedures/context/update-context";
import { upsertSpace } from "./procedures/context/upsert-space";
import { deleteSpace } from "./procedures/context/delete-space";
import { upsertOpening } from "./procedures/context/upsert-opening";
import { deleteOpening } from "./procedures/context/delete-opening";

// Pricing
import { updatePricing } from "./procedures/pricing/update-pricing";
import { updateGlobalMarkup } from "./procedures/pricing/update-global-markup";
import { getStudyTotals } from "./procedures/pricing/get-study-totals";
import { bulkUpdatePricing } from "./procedures/pricing/bulk-update-pricing";

// Settings
import { updateStudySettings } from "./procedures/settings/update-study-settings";

export const unifiedQuantitiesRouter = {
  // Catalog
  getCatalog,
  getPresets,
  applyPreset,

  // Items
  getItems,
  upsertItem,
  deleteItem,
  reorderItems,
  duplicateItem,
  linkItems,

  // Context
  context: {
    get: getContext,
    update: updateContext,
    upsertSpace,
    deleteSpace,
    upsertOpening,
    deleteOpening,
  },

  // Pricing
  pricing: {
    updatePricing,
    updateGlobalMarkup,
    getStudyTotals,
    bulkUpdatePricing,
  },

  // Settings
  updateStudySettings,
};
```

## 5.8 — تسجيل في الـ Root Router

افتح `packages/api/router.ts` (أو ما يناظره) وأضف:

```typescript
import { unifiedQuantitiesRouter } from "./modules/unified-quantities/router";

export const appRouter = {
  // ... existing
  unifiedQuantities: unifiedQuantitiesRouter,
};
```

## 5.9 — اختبارات Endpoints

اكتب اختبارات لكل endpoint رئيسي:
- `upsertItem` (10+ test) — يشمل scenarios: بند جديد، تعديل، linked item، with openings
- `updatePricing` (8+ test) — كل changedField
- `updateGlobalMarkup` (6+ test) — كل applyMode
- `applyPreset` (5+ test) — كل preset
- `linkItems` (5+ test)

## ✅ معايير اجتياز Phase 5

```
✅ Phase 5 Complete — API Endpoints:

📁 ملفات:
- 20 procedure ✓
- 4 schemas ✓
- 2 helpers ✓
- 1 router ✓

🧪 Tests:
- procedures tests: [العدد]
- Coverage: [النسبة] (هدف: 75%+)

🔧 Build:
- tsc: ✓ zero errors
- pnpm test: ✓ all passing
- Total tests in repo: [العدد]

🔗 Integration:
- Router مسجَّل في appRouter ✓
- multi-tenancy على كل query ✓
- subscriptionProcedure على كل write ✓

📦 Git: feat(unified-quantities): Phase 5 - API endpoints

⏸ المرحلة الخلفية كاملة. في انتظار تأكيدك للانتقال لمرحلة الواجهة (في برومبت منفصل).
```

---

# 🎉 الخلاصة النهائية

عند إكمال كل المراحل، اكتب:

```
═══════════════════════════════════════════════════════════════
  ✅ Backend Complete — Unified Quantities Engine (Phases 1-5)
═══════════════════════════════════════════════════════════════

📊 الإحصائيات النهائية:
- Schemas جديدة: 5 جداول + توسيع CostStudy
- Catalog: [العدد] بند + 8 presets
- Compute methods: 8 + 4 helpers
- Pricing engines: 3 markup methods + bi-directional + VAT + aggregator
- API endpoints: 20

📁 ملفات جديدة: [العدد]
📝 أسطر كود: ~[العدد]
🧪 Tests: [العدد] (coverage: [النسبة])

🔧 جودة:
- TypeScript: ✓ zero errors
- Tests: ✓ all passing
- كل ملف < 400 سطر ✓
- Multi-tenancy ✓
- Subscription guards ✓

📦 Git Commits:
- Phase 1: [hash]
- Phase 2: [hash]
- Phase 3: [hash]
- Phase 4: [hash]
- Phase 5: [hash]

🎯 جاهز لـ Frontend Phase (في برومبت منفصل):
- UnifiedItemsWorkspace
- البطاقة الموحَّدة بـ 4 أقسام
- Mini Dashboard + Global Markup
- Quote Drawer + PDF
```

---

# 🆘 إذا واجهت مشكلة

### مشكلة: "Migration would lead to data loss"
- توقف فوراً
- اقرأ الرسالة كاملة
- أبلغني بالنص قبل المتابعة

### مشكلة: TypeScript errors بعد generate
- اقرأ الخطأ الأول
- إذا في القائمة الحمراء → توقف
- إذا في `unified-quantities` → عدّل
- إذا في كود قديم يستخدم Prisma types الجديدة → عدّله بحذر

### مشكلة: Tests فاشلة
- لو في الكود الجديد → عدّله أو عدّل الـ test
- لو في tests قديمة → اقرأها بدقة، احتمال CostStudy تأثر
- لو في business logic → توقف وأبلغني

### مشكلة: pnpm push fails
- تحقق من `.env`: `DATABASE_URL` و `DIRECT_URL`
- جرّب: `pnpm --filter database push --skip-generate` للتشخيص

### مشكلة: استمرار الجلسة لطويلة
بعد Phase 2 أو Phase 3، إذا شعرت بأن التوكنات تنفد:
1. احفظ الحالة بـ git commit
2. أنشئ ملف `PROGRESS.md` يلخّص ما تمّ
3. أعلمني وسأبدأ جلسة جديدة لاستكمال

---

# ⚖️ التوقفات الإلزامية

**يجب أن تتوقف وتنتظر تأكيدي في هذه النقاط:**

1. ✋ بعد Phase 0 (التشخيص)
2. ✋ بعد Phase 1 (Schema)
3. ✋ بعد Phase 2 (Catalog)
4. ✋ بعد Phase 3 (Compute)
5. ✋ بعد Phase 4 (Pricing)
6. ✋ بعد Phase 5 (API)

في كل توقف، اكتب الملخص بصيغة "✅ Phase X Complete" المحددة في كل قسم.

**لا تنتقل من مرحلة لأخرى دون تأكيدي الصريح.**

---

🚀 **ابدأ الآن بـ Phase 0.**
