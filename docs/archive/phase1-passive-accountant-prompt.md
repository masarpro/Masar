# المرحلة 1 — "المحاسب السلبي" — برومبت تنفيذي لـ Claude Code

## نظرة عامة

هذا البرومبت مقسّم إلى **5 مراحل فرعية** لبناء 4 تقارير محاسبية ذكية فوق البيانات الموجودة فعلاً في مسار، بدون أي تغيير على Schema أو الـ Models الحالية.

**القاعدة الذهبية:** لا schema changes، لا models جديدة، لا migration — فقط queries + procedures + UI components.

---
---

# المرحلة الفرعية 1/5: البنية التحتية المشتركة + صفحة التقارير المحاسبية

## الهدف
إنشاء صفحة التقارير المحاسبية الجديدة تحت `/finance/accounting-reports` مع البنية المشتركة (shared types، date range picker، export helpers).

## ⛔ القائمة الحمراء — ملفات لا تلمسها أبداً
- `packages/database/prisma/schema.prisma` — لا تعديل على الـ schema
- `packages/api/modules/quantities/**` — لا علاقة بالكميات
- `structural-calculations.ts` — لا تلمسه أبداً
- `derivation-engine.ts` — لا تلمسه أبداً

## التعليمات

### الخطوة 1: قراءة الملفات الموجودة أولاً

```
اقرأ هذه الملفات قبل أي شيء:
1. packages/api/modules/finance/router.ts — لفهم هيكل الراوتر المالي
2. packages/api/modules/finance/procedures/ — لفهم أنماط الـ procedures الحالية
3. packages/database/prisma/queries/finance-reports.ts — لفهم أنماط تقارير الحالية (505 سطر)
4. packages/database/prisma/queries/cash-flow.ts — لفهم نمط التدفقات النقدية (283 سطر)
5. apps/web/modules/saas/finance/components/ — لفهم هيكل صفحات المالية
6. packages/api/lib/permissions/ — لفهم نظام الصلاحيات
7. apps/web/app/[locale]/app/[slug]/finance/reports/ — صفحة التقارير الحالية
```

### الخطوة 2: إنشاء ملف الأنواع المشتركة

أنشئ ملف `packages/database/prisma/queries/accounting-reports.ts`

هذا الملف سيحتوي على كل استعلامات التقارير المحاسبية الأربعة. ابدأ بالتصدير الأساسي:

```typescript
// packages/database/prisma/queries/accounting-reports.ts
// التقارير المحاسبية — استعلامات فوق البيانات الموجودة

import { type PrismaClient, Prisma } from "@prisma/client";

// ========== الأنواع المشتركة ==========

export interface DateRangeInput {
  organizationId: string;
  dateFrom: Date;
  dateTo: Date;
}

export interface AgingBucket {
  current: Prisma.Decimal;      // 0-30 يوم
  days31to60: Prisma.Decimal;   // 31-60 يوم
  days61to90: Prisma.Decimal;   // 61-90 يوم
  over90: Prisma.Decimal;       // أكثر من 90 يوم
  total: Prisma.Decimal;
}

// ستُضاف الدوال في المراحل التالية
```

### الخطوة 3: إنشاء procedures ملف

أنشئ ملف `packages/api/modules/finance/procedures/accounting-reports.ts`

```typescript
// packages/api/modules/finance/procedures/accounting-reports.ts

import { z } from "zod";

// Schema مشترك لكل التقارير المحاسبية
export const accountingReportInput = z.object({
  organizationId: z.string(),
  dateFrom: z.string().transform((s) => new Date(s)),
  dateTo: z.string().transform((s) => new Date(s)),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
});

// ستُضاف الـ procedures في المراحل التالية
```

### الخطوة 4: إضافة route في الراوتر المالي

في `packages/api/modules/finance/router.ts`، أضف مجموعة `accountingReports` جديدة تحت الراوتر الحالي. اتبع نفس نمط `reports` الموجود.

**مهم:** استخدم `protectedProcedure` مع `verifyOrganizationAccess(finance.view)` — نفس صلاحيات التقارير الحالية.

### الخطوة 5: إنشاء صفحة UI

أنشئ صفحة جديدة:
```
apps/web/app/[locale]/app/[slug]/finance/accounting-reports/page.tsx
```

هذه الصفحة تحتوي على:
- **عنوان:** "التقارير المحاسبية" / "Accounting Reports"
- **4 بطاقات** (cards) كل واحدة تمثل تقرير:
  1. 🔴 تقرير المديونيات المتقادمة (Aged Receivables)
  2. 🟠 تقرير المستحقات المتقادمة (Aged Payables)
  3. 🟢 تقرير ضريبة القيمة المضافة (VAT Report)
  4. 🔵 قائمة الدخل المبسّطة (Income Statement)
