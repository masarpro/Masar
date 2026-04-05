# إكمال دورة أرباح المالك — سحوبات + إقفال سنوي + دعم متعدد الملاك + ربط بالمشاريع

> **الوضع:** Plan Mode أولاً — حلل واعرض الخطة قبل أي تنفيذ
> **الأهمية:** هذه ميزة محاسبية حساسة — الدقة أهم من السرعة
> **النسخة:** v2 — تدعم عدة ملاك + ربط السحب بالمشروع + تنبيهات التجاوز + تقارير لكل مشروع

---

## الرؤية الكاملة للميزة

### السيناريوهات المدعومة:
1. **شركة بمالك واحد** — يسحب من الشركة عموماً (بدون تحديد مشروع)
2. **شركة بمالك واحد** — يسحب سحب مخصص من مشروع معين (يُخصم من ربح المشروع)
3. **شركة بعدة شركاء** — كل شريك له حساب سحوبات منفصل + نسبة ملكية
4. **سحب من مشروع مع تنبيه** — إذا تجاوز ربح المشروع، النظام يُنبّه (لا يمنع) ويطلب تأكيد
5. **إقفال سنوي** — ترحيل الأرباح من 3300 إلى حسابات الشركاء حسب نسبهم

### المنطق المحاسبي الأساسي:
- **المالك الواحد:** حساب واحد `3400 — سحوبات المالك`
- **شركاء متعددون:** حسابات فرعية تحت `3400`:
  - `3410 — سحوبات الشريك 1 (اسم الشريك)`
  - `3420 — سحوبات الشريك 2 (اسم الشريك)`
  - ... إلخ
- **ربط المشروع:** كل `JournalEntryLine` في قيد السحب يحمل `projectId` إذا كان السحب مخصص لمشروع
- **تقرير مراكز التكلفة:** يعرض سحوبات المالك كبند منفصل لكل مشروع

---

## المرحلة 0 — القراءة الإلزامية (لا تعدّل أي شيء قبل قراءة كل هذه الملفات)

اقرأ هذه الملفات بالكامل قبل البدء:

```
# 1. دليل الحسابات الافتراضي (seed function)
packages/database/prisma/queries/accounting.ts → ابحث عن:
  - seedChartOfAccounts() — كيف تُنشأ الحسابات الـ 48
  - getCostCenterReport() — كيف يُحسب ربح كل مشروع
  - getJournalIncomeStatement() — قائمة الدخل المحاسبية

# 2. محرك القيود التلقائية
packages/api/lib/accounting/auto-journal.ts → افهم النمط الكامل:
  - ensureChartExists
  - getAccountByCode
  - createJournalEntry
  - onPaymentVoucherApproved (النمط الأقرب لسحوبات المالك)

# 3. إجراءات القيود
packages/api/modules/accounting/procedures/journal-entries.ts → افهم:
  - create, post, reverse, bulkPost
  - كيف يُستخدم projectId في JournalEntryLine

# 4. إجراءات دليل الحسابات
packages/api/modules/accounting/procedures/chart-of-accounts.ts → افهم:
  - seed, create (خاصة إنشاء حسابات فرعية تحت parent)
  - getLedger
  - openingBalances

# 5. الراوتر
packages/api/modules/accounting/router.ts → افهم البنية الكاملة

# 6. Schema المحاسبي
packages/database/prisma/schema.prisma → ابحث عن:
  - JournalEntry, JournalEntryLine (خاصة حقل projectId)
  - ChartAccount (خاصة parentId لبناء الشجرة)
  - AccountingPeriod
  - Project (للعلاقات)

# 7. الترجمة
packages/i18n/translations/ar.json → قسم المحاسبة والمالية
packages/i18n/translations/en.json → نفس القسم

# 8. لوحة المحاسبة
apps/web/modules/saas/finance/components/accounting/AccountingDashboard.tsx

# 9. سندات الصرف (نمط مشابه لسحوبات المالك)
packages/api/modules/finance/procedures/payment-vouchers.ts
apps/web/modules/saas/finance/components/payments/PaymentVoucher.tsx

# 10. الثوابت
apps/web/modules/saas/finance/components/shell/constants.ts → FINANCE_NAV_SECTIONS

# 11. تقرير مراكز التكلفة (مهم جداً — لفهم ربحية المشروع)
apps/web/modules/saas/finance/components/accounting/CostCenterReport.tsx

# 12. Backfill
packages/api/lib/accounting/backfill.ts

# 13. Project model and queries
packages/database/prisma/queries/project-finance.ts → getProjectFinanceSummary()

# 14. CLAUDE.md
CLAUDE.md → القواعد والأنماط والمحظورات
```

**بعد القراءة، اكتب ملخصاً قصيراً (10-15 سطر) لفهمك للنقاط التالية قبل البدء:**
1. كيف يعمل `JournalEntryLine.projectId` في النظام الحالي
2. كيف يُحسب ربح المشروع في `getCostCenterReport()`
3. كيف يتم إنشاء حسابات فرعية تحت parent account
4. نمط `subscriptionProcedure` و `verifyOrganizationAccess()`

---

## السياق

### الوضع الحالي في مسار
- 48 حساب افتراضي + 29 قيد تلقائي
- حسابات حقوق الملكية: `3100` (رأس المال)، `3200` (أرباح مبقاة)، `3300` (أرباح العام الحالي — ديناميكي)
- `JournalEntryLine.projectId` موجود ويُستخدم في تقرير مراكز التكلفة
- لا يوجد: سحوبات مالك، شركاء، إقفال سنوي تلقائي

### الهدف
نظام سحوبات مالك كامل يدعم:
- مالك واحد أو عدة شركاء
- سحب عام من الشركة أو مخصص من مشروع
- تنبيهات ذكية عند التجاوز
- تقارير ربحية لكل مشروع تشمل السحوبات
- إقفال سنوي يوزع الأرباح حسب نسب الشركاء

---

## المرحلة 1 — Schema Changes (Prisma)

### 1.1 — نموذج الشركاء (Owners/Partners)

أضف في `packages/database/prisma/schema.prisma`:

