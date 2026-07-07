# برومبت ربط دراسات الكميات بالمشاريع — مسار

## تعليمات عامة

أنت تعمل على مشروع **مسار (Masar)** — منصة SaaS لإدارة مشاريع البناء.
المشروع monorepo يستخدم: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma 7, oRPC, Better Auth.
قاعدة البيانات: Supabase PostgreSQL.
اللغة الأساسية: عربية (RTL) مع دعم إنجليزي (next-intl).

**قبل البدء:** استخدم Plan Mode لقراءة الملفات المذكورة في كل مرحلة وفهم الأنماط الموجودة، ثم نفّذ.

---

# المرحلة 1: تعديل قاعدة البيانات (Schema)

## الهدف
إضافة الربط بين `CostStudy` و `Project`، وربط بنود الكميات بمراحل المشروع (Milestones).

## الملفات المطلوب قراءتها أولاً
```
packages/database/prisma/schema.prisma
```
ابحث عن:
- model `CostStudy` وافهم حقوله وعلاقاته الحالية
- model `StructuralItem`, `FinishingItem`, `MEPItem`, `LaborItem`
- model `Project` وعلاقاته
- model `ProjectMilestone` وحقوله
- كيف تُعرّف العلاقات والـ indexes في باقي الـ models

## التعديلات المطلوبة

### 1.1 إضافة `projectId` على `CostStudy`

في model `CostStudy` أضف:

```prisma
  // ربط اختياري بمشروع
  projectId    String?
  project      Project?   @relation(fields: [projectId], references: [id], onDelete: SetNull)
```

وأضف index جديد:
```prisma
  @@index([organizationId, projectId])
```

**ملاحظة مهمة:** `projectId` اختياري (Optional) لأن الدراسة يمكن أن تكون عامة (بدون مشروع) أو مرتبطة بمشروع. لا نكسر أي شيء موجود.

### 1.2 إضافة `projectPhaseId` على بنود الكميات

في كل من الـ models التالية أضف نفس الحقلين:

**model `StructuralItem`:**
```prisma
  projectPhaseId   String?
  projectPhase     ProjectMilestone?  @relation("StructuralItemPhase", fields: [projectPhaseId], references: [id], onDelete: SetNull)
```

**model `FinishingItem`:**
```prisma
  projectPhaseId   String?
  projectPhase     ProjectMilestone?  @relation("FinishingItemPhase", fields: [projectPhaseId], references: [id], onDelete: SetNull)
```

**model `MEPItem`:**
```prisma
  projectPhaseId   String?
  projectPhase     ProjectMilestone?  @relation("MEPItemPhase", fields: [projectPhaseId], references: [id], onDelete: SetNull)
```

**model `LaborItem`:**
```prisma
  projectPhaseId   String?
  projectPhase     ProjectMilestone?  @relation("LaborItemPhase", fields: [projectPhaseId], references: [id], onDelete: SetNull)
```

### 1.3 تحديث model `Project`

أضف العلاقة العكسية في model `Project`:
```prisma
  costStudies      CostStudy[]
```

### 1.4 تحديث model `ProjectMilestone`

أضف العلاقات العكسية في model `ProjectMilestone`:
```prisma
  structuralItems  StructuralItem[]  @relation("StructuralItemPhase")
  finishingItems   FinishingItem[]   @relation("FinishingItemPhase")
  mepItems         MEPItem[]         @relation("MEPItemPhase")
  laborItems       LaborItem[]       @relation("LaborItemPhase")
```

### 1.5 تطبيق التغييرات

```bash
pnpm --filter database db:push
pnpm --filter database generate
```

ثم شغّل سكربت إصلاح Zod إذا كان موجوداً:
```bash
node packages/database/prisma/fix-zod-decimal.mjs
```

## معايير النجاح للمرحلة 1
- [ ] `pnpm --filter database db:push` ينجح بدون أخطاء
- [ ] `pnpm --filter database generate` ينجح
- [ ] العلاقات الجديدة تظهر في Prisma Client
- [ ] الدراسات الموجودة تبقى تعمل (projectId = null)
- [ ] `pnpm build` ينجح بدون أخطاء

---

# المرحلة 2: طبقة API — Module جديد `project-quantities`

## الهدف
إنشاء API module جديد يوفر endpoints لإدارة كميات المشروع من داخل سياق المشروع.

## الملفات المطلوب قراءتها أولاً
```
packages/api/modules/quantities/           # كل الملفات — افهم البنية الحالية
packages/api/modules/project-finance/      # كمثال على module مرتبط بمشروع
packages/api/modules/project-timeline/     # كمثال آخر — خاصة listMilestones
packages/api/orpc/router.ts               # لفهم كيف تُسجّل الـ modules
packages/api/orpc/procedures.ts           # لفهم protectedProcedure و subscriptionProcedure
packages/api/lib/permissions/verify-project-access.ts  # لفهم التحقق من صلاحيات المشروع
```

