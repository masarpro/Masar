# برومبت تنفيذي: نظام جدول الكميات المرن (Project BOQ) — مسار

## تعليمات عامة للتنفيذ

أنت تعمل على مشروع **مسار (Masar)** — منصة SaaS لإدارة مشاريع البناء تستهدف المقاولين الصغار والمتوسطين في السعودية.

**التقنيات:**
- Monorepo: Turborepo + pnpm
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- Backend: oRPC (type-safe RPC), Hono.js, Prisma 7, Zod
- Auth: Better Auth
- Database: Supabase PostgreSQL
- اللغة: عربية أولاً (RTL) + إنجليزية (next-intl)
- الخط: IBM Plex Sans Arabic

**قواعد إلزامية:**
1. استخدم Plan Mode أولاً في كل مرحلة — اقرأ الملفات المذكورة وافهم الأنماط قبل الكتابة
2. اتبع الأنماط الموجودة في المشروع حرفياً — لا تخترع أنماط جديدة
3. كل endpoint يستخدم `protectedProcedure` أو `subscriptionProcedure` مع `verifyProjectAccess`
4. `organizationId` شرط إلزامي في كل query
5. Zod validation على كل input بدون استثناء
6. كل نص يظهر للمستخدم يكون عبر `t("key")` من next-intl — لا hardcoded strings
7. Decimal fields تُحوّل بـ `Number()` قبل الإرجاع (النمط الموجود)
8. shadcn/ui فقط للمكونات — إذا احتجت مكون غير موجود: `npx shadcn@latest add [component]`
9. إذا كان الملف أطول من 800 سطر، اكتبه على دفعات (batched append)
10. شغّل `pnpm build` في نهاية كل مرحلة وأصلح أي خطأ

---

## السياق: ما الذي نبنيه ولماذا

المشروع حالياً فيه نظام **دراسات كميات (CostStudy)** يعمل كالتالي:
- دراسة مفصلة من الصفر مع 4 أقسام: إنشائي (StructuralItem)، تشطيبات (FinishingItem)، MEP (MEPItem)، عمالة (LaborItem)
- كل قسم له حقول مختلفة وجدول مستقل
- الدراسات يمكن ربطها بمشروع عبر `CostStudy.projectId`
- تبويب "الكميات والمواصفات" موجود داخل المشروع ويعرض الدراسات المرتبطة

**المشكلة:** هذا النظام يخدم فقط حالة "دراسة من الصفر". لكن المقاولين عندهم احتياجات أخرى:
- **BOQ جاهز يحتاج تسعير:** مناقصة فيها كميات بدون أسعار
- **عقد جاهز بالكامل:** بنود + كميات + أسعار — يحتاج إدخال مباشر
- **بنود مختلطة:** جزء من عقد + جزء يدوي + جزء من دراسة

**الحل:** model جديد `ProjectBOQItem` — جدول موحد ومسطح (flat) يعيش مباشرة على المشروع. كل البنود في مكان واحد بنفس الحقول، بغض النظر عن مصدرها. الأسعار اختيارية (يمكن التسعير لاحقاً).

**العلاقة مع CostStudy:** النظامان يتعايشان. عند ربط دراسة بمشروع أو عند الضغط على "نقل للمشروع"، تُنسخ بنود الدراسة كـ `ProjectBOQItem` مع `sourceType = COST_STUDY`. هكذا جدول BOQ المشروع يحتوي كل شيء في مكان واحد.

---

# المرحلة 1: قاعدة البيانات (Schema)

## الهدف
إضافة model `ProjectBOQItem` مع Enums جديدة وعلاقاته.

## اقرأ أولاً (Plan Mode)
```
packages/database/prisma/schema.prisma    # افهم بنية الـ models والـ enums والـ indexes
```
ابحث تحديداً عن:
- model `Project` — لإضافة العلاقة العكسية
- model `ProjectMilestone` — لإضافة العلاقة العكسية
- model `CostStudy` — لفهم الحقول الحالية
- model `Quotation` و `QuotationItem` — لفهم بنية عروض الأسعار
- model `SubcontractItem` — كمثال على بند له unit, quantity, unitPrice
- أي enum — لفهم نمط تسمية الـ enums

## التعديلات المطلوبة

### 1.1 إضافة Enums جديدة

أضف قبل الـ models (مع باقي الـ enums):

```prisma
enum BOQSourceType {
  MANUAL        // إدخال يدوي
  COST_STUDY    // منسوخ من دراسة كميات
  IMPORTED      // مستورد من Excel
  CONTRACT      // من بنود العقد
  QUOTATION     // منسوخ من عرض سعر
}

enum BOQSection {
  STRUCTURAL    // إنشائي
  FINISHING     // تشطيبات
  MEP           // ميكانيك وكهرباء وسباكة
  LABOR         // عمالة
  GENERAL       // عام
}
```

### 1.2 إضافة model `ProjectBOQItem`

أضف بعد models المشروع الأخرى (بعد `ProjectChangeOrder` مثلاً):

```prisma
model ProjectBOQItem {
  id              String    @id @default(cuid())
  projectId       String
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // المصدر
  sourceType      BOQSourceType @default(MANUAL)
  costStudyId     String?
  costStudy       CostStudy? @relation(fields: [costStudyId], references: [id], onDelete: SetNull)
  sourceItemId    String?       // معرف البند الأصلي (من CostStudy أو Quotation)
  quotationId     String?       // معرف عرض السعر المصدر (إذا sourceType = QUOTATION)

  // الترتيب
  sortOrder       Int       @default(0)

  // بيانات البند
  section         BOQSection @default(GENERAL)
  category        String?     // الفئة الفرعية
  code            String?     // كود/رقم البند في الـ BOQ
  description     String      // وصف البند — مطلوب
  specifications  String?     // المواصفات التفصيلية
  unit            String      // الوحدة (م³، م²، طن، عدد...)

  // الكميات والأسعار
  quantity        Decimal     @default(0)
  unitPrice       Decimal?    // NULL = يحتاج تسعير
  totalPrice      Decimal?    // محسوب: quantity × unitPrice

  // الربط بالمراحل
  projectPhaseId  String?
  projectPhase    ProjectMilestone? @relation("BOQItemPhase", fields: [projectPhaseId], references: [id], onDelete: SetNull)

  // ملاحظات
  notes           String?

  // التتبع
  createdById     String?
  createdBy       User?     @relation("BOQItemCreator", fields: [createdById], references: [id], onDelete: SetNull)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([projectId, organizationId])
  @@index([projectId, section])
  @@index([projectId, sourceType])
  @@index([projectId, projectPhaseId])
  @@index([organizationId])
  @@index([costStudyId])
}
```

### 1.3 تحديث العلاقات العكسية

**في model `Project`** أضف:
```prisma
  boqItems        ProjectBOQItem[]
```

**في model `Organization`** أضف:
```prisma
  boqItems        ProjectBOQItem[]
```

**في model `CostStudy`** أضف:
```prisma
  boqItems        ProjectBOQItem[]
```

**في model `ProjectMilestone`** أضف:
```prisma
  boqItems        ProjectBOQItem[] @relation("BOQItemPhase")
```

**في model `User`** أضف:
```prisma
  createdBOQItems ProjectBOQItem[] @relation("BOQItemCreator")
```

### 1.4 تطبيق التغييرات

```bash
pnpm --filter database db:push
pnpm --filter database generate
```

ثم إذا وُجد سكربت إصلاح Zod:
```bash
node packages/database/prisma/fix-zod-decimal.mjs
```