- كل بطاقة فيها: أيقونة + اسم التقرير + وصف مختصر + زر "عرض التقرير"
- **Date Range Picker مشترك** في الأعلى (يُطبّق على كل التقارير)
- الـ default range: الشهر الحالي

**تصميم البطاقات:** استخدم نفس نمط الـ cards الموجود في Finance Dashboard — لا تبتكر تصميم جديد. ارجع للمكونات في:
```
apps/web/modules/saas/finance/components/dashboard/FinanceDashboard.tsx
```

### الخطوة 6: إضافة رابط في Sidebar

في ملف navigation المالية، أضف رابط "التقارير المحاسبية" تحت "التقارير" الحالية. اقرأ أولاً:
```
apps/web/modules/saas/shared/components/sidebar/
```
واتبع نفس النمط بالضبط.

### الخطوة 7: الترجمة

أضف مفاتيح الترجمة في **كلا الملفين** بالتوازي:
- `apps/web/messages/ar.json`
- `apps/web/messages/en.json`

```json
// في ar.json تحت finance:
"accountingReports": "التقارير المحاسبية",
"agedReceivables": "المديونيات المتقادمة",
"agedPayables": "المستحقات المتقادمة",
"vatReport": "تقرير ضريبة القيمة المضافة",
"simplifiedIncomeStatement": "قائمة الدخل المبسّطة",
"aging": {
  "current": "جاري (0-30 يوم)",
  "days31to60": "31-60 يوم",
  "days61to90": "61-90 يوم",
  "over90": "أكثر من 90 يوم",
  "total": "الإجمالي"
},
"vat": {
  "outputVat": "ضريبة المخرجات (المبيعات)",
  "inputVat": "ضريبة المدخلات (المشتريات)",
  "netVat": "صافي الضريبة المستحقة",
  "taxableAmount": "المبلغ الخاضع للضريبة",
  "vatAmount": "مبلغ الضريبة",
  "period": "الفترة الضريبية"
},
"incomeStatement": {
  "revenue": "الإيرادات",
  "expenses": "المصروفات",
  "grossProfit": "مجمل الربح",
  "operatingExpenses": "المصروفات التشغيلية",
  "netProfit": "صافي الربح",
  "profitMargin": "هامش الربح"
}
```

### الخطوة 8: التحقق

```bash
pnpm tsc --noEmit
pnpm build
```

---
---

# المرحلة الفرعية 2/5: تقرير المديونيات المتقادمة (Aged Receivables)

## الهدف
بناء تقرير يعرض الفواتير المستحقة وغير المدفوعة مقسّمة حسب عمر الدين (0-30، 31-60، 61-90، +90 يوم)، مُجمّعة حسب العميل، مع إمكانية الفلترة بالمشروع.

## ⛔ القائمة الحمراء — نفس المرحلة 1

## مصدر البيانات — اقرأ أولاً:
```
اقرأ هذه الملفات لفهم هيكل البيانات:
1. packages/database/prisma/queries/finance.ts — دوال الفواتير (الأسطر 701-1100)
2. بحث عن model FinanceInvoice في schema.prisma — لمعرفة الحقول الدقيقة
3. بحث عن model FinanceInvoicePayment في schema.prisma
4. بحث عن model Client في schema.prisma
```

## منطق التقرير

### مصدر البيانات:
- **جدول:** `FinanceInvoice`
- **الفلتر:** فواتير بحالة `ISSUED`, `SENT`, `VIEWED`, `PARTIALLY_PAID`, `OVERDUE` (أي فاتورة غير مدفوعة بالكامل وغير ملغاة وليست DRAFT)
- **لا تشمل:** `DRAFT`, `PAID`, `CANCELLED`
- **لا تشمل:** فواتير من نوع `CREDIT_NOTE` أو `DEBIT_NOTE`
- **التقادم يُحسب من:** حقل `dueDate` (تاريخ الاستحقاق)
- **المبلغ المستحق:** `totalAmount - paidAmount` (الفرق بين إجمالي الفاتورة والمدفوع)

### حساب التقادم:
```
اليوم = new Date()
عمر_الدين = عدد الأيام من dueDate إلى اليوم

إذا عمر_الدين <= 0   → جاري (لم يحل موعد السداد بعد) — ضعه في bucket "current"
إذا عمر_الدين 1-30    → 0-30 يوم
إذا عمر_الدين 31-60   → 31-60 يوم
إذا عمر_الدين 61-90   → 61-90 يوم
إذا عمر_الدين > 90    → أكثر من 90 يوم
```

