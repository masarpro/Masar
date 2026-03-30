# برومبت 2: الدقة المالية ومنطق الأعمال

> **الهدف:** ضمان صحة الأرقام المالية وإحكام Workflows الأعمال (18 مشكلة)
> **الوقت المتوقع:** 50-70 دقيقة
> **عدد المشاكل:** 18 مشكلة

---

## 🚫 القائمة الحمراء — لا تلمس هذه الملفات أبداً

- `packages/api/modules/quantities/engines/structural-calculations.ts`
- `packages/api/modules/quantities/engines/derivation-engine.ts`
- `apps/web/modules/saas/pricing/lib/structural-calculations.ts`
- `packages/database/prisma/zod/index.ts`
- `packages/api/lib/accounting/auto-journal.ts` (إلا لإضافة JOURNAL_ENTRY_SKIPPED logging)

---

## المرحلة 0: اقرأ أولاً — لا تخمّن

```bash
cat CLAUDE.md
cat packages/api/modules/finance/procedures/create-invoice.ts | head -100
cat packages/api/modules/project-change-orders/procedures/*.ts | head -200
cat packages/api/modules/company/procedures/leave-requests.ts
cat packages/database/prisma/queries/accounting.ts | head -100
cat packages/api/modules/finance/procedures/expenses.ts | grep -A20 "category\|6900"
cat packages/database/prisma/schema/finance.prisma | head -100
grep -rn "onDelete.*Cascade" packages/database/prisma/schema/ --include="*.prisma"
cat packages/api/modules/project-payments/procedures/create.ts
cat packages/api/modules/project-timeline/procedures/*.ts | head -200
cat packages/api/modules/subcontracts/procedures/copy*.ts 2>/dev/null || echo "No copy file"
grep -rn "issueDate\|dueDate" packages/api/modules/finance/ --include="*.ts" | head -20
```

---

## المرحلة 1: Invoice Validation — issueDate ≤ dueDate + Decimal Precision (مشاكل #27, #28)

### 1a: issueDate ≤ dueDate (#27)

1. ابحث عن schema validation للفواتير:
```bash
grep -rn "issueDate\|dueDate" packages/api/modules/finance/procedures/create-invoice.ts
grep -rn "issueDate\|dueDate" packages/api/modules/finance/types.ts
```

2. أضف validation في schema الإنشاء والتعديل:
```typescript
.refine(
  (data) => !data.dueDate || new Date(data.issueDate) <= new Date(data.dueDate),
  { message: "تاريخ الإصدار يجب أن يكون قبل أو يساوي تاريخ الاستحقاق", path: ["dueDate"] }
)
```

3. أو أضف validation في الـ procedure نفسه قبل الحفظ:
```typescript
if (input.dueDate && new Date(input.issueDate) > new Date(input.dueDate)) {
  throw new ORPCError("BAD_REQUEST", { message: "issueDate must be ≤ dueDate" });
}
```

### 1b: Credit note Decimal precision (#28)

1. اقرأ:
```bash
sed -n '1580,1600p' packages/api/modules/finance/procedures/create-invoice.ts
```

2. المشكلة: عمليات حسابية على Prisma Decimal قد تفشل. تأكد أن كل العمليات الحسابية على credit notes تستخدم:
```typescript
import { Decimal } from "@prisma/client/runtime/library";

// ✅ صحيح
const total = new Decimal(amount).times(quantity);

// ❌ خاطئ
const total = Number(amount) * Number(quantity); // يفقد الدقة للأعداد الكبيرة
```