## معايير النجاح
- [ ] `pnpm --filter database db:push` ينجح بدون أخطاء
- [ ] `pnpm --filter database generate` ينجح
- [ ] `pnpm build` ينجح بدون أخطاء
- [ ] الجدول `ProjectBOQItem` موجود في قاعدة البيانات مع كل الأعمدة
- [ ] الـ Enums `BOQSourceType` و `BOQSection` موجودة
- [ ] كل العلاقات العكسية مضافة بدون تعارض

---

# المرحلة 2: طبقة API — CRUD الأساسي

## الهدف
إنشاء API module `project-boq` مع endpoints الأساسية (list, create, update, delete, summary).

## اقرأ أولاً (Plan Mode)
```
packages/api/modules/project-finance/     # كمثال على module مرتبط بمشروع — كل الملفات
packages/api/modules/project-quantities/  # الـ module الذي أنشأناه سابقاً
packages/api/orpc/router.ts              # كيف تُسجّل الـ modules
packages/api/orpc/procedures.ts          # protectedProcedure, subscriptionProcedure
packages/api/lib/permissions/verify-project-access.ts   # التحقق من صلاحيات المشروع
packages/api/lib/rate-limit.ts           # أنماط الـ rate limiting
```

## البنية المطلوبة

أنشئ مجلد: `packages/api/modules/project-boq/`

### 2.1 ملف `index.ts` — Router الرئيسي

يحتوي على كل الـ endpoints التالية:

---

#### Endpoint: `list` (query)

**الوصف:** قائمة بنود BOQ المشروع مع فلاتر و pagination

**Input Schema (Zod):**
```typescript
{
  projectId: z.string(),
  // Pagination
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  // Filters
  section: z.nativeEnum(BOQSection).optional(),
  sourceType: z.nativeEnum(BOQSourceType).optional(),
  phaseId: z.string().optional(),
  isPriced: z.boolean().optional(), // true = مسعّر, false = غير مسعّر
  search: z.string().max(200).optional(),
  // Sorting
  sortBy: z.enum(["sortOrder", "code", "section", "totalPrice", "createdAt"]).default("sortOrder"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
}
```

**المنطق:**
1. `verifyProjectAccess(projectId, userId, organizationId)` + `hasPermission("quantities", "read")`
2. بناء `where` clause ديناميكياً:
   - `projectId` + `organizationId` — دائماً
   - `section` — إذا حُدد
   - `sourceType` — إذا حُدد
   - `projectPhaseId` — إذا حُدد `phaseId`
   - `isPriced`: إذا `true` → `unitPrice: { not: null }`, إذا `false` → `unitPrice: null`
   - `search` → `description: { contains: search, mode: 'insensitive' }` أو `code: { contains: search }`
3. `prisma.projectBOQItem.findMany({ where, take: limit, skip: offset, orderBy: { [sortBy]: sortDirection }, include: { projectPhase: { select: { id: true, title: true } }, createdBy: { select: { id: true, name: true } } } })`
4. `prisma.projectBOQItem.count({ where })` — للـ total
5. تحويل Decimal → Number في النتائج

**Output:**
```typescript
{
  items: ProjectBOQItem[],
  total: number,
  limit: number,
  offset: number,
}
```

**Rate Limit:** READ

---

#### Endpoint: `getSummary` (query)

**الوصف:** ملخص شامل لبنود BOQ المشروع

**Input Schema:**
```typescript
{ projectId: z.string() }
```

**المنطق:**
1. `verifyProjectAccess`
2. استعلام aggregate:
```typescript
// عدد البنود الإجمالي
const totalCount = await prisma.projectBOQItem.count({ where: { projectId, organizationId } })

// عدد البنود المسعّرة
const pricedCount = await prisma.projectBOQItem.count({ where: { projectId, organizationId, unitPrice: { not: null } } })

// المجاميع حسب القسم
const sectionTotals = await prisma.projectBOQItem.groupBy({
  by: ['section'],
  where: { projectId, organizationId, unitPrice: { not: null } },
  _sum: { totalPrice: true },
  _count: true,
})

// المجاميع حسب المصدر
const sourceTotals = await prisma.projectBOQItem.groupBy({
  by: ['sourceType'],
  where: { projectId, organizationId },
  _count: true,
})

// الإجمالي العام
const grandTotal = await prisma.projectBOQItem.aggregate({
  where: { projectId, organizationId, unitPrice: { not: null } },
  _sum: { totalPrice: true },
})
```

**Output:**
```typescript
{
  totalItems: number,
  pricedItems: number,
  unpricedItems: number,
  sections: {
    STRUCTURAL: { count: number, total: number },
    FINISHING: { count: number, total: number },
    MEP: { count: number, total: number },
    LABOR: { count: number, total: number },
    GENERAL: { count: number, total: number },
  },
  sources: {
    MANUAL: number,
    COST_STUDY: number,
    IMPORTED: number,
    CONTRACT: number,
    QUOTATION: number,
  },
  grandTotal: number,
}
```

**Rate Limit:** READ

---

#### Endpoint: `create` (mutation)

**الوصف:** إضافة بند واحد

**Input Schema:**
```typescript
{
  projectId: z.string(),
  section: z.nativeEnum(BOQSection).default("GENERAL"),
  category: z.string().max(200).optional(),
  code: z.string().max(50).optional(),
  description: z.string().min(1).max(1000),
  specifications: z.string().max(2000).optional(),
  unit: z.string().min(1).max(50),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0).optional().nullable(),
  projectPhaseId: z.string().optional().nullable(),
  notes: z.string().max(1000).optional(),
  sourceType: z.nativeEnum(BOQSourceType).default("MANUAL"),
}
```

**المنطق:**
1. `verifyProjectAccess` + `hasPermission("quantities", "create")`
2. إذا `projectPhaseId` → تحقق أنه ينتمي لنفس المشروع
3. حساب `totalPrice = quantity × unitPrice` (إذا unitPrice موجود)
4. حساب `sortOrder` = آخر sortOrder + 1 في نفس المشروع
5. `prisma.projectBOQItem.create({ data: { ...input, organizationId, totalPrice, sortOrder, createdById: userId } })`

**Rate Limit:** WRITE

---

#### Endpoint: `bulkCreate` (mutation)

**الوصف:** إضافة بنود متعددة دفعة واحدة (للإدخال السريع)

**Input Schema:**
```typescript
{
  projectId: z.string(),
  items: z.array(z.object({
    section: z.nativeEnum(BOQSection).default("GENERAL"),
    category: z.string().max(200).optional(),
    code: z.string().max(50).optional(),
    description: z.string().min(1).max(1000),
    specifications: z.string().max(2000).optional(),
    unit: z.string().min(1).max(50),
    quantity: z.number().min(0),
    unitPrice: z.number().min(0).optional().nullable(),
    projectPhaseId: z.string().optional().nullable(),
    notes: z.string().max(1000).optional(),
    sourceType: z.nativeEnum(BOQSourceType).default("MANUAL"),
  })).min(1).max(200), // حد أقصى 200 بند في الدفعة الواحدة
}
```

**المنطق:**
1. `verifyProjectAccess` + `hasPermission("quantities", "create")`
2. جلب آخر sortOrder في المشروع
3. لكل بند: حساب `totalPrice` و `sortOrder` (تصاعدي)
4. `prisma.$transaction()` مع `createMany` أو حلقة `create`
   - **ملاحظة:** `createMany` لا يدعم computed fields. استخدم `prisma.$transaction(items.map(item => prisma.projectBOQItem.create({ data: ... })))`

**Output:**
```typescript
{ createdCount: number }
```

**Rate Limit:** WRITE