## البنية المطلوبة

### 2.1 إنشاء مجلد الـ module

أنشئ: `packages/api/modules/project-quantities/`

### 2.2 ملف `index.ts` — Router

```
packages/api/modules/project-quantities/index.ts
```

هذا الملف يُعرّف الـ router ويجمع كل الـ endpoints.

الـ endpoints المطلوبة:

#### `getSummary` (query)
- **الوصف:** ملخص كميات المشروع — إجمالي كل قسم (إنشائي، تشطيبات، MEP، عمالة) + الإجمالي العام
- **Input:** `{ projectId: string }`
- **المنطق:**
  1. `verifyProjectAccess(projectId, userId, organizationId)`
  2. جلب كل `CostStudy` المرتبطة بالمشروع (`where: { projectId, organizationId }`)
  3. لكل دراسة، حساب مجموع بنودها (structural, finishing, MEP, labor)
  4. إرجاع الملخص مع تفصيل كل دراسة
- **Output:**
```typescript
{
  studies: Array<{
    id: string
    name: string
    totalStructural: number
    totalFinishing: number
    totalMEP: number
    totalLabor: number
    subtotal: number
    overheadPercent: number
    profitPercent: number
    vatPercent: number
    grandTotal: number
  }>
  totals: {
    structural: number
    finishing: number
    mep: number
    labor: number
    subtotalBeforeMarkup: number
    grandTotal: number
  }
  studyCount: number
}
```

#### `listStudies` (query)
- **الوصف:** قائمة دراسات الكميات المرتبطة بالمشروع
- **Input:** `{ projectId: string }`
- **المنطق:** `prisma.costStudy.findMany({ where: { projectId, organizationId }, include: { _count: { select: { structuralItems: true, finishingItems: true, mepItems: true, laborItems: true } } } })`
- **Output:** مصفوفة الدراسات مع عدد البنود لكل قسم

#### `linkStudy` (mutation)
- **الوصف:** ربط دراسة كميات موجودة (عامة) بالمشروع
- **Input:** `{ projectId: string, studyId: string }`
- **المنطق:**
  1. `verifyProjectAccess` + `hasPermission("quantities", "update")`
  2. تحقق أن الدراسة تنتمي لنفس المنظمة
  3. تحقق أن الدراسة ليست مرتبطة بمشروع آخر (إذا `projectId !== null` → خطأ CONFLICT)
  4. `prisma.costStudy.update({ where: { id: studyId }, data: { projectId } })`
- **Output:** الدراسة بعد التحديث

#### `unlinkStudy` (mutation)
- **الوصف:** فك ربط دراسة من المشروع (تعود عامة)
- **Input:** `{ projectId: string, studyId: string }`
- **المنطق:**
  1. `verifyProjectAccess` + `hasPermission("quantities", "update")`
  2. تحقق أن الدراسة مرتبطة فعلاً بهذا المشروع
  3. `prisma.costStudy.update({ where: { id: studyId }, data: { projectId: null } })`
  4. أيضاً أزل `projectPhaseId` من كل بنود هذه الدراسة (لأنها لم تعد مرتبطة بمشروع):
     ```
     prisma.structuralItem.updateMany({ where: { costStudyId: studyId }, data: { projectPhaseId: null } })
     // نفس الشيء لـ finishingItem, mepItem, laborItem
     ```
- **Output:** الدراسة بعد التحديث

#### `createStudy` (mutation)
- **الوصف:** إنشاء دراسة كميات جديدة مرتبطة بالمشروع مباشرة
- **Input:** `{ projectId: string, name: string, location?: string, floors?: number, area?: number, overheadPercent?: number, profitPercent?: number, vatPercent?: number }`
- **المنطق:**
  1. `verifyProjectAccess` + `hasPermission("quantities", "create")`
  2. إنشاء `CostStudy` مع `projectId` محدد
  3. إذا لم يُحدد `name`، استخدم اسم المشروع: `دراسة كميات - ${project.name}`
- **Output:** الدراسة الجديدة

#### `getPhaseBreakdown` (query)
- **الوصف:** تفصيل الكميات حسب مراحل المشروع
- **Input:** `{ projectId: string, studyId?: string }`
- **المنطق:**
  1. `verifyProjectAccess`
  2. جلب مراحل المشروع (`ProjectMilestone`) مع البنود المرتبطة بكل مرحلة
  3. جلب البنود غير المصنفة (`projectPhaseId = null`) من الدراسات المرتبطة بالمشروع
  4. إذا حُدد `studyId`، فلتر فقط بنود تلك الدراسة
- **Output:**
```typescript
{
  phases: Array<{
    milestone: { id: string, title: string, status: string, sortOrder: number }
    structural: StructuralItem[]
    finishing: FinishingItem[]
    mep: MEPItem[]
    labor: LaborItem[]
    phaseTotal: number
  }>
  unassigned: {
    structural: StructuralItem[]
    finishing: FinishingItem[]
    mep: MEPItem[]
    labor: LaborItem[]
    total: number
  }
}
```