3. راجع كل الأماكن التي تتعامل مع credit note amounts وتأكد من استخدام Decimal arithmetic.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "create-invoice" | head -10
```

---

## المرحلة 2: Change Order Workflow Enforcement (مشكلة #25)

**المشكلة:** يمكن تخطي خطوات في workflow أوامر التغيير.

**المطلوب:**

1. اقرأ:
```bash
cat packages/api/modules/project-change-orders/procedures/*.ts
grep -n "status\|Status" packages/api/modules/project-change-orders/procedures/*.ts
```

2. أضف state machine validation — يجب أن تكون التحولات المسموحة واضحة:
```typescript
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "REJECTED"],
  APPROVED: ["IMPLEMENTED"],
  REJECTED: ["DRAFT"],        // يمكن إعادة تقديم
  IMPLEMENTED: [],             // حالة نهائية
};

function validateTransition(current: string, next: string) {
  const allowed = ALLOWED_TRANSITIONS[current];
  if (!allowed || !allowed.includes(next)) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Cannot transition from ${current} to ${next}`
    });
  }
}
```

3. استدع `validateTransition()` قبل أي `update({ status })` في change orders.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "change-orders" | head -10
```

---

## المرحلة 3: Leave Balance Check (مشكلة #26)

**المشكلة:** يمكن اعتماد إجازة تتجاوز رصيد الموظف.

**المطلوب:**

1. اقرأ:
```bash
cat packages/api/modules/company/procedures/leave-requests.ts
grep -rn "leave\|balance\|LeaveRequest\|LeaveBalance" packages/database/prisma/schema/ --include="*.prisma"
grep -rn "approve\|APPROVED" packages/api/modules/company/procedures/leave-requests.ts
```

2. عند الموافقة على إجازة (`status → APPROVED`):
```typescript
// احسب الرصيد المتبقي
const totalApprovedDays = await db.leaveRequest.aggregate({
  where: {
    employeeId: request.employeeId,
    status: "APPROVED",
    leaveType: request.leaveType,
    startDate: { gte: yearStart },
  },
  _sum: { days: true },
});

const usedDays = totalApprovedDays._sum.days || 0;
const requestedDays = calculateDays(request.startDate, request.endDate);
const annualAllowance = getLeaveAllowance(request.leaveType); // 21 أو 30 حسب النظام

if (usedDays + requestedDays > annualAllowance) {
  throw new ORPCError("BAD_REQUEST", {
    message: "رصيد الإجازات غير كافٍ"
  });
}
```

3. **ملاحظة:** إذا لم يكن هناك نموذج `LeaveBalance` أو `annualAllowance` في الـ schema، أضف ثابت افتراضي (21 يوم للإجازة السنوية حسب نظام العمل السعودي) مع تعليق `// TODO: make configurable per organization`.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "leave" | head -10
```

---

## المرحلة 4: Cascade Delete Protection (مشاكل #42, #43, #44)

**المشاكل:**
- #42: JournalEntry يستخدم hard delete (Cascade) — فقدان audit trail
- #43: CostStudy.onDelete: Cascade — حذف دراسة كاملة
- #44: SubcontractContract.onDelete: Cascade — حذف كل العقود والمطالبات

**المطلوب:**

1. اقرأ:
```bash
grep -n "onDelete.*Cascade" packages/database/prisma/schema/*.prisma
grep -B5 -A5 "JournalEntry" packages/database/prisma/schema/*.prisma | grep -A5 "onDelete"
grep -B5 -A5 "CostStudy" packages/database/prisma/schema/*.prisma | grep -A5 "onDelete"
grep -B5 -A5 "SubcontractContract" packages/database/prisma/schema/*.prisma | grep -A5 "onDelete"
```

2. **لا تغيّر الـ Schema مباشرة** (في القائمة الحمراء إلا بتأكيد) — بدلاً من ذلك، أضف **حماية في الكود**:

### 4a: JournalEntry soft delete (#42)
بدل حذف القيد المحاسبي، أضف حقل `deletedAt` أو غيّر الحالة لـ `VOIDED`:
```bash
grep -n "delete\|destroy" packages/api/modules/accounting/procedures/journal-entries.ts
```
- في procedure الحذف، بدل `db.journalEntry.delete()` استخدم:
```typescript
await db.journalEntry.update({
  where: { id },
  data: { status: "VOIDED", voidedAt: new Date(), voidedById: userId }
});
```
- **إذا `VOIDED` غير موجود في الـ enum:** أضف تعليق `// TODO: Add VOIDED status to JournalEntryStatus enum` واستخدم soft delete عبر `deletedAt` field.
- **أبسط حل بدون تغيير schema:** أضف guard يمنع حذف القيود المرحّلة (POSTED):
```typescript
if (entry.status === "POSTED") {
  throw new ORPCError("BAD_REQUEST", { 
    message: "لا يمكن حذف قيد مرحّل — استخدم عملية العكس بدلاً من ذلك" 
  });
}
```

### 4b: CostStudy delete protection (#43)
في procedure حذف دراسة التكلفة:
```bash
grep -rn "delete\|destroy" packages/api/modules/quantities/procedures/*.ts | grep -i "study\|cost"
```
- أضف confirmation check:
```typescript
// عند حذف دراسة تكلفة، تحقق من وجود عناصر مرتبطة
const itemCount = await db.costStudyItem.count({ where: { costStudyId: id } });
if (itemCount > 0 && !input.confirmDelete) {
  throw new ORPCError("BAD_REQUEST", {
    message: `هذه الدراسة تحتوي على ${itemCount} عنصر. أرسل confirmDelete: true للتأكيد`
  });
}
```

### 4c: SubcontractContract delete protection (#44)
```bash
grep -rn "delete" packages/api/modules/subcontracts/procedures/*.ts | grep -i "contract"
```
- أضف guard يمنع حذف العقود التي لها مطالبات أو مدفوعات:
```typescript
const hasPayments = await db.subcontractPayment.count({ where: { contractId: id } });
const hasClaims = await db.subcontractClaim.count({ where: { contractId: id } });
if (hasPayments > 0 || hasClaims > 0) {
  throw new ORPCError("BAD_REQUEST", {
    message: "لا يمكن حذف عقد له مطالبات أو مدفوعات"
  });
}
```

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -E "journal|quantities|subcontracts" | head -20
```

---

## المرحلة 5: Bank Chart Account Atomicity (مشكلة #34)

**المشكلة:** قد يُنشأ البنك بدون حساب محاسبي مرتبط.

**المطلوب:**

1. اقرأ:
```bash
grep -n "createBank\|bank.*create" packages/api/modules/finance/procedures/banks.ts
```

2. لف عملية إنشاء البنك + الحساب المحاسبي في transaction واحدة:
```typescript
const result = await db.$transaction(async (tx) => {
  // 1. إنشاء البنك
  const bank = await tx.bank.create({ data: bankData });
  
  // 2. إنشاء الحساب المحاسبي
  const chartAccount = await tx.chartAccount.create({
    data: {
      organizationId,
      code: `1100-${bank.id.slice(0, 4)}`,
      nameAr: `بنك - ${bank.name}`,
      nameEn: `Bank - ${bank.name}`,
      type: "ASSET",
      parentId: cashAndBanksParentId,
      isPostable: true,
      bankId: bank.id,
    }
  });
  
  return { bank, chartAccount };
});
```

3. **ملاحظة:** هذا يعني أنه لو فشل إنشاء الحساب المحاسبي، يُلغى إنشاء البنك أيضاً. أزل الـ try-catch القديم حول إنشاء الحساب واجعلها تفشل atomically.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "banks" | head -10
```

---

## المرحلة 6: Expense Category Fallback + Contract Dates (مشاكل #33, #70)

### 6a: Custom expense category fallback (#33)
**المشكلة:** المصروفات بفئة مخصصة تسقط على حساب 6900 (Other) بدون validation.

```bash
grep -n "6900\|Other\|fallback\|default.*account" packages/api/lib/accounting/auto-journal.ts
grep -n "category\|expenseType" packages/api/modules/finance/procedures/expenses.ts
```

- عند إنشاء مصروف بفئة مخصصة، أضف validation:
```typescript
if (expense.category === "CUSTOM" || expense.category === "OTHER") {
  // سجّل في audit log أن المصروف استخدم الحساب الافتراضي
  orgAuditLog({
    organizationId,
    actorId: userId,
    action: "EXPENSE_DEFAULT_ACCOUNT_USED",
    entityType: "expense",
    entityId: expense.id,
    metadata: { category: expense.category, accountCode: "6900" },
  });
}
```

### 6b: Contract dates validation (#70)
```bash
grep -rn "startDate\|endDate\|contractDate" packages/api/modules/subcontracts/ --include="*.ts" | head -20
grep -rn "startDate\|endDate" packages/api/modules/projects/procedures/create*.ts
```

- أضف validation في create/update contracts:
```typescript
if (input.endDate && new Date(input.startDate) > new Date(input.endDate)) {
  throw new ORPCError("BAD_REQUEST", {
    message: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية"
  });
}
```

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -E "expense|subcontract|project" | head -20
```

---

## المرحلة 7: Audit Logging + Reconciliation (مشاكل #69, #78)

### 7a: Audit logging for project creation (#69)
```bash
grep -n "create" packages/api/modules/projects/procedures/create*.ts
grep -n "orgAuditLog" packages/api/modules/projects/procedures/create*.ts
```

- أضف `orgAuditLog` بعد إنشاء المشروع:
```typescript
orgAuditLog({
  organizationId,
  actorId: context.user.id,
  action: "PROJECT_CREATED",
  entityType: "project",
  entityId: project.id,
  metadata: { name: project.name, projectNo: project.projectNo },
});
```

- تأكد أن `PROJECT_CREATED` موجود في `OrgAuditAction` enum. إذا لا:
```bash
grep -n "PROJECT_CREATED\|OrgAuditAction" packages/database/prisma/schema/*.prisma
```
أضفه.

### 7b: Invoice-Journal reconciliation endpoint (#78)
**المشكلة:** لا آلية للمقارنة بين مجاميع الفواتير والقيود المحاسبية.

- أضف procedure جديد في `packages/api/modules/accounting/procedures/health.ts`:
```typescript
export const reconcileInvoiceJournals = protectedProcedure
  .input(z.object({ organizationId: z.string() }))
  .handler(async ({ input, context }) => {
    const organizationId = input.organizationId;
    
    // 1. مجموع الفواتير الصادرة
    const invoiceTotal = await db.financeInvoice.aggregate({
      where: { organizationId, status: "ISSUED" },
      _sum: { totalAmount: true },
    });
    
    // 2. مجموع القيود المحاسبية المرتبطة بالفواتير
    const journalTotal = await db.journalEntry.aggregate({
      where: { 
        organizationId, 
        referenceType: "INVOICE",
        status: "POSTED",
      },
      _sum: { totalDebit: true },
    });
    
    // 3. العناصر غير المتطابقة
    const unmatched = await db.$queryRaw`
      SELECT fi.id, fi."invoiceNo", fi."totalAmount"
      FROM "FinanceInvoice" fi
      WHERE fi."organizationId" = ${organizationId}
        AND fi.status = 'ISSUED'
        AND NOT EXISTS (
          SELECT 1 FROM "JournalEntry" je
          WHERE je."referenceId" = fi.id
            AND je."referenceType" = 'INVOICE'
            AND je.status = 'POSTED'
        )
    `;
    
    return {
      invoiceTotal: invoiceTotal._sum.totalAmount,
      journalTotal: journalTotal._sum.totalDebit,
      unmatchedInvoices: unmatched,
      isReconciled: unmatched.length === 0,
    };
  });
```

- سجّله في router المناسب.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -E "health|accounting" | head -10
```

---

## المرحلة 8: Remaining Business Logic Fixes (مشاكل #31, #71, #72, #94)

### 8a: Cycle detection on edit (#31)
```bash
grep -rn "cycle\|dependency\|predecessor" packages/api/modules/project-timeline/ --include="*.ts"
```
- ابحث عن دالة cycle detection وتأكد أنها تُستدعى عند update وليس فقط create.

### 8b: CPM float negative values (#71)
```bash
grep -rn "float\|slack\|criticalPath" packages/api/modules/project-execution/ --include="*.ts"
```
- أضف `Math.max(0, float)` لمنع القيم السالبة:
```typescript
const totalFloat = Math.max(0, lateStart - earlyStart);
```

### 8c: Copy subcontract items validation (#72)
```bash
grep -rn "copy\|duplicate\|clone" packages/api/modules/subcontracts/ --include="*.ts"
```
- عند نسخ عناصر العقد، تحقق من التوافق مع العقد الجديد (نفس النوع، العملة، إلخ).

### 8d: Invitation role mapping confirmation (#94)
```bash
grep -rn "ADMIN.*OWNER\|role.*mapping\|invitation.*role" packages/auth/ --include="*.ts"
grep -rn "acceptInvitation\|accept-invitation" packages/auth/ --include="*.ts"
```
- راجع الـ mapping: هل ADMIN→OWNER مقصود؟ إذا نعم، أضف تعليق يوثق ذلك. إذا لا، صححه.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -E "timeline|execution|subcontracts|auth" | head -20
```

---

## التحقق النهائي

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

---

## ملخص المشاكل المعالجة في هذا البرومبت

| # | المشكلة | الشدة |
|---|---------|-------|
| 25 | Change order workflow enforcement | 🟠 High |
| 26 | Leave balance check | 🟠 High |
| 27 | issueDate ≤ dueDate | 🟠 High |
| 28 | Credit note Decimal precision | 🟠 High |
| 31 | Cycle detection on edit | 🟠 High |
| 33 | Custom expense category fallback | 🟠 High |
| 34 | Bank chart account atomicity | 🟠 High |
| 42 | JournalEntry hard delete | 🟡 Medium |
| 43 | CostStudy cascade | 🟡 Medium |
| 44 | SubcontractContract cascade | 🟡 Medium |
| 69 | Audit logging project creation | 🟡 Medium |
| 70 | Contract dates validation | 🟡 Medium |
| 71 | CPM float negative | 🟡 Medium |
| 72 | Copy subcontract items validation | 🟡 Medium |
| 78 | Invoice-journal reconciliation | 🟡 Medium |
| 94 | Invitation role mapping (complete) | 🟡 Medium |