---

#### Endpoint: `update` (mutation)

**الوصف:** تعديل بند واحد

**Input Schema:**
```typescript
{
  projectId: z.string(),
  itemId: z.string(),
  section: z.nativeEnum(BOQSection).optional(),
  category: z.string().max(200).optional().nullable(),
  code: z.string().max(50).optional().nullable(),
  description: z.string().min(1).max(1000).optional(),
  specifications: z.string().max(2000).optional().nullable(),
  unit: z.string().min(1).max(50).optional(),
  quantity: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional().nullable(),
  projectPhaseId: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
}
```

**المنطق:**
1. `verifyProjectAccess` + `hasPermission("quantities", "update")`
2. جلب البند والتحقق أنه ينتمي لنفس المشروع والمنظمة
3. إذا تغير `quantity` أو `unitPrice`: أعد حساب `totalPrice`
   - إذا `unitPrice === null` → `totalPrice = null`
   - إذا `unitPrice !== null` → `totalPrice = quantity × unitPrice`
4. `prisma.projectBOQItem.update({ where: { id: itemId }, data: { ...changes, totalPrice } })`

**Rate Limit:** WRITE

---

#### Endpoint: `delete` (mutation)

**الوصف:** حذف بند واحد

**Input Schema:**
```typescript
{
  projectId: z.string(),
  itemId: z.string(),
}
```

**المنطق:**
1. `verifyProjectAccess` + `hasPermission("quantities", "delete")`
2. تحقق أن البند ينتمي لنفس المشروع والمنظمة
3. `prisma.projectBOQItem.delete({ where: { id: itemId } })`

**Rate Limit:** WRITE

---

#### Endpoint: `bulkDelete` (mutation)

**الوصف:** حذف عدة بنود

**Input Schema:**
```typescript
{
  projectId: z.string(),
  itemIds: z.array(z.string()).min(1).max(100),
}
```

**المنطق:**
1. `verifyProjectAccess` + `hasPermission("quantities", "delete")`
2. `prisma.projectBOQItem.deleteMany({ where: { id: { in: itemIds }, projectId, organizationId } })`

**Output:**
```typescript
{ deletedCount: number }
```

**Rate Limit:** WRITE

---

#### Endpoint: `bulkUpdatePrices` (mutation)

**الوصف:** تسعير عدة بنود دفعة واحدة (وضع التسعير)

**Input Schema:**
```typescript
{
  projectId: z.string(),
  prices: z.array(z.object({
    itemId: z.string(),
    unitPrice: z.number().min(0),
  })).min(1).max(200),
}
```

**المنطق:**
1. `verifyProjectAccess` + `hasPermission("quantities", "update")`
2. جلب كل البنود المطلوبة بـ `findMany` مع `id in [itemIds]`
3. تحقق أنها كلها تنتمي لنفس المشروع
4. `prisma.$transaction()` — لكل بند:
   - `totalPrice = بند.quantity × unitPrice الجديد`
   - `update({ where: { id }, data: { unitPrice, totalPrice } })`

**Output:**
```typescript
{ updatedCount: number }
```

**Rate Limit:** WRITE

---

#### Endpoint: `reorder` (mutation)

**الوصف:** إعادة ترتيب البنود

**Input Schema:**
```typescript
{
  projectId: z.string(),
  orderedIds: z.array(z.string()).min(1).max(500),
}
```

**المنطق:**
1. `verifyProjectAccess` + `hasPermission("quantities", "update")`
2. `prisma.$transaction()` — لكل id في المصفوفة:
   - `update({ where: { id }, data: { sortOrder: index } })`

**Output:**
```typescript
{ success: true }
```

**Rate Limit:** WRITE

---

#### Endpoint: `assignPhase` (mutation)

**الوصف:** تعيين مرحلة لبند واحد أو عدة بنود

**Input Schema:**
```typescript
{
  projectId: z.string(),
  itemIds: z.array(z.string()).min(1).max(100),
  phaseId: z.string().nullable(), // null = إزالة من المرحلة
}
```

**المنطق:**
1. `verifyProjectAccess` + `hasPermission("quantities", "update")`
2. إذا `phaseId !== null`: تحقق أن المرحلة تنتمي لنفس المشروع
3. `prisma.projectBOQItem.updateMany({ where: { id: { in: itemIds }, projectId, organizationId }, data: { projectPhaseId: phaseId } })`

**Output:**
```typescript
{ updatedCount: number }
```

**Rate Limit:** WRITE

---

#### Endpoint: `getUnpricedItems` (query)

**الوصف:** البنود غير المسعّرة فقط (لعرض وضع التسعير)

**Input Schema:**
```typescript
{ projectId: z.string() }
```

**المنطق:**
1. `verifyProjectAccess`
2. `prisma.projectBOQItem.findMany({ where: { projectId, organizationId, unitPrice: null }, orderBy: { sortOrder: 'asc' } })`

**Output:** مصفوفة البنود غير المسعّرة

**Rate Limit:** READ

---

#### Endpoint: `getByPhase` (query)

**الوصف:** البنود مقسمة حسب مراحل المشروع

**Input Schema:**
```typescript
{ projectId: z.string() }
```

**المنطق:**
1. `verifyProjectAccess`
2. جلب مراحل المشروع: `prisma.projectMilestone.findMany({ where: { projectId }, orderBy: { sortOrder: 'asc' } })`
3. لكل مرحلة: جلب بنودها `prisma.projectBOQItem.findMany({ where: { projectId, organizationId, projectPhaseId: milestone.id } })`
4. جلب البنود بدون مرحلة: `where: { projectPhaseId: null }`
5. حساب مجموع كل مرحلة

**Output:**
```typescript
{
  phases: Array<{
    milestone: { id: string, title: string, status: string },
    items: ProjectBOQItem[],
    total: number,
    count: number,
  }>,
  unassigned: {
    items: ProjectBOQItem[],
    total: number,
    count: number,
  },
}
```

**ملاحظة أداء:** يمكن تحسين هذا بـ query واحد مع `groupBy` بدل عدة queries. لكن للبساطة ابدأ بالطريقة العادية — ثم حسّن لاحقاً إذا لزم.

**Rate Limit:** READ

---

### 2.2 تسجيل الـ Module في Router

في `packages/api/orpc/router.ts`:
1. اعمل import للـ module الجديد
2. أضفه في الـ router تحت مفتاح `projectBoq`

اقرأ الملف أولاً وافهم النمط — أضف بنفس الطريقة مثل `projectFinance` أو `projectQuantities`.

## معايير النجاح
- [ ] كل الـ 12 endpoints تعمل
- [ ] `verifyProjectAccess` يُستدعى في كل endpoint
- [ ] Rate limiting مُطبّق (READ/WRITE)
- [ ] Zod validation على كل input
- [ ] Decimal → Number conversion في كل output
- [ ] `pnpm build` ينجح بدون أخطاء

---

# المرحلة 3: API — النسخ والاستيراد

## الهدف
إضافة endpoints النسخ من المصادر المختلفة (دراسة كميات، عرض سعر، Excel).

## اقرأ أولاً (Plan Mode)
```
packages/api/modules/quantities/       # افهم بنية CostStudy وبنودها (structural, finishing, mep, labor)
packages/api/modules/project-quantities/  # الـ module السابق — linkStudy, createStudy
```

ابحث عن:
- كيف تُجلب بنود CostStudy (StructuralItem, FinishingItem, MEPItem, LaborItem)
- كيف تُجلب بنود Quotation (QuotationItem)
- حقول كل نوع من البنود

## الـ Endpoints المطلوبة