#### `assignItemToPhase` (mutation)
- **الوصف:** تعيين بند كميات لمرحلة معينة في المشروع
- **Input:** `{ projectId: string, itemId: string, itemType: "structural" | "finishing" | "mep" | "labor", phaseId: string | null }`
- **المنطق:**
  1. `verifyProjectAccess` + `hasPermission("quantities", "update")`
  2. تحقق أن البند ينتمي لدراسة مرتبطة بهذا المشروع
  3. تحقق أن المرحلة تنتمي لهذا المشروع (إذا phaseId !== null)
  4. حدّث `projectPhaseId` على البند المناسب حسب `itemType`
- **Output:** البند بعد التحديث

#### `bulkAssignToPhase` (mutation)
- **الوصف:** تعيين عدة بنود لمرحلة دفعة واحدة
- **Input:** `{ projectId: string, items: Array<{ itemId: string, itemType: "structural" | "finishing" | "mep" | "labor" }>, phaseId: string | null }`
- **المنطق:**
  1. نفس التحققات السابقة
  2. `prisma.$transaction()` لتحديث كل البنود
- **Output:** `{ updatedCount: number }`

#### `getMaterialsList` (query)
- **الوصف:** قائمة المواد الكاملة للمشروع مع الأسعار والمواصفات
- **Input:** `{ projectId: string, groupBy?: "category" | "phase" | "study" }`
- **المنطق:**
  1. `verifyProjectAccess`
  2. جمع كل البنود من كل الدراسات المرتبطة بالمشروع
  3. تجميعها حسب `groupBy`:
     - `category`: تجميع حسب نوع البند (إنشائي/تشطيبات/MEP/عمالة) ثم حسب الفئة الفرعية
     - `phase`: تجميع حسب المرحلة
     - `study`: تجميع حسب الدراسة
  4. لكل بند: الوصف، الكمية، الوحدة، سعر الوحدة، الإجمالي، المواصفات (specData للتشطيبات)
- **Output:** القائمة مجمّعة مع إجمالي لكل مجموعة

#### `getAvailableStudies` (query)
- **الوصف:** قائمة الدراسات العامة (غير مرتبطة بمشروع) المتاحة للربط
- **Input:** `{ projectId: string, search?: string }`
- **المنطق:**
  1. `verifyProjectAccess`
  2. `prisma.costStudy.findMany({ where: { organizationId, projectId: null, name: { contains: search } } })`
- **Output:** مصفوفة الدراسات المتاحة

### 2.3 تسجيل الـ module في Router

في `packages/api/orpc/router.ts`:
- import الـ module الجديد
- أضفه في الـ router تحت مفتاح `projectQuantities` (بنفس نمط `projectFinance`, `projectTimeline`, إلخ)

### 2.4 تعديل module `quantities` الحالي

في `packages/api/modules/quantities/` (الملف الذي يحتوي على `listStudies` أو ما يعادله):
- أضف فلتر `projectId` اختياري في الـ input schema
- في الـ query، إذا كان `projectId` موجوداً، أضفه في `where`
- هذا يسمح باستخدام نفس endpoints الدراسات الحالية مع فلتر المشروع

### 2.5 الصلاحيات

استخدم نفس صلاحيات `quantities` الموجودة. لا نحتاج صلاحيات جديدة.
- قراءة: `hasPermission("quantities", "read")`
- كتابة: `hasPermission("quantities", "create")` أو `hasPermission("quantities", "update")`
- حذف ربط: `hasPermission("quantities", "update")`

تحقق من ملف الصلاحيات:
```
packages/database/prisma/permissions.ts
```
إذا لم تكن صلاحيات `quantities` موجودة، أضفها بنفس نمط الصلاحيات الأخرى.

## معايير النجاح للمرحلة 2
- [ ] كل الـ endpoints تعمل
- [ ] `verifyProjectAccess` يُستدعى في كل endpoint
- [ ] Rate limiting مُطبّق (READ للـ queries, WRITE للـ mutations)
- [ ] Zod validation على كل input
- [ ] `pnpm build` ينجح
- [ ] لا يوجد N+1 queries

---

# المرحلة 3: واجهة المستخدم — تبويب الكميات داخل المشروع

## الهدف
إضافة تبويب "الكميات والمواصفات" داخل صفحة المشروع مع صفحات فرعية.