```prisma
model OrganizationOwner {
  id               String   @id @default(cuid())
  organizationId   String
  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  name             String   // اسم المالك/الشريك
  nationalId       String?  // رقم الهوية (اختياري)
  email            String?
  phone            String?
  
  ownershipPercent Decimal  @db.Decimal(5, 2)  // نسبة الملكية (0.00 - 100.00)
  
  // ربط بحساب السحوبات الخاص بهذا الشريك في دليل الحسابات
  drawingsAccountId String?  // يُنشأ تلقائياً عند إضافة الشريك
  drawingsAccount   ChartAccount? @relation("OwnerDrawingsAccount", fields: [drawingsAccountId], references: [id])
  
  // ربط اختياري بحساب مستخدم في النظام
  userId           String?
  user             User?    @relation(fields: [userId], references: [id])
  
  isActive         Boolean  @default(true)
  joinedAt         DateTime @default(now())
  leftAt           DateTime?
  
  notes            String?
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  drawings         OwnerDrawing[]
  
  @@unique([organizationId, name])
  @@index([organizationId, isActive])
}
```

### 1.2 — نموذج السحوبات

```prisma
model OwnerDrawing {
  id               String   @id @default(cuid())
  organizationId   String
  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  drawingNo        String   // OWD-YYYY-XXXX (ترقيم ذري)
  date             DateTime
  amount           Decimal  @db.Decimal(15, 2)
  
  // المالك/الشريك الذي سحب
  ownerId          String
  owner            OrganizationOwner @relation(fields: [ownerId], references: [id])
  
  // البنك المصدر
  bankAccountId    String
  bankAccount      OrganizationBank @relation(fields: [bankAccountId], references: [id])
  
  // ✨ ربط اختياري بمشروع — إذا كان السحب مخصص من ربح مشروع معين
  projectId        String?
  project          Project? @relation(fields: [projectId], references: [id])
  
  // نوع السحب
  drawingType      OwnerDrawingType @default(COMPANY_LEVEL)
  
  description      String?
  notes            String?
  
  // حقول تحذير التجاوز
  hasOverdrawWarning Boolean @default(false)
  overdrawAmount     Decimal? @db.Decimal(15, 2)  // مقدار التجاوز إن وُجد
  overdrawAcknowledgedBy String?  // userId الذي أكّد رغم التحذير
  overdrawAcknowledgedAt DateTime?
  
  // حالة السحب
  status           OwnerDrawingStatus @default(DRAFT)
  
  // ربط بالقيد المحاسبي
  journalEntryId   String?  @unique
  journalEntry     JournalEntry? @relation(fields: [journalEntryId], references: [id])
  
  approvedAt       DateTime?
  approvedById     String?
  cancelledAt      DateTime?
  cancelledById    String?
  cancellationReason String?
  
  createdById      String
  createdBy        User @relation("OwnerDrawingCreator", fields: [createdById], references: [id])
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  @@unique([organizationId, drawingNo])
  @@index([organizationId, status])
  @@index([organizationId, date])
  @@index([organizationId, ownerId])
  @@index([organizationId, projectId])
}

enum OwnerDrawingType {
  COMPANY_LEVEL      // سحب عام من الشركة (من الربح الكلي)
  PROJECT_SPECIFIC   // سحب مخصص من مشروع معين
}

enum OwnerDrawingStatus {
  DRAFT
  APPROVED
  CANCELLED
}
```

### 1.3 — إضافات للـ enums الحالية

ابحث عن `JournalEntryReferenceType` أو الـ enum المستخدم في `JournalEntry.referenceType`، وأضف:

```
OWNER_DRAWING
DIVIDEND_DISTRIBUTION
YEAR_END_CLOSING
OWNER_DRAWINGS_CLOSING
```

ابحث عن `OrgAuditAction` enum وأضف:

```
OWNER_ADDED
OWNER_UPDATED
OWNER_REMOVED
OWNER_DRAWING_CREATED
OWNER_DRAWING_APPROVED
OWNER_DRAWING_CANCELLED
OWNER_DRAWING_OVERDRAW_ACKNOWLEDGED
YEAR_END_CLOSING_PREVIEWED
YEAR_END_CLOSING_EXECUTED
YEAR_END_CLOSING_REVERSED
```

### 1.4 — تحديث النماذج الموجودة

أضف العلاقات العكسية في:
- `Organization` model → `owners OrganizationOwner[]` و `ownerDrawings OwnerDrawing[]`
- `Project` model → `ownerDrawings OwnerDrawing[]`
- `User` model → `ownedOrganizations OrganizationOwner[]`
- `ChartAccount` model → `ownerDrawingsAccounts OrganizationOwner[] @relation("OwnerDrawingsAccount")`
- `OrganizationBank` model → `ownerDrawings OwnerDrawing[]`

### تحقق
```bash
pnpm --filter database generate
node packages/database/fix-zod-decimal.mjs
npx tsc --noEmit
```

---

## المرحلة 2 — تحديث دليل الحسابات الافتراضي

### المطلوب
في `packages/database/prisma/queries/accounting.ts`، عدّل `seedChartOfAccounts()`:

**أضف الحسابات التالية:**

| الكود | الاسم العربي | English | النوع | الطبيعة | المستوى | الأب | نظامي | قابل للترحيل |
|-------|-------------|---------|-------|---------|---------|------|-------|-------------|
| `3400` | سحوبات المالك | Owner's Drawings | EQUITY | DEBIT | L2 | 3000 | نعم | **لا** (parent — يستخدم فقط كأب للحسابات الفرعية لكل شريك) |
| `3500` | توزيعات أرباح | Dividends | EQUITY | DEBIT | L2 | 3000 | لا | نعم |

**ملاحظة مهمة:** حساب `3400` أصبح **parent account** غير قابل للترحيل. عند إنشاء منظمة جديدة أو إضافة أول شريك، يُنشأ حساب فرعي تحته بكود `3410` (المالك الأول). عند إضافة شريك ثانٍ → `3420`، وهكذا.

### إذا كانت الشركة بمالك واحد فقط:
النظام ينشئ تلقائياً `3410 — سحوبات المالك` تحت `3400`. القيد يستخدم `3410` دائماً.

### 2.1 — دالة جديدة: `createOwnerDrawingAccount()`

في نفس الملف، أضف دالة مساعدة:

```typescript
/**
 * ينشئ حساب سحوبات فرعي تحت 3400 لمالك/شريك معين
 * يُستدعى عند إضافة شريك جديد في OrganizationOwner
 */
async function createOwnerDrawingAccount(
  db: PrismaClient,
  organizationId: string,
  ownerName: string
): Promise<string> {
  // 1. ابحث عن حساب 3400 (parent)
  // 2. عدّ الحسابات الفرعية الموجودة تحت 3400
  // 3. احسب الكود الجديد: 3410, 3420, 3430, ... (أول رقم فارغ)
  // 4. أنشئ الحساب:
  //    code: "3410" (مثلاً)
  //    nameAr: `سحوبات ${ownerName}`
  //    nameEn: `${ownerName} Drawings`
  //    type: EQUITY
  //    nature: DEBIT
  //    level: 3
  //    parentCode: "3400"
  //    isSystemAccount: false
  //    isPostable: true
  // 5. رجّع الـ id
}
```