أضف هذه الـ endpoints في نفس module `project-boq`:

---

#### Endpoint: `copyFromCostStudy` (mutation)

**الوصف:** نسخ بنود دراسة كميات إلى BOQ المشروع

**Input Schema:**
```typescript
{
  projectId: z.string(),
  studyId: z.string(),
  includeUnpriced: z.boolean().default(true), // نسخ حتى البنود بدون سعر
}
```

**المنطق:**
1. `verifyProjectAccess` + `hasPermission("quantities", "create")`
2. جلب الدراسة والتحقق أنها تنتمي لنفس المنظمة:
   ```
   prisma.costStudy.findFirst({ where: { id: studyId, organizationId }, include: {
     structuralItems: true,
     finishingItems: true,
     mepItems: true,
     laborItems: true,
   }})
   ```
3. إذا لم تُوجد → خطأ NOT_FOUND
4. تحقق أنه لا توجد بنود BOQ مسبقة من نفس الدراسة (منع النسخ المكرر):
   ```
   const existing = await prisma.projectBOQItem.count({ where: { projectId, costStudyId: studyId } })
   if (existing > 0) throw CONFLICT("بنود هذه الدراسة مضافة مسبقاً")
   ```
5. جلب آخر sortOrder
6. تحويل كل نوع بند إلى `ProjectBOQItem`:

   **StructuralItem → BOQItem:**
   ```
   section: STRUCTURAL
   category: item.category
   code: null (أو item.subcategory كـ code)
   description: item.description
   specifications: item.subcategory
   unit: item.unit
   quantity: item.quantity
   unitPrice: item.unitPrice
   totalPrice: item.quantity × item.unitPrice
   sourceType: COST_STUDY
   costStudyId: studyId
   sourceItemId: item.id
   ```

   **FinishingItem → BOQItem:**
   ```
   section: FINISHING
   category: item.room
   code: null
   description: item.item
   specifications: JSON.stringify(item.specData) أو أهم المواصفات كنص
   unit: "م²"
   quantity: item.area
   unitPrice: item.unitPrice
   totalPrice: item.area × item.unitPrice
   sourceType: COST_STUDY
   costStudyId: studyId
   sourceItemId: item.id
   ```

   **MEPItem → BOQItem:**
   ```
   section: MEP
   category: item.system
   code: null
   description: item.description
   specifications: null
   unit: "مقطوعية" أو item.unit إذا كان موجود
   quantity: item.quantity
   unitPrice: item.unitPrice
   totalPrice: item.quantity × item.unitPrice
   sourceType: COST_STUDY
   costStudyId: studyId
   sourceItemId: item.id
   ```

   **LaborItem → BOQItem:**
   ```
   section: LABOR
   category: null
   code: null
   description: item.title
   specifications: null
   unit: "يوم عمل"
   quantity: item.quantity × item.duration (إجمالي أيام العمل)
   unitPrice: item.dailyRate
   totalPrice: item.quantity × item.dailyRate × item.duration
   sourceType: COST_STUDY
   costStudyId: studyId
   sourceItemId: item.id
   ```

7. `prisma.$transaction()` — إنشاء كل البنود

**ملاحظة:** اقرأ حقول كل model بالضبط من schema.prisma. القيم أعلاه تقريبية — طابقها مع الحقول الفعلية.

**Output:**
```typescript
{ copiedCount: number, sections: { structural: number, finishing: number, mep: number, labor: number } }
```

**Rate Limit:** WRITE

---

#### Endpoint: `copyFromQuotation` (mutation)

**الوصف:** نسخ بنود عرض سعر إلى BOQ المشروع

**Input Schema:**
```typescript
{
  projectId: z.string(),
  quotationId: z.string(),
  includePrices: z.boolean().default(true), // نسخ الأسعار أم البنود فقط
}
```

**المنطق:**
1. `verifyProjectAccess` + `hasPermission("quantities", "create")`
2. جلب عرض السعر مع بنوده:
   ```
   prisma.quotation.findFirst({ where: { id: quotationId, organizationId }, include: { items: true } })
   ```
3. لكل `QuotationItem` → `ProjectBOQItem`:
   ```
   section: GENERAL
   description: item.description
   unit: item.unit أو "وحدة"
   quantity: item.quantity
   unitPrice: includePrices ? item.unitPrice : null
   totalPrice: includePrices ? item.amount : null
   sourceType: QUOTATION
   quotationId: quotationId
   sourceItemId: item.id
   ```
4. `prisma.$transaction()` — إنشاء كل البنود

**ملاحظة:** اقرأ حقول `QuotationItem` من schema — قد تكون مختلفة عما ذكرته. طابق مع الحقول الفعلية.

**Output:**
```typescript
{ copiedCount: number }
```

**Rate Limit:** WRITE

---

#### Endpoint: `importFromData` (mutation)

**الوصف:** استيراد بنود من بيانات Excel (JSON بعد parsing في Frontend)

**ملاحظة مهمة:** الـ Frontend يقرأ ملف Excel ويحوله لـ JSON ثم يرسله هنا. الـ API لا يتعامل مع ملفات مباشرة.

**Input Schema:**
```typescript
{
  projectId: z.string(),
  defaultSection: z.nativeEnum(BOQSection).default("GENERAL"),
  defaultSourceType: z.nativeEnum(BOQSourceType).default("IMPORTED"),
  items: z.array(z.object({
    code: z.string().max(50).optional(),
    description: z.string().min(1).max(1000),
    specifications: z.string().max(2000).optional(),
    unit: z.string().min(1).max(50),
    quantity: z.number().min(0),
    unitPrice: z.number().min(0).optional().nullable(),
    section: z.nativeEnum(BOQSection).optional(), // override default
    category: z.string().max(200).optional(),
    notes: z.string().max(1000).optional(),
  })).min(1).max(500), // حد أقصى 500 بند
}
```

**المنطق:**
1. `verifyProjectAccess` + `hasPermission("quantities", "create")`
2. جلب آخر sortOrder
3. لكل بند: حساب `totalPrice`, تعيين `section` (من البند أو الـ default)
4. `prisma.$transaction()` — إنشاء كل البنود

**Output:**
```typescript
{ importedCount: number, pricedCount: number, unpricedCount: number }
```

**Rate Limit:** WRITE

---

#### Endpoint: `getAvailableQuotations` (query)

**الوصف:** قائمة عروض الأسعار المتاحة للنسخ

**Input Schema:**
```typescript
{
  projectId: z.string(),
  search: z.string().max(200).optional(),
}
```

**المنطق:**
1. `verifyProjectAccess`
2. `prisma.quotation.findMany({ where: { organizationId, ...(search ? { OR: [{ quotationNo: { contains: search } }] } : {}) }, include: { _count: { select: { items: true } }, client: { select: { name: true } } }, take: 20, orderBy: { createdAt: 'desc' } })`

**Output:** مصفوفة عروض الأسعار مع عدد البنود واسم العميل

**Rate Limit:** READ

---

#### Endpoint: `getAvailableCostStudies` (query)

**الوصف:** قائمة دراسات الكميات المتاحة للنسخ (التابعة للمنظمة)

**Input Schema:**
```typescript
{
  projectId: z.string(),
  search: z.string().max(200).optional(),
}
```