## الملفات المطلوب قراءتها أولاً
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/   # كل الملفات — افهم بنية صفحات المشروع
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/finance/  # كمثال على تبويب فرعي
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/   # صفحات الدراسات الحالية — مرجع للتصميم
apps/web/modules/saas/shared/components/sidebar/  # لفهم كيف تُضاف عناصر القائمة
apps/web/modules/saas/shared/components/sidebar/use-sidebar-menu.ts  # عناصر sidebar المشروع
```

## التعديلات المطلوبة

### 3.1 إضافة التبويب في Sidebar المشروع

في ملف `use-sidebar-menu.ts` (أو الملف المكافئ الذي يُعرّف عناصر قائمة المشروع):

أضف عنصراً جديداً بين "المالية" و"المستندات":

```typescript
{
  title: t("project_quantities.title"), // "الكميات والمواصفات"
  href: `/${organizationSlug}/projects/${projectId}/quantities`,
  icon: Calculator, // أو BarChart3 من lucide-react
  permission: "quantities.read",
}
```

**ملاحظة:** ابحث عن الأيقونات المستخدمة في المشروع وراجع أيها مناسب. استخدم أيقونة من `lucide-react` تناسب الكميات.

### 3.2 إنشاء Layout للكميات

أنشئ:
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/layout.tsx
```

هذا الـ layout يُضيف تبويبات فرعية (tabs) مشابهة لتبويبات المالية:

التبويبات الفرعية:
- **نظرة عامة** → `/quantities` (الصفحة الرئيسية)
- **إنشائي** → `/quantities/structural`
- **تشطيبات** → `/quantities/finishing`
- **MEP** → `/quantities/mep`
- **عمالة** → `/quantities/labor`
- **المواد** → `/quantities/materials`

اقرأ layout المالية (`finance/layout.tsx`) واتبع نفس النمط تماماً.

### 3.3 الصفحة الرئيسية — نظرة عامة

أنشئ:
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/page.tsx
```

**المحتوى:**

#### حالة Empty State (لا توجد دراسات مرتبطة):
- أيقونة كبيرة (مثل Calculator أو FileSpreadsheet)
- عنوان: "لا توجد كميات لهذا المشروع"
- وصف: "يمكنك إنشاء دراسة كميات جديدة أو ربط دراسة موجودة لتتبع مواد وتكاليف المشروع"
- زرّان:
  - `[+ إنشاء دراسة كميات جديدة]` → يفتح dialog إنشاء دراسة
  - `[🔗 ربط دراسة موجودة]` → يفتح dialog اختيار دراسة

#### حالة وجود دراسات:

**أولاً — بطاقات الملخص (Summary Cards):**
4 بطاقات في صف واحد:
- إنشائي: المبلغ الإجمالي
- تشطيبات: المبلغ الإجمالي
- MEP: المبلغ الإجمالي
- عمالة: المبلغ الإجمالي

وبطاقة خامسة كبيرة تحتها:
- الإجمالي العام (شامل هامش الربح وض.ق.م)

استخدم `useSuspenseQuery` أو `useQuery` مع endpoint `projectQuantities.getSummary`.

**ثانياً — قائمة الدراسات المرتبطة:**
جدول يعرض:
- اسم الدراسة
- الموقع
- عدد البنود (إنشائي + تشطيبات + MEP + عمالة)
- الإجمالي
- أزرار: [فتح الدراسة] [فك الربط]

**ثالثاً — عرض حسب المراحل:**
قسم يعرض البنود مقسمة على مراحل المشروع.
استخدم endpoint `projectQuantities.getPhaseBreakdown`.

لكل مرحلة:
- عنوان المرحلة مع أيقونة حالتها
- قائمة البنود تحتها (وصف، كمية، وحدة، سعر، إجمالي)
- مجموع المرحلة

في النهاية قسم "بنود غير مصنفة" للبنود بدون مرحلة.

### 3.4 Dialog ربط دراسة موجودة

أنشئ component:
```
apps/web/modules/saas/projects/components/quantities/link-study-dialog.tsx
```

**المحتوى:**
- Dialog (shadcn/ui) مع بحث
- يستدعي `projectQuantities.getAvailableStudies` مع `search`
- يعرض قائمة الدراسات المتاحة (غير مرتبطة بمشروع)
- لكل دراسة: الاسم، الموقع، عدد الأدوار، المساحة، الإجمالي
- زر "ربط" بجانب كل دراسة
- عند الضغط: يستدعي `projectQuantities.linkStudy` ثم يُعيد تحميل البيانات

### 3.5 Dialog إنشاء دراسة جديدة

أنشئ component:
```
apps/web/modules/saas/projects/components/quantities/create-study-dialog.tsx
```

**المحتوى:**
- Dialog مع form (React Hook Form + Zod)
- الحقول: اسم الدراسة (default: "دراسة كميات - اسم المشروع"), الموقع, عدد الأدوار, المساحة, نسبة المصاريف العامة, نسبة الربح, نسبة ض.ق.م
- عند الإرسال: يستدعي `projectQuantities.createStudy`
- بعد النجاح: يُعيد تحميل البيانات ويفتح الدراسة الجديدة

### 3.6 الصفحات الفرعية

كل صفحة فرعية تعرض بنود القسم الخاص بها من كل الدراسات المرتبطة بالمشروع.

#### صفحة الإنشائي
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/structural/page.tsx
```