### تحقق
```bash
npx tsc --noEmit
```

---

## المرحلة 3 — auto-journal handlers

في `packages/api/lib/accounting/auto-journal.ts`، أضف:

### 3.1 — `onOwnerDrawing()`

```typescript
/**
 * قيد سحب المالك/الشريك
 * 
 * DR [حساب سحوبات الشريك من 3410/3420/...] amount  (مع projectId إذا موجود)
 * CR [حساب البنك]                          amount  (مع projectId إذا موجود)
 * 
 * referenceType: OWNER_DRAWING
 * referenceId: drawing.id
 * referenceNo: drawing.drawingNo
 * entryNo prefix: OWD-JE
 */
export async function onOwnerDrawing(
  db: PrismaClient,
  organizationId: string,
  drawing: {
    id: string;
    drawingNo: string;
    amount: Decimal;
    date: Date;
    ownerId: string;
    ownerName: string;  // للوصف
    bankAccountId: string;
    projectId?: string | null;
    projectName?: string | null;
    description?: string | null;
  }
): Promise<string | null>
```

**المنطق خطوة خطوة:**
1. `ensureChartExists(db, organizationId)`
2. جلب الشريك من `OrganizationOwner` → استخراج `drawingsAccountId`
3. إذا `drawingsAccountId` غير موجود (شريك قديم قبل هذه الميزة) → أنشئه عبر `createOwnerDrawingAccount()` وحدّث الشريك
4. `getBankChartAccountId(db, organizationId, bankAccountId)`
5. بناء وصف القيد:
   - بدون مشروع: `سحب مالك — ${ownerName} — ${drawingNo}`
   - مع مشروع: `سحب مالك — ${ownerName} — مشروع ${projectName} — ${drawingNo}`
6. استدعاء `createJournalEntry()` مع:
   ```typescript
   {
     status: "POSTED",
     isAutoGenerated: true,
     referenceType: "OWNER_DRAWING",
     referenceId: drawing.id,
     referenceNo: drawing.drawingNo,
     date: drawing.date,
     description: ...,
     lines: [
       {
         accountId: drawingsAccountId,
         debit: drawing.amount,
         credit: 0,
         projectId: drawing.projectId ?? null,  // ✨ مهم
         description: ...,
       },
       {
         accountId: bankChartAccountId,
         debit: 0,
         credit: drawing.amount,
         projectId: drawing.projectId ?? null,  // ✨ نفس المشروع
         description: ...,
       },
     ],
   }
   ```
7. try/catch مع `orgAuditLog(JOURNAL_ENTRY_FAILED)` — silent failure pattern
8. رجّع `journalEntry.id`

### 3.2 — `onOwnerDrawingCancelled()`

يستدعي `reverseAutoJournalEntry()` للقيد المرتبط بالسحب.

### 3.3 — إضافة prefixes

في الـ prefix map:
```typescript
OWNER_DRAWING: "OWD-JE",
DIVIDEND_DISTRIBUTION: "DIV-JE",
YEAR_END_CLOSING: "YEC-JE",
OWNER_DRAWINGS_CLOSING: "OWC-JE",
```

### تحقق
```bash
npx tsc --noEmit
```

---

## المرحلة 4 — Organization Owners API

أنشئ ملف جديد:
```
packages/api/modules/accounting/procedures/organization-owners.ts
```

### Endpoints (6):

| Endpoint | النوع | الصلاحية | الوصف |
|----------|-------|---------|-------|
| `owners.list` | `protectedProcedure` | `settings.organization` | قائمة الشركاء + نسبهم |
| `owners.getById` | `protectedProcedure` | `settings.organization` | تفاصيل شريك |
| `owners.create` | `subscriptionProcedure` | `settings.organization` | إضافة شريك جديد + إنشاء حساب سحوبات له تلقائياً |
| `owners.update` | `subscriptionProcedure` | `settings.organization` | تعديل (اسم، نسبة، ...) — لا يمكن تعديل الحساب المرتبط |
| `owners.deactivate` | `subscriptionProcedure` | `settings.organization` | إلغاء تفعيل (لا حذف حفاظاً على القيود) |
| `owners.getTotalOwnership` | `protectedProcedure` | `settings.organization` | إجمالي نسب الملكية (يجب = 100%) |

### منطق `create`:
1. `verifyOrganizationAccess()`
2. تحقق: `totalOwnership + newOwnership <= 100`
3. في transaction:
   - إنشاء `OrganizationOwner` record
   - استدعاء `createOwnerDrawingAccount(db, organizationId, name)` → الحصول على `drawingsAccountId`
   - تحديث `OrganizationOwner.drawingsAccountId`
4. `orgAuditLog(OWNER_ADDED)`

### منطق `update`:
- **لا تسمح** بتغيير اسم الشريك إذا كان عنده سحوبات معتمدة (لأن اسم الحساب في دليل الحسابات مرتبط به) — أو حدّث اسم الحساب في دليل الحسابات تلقائياً
- يمكن تغيير النسبة لكن مع تحقق من المجموع ≤ 100

### تسجيل في الراوتر:
```typescript
owners: {
  list, getById, create, update, deactivate, getTotalOwnership
}
```

### تحقق
```bash
npx tsc --noEmit
```

---

## المرحلة 5 — Owner Drawings API (الجوهر)

أنشئ ملف جديد:
```
packages/api/modules/accounting/procedures/owner-drawings.ts
```

### Endpoints (9):