**المنطق:**
1. `verifyProjectAccess`
2. جلب الدراسات مع استبعاد المنسوخة مسبقاً:
   ```
   // جلب IDs الدراسات المنسوخة مسبقاً لهذا المشروع
   const copiedStudyIds = await prisma.projectBOQItem.findMany({
     where: { projectId, organizationId, sourceType: 'COST_STUDY', costStudyId: { not: null } },
     select: { costStudyId: true },
     distinct: ['costStudyId'],
   })

   prisma.costStudy.findMany({
     where: {
       organizationId,
       id: { notIn: copiedStudyIds.map(s => s.costStudyId!) },
       ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
     },
     include: {
       _count: { select: { structuralItems: true, finishingItems: true, mepItems: true, laborItems: true } },
     },
     take: 20,
     orderBy: { createdAt: 'desc' },
   })
   ```

**Output:** مصفوفة الدراسات مع عدد البنود لكل قسم + علامة "مرتبطة بمشروع" إذا `projectId !== null`

**Rate Limit:** READ

---

## معايير النجاح
- [ ] نسخ من دراسة كميات يعمل — كل أنواع البنود تتحول بشكل صحيح
- [ ] نسخ من عرض سعر يعمل — مع/بدون أسعار
- [ ] استيراد من بيانات JSON يعمل — حتى 500 بند
- [ ] منع النسخ المكرر لنفس الدراسة
- [ ] `pnpm build` ينجح

---

# المرحلة 4: واجهة المستخدم — الصفحة الرئيسية

## الهدف
إنشاء صفحة BOQ الرئيسية داخل المشروع مع الملخص والجدول والفلاتر.

## اقرأ أولاً (Plan Mode)
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/   # الصفحات الحالية
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/page.tsx   # الصفحة الرئيسية الحالية
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/layout.tsx  # Layout التبويبات
apps/web/modules/saas/projects/components/quantities/   # المكونات الحالية
apps/web/modules/saas/shared/components/sidebar/use-sidebar-menu.ts  # أو constants.ts — عناصر sidebar المشروع
apps/web/modules/saas/projects/lib/role-visibility.ts  # صلاحيات عرض التبويبات
```

افهم:
- كيف تبويب "الكميات والمواصفات" الحالي يعمل
- ما هي المكونات الموجودة
- كيف الـ layout ينظم التبويبات الفرعية

## الإستراتيجية

**لا نحذف النظام الحالي.** بدلاً من ذلك نضيف تبويب فرعي جديد "جدول الكميات (BOQ)" داخل تبويب "الكميات والمواصفات" الموجود. التبويبات الفرعية تصبح:

```
الكميات والمواصفات
├── جدول الكميات (BOQ)    ← 🆕 الصفحة الرئيسية الجديدة — تصبح الافتراضية
├── نظرة عامة              ← الصفحة القديمة (ملخص CostStudy)
├── إنشائي
├── تشطيبات
├── MEP
├── عمالة
└── المواد
```

أو — إذا كان أبسط — اجعل صفحة `page.tsx` الرئيسية هي صفحة BOQ الجديدة، وانقل المحتوى القديم لتبويب فرعي "دراسات الكميات".

**اختر الطريقة الأسهل بعد قراءة الكود الحالي.** المهم أن المستخدم عندما يدخل تبويب الكميات يرى جدول BOQ أولاً.

## المكونات المطلوبة

### 4.1 الصفحة الرئيسية (BOQ Overview)

أنشئ أو عدّل:
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/page.tsx
```
أو أنشئ صفحة جديدة:
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/boq/page.tsx
```

**المحتوى:**

**أولاً — Empty State (لا توجد بنود):**
```
📊 لا توجد بنود كميات لهذا المشروع

يمكنك إضافة بنود يدوياً، استيرادها من Excel،
أو نسخها من دراسة كميات أو عرض سعر