### التجميع:
- **المستوى الأول:** حسب العميل (`clientId` + `clientName`)
- **المستوى الثاني:** تفاصيل الفواتير لكل عميل
- **صف إجمالي** في الأسفل يجمع كل الـ buckets

## التعليمات

### الخطوة 1: كتابة الاستعلام

في ملف `packages/database/prisma/queries/accounting-reports.ts`، أضف:

```typescript
export interface AgedReceivablesRow {
  clientId: string | null;
  clientName: string;
  current: Prisma.Decimal;
  days1to30: Prisma.Decimal;
  days31to60: Prisma.Decimal;
  days61to90: Prisma.Decimal;
  over90: Prisma.Decimal;
  total: Prisma.Decimal;
  invoices: {
    id: string;
    number: string;
    issueDate: Date;
    dueDate: Date;
    totalAmount: Prisma.Decimal;
    paidAmount: Prisma.Decimal;
    outstanding: Prisma.Decimal;
    agingDays: number;
    projectName: string | null;
  }[];
}

export interface AgedReceivablesResult {
  rows: AgedReceivablesRow[];
  totals: {
    current: Prisma.Decimal;
    days1to30: Prisma.Decimal;
    days31to60: Prisma.Decimal;
    days61to90: Prisma.Decimal;
    over90: Prisma.Decimal;
    total: Prisma.Decimal;
  };
  generatedAt: Date;
}
```

**الاستعلام:** استخدم `db.financeInvoice.findMany` مع:
- `where: { organizationId, status: { in: [...] }, type: { notIn: ['CREDIT_NOTE', 'DEBIT_NOTE'] } }`
- `include: { project: { select: { name: true } } }`
- ثم group في TypeScript حسب `clientId`/`clientName`
- ثم وزّع المبالغ المستحقة على الـ buckets

**مهم:** استخدم `Prisma.Decimal` لكل الحسابات المالية — لا تستخدم `Number()` إلا عند العرض النهائي في UI.

### الخطوة 2: كتابة الـ Procedure

في `packages/api/modules/finance/procedures/accounting-reports.ts`، أضف procedure:

```typescript
// اسم الـ procedure: accountingReports.agedReceivables
// النوع: protectedProcedure / GET
// الصلاحية: verifyOrganizationAccess("finance.view")
// المدخلات: organizationId, asOfDate? (اختياري — الافتراضي: اليوم)
// المخرجات: AgedReceivablesResult
```

### الخطوة 3: ربط في الراوتر

أضف `agedReceivables` في مجموعة `accountingReports` في الراوتر.