| Endpoint | النوع | الصلاحية | الوصف |
|----------|-------|---------|-------|
| `ownerDrawings.list` | `protectedProcedure` | `finance.view` | قائمة + فلاتر (ownerId, projectId, dateFrom, dateTo, status) + pagination |
| `ownerDrawings.getById` | `protectedProcedure` | `finance.view` | تفاصيل سحب واحد |
| `ownerDrawings.create` | `subscriptionProcedure` | `finance.payments` | إنشاء سحب (DRAFT) — يفحص التجاوز |
| `ownerDrawings.approve` | `subscriptionProcedure` | `finance.payments` | اعتماد → قيد تلقائي + نقص رصيد البنك |
| `ownerDrawings.cancel` | `subscriptionProcedure` | `finance.payments` | إلغاء → عكس القيد + إعادة رصيد البنك |
| `ownerDrawings.getCompanySummary` | `protectedProcedure` | `finance.reports` | ملخص على مستوى الشركة |
| `ownerDrawings.getProjectSummary` | `protectedProcedure` | `finance.reports` | ملخص على مستوى مشروع |
| `ownerDrawings.getOwnerSummary` | `protectedProcedure` | `finance.reports` | ملخص لشريك معين |
| `ownerDrawings.checkOverdraw` | `protectedProcedure` | `finance.payments` | فحص قبل الإنشاء (للـ UI — يعرض تحذير فوري) |

### 5.1 — منطق `checkOverdraw` (مهم جداً)

```typescript
/**
 * يفحص ما إذا كان السحب المقترح سيتجاوز الربح المتاح
 * يُستدعى من الـ frontend قبل إنشاء السحب
 * 
 * Input: { organizationId, ownerId, amount, bankAccountId, projectId? }
 * 
 * Output: {
 *   canProceed: boolean,        // false فقط إذا رصيد البنك غير كافٍ
 *   bankBalance: Decimal,
 *   bankSufficient: boolean,
 *   
 *   // إذا projectId موجود:
 *   projectContext?: {
 *     projectId: string,
 *     projectName: string,
 *     projectProfit: Decimal,           // ربح المشروع من cost center report
 *     previousProjectDrawings: Decimal, // السحوبات المخصصة لهذا المشروع سابقاً
 *     availableFromProject: Decimal,    // projectProfit - previousProjectDrawings
 *     willExceedProject: boolean,       // amount > availableFromProject
 *     overdrawAmount: Decimal,          // amount - availableFromProject إذا موجب
 *   },
 *   
 *   // إذا بدون projectId (سحب عام):
 *   companyContext?: {
 *     currentYearProfit: Decimal,
 *     totalCompanyDrawings: Decimal,    // كل السحوبات المعتمدة هذا العام
 *     availableFromCompany: Decimal,
 *     willExceedCompany: boolean,
 *     overdrawAmount: Decimal,
 *   },
 *   
 *   // ملخص حساب الشريك
 *   ownerContext: {
 *     ownerId: string,
 *     ownerName: string,
 *     ownershipPercent: Decimal,
 *     expectedShareOfProfit: Decimal,   // currentYearProfit * (ownershipPercent / 100)
 *     totalDrawingsByThisOwner: Decimal,
 *   },
 *   
 *   warnings: string[],  // رسائل تحذير جاهزة للعرض
 * }
 */
```

**خطوات الحساب:**

1. **رصيد البنك:** قراءة `OrganizationBank.balance` مباشرة
2. **إذا projectId موجود:**
   - استدع `getCostCenterReport()` للسنة الحالية وخذ ربح المشروع المحدد فقط
   - احسب السحوبات السابقة لهذا المشروع:
     ```sql
     SELECT SUM(amount) FROM OwnerDrawing 
     WHERE organizationId=? AND projectId=? AND status='APPROVED'
     ```
   - `availableFromProject = projectProfit - previousProjectDrawings`
3. **إذا بدون projectId:**
   - استدع `getJournalIncomeStatement()` للسنة الحالية → `currentYearProfit`
   - احسب كل السحوبات المعتمدة للسنة
   - `availableFromCompany = currentYearProfit - totalCompanyDrawings`
4. **سياق الشريك:**
   - نسبته × الربح = حصته المتوقعة
   - مجموع سحوباته الشخصية

**ملاحظة:** `canProceed = bankSufficient` فقط — التجاوز لا يمنع، فقط يُنبّه.

### 5.2 — منطق `create`

1. `verifyOrganizationAccess()`
2. استدعاء `checkOverdraw()` داخلياً للتحقق
3. إذا `!bankSufficient` → رفض (throw)
4. إذا `willExceedProject` أو `willExceedCompany`:
   - إذا الـ client أرسل `acknowledgeOverdraw: true` → اسمح مع تسجيل `hasOverdrawWarning: true`
   - إذا لا → رجّع error بصيغة `OVERDRAW_REQUIRES_CONFIRMATION` مع تفاصيل التجاوز
5. `generateAtomicNo()` → `drawingNo`
6. إنشاء السجل بحالة DRAFT
7. `orgAuditLog(OWNER_DRAWING_CREATED)`
8. إذا كان هناك تجاوز مؤكد: `orgAuditLog(OWNER_DRAWING_OVERDRAW_ACKNOWLEDGED)`

### 5.3 — منطق `approve`

1. تحقق: الحالة DRAFT
2. تحقق: رصيد البنك لا يزال كافياً (قد يكون تغيّر منذ الإنشاء)
3. في **transaction واحد**:
   - تحديث الحالة → APPROVED
   - `bankAccount.balance` -= amount (atomic decrement مع negative guard)
   - استدعاء `onOwnerDrawing()` → الحصول على `journalEntryId`
   - ربط `OwnerDrawing.journalEntryId = journalEntryId`
4. `orgAuditLog(OWNER_DRAWING_APPROVED)`

### 5.4 — منطق `cancel`

1. تحقق: الحالة APPROVED
2. تحقق: الفترة المحاسبية غير مغلقة
3. في transaction:
   - تحديث الحالة → CANCELLED
   - `bankAccount.balance` += amount
   - استدعاء `onOwnerDrawingCancelled()` (عكس القيد)
4. `orgAuditLog(OWNER_DRAWING_CANCELLED)`

### 5.5 — `getCompanySummary`

```typescript
{
  currentYearProfit: Decimal,
  totalDrawingsThisYear: Decimal,
  availableForDrawing: Decimal,
  retainedEarnings: Decimal,       // رصيد 3200
  drawingsByOwner: Array<{
    ownerId: string,
    ownerName: string,
    ownershipPercent: Decimal,
    expectedShare: Decimal,         // profit * ownership%
    actualDrawings: Decimal,
    difference: Decimal,            // expectedShare - actualDrawings (+ = سحب أقل من حصته، - = أكثر)
  }>,
  drawingsByProject: Array<{
    projectId: string,
    projectName: string,
    projectProfit: Decimal,
    projectDrawings: Decimal,
    remaining: Decimal,
  }>,
  drawingsByMonth: Array<{ month: string, amount: Decimal }>,
}
```

### 5.6 — `getProjectSummary`