[+ إضافة بنود]  [📥 استيراد Excel]  [📊 نسخ من دراسة]  [📎 نسخ من عرض سعر]
```

**ثانياً — بطاقات الملخص (Summary Cards):**
استخدم endpoint `projectBoq.getSummary`. اعرض:
- بطاقة: إجمالي البنود (XX بند — YY مسعّر — ZZ غير مسعّر)
- 5 بطاقات صغيرة: إنشائي، تشطيبات، MEP، عمالة، عام — كل واحدة بالمبلغ
- بطاقة كبيرة: الإجمالي العام

إذا كان هناك بنود غير مسعّرة، اعرض تنبيه:
```
⚠️ XX بند يحتاج تسعير — [ابدأ التسعير]
```

**ثالثاً — شريط الإجراءات:**
أزرار:
- `[+ إضافة بند]` → يفتح CreateItemDialog
- `[📋 إدخال سريع]` → يفتح BulkEntryDialog
- `[📥 استيراد Excel]` → يفتح ImportExcelDialog
- `[📎 نسخ من عرض سعر]` → يفتح CopyFromQuotationDialog
- `[📊 نسخ من دراسة كميات]` → يفتح CopyFromStudyDialog

**رابعاً — الفلاتر:**
صف فلاتر:
- القسم: Select (الكل، إنشائي، تشطيبات، MEP، عمالة، عام)
- المرحلة: Select (الكل، + مراحل المشروع، بدون مرحلة)
- الحالة: Select (الكل، مسعّر، غير مسعّر)
- المصدر: Select (الكل، يدوي، دراسة، مستورد، عقد، عرض سعر)
- بحث: Input text

**خامساً — جدول البنود:**
جدول باستخدام DataTable (TanStack Table):

| العمود | الحقل | ملاحظة |
|--------|-------|--------|
| # | sortOrder | رقم تسلسلي |
| كود | code | قد يكون فارغ |
| الوصف | description | العمود الأعرض |
| الوحدة | unit | |
| الكمية | quantity | تنسيق أرقام |
| سعر الوحدة | unitPrice | ⚠️ إذا null — تنسيق عملة |
| الإجمالي | totalPrice | تنسيق عملة |
| المرحلة | projectPhase.title | dropdown inline للتغيير |
| المصدر | sourceType | Badge ملون |
| إجراءات | — | تعديل، حذف |

الجدول يدعم:
- Pagination (من API)
- ترتيب بالضغط على رأس العمود
- تحديد صفوف (checkboxes) لعمليات bulk
- عند تحديد صفوف يظهر شريط: `[حذف المحدد] [تعيين مرحلة] [تعيين قسم]`

**سادساً — الحاشية:**
صف الإجمالي في أسفل الجدول.

### 4.2 المكونات الفرعية

أنشئ في: `apps/web/modules/saas/projects/components/boq/`

#### `boq-summary-cards.tsx`
- يقبل data من `getSummary`
- 5+1 بطاقات
- تنسيق عملة سعودية

#### `boq-items-table.tsx`
- DataTable مع الأعمدة المذكورة
- Pagination
- Sorting
- Row selection
- Inline phase selector
- Source badge (لون مختلف لكل sourceType)

#### `boq-filters.tsx`
- الفلاتر الأربعة + البحث
- يُحدّث URL params (أو state محلي)

#### `boq-bulk-actions.tsx`
- يظهر عند تحديد صفوف
- أزرار: حذف المحدد، تعيين مرحلة، تعيين قسم

#### `create-item-dialog.tsx`
- Dialog لإضافة بند واحد
- Form: قسم، كود، وصف، مواصفات، وحدة، كمية، سعر (اختياري)، مرحلة، ملاحظات
- زر الحفظ يستدعي `projectBoq.create`

#### `bulk-entry-dialog.tsx`
- Dialog كبير (sheet) لإدخال بنود متعددة
- جدول editable: كود، وصف، وحدة، كمية، سعر (اختياري)
- فوق الجدول: اختيار القسم الافتراضي، المرحلة، المصدر
- زر "+ صف جديد" في الأسفل
- Enter ينتقل لصف جديد
- زر الحفظ يستدعي `projectBoq.bulkCreate`

#### `pricing-mode-dialog.tsx`
- Dialog/Sheet لتسعير البنود غير المسعّرة
- يجلب بيانات من `projectBoq.getUnpricedItems`
- جدول يعرض: الوصف، المواصفات، الوحدة، الكمية، [input سعر الوحدة]
- الإجمالي يتحدث تلقائياً
- زر "حفظ الأسعار" يستدعي `projectBoq.bulkUpdatePrices`

### 4.3 ملف loading.tsx

أنشئ `loading.tsx` في مجلد صفحة الـ BOQ — skeleton يحاكي البطاقات + الجدول.

## معايير النجاح
- [ ] الصفحة الرئيسية تعرض الملخص والجدول
- [ ] Empty state يظهر عند عدم وجود بنود
- [ ] إضافة بند واحد يعمل
- [ ] إدخال بنود متعددة (bulk entry) يعمل
- [ ] وضع التسعير يعمل
- [ ] الفلاتر تعمل
- [ ] Pagination يعمل
- [ ] تحديد صفوف + bulk actions يعمل
- [ ] RTL يعمل بشكل صحيح
- [ ] `pnpm build` ينجح

---

# المرحلة 5: واجهة النسخ والاستيراد

## الهدف
إنشاء dialogs النسخ من دراسة كميات، عرض سعر، واستيراد Excel.

## اقرأ أولاً (Plan Mode)
```
apps/web/modules/saas/projects/components/boq/    # المكونات التي أنشأتها في المرحلة 4
apps/web/modules/saas/projects/components/quantities/link-study-dialog.tsx   # إذا موجود — كمثال
```

## المكونات المطلوبة

أضف في: `apps/web/modules/saas/projects/components/boq/`

### 5.1 `copy-from-study-dialog.tsx`

**الوصف:** Dialog لنسخ بنود من دراسة كميات

**التصميم:**
1. بحث عن دراسات (يستدعي `projectBoq.getAvailableCostStudies`)
2. قائمة الدراسات المتاحة — لكل دراسة:
   - الاسم، الموقع
   - عدد البنود: إنشائي (X)، تشطيبات (Y)، MEP (Z)، عمالة (W)
   - Badge "مرتبطة بمشروع: [اسم]" إذا `projectId !== null`
3. زر "نسخ" بجانب كل دراسة
4. عند الضغط: يستدعي `projectBoq.copyFromCostStudy`
5. بعد النجاح: toast نجاح + invalidate queries + إغلاق

### 5.2 `copy-from-quotation-dialog.tsx`

**الوصف:** Dialog لنسخ بنود من عرض سعر

**التصميم:**
1. بحث عن عروض أسعار (يستدعي `projectBoq.getAvailableQuotations`)
2. قائمة العروض — لكل عرض:
   - رقم العرض، العميل، عدد البنود، الإجمالي
3. خيار: "☑ نسخ الأسعار مع البنود" / "☐ بنود فقط بدون أسعار"
4. زر "نسخ"
5. عند الضغط: يستدعي `projectBoq.copyFromQuotation`

### 5.3 `import-excel-dialog.tsx`

**الوصف:** Dialog لاستيراد بنود من Excel

**التصميم — 3 خطوات:**

**الخطوة 1: رفع الملف**
- منطقة drag & drop أو زر اختيار ملف
- يقبل: `.xlsx`, `.xls`, `.csv`
- يقرأ الملف في الـ frontend باستخدام مكتبة **SheetJS** (xlsx):
  ```
  import * as XLSX from 'xlsx'
  // المكتبة موجودة كـ dependency في المشروع أو أضفها: pnpm add xlsx --filter web
  ```
- بعد القراءة: استخراج أسماء الأعمدة والصفوف

**الخطوة 2: مطابقة الأعمدة (Column Mapping)**
- جدول يعرض: اسم العمود في الملف ← dropdown لاختيار الحقل المقابل في مسار
- الحقول المتاحة: كود البند، الوصف (مطلوب)، الوحدة (مطلوب)، الكمية (مطلوب)، سعر الوحدة، المواصفات، الفئة، ملاحظات
- Auto-detect: حاول مطابقة تلقائية بناءً على اسم العمود:
  - "Item No" / "رقم" / "Code" / "كود" → كود البند
  - "Description" / "الوصف" / "البند" → الوصف
  - "Unit" / "الوحدة" → الوحدة
  - "Qty" / "Quantity" / "الكمية" → الكمية
  - "Rate" / "Price" / "السعر" / "سعر الوحدة" → سعر الوحدة
- القسم الافتراضي: dropdown (عام، إنشائي، تشطيبات، MEP، عمالة)
- المصدر: IMPORTED (ثابت)

**الخطوة 3: معاينة**
- جدول يعرض أول 10 صفوف كما ستُستورد
- ملخص: "XX بند — YY مسعّر — ZZ بدون سعر — AA صف تم تجاهله (بيانات ناقصة)"
- الصفوف المتجاهلة: التي ليس فيها وصف أو وحدة أو كمية
- زر "استيراد XX بند"

**عند الاستيراد:**
- تحويل البيانات لـ JSON بالتنسيق المطلوب
- استدعاء `projectBoq.importFromData`
- Toast نجاح + invalidate queries

### 5.4 ملاحظات تقنية للاستيراد

- **SheetJS:** تحقق إذا المكتبة موجودة في `apps/web/package.json`. إذا لا:
  ```bash
  pnpm add xlsx --filter web
  ```
- **حجم الملف:** حد أقصى 5MB في الـ frontend (تحقق قبل القراءة)
- **عدد الصفوف:** حد أقصى 500 بند (تحقق بعد القراءة)
- **encoding:** SheetJS تتعامل مع UTF-8 والعربية تلقائياً

## معايير النجاح
- [ ] نسخ من دراسة كميات يعمل — كل أنواع البنود
- [ ] نسخ من عرض سعر يعمل — مع/بدون أسعار
- [ ] استيراد Excel يعمل — مع column mapping
- [ ] auto-detect الأعمدة يعمل (عربي + إنجليزي)
- [ ] معاينة قبل الاستيراد تعمل
- [ ] حدود الحجم والعدد مُطبّقة
- [ ] `pnpm build` ينجح

---

# المرحلة 6: الترجمة (i18n)

## الهدف
إضافة كل مفاتيح الترجمة لنظام BOQ.

## اقرأ أولاً
```
packages/i18n/messages/ar.json
packages/i18n/messages/en.json
```
ابحث عن قسم `projectQuantities` الموجود وأضف بجانبه قسم `projectBoq`.

## المفاتيح المطلوبة

### العربية:
```json
{
  "projectBoq": {
    "title": "جدول الكميات",
    "boq": "BOQ",
    "summary": {
      "title": "ملخص الكميات",
      "totalItems": "إجمالي البنود",
      "pricedItems": "بنود مسعّرة",
      "unpricedItems": "بنود تحتاج تسعير",
      "grandTotal": "الإجمالي العام",
      "structural": "إنشائي",
      "finishing": "تشطيبات",
      "mep": "MEP",
      "labor": "عمالة",
      "general": "عام"
    },
    "emptyState": {
      "title": "لا توجد بنود كميات لهذا المشروع",
      "description": "يمكنك إضافة بنود يدوياً، استيرادها من Excel، أو نسخها من دراسة كميات أو عرض سعر"
    },
    "actions": {
      "addItem": "إضافة بند",
      "bulkEntry": "إدخال سريع",
      "importExcel": "استيراد Excel",
      "copyFromStudy": "نسخ من دراسة كميات",
      "copyFromQuotation": "نسخ من عرض سعر",
      "startPricing": "ابدأ التسعير",
      "deleteSelected": "حذف المحدد",
      "assignPhase": "تعيين مرحلة",
      "assignSection": "تعيين قسم",
      "save": "حفظ",
      "cancel": "إلغاء"
    },
    "filters": {
      "allSections": "كل الأقسام",
      "allPhases": "كل المراحل",
      "allStatuses": "كل الحالات",
      "allSources": "كل المصادر",
      "priced": "مسعّر",
      "unpriced": "غير مسعّر",
      "noPhase": "بدون مرحلة",
      "search": "بحث في البنود..."
    },
    "table": {
      "code": "كود",
      "description": "الوصف",
      "unit": "الوحدة",
      "quantity": "الكمية",
      "unitPrice": "سعر الوحدة",
      "totalPrice": "الإجمالي",
      "phase": "المرحلة",
      "source": "المصدر",
      "section": "القسم",
      "actions": "إجراءات",
      "noPrice": "بدون سعر",
      "total": "المجموع"
    },
    "source": {
      "MANUAL": "يدوي",
      "COST_STUDY": "دراسة كميات",
      "IMPORTED": "مستورد",
      "CONTRACT": "عقد",
      "QUOTATION": "عرض سعر"
    },
    "section": {
      "STRUCTURAL": "إنشائي",
      "FINISHING": "تشطيبات",
      "MEP": "MEP",
      "LABOR": "عمالة",
      "GENERAL": "عام"
    },
    "createDialog": {
      "title": "إضافة بند جديد",
      "code": "كود البند",
      "codePlaceholder": "مثال: A-01",
      "description": "الوصف",
      "descriptionPlaceholder": "وصف البند...",
      "specifications": "المواصفات",
      "specificationsPlaceholder": "المواصفات التفصيلية...",
      "unit": "الوحدة",
      "unitPlaceholder": "مثال: م³، م²، طن",
      "quantity": "الكمية",
      "unitPrice": "سعر الوحدة",
      "unitPricePlaceholder": "اتركه فارغاً للتسعير لاحقاً",
      "section": "القسم",
      "phase": "المرحلة",
      "category": "الفئة",
      "notes": "ملاحظات",
      "create": "إضافة البند"
    },
    "bulkEntry": {
      "title": "إدخال بنود متعددة",
      "defaultSection": "القسم الافتراضي",
      "defaultPhase": "المرحلة الافتراضية",
      "defaultSource": "المصدر",
      "addRow": "صف جديد",
      "hint": "اترك عمود السعر فارغاً إذا كنت تريد التسعير لاحقاً",
      "saveItems": "حفظ {count} بند"
    },
    "pricing": {
      "title": "تسعير البنود",
      "unpricedCount": "{count} بند غير مسعّر",
      "totalAfterPricing": "المجموع بعد التسعير",
      "savePrices": "حفظ الأسعار"
    },
    "importExcel": {
      "title": "استيراد بنود من Excel",
      "step1": "رفع الملف",
      "step2": "مطابقة الأعمدة",
      "step3": "معاينة واستيراد",
      "dropzone": "اسحب الملف هنا أو اضغط للاختيار",
      "supportedFormats": "يدعم: xlsx, xls, csv",
      "fileColumn": "عمود الملف",
      "masarField": "حقل مسار",
      "example": "مثال",
      "skip": "تجاهل",
      "required": "مطلوب",
      "preview": "معاينة",
      "foundItems": "تم العثور على {count} بند",
      "pricedCount": "{count} مسعّر",
      "unpricedCount": "{count} بدون سعر",
      "skippedRows": "{count} صف تم تجاهله — بيانات غير مكتملة",
      "importItems": "استيراد {count} بند",
      "maxFileSize": "الحد الأقصى لحجم الملف: 5MB",
      "maxItems": "الحد الأقصى: 500 بند"
    },
    "copyStudy": {
      "title": "نسخ بنود من دراسة كميات",
      "search": "ابحث عن دراسة...",
      "noStudies": "لا توجد دراسات متاحة للنسخ",
      "alreadyCopied": "تم نسخ بنود هذه الدراسة مسبقاً",
      "linkedTo": "مرتبطة بمشروع: {name}",
      "copy": "نسخ البنود",
      "itemCount": "{count} بند"
    },
    "copyQuotation": {
      "title": "نسخ بنود من عرض سعر",
      "search": "ابحث عن عرض سعر...",
      "noQuotations": "لا توجد عروض أسعار",
      "includePrices": "نسخ الأسعار مع البنود",
      "itemsOnly": "نسخ البنود فقط (بدون أسعار — للتسعير لاحقاً)",
      "copy": "نسخ البنود",
      "itemCount": "{count} بند",
      "client": "العميل"
    },
    "toast": {
      "itemCreated": "تم إضافة البند بنجاح",
      "itemsCreated": "تم إضافة {count} بند بنجاح",
      "itemUpdated": "تم تحديث البند",
      "itemDeleted": "تم حذف البند",
      "itemsDeleted": "تم حذف {count} بند",
      "pricesUpdated": "تم تحديث أسعار {count} بند",
      "phaseAssigned": "تم تعيين المرحلة",
      "copiedFromStudy": "تم نسخ {count} بند من الدراسة",
      "copiedFromQuotation": "تم نسخ {count} بند من عرض السعر",
      "importedFromExcel": "تم استيراد {count} بند"
    },
    "confirm": {
      "deleteItem": "هل أنت متأكد من حذف هذا البند؟",
      "deleteItems": "هل أنت متأكد من حذف {count} بند؟",
      "deleteTitle": "حذف بند",
      "deleteItemsTitle": "حذف بنود"
    },
    "unpricedWarning": "{count} بند يحتاج تسعير"
  }
}
```

### الإنجليزية:
أنشئ نفس البنية بالإنجليزية. المفاتيح نفسها، القيم بالإنجليزي. أهم الترجمات:
- "جدول الكميات" → "Bill of Quantities"
- "إدخال سريع" → "Quick Entry"
- "استيراد Excel" → "Import from Excel"
- "نسخ من دراسة كميات" → "Copy from Cost Study"
- "نسخ من عرض سعر" → "Copy from Quotation"
- "ابدأ التسعير" → "Start Pricing"
- "بند مسعّر" → "Priced item"
- "بدون سعر" → "Unpriced"

## معايير النجاح
- [ ] كل النصوص في الواجهة تستخدم `t("projectBoq.xxx")`
- [ ] لا يوجد نص hardcoded
- [ ] كلا الملفين يحتويان نفس المفاتيح
- [ ] `pnpm build` ينجح

---

# المرحلة 7: React Query Hooks

## الهدف
إنشاء hooks لاستدعاء كل endpoints الـ BOQ.

## اقرأ أولاً
```
apps/web/modules/saas/projects/hooks/   # ابحث عن hooks موجودة واتبع نفس النمط
```
أو ابحث في أي مكان في `apps/web/modules/saas/` عن `useQuery` و `useMutation` لفهم النمط.

## الملف المطلوب

أنشئ:
```
apps/web/modules/saas/projects/hooks/use-project-boq.ts
```

### الـ Hooks:

```typescript
// Queries
useProjectBOQList(projectId, filters)      → projectBoq.list
useProjectBOQSummary(projectId)            → projectBoq.getSummary
useProjectBOQUnpriced(projectId)           → projectBoq.getUnpricedItems
useProjectBOQByPhase(projectId)            → projectBoq.getByPhase
useAvailableCostStudies(projectId, search) → projectBoq.getAvailableCostStudies
useAvailableQuotations(projectId, search)  → projectBoq.getAvailableQuotations