### الخطوة 4: بناء صفحة UI

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/accounting-reports/aged-receivables/page.tsx
```

**المكونات:**
1. **شريط فلاتر علوي:** تاريخ "كما في" (as of date) + فلتر مشروع (اختياري) + زر تصدير
2. **4 بطاقات KPI في الأعلى:** إجمالي المستحق، عدد العملاء المتأخرين، أكبر مديونية، متوسط أيام التأخر
3. **جدول رئيسي:**
   - الأعمدة: اسم العميل | جاري | 1-30 يوم | 31-60 يوم | 61-90 يوم | +90 يوم | الإجمالي
   - كل صف عميل قابل للتوسيع (expandable) يعرض تفاصيل فواتيره
   - صف إجمالي في الأسفل (مُميّز بلون)
   - الأعمدة المالية بألوان تدرجية: أخضر (جاري) → أصفر (30) → برتقالي (60) → أحمر (90+)
4. **مخطط دائري (Pie Chart)** يعرض توزيع المديونيات حسب فئات التقادم — استخدم Recharts

**التصميم:** RTL-first. استخدم `ms-` و `me-` و `ps-` و `pe-` بدل `ml-` و `mr-`. ارجع لتصميم التقارير الموجودة في:
```
apps/web/modules/saas/finance/components/reports/
```

### الخطوة 5: التحقق
```bash
pnpm tsc --noEmit
pnpm build
```

---
---

# المرحلة الفرعية 3/5: تقرير المستحقات المتقادمة (Aged Payables)

## الهدف
بناء تقرير يعرض المبالغ المستحقة لمقاولي الباطن مقسّمة حسب عمر الالتزام.

## ⛔ القائمة الحمراء — نفس المرحلة 1

## مصدر البيانات — اقرأ أولاً:
```
اقرأ هذه الملفات:
1. packages/database/prisma/queries/subcontract.ts — استعلامات مقاولي الباطن
2. بحث عن model SubcontractContract في schema.prisma
3. بحث عن model SubcontractClaim في schema.prisma
4. بحث عن model SubcontractPayment في schema.prisma
5. packages/api/modules/subcontract/ — لفهم هيكل الـ procedures
```

## منطق التقرير

### مصدر البيانات:
المستحقات لمقاولي الباطن تأتي من **مستخلصات معتمدة غير مدفوعة بالكامل**:

- **جدول:** `SubcontractClaim` 
- **الفلتر:** مستخلصات بحالة `APPROVED` (معتمدة ولم تُدفع بالكامل بعد)
- **المبلغ المستحق لكل مستخلص:** `netAmount` ناقص مجموع `SubcontractPayment` المرتبطة بهذا المستخلص (عبر `claimId`)
- **التقادم:** من تاريخ اعتماد المستخلص (`updatedAt` عندما تغيّرت الحالة لـ APPROVED) أو من `createdAt` كـ fallback

### مصدر ثانوي — عقود بدون مستخلصات:
بعض مقاولي الباطن يُدفع لهم مباشرة بدون مستخلصات. في هذه الحالة:
- **جدول:** `SubcontractContract` (حالة ACTIVE)
- **المستحق:** `value` (قيمة العقد) ناقص مجموع كل `SubcontractPayment` المرتبطة بالعقد
- **فقط** إذا كان المبلغ المستحق > 0

### التجميع:
- **المستوى الأول:** حسب المقاول (`SubcontractContract.name`)
- **المستوى الثاني:** تفاصيل المستخلصات/العقود

## التعليمات

### الخطوة 1: كتابة الاستعلام

في ملف `packages/database/prisma/queries/accounting-reports.ts`، أضف:

```typescript
export interface AgedPayablesRow {
  contractId: string;
  contractorName: string;
  contractNo: string;
  projectId: string;
  projectName: string;
  current: Prisma.Decimal;
  days1to30: Prisma.Decimal;
  days31to60: Prisma.Decimal;
  days61to90: Prisma.Decimal;
  over90: Prisma.Decimal;
  total: Prisma.Decimal;
  details: {
    id: string;
    type: "claim" | "contract_balance";
    reference: string; // رقم المستخلص أو رقم العقد
    date: Date;
    totalAmount: Prisma.Decimal;
    paidAmount: Prisma.Decimal;
    outstanding: Prisma.Decimal;
    agingDays: number;
  }[];
}

export interface AgedPayablesResult {
  rows: AgedPayablesRow[];
  totals: {
    current: Prisma.Decimal;
    days1to30: Prisma.Decimal;
    days31to60: Prisma.Decimal;
    days61to90: Prisma.Decimal;
    over90: Prisma.Decimal;
    total: Prisma.Decimal;
  };
  generatedAt: Date;
}
```

**الاستعلام:** 
1. أولاً: `db.subcontractContract.findMany` مع `include: { claims, payments, project }`
2. لكل عقد: احسب المستحق من المستخلصات المعتمدة
3. إذا لم توجد مستخلصات: احسب المستحق من قيمة العقد - المدفوعات
4. وزّع على الـ aging buckets

### الخطوة 2: كتابة الـ Procedure

```typescript
// اسم الـ procedure: accountingReports.agedPayables
// النوع: protectedProcedure / GET
// الصلاحية: verifyOrganizationAccess("finance.view")
// المدخلات: organizationId, asOfDate?, projectId?
// المخرجات: AgedPayablesResult
```

### الخطوة 3: بناء صفحة UI

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/accounting-reports/aged-payables/page.tsx
```

**نفس تصميم Aged Receivables** مع فروقات:
- العنوان: "المستحقات المتقادمة — مقاولو الباطن"
- الأعمدة: اسم المقاول | المشروع | رقم العقد | جاري | 1-30 | 31-60 | 61-90 | +90 | الإجمالي
- **بطاقات KPI:** إجمالي المستحق، عدد المقاولين، أكبر مستحق، متوسط أيام التأخر

### الخطوة 4: التحقق
```bash
pnpm tsc --noEmit
pnpm build
```

---
---

# المرحلة الفرعية 4/5: تقرير ضريبة القيمة المضافة (VAT Report)

## الهدف
بناء تقرير ربع سنوي يجمع ضريبة المخرجات (من الفواتير) وضريبة المدخلات (من المصروفات) ويحسب صافي الضريبة المستحقة/المستردة — جاهز لتقديمه لهيئة الزكاة (ZATCA).

## ⛔ القائمة الحمراء — نفس المرحلة 1