```typescript
// Input: { organizationId, projectId }
{
  projectId: string,
  projectName: string,
  projectProfit: Decimal,          // من cost center report
  totalDrawingsFromProject: Decimal,
  availableFromProject: Decimal,
  drawingsDetail: Array<{
    drawingId: string,
    drawingNo: string,
    date: Date,
    ownerName: string,
    amount: Decimal,
    status: OwnerDrawingStatus,
    hasOverdrawWarning: boolean,
  }>,
}
```

### 5.7 — `getOwnerSummary`

```typescript
// Input: { organizationId, ownerId }
{
  ownerId: string,
  ownerName: string,
  ownershipPercent: Decimal,
  currentYearProfit: Decimal,
  expectedShareOfProfit: Decimal,   // profit * ownership%
  totalDrawings: Decimal,
  balance: Decimal,                  // expectedShare - totalDrawings
  drawingsByMonth: [...],
  drawingsByProject: [...],
}
```

### تسجيل في الراوتر

في `packages/api/modules/accounting/router.ts`:
```typescript
ownerDrawings: {
  list, getById, create, approve, cancel,
  getCompanySummary, getProjectSummary, getOwnerSummary,
  checkOverdraw
}
```

### تحقق
```bash
npx tsc --noEmit
```

---

## المرحلة 6 — إقفال نهاية السنة (Year-End Closing)

أنشئ ملف جديد:
```
packages/api/modules/accounting/procedures/year-end-closing.ts
```

### Endpoints (4):

| Endpoint | النوع | الوصف |
|----------|-------|-------|
| `yearEnd.preview` | `protectedProcedure` | معاينة قيد الإقفال (dry run) |
| `yearEnd.execute` | `subscriptionProcedure` | تنفيذ الإقفال |
| `yearEnd.history` | `protectedProcedure` | سجل الإقفالات |
| `yearEnd.reverse` | `subscriptionProcedure` | عكس إقفال |

### منطق `preview`:

**الهدف:** حساب وعرض قيد الإقفال دون تنفيذه.

```typescript
// Input: { organizationId, year }

// 1. جلب أرصدة كل الإيرادات والمصروفات للسنة
const revenues = SUM(credit - debit) for REVENUE accounts AND year
const expenses = SUM(debit - credit) for EXPENSE accounts AND year
const netProfit = revenues - expenses

// 2. جلب أرصدة سحوبات كل شريك (من الحسابات الفرعية تحت 3400)
const drawingsPerOwner = Array<{
  ownerId, ownerName, accountCode, accountId, balance
}>

// 3. حساب توزيع الربح على الشركاء
const owners = getActiveOwners(organizationId)
const profitDistribution = owners.map(owner => ({
  ownerId: owner.id,
  ownerName: owner.name,
  ownershipPercent: owner.ownershipPercent,
  shareOfProfit: netProfit * (owner.ownershipPercent / 100),
  drawings: drawingsPerOwner[owner.id] ?? 0,
  netToRetained: (netProfit * (owner.ownershipPercent / 100)) - drawingsPerOwner[owner.id],
}))

// 4. بناء القيود المتوقعة
const closingEntries = [
  // القيد 1: إقفال الإيرادات والمصروفات → 3300 (أو مباشرة 3200)
  {
    description: `إقفال إيرادات ومصروفات السنة ${year}`,
    lines: [
      // DR كل حساب إيراد برصيده (لتصفيره)
      ...revenueAccounts.map(a => ({ accountCode: a.code, debit: a.balance, credit: 0 })),
      // CR كل حساب مصروف برصيده
      ...expenseAccounts.map(a => ({ accountCode: a.code, debit: 0, credit: a.balance })),
      // CR/DR 3200 (أرباح مبقاة) بالفرق
      { accountCode: "3200", debit: netProfit < 0 ? Math.abs(netProfit) : 0, credit: netProfit > 0 ? netProfit : 0 },
    ],
  },
  // القيد 2 (لكل شريك له سحوبات): إقفال سحوبات الشريك → 3200
  ...profitDistribution
    .filter(p => p.drawings > 0)
    .map(p => ({
      description: `إقفال سحوبات ${p.ownerName} للسنة ${year}`,
      lines: [
        { accountCode: "3200", debit: p.drawings, credit: 0 },
        { accountCode: p.accountCode, debit: 0, credit: p.drawings },  // 3410/3420/...
      ],
    })),
]

// 5. التحذيرات
const warnings = []
if (draftEntriesCount > 0) warnings.push("يوجد قيود مسودة لم تُرحَّل")
if (openPeriodsCount > 0) warnings.push("يوجد فترات محاسبية مفتوحة")
if (yearAlreadyClosed) warnings.push("هذه السنة مُقفلة مسبقاً")
if (totalOwnershipPercent !== 100) warnings.push("مجموع نسب الشركاء لا يساوي 100%")

return { year, revenues, expenses, netProfit, profitDistribution, closingEntries, warnings }
```

### منطق `execute`:

1. تحقق: السنة غير مُقفلة مسبقاً (`referenceType=YEAR_END_CLOSING AND referenceId=year-end-${year}`)
2. تحقق: مجموع نسب الملكية = 100% (أو أصدر warning)
3. في **transaction واحد**:
   a. استدعاء `preview()` للحصول على البيانات
   b. إنشاء قيد الإقفال الرئيسي (POSTED + isAutoGenerated)
   c. إنشاء قيد إقفال سحوبات لكل شريك له سحوبات
   d. إقفال جميع الفترات المحاسبية المفتوحة للسنة
4. `orgAuditLog(YEAR_END_CLOSING_EXECUTED)`

### تسجيل في الراوتر:
```typescript
yearEnd: {
  preview, execute, history, reverse
}
```

### تحقق
```bash
npx tsc --noEmit
```

---

## المرحلة 7 — Migration للمنظمات الحالية

عدّل `AccountingSeedCheck.tsx` و `seedChartOfAccounts()` بحيث:

1. المنظمات الجديدة: تحصل على الحسابات الـ 50 + حساب شريك افتراضي `3410`
2. المنظمات الحالية: عند أول فتح صفحة المالية:
   - تحقق من وجود `3400` — إن لم يكن، أنشئه (parent)
   - تحقق من وجود شركاء في `OrganizationOwner` — إن لم يكن، أنشئ شريك افتراضي باسم `"المالك"` بنسبة 100%
   - أنشئ حساب `3410 — سحوبات المالك` تحت `3400` وربطه بالشريك

### Endpoint جديد:
```typescript
accounting.accounts.ensureOwnerDrawingsSystem
```