- جدول يعرض كل `StructuralItem` من كل دراسات المشروع
- الأعمدة: الدراسة، الفئة، الفئة الفرعية، الوصف، الكمية، الوحدة، سعر الوحدة، الإجمالي، المرحلة
- عمود المرحلة: dropdown (Select من shadcn) لتعيين/تغيير المرحلة مباشرة من الجدول
- تجميع حسب الفئة (category) مع مجاميع فرعية

#### صفحة التشطيبات
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/finishing/page.tsx
```

- نفس النمط مع إضافة عمود "المواصفات" (من specData)
- الأعمدة: الدراسة، الغرفة، البند، المساحة، سعر الوحدة، الإجمالي، المواصفات، المرحلة

#### صفحة MEP
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/mep/page.tsx
```

- الأعمدة: الدراسة، النظام (ميكانيك/كهرباء/سباكة)، الوصف، الكمية، سعر الوحدة، الإجمالي، المرحلة

#### صفحة العمالة
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/labor/page.tsx
```

- الأعمدة: الدراسة، المسمى، العدد، الأجر اليومي، المدة، الإجمالي، المرحلة

#### صفحة المواد (قائمة شاملة)
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/materials/page.tsx
```

- تجمع كل المواد من كل الأقسام في قائمة واحدة
- تجميع حسب الفئة أو المرحلة (toggle)
- الأعمدة: القسم، الوصف، الكمية، الوحدة، سعر الوحدة، الإجمالي، المرحلة
- بطاقة ملخص في الأعلى (إجمالي المواد، إجمالي العمالة، الإجمالي الكلي)

### 3.7 مكونات مشتركة

أنشئ في:
```
apps/web/modules/saas/projects/components/quantities/
```

المكونات المطلوبة:

#### `quantity-summary-cards.tsx`
- يعرض 4+1 بطاقات الملخص
- يقبل `data` من `getSummary`
- استخدم تنسيق العملة السعودية (SAR)

#### `phase-selector.tsx`
- dropdown لاختيار المرحلة
- يجلب المراحل من `projectTimeline.listMilestones`
- خيار "بدون مرحلة" في الأعلى
- عند التغيير: يستدعي `projectQuantities.assignItemToPhase`

#### `phase-breakdown-view.tsx`
- عرض الكميات مقسمة على المراحل
- يقبل `data` من `getPhaseBreakdown`
- Collapsible لكل مرحلة
- يعرض المجاميع

#### `study-actions-dropdown.tsx`
- قائمة منسدلة (DropdownMenu) لكل دراسة مرتبطة
- الخيارات: فتح الدراسة، فك الربط، إعادة الحساب

## معايير النجاح للمرحلة 3
- [ ] التبويب يظهر في sidebar المشروع
- [ ] الصفحة الرئيسية تعرض الملخص بشكل صحيح
- [ ] Empty state يظهر عند عدم وجود دراسات
- [ ] ربط وفك ربط الدراسات يعمل
- [ ] إنشاء دراسة جديدة من داخل المشروع يعمل
- [ ] الصفحات الفرعية تعرض البنود بشكل صحيح
- [ ] تعيين المراحل يعمل من الجدول مباشرة
- [ ] RTL يعمل بشكل صحيح
- [ ] `pnpm build` ينجح

---

# المرحلة 4: الترجمة (i18n)

## الهدف
إضافة كل مفاتيح الترجمة للعربية والإنجليزية.

## الملفات المطلوب قراءتها أولاً
```
packages/i18n/messages/ar.json    # أو المسار الصحيح لملف الترجمة العربي
packages/i18n/messages/en.json    # أو المسار الصحيح لملف الترجمة الإنجليزي
```

ابحث عن نمط تنظيم المفاتيح وقسم `project_` أو ما يشابهه.

## المفاتيح المطلوبة

أضف قسم `projectQuantities` في كلا ملفي الترجمة:

### العربية (ar.json):
```json
{
  "projectQuantities": {
    "title": "الكميات والمواصفات",
    "overview": "نظرة عامة",
    "structural": "إنشائي",
    "finishing": "تشطيبات",
    "mep": "ميكانيك وكهرباء وسباكة",
    "labor": "عمالة",
    "materials": "المواد",
    "summary": "ملخص الكميات",
    "totalStructural": "إجمالي الإنشائي",
    "totalFinishing": "إجمالي التشطيبات",
    "totalMEP": "إجمالي MEP",
    "totalLabor": "إجمالي العمالة",
    "grandTotal": "الإجمالي العام",
    "grandTotalWithVat": "الإجمالي شامل ض.ق.م",
    "byPhase": "حسب المراحل",
    "byCategory": "حسب الفئة",
    "byStudy": "حسب الدراسة",
    "unassignedItems": "بنود غير مصنفة",
    "noPhaseAssigned": "بدون مرحلة",
    "emptyState": {
      "title": "لا توجد كميات لهذا المشروع",
      "description": "يمكنك إنشاء دراسة كميات جديدة أو ربط دراسة موجودة لتتبع مواد وتكاليف المشروع"
    },
    "actions": {
      "createStudy": "إنشاء دراسة كميات جديدة",
      "linkStudy": "ربط دراسة موجودة",
      "unlinkStudy": "فك ربط الدراسة",
      "unlinkConfirm": "هل أنت متأكد من فك ربط هذه الدراسة من المشروع؟ ستبقى الدراسة موجودة كدراسة عامة.",
      "openStudy": "فتح الدراسة",
      "assignToPhase": "تعيين لمرحلة",
      "removeFromPhase": "إزالة من المرحلة",
      "recalculate": "إعادة الحساب"
    },
    "linkDialog": {
      "title": "ربط دراسة كميات بالمشروع",
      "search": "ابحث عن دراسة...",
      "noStudies": "لا توجد دراسات متاحة للربط",
      "noStudiesDesc": "جميع الدراسات مرتبطة بمشاريع أخرى. يمكنك إنشاء دراسة جديدة.",
      "link": "ربط",
      "floors": "أدوار",
      "area": "المساحة"
    },
    "createDialog": {
      "title": "إنشاء دراسة كميات جديدة",
      "name": "اسم الدراسة",
      "namePlaceholder": "مثال: دراسة كميات فيلا الرياض",
      "location": "الموقع",
      "floors": "عدد الأدوار",
      "area": "المساحة (م²)",
      "overheadPercent": "نسبة المصاريف العامة (%)",
      "profitPercent": "نسبة الربح (%)",
      "vatPercent": "نسبة ضريبة القيمة المضافة (%)",
      "create": "إنشاء الدراسة"
    },
    "table": {
      "study": "الدراسة",
      "category": "الفئة",
      "subcategory": "الفئة الفرعية",
      "description": "الوصف",
      "quantity": "الكمية",
      "unit": "الوحدة",
      "unitPrice": "سعر الوحدة",
      "total": "الإجمالي",
      "phase": "المرحلة",
      "room": "الغرفة",
      "item": "البند",
      "area": "المساحة",
      "specifications": "المواصفات",
      "system": "النظام",
      "jobTitle": "المسمى",
      "count": "العدد",
      "dailyRate": "الأجر اليومي",
      "duration": "المدة (أيام)",
      "section": "القسم",
      "itemCount": "عدد البنود",
      "subtotal": "المجموع الفرعي"
    },
    "studyCard": {
      "items": "بند",
      "linkedStudies": "الدراسات المرتبطة",
      "noStudiesLinked": "لا توجد دراسات مرتبطة"
    },
    "toast": {
      "studyLinked": "تم ربط الدراسة بالمشروع بنجاح",
      "studyUnlinked": "تم فك ربط الدراسة من المشروع",
      "studyCreated": "تم إنشاء الدراسة بنجاح",
      "phaseAssigned": "تم تعيين البند للمرحلة",
      "phaseRemoved": "تم إزالة البند من المرحلة",
      "bulkAssigned": "تم تعيين {count} بند للمرحلة"
    }
  }
}
```

### الإنجليزية (en.json):
```json
{
  "projectQuantities": {
    "title": "Quantities & Specifications",
    "overview": "Overview",
    "structural": "Structural",
    "finishing": "Finishing",
    "mep": "MEP",
    "labor": "Labor",
    "materials": "Materials",
    "summary": "Quantities Summary",
    "totalStructural": "Total Structural",
    "totalFinishing": "Total Finishing",
    "totalMEP": "Total MEP",
    "totalLabor": "Total Labor",
    "grandTotal": "Grand Total",
    "grandTotalWithVat": "Grand Total (incl. VAT)",
    "byPhase": "By Phase",
    "byCategory": "By Category",
    "byStudy": "By Study",
    "unassignedItems": "Unassigned Items",
    "noPhaseAssigned": "No Phase",
    "emptyState": {
      "title": "No quantities for this project",
      "description": "Create a new cost study or link an existing one to track materials and costs for this project"
    },
    "actions": {
      "createStudy": "Create New Cost Study",
      "linkStudy": "Link Existing Study",
      "unlinkStudy": "Unlink Study",
      "unlinkConfirm": "Are you sure you want to unlink this study from the project? The study will remain as a general study.",
      "openStudy": "Open Study",
      "assignToPhase": "Assign to Phase",
      "removeFromPhase": "Remove from Phase",
      "recalculate": "Recalculate"
    },
    "linkDialog": {
      "title": "Link Cost Study to Project",
      "search": "Search for a study...",
      "noStudies": "No available studies to link",
      "noStudiesDesc": "All studies are linked to other projects. You can create a new one.",
      "link": "Link",
      "floors": "Floors",
      "area": "Area"
    },
    "createDialog": {
      "title": "Create New Cost Study",
      "name": "Study Name",
      "namePlaceholder": "e.g., Villa Cost Study - Riyadh",
      "location": "Location",
      "floors": "Number of Floors",
      "area": "Area (m²)",
      "overheadPercent": "Overhead (%)",
      "profitPercent": "Profit Margin (%)",
      "vatPercent": "VAT (%)",
      "create": "Create Study"
    },
    "table": {
      "study": "Study",
      "category": "Category",
      "subcategory": "Subcategory",
      "description": "Description",
      "quantity": "Quantity",
      "unit": "Unit",
      "unitPrice": "Unit Price",
      "total": "Total",
      "phase": "Phase",
      "room": "Room",
      "item": "Item",
      "area": "Area",
      "specifications": "Specifications",
      "system": "System",
      "jobTitle": "Job Title",
      "count": "Count",
      "dailyRate": "Daily Rate",
      "duration": "Duration (days)",
      "section": "Section",
      "itemCount": "Items",
      "subtotal": "Subtotal"
    },
    "studyCard": {
      "items": "items",
      "linkedStudies": "Linked Studies",
      "noStudiesLinked": "No studies linked"
    },
    "toast": {
      "studyLinked": "Study linked to project successfully",
      "studyUnlinked": "Study unlinked from project",
      "studyCreated": "Study created successfully",
      "phaseAssigned": "Item assigned to phase",
      "phaseRemoved": "Item removed from phase",
      "bulkAssigned": "{count} items assigned to phase"
    }
  }
}
```