// Mutations
useCreateBOQItem()          → projectBoq.create
useBulkCreateBOQItems()     → projectBoq.bulkCreate
useUpdateBOQItem()          → projectBoq.update
useDeleteBOQItem()          → projectBoq.delete
useBulkDeleteBOQItems()     → projectBoq.bulkDelete
useBulkUpdatePrices()       → projectBoq.bulkUpdatePrices
useReorderBOQItems()        → projectBoq.reorder
useAssignPhase()            → projectBoq.assignPhase
useCopyFromCostStudy()      → projectBoq.copyFromCostStudy
useCopyFromQuotation()      → projectBoq.copyFromQuotation
useImportBOQData()          → projectBoq.importFromData
```

### Invalidation Strategy:

كل mutation يعمل invalidate لـ:
```typescript
queryClient.invalidateQueries({ queryKey: ["project-boq", projectId] })
```

Mutations التي تؤثر على الإجمالي (create, delete, updatePrices, copy, import) تعمل أيضاً:
```typescript
queryClient.invalidateQueries({ queryKey: ["project-finance", projectId] })
```

### Query Keys:
```typescript
["project-boq", "list", projectId, filters]
["project-boq", "summary", projectId]
["project-boq", "unpriced", projectId]
["project-boq", "by-phase", projectId]
["project-boq", "available-studies", projectId, search]
["project-boq", "available-quotations", projectId, search]
```

## معايير النجاح
- [ ] كل الـ hooks تعمل
- [ ] Invalidation صحيح بعد كل mutation
- [ ] Loading/Error states تُعالج بشكل صحيح
- [ ] `pnpm build` ينجح

---

# المرحلة 8: التكامل والتحسينات

## الهدف
ربط BOQ مع باقي أجزاء المشروع.

## اقرأ أولاً
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/page.tsx  # Dashboard المشروع
packages/api/modules/project-finance/   # ملخص مالي — getSummary
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/   # صفحات الدراسات
```