يُستدعى من `AccountingSeedCheck.tsx` بعد `seed`.

---

## المرحلة 8 — Frontend: صفحة إدارة الشركاء

### الصفحات:
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/owners/
├── page.tsx          # قائمة الشركاء + نسبهم
├── loading.tsx
├── new/
│   └── page.tsx      # إضافة شريك
└── [ownerId]/
    └── page.tsx      # تفاصيل شريك (+ سحوباته + كشف حسابه)
```

### المكونات:
```
apps/web/modules/saas/settings/components/owners/
├── OwnersList.tsx              # جدول + مجموع النسب + تحذير إذا ≠ 100%
├── OwnerForm.tsx               # نموذج إضافة/تعديل
├── OwnerDetailPage.tsx         # تفاصيل + كشف حساب + سحوبات
└── OwnershipPieChart.tsx       # رسم بياني دائري لنسب الملكية
```

**ملاحظة موقع الصفحة:** ضعها تحت `settings/` لأنها جزء من إعدادات المنظمة.

### ترجمة:
أضف قسم `owners` في `ar.json` و `en.json`.

---

## المرحلة 9 — Frontend: صفحة سحوبات المالك (الرئيسية)

### الصفحات:
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/owner-drawings/
├── page.tsx          # القائمة + ملخصات KPI
├── loading.tsx
├── new/
│   ├── page.tsx      # نموذج إنشاء (⭐ القلب)
│   └── loading.tsx
└── [drawingId]/
    ├── page.tsx      # التفاصيل + أزرار اعتماد/إلغاء + طباعة
    └── loading.tsx
```

### المكونات:
```
apps/web/modules/saas/finance/components/owner-drawings/
├── OwnerDrawingsList.tsx
├── OwnerDrawingsSummary.tsx        # 4 بطاقات KPI
├── OwnerDrawingForm.tsx            # ⭐ النموذج الذكي
├── OwnerDrawingDetail.tsx
├── OwnerDrawingPrint.tsx           # سند للطباعة (مشابه PaymentVoucher)
├── OverdrawWarningDialog.tsx       # Dialog التحذير
├── ProjectContextCard.tsx          # بطاقة سياق المشروع المختار
└── OwnerContextCard.tsx            # بطاقة سياق الشريك المختار
```

### 9.1 — `OwnerDrawingForm.tsx` (الأهم — اشرح هذا بالتفصيل)

**الحقول:**
1. **الشريك (ownerId)** — select من `OrganizationOwner` النشطين
2. **الحساب البنكي (bankAccountId)** — select من البنوك
3. **التاريخ** — date picker (default: اليوم)
4. **المبلغ (amount)** — number input
5. **المشروع (projectId)** — ⭐ select **اختياري** (includes option "بدون مشروع — سحب عام")
6. **الوصف**

**السلوك الذكي (reactive):**

```typescript
// كلما تغير أي من: ownerId, amount, bankAccountId, projectId
// → استدع ownerDrawings.checkOverdraw
// → اعرض النتائج في البطاقات الجانبية

// البطاقة 1: سياق الشريك (دائماً مرئية إذا ownerId محدد)
<OwnerContextCard>
  - اسم الشريك + نسبته
  - حصته المتوقعة من ربح السنة
  - إجمالي سحوباته للسنة
  - الرصيد (+ / -)
</OwnerContextCard>

// البطاقة 2: سياق المشروع (مرئية إذا projectId محدد)
<ProjectContextCard>
  - اسم المشروع
  - ربح المشروع الحالي (من cost center)
  - السحوبات السابقة من المشروع
  - المتاح للسحب من المشروع: X ر.س
  - [إذا amount > المتاح]: تحذير أحمر بارز
</ProjectContextCard>

// البطاقة 3: سياق الشركة (مرئية إذا projectId فارغ = سحب عام)
<CompanyContextCard>
  - ربح الشركة للسنة
  - إجمالي السحوبات
  - المتاح للسحب عام: X ر.س
</CompanyContextCard>

// البطاقة 4: رصيد البنك
<BankBalanceCard>
  - الرصيد الحالي
  - بعد السحب: X ر.س
  - [إذا سالب]: تحذير أحمر
</BankBalanceCard>
```

**عند الضغط على "إنشاء":**
1. إذا `!bankSufficient` → رسالة خطأ، لا إنشاء
2. إذا `willExceedProject` أو `willExceedCompany` → افتح `OverdrawWarningDialog`
3. في الـ Dialog:
   - اعرض التفاصيل: "ربح المشروع: X، السحب المطلوب: Y، التجاوز: Z"
   - 3 خيارات:
     - **[إلغاء]** — إغلاق الـ dialog
     - **[تحويل لسحب عام]** — يُعيد تعيين `projectId=null` ويُعيد الفحص
     - **[تأكيد وإنشاء رغم التجاوز]** — يُرسل `acknowledgeOverdraw: true`
4. إذا لا تجاوز → إنشاء مباشرة

### 9.2 — `OwnerDrawingsSummary.tsx`

أربع بطاقات KPI في أعلى قائمة السحوبات:
1. **إجمالي سحوبات السنة** — أحمر
2. **ربح الشركة للسنة** — أخضر
3. **المتاح للسحب** — أزرق (ربح - سحوبات)
4. **عدد السحوبات** — رمادي

بالإضافة: زر "سحب جديد" بارز.

### 9.3 — شريط التنقل

في `apps/web/modules/saas/finance/components/shell/constants.ts`:

أضف section جديد بعد "سندات الصرف":
```typescript
{
  title: "ownerDrawings",
  href: "/finance/owner-drawings",
  icon: UserMinus,  // من lucide-react
  permission: "finance.payments",
}
```

### 9.4 — اتجاه RTL
استخدم **فقط** Tailwind logical properties: `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`. ممنوع `ml-`, `mr-`, `left-`, `right-`.

---

## المرحلة 10 — Frontend: صفحة الإقفال السنوي

```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/year-end-closing/
├── page.tsx
└── loading.tsx
```

### المكونات:
```
apps/web/modules/saas/finance/components/year-end/
├── YearEndClosingPage.tsx     
├── YearEndPreview.tsx         # معاينة + جداول
├── ProfitDistributionTable.tsx # توزيع الربح على الشركاء
└── YearEndHistory.tsx         
```