## مصدر البيانات — اقرأ أولاً:
```
اقرأ هذه الملفات:
1. packages/database/prisma/queries/finance.ts — calculateInvoiceTotals (الأسطر 16-57)
2. بحث عن حقل vatPercent و vatAmount في schema.prisma
3. بحث عن حقول الضريبة في FinanceInvoice
4. بحث عن حقول الضريبة في FinanceExpense
5. packages/api/lib/zatca/ — كود ZATCA الحالي
```

## منطق التقرير

### ضريبة المخرجات (Output VAT — المبيعات):
- **مصدر:** `FinanceInvoice` بحالة `ISSUED` أو أعلى (ليس DRAFT ولا CANCELLED)
- **لا تشمل:** `CREDIT_NOTE` (تُخصم من ضريبة المخرجات)
- **الحقول:** `vatAmount` (مبلغ الضريبة)، `totalAmount - vatAmount` (المبلغ الخاضع)
- **الفلتر بالتاريخ:** `issueDate` ضمن الفترة المطلوبة
- **إشعارات دائنة (CREDIT_NOTE):** تُخصم من ضريبة المخرجات (مبلغ سالب)

### ضريبة المدخلات (Input VAT — المشتريات):
- **مصدر:** `FinanceExpense` بحالة `COMPLETED`
- **المشكلة:** نموذج المصروفات الحالي قد لا يحتوي على حقل `vatAmount` منفصل

**تعامل مع هذا بذكاء:**
1. أولاً اقرأ schema.prisma وابحث عن حقول VAT في `FinanceExpense`
2. إذا وُجد حقل `vatAmount` → استخدمه مباشرة
3. إذا لم يوجد → احسب الضريبة بافتراض 15% على المصروفات اللي فئتها تخضع للضريبة (معظم الفئات ما عدا: SALARY, GOVERNMENT_FEES, INSURANCE_PREMIUM)
4. **اكتب تعليق واضح** في الكود يشرح الافتراض

### فئات المصروفات المعفاة من الضريبة:
```typescript
const VAT_EXEMPT_EXPENSE_CATEGORIES = [
  "SALARY",           // رواتب
  "GOVERNMENT_FEES",  // رسوم حكومية
  "BANK_FEES",        // عمولات بنكية
  "FINES",            // غرامات
];
```

### هيكل التقرير:
```
┌─────────────────────────────────────────────────┐
│ تقرير ضريبة القيمة المضافة                      │
│ الفترة: Q1 2026 (يناير - مارس)                  │
├─────────────────────────────────────────────────┤
│                                                  │
│ ضريبة المخرجات (المبيعات)                        │
│ ├── فواتير ضريبية:    المبلغ الخاضع | الضريبة    │
│ ├── فواتير مبسطة:     المبلغ الخاضع | الضريبة    │
│ ├── إشعارات دائنة:    المبلغ الخاضع | الضريبة(-) │
│ └── إجمالي المخرجات:  XXXXX | XXXXX             │
│                                                  │
│ ضريبة المدخلات (المشتريات)                       │
│ ├── مشتريات/مصروفات:  المبلغ الخاضع | الضريبة    │
│ └── إجمالي المدخلات:  XXXXX | XXXXX             │
│                                                  │
│ ═══════════════════════════════════════════════  │
│ صافي الضريبة المستحقة:  XXXXX ريال              │
│ (موجب = مستحق الدفع، سالب = مسترد)              │
└─────────────────────────────────────────────────┘
```

## التعليمات

### الخطوة 1: كتابة الاستعلام

في ملف `packages/database/prisma/queries/accounting-reports.ts`، أضف:

```typescript
export interface VATReportResult {
  period: {
    from: Date;
    to: Date;
    quarter: string; // "Q1 2026"
  };

  outputVAT: {
    taxInvoices: { taxableAmount: Prisma.Decimal; vatAmount: Prisma.Decimal; count: number };
    simplifiedInvoices: { taxableAmount: Prisma.Decimal; vatAmount: Prisma.Decimal; count: number };
    creditNotes: { taxableAmount: Prisma.Decimal; vatAmount: Prisma.Decimal; count: number };
    total: { taxableAmount: Prisma.Decimal; vatAmount: Prisma.Decimal };
  };

  inputVAT: {
    expenses: { taxableAmount: Prisma.Decimal; vatAmount: Prisma.Decimal; count: number };
    // مقاولي الباطن إذا كانت عقودهم تشمل ضريبة (includesVat)
    subcontractors: { taxableAmount: Prisma.Decimal; vatAmount: Prisma.Decimal; count: number };
    total: { taxableAmount: Prisma.Decimal; vatAmount: Prisma.Decimal };
  };

  netVAT: Prisma.Decimal; // outputVAT.total.vatAmount - inputVAT.total.vatAmount
  isPayable: boolean;     // true = مستحق الدفع، false = مسترد

  // تفاصيل الفواتير للمراجعة
  invoiceDetails: {
    id: string;
    number: string;
    type: string;
    clientName: string;
    issueDate: Date;
    taxableAmount: Prisma.Decimal;
    vatAmount: Prisma.Decimal;
  }[];

  generatedAt: Date;
}
```