## التعديلات

### 8.1 بطاقة BOQ في Dashboard المشروع

في صفحة المشروع الرئيسية، أضف بطاقة:
- عنوان: "جدول الكميات"
- المحتوى: إجمالي البنود، عدد المسعّر/غير المسعّر، الإجمالي
- إذا لا توجد بنود: "لم يتم إضافة بنود كميات بعد"
- زر: "عرض التفاصيل" → يفتح تبويب BOQ

أنشئ component:
```
apps/web/modules/saas/projects/components/boq/boq-dashboard-card.tsx
```

### 8.2 تحديث Layout التبويبات (إذا لزم)

تأكد أن تبويب "الكميات والمواصفات" في layout المشروع يفتح صفحة BOQ كصفحة افتراضية.

### 8.3 مقارنة مقدر vs فعلي

في الملخص المالي للمشروع (إذا وُجد `getSummary` في project-finance):
- أضف حقل `estimatedCost` = إجمالي BOQ المسعّر
- اعرض في الواجهة: "التكلفة المقدرة (من BOQ): X ر.س" مقابل "المصروفات الفعلية: Y ر.س"

هذا يتطلب:
1. تعديل endpoint `projectFinance.getSummary` لجلب إجمالي BOQ
2. تعديل الواجهة لعرض المقارنة

### 8.4 loading.tsx لكل صفحة جديدة

تأكد من وجود loading.tsx مناسب لصفحة BOQ — skeleton بطاقات + جدول.

## معايير النجاح
- [ ] بطاقة BOQ تظهر في Dashboard المشروع
- [ ] الـ layout يفتح صفحة BOQ بشكل صحيح
- [ ] Loading states تعمل
- [ ] `pnpm build` ينجح

---

# المرحلة 9: التحقق النهائي

## المطلوب

### 9.1 Build & Type Check
```bash
pnpm type-check
pnpm build
pnpm biome check .
```
أصلح كل الأخطاء.

### 9.2 قائمة التحقق الشاملة

**Schema:**
- [ ] Model `ProjectBOQItem` موجود بكل الحقول
- [ ] Enums `BOQSourceType` و `BOQSection` موجودة
- [ ] العلاقات العكسية على Project, Organization, CostStudy, ProjectMilestone, User
- [ ] Indexes صحيحة

**API (16 endpoint):**
- [ ] list (query + pagination + filters)
- [ ] getSummary (query)
- [ ] create (mutation)
- [ ] bulkCreate (mutation)
- [ ] update (mutation)
- [ ] delete (mutation)
- [ ] bulkDelete (mutation)
- [ ] bulkUpdatePrices (mutation)
- [ ] reorder (mutation)
- [ ] assignPhase (mutation)
- [ ] getUnpricedItems (query)
- [ ] getByPhase (query)
- [ ] copyFromCostStudy (mutation)
- [ ] copyFromQuotation (mutation)
- [ ] importFromData (mutation)
- [ ] getAvailableCostStudies (query)
- [ ] getAvailableQuotations (query)

**Frontend:**
- [ ] صفحة BOQ الرئيسية (ملخص + جدول + فلاتر)
- [ ] Empty state
- [ ] إضافة بند واحد (dialog)
- [ ] إدخال سريع (bulk entry dialog)
- [ ] وضع التسعير (pricing dialog)
- [ ] نسخ من دراسة كميات (dialog)
- [ ] نسخ من عرض سعر (dialog)
- [ ] استيراد Excel (dialog مع 3 خطوات)
- [ ] تعيين مراحل (inline + bulk)
- [ ] حذف (فردي + bulk)
- [ ] بطاقة في Dashboard
- [ ] Loading states

**i18n:**
- [ ] كل النصوص بالعربية عبر t()
- [ ] كل النصوص بالإنجليزية
- [ ] لا hardcoded strings

**عام:**
- [ ] RTL يعمل صحيح
- [ ] `pnpm build` ينجح
- [ ] `pnpm type-check` ينجح
- [ ] الصلاحيات (quantities.read/create/update/delete) مُطبّقة
- [ ] Rate limiting مُطبّق

---

# ملاحظات مهمة لكل المراحل

1. **اقرأ قبل ما تكتب:** كل مرحلة فيها "اقرأ أولاً" — هذا ليس اقتراح، هذا إلزام. الأنماط الموجودة هي المرجع.

2. **Decimal → Number:** كل حقل Decimal من Prisma يُحوّل بـ `Number()` قبل الإرجاع. هذا النمط موجود في كل الـ modules.

3. **تنسيق العملة:** ابحث عن `formatCurrency` أو `formatNumber` في المشروع واستخدمه. لا تخترع formatter جديد.

4. **خطأ "Prisma is not defined":** بعد `prisma generate`، شغّل `fix-zod-decimal.mjs` إذا موجود.

5. **pnpm commands:**
   - Schema: `pnpm --filter database db:push`
   - Generate: `pnpm --filter database generate`
   - Build: `pnpm build`
   - Type check: `pnpm type-check`

6. **إضافة مكون shadcn:** `npx shadcn@latest add [component]` من مجلد `apps/web/`

7. **Max output:** إذا كان الملف أطول من 800 سطر، اكتبه على دفعات (batched append ≤800 سطر لكل عملية).

8. **Role Visibility:** تأكد أن `boq` أو `quantities` مضاف في `role-visibility.ts` لكل الأدوار المناسبة (تم إضافته سابقاً لـ quantities).

9. **لا تكسر النظام الحالي:** CostStudy ونظام project-quantities يبقيان يعملان. النظام الجديد يُضاف بجانبهم.