### السلوك:
1. Select year
2. Click "معاينة"
3. عرض:
   - جدول الإيرادات
   - جدول المصروفات
   - صافي الربح
   - **جدول توزيع الربح على الشركاء** (حصة كل شريك × نسبته، سحوباته، الرصيد)
   - القيود المتوقعة
   - التحذيرات
4. زر "تنفيذ" + confirmation dialog مع تأكيد ثنائي

---

## المرحلة 11 — تحديث تقرير مراكز التكلفة

### المطلوب
في `apps/web/modules/saas/finance/components/accounting/CostCenterReport.tsx`:

أضف عمود/صف جديد لكل مشروع يعرض:
- الإيرادات
- المصروفات المباشرة
- **الربح التشغيلي**
- **(-) سحوبات المالك من هذا المشروع** ← جديد
- **الربح الصافي المتبقي** ← جديد

ملاحظة: السحوبات تأتي من `JournalEntryLine` حيث `account.code` يبدأ بـ `"34"` (سحوبات المالك) و `projectId` = المشروع.

### في Backend:
عدّل `getCostCenterReport()` في `accounting.ts` لإضافة هذه البيانات. أو أنشئ endpoint جديد `ownerDrawings.getProjectProfitability` يدمج البيانات.

---

## المرحلة 12 — تحديث لوحة المحاسبة

في `AccountingDashboard.tsx`:

### إضافات:
1. **بطاقة KPI:** "سحوبات المالك هذا العام" (أحمر)
2. **تنبيه ذكي:** إذا أحد الشركاء سحب أكثر من حصته المتوقعة → تنبيه كهرماني
3. **تنبيه ذكي:** إذا مجموع نسب الشركاء ≠ 100% → تنبيه أحمر
4. **إجراءات سريعة:**
   - "سحب مالك جديد" → `/finance/owner-drawings/new`
   - "إقفال سنوي" → `/finance/year-end-closing`
   - "إدارة الشركاء" → `/settings/owners`

---

## المرحلة 13 — تقرير الميزانية العمومية (Balance Sheet)

في `BalanceSheetReport.tsx`:

تأكد أن قسم حقوق الملكية يعرض:
```
حقوق الملكية:
  3100 رأس المال                   XXX,XXX
  3200 أرباح مبقاة                 XXX,XXX
  3300 أرباح العام الحالي          XXX,XXX
  (-) سحوبات المالك:
    3410 سحوبات (الشريك 1)        (XX,XXX)
    3420 سحوبات (الشريك 2)        (XX,XXX)
  ────────────────────────────────
  صافي حقوق الملكية              XXX,XXX
```

**مهم:** حسابات `34xx` طبيعتها DEBIT رغم أنها EQUITY — يجب طرحها لا جمعها في العرض.

---

## المرحلة 14 — الترجمة

أضف في `packages/i18n/translations/ar.json` و `en.json`:

```json
{
  // Owners
  "owners": "الشركاء / الملاك",
  "owner": "المالك / الشريك",
  "newOwner": "إضافة شريك",
  "ownerName": "اسم الشريك",
  "ownershipPercent": "نسبة الملكية",
  "totalOwnership": "إجمالي النسب",
  "ownershipMustEqual100": "يجب أن يكون مجموع نسب الشركاء 100%",
  "ownershipExceeds100": "مجموع النسب يتجاوز 100%",
  "activeOwners": "الشركاء النشطون",
  
  // Drawings
  "ownerDrawings": "سحوبات المالك",
  "ownerDrawing": "سحب مالك",
  "newOwnerDrawing": "سحب مالك جديد",
  "drawingNo": "رقم السحب",
  "drawingAmount": "مبلغ السحب",
  "drawingDate": "تاريخ السحب",
  "drawingStatus": "حالة السحب",
  "drawingType": "نوع السحب",
  "companyLevelDrawing": "سحب عام من الشركة",
  "projectSpecificDrawing": "سحب مخصص من مشروع",
  "linkToProject": "ربط بمشروع",
  "noProjectGeneral": "بدون مشروع (سحب عام)",
  "selectProject": "اختر مشروعاً",
  "selectOwner": "اختر الشريك",
  "approveDrawing": "اعتماد السحب",
  "cancelDrawing": "إلغاء السحب",
  "drawingApproved": "تم اعتماد السحب بنجاح",
  "drawingCancelled": "تم إلغاء السحب",
  
  // Context cards
  "ownerContext": "سياق الشريك",
  "projectContext": "سياق المشروع",
  "companyContext": "سياق الشركة",
  "bankBalance": "رصيد البنك",
  "balanceAfterDrawing": "الرصيد بعد السحب",
  "currentYearProfit": "ربح العام الحالي",
  "projectProfit": "ربح المشروع",
  "previousProjectDrawings": "السحوبات السابقة من المشروع",
  "previousCompanyDrawings": "السحوبات السابقة من الشركة",
  "availableFromProject": "المتاح للسحب من المشروع",
  "availableFromCompany": "المتاح للسحب من الشركة",
  "expectedShareOfProfit": "الحصة المتوقعة من الربح",
  "totalDrawingsByOwner": "إجمالي سحوبات الشريك",
  "ownerBalance": "رصيد حساب الشريك",
  "retainedEarnings": "الأرباح المبقاة",
  
  // Overdraw warnings
  "overdrawWarning": "تحذير: تجاوز الربح المتاح",
  "overdrawTitle": "السحب يتجاوز الربح المتاح",
  "overdrawAmount": "مقدار التجاوز",
  "overdrawProjectMessage": "ربح مشروع {projectName} الحالي {profit} ر.س، وقد تم السحب منه سابقاً {previous} ر.س. هذا السحب ({amount} ر.س) سيتجاوز الربح المتاح بـ {overdraw} ر.س.",
  "overdrawCompanyMessage": "ربح الشركة الحالي {profit} ر.س، وإجمالي السحوبات السابقة {previous} ر.س. هذا السحب ({amount}) سيتجاوز الربح المتاح بـ {overdraw} ر.س.",
  "convertToGeneralDrawing": "تحويل إلى سحب عام",
  "confirmDespiteOverdraw": "تأكيد رغم التجاوز",
  "overdrawAcknowledged": "تم تسجيل التجاوز في السحب",
  "insufficientBankBalance": "رصيد البنك غير كافٍ",
  
  // Year-end
  "yearEndClosing": "الإقفال السنوي",
  "yearEndPreview": "معاينة قيد الإقفال",
  "executeClosing": "تنفيذ الإقفال",
  "closingYear": "السنة المالية",
  "totalRevenue": "إجمالي الإيرادات",
  "totalExpenses": "إجمالي المصروفات",
  "netProfitLoss": "صافي الربح/الخسارة",
  "profitDistribution": "توزيع الربح",
  "shareOfProfit": "الحصة من الربح",
  "drawingsDeduction": "خصم السحوبات",
  "netToRetained": "الصافي للأرباح المبقاة",
  "closingEntryPreview": "القيد المتوقع",
  "yearAlreadyClosed": "هذه السنة مُقفلة مسبقاً",
  "draftEntriesWarning": "يوجد قيود مسودة لم تُرحَّل في هذه السنة",
  "openPeriodsWarning": "يوجد فترات محاسبية مفتوحة في هذه السنة",
  "closingSuccessful": "تم إقفال السنة المالية بنجاح",
  "confirmClosing": "هل أنت متأكد من تنفيذ الإقفال السنوي؟",
  "closingHistory": "سجل الإقفالات",
  
  // Reports
  "drawingsPerProject": "سحوبات المالك لكل مشروع",
  "drawingsPerOwner": "السحوبات لكل شريك",
  "projectProfitability": "ربحية المشروع",
  "operatingProfit": "الربح التشغيلي",
  "netProfitAfterDrawings": "الربح الصافي بعد السحوبات"
}
```