**الاستعلام:**
1. `db.financeInvoice.findMany` — فلتر بالفترة + الحالة + organizationId
2. Group حسب `type` (TAX, SIMPLIFIED, CREDIT_NOTE, STANDARD)
3. `db.financeExpense.findMany` — فلتر بالفترة + الحالة COMPLETED
4. فلتر الفئات المعفاة
5. `db.subcontractPayment.findMany` مع `contract.includesVat = true`
6. احسب صافي الضريبة

### الخطوة 2: كتابة الـ Procedure

```typescript
// اسم الـ procedure: accountingReports.vatReport
// النوع: protectedProcedure / GET
// الصلاحية: verifyOrganizationAccess("finance.view")
// المدخلات: organizationId, dateFrom, dateTo (أو quarter + year)
// المخرجات: VATReportResult
```

**مدخلات إضافية:**
- `quarter?: 1 | 2 | 3 | 4` + `year?: number` — للاختيار السريع
- إذا قُدّم quarter + year → يحسب dateFrom/dateTo تلقائياً

### الخطوة 3: بناء صفحة UI

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/accounting-reports/vat-report/page.tsx
```

**المكونات:**
1. **اختيار الفترة:** أزرار اختيار سريع للأرباع (Q1, Q2, Q3, Q4) + السنة، أو تاريخ مخصص
2. **3 بطاقات KPI:** ضريبة المخرجات (أخضر) | ضريبة المدخلات (أحمر) | الصافي (أزرق إذا مسترد، أحمر إذا مستحق)
3. **قسم المخرجات:** جدول يعرض أنواع الفواتير مع المبالغ الخاضعة والضريبة
4. **قسم المدخلات:** جدول يعرض المصروفات والمقاولين
5. **خط فاصل + الصافي** بخط كبير واضح
6. **زر "تصدير PDF"** — يصدر التقرير بتنسيق يشبه النموذج الرسمي لـ ZATCA
7. **جدول التفاصيل** (expandable): كل فاتورة/مصروف مع رقمه وتاريخه ومبلغه

### الخطوة 4: التحقق
```bash
pnpm tsc --noEmit
pnpm build
```

---
---

# المرحلة الفرعية 5/5: قائمة الدخل المبسّطة (Simplified Income Statement)

## الهدف
بناء قائمة دخل مبسّطة تعرض إيرادات الفترة - مصروفات الفترة = صافي الربح، مُقسّمة حسب الفئات.

## ⛔ القائمة الحمراء — نفس المرحلة 1

## مصدر البيانات — اقرأ أولاً:
```
اقرأ هذه الملفات:
1. packages/database/prisma/queries/finance-reports.ts — getProfitability (موجود فعلاً)
2. packages/database/prisma/queries/org-finance.ts — getOrgFinanceDashboard
3. packages/database/prisma/queries/cash-flow.ts — cash flow queries
```

## منطق التقرير

### الإيرادات (Revenue):
```
1. إيرادات الفواتير:
   - مصدر: FinanceInvoice (حالة: ISSUED وأعلى، ليس DRAFT/CANCELLED)
   - المبلغ: totalAmount - vatAmount (بدون الضريبة)
   - الفلتر: issueDate ضمن الفترة
   - لا تشمل: CREDIT_NOTE (تُخصم)

2. إيرادات المقبوضات المباشرة (بدون فاتورة):
   - مصدر: FinancePayment (مقبوضات لا ترتبط بفاتورة)
   - الفلتر: date ضمن الفترة

إجمالي الإيرادات = فواتير + مقبوضات مباشرة - إشعارات دائنة
```

### المصروفات (Expenses):
```
1. مصروفات مباشرة:
   - مصدر: FinanceExpense (حالة: COMPLETED)
   - الفلتر: date ضمن الفترة
   - تُجمّع حسب category

2. مصروفات مشاريع:
   - مصدر: ProjectExpense (حالة: APPROVED)
   - الفلتر: date ضمن الفترة

3. مدفوعات مقاولي الباطن:
   - مصدر: SubcontractPayment
   - الفلتر: date ضمن الفترة