## معايير النجاح للمرحلة 4
- [ ] كل النصوص في الواجهة تستخدم `t("projectQuantities.xxx")`
- [ ] لا يوجد نص عربي hardcoded في المكونات
- [ ] كلا ملفي الترجمة يحتويان نفس المفاتيح
- [ ] `pnpm build` ينجح

---

# المرحلة 5: الربط الذكي والتكامل

## الهدف
ربط الكميات مع باقي أجزاء المشروع (المالية، لوحة التحكم، بوابة المالك).

## الملفات المطلوب قراءتها أولاً
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/page.tsx  # لوحة تحكم المشروع
packages/api/modules/project-finance/   # ملخص مالي
apps/web/modules/saas/projects/components/  # مكونات المشروع المشتركة
```

## التعديلات المطلوبة

### 5.1 بطاقة الكميات في لوحة تحكم المشروع

في صفحة المشروع الرئيسية (لوحة التحكم / page.tsx):

أضف بطاقة جديدة "ملخص الكميات":
- إجمالي تكلفة الكميات المقدرة
- عدد الدراسات المرتبطة
- نسبة البنود المصنفة على مراحل vs غير المصنفة
- زر "عرض التفاصيل" → ينقل لتبويب الكميات

أنشئ component:
```
apps/web/modules/saas/projects/components/quantities/quantity-dashboard-card.tsx
```

### 5.2 المقارنة المالية (المقدر vs الفعلي)

في ملخص مالية المشروع، أضف سطر جديد:
- **التكلفة المقدرة (من الكميات):** إجمالي الكميات
- **المصروفات الفعلية:** من ProjectExpenses
- **الفرق:** المقدر - الفعلي (أخضر إذا موجب، أحمر إذا سالب)

هذا يتطلب تعديل endpoint `projectFinance.getSummary` لجلب إجمالي الكميات أيضاً.

اقرأ:
```
packages/api/modules/project-finance/  # ملف getSummary
```

أضف في الـ output:
```typescript
estimatedCost: number | null  // من CostStudy المرتبطة — null إذا لم تكن هناك دراسات
```

### 5.3 رابط سريع من دراسة الكميات للمشروع (والعكس)

في صفحات دراسة الكميات الحالية (`/pricing/studies/[id]/`):
- إذا الدراسة مرتبطة بمشروع، اعرض badge فوق "مرتبطة بمشروع: [اسم المشروع]" مع رابط للمشروع
- هذا يتطلب تعديل بسيط في header الدراسة لعرض `study.project?.name` إذا كان موجوداً

اقرأ:
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[id]/  # layout أو page
```

### 5.4 loading.tsx