---

## 🔴 القائمة الحمراء — لا تعدّل

| الملف | السبب |
|-------|-------|
| `backfill.ts` | لا تُضف سحوبات المالك للـ backfill (عمليات يدوية) |
| أي ملف auth | لا علاقة |
| `fix-zod-decimal.mjs` | فقط شغّله، لا تعدّل |
| `projects/`، `pricing/` (خارج cost-center) | خارج النطاق |
| منطق حساب `trialBalance` و `incomeStatement` الموجود | لا يتغير — الحسابات الجديدة ستظهر تلقائياً |

---

## ملخص التغييرات المتوقعة

### Schema
| التغيير | التفاصيل |
|---------|---------|
| `OrganizationOwner` model | جديد |
| `OwnerDrawing` model | جديد (مع projectId) |
| `OwnerDrawingType` enum | جديد |
| `OwnerDrawingStatus` enum | جديد |
| `JournalEntryReferenceType` | + 4 values |
| `OrgAuditAction` | + 10 actions |
| `Organization`, `Project`, `User`, `ChartAccount`, `OrganizationBank` | + relations |

### Backend (ملفات جديدة)
| الملف | السطور المتوقعة |
|-------|----------------|
| `accounting/procedures/organization-owners.ts` | ~300 |
| `accounting/procedures/owner-drawings.ts` | ~700 |
| `accounting/procedures/year-end-closing.ts` | ~400 |

### Backend (تعديلات)
| الملف | التغيير |
|-------|---------|
| `accounting.ts` (queries) | + `createOwnerDrawingAccount()` + تعديل `seedChartOfAccounts()` |
| `auto-journal.ts` | + `onOwnerDrawing()` + `onOwnerDrawingCancelled()` + prefixes |
| `accounting/router.ts` | + `owners`, `ownerDrawings`, `yearEnd` namespaces |
| `accounting-reports.ts` أو `finance-reports.ts` | تحديث cost center لتشمل السحوبات |

### Frontend (صفحات جديدة)
- `/settings/owners/*` — 4 ملفات
- `/finance/owner-drawings/*` — 6 ملفات
- `/finance/year-end-closing/*` — 2 ملفات

### Frontend (مكونات جديدة)
- `owners/*` — 4 مكونات
- `owner-drawings/*` — 8 مكونات (بما فيها OwnerDrawingForm الذكي)
- `year-end/*` — 4 مكونات

### Frontend (تعديلات)
- `shell/constants.ts` — + nav section
- `AccountingDashboard.tsx` — + KPI + tنبيهات + إجراءات
- `CostCenterReport.tsx` — + عمود السحوبات
- `BalanceSheetReport.tsx` — + قسم سحوبات

### Translation
- `ar.json`, `en.json` — ~80 مفتاح جديد

---

## التحقق النهائي

```bash
# 1. TypeScript
npx tsc --noEmit

# 2. Prisma
pnpm --filter database generate
node packages/database/fix-zod-decimal.mjs

# 3. Build
pnpm build

# 4. ابحث عن أي مفاتيح ترجمة مفقودة يدوياً
```

---

## اختبارات يدوية موصى بها (بعد التنفيذ)

قبل الـ merge، جرّب هذه السيناريوهات يدوياً:

1. **إنشاء منظمة جديدة:** تحقق أن `3400` و `3410` و شريك افتراضي يُنشأون تلقائياً
2. **إضافة شريك ثانٍ:** تحقق أن `3420` يُنشأ ومربوط به
3. **سحب عام بدون مشروع:** تحقق من القيد (بدون projectId)
4. **سحب مخصص من مشروع رابح:** تحقق من القيد (مع projectId) وتقرير cost center
5. **سحب مخصص من مشروع خاسر:** تحقق من ظهور التحذير الأحمر + dialog
6. **تأكيد التجاوز:** تحقق أن السحب يُنشأ مع `hasOverdrawWarning=true`
7. **رصيد بنك غير كافٍ:** تحقق أن النظام يمنع السحب
8. **إلغاء سحب معتمد:** تحقق من عكس القيد وإعادة رصيد البنك
9. **سحب ثم إقفال سنوي:** تحقق أن الأرباح تُرحَّل صحيحاً والسحوبات تُصفَّر
10. **Balance Sheet:** تحقق أن السحوبات تُطرح من حقوق الملكية

---

## القواعد الذهبية

1. **كل الحقول المالية `Decimal(15,2)`** — لا Float، لا number في DB
2. **Zod schemas:** `z.union([z.string(), z.number()])` لحقول Decimal على حدود الـ API
3. **`organizationId`** في كل query، procedure، model
4. **`subscriptionProcedure`** للكتابة، **`protectedProcedure`** للقراءة
5. **`verifyOrganizationAccess()`** في كل endpoint
6. **`orgAuditLog()`** لكل create/update/delete
7. **RTL:** Tailwind logical properties فقط
8. **الترجمة:** في `packages/i18n/translations/` فقط
9. **Silent failure:** أخطاء auto-journal تُسجَّل ولا تكسر العملية الأصلية
10. **`fix-zod-decimal.mjs`** بعد كل `prisma generate`
11. **التجاوز لا يمنع — فقط ينبّه** (قرار تصميمي)
12. **المشروع اختياري دائماً** (nullable في كل المستويات)