4. الرواتب:
   - مصدر: PayrollRun (حالة: APPROVED أو PAID)
   - الفلتر: month/year ضمن الفترة
   - المبلغ: إجمالي الصرف من PayrollRunItem

5. مصروفات الشركة المتكررة:
   - مصدر: CompanyExpensePayment (حالة: مدفوع)
   - الفلتر: date ضمن الفترة

إجمالي المصروفات = مباشرة + مشاريع + باطن + رواتب + متكررة
```

### الهيكل:
```
┌─────────────────────────────────────────────────────┐
│         قائمة الدخل المبسّطة                          │
│         الفترة: يناير 2026 - مارس 2026               │
├─────────────────────────────────────────────────────┤
│                                                      │
│ الإيرادات                                            │
│   إيرادات الفواتير                    500,000         │
│   مقبوضات أخرى                         20,000         │
│   إشعارات دائنة                       (10,000)        │
│                                   ─────────────      │
│   إجمالي الإيرادات                    510,000         │
│                                                      │
│ المصروفات                                            │
│   مواد ومشتريات                       120,000         │
│   مقاولو باطن                         150,000         │
│   رواتب وأجور                          80,000         │
│   إيجارات                              15,000         │
│   مرافق واتصالات                        8,000         │
│   نقل ومواصلات                         12,000         │
│   تأمين                                 5,000         │
│   مصروفات أخرى                         10,000         │
│                                   ─────────────      │
│   إجمالي المصروفات                    400,000         │
│                                                      │
│ ═══════════════════════════════════════════════════  │
│ صافي الربح                            110,000         │
│ هامش الربح                              21.6%         │
└─────────────────────────────────────────────────────┘
```

## التعليمات

### الخطوة 1: كتابة الاستعلام

في ملف `packages/database/prisma/queries/accounting-reports.ts`، أضف:

```typescript
export interface IncomeStatementResult {
  period: { from: Date; to: Date };

  revenue: {
    invoiceRevenue: Prisma.Decimal;
    directPayments: Prisma.Decimal;
    creditNotes: Prisma.Decimal; // سالب
    totalRevenue: Prisma.Decimal;
    // تفصيل حسب المشروع
    byProject: { projectId: string; projectName: string; amount: Prisma.Decimal }[];
    // تفصيل حسب العميل
    byClient: { clientId: string; clientName: string; amount: Prisma.Decimal }[];
  };

  expenses: {
    // تفصيل حسب الفئة
    byCategory: {
      category: string;
      categoryLabel: string; // الاسم العربي
      amount: Prisma.Decimal;
    }[];
    subcontractorPayments: Prisma.Decimal;
    payroll: Prisma.Decimal;
    companyExpenses: Prisma.Decimal;
    totalExpenses: Prisma.Decimal;
    // تفصيل حسب المشروع
    byProject: { projectId: string; projectName: string; amount: Prisma.Decimal }[];
  };

  summary: {
    grossProfit: Prisma.Decimal;      // الإيرادات - المصروفات المباشرة
    totalExpenses: Prisma.Decimal;
    netProfit: Prisma.Decimal;         // الإيرادات - كل المصروفات
    profitMargin: number;              // نسبة مئوية (Number for display)
  };

  // مقارنة بالفترة السابقة (same duration, previous period)
  comparison?: {
    previousRevenue: Prisma.Decimal;
    previousExpenses: Prisma.Decimal;
    previousNetProfit: Prisma.Decimal;
    revenueChange: number;   // نسبة التغيير %
    expensesChange: number;
    profitChange: number;
  };

  generatedAt: Date;
}
```

**الاستعلام:** استخدم `Promise.all` لتنفيذ كل الاستعلامات بالتوازي:

```typescript
const [invoices, creditNotes, directPayments, expenses, subPayments, payroll, companyExpenses] = 
  await Promise.all([
    // 1. فواتير الفترة
    db.financeInvoice.findMany({ where: { organizationId, issueDate: { gte: dateFrom, lte: dateTo }, status: { notIn: ['DRAFT', 'CANCELLED'] }, type: { notIn: ['CREDIT_NOTE'] } } }),
    // 2. إشعارات دائنة
    db.financeInvoice.findMany({ where: { organizationId, issueDate: { gte: dateFrom, lte: dateTo }, type: 'CREDIT_NOTE', status: { notIn: ['DRAFT', 'CANCELLED'] } } }),
    // 3. مقبوضات مباشرة
    db.financePayment.findMany({ where: { organizationId, date: { gte: dateFrom, lte: dateTo } } }),
    // 4. مصروفات
    db.financeExpense.findMany({ where: { organizationId, date: { gte: dateFrom, lte: dateTo }, status: 'COMPLETED' } }),
    // 5. مدفوعات باطن
    db.subcontractPayment.aggregate({ where: { contract: { project: { organizationId } }, date: { gte: dateFrom, lte: dateTo } }, _sum: { amount: true } }),
    // 6. رواتب — تحتاج استعلام مخصص حسب month/year
    getPayrollForPeriod(db, organizationId, dateFrom, dateTo),
    // 7. مصروفات شركة
    db.companyExpensePayment.aggregate({ where: { expense: { organizationId }, paidDate: { gte: dateFrom, lte: dateTo } }, _sum: { amount: true } }),
  ]);