أنشئ ملفات loading للصفحات الجديدة:
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/structural/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/finishing/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/mep/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/labor/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/materials/loading.tsx
```

كل loading.tsx يعرض Skeleton مناسب (بطاقات skeleton + جدول skeleton).
اقرأ أي loading.tsx موجود في المشروع واتبع نفس النمط.

## معايير النجاح للمرحلة 5
- [ ] بطاقة الكميات تظهر في لوحة تحكم المشروع
- [ ] المقارنة المالية تعمل (مقدر vs فعلي)
- [ ] الرابط بين الدراسة والمشروع يعمل في الاتجاهين
- [ ] Loading states تظهر بشكل صحيح
- [ ] `pnpm build` ينجح

---

# المرحلة 6: React Query Hooks والتكامل

## الهدف
إنشاء hooks مخصصة لاستدعاء API الكميات.

## الملفات المطلوب قراءتها أولاً
```
apps/web/modules/saas/   # ابحث عن أي ملف يحتوي على useQuery أو useMutation لفهم النمط
```

## التعديلات المطلوبة

### 6.1 إنشاء hooks

أنشئ:
```
apps/web/modules/saas/projects/hooks/use-project-quantities.ts
```

المحتوى — hooks لكل endpoint:

```typescript
// useProjectQuantitiesSummary(projectId)
// useProjectQuantitiesStudies(projectId)
// useProjectQuantitiesPhaseBreakdown(projectId, studyId?)
// useProjectQuantitiesMaterials(projectId, groupBy?)
// useAvailableStudies(projectId, search?)
// useLinkStudy()
// useUnlinkStudy()
// useCreateProjectStudy()
// useAssignItemToPhase()
// useBulkAssignToPhase()
```

اتبع نفس النمط المُستخدم في hooks المشروع الأخرى:
- `useQuery` / `useSuspenseQuery` للـ queries
- `useMutation` مع `onSuccess` يعمل `invalidateQueries` للـ mutations
- Query keys: `["project-quantities", projectId, ...]`

### 6.2 Invalidation Strategy

عند أي mutation (link, unlink, create, assign):
- Invalidate: `["project-quantities", projectId]` (كل queries الكميات)
- Invalidate: `["project-finance", projectId]` (لأن التكلفة المقدرة تتغير)
- Invalidate: `["project-dashboard", projectId]` (لأن بطاقة الكميات تتغير)

## معايير النجاح للمرحلة 6
- [ ] كل الـ hooks تعمل
- [ ] Invalidation يحدث بشكل صحيح
- [ ] لا يوجد stale data بعد mutations
- [ ] `pnpm build` ينجح

---

# المرحلة 7: التحقق النهائي والتنظيف

## الهدف
مراجعة شاملة والتأكد من عمل كل شيء.

## المطلوب

### 7.1 Type Check
```bash
pnpm type-check
```
أصلح أي أخطاء أنواع.

### 7.2 Build Check
```bash
pnpm build
```
أصلح أي أخطاء بناء.

### 7.3 Biome/Lint Check
```bash
pnpm biome check .
```
أصلح أي تحذيرات.

### 7.4 قائمة التحقق النهائية

- [ ] Schema: `projectId` مضاف على CostStudy
- [ ] Schema: `projectPhaseId` مضاف على كل بنود الكميات
- [ ] Schema: العلاقات العكسية مضافة على Project و ProjectMilestone
- [ ] API: كل endpoints الـ project-quantities تعمل
- [ ] API: Router مُسجّل في router.ts
- [ ] API: الصلاحيات مُطبّقة على كل endpoint
- [ ] Frontend: تبويب الكميات يظهر في sidebar المشروع
- [ ] Frontend: الصفحة الرئيسية تعمل (empty state + ملخص)
- [ ] Frontend: ربط وفك ربط الدراسات يعمل
- [ ] Frontend: إنشاء دراسة من داخل المشروع يعمل
- [ ] Frontend: الصفحات الفرعية (6 صفحات) تعمل
- [ ] Frontend: تعيين المراحل يعمل
- [ ] Frontend: بطاقة الكميات في لوحة التحكم تعمل
- [ ] Frontend: loading states موجودة
- [ ] i18n: كل النصوص مترجمة (AR + EN)
- [ ] RTL: كل الصفحات تعمل بشكل صحيح
- [ ] Build: `pnpm build` ينجح بدون أخطاء
- [ ] Types: `pnpm type-check` ينجح بدون أخطاء

---

# ملاحظات مهمة لكل المراحل

1. **اتبع الأنماط الموجودة دائماً** — لا تخترع أنماط جديدة. اقرأ الكود الموجود أولاً واتبع نفس النمط.

2. **استخدم `protectedProcedure`** لكل endpoints — مع `verifyProjectAccess` لأي endpoint يتعلق بمشروع.

3. **`organizationId`** يجب أن يكون في كل query كشرط أمان.

4. **تنسيق العملة:** استخدم نفس طريقة تنسيق الأرقام المالية المُستخدمة في بقية المشروع (ابحث عن `formatCurrency` أو ما يشابهه).

5. **لا تنسَ `Decimal` → `Number`** في API responses (بنفس النمط الموجود).

6. **shadcn/ui components:** استخدم فقط المكونات الموجودة في المشروع. إذا احتجت مكون غير موجود، أضفه بـ `npx shadcn@latest add [component]`.

7. **Batch writes ≤ 800 سطر** إذا كان الملف طويلاً، اكتبه على دفعات.

8. **اختبر كل مرحلة على حدة** قبل الانتقال للتالية.