```

### الخطوة 2: إضافة المقارنة بالفترة السابقة

إذا الفترة المطلوبة = 3 أشهر (Q1)، قارن بـ Q4 السنة الماضية.
إذا الفترة = شهر واحد، قارن بنفس الشهر من السنة الماضية.

### الخطوة 3: كتابة الـ Procedure + ربط بالراوتر

### الخطوة 4: بناء صفحة UI

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/accounting-reports/income-statement/page.tsx
```

**المكونات:**
1. **شريط فلاتر:** فترة (شهر/ربع/سنة/مخصص) + فلتر مشروع
2. **3 بطاقات KPI كبيرة:** الإيرادات (أخضر) | المصروفات (أحمر) | صافي الربح (أزرق/أحمر حسب القيمة) — مع نسبة التغيير عن الفترة السابقة
3. **قائمة الدخل المنسقة:** كما في الهيكل أعلاه — تنسيق محاسبي كلاسيكي (مسافات بادئة، خطوط فاصلة، أقواس للقيم السالبة)
4. **مخطط أعمدة (Bar Chart):** إيرادات vs مصروفات حسب الشهر — Recharts
5. **مخطط دائري:** توزيع المصروفات حسب الفئة
6. **جدول تفصيلي** (expandable): تفاصيل الإيرادات حسب العميل/المشروع، وتفاصيل المصروفات حسب الفئة

**التنسيق المحاسبي:**
- الأرقام السالبة بين أقواس: `(10,000)` بدل `-10,000`
- فواصل الآلاف: `510,000`
- محاذاة الأرقام لليسار (لأنه RTL — يعني عمود الأرقام على الجهة اليسرى)
- خط تحت المجاميع الفرعية، خطين تحت المجموع الكلي

### الخطوة 5: التحقق النهائي
```bash
pnpm tsc --noEmit
pnpm build
```

---
---

# ملاحظات عامة لكل المراحل

## أنماط يجب اتباعها (من الكود الحالي):

1. **كل استعلام يبدأ بـ `organizationId`** — multi-tenancy إلزامي
2. **استخدم `Prisma.Decimal`** لكل الحسابات المالية، لا تستخدم `Number()` إلا عند العرض
3. **استخدم `protectedProcedure`** مع `verifyOrganizationAccess("finance.view")` — تقارير قراءة فقط
4. **استخدم `Promise.all`** للاستعلامات المتوازية — نفس نمط `getOrgFinanceDashboard`
5. **RTL-safe:** استخدم `ms-`, `me-`, `ps-`, `pe-` بدل `ml-`, `mr-`, `pl-`, `pr-`
6. **الترجمة:** أضف كل مفتاح جديد في `ar.json` و `en.json` بالتوازي
7. **لا تنشئ مكونات عملاقة:** إذا تجاوز المكون 400 سطر، قسّمه

## Index يُفضّل إضافته (اختياري — لتحسين الأداء):

التقرير يذكر أن `FinanceInvoice` ينقصه index على `(organizationId, status, dueDate)`. هذا مهم جداً لتقرير المديونيات المتقادمة. **لكن لا تضفه في هذه المرحلة** — سنضيفه في prompt منفصل لأنه يتطلب migration.

## ترتيب التنفيذ المقترح:
1. المرحلة 1/5 (البنية) → اختبر → commit
2. المرحلة 2/5 (Aged Receivables) → اختبر → commit
3. المرحلة 3/5 (Aged Payables) → اختبر → commit
4. المرحلة 4/5 (VAT Report) → اختبر → commit
5. المرحلة 5/5 (Income Statement) → اختبر → commit

## ماذا بعد (خارج هذا البرومبت):
- إضافة تصدير PDF احترافي لكل تقرير
- إضافة الـ index المفقود `(organizationId, status, dueDate)` على `FinanceInvoice`
- إضافة أداة AI جديدة `queryAccountingReports` لمساعد مسار الذكي
- إضافة حقل `vatAmount` مخصص على `FinanceExpense` إذا لم يكن موجوداً
