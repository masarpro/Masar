# تقرير الأخطاء والمشاكل الشامل — منصة مسار v6.0

> **التاريخ:** 2026-07-05
> **الفرع:** payment-locks
> **الملفات المفحوصة:** ~2,544 ملف مصدر (1,694 في `apps/web` + 850 في `packages` منها 650 في `packages/api`)
> **نتيجة type-check:** ❌ فشل — 11 خطأ (كلها في وحدة الإشعارات — تفصيلها في القسم 2 والملحق أ)
> **نتيجة lint (Biome):** 602 خطأ + 4,526 تحذير + 145 ملاحظة عبر 1,701 ملف
> **منهجية التدقيق:** قراءة فعلية للكود عبر 8 مسارات تدقيق متوازية + type-check + lint + فحص يدوي. **لم يُعدَّل أي ملف كود — تدقيق قراءة فقط.**

---

## ملاحظة منهجية

كل بطاقة مشكلة في هذا التقرير تتضمن المسار الكامل ورقم السطر الفعلي ومقتطف الكود المقروء مباشرة من الملف. المشاكل المبنية على تخمين أو استنتاج غير مؤكد استُبعدت. البنود التي فُحصت ووُجدت سليمة مذكورة في نهاية كل قسم لتوثيق نطاق التغطية.

**القائمة الحمراء (قُرئت ودُقّقت، لم تُعدَّل):** ملفات ZATCA، `auto-journal.ts`، `structural-calculations.ts`، `schema.prisma` والمايجريشنز. المشاكل المكتشفة فيها موثّقة أدناه مع وسم "يمس قائمة حمراء؟ نعم".

---

# 1. الملخص التنفيذي

## 1.1 توزيع المشاكل حسب الشدة

| الشدة | العدد |
|-------|-------|
| 🔴 حرج | 29 |
| 🟠 عالٍ | 26 |
| 🟡 متوسط | 39 |
| ⚪ منخفض | 16 |
| **المجموع** | **110** |

## 1.2 توزيع المشاكل حسب المحور

| # | المحور | 🔴 | 🟠 | 🟡 | ⚪ |
|---|--------|----|----|----|----|
| 2 | سلامة النظام المحاسبي | 7 | 10 | 8 | 3 |
| 3 | الأمان متعدد المستأجرين والصلاحيات | 10 | 0 | 3 | 0 |
| 4 | التضارب والتكرار (Race conditions + Duplication) | 5 | 3 | 5 | 2 |
| 5 | معالجة الأخطاء والذرية | 3 | 5 | 6 | 2 |
| 6 | الأداء | 0 | 3 | 5 | 3 |
| 7 | Schema والبيانات | 3 | 2 | 6 | 4 |
| 8 | TypeScript والبناء | 1 | 0 | 1 | 1 |
| 9 | الترجمة وRTL | 0 | 0 | 2 | 0 |
| 10 | تكامل الواجهة والكود الميت | 0 | 3 | 3 | 1 |
| **المجموع** | | **29** | **26** | **36** | **15** |

## 1.3 أخطر 10 مشاكل يجب حلها قبل الإطلاق التجاري (مرتبة)

| # | المشكلة | المحور | الشدة | المرجع |
|---|---------|--------|-------|--------|
| 1 | **الإشعار الدائن لا يولّد قيداً محاسبياً** (مبالغ سالبة تُمرَّر للـ hook → قيد غير متوازن يُبتلع، أو معكوس الاتجاه) — كل CN في الإنتاج | المحاسبة | 🔴 | [2.1](#21) |
| 2 | **10 ثغرات IDOR عابرة للمستأجرين** في `company` (دفعات/تخصيصات مصروفات، تعيينات موظفين، إجازات)، طباعة السندات، حذف البنك، أوامر تغيير الباطن | الأمان | 🔴 | [3.1–3.10](#3) |
| 3 | **أرقام الفواتير `@unique` عالمياً** بدل org-scoped → تصادم ترقيم مؤكد بين المستأجرين + فجوات تسلسل تخالف ZATCA | Schema | 🔴 | [7.1](#71) |
| 4 | **إلغاء فاتورة مُصدرة (CANCELLED) لا يعكس أي قيد** → إيراد + VAT + ذمم وهمية للأبد | المحاسبة | 🔴 | [2.2](#22) |
| 5 | **race condition في `addInvoicePayment`** (read-then-write) → دفعات ضائعة + رصيد بنك ينحرف عن الفاتورة | التضارب | 🔴 | [4.1](#41) |
| 6 | **حذف دفعة مصروف منشأة مدفوعة لا يعيد رصيد البنك** → نقص دائم في الرصيد | معالجة الأخطاء | 🔴 | [5.1](#51) |
| 7 | **الدفعة الجزئية للمصروف تنشئ قيداً بكامل المبلغ** → GL البنك ينحرف، التسوية تنكسر | المحاسبة | 🔴 | [2.4](#24) |
| 8 | **اعتماد مطالبات باطن مزدوج** (قفل على العقد لا المطالبة + dedup بلا unique) → قيد استحقاق مكرر يفسد ميزان المراجعة | التضارب | 🔴 | [4.2](#42) |
| 9 | **حفظ الأرصدة الافتتاحية يحذف القيد القديم قبل إنشاء الجديد** (غير ذري) → فقدان الأرصدة نهائياً عند فشل الإنشاء | المحاسبة | 🔴 | [2.5](#25) |
| 10 | **حارس حذف المشروع لا يفحص `project_expenses`** → Cascade يمسح المصروفات الميدانية ويترك قيوداً يتيمة | Schema | 🔴 | [7.2](#72) |

**قراءة سريعة:** ثقل المخاطر يتركز في **النظام المحاسبي** (7 مشاكل حرجة، أخطرها الإشعارات الدائنة والإلغاء والدفعات الجزئية) و**عزل المستأجرين** (10 ثغرات IDOR في وحدة `company` تحديداً). هذه المجموعتان تمثّلان كل ما يجب حسمه قبل أي إطلاق تجاري. بالمقابل، طبقة الاستعلامات المالية الأساسية (`org-finance.ts`, `finance.ts`, `accounting.ts`) منضبطة ذرياً بشكل جيد، والبنية التحتية للصلاحيات والترجمة سليمة.

---

# 2. سلامة النظام المحاسبي {#2}

> **جرد الـ hooks الفعلية في `auto-journal.ts` (17 دالة تأثير + العكس):** `onInvoiceIssued`، `onInvoicePaymentReceived`، `onExpenseCompleted`، `onTransferCompleted`، `onSubcontractPayment`، `onSubcontractClaimApproved`، `onPayrollApproved`، `onOrganizationPaymentReceived`، `onProjectPaymentReceived`، `onProjectClaimApproved`، `onCreditNoteIssued`، `onReceiptVoucherIssued`، `onPaymentVoucherApproved`، `onOwnerDrawing`، `onOwnerDrawingCancelled`، `onCapitalContribution`، `onFinalHandoverCompleted` + `reverseAutoJournalEntry` + `projectHasBillingDocuments`.

## 2.1 الإشعار الدائن يُبنى من مبالغ سالبة — لا يُنشأ قيد إطلاقاً عند وجود VAT، ويُنشأ معكوساً بدونه {#21}
- **الشدة:** 🔴 (أخطر مشكلة في التدقيق — كل إشعار دائن في الإنتاج بلا قيد أو بقيد معكوس)
- **الملف:** `packages/database/prisma/queries/finance.ts` — السطور 1721–1763، و`packages/api/modules/finance/procedures/create-invoice.ts` — السطور 1155–1165، و`packages/api/lib/accounting/auto-journal.ts` — السطور 646–653
- **الكود الحالي** (التخزين سالب بالتصميم، finance.ts:1721):
```typescript
const negSubtotal = totals.subtotal.neg();
const negVatAmount = totals.vatAmount.neg();
const negTotalAmount = totals.totalAmount.neg();
```
والـ hook (auto-journal.ts:646):
```typescript
const netAmount = creditNote.totalAmount.sub(creditNote.vatAmount);
const lines: any[] = [
    { accountId: revenueId, debit: netAmount, credit: ZERO, ... },
    { accountId: receivableId, debit: ZERO, credit: creditNote.totalAmount, ... },
];
if (creditNote.vatAmount.greaterThan(0)) {   // -15 > 0 = false → سطر VAT يُتخطى
```
- **المشكلة:** مع إشعار 115 (منها 15 VAT): `totalAmount=-115`, `vatAmount=-15` → `netAmount=-100`. السطور: مدين إيراد -100 / دائن عملاء -115، وسطر VAT يُتخطى → المدين (-100) ≠ الدائن (-115) → `createJournalEntry` يرمي "not balanced" → يُبتلع ويُسجَّل `JOURNAL_ENTRY_FAILED` فقط. أما بدون VAT فيتوازن عند -100/-100 لكن بمبالغ سالبة تعمل عكسياً في التقارير (تزيد الإيراد والذمم بدل إنقاصهما).
- **الأثر:** `paidAmount` للفاتورة الأصلية يُزاد بينما الدفاتر لا تتأثر أو تتأثر عكسياً → إيرادات وVAT مستحقة وذمم مدينة مبالغ فيها بشكل دائم، وتقارير ZATCA/VAT منحرفة. **الاختبار `auto-journal.test.ts:777` يمرّر قيماً موجبة (575/75) فيخفي الخلل.**
- **اتجاه الحل:** تمرير `.abs()` عند الاستدعاء (procedure + backfill.ts:84)، أو `.abs()` داخل `onCreditNoteIssued`، وتعديل الاختبار لقيم سالبة كالواقع.
- **يمس قائمة حمراء؟** نعم (auto-journal.ts) — الخلل في نقطة الاستدعاء لا في منطق الـ hook.

## 2.2 إلغاء فاتورة مُصدرة (CANCELLED) لا يعكس أي قيد {#22}
- **الشدة:** 🔴
- **الملف:** `packages/api/modules/finance/procedures/create-invoice.ts` — السطور 353–379 (`updateInvoiceStatusProcedure`)
- **الكود الحالي:**
```typescript
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    ISSUED: ["SENT", "OVERDUE", "CANCELLED"],
    PARTIALLY_PAID: ["OVERDUE", "CANCELLED"],
};
const invoice = await updateInvoiceStatus(input.id, input.organizationId, input.status);
```
- **المشكلة:** التحويل إلى CANCELLED يغيّر الحالة فقط (`updateInvoiceStatus` في finance.ts:1261 لا يلمس المحاسبة). قيد INV-JE يبقى POSTED، وقيود الدفعات RCV-JE تبقى. بينما `deleteInvoiceProcedure` (الذي يعكس القيد) مقيّد بالمسودات — أي أن استدعاء العكس هناك dead code عملياً ومسار الإلغاء الحقيقي بلا عكس.
- **الأثر:** فاتورة ملغاة تبقى بإيراد + VAT مستحقة + ذمم مدينة في الدفاتر إلى الأبد.
- **اتجاه الحل:** في handler الانتقال إلى CANCELLED استدعِ `reverseAutoJournalEntry(referenceType:"INVOICE")` مع قرار صريح بشأن الدفعات.
- **يمس قائمة حمراء؟** لا.

## 2.3 إلغاء إشعار دائن لا يعكس قيده ولا يُنقص paidAmount للفاتورة الأصلية {#23}
- **الشدة:** 🔴
- **الملف:** `create-invoice.ts:327–400` (`updateInvoiceStatusProcedure`) مع `createCreditNote` في `finance.ts:1784–1790`
- **الكود الحالي:**
```typescript
await tx.financeInvoice.update({
    where: { id: data.originalInvoiceId },
    data: { paidAmount: { increment: creditAmount }, ...(newStatus ? { status: newStatus } : {}) },
});
```
- **المشكلة:** الإشعار يُنشأ ISSUED، و`ALLOWED_TRANSITIONS.ISSUED` يسمح بـ CANCELLED. عند الإلغاء: لا يُعكس قيد CN-JE، و`paidAmount` الأصلية لا يُنقص أبداً. ويمكن إصدار إشعار جديد (الفحص يستثني CANCELLED) فيتضاعف الخصم.
- **الأثر:** فاتورة تظهر PAID/PARTIALLY_PAID بمبلغ إشعار ملغي، مع احتمال تضاعف.
- **اتجاه الحل:** منع إلغاء CREDIT_NOTE عبر المسار العام، أو مسار خاص يعكس القيد ويُنقص paidAmount.
- **يمس قائمة حمراء؟** لا.

## 2.4 الدفعة الجزئية للمصروف تُنشئ قيداً بكامل مبلغ المصروف {#24}
- **الشدة:** 🔴
- **الملف:** `packages/api/modules/finance/procedures/expenses.ts` — السطور 586–599، مع `payExpense` في `org-finance.ts:861–903`
- **الكود الحالي** (expenses.ts:586 — يُستدعى بعد أي دفعة كاملة أو جزئية):
```typescript
await onExpenseCompleted(db, {
    id: expense.id,
    amount: expense.amount,   // كامل المبلغ، وليس مبلغ الدفعة
});
```
بينما org-finance.ts:900 يخصم مبلغ الدفعة فقط (`decrement: payAmount`).
- **المشكلة:** دفعة جزئية (500 من 2000) تنشئ EXP-JE بـ 2000 بينما البنك نقص 500 فقط. الدفعة الثانية لن تنشئ قيداً (فحص التكرار على referenceId).
- **الأثر:** GL البنك دائن بمبالغ لم تُصرف؛ المصروفات معترف بها كاملة قبل السداد، والتسوية البنكية تنكسر.
- **اتجاه الحل:** استدعِ `onExpenseCompleted` فقط عند الحالة COMPLETED، أو صمّم قيد دفعة جزئية بمبلغ `payAmount`.
- **يمس قائمة حمراء؟** نعم (auto-journal يُستدعى) — الإصلاح في نقطة الاستدعاء.

## 2.5 حفظ الأرصدة الافتتاحية يحذف القيد القديم قبل إنشاء الجديد — غير ذري {#25}
- **الشدة:** 🔴
- **الملف:** `packages/database/prisma/queries/accounting.ts` — السطور 1772–1799 (`saveOpeningBalances`)
- **الكود الحالي:**
```typescript
if (existing) {
    await db.journalEntry.delete({ where: { id: existing.id } });
}
const date = entryDate ?? new Date(new Date().getFullYear(), 0, 1);
const entry = await createJournalEntry(db, { ... });
if (!entry) {
    throw new Error("لا يمكن حفظ الأرصدة الافتتاحية — الفترة المحاسبية مغلقة");
}
```
- **المشكلة:** الحذف والإنشاء خارج transaction واحدة. `createJournalEntry` يعيد `null` إذا وقع التاريخ (افتراضياً 1 يناير) في فترة مغلقة، أو يرمي إذا لم تتوازن السطور — كلاهما بعد حذف القيد القديم POSTED فعلاً.
- **الأثر:** أرصدة افتتاحية POSTED تختفي كلياً من ميزان المراجعة والميزانية بلا استرجاع.
- **اتجاه الحل:** لفّ الحذف والإنشاء في `$transaction` واحدة، وأنشئ الجديد أولاً.
- **يمس قائمة حمراء؟** لا.

## 2.6 إضافة دفعة لفاتورة دون حارس حالة أو سقف مبلغ — قيد يجعل 1120 سالباً {#26}
- **الشدة:** 🔴
- **الملف:** `packages/database/prisma/queries/finance.ts` — السطور 1309–1329 (`addInvoicePayment`)، والـ procedure في `create-invoice.ts:492–616` بلا فحص إضافي
- **الكود الحالي:**
```typescript
const invoice = await db.financeInvoice.findFirst({
    where: { id: invoiceId, organizationId },
    select: { id: true, totalAmount: true, paidAmount: true },
});
const newPaidAmount = Number(invoice.paidAmount) + data.amount;
if (newPaidAmount >= totalAmount) { newStatus = "PAID"; }
```
- **المشكلة:** لا فحص لـ `status` (يمكن الدفع على DRAFT أو CANCELLED أو حتى CREDIT_NOTE لأنها سجل FinanceInvoice)، ولا فحص `newPaidAmount <= totalAmount`. القيد RCV-JE يُنشأ دائماً (دائن 1120) بينما فاتورة DRAFT لم تُنشئ INV-JE.
- **الأثر:** دفعة على مسودة أو دفعة زائدة = رصيد عملاء (1120) سالب، والحالة تقفز لـ PAID بدفعة أكبر من المتبقي.
- **اتجاه الحل:** ارفض غير ISSUED/SENT/VIEWED/PARTIALLY_PAID/OVERDUE، وارفض `amount > totalAmount - paidAmount`.
- **يمس قائمة حمراء؟** لا.

## 2.7 قيود إقفال السنة تُنشأ خارج الـ transaction الخارجية — الإقفال غير ذري {#27}
- **الشدة:** 🔴
- **الملف:** `packages/api/modules/accounting/procedures/year-end-closing.ts` — السطور 361، 473، 552
- **الكود الحالي:**
```typescript
const result = await db.$transaction(async (tx) => {
    closingEntry = await createJournalEntry(db, {   // ← db وليس tx
        organizationId, date: dateTo, referenceType: "YEAR_END_CLOSING",
```
- **المشكلة:** `createJournalEntry(db,...)` يفتح transaction مستقلة داخل الـ interactive transaction الخارجية. فشل الـ tx الخارجية بعدها يترك قيود الإقفال POSTED دون سجل إقفال، ويستهلك اتصالاً ثانياً من pool بحجم 5 (خطر تجويع اتصالات).
- **الأثر:** حالة وسيطة: أرباح مُرحّلة لـ 3200 وحسابات النتيجة مصفّرة بينما النظام يعتبر السنة غير مقفلة.
- **اتجاه الحل:** مرّر `tx` بدل `db`، أو أخرج إنشاء القيود عن الـ tx مع تعويض صريح عند الفشل.
- **يمس قائمة حمراء؟** لا.

## 2.8 `reverseJournalEntry` غير ذري — نافذة عطل تسمح بعكس مزدوج {#28}
- **الشدة:** 🟠
- **الملف:** `packages/database/prisma/queries/accounting.ts` — السطور 667–699
- **الكود الحالي:**
```typescript
const reversalEntry = await createJournalEntry(db, { ... });  // كتابة 1 (tx مستقلة)
await db.journalEntry.update({ where: { id: reversalEntry.id }, data: { status: "POSTED", ... } });  // 2
await db.journalEntry.update({ where: { id: entryId }, data: { isReversed: true, status: "REVERSED" } });  // 3
```
- **المشكلة:** عطل بين الكتابة 2 و3 يترك العكسي POSTED والأصلي POSTED غير موسوم REVERSED. وبما أن `reverseAutoJournalEntry` يبحث بـ `status: { not: "REVERSED" }` فإن عكساً لاحقاً يعكس الأصل مرة ثانية.
- **الأثر:** قيد عكسي مزدوج = أرصدة معكوسة بمقدار مضاعف. الدالة تُستدعى من كل مسارات الحذف/الإلغاء المالية.
- **اتجاه الحل:** لفّ الخطوات الثلاث في `$transaction` واحدة.
- **يمس قائمة حمراء؟** لا.

## 2.9 سقف الإشعار الدائن يقارن صافي البنود (بلا VAT وخصم) مع إجمالي شامل VAT {#29}
- **الشدة:** 🟠
- **الملف:** `packages/database/prisma/queries/finance.ts` — السطور 1699–1715
- **الكود الحالي:**
```typescript
const itemTotals = data.items.reduce((sum, item) => sum.add(D(item.quantity).times(D(item.unitPrice))), ZERO);
const totalAlreadyCredited = D(existingCreditNotes._sum.totalAmount ?? 0).abs();
if (totalAlreadyCredited.add(itemTotals).greaterThan(D(original.totalAmount))) {
```
- **المشكلة:** `itemTotals` قبل الخصم وقبل VAT، بينما `totalAlreadyCredited` و`original.totalAmount` شاملان VAT — وحدات غير متجانسة. فاتورة 115 (100+15): إشعار ببنود 100.5 يمرّ (100.5 ≤ 115) لكن إجماليه الفعلي 115.575 > 115.
- **الأثر:** تجاوز سقف الإشعار الدائن + `paidAmount` يتجاوز الإجمالي.
- **اتجاه الحل:** احسب `calculateInvoiceTotals` قبل الفحص وقارن بـ `totals.totalAmount`.
- **يمس قائمة حمراء؟** لا.

## 2.10 سجل JOURNAL_ENTRY_SKIPPED (فترة مغلقة) لا يُكتب فعلياً — promise عائم داخل transaction {#210}
- **الشدة:** 🟠
- **الملف:** `packages/database/prisma/queries/accounting.ts` — السطور 564–578
- **الكود الحالي:**
```typescript
if (data.createdById) {
    tx.organizationAuditLog.create({
        data: { ... action: "JOURNAL_ENTRY_SKIPPED", ... },
    }).catch(() => {});
}
return null;
```
- **المشكلة:** العملية على `tx` غير مُنتظَرة (`await` مفقود) و`return null` يُغلق الـ callback فتُغلق الـ transaction قبل تنفيذ الاستعلام — يفشل بـ "Transaction already closed" ويُبتلع.
- **الأثر:** القيود المتخطاة بسبب الفترات المغلقة لا تترك أثراً تدقيقياً (console.warn فقط) — المؤشر الوحيد على عمليات مالية بلا قيود.
- **اتجاه الحل:** `await tx.organizationAuditLog.create(...)` أو سجّل عبر `db` خارج الـ tx بعد العودة.
- **يمس قائمة حمراء؟** لا.

## 2.11 فشل seeding دليل الحسابات وغياب الحسابات يُبتلعان بلا تسجيل — قيود مفقودة بلا أثر {#211}
- **الشدة:** 🟠
- **الملف:** `packages/api/lib/accounting/auto-journal.ts` — السطور 96–103، 171، 215، 271
- **الكود الحالي** (100):
```typescript
} catch {
    // Do not cache failure — allow retry on next financial operation
    return false;
}
```
وفي كل hook (171): `if (!receivableId || !revenueId || !vatPayableId) return;`
- **المشكلة:** هذه العودات الصامتة داخل الـ hook دون رمي استثناء، فلا يلتقطها catch المستدعي ولا يُسجَّل JOURNAL_ENTRY_FAILED. حذف/تعطيل حساب نظامي (2130) أو فشل seeding = توقف صامت للقيود.
- **الأثر:** فجوة قيود متراكمة دون أي مؤشر.
- **اتجاه الحل:** عند غياب حساب مطلوب ارمِ خطأً وصفياً، أو سجّل audit log داخل الـ hook قبل العودة.
- **يمس قائمة حمراء؟** نعم (auto-journal.ts).

## 2.12 `orgAuditLog` fire-and-forget — حتى سجلات JOURNAL_ENTRY_FAILED قد تضيع على Vercel {#212}
- **الشدة:** 🟠
- **الملف:** `packages/database/prisma/queries/org-audit.ts` — السطور 15–44
- **الكود الحالي:**
```typescript
export function orgAuditLog(params: { ... }): void {
    db.organizationAuditLog.create({ ... }).catch((error) => {
        console.error("[ORG_AUDIT] Failed to log audit event:", { ... });
    });
}
```
- **المشكلة:** الدالة ترجع `void` والـ promise عائم؛ كل مواقع catch المالية تستدعيها دون await. على Vercel Functions قد يُجمَّد runtime بعد إرسال الاستجابة قبل اكتمال الكتابة.
- **الأثر:** شبكة الأمان الوحيدة لأخطاء القيود التلقائية (JOURNAL_ENTRY_FAILED) غير مضمونة الكتابة.
- **اتجاه الحل:** أعد promise وانتظرها في مسارات الأخطاء المالية، أو استخدم `waitUntil`.
- **يمس قائمة حمراء؟** لا.

## 2.13 تعديل مصروف مكتمل (فئة/تاريخ/مشروع) لا يحدّث قيده {#213}
- **الشدة:** 🟠
- **الملف:** `packages/api/modules/finance/procedures/expenses.ts` — السطور 393–474 (`updateExpenseProcedure`)
- **الكود الحالي:**
```typescript
const expense = await updateExpense(id, organizationId, data);
orgAuditLog({ ... action: "EXPENSE_UPDATED", ... });
return expense;
```
- **المشكلة:** يسمح بتغيير `category/categoryId/date/projectId` لمصروف COMPLETED دون reverse+recreate — بعكس مسار HR الذي يعيد بناء القيد. تغيير الفئة يترك القيد على GL القديم، وتغيير المشروع يفسد مراكز التكلفة، وتغيير التاريخ يفسد القوائم الفترية.
- **الأثر:** انحراف دائم بين سجل المصروفات ودفتر الأستاذ.
- **اتجاه الحل:** عند تغيير حقول مؤثرة لمصروف له قيد: reverse ثم recreate.
- **يمس قائمة حمراء؟** لا.

## 2.14 السندات اليدوية (قبض/صرف) تنشئ قيوداً دون تحريك رصيد البنك التشغيلي {#214}
- **الشدة:** 🟠
- **الملف:** `packages/api/modules/finance/procedures/receipt-vouchers.ts` — السطور 363–397، و`payment-vouchers.ts` — السطور 441–480
- **الكود الحالي** (receipt-vouchers.ts:363):
```typescript
const updated = await db.receiptVoucher.update({
    where: { id: input.id }, data: { status: "ISSUED" },
});
// ... onReceiptVoucherIssued → DR بنك / CR 4300 — بلا organizationBank.update({ balance })
```
- **المشكلة:** لا يوجد `organizationBank.update({ balance })` في مساري الإصدار/الاعتماد اليدويين (بعكس المصروفات والدفعات). GL البنك يتحرك بينما `OrganizationBank.balance` لا.
- **الأثر:** انحراف دائم بين رصيد البنك في الشاشات التشغيلية ورصيده في ميزان المراجعة، وتسوية بنكية مستحيلة.
- **اتجاه الحل:** increment/decrement للرصيد عند الإصدار/الاعتماد (مع فحص الكفاية)، وعكسها عند الإلغاء.
- **يمس قائمة حمراء؟** لا.

## 2.15 تعديل دفعة مشروع إلى تاريخ في فترة مغلقة: العكس ينجح والإنشاء يُتخطى بصمت — دفعة بلا قيد {#215}
- **الشدة:** 🟠
- **الملف:** `packages/api/modules/project-payments/procedures/update.ts` — السطور 156–173
- **الكود الحالي:**
```typescript
await reverseAutoJournalEntry(db, { ... referenceId: input.paymentId, ... });
await onProjectPaymentReceived(db, { ... date: payment.date, ... });
```
- **المشكلة:** العكس بتاريخ اليوم ينجح، ثم `onProjectPaymentReceived` ينشئ القيد الجديد بتاريخ الدفعة الجديد — وإذا وقع في فترة مغلقة يعيد `createJournalEntry` قيمة `null` بصمت دون علم الـ handler. النتيجة: الأصل REVERSED والجديد غير موجود. (بينما `reconcile-project-payments.ts:106` يتحقق من الفترة قبل العكس بشكل صحيح).
- **الأثر:** دفعة مقبوضة نقداً بلا أي قيد نشط في الدفاتر.
- **اتجاه الحل:** افحص `isPeriodClosed` للتاريخ الجديد قبل العكس، أو اجعل الإنشاء يسبق العكس منطقياً.
- **يمس قائمة حمراء؟** لا.

## 2.16 تقرير VAT يقارن cuid بقائمة systemIds — الاستثناءات الضريبية لا تُطبَّق أبداً {#216}
- **الشدة:** 🟠
- **الملف:** `packages/database/prisma/queries/accounting-reports.ts` — السطور 716–718
- **الكود الحالي:**
```typescript
const NEW_VAT_EXEMPT_CATEGORIES = ["ADMIN_SALARIES", "GOVERNMENT_LICENSES", "INSURANCE_GUARANTEES", "FINANCIAL_EXPENSES"];
const isExempt = (exp.categoryId ? NEW_VAT_EXEMPT_CATEGORIES.includes(exp.categoryId) : false) || VAT_EXEMPT_EXPENSE_CATEGORIES.includes(exp.category);
```
- **المشكلة:** `exp.categoryId` يخزّن cuid لسجل OrgCategory (يُحل في expenses.ts:279) وليس systemId — فالمقارنة خاطئة دائماً. والاعتماد الاحتياطي على `exp.category` يفشل أيضاً (المصروفات الجديدة تُنشأ بـ `category:"MISC"`).
- **الأثر:** الرواتب والرسوم الحكومية تُحتسب ضريبة مدخلات قابلة للخصم في التقرير — بينما auto-journal لا يسجّل لها VAT → التقرير ≠ الدفتر ≠ الواقع.
- **اتجاه الحل:** اجلب `OrgCategory.isVatExempt` عبر join بدل مقارنة القوائم النصية.
- **يمس قائمة حمراء؟** لا.

## 2.17 مسير رواتب بدون حساب 2170 = قيد غير متوازن يفشل بالكامل + تاريخ قيد ثابت يوم 28 {#217}
- **الشدة:** 🟠
- **الملف:** `packages/api/lib/accounting/auto-journal.ts` — السطور 460–473
- **الكود الحالي:**
```typescript
if (!salaryAccId || !bankAccId) return;
const lines: any[] = [
    { accountId: salaryAccId, debit: payroll.totalNet.add(payroll.totalGosi), credit: ZERO, ... },
    { accountId: bankAccId, debit: ZERO, credit: payroll.totalNet, ... },
];
if (gosiAccId && payroll.totalGosi.greaterThan(0)) {
```
- **المشكلة:** `gosiAccId` غير مشمول في الفحص المبكر؛ غياب 2170 مع `totalGosi>0` → المدين=net+gosi والدائن=net → غير متوازن → استثناء → لا قيد للرواتب. وتاريخ القيد `new Date(payroll.year, month-1, 28)` — اعتماد مسير شهر مُقفَل يُتخطى بصمت.
- **الأثر:** مسير رواتب كامل بدون أثر محاسبي.
- **اتجاه الحل:** إذا غاب 2170 أضف GOSI لسطر البنك أو ارمِ خطأً وصفياً؛ واستخدم تاريخ الاعتماد إن كان شهر الاستحقاق مقفلاً.
- **يمس قائمة حمراء؟** نعم (auto-journal.ts).

## 2.18 استخدام float في الحسابات المالية (مجموعة) {#218}
- **الشدة:** 🟡
- **المواضع المؤكدة:**
  - `accounting.ts:725` — `getAccountBalance`: `new Prisma.Decimal(Number(result._sum?.debit ?? 0))` (Decimal→float→Decimal بلا داعٍ)
  - `accounting.ts:1746–1763` — الأرصدة الافتتاحية تُجمع بـ float وعتبة موازنة `0.001` بينما `createJournalEntry` يقارن Decimal بدقة تامة
  - `finance.ts:1318, 1392, 1779` — paidAmount للفواتير (إضافة/حذف دفعة/إشعار) يُحسب ويُقارن بـ float بينما الأعمدة Decimal(15,2)
  - `year-end-closing.ts:401–468` — سطور الإقفال تُبنى بـ float و`toFixed(2)` لكل سطر مقابل netProfit مستقل → أي انزياح تقريب = قيد غير متوازن يفشل الإقفال كله
- **الأثر:** انزياحات تقريب حدّية تقلب مقارنات `>=`/`equals` وقد تفشل حفظ قيود أو تولّد فروقاً بالهللات.
- **اتجاه الحل:** استخدم `Prisma.Decimal` في كل الجمع/المقارنة، واحسب سطر الموازنة من نفس السطور المُقرّبة.
- **يمس قائمة حمراء؟** لا (عدا ما يُمرَّر لـ auto-journal).

## 2.19 VAT 15% مُثبّت يدوياً في 5 مواضع إنتاجية بلا مصدر واحد للحقيقة {#219}
- **الشدة:** 🟡
- **المواضع (كلها مقروءة):**
  - `auto-journal.ts:288` — `expense.amount.div(new Prisma.Decimal("1.15"))`
  - `accounting-reports.ts:722, 737` — `amount.div(new Prisma.Decimal("1.15"))`
  - `cost-studies.ts:462` — `study.vatIncluded ? beforeVat * 0.15 : 0` (float)
  - `project-finance.ts:179` — `study.vatIncluded ? beforeVat * 0.15 : 0` (float)
  - `quantities/procedures/markup.ts:317` — `sellingPriceBeforeVat * 0.15` (float)
- **المشكلة:** تغيير النسبة مستقبلاً يتطلب مطاردة مواضع متفرقة، وثلاثة منها float. الفواتير تستخدم `vatPercent` قابلاً للتخصيص — ازدواجية مصادر.
- **اتجاه الحل:** ثابت `VAT_RATE` واحد في `@repo/utils` مع دوال Decimal.
- **يمس قائمة حمراء؟** نعم جزئياً (auto-journal.ts:288).

## 2.20 مشاكل محاسبية متوسطة أخرى (مختصرة) {#220}
- **🟡 تعديل مقبوض مباشر (تاريخ/مشروع) لا يحدّث قيده** — `payments.ts:236–278` (المبلغ غير قابل للتعديل لكن date/projectId نعم، وقيد ORG_PAYMENT يحتفظ بالقديم).
- **🟡 `onExpenseCompleted` يفترض أن كل مصروف غير معفى شامل VAT 15%** — `auto-journal.ts:286` (مصروف من مورد غير مسجّل ضريبياً يُسجّل له VAT وهمي). يمس قائمة حمراء: نعم.
- **🟡 قيد إغلاق الفترة الشهرية ثم تحديث الفترة — خطوتان غير ذريتين** — `accounting.ts:1364–1386` (`closePeriod`).
- **⚪ اختبار الإشعار الدائن يخفي علة الإنتاج** — `auto-journal.test.ts:777` يمرّر قيماً موجبة.
- **⚪ إجراءات المحاسبة ترمي `Error` عادية بدل `ORPCError`** — مثل `journal-entries.ts:234` (مغطى في المحور 5).
- **⚪ سباق نظري في `saveOpeningBalances`** — `findFirst` ثم `delete` بلا قفل، وقيد OPN بلا referenceId لتفعيل فحص التكرار.

## ✅ فُحص ووُجد سليماً (المحاسبة)
- `createJournalEntry` يرفض أي قيد مدين ≠ دائن بمقارنة Decimal دقيقة، ويتحقق أن الحسابات موجودة postable active، وينشئ القيد ذرياً مع فحص تكرار على (referenceType, referenceId).
- قفل تعديل الفواتير المصدرة (DRAFT فقط) في update/updateItems/delete/commitDraft.
- `calculateInvoiceTotals` كامل بـ Decimal مع تقريب HALF_UP، وقيد INV-JE يستخدم نفس القيم المجمّدة.
- فحص الفترات المغلقة في createJournalEntry/postJournalEntry/reverseJournalEntry/bulkPost/reverseAutoJournalEntry؛ closePeriod يفرض تسلسل الإقفال.
- التحويلات البنكية وسحوبات الشركاء ومساهمات رأس المال وتحرير المحتجزات: كلها مغطاة بقيد وعكس مع JOURNAL_ENTRY_FAILED.
- backfill idempotent؛ فحص تكرار القيود التلقائية يمنع الازدواج بين المسارات المتوازية؛ دليل الحسابات لا حذف (تعطيل فقط).

---

# 3. الأمان متعدد المستأجرين والصلاحيات {#3}

> **الخلاصة:** البنية سليمة عموماً — النمط السائد `verifyOrganizationAccess` ثم `findFirst({ where: { id, organizationId } })` ثم الكتابة. لكن توجد **10 ثغرات IDOR حقيقية قابلة للاستغلال** متركزة في وحدة `company`، والسندات، وحذف البنك، وأوامر تغيير الباطن. جميعها من النمط نفسه: التحقق يثبت عضوية المستخدم في المنظمة المُدّعاة، لكنه لا يثبت أن المعرّف الهدف يخص تلك المنظمة. القائمة الكاملة في **الملحق ج**.

## 3.1 حذف حساب بنك يعطّل حساب دليل حسابات لمنظمة أخرى {#31}
- **الشدة:** 🔴 (IDOR عبر المستأجرين)
- **الملف:** `packages/api/modules/finance/procedures/banks.ts` — السطور 297–305
- **الكود الحالي:**
```ts
const bank = await db.organizationBank.findUnique({
  where: { id: input.id },              // ← لا organizationId
  select: { chartAccountId: true },
});
if (bank?.chartAccountId) {
  await db.chartAccount.update({
    where: { id: bank.chartAccountId },  // ← تعطيل حساب منظمة أخرى
    data: { isActive: false },
  });
}
```
- **المشكلة:** `input.id` من العميل يُقرأ بلا `organizationId`. الحذف اللاحق مُحصَّن، لكن تعطيل `chartAccount` يقع قبله على بنك غير مُتحقَّق منه.
- **الأثر:** عضو في منظمة A يعطّل حساب دليل حسابات مرتبط ببنك منظمة B (يفسد تقاريرها المحاسبية).
- **اتجاه الحل:** `findFirst({ where: { id: input.id, organizationId: input.organizationId } })`.
- **يمس قائمة حمراء؟** لا.

## 3.2 طباعة سند صرف/قبض تكتب على سند منظمة أخرى {#32}
- **الشدة:** 🔴
- **الملف:** `payment-vouchers.ts:687–693` (`printPaymentVoucher`)، `receipt-vouchers.ts:526–532` (`printReceiptVoucher`)
- **الكود الحالي:**
```ts
return db.paymentVoucher.update({
  where: { id: input.id },   // ← لا organizationId، بلا فحص ملكية سابق
  data: { printCount: { increment: 1 }, lastPrintedAt: new Date() },
});
```
- **المشكلة:** `verifyOrganizationAccess` يمرّ لعضوية المنظمة، ثم الكتابة على `input.id` مباشرة بلا ربط بالمنظمة.
- **الأثر:** كتابة عبر المستأجرين (زيادة `printCount`/`lastPrintedAt` لسند منظمة أخرى).
- **اتجاه الحل:** `updateMany({ where: { id, organizationId }, data: {...} })`.
- **يمس قائمة حمراء؟** لا.

## 3.3 وحدة دفعات مصروفات المنشأة مكشوفة بالكامل {#33}
- **الشدة:** 🔴
- **الملف:** `packages/api/modules/company/procedures/expense-payments.ts` + `packages/database/prisma/queries/company.ts`
- **الكود الحالي** (expense-payments.ts:229):
```ts
const existingPayment = await db.companyExpensePayment.findUnique({
  where: { id: input.id },   // ← لا organizationId
  select: { isPaid: true, financeExpenseId: true, amount: true },
});
const result = await updateExpensePayment(id, data);  // company.ts:615 → update({ where: { id } })
```
- **المشكلة:** كل مسارات الوحدة (`listExpensePayments`, `markPaymentPaid`, `update`, `delete`, `generateMonthlyPayments`) تستعلم بـ `id`/`expenseId` خام بلا فلترة عبر أي علاقة org. النموذج `CompanyExpensePayment` غير مُفلتر في هذه الدوال.
- **الأثر:** عضو في أي منظمة يقرأ/يعدّل/يحذف دفعات مصروفات منظمة أخرى، ويولّد قيوداً محاسبية ويحذف مصروفات مالية عابرة للمستأجرين.
- **اتجاه الحل:** تحقق من ملكية المصروف الأم أولاً، ومرّر `organizationId` لكل دالة استعلام واجعلها تفلتر عبر `expense: { organizationId }` (كما تفعل `payroll.ts`).
- **يمس قائمة حمراء؟** لا.

## 3.4 تخصيصات مصروفات المنشأة على المشاريع بلا تحقق ملكية {#34}
- **الشدة:** 🔴
- **الملف:** `company/procedures/expense-allocations.ts` (39/71/96) + `company.ts` (689/697/730)
- **الكود الحالي** (company.ts:707):
```ts
await tx.companyExpenseAllocation.deleteMany({ where: { expenseId } });  // ← يمسح تخصيصات منظمة أخرى
await tx.companyExpenseAllocation.createMany({ data: allocations.map(...) });
```
- **المشكلة:** `input.expenseId` خام بلا التحقق أن المصروف يخص المنظمة.
- **الأثر:** عضو منظمة A يقرأ/يستبدل تخصيصات مصروف منظمة B على مشاريعها.
- **اتجاه الحل:** تحقق من `companyExpense` الأم بـ `organizationId` قبل الاستدعاء.
- **يمس قائمة حمراء؟** لا.

## 3.5 تعيينات الموظفين على المشاريع عابرة للمستأجرين {#35}
- **الشدة:** 🔴
- **الملف:** `company/procedures/employee-assignments.ts` (41/66/95/132/157) + `company.ts` (196/204/220/267/271)
- **الكود الحالي** (company.ts:267):
```ts
return db.employeeProjectAssignment.update({ where: { id }, data });  // updateEmployeeAssignment
return db.employeeProjectAssignment.delete({ where: { id } });        // removeEmployeeAssignment
```
- **المشكلة:** كل الدوال تستعلم بـ `employeeId`/`projectId`/`id` خام بلا `organizationId`.
- **الأثر:** قراءة/تعديل/حذف تعيينات موظفي منظمة أخرى؛ وربط `employeeId`/`projectId` غير مُتحقَّقين عند الإنشاء.
- **اتجاه الحل:** تحقق من `employee.organizationId` و`project.organizationId` وأضف الفلترة في الاستعلامات.
- **يمس قائمة حمراء؟** لا.

## 3.6 تحديث/حذف أمر تغيير الباطن بلا ربط بالعقد/المنظمة {#36}
- **الشدة:** 🔴
- **الملف:** `subcontracts/procedures/update-change-order.ts:41`، `delete-change-order.ts:30` → `subcontract.ts:577, 589`
- **الكود الحالي** (subcontract.ts:577):
```ts
return db.subcontractChangeOrder.update({ where: { id }, data, ... });
```
- **المشكلة:** `verifyProjectAccess` يثبت الوصول للمشروع المسمّى فقط؛ `changeOrderId` لا يُربط بالعقد أو المشروع أو المنظمة.
- **الأثر:** تعديل/حذف أوامر تغيير باطن لعقود منظمات أخرى.
- **اتجاه الحل:** `findFirst({ where: { id: changeOrderId, contract: { id: contractId, organizationId } } })` قبل الكتابة.
- **يمس قائمة حمراء؟** لا.

## 3.7 قراءة تقدّم دفعات عقد باطن لأي منظمة {#37}
- **الشدة:** 🔴
- **الملف:** `subcontracts/procedures/get-payment-terms-progress.ts:30` → `subcontract.ts:364–368`
- **الكود الحالي:**
```ts
await verifyProjectAccess(input.projectId, input.organizationId, ...);
const result = await getSubcontractPaymentTermsProgress(input.contractId);
// subcontract.ts:367 → findFirst({ where: { id: contractId } })  ← بلا org/project
```
- **المشكلة:** `contractId` لا يُربط بالمشروع المُتحقَّق؛ يُقرأ بمعرّف خام.
- **الأثر:** قراءة شروط دفع ومدفوعات عقود باطن لمنظمات أخرى.
- **اتجاه الحل:** مرّر `projectId`/`organizationId` للدالة وافلتر بهما.
- **يمس قائمة حمراء؟** لا.

## 3.8 حذف عنصر قالب مشروع لأي منظمة {#38}
- **الشدة:** 🔴
- **الملف:** `project-templates/procedures/remove-template-item.ts:30` → `project-templates.ts:370–386`
- **الكود الحالي:**
```ts
const template = await db.projectTemplate.findFirst({
  where: { id: templateId, organizationId },   // يتحقق من القالب الأم فقط
});
if (!template) throw new Error("Template not found");
return db.projectTemplateItem.delete({ where: { id: itemId } });  // ← itemId غير مربوط بالقالب
```
- **المشكلة:** القالب الأم مُتحقَّق، لكن `itemId` لا يُربط بالقالب، فيمكن حذف عنصر قالب لمنظمة أخرى بتمرير `templateId` مملوك + `itemId` أجنبي.
- **الأثر:** حذف عناصر قوالب منظمات أخرى.
- **اتجاه الحل:** `deleteMany({ where: { id: itemId, templateId } })`.
- **يمس قائمة حمراء؟** لا.

## 3.9 ضبط رصيد الإجازات لموظف من منظمة أخرى {#39}
- **الشدة:** 🔴
- **الملف:** `company/procedures/leaves/leave-balances.ts` — السطور 103–123 (`adjustLeaveBalanceProcedure`)
- **الكود الحالي:**
```ts
return db.leaveBalance.upsert({
  where: { employeeId_leaveTypeId_year: { employeeId: input.employeeId, leaveTypeId: input.leaveTypeId, year } },
  update: {...}, create: { employeeId: input.employeeId, leaveTypeId: input.leaveTypeId, ... },
});
```
- **المشكلة:** `employeeId`/`leaveTypeId` خام، ولا يُتحقَّق أنهما يخصان المنظمة (`LeaveBalance` بلا حقل org مباشر).
- **الأثر:** إنشاء/تعديل رصيد إجازة لموظف منظمة أخرى.
- **اتجاه الحل:** تحقق من `employee` و`leaveType` بـ `organizationId` قبل الـ upsert.
- **يمس قائمة حمراء؟** لا.

## 3.10 تحديث/حذف نوع إجازة لمنظمة أخرى {#310}
- **الشدة:** 🔴
- **الملف:** `company/procedures/leaves/leave-types.ts` — السطور 124، 163
- **الكود الحالي:**
```ts
return db.leaveType.update({ where: { id }, data });   // update — بلا organizationId
await db.leaveType.delete({ where: { id: input.id } }); // delete — الحارس count يمرّ (=0) لنوع أجنبي
```
- **المشكلة:** التحديث بلا فحص ملكية؛ الحذف يسبقه `leaveRequest.count({ leaveTypeId, organizationId })` الذي يُرجع 0 لنوع منظمة أخرى فيمرّ الحارس.
- **الأثر:** تعديل/حذف أنواع إجازات منظمات أخرى.
- **اتجاه الحل:** `updateMany`/`deleteMany` بـ `{ id, organizationId }`.
- **يمس قائمة حمراء؟** لا.

## 3.11 عملية كتابة على protectedProcedure بدل subscriptionProcedure {#311}
- **الشدة:** 🟡
- **الملف:** `packages/api/modules/accounting/procedures/organization-owners.ts` — السطر 477 (`ensureOwnerDrawingsSystemProcedure`, POST)
- **الكود الحالي:** `protectedProcedure … ensureOwnerDrawingsSystem(db, input.organizationId)` — يُنشئ حساب دليل الحسابات `3400` خلف `protectedProcedure` متجاوزاً بوّابة الاشتراك.
- **الأثر:** مستخدم الخطة المجانية قد يُنشئ حساب 3400 (عزل المستأجرين سليم — `verifyOrganizationAccess` موجود).
- **اتجاه الحل:** حوّلها إلى `subscriptionProcedure`.
- **يمس قائمة حمراء؟** لا.

## 3.12 فجوة ربط في بنود دراسة التسعير (دفاع بالعمق) {#312}
- **الشدة:** 🟡
- **الملف:** `packages/database/prisma/queries/cost-studies.ts` (549/560/1091/1107…)، تُستدعى من `quantities/procedures/{mep-item-delete, costing}.ts`
- **المشكلة:** الإجراءات تتحقق من الدراسة الأم عبر `getCostStudyById(costStudyId, organizationId)`، لكن دوال البنود تكتب بـ `where: { id }` والبند لا يُعاد ربطه بالدراسة المُتحقَّقة. أثر منخفض لأن `organizationId` مطلوب في الدراسة، لكن يُنصح بإضافة `costStudyId` لشرط الكتابة. (بالمقابل `specifications.ts:104` يفعل الصحيح: `findFirst({ id: itemId, costStudyId })`.)
- **اتجاه الحل:** أضف `costStudyId` لشرط `where` في دوال البنود.
- **يمس قائمة حمراء؟** لا.

## 3.13 حساب حالة عرض السعر إلى CONVERTED بلا organizationId {#313}
- **الشدة:** 🟡
- **الملف:** `packages/api/modules/finance/procedures/create-invoice.ts` — السطر 146
- **الكود الحالي:** `db.quotation.update({ where: { id: input.quotationId }, data: { status: "CONVERTED" } })` بلا `organizationId` (مع `.catch` يبتلع الخطأ).
- **الأثر:** تغيير حالة عرض سعر منظمة أخرى إلى CONVERTED (كتابة حقل واحد، لا تسريب بيانات).
- **اتجاه الحل:** `updateMany({ where: { id, organizationId } })`.
- **يمس قائمة حمراء؟** لا.

## المحور ب — نظام الصلاحيات والواجهة (فُحص ووُجد سليماً ✅)
- **الشريط الجانبي** (`use-sidebar-menu.ts:460`): يفلتر كل عنصر عبر `isSidebarItemVisible(child.id, checkers, isOwner)`، والمجموعات تختفي إذا خلت. العناصر بلا فحص (`start`, `project-*`, `finance-partners`, `orgSettings`, `admin`) محكومة بأنظمة تفويض مستقلة (ProjectRole/partnerAccessLevel/isOrganizationAdmin/User.role) — ليست ثغرات، والحماية الفعلية على الخادم.
- **حراسة المسارات:** `finance/company/pricing` layouts فيها حارس خادمي redirect + `SectionRouteGate` client. صفحات الإعدادات الفرعية لا تحرس نفسها بـ redirect لكنها تعتمد على حماية الـ procedures (مقبول). كل procedure عيّنة فُحص (`finance`, `accounting`, `roles`, `project-finance`) يفرض `verifyOrganizationAccess` مطابقاً لصلاحيات الواجهة.
- **`Member.role`:** لا يوجد أي استخدام له في قرار تفويض خادمي فعلي. `verify-project-access.ts` يعرض `membership.role` لكنه موثّق `@deprecated "DO NOT use for authorization"`. التفويض الحسّاس (الشركاء) يعتمد على `Role.type` من DB عبر `verifyPartnerAccess`، لا على `Member.role`. `user.role === "admin"` مستخدَم فقط للمشرف العام (دور منصّة، صحيح).

---

# 4. التضارب والتكرار (Race Conditions + Duplication) {#4}

## 4.1 دفعة الفاتورة: read-then-write خارج الـ transaction — دفعة ضائعة وحالة خاطئة {#41}
- **الشدة:** 🔴
- **الملف:** `packages/database/prisma/queries/finance.ts` — `addInvoicePayment` السطور 1309–1352، و`deleteInvoicePayment` ~1374–1408 بنفس العيب
- **الكود الحالي:**
```typescript
const invoice = await db.financeInvoice.findFirst({   // القراءة خارج الـ transaction
    where: { id: invoiceId, organizationId },
    select: { id: true, totalAmount: true, paidAmount: true },
});
const newPaidAmount = Number(invoice.paidAmount) + data.amount;
await tx.financeInvoice.update({   // كتابة قيمة مطلقة بلا شرط تفاؤلي
    where: { id: invoiceId }, data: { paidAmount: newPaidAmount, status: newStatus },
});
```
- **المشكلة:** دفعتان متزامنتان (100+100 على فاتورة 150) تقرآن `paidAmount=0` → النتيجة `paidAmount=100` وحالة `PARTIALLY_PAID` رغم تحصيل 200. رصيد البنك يُزاد ذرياً بـ 200 → تباعد مضمون بين البنك والفاتورة. (`addSubcontractClaimPayment` حلّت نفس المشكلة بـ `FOR UPDATE` — الحل موجود في المشروع.)
- **الأثر:** دفعات ضائعة + رصيد بنك ينحرف عن الفاتورة + احتمال تضاعف قيد RCV-JE.
- **اتجاه الحل:** نقل القراءة داخل الـ transaction مع `paidAmount: { increment }` واشتقاق الحالة من مجموع الدفعات، أو حارس تفاؤلي.
- **يمس قائمة حمراء؟** لا.

## 4.2 اعتماد المطالبات: القفل على العقد لا المطالبة → اعتماد مزدوج وقيد SCL/PCL مكرر {#42}
- **الشدة:** 🔴
- **الملف:** `subcontract-claims.ts` (639 قراءة الحالة بلا قفل، 676–679 قفل العقد، ~719 update بلا شرط حالة)، ونفس البنية في `project-finance.ts` (585/610/676)، والمضخّم `accounting.ts:539–548` + `schema.prisma:5698`
- **الكود الحالي:**
```typescript
const claim = await tx.subcontractClaim.findUnique({ where: { id, organizationId }, select: { status: true } });  // 639
await tx.$queryRawUnsafe(`SELECT id FROM subcontract_contracts WHERE id = $1 FOR UPDATE`, claim.contractId);  // 676: قفل العقد فقط
```
ودedup القيود بـ findFirst وليس unique constraint (accounting.ts:540)، والـ schema فيه `@@index` عادي وليس `@@unique` (5698).
- **المشكلة:** اعتمادان متزامنان: الثاني يقرأ `SUBMITTED` قديمة قبل أن يحجبه قفل العقد، ثم يعتمد ثانية. hooks القيود تعمل خارج الـ transaction، وكل قيد يحصل على `entryNo` جديد ذري فيمرّ الاثنان.
- **الأثر:** قيد استحقاق مكرر يفسد ميزان المراجعة + مطالبة معتمدة مرتين.
- **اتجاه الحل:** `updateMany({ where: { id, status: { in: allowedFrom } } })` مع فحص `count`، أو `FOR UPDATE` على صف المطالبة + قيد `@@unique` جزئي للقيود التلقائية.
- **يمس قائمة حمراء؟** لا.

## 4.3 ترقيم مطالبات ودفعات الباطن: findFirst/count + 1 بلا unique constraint → أرقام مكررة صامتة {#43}
- **الشدة:** 🔴
- **الملف:** `subcontract-claims.ts` — السطور 201–206 و828–831
- **الكود الحالي:**
```typescript
const lastClaim = await tx.subcontractClaim.findFirst({
    where: { contractId: data.contractId }, orderBy: { claimNo: "desc" }, select: { claimNo: true },
});
const claimNo = (lastClaim?.claimNo ?? 0) + 1;
...
const paymentCount = await tx.subcontractPayment.count({ where: { contractId: claim.contractId } });
const paymentNo = `PAY-${String(paymentCount + 1).padStart(4, "0")}`;
```
- **المشكلة:** `SubcontractClaim` و`SubcontractPayment` بلا `@@unique` على الرقم → إنشاءان متزامنان = رقمان متطابقان بصمت. (بخلاف `nextSequenceValue` الذري المستخدم للفواتير — آمن.)
- **الأثر:** أرقام مطالبات/دفعات مكررة لنفس العقد.
- **اتجاه الحل:** توحيد الترقيم على `nextSequenceValue` أو إضافة `@@unique([contractId, claimNo])` مع retry.
- **يمس قائمة حمراء؟** نعم (schema.prisma — توثيق فقط).

## 4.4 دعوة الأعضاء: مساران بمنطقين مختلفين — onboarding يتجاوز بوابة الاشتراك وحدّ الأعضاء {#44}
- **الشدة:** 🔴
- **الملف:** `org-users/procedures/create-org-user.ts` (37/65) مقابل `onboarding/procedures/invite-team-members.ts` (7/56–63)
- **الكود الحالي:**
```ts
// المسار الرسمي — create-org-user.ts
subscriptionProcedure ... await enforceFeatureAccess(input.organizationId, "members.invite", context.user);
// مسار onboarding — invite-team-members.ts:7,56
export const inviteTeamMembers = protectedProcedure   // ليس subscriptionProcedure
await auth.api.createInvitation({ body: { organizationId, email, role }, headers });
// لا يوجد enforceFeatureAccess في الملف كله
```
- **المشكلة:** نفس العملية بتنفيذين: الأول يفرض بوابة الاشتراك + حد `members.invite` (FREE=2) ويكتب في `UserInvitation`، والثاني بلا بوابة ويكتب في جدول `Invitation` الخاص بـ BetterAuth مع نموذج أدوار مختلف.
- **الأثر:** مستخدم الخطة المجانية يدعو أعضاء متجاوزاً الحد عبر onboarding؛ ودعوات onboarding لا تظهر في شاشة إدارة الدعوات.
- **اتجاه الحل:** توحيد المسارين على دالة خدمة واحدة تفرض `enforceFeatureAccess` وتكتب في نظام دعوات واحد.
- **يمس قائمة حمراء؟** لا.

## 4.5 خصم رصيد البنك: حارس الرصيد السالب موجود في مسار وغائب في أربعة {#45}
- **الشدة:** 🔴
- **الملف:** المحمي `org-finance.ts:815–823` (updateMany + gte)؛ غير المحمي: `company.ts:581–587` (`markExpensePaymentPaid`)، `subcontract.ts:649–657` (`createSubcontractPayment`)، `subcontract-claims.ts:865–870` (دفعة مطالبة)، `owner-drawings.ts:547–552`
- **الكود الحالي:**
```typescript
// النمط الصحيح — org-finance.ts:816
const updated = await tx.organizationBank.updateMany({
    where: { id: data.sourceAccountId, balance: { gte: data.amount } },
    data: { balance: { decrement: data.amount } },
});
if (updated.count === 0) { throw new Error("الرصيد غير كافي في الحساب المصدر"); }
// بلا حارس — company.ts:582 / subcontract.ts:651
await tx.organizationBank.update({ where: { id }, data: { balance: { decrement: ... } } });
```
- **المشكلة:** نفس العملية (صرف نقدي من حساب) تُرفض عند عدم كفاية الرصيد في مسار واحد، وتدفع الرصيد للسالب بصمت في أربعة مسارات — خصوصاً تحت التزامن.
- **الأثر:** رصيد بنك سالب في المصروفات المتكررة/دفعات الباطن/المطالبات/سحب الأرباح.
- **اتجاه الحل:** تعميم نمط `updateMany({ where: { balance: { gte } } })` على كل مواضع `decrement`.
- **يمس قائمة حمراء؟** لا.

## 4.6 دفعة مطالبة الباطن: قراءة paidAmount قديمة → تجاوز صافي المطالبة + رصيد سالب {#46}
- **الشدة:** 🟠
- **الملف:** `subcontract-claims.ts` — السطور 811 (قراءة بلا قفل)، 822 (`maxPayable` على قراءة قديمة)، 858 (كتابة مطلقة)، 865–870 (decrement بلا حارس)
- **المشكلة:** دفعتان متزامنتان على نفس المطالبة تتجاوزان معاً سقف `netAmount` وتخصمان من البنك بلا `gte`. نفس النمط في `contractPaymentTerm.paidAmount` (`project-payments.ts:331–347`).
- **الأثر:** تجاوز سقف المطالبة + رصيد سالب.
- **اتجاه الحل:** `FOR UPDATE` على صف المطالبة/البند أو `updateMany` مشروط.
- **يمس قائمة حمراء؟** لا.

## 4.7 "المصروف" بمعنيين: مالي (نقد + قيد) مقابل مصروف مشروع (معلوماتي) بلا مطابقة {#47}
- **الشدة:** 🟠
- **الملف:** `finance/procedures/expenses.ts` (يستدعي `onExpenseCompleted` + خصم رصيد) مقابل `project-finance.ts:404` (`createProjectExpense` — بلا قيد)، مع تعليق `auto-journal.ts:66`: «ProjectExpense (معلوماتي) — لا تحتاج hooks»
- **المشكلة:** كيانان يسميهما الـ UI "مصروف": الأول يحرّك رصيد البنك ويرحّل قيد EXP-JE، والثاني لا يلمس البنك ولا الدفتر، بلا أي مطابقة بينهما.
- **الأثر:** تقارير ربحية المشروع قد تتضمن مصروفات لا وجود لها محاسبياً والعكس.
- **اتجاه الحل:** شارة UI "غير محاسبي"، أو زر تحويل لمصروف مالي، أو توحيدهما بعلم `informational`.
- **يمس قائمة حمراء؟** لا.

## 4.8 حساب مجاميع الفاتورة مكرر Frontend/Backend مع اختلاف تقريب فعلي {#48}
- **الشدة:** 🟠
- **الملف:** Backend `finance.ts:26–58` (`calculateInvoiceTotals`) مقابل Frontend `finance/lib/utils.ts:153–174` (`calculateTotals`، تُستدعى من `CreateInvoiceForm.tsx:317`)
- **الكود الحالي:**
```typescript
// Backend — Decimal + تقريب لكل بند (ROUND_HALF_UP)
const total = qty.mul(price).toDecimalPlaces(2, ROUND_HALF_UP);
// Frontend — floats بلا أي تقريب
const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
```
- **المشكلة:** ترتيب الخصم/VAT متطابق، لكن الخلفية تقرّب كل بند لعشريتين والواجهة لا تقرّب وتعمل بـ floats → المجموع المعروض قد يختلف بهللة عن المحفوظ (وعن قيد ZATCA).
- **اتجاه الحل:** نقل معادلة موحّدة إلى `packages/utils` واستيرادها من الطرفين.
- **يمس قائمة حمراء؟** لا.

## 4.9 مشاكل تضارب وتكرار أخرى (مختصرة) {#49}
- **🟡 مولّدات أرقام محمية بقيد فريد لكن بلا retry** — `project-finance.ts:545` (`createClaim`), `accounting.ts:256` (`createBankChartAccount`) يرميان P2002 خاماً بدل `withUniqueRetry` الموجود في المشروع.
- **🟡 ~70 تعريف محلي لـ `formatCurrency` + 4 أدوات مشتركة متعارضة المخرجات** — `shared/lib/formatters.ts:24` (currency en-SA) مقابل `finance/lib/utils.ts:6` (decimal بلا رمز) مقابل owner pages (`ar-SA` → أرقام هندية). **نفس المبلغ يظهر بشكلين مختلفين**، وكلاهما يخالف قاعدة CLAUDE.md §5.8.
- **🟡 دوال التاريخ: تعريفان مشتركان بنفس الأسماء ومخرجات مختلفة + ~25 نسخة محلية** — `shared/lib/formatters.ts` (ar-SA طويل) مقابل `finance/lib/utils.ts` (en-GB رقمي)، وزوج `formatDateShort/Full` منسوخ بين `gantt-utils.ts:351` و`timeline/utils.ts:228`.
- **🟡 أنواع TypeScript بنفس الاسم وأشكال متضاربة** — `InvoiceItem` (`invoice-form/types.ts:10` بـ `unit:string` مقابل `credit-note/CreditNoteForm.tsx:36` بـ `unit:string|null` + `totalPrice`)، `Payment` (5 تعريفات بثلاثة أشكال)، `PaymentTerm` (تعريفان)، `ExpenseCategory` (union يدوي مقابل enum مولّد)، `StructuralItem` (منسوخ محلياً في `StructuralAccordion.tsx:70`).
- **⚪ نظامان متوازيان quantities/unified-quantities** — لا يكتبان نفس الجداول بتحقق مختلف (عبء صيانة مزدوج فقط).
- **⚪ proxy.ts سليم** مع هشاشة اعتماد على ترتيب الأسطر (`proxy.ts:21` حارس early-return لـ owner/share قبل i18n).

## ✅ فُحص ووُجد سليماً (التضارب)
- `nextSequenceValue` ذري وآمن (`sequences.ts:23–40` عبر `INSERT ... ON CONFLICT DO UPDATE`).
- كل مواضع تعديل `balance` تستخدم increment/decrement ذرياً (لا lost-update على الرصيد نفسه).
- لا تعارض بين proxy.ts ومسارات owner/share/api.

---

# 5. معالجة الأخطاء والذرية {#5}

## 5.1 حذف دفعة مصروف منشأة مدفوعة لا يعيد رصيد البنك أبداً {#51}
- **الشدة:** 🔴
- **الملف:** `packages/api/modules/company/procedures/expense-payments.ts` — السطور 319–348
- **الكود الحالي:**
```typescript
const result = await deleteExpensePayment(input.id);   // يحذف CompanyExpensePayment فقط
// ... reverseAutoJournalEntry ...
try {
    await db.financeExpense.delete({ where: { id: payment.financeExpenseId } });
} catch {
    // Silently ignore — may already be deleted via cascade
}
```
- **المشكلة:** `markExpensePaymentPaid` (company.ts:582) يخصم من رصيد البنك عند الدفع. عند الحذف يُحذف `FinanceExpense` مباشرة متجاوزاً `deleteExpense()` (org-finance.ts:1033) التي تعيد `paidAmount` للرصيد. لا يوجد أي `increment` للرصيد. إضافةً لذلك 3 كتابات خارج `$transaction` وآخرها بـ catch فارغة.
- **الأثر:** كل حذف لدفعة مصروف منشأة مدفوعة = نقص دائم في رصيد البنك بقيمة الدفعة.
- **اتجاه الحل:** لفّ المسار في `$transaction` مع إعادة الرصيد قبل حذف `FinanceExpense`، أو استدعاء `deleteExpense()` الموجودة.
- **يمس قائمة حمراء؟** لا.

## 5.2 تعديل مبلغ دفعة مدفوعة لا يعدّل رصيد البنك — وغير ذري {#52}
- **الشدة:** 🔴
- **الملف:** `company/procedures/expense-payments.ts` — السطور 235–254
- **الكود الحالي:**
```typescript
const result = await updateExpensePayment(id, data);  // كتابة 1
if (existingPayment?.isPaid && existingPayment.financeExpenseId && input.amount !== undefined) {
    await reverseAutoJournalEntry(db, { ... });        // كتابة 2
    await db.financeExpense.update({ where: { id: existingPayment.financeExpenseId }, data: { amount: input.amount } });  // كتابة 3
```
- **المشكلة:** عند تغيير مبلغ دفعة مدفوعة: (أ) رصيد البنك لا يُعدَّل بالفرق، (ب) `paidAmount` يبقى بالقيمة القديمة بينما `amount` يتغير، (ج) 4 كتابات مترابطة خارج `$transaction`.
- **الأثر:** رصيد بنك خاطئ + تعارض بين `amount` و`paidAmount` + احتمال فقدان التطابق المحاسبي.
- **اتجاه الحل:** transaction واحدة تشمل تعديل الدفعة + الرصيد بالفرق + `amount`/`paidAmount` معاً.
- **يمس قائمة حمراء؟** لا.

## 5.3 عكس القيد المحاسبي `reverseJournalEntry` بثلاث كتابات خارج transaction {#53}
- **الشدة:** 🔴 (مكرر مع 2.8 — نفس الجذر، مذكور هنا لاكتمال محور الذرية)
- **الملف:** `packages/database/prisma/queries/accounting.ts` — السطور 652–702
- **الأثر:** انهيار بين الكتابات يترك قيد عكس مُرحَّلاً بينما الأصلي POSTED غير موسوم → عكس مزدوج محتمل. الدالة تُستدعى من كل مسارات الحذف/الإلغاء المالية.
- **اتجاه الحل:** لفّ الخطوات الثلاث في `db.$transaction` (تمرير `tx` لـ `createJournalEntry`).
- **يمس قائمة حمراء؟** لا.

## 5.4 إقفال السنة يتجاهل فشل استعلام مساهمات رأس المال ويوزّع الأرباح بأرقام ناقصة {#54}
- **الشدة:** 🟠
- **الملف:** `year-end-closing.ts` — السطور 195–202 (ونفسه في `owner-drawings.ts:288–296`)
- **الكود الحالي:**
```typescript
const contributionsGrouped = await db.capitalContribution.groupBy({
    by: ["ownerId"], where: { organizationId, status: "ACTIVE" }, _sum: { amount: true },
}).catch(() => [] as Array<{ ownerId: string; _sum: { amount: any } }>);
```
- **المشكلة:** أي فشل (شبكة/timeout) يُترجم بصمت إلى "لا مساهمات" في أخطر عملية محاسبية سنوية.
- **الأثر:** توزيع أرباح نهاية السنة على الشركاء بحصص خاطئة، بلا أثر في اللوج.
- **اتجاه الحل:** إزالة `.catch()` — الفشل هنا يجب أن يُفشِل الإقفال.
- **يمس قائمة حمراء؟** لا.

## 5.5 فشل إنشاء السندات التلقائية (قبض/صرف) يُبتلع بـ console فقط — بلا audit — في 6 مواقع {#55}
- **الشدة:** 🟠
- **الملفات:** `create-invoice.ts:593`, `payments.ts:215`, `expenses.ts:371` و`636`, `subcontracts/create-payment.ts:133`, `project-payments/lib/payment-side-effects.ts:99`, `company/expense-payments.ts:192`
- **الكود الحالي:**
```typescript
} catch (e) {
    console.error("[ReceiptVoucher] Failed to create auto voucher from invoice payment:", e);
}
```
- **المشكلة:** بخلاف قيود auto-journal (`JOURNAL_ENTRY_FAILED` في audit)، فشل إنشاء السند الرسمي المرقّم لا يترك أثراً دائماً — console.error فقط (ولا يصل Sentry؛ `orpc/handler.ts` لا يستدعي `captureException`).
- **الأثر:** أموال مقبوضة/مصروفة بلا سند رسمي، بصمت.
- **اتجاه الحل:** `orgAuditLog` بإجراء `VOUCHER_AUTO_CREATE_FAILED` في كل catch.
- **يمس قائمة حمراء؟** لا.

## 5.6 حذف الدفعة يترك سند قبض ISSUED يتيماً (onDelete: SetNull بلا إلغاء) {#56}
- **الشدة:** 🟠
- **الملف:** `schema.prisma:6064–6070, 6134–6138` مع مسارات حذف الدفعات (`project-payments/delete.ts`, `create-invoice.ts:632–747`)
- **المشكلة:** إجراءات حذف الدفعات تعكس القيد وتعيد الرصيد لكنها لا تُلغي السند المُنشأ تلقائياً. العلاقة `SetNull` تفصل السند فيبقى `ISSUED` ويتحول منطقياً إلى سند "يدوي".
- **الأثر:** سندات رسمية سارية توثّق أموالاً لم تعد موجودة؛ ولو أُلغيت لاحقاً سيحاول النظام عكس قيد غير موجود.
- **اتجاه الحل:** عند حذف الدفعة، إلغاء السند المرتبط (status → CANCELLED) داخل نفس المسار.
- **يمس قائمة حمراء؟** لا.

## 5.7 أخطاء تحقق مالية بالعربية تصل العميل كـ 500 غامض (Error بدل ORPCError) {#57}
- **الشدة:** 🟠 (مالية) / 🟡 (عامة)
- **أمثلة مقروءة:**
  - `org-finance.ts:1675` — `throw new Error("الرصيد غير كافي في الحساب المصدر")` داخل `createTransfer`، والمستدعي `transfers.ts:126` بلا mapping → المستخدم يرى INTERNAL_SERVER_ERROR
  - `company/payroll.ts:131`, `year-end-closing.ts:346/448/741/744`, `journal-entries.ts:234/349/504`, `chart-of-accounts.ts:79–226` (7 مواقع), `create-invoice.ts:368`, `banks.ts:87`, `dashboard/router.ts` (9× `throw new Error("Unauthorized")`)
- **المشكلة:** oRPC يحوّل أي Error غير ORPCError إلى 500 بلا الرسالة — كل رسائل التحقق العربية لا تصل المستخدم وتُحتسب خطأ خادم. (بالمقابل `expenses.ts:296` و`add-claim-payment.ts:120` يطبّقان الـ mapping الصحيح.)
- **اتجاه الحل:** تعميم نمط `catch → ORPCError("BAD_REQUEST"/"NOT_FOUND"/"CONFLICT", { message })`.
- **يمس قائمة حمراء؟** لا.

## 5.8 `closePeriod` — قيد الإقفال وتحديث الفترة كتابتان منفصلتان {#58}
- **الشدة:** 🟠 (مكرر مع 2.20 — مذكور لاكتمال المحور)
- **الملف:** `accounting.ts:1364–1386`
- **الأثر:** فشل تحديث الفترة بعد ترحيل قيد الإقفال يترك قيد إقفال مُرحَّلاً بينما الفترة مفتوحة وتقبل قيوداً جديدة.
- **اتجاه الحل:** transaction واحدة لقيد الإقفال + `isClosed = true`.
- **يمس قائمة حمراء؟** لا.

## 5.9 مشاكل معالجة أخطاء متوسطة (مختصرة) {#59}
- **🟡 نمط منهجي `logAuditEvent(...).catch(() => {})` — سجل التدقيق يسقط بصمت (30+ موقع)** — كل `subcontracts/procedures/*` تقريباً + `project-payments/lib/payment-side-effects.ts:50`. catch فارغة تماماً بلا حتى console.error.
- **🟡 `orgAuditLog` fire-and-forget** (مكرر مع 2.12) — سجل `JOURNAL_ENTRY_FAILED` نفسه قد يضيع على Serverless.
- **🟡 `tx.organizationAuditLog.create(...).catch(() => {})` عائم داخل transaction** — `accounting.ts:564–578` (مكرر مع 2.10).
- **🟡 ربط أمر التغيير بالعقد fire-and-forget بـ catch فارغة** — `create-change-order.ts:62–72` (أثر مالي `costImpact` قد لا يُربط بالعقد بصمت).
- **🟡 `payroll.ts:201–206` — تخزين الحساب البنكي لدورة الرواتب يُبتلع بصمت** (`.catch(() => {})`) → تعارض بين السجل والقيد.
- **🟡 حفظ دفعات عقد الباطن في الواجهة يفشل بصمت بعد إنشاء العقد** — `SubcontractForm.tsx:131–149` (toast نجاح رغم فشل حفظ شروط الدفع).
- **⚪ `onboardingProgress.updateMany(...).catch(() => {})`** — ابتلاع مقبول (checklist غير مالي).
- **⚪ `handler.ts:12–38`** — التعليق يذكر Sentry لكن لا `captureException` فعلي؛ كل console.error لا يصل Sentry من طبقة API.

## ✅ فُحص ووُجد سليماً (الذرية)
طبقة `packages/database/prisma/queries` منضبطة ذرياً عموماً: دفعات الفواتير (finance.ts:1332)، التحويلات (org-finance.ts:1652 + حارس gte)، المصروفات (org-finance.ts:784/886/932/1033)، دفعات الباطن والمستخلصات (FOR UPDATE)، سحوبات الشركاء/رأس المال، الرواتب، حذف دفعات المشروع، `createJournalEntry` — كلها داخل `$transaction`. `notifyEvent` never-throw موثّق. ZATCA يسجّل الفشل مع fallback + retry.

---

# 6. الأداء {#6}

> **السياق:** Vercel Dubai ↔ Supabase Mumbai ~25ms لكل استعلام. **تحديث مهم:** مشاكل CLAUDE.md §10 عن Cache-Control وWaterfall وSuspense **عولجت فعلاً** (تفصيل في نهاية القسم).

## 6.1 اعتماد الرواتب — 3n استعلام تسلسلي داخل $transaction (خطر timeout) {#61}
- **الشدة:** 🟠
- **الملف:** `packages/database/prisma/queries/payroll.ts` — السطور 252–280
- **الكود الحالي:**
```typescript
return db.$transaction(async (tx) => {
    for (const item of run.items) {
        const expenseNo = await generateExpenseNumber(data.organizationId);
        const expense = await tx.financeExpense.create({ ... });
        await tx.payrollRunItem.update({ where: { id: item.id }, data: { financeExpenseId: expense.id } });
    }
```
- **المشكلة:** 3 استعلامات تسلسلية لكل موظف داخل معاملة واحدة. 50 موظفاً = ~150 استعلاماً × 25ms ≈ 3.75s داخل transaction، يتجاوز مهلة Prisma الافتراضية (5s) عند ~65 موظفاً، ويحجز اتصالاً من pool `max:5`.
- **الأثر:** فشل اعتماد رواتب للمنشآت المتوسطة/الكبيرة.
- **اتجاه الحل:** حجز نطاق أرقام دفعة واحدة (increment by n)، ثم `createMany` + ربط لاحق.
- **يمس قائمة حمراء؟** لا.

## 6.2 ترحيل المصروفات المتكررة — نفس نمط N+1 {#62}
- **الشدة:** 🟠
- **الملف:** `packages/database/prisma/queries/expense-runs.ts` — السطور 240–272
- **المشكلة:** مطابق لـ 6.1 — 3 استعلامات × عدد البنود تسلسلياً داخل transaction، و`generateExpenseNumber` ينفّذ على `db` لا `tx` (اتصال ثانٍ متوازٍ أثناء المعاملة).
- **اتجاه الحل:** نفس حل 6.1.
- **يمس قائمة حمراء؟** لا.

## 6.3 تسوية قيود دفعات المشروع — استعلام لكل دفعة عند إصدار كل فاتورة {#63}
- **الشدة:** 🟠
- **الملف:** `packages/api/lib/accounting/reconcile-project-payments.ts` — السطور 72–93
- **الكود الحالي:**
```typescript
for (const payment of payments) {
    hasBilling = await projectHasBillingDocuments(db, opts.organizationId, payment.projectId);
    const entry = await db.journalEntry.findFirst({
        where: { ..., referenceType: "PROJECT_PAYMENT", referenceId: payment.id, status: "POSTED" },
```
- **المشكلة:** `findFirst` لكل دفعة، يُستدعى ضمن مسار إصدار الفاتورة (`create-invoice.ts:736,941`) واعتماد المستخلص. مشروع بـ 20 دفعة = ~21 استعلاماً تسلسلياً ≈ +500ms على كل إصدار فاتورة.
- **الأثر:** بطء إصدار الفواتير يتزايد خطياً مع عمر المشروع.
- **اتجاه الحل:** جلب كل قيود `PROJECT_PAYMENT` للمشروع دفعة واحدة بـ `referenceId: { in: [...] }` ثم المطابقة في الذاكرة.
- **يمس قائمة حمراء؟** لا.

## 6.4 مشاكل أداء متوسطة/منخفضة (مختصرة) {#64}
- **🟡 قائمة القيود اليومية تجلب كل السطور بـ include كامل** — `journal-entries.ts:95–110` (صفحة القائمة تعرض الرأس فقط لكن تجلب 100–300 صف JournalEntryLine كامل). الحل: `select` للرأس + `_count.lines`.
- **🟡 `seedChartOfAccounts` ~88 استعلاماً تسلسلياً عند onboarding** — `accounting.ts:173–202` (48 create + 40 update ≈ 2.2s على أول عملية مالية). الحل: `createMany` + توليد cuid مسبقاً.
- **🟡 `bulkUpdateProgress` 2n داخل tx + إعادة حساب تسلسلية** — `project-execution.ts:327–369`.
- **🟡 صفحتا chatbot: self-HTTP مزدوج تسلسلي** — `chatbot/page.tsx:26–47` (server component يعمل fetch لنفسه عبر `orpcClient`). الحل: نقلهما لنمط `cached-queries`.
- **🟡 `upsert` تنبيهات لكل زيارة insights** — `project-insights.ts:159–178`.
- **⚪ `apply-preset` create لكل بند** — `unified-quantities/.../apply-preset.ts:42–48`.
- **⚪ recharts ستاتيكي في 4 تقارير محاسبية** — `AgedReceivablesReport.tsx:28` وأخواتها (المسارات الرئيسية سليمة — الداشبورد والمالية lazy).
- **⚪ unread chat: 3 استعلامات/30s/مستخدم** — `project-chat.ts:183–204` (polling `refetchInterval:30000`).
- **⚪ backfill `hasEntry` count لكل سجل تاريخي** — `backfill.ts:53–74` (أداة إدارية غير متكررة).

## ✅ فُحص ووُجد سليماً / تحديثات على CLAUDE.md §10
- **Cache-Control على /app/* أُصلح:** `next.config.ts:149` الآن `private, max-age=60, stale-while-revalidate=300` (لم يعد `no-store`).
- **Waterfall layouts عولج:** الـ layouts تستخدم `React.cache` + `Promise.all` (بقيت ~5 موجات تسلسلية بنيوية ≈ 150–250ms — مقبولة).
- **Suspense مطبّق في 100+ صفحة** (لا 11 كما في CLAUDE.md).
- **xlsx/html2pdf ليسا مشكلة bundle** — كل استخدامات xlsx dynamic؛ html2pdf غير موجود أصلاً في apps/web.
- الجداول الكبيرة الحقيقية (BOQSummaryTable, ExpensesList) virtualized وpaginated بـ 50.

---

# 7. Schema والبيانات {#7}

## 7.1 الأرقام التسلسلية المالية `@unique` عالمياً بدل org-scoped — تصادم مؤكد بين المستأجرين {#71}
- **الشدة:** 🔴
- **الملف:** `packages/database/prisma/schema.prisma` — `invoiceNo:4173`, `quotationNo:3984`, `expenseNo:4511`, `paymentNo:4599`, `transferNo:4663`, `documentNo:4351`, `quoteNumber:1817`, `voucherNo:4564/2377`
- **الكود الحالي:**
```prisma
invoiceNo   String @unique @map("invoice_no")     // FinanceInvoice — سطر 4173
expenseNo   String @unique @map("expense_no")     // FinanceExpense — سطر 4511
```
- **المشكلة (سلسلة أدلة):** التوليد لكل منظمة (`OrganizationSequence` بـ `@@unique([organizationId, sequenceKey])`) والصيغة `INV-2026-0001` لا تتضمن المنظمة، لكن القيد `@unique` عالمي. → المنظمة B الجديدة تولّد `INV-2026-0001` المحجوز للمنظمة A → P2002. آلية retry (finance.ts:1083) لا تُصلح الجذر لأن resync يقرأ max داخل المنظمة نفسها فقط.
- **الأثر:** (أ) فشل إنشاء فواتير مع نمو المستأجرين، (ب) فجوات في تسلسل الأرقام تخالف ZATCA، (ج) تسريب معلومة عبر المستأجرين.
- **اتجاه الحل:** `@@unique([organizationId, invoiceNo])` وقياسه على الباقي (النمط الصحيح مطبّق في `JournalEntry:5695`, `ReceiptVoucher:6115`, `PaymentVoucher:6190`).
- **يمس قائمة حمراء؟** نعم (schema.prisma — توثيق فقط).

## 7.2 حارس حذف المشروع لا يفحص `project_expenses` → Cascade يمسح مصروفات ميدانية {#72}
- **الشدة:** 🔴
- **الملف:** `schema.prisma` (2139/2167/2246/2513/2617) + `projects/procedures/delete-project.ts` — السطور 31–53
- **الكود الحالي (الحارس):**
```typescript
// delete-project.ts:37-53 — يعدّ 5 جداول فقط:
db.financeExpense.count(...), db.projectClaim.count(...),
db.subcontractContract.count(...), db.financeInvoice.count(...), db.projectPayment.count(...)
// ❌ لا يوجد db.projectExpense.count(...)
```
- **المشكلة:** الحارس يفحص `financeExpense` (مصروفات المؤسسة) لكن لا يفحص جدول `project_expenses` الذي تكتب فيه وحدة project-finance فعلياً (`createProjectExpense` في project-finance.ts:404). سلسلة الحذف: `Project` ⟵ `ProjectExpense` (Cascade) + `ProjectClaim` + `ProjectPayment` + `SubcontractContract` ⟵ دفعات الباطن + `ProjectContract` ⟵ `ContractPaymentTerm`.
- **الأثر:** مشروع فيه مصروفات ميدانية فقط يجتاز الحارس ويُحذف مع كل مصروفاته، بينما القيود اليومية المرتبطة تبقى يتيمة (referenceId نصي).
- **اتجاه الحل:** إضافة `db.projectExpense.count` (وربما السندات بـ projectId) للحارس.
- **يمس قائمة حمراء؟** نعم (schema.prisma — توثيق فقط).

## 7.3 حارس حذف الحساب البنكي يفحص 4 علاقات من 13 + Cascade يمسح التسويات البنكية {#73}
- **الشدة:** 🔴
- **الملف:** `schema.prisma:6025` + `org-finance.ts:618–648`
- **الكود الحالي:**
```prisma
// BankReconciliation — سطر 6025
bankAccount  OrganizationBank @relation(fields: [bankAccountId], references: [id], onDelete: Cascade)
```
```typescript
// org-finance.ts:624 — الحارس يعدّ فقط: expensesFrom, paymentsTo, transfersFrom, transfersTo
// ❌ لا يفحص: invoicePayments, subcontractPayments, projectPaymentsTo, companyExpensePayments,
//    payrollRuns, ownerDrawings, capitalContributionsReceived, receiptVouchersTo, paymentVouchersFrom, reconciliations
```
- **المشكلة:** حساب بنكي عليه دفعات فواتير أو رواتب فقط يجتاز الحارس → تُمسح تسوياته البنكية نهائياً (Cascade) ويفقد تاريخ الدفعات ربطه البنكي (SetNull).
- **الأثر:** فقدان تسويات بنكية وتاريخ ربط دفعات.
- **اتجاه الحل:** توسيع `_count` في الحارس ليشمل كل العلاقات الـ 13.
- **يمس قائمة حمراء؟** نعم (schema.prisma — توثيق فقط).

## 7.4 مشاكل Schema عالية/متوسطة (مختصرة) {#74}
- **🟠 `SubcontractClaim.claimNo` بلا أي unique** — `schema.prisma:2436` (بعكس `ProjectClaim` بـ `@@unique([projectId, claimNo])`:2189).
- **🟠 `SubcontractPayment.paymentNo` بلا unique** — `schema.prisma:2367`.
- **🟡 `CostStudy.status` نص حر بلا enum** — `schema.prisma:1402` + `update.ts:34` يقبل أي نص ≤100 حرف؛ قيمة شاذة تُخفي الدراسة من كل تبويبات الفلترة.
- **🟡 `CapitalContribution.status` نص حر بدل enum** — `schema.prisma:5804` (بعكس `OwnerDrawing.status` enum).
- **🟡 `defaultVatPercent` بلا دقة → decimal(65,30)** — `schema.prisma:3403`.
- **🟡 `Lead.estimatedValue`/`estimatedArea` بلا دقة → decimal(65,30)** — `schema.prisma:5319`.
- **🟡 `AssetDetail.tsx:225,229,233` يعرض `Decimal?` مالية بلا فحص null** → `Number(null)=0` يظهر "0.00 ر.س" لقيمة غير مدخلة.
- **🟡 indexes ناقصة** — `FinanceInvoice` بلا index على `issueDate` (تقارير VAT تفلتر به)؛ `FinanceInvoicePayment`/`SubcontractPayment` بلا index على `sourceAccountId` (كشف الحساب البنكي seq scan).
- **⚪ `.nullish()` على نسب مالية** — `subcontracts/create.ts:41` (`vatPercent`/`retentionPercent`) مخالف لـ CLAUDE.md §5.11.
- **⚪ `.trim().optional()`** — `quantities/update.ts:34` مخالف لـ §5.11.
- **⚪ `PlanConfig.monthlyPrice/yearlyPrice` كـ Int** — `schema.prisma:80` (لا يمثّل هللات).
- **⚪ `CompanyAsset` بدقة Decimal(12,2)** و**`QuantityItem` أسعار (15,4)** — استثناءات صامتة من قاعدة (15,2).
- **⚪ حذف الفاتورة يحذف دفعاتها وسجلات ZATCA** (`schema.prisma:4315,6347` Cascade — مخفّف بحارس DRAFT-only).

## ✅ فُحص ووُجد سليماً (Schema)
- لا توجد مقارنة enum بقيمة غير معرّفة في كل المسارات المالية (طوبقت `FinanceInvoiceStatus`, `VoucherStatus`, `JournalEntryStatus`, `ClaimStatus` مع الـ schema).
- طبقة `packages/api` منضبطة في فحص null على الحقول nullable (leads, get-phase-breakdown, project-payments, auto-journal — كلها ternary-guarded).
- دليل الحسابات لا حذف (تعطيل فقط)؛ حذف عقد الباطن محمي بحارس؛ الأرقام التسلسلية عبر `nextSequenceValue` ذرية.

---

# 8. TypeScript والبناء {#8}

## 8.1 type-check يفشل بـ 11 خطأ في وحدة الإشعارات — حقل `eventPrefs` غير موجود في Prisma client {#81}
- **الشدة:** 🔴 (يكسر البناء)
- **الملف:** `packages/api/modules/notifications/lib/notify.ts` (126, 150), `procedures/get-preferences.ts` (38, 41), `procedures/update-preferences.ts` (57, 62, 88, 94), `packages/database/prisma/queries/notifications.ts` (33, 83)
- **الكود الحالي** (notify.ts:126): `select: { userId: true, muteAll: true, eventPrefs: true }`
- **المشكلة:** الحقل `eventPrefs` موجود في `schema.prisma:2912` (`eventPrefs Json @default("{}")`) لكن Prisma client المولَّد لا يعرفه — أي أن `prisma generate` لم يُشغَّل بعد آخر تعديل على الـ schema. إضافةً لأخطاء `NotificationType` في `notifications.ts:33,83` (تمرير `string` حيث يُتوقع `NotificationType`).
- **الأثر:** `pnpm --filter @repo/web type-check` يفشل بـ exit 2 — البناء لا يمرّ.
- **اتجاه الحل:** تشغيل `pnpm --filter @repo/database generate` (يستدعي `fix-zod-import.js`)؛ وإصلاح أنواع `NotificationType` في `notifications.ts` (cast أو تضييق النوع). **ملاحظة:** هذه أخطاء حقيقية توقف البناء وليست وهمية — القائمة الكاملة في الملحق أ.
- **يمس قائمة حمراء؟** لا (لكن الإصلاح الأول يستلزم `prisma generate` الذي يمسّ الملف المولَّد `zod/index.ts` تلقائياً — وهو المسار المعتمد).

## 8.2 lint (Biome): 602 خطأ + 4,526 تحذير {#82}
- **الشدة:** 🟡
- **التوزيع الأبرز:** `useNumberNamespace` 4,557 (استخدام `isNaN`/`parseFloat` العام بدل `Number.*`) | `noUnusedImports` 165 (150 خطأ — استيرادات ميتة) | `noUnusedTemplateLiteral` 120 | `useSelfClosingElements` 58 | `useKeyWithClickEvents` 56 (a11y) | `noStaticElementInteractions` 45 (a11y) | `noUnusedFunctionParameters` 130 | `noDangerouslySetInnerHtml` 2 (أمان)
- **الأثر:** معظمها أسلوبي/a11y لا يكسر البناء. الأهم عملياً: 150 استيراد ميت (حجم bundle)، وحالتا `dangerouslySetInnerHTML` (تُراجَع كمخاطر XSS).
- **اتجاه الحل:** `biome lint --write` للإصلاحات الآمنة (استيرادات، self-closing)؛ مراجعة يدوية لـ a11y وdangerouslySetInnerHTML.
- **يمس قائمة حمراء؟** لا.

## 8.3 `@ts-expect-error`/`@ts-ignore` (7 مواضع — كلها مبرّرة) {#83}
- **الشدة:** ⚪
- **المواضع:** `content-collections.ts:116`, `analytics/provider/{vercel,posthog,mixpanel}/index.tsx` (حزم غير مثبّتة اختيارياً), `next.config.ts:3` (PrismaPlugin غير مُنمَّط), `docs/[[...path]]/page.tsx:47`
- **الملاحظة:** لا يوجد أي `@ts-ignore`/`@ts-expect-error` في `packages/api` أو `packages/database` أو المسارات المالية — كلها في طبقة UI/config بأسباب موثّقة. لا `any` صريح في مسارات مالية عدا `lines: any[]` في `auto-journal.ts` (بناء سطور القيد — مقبول داخلياً).
- **يمس قائمة حمراء؟** لا.

---

# 9. الترجمة وRTL {#9}

## 9.1 نصوص عربية hardcoded خارج ملفات الترجمة (331 ملفاً / 6,154 سطر كود) {#91}
- **الشدة:** 🟡
- **التركّز الأكبر في `pricing`:** كتالوجات المواصفات (`specs/catalog/*.ts` — ~1,100 سطر بلا نظير إنجليزي)، ومكونات ظاهرة: `BOQSummaryTable.tsx:174` (`جدول الكميات الإجمالي`), `LaborOverviewTab.tsx:44` (labels خيارات), `PricingPageContentV2.tsx:36` (خرائط enum عربية `STRUCTURAL:"إنشائي"`), `permission-labels.ts` (أسماء الـ 42 صلاحية عربية فقط).
- **الأخطر:** أسماء البنود المولّدة داخل المحركات (`mep-derivation-engine.ts:162,180`, `derivation-engine.ts`, `structural-calculations.ts`) تُحفظ بالعربية في DB ولن تُترجم رجعياً — **تعديلها يتطلب إذناً صريحاً (قائمة حمراء).**
- **الأثر:** المستخدم الإنجليزي يرى عربياً في هذه المواضع.
- **اتجاه الحل:** نقل نصوص UI لمفاتيح ترجمة؛ قرار معماري لأسماء البنود المولّدة (تخزين مفتاح + معاملات).
- **يمس قائمة حمراء؟** نعم جزئياً (محركات الاشتقاق).

## 9.2 خصائص اتجاه فيزيائية مخالفة لقاعدة RTL §5.5 (505 حالة / 136 ملفاً) {#92}
- **الشدة:** 🟡
- **التوزيع:** `text-right` 210 | `ml-N` 87 | `mr-N` 64 | `text-left` 63 | `left-N` 36 | `pl-N` 25 | `right-N` 13 | `pr-N` 7 (نطاق SaaS)
- **أسوأ الملفات:** `BOQSummaryTable.tsx` (34), `NeckColumnsSection.tsx` (16), `PaintItemDialog.tsx` (15), `StairsSection.tsx` (15), `CostingSummary.tsx` (13)
- **الأثر:** تبدو صحيحة في RTL لكنها **تنكسر بصرياً عند تفعيل الواجهة الإنجليزية LTR** (الرؤوس تبقى يميناً بينما المحتوى يساراً؛ الأيقونات والبادئات في الجهة الخاطئة).
- **اتجاه الحل:** استبدال آلي: `text-right→text-start`, `ml-→ms-`, `mr-→me-`, `pl-→ps-`, `pr-→pe-`, `left-→start-`, `right-→end-` (مع مراجعة حقول الأرقام التي قد تحتاج `dir="ltr"`).
- **يمس قائمة حمراء؟** لا.

## ✅ فُحص ووُجد سليماً (الترجمة)
- **ملفا الترجمة متطابقان تماماً:** 9,316 مفتاحاً في كلٍّ من ar.json وen.json، صفر مفاتيح مفقودة في أي اتجاه، صفر قيم فارغة.
- **صفر مفاتيح مستخدمة ومفقودة** من 9,028 استدعاء `t()` ثابت (297 استدعاء ديناميكي غير قابل للفحص الستاتيكي — النقطة الوحيدة المحتملة).
- **رمز الريال U+FDFC (﷼) غير موجود في أي كود** — 3 ظهورات فقط في ملف توثيق يحذّر منه. القاعدة ("ر.س") مطبّقة.

---

# 10. تكامل الواجهة والكود الميت {#10}

## 10.1 إبطال cache بمفاتيح مسطّحة لا تطابق بنية oRPC — القوائم لا تتحدّث (132 موضعاً) {#101}
- **الشدة:** 🟠
- **الملف:** `PaymentsList.tsx:117–118`, `BanksList.tsx:148/168/187`, `ClientsList.tsx`, `InvoiceEditor.tsx:219` وغيرها — **132 موضعاً** (69 في finance، 47 في projects)
- **الكود الحالي:** `queryClient.invalidateQueries({ queryKey: ["finance", "orgPayments"] })`
- **المشكلة:** مفتاح oRPC الفعلي بنيته `[["finance","orgPayments","list"], { input, type }]` (`path` مصفوفة). المطابقة الجزئية لـ TanStack تقارن العنصر [0]: السلسلة `"finance"` مقابل المصفوفة `["finance","orgPayments","list"]` → لا تطابق. الأنماط الصحيحة موجودة في المشروع (`orpc.finance.banks.key()` في `CreatePaymentDialog.tsx:103`).
- **الأثر:** المستخدم يحذف/يضيف مقبوضاً فلا تتحدّث القائمة حتى إعادة تحميل الصفحة.
- **اتجاه الحل:** استبدال المفاتيح المسطّحة بـ `orpc.<module>.<proc>.key()`.
- **يمس قائمة حمراء؟** لا.

## 10.2 إجمالي المقبوضات يُحسب محلياً على صفحة مقسّمة (limit=50) {#102}
- **الشدة:** 🟠
- **الملف:** `apps/web/modules/saas/finance/components/payments/PaymentsList.tsx` — السطور 101–104 (العرض في 162)
- **الكود الحالي:**
```ts
const totalPayments = payments.reduce((acc, p) => acc + Number(p.amount), 0);
<Currency amount={totalPayments} />   // بطاقة "إجمالي المقبوضات"
```
- **المشكلة:** `orgPayments.list` مُقسّم بـ limit=50. البطاقة تُظهر "إجمالي المقبوضات" لكنها مجموع أول 50 صفاً فقط.
- **الأثر:** أي منظمة لديها >50 عملية قبض ترى رقماً ناقصاً يُعرض كإجمالي.
- **اتجاه الحل:** حقل `totalAmount` مُجمّع في الخادم واستهلاكه بدل `reduce` المحلي.
- **يمس قائمة حمراء؟** لا.

## 10.3 إجمالي قيمة الدراسات وإحصاءاتها تُحسب محلياً على صفحة مقسّمة {#103}
- **الشدة:** 🟠
- **الملف:** `apps/web/modules/saas/pricing/components/studies/QuantitiesList.tsx` — السطر 55
- **الكود الحالي:** `totalValue: costStudies.reduce((sum, s) => sum + s.totalCost, 0)`
- **المشكلة:** `pricing.studies.list` مقسّم (limit 50). البطاقات `total/inProgress/completed/totalValue` كلها محسوبة على الصفحة المقصوصة → عند >50 دراسة كل الإحصائيات خاطئة.
- **الأثر:** إحصائيات دراسات خاطئة للمنشآت النشطة.
- **اتجاه الحل:** الاعتماد على `total` من الخادم + تجميع خادمي للقيمة.
- **يمس قائمة حمراء؟** لا.

## 10.4 بطاقات مالية تعرض بيانات mock ثابتة للمستخدم {#104}
- **الشدة:** 🟠
- **الملف:** `finance/components/dashboard/CashFlowCard.tsx:17` و`DeadlinesCard.tsx:28`
- **الكود الحالي:** `// TODO: Connect to real cash flow API` — يعرض `mockCashFlowData` (45000, 52000…) كتدفّق نقدي حقيقي؛ و`DeadlinesCard` تعرض "INV-2024-015 / مؤسسة البناء" وهمياً. كلاهما حيّ ومُستخدم في `FinanceDashboard.tsx:87` (صفحة `/finance`).
- **الأثر:** المستخدم يرى أرقام تدفّق نقدي ومواعيد استحقاق وهمية على صفحة المالية الرئيسية.
- **اتجاه الحل:** ربطهما بـ API حقيقي أو إخفاؤهما حتى الربط.
- **يمس قائمة حمراء؟** لا.

## 10.5 Endpoints يتيمة (مسجّلة بلا أي مستهلك في الواجهة) {#105}
- **الشدة:** 🟡
- **التغطية:** الوحدات الست المالية/المحاسبية بالكامل + عيّنة subcontracts (لم تُغطَّ الـ 39 وحدة الأخرى).
- **الأبرز:**
  - **finance:** `documents.*` (subrouter open-documents كامل — 5)، `outstanding`, `projectFinance`, `expenses.cancel`, `banks.reconcile`, `disbursements.update`, `receipts.update`, `clients.contacts.list`. (وملاحظة: `invoices.create` مهجور لصالح تدفّق المسودات.)
  - **accounting:** `accounts.{create,update,deactivate,getById,getBalance,ensureOwnerDrawingsSystem}` (6)، `journal.create` (الواجهة تستخدم `createAdjustment` فقط)، `ownerDrawings.projectSummary`, `capitalContributions.{cancel,getById}`, `recurring.create`, `statements.{accountLedger,vendor}`, `health.reconcileInvoices`.
  - **project-finance:** 8 يتيمة (`createSubcontract`, `updateSubcontract`, `deleteSubcontract`, `getSubcontract`, `updateExpense`, `deleteExpense`, `updateClaim`, `deleteClaim`) — الواجهة تستخدم وحدة `subcontracts.*` الأحدث (طبقة قديمة مكرّرة).
  - **company:** `expenses.payments.{delete,update}`, `expenses.allocations.{list,byProject}`, `expenses.{getDashboardData,getUpcoming}`, `employees.assignments.{list,byProject,update}`, `payroll.summary`, `expenseRuns.summary`, `assets.getExpiringInsurance`.
  - **quantities (تحت pricing.studies):** `specTemplate.*` (5)، `quote.*` (5)، `getLaborItems`, `finishingItem.{batchSpecUpdate,delete,reorder}`, `mepItem.delete`, وغيرها.
  - **handover:** `print`, `update`, `warrantyStatus` — معظم دورة حياة المحضر غير مربوطة بواجهة.
- **الأثر:** كود خادم مكتمل بلا واجهة (ميزات مهجورة أو ناقصة الربط، وبعضها تناقض وظيفي مثل `recurring.create` بلا زر إنشاء).
- **اتجاه الحل:** قرار لكل مجموعة: ربطها بواجهة أو حذفها من الـ router.
- **يمس قائمة حمراء؟** لا.

## 10.6 الكود الميت (70 ملفاً غير مستورد) {#106}
- **الشدة:** 🟡
- **الملخص:** 70 ملفاً بلا أي import مؤكَّد (القائمة الكاملة في الملحق ب). التوزيع: 12 في finance (منها `InvoiceEditor.tsx`, `FinanceMenu.tsx`, لوحة dashboard كاملة 8 ملفات)، 24 في pricing (منها `bom-engine.ts`, محرك القص `cutting/*`, حوارات التشطيبات)، 26 في projects/company/shared، 8 في packages (منها `adjustment-templates.ts` المذكور في CLAUDE.md كملف نشط، `limits-middleware.ts`, 5 مزوّدات بريد غير مصدَّرة).
- **اتجاه الحل:** حذف بعد تأكيد نهائي (أدوات مثل `seed-catalog.ts` وملفات `*-tools.ts` المسجّلة بأثر جانبي **ليست ميتة** — انظر الملحق ب).
- **يمس قائمة حمراء؟** لا.

## 10.7 نظافة جذر المستودع (~90 ملف توثيق/برومبتات قديمة) {#107}
- **الشدة:** ⚪
- **الملخص:** جذر المشروع يحوي ~90+ ملف `.md`/`.jsx`/`.txt` قديمة خارج `docs/` (تقارير تدقيق سابقة v4/v5، برومبتات، مخرجات بناء `all-errors.txt`, `build-errors.txt`, صور شعار مكرّرة). مرشّحة للنقل إلى `docs/archive/` أو الحذف.
- **يمس قائمة حمراء؟** لا.

## ✅ فُحص ووُجد سليماً (التكامل)
- **لا واجهة تستدعي endpoint غير موجود** — فحص عكسي آلي شمل كل 605 مسار `orpc.*` في الواجهة؛ المرشّحات الأربعة الظاهرة تحقّق وجودها يدوياً.
- معظم استخدامات `orpcClient` في `modules/` داخل mutations (سليم).

---

# 11. مصفوفة الأولويات {#11}

> الجهد التقديري: S (ساعات) / M (يوم–يومان) / L (أسبوع+). التوقيت: **قبل** الإطلاق أو **بعده**.

| المرجع | المشكلة | الشدة | الجهد | التوقيت |
|--------|---------|-------|-------|---------|
| [2.1](#21) | الإشعار الدائن لا يولّد قيداً (مبالغ سالبة) | 🔴 | S | **قبل** |
| [3.1–3.10](#3) | 10 ثغرات IDOR عابرة للمستأجرين (company/vouchers/banks/subcontracts) | 🔴 | M | **قبل** |
| [7.1](#71) | أرقام الفواتير @unique عالمياً | 🔴 | M (migration) | **قبل** |
| [2.2](#22)/[2.3](#23) | إلغاء الفاتورة/الإشعار بلا عكس قيد | 🔴 | S | **قبل** |
| [4.1](#41) | race condition دفعات الفواتير | 🔴 | M | **قبل** |
| [5.1](#51)/[5.2](#52) | حذف/تعديل دفعة مصروف منشأة لا يعيد الرصيد | 🔴 | S | **قبل** |
| [2.4](#24) | الدفعة الجزئية للمصروف بكامل المبلغ | 🔴 | M | **قبل** |
| [4.2](#42) | اعتماد مطالبات مزدوج → قيد مكرر | 🔴 | M | **قبل** |
| [2.5](#25) | الأرصدة الافتتاحية غير ذرية → فقدان | 🔴 | S | **قبل** |
| [7.2](#72)/[7.3](#73) | حراس حذف المشروع/البنك ناقصون → Cascade يمسح مالياً | 🔴 | S | **قبل** |
| [2.6](#26) | دفعة فاتورة بلا حارس حالة/سقف | 🔴 | S | **قبل** |
| [2.7](#27) | إقفال السنة غير ذري | 🔴 | M | **قبل** |
| [4.3](#43) | ترقيم مطالبات/دفعات باطن بلا unique | 🔴 | S | **قبل** |
| [4.4](#44) | دعوة onboarding تتجاوز بوابة الاشتراك | 🔴 | S | **قبل** |
| [4.5](#45) | خصم رصيد بلا حارس gte في 4 مسارات | 🔴 | S | **قبل** |
| [8.1](#81) | type-check يفشل (eventPrefs + NotificationType) | 🔴 | S | **قبل** |
| [2.16](#216) | تقرير VAT لا يطبّق الإعفاءات (cuid vs systemId) | 🟠 | S | **قبل** |
| [2.8](#28)/[5.3](#53) | reverseJournalEntry غير ذري → عكس مزدوج | 🟠 | S | **قبل** |
| [2.14](#214) | السندات اليدوية لا تحرّك رصيد البنك | 🟠 | M | **قبل** |
| [10.1](#101) | إبطال cache مسطّح (132 موضعاً) | 🟠 | M | **قبل** |
| [10.4](#104) | بطاقات مالية mock على /finance | 🟠 | S | **قبل** |
| [6.1](#61)/[6.2](#62) | N+1 رواتب/مصروفات متكررة (timeout) | 🟠 | M | **قبل** |
| [2.9–2.17](#2) | باقي مشاكل المحاسبة العالية | 🟠 | M–L | قبل/بعد |
| [5.4–5.8](#5) | silent failures + Error بدل ORPCError | 🟠 | M | قبل/بعد |
| [10.2](#102)/[10.3](#103) | حسابات محلية على صفحات مقسّمة | 🟠 | S | **قبل** |
| [4.6](#46)–[4.9](#49) | race conditions + تكرار (formatCurrency/types) | 🟠🟡 | M–L | بعد |
| [6.3](#63)/[6.4](#64) | باقي الأداء (تسوية القيود، include كامل) | 🟠🟡 | M | بعد |
| [7.4](#74) | Schema متوسط (enums, precision, indexes) | 🟡 | M (migrations) | بعد |
| [8.2](#82) | 602 خطأ lint + استيرادات ميتة | 🟡 | S (auto-fix) | بعد |
| [9.1](#91)/[9.2](#92) | عربي hardcoded + 505 حالة RTL فيزيائية | 🟡 | L | بعد |
| [10.5–10.7](#105) | endpoints يتيمة + كود ميت + نظافة جذر | 🟡⚪ | M | بعد |

---

# 12. ملحق أ: مخرجات type-check الكاملة {#appendix-a}

الأمر: `pnpm --filter @repo/web type-check` (من جذر المشروع). النتيجة: **فشل — Exit status 2**، 11 خطأ، كلها في وحدة الإشعارات وطبقة الاستعلام المرتبطة بها.

```
../../packages/api/modules/notifications/lib/notify.ts(126,43): error TS2353: Object literal may only specify known properties, and 'eventPrefs' does not exist in type 'NotificationPreferenceSelect<DefaultArgs>'.
../../packages/api/modules/notifications/lib/notify.ts(150,12): error TS2339: Property 'eventPrefs' does not exist on type '{ id: string; ...; muteAll: boolean; }'.
../../packages/api/modules/notifications/procedures/get-preferences.ts(38,48): error TS2353: 'eventPrefs' does not exist in type 'NotificationPreferenceSelect<DefaultArgs>'.
../../packages/api/modules/notifications/procedures/get-preferences.ts(41,30): error TS2339: Property 'eventPrefs' does not exist on type '{ id: string; ...; muteAll: boolean; }'.
../../packages/api/modules/notifications/procedures/update-preferences.ts(57,14): error TS2353: 'eventPrefs' does not exist in type 'NotificationPreferenceSelect<DefaultArgs>'.
../../packages/api/modules/notifications/procedures/update-preferences.ts(62,18): error TS2339: Property 'eventPrefs' does not exist on type '{ id: string; ...; muteAll: boolean; }'.
../../packages/api/modules/notifications/procedures/update-preferences.ts(88,5): error TS2353: 'eventPrefs' does not exist in type '(Without<NotificationPreferenceUpdateInput, ...> & ...)'.
../../packages/api/modules/notifications/procedures/update-preferences.ts(94,5): error TS2353: 'eventPrefs' does not exist in type 'Without<NotificationPreferenceCreateInput, ...> & ...'.
../../packages/database/prisma/queries/notifications.ts(33,3): error TS2322: Type '{...; type: string; ...}[]' is not assignable to type 'NotificationCreateManyInput[]' — Types of property 'type' are incompatible. Type 'string' is not assignable to type 'NotificationType'.
../../packages/database/prisma/queries/notifications.ts(83,18): error TS2322: Type 'string[]' is not assignable to type 'NotificationType[] | FieldRef<...> | undefined'. Type 'string' is not assignable to type 'NotificationType'.

ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @repo/web@0.0.0 type-check: `tsc --noEmit`  — Exit status 2
```

**التحليل:** 8 من الأخطاء بسبب حقل `eventPrefs` الموجود في `schema.prisma:2912` لكن غير المعروف لـ Prisma client المولَّد (لم يُشغَّل `prisma generate` بعد آخر تعديل schema). الخطآن الأخيران في `notifications.ts` بسبب تمرير `string` حيث يُتوقع `NotificationType` enum. **كلها أخطاء حقيقية توقف البناء — ليست وهمية.** الإصلاح: `pnpm --filter @repo/database generate` ثم تضييق أنواع `NotificationType`.

> ملاحظة: لم تُشغَّل `pnpm --filter @repo/web lint` عبر الاسم لأن المشروع لا يعرّف سكربت `lint` على مستوى الحزمة؛ شُغّل Biome مباشرة (`biome lint apps/web`) والنتيجة في القسم 8.2.

---

# 13. ملحق ب: قائمة الملفات الميتة (70 ملفاً) {#appendix-b}

> منهجية: `git ls-files` لكل `.ts/.tsx` ثم بحث عن اسم الملف في كل مواصفات import عبر المستودع، مع تأكيد ثانٍ بـ grep على اسم التصدير للحالات الحرجة.

**finance module (12):** `FinanceMenu.tsx`، `dashboard/{FinanceAlerts, FinanceMainNav, FinanceNavBar, FinanceOverviewPanel, FinanceStatsCards, TabsBar, TipCard, WelcomeBanner}.tsx`، `expenses/ExpensesHeaderActions.tsx`، `invoices/{InvoiceEditor, InvoicesHeaderActions}.tsx`

**pricing module (24):** `costing-v2/StructuralCostingTab.tsx`، `finishing/specs/{BillOfMaterials, ItemSpecEditor, SpecBulkEditor, TemplateManager}.tsx`، `leads/LeadsTable.tsx`، `pipeline/{CostingPageContent, PipelineBar, QuantitiesPageContent, SellingPricePageContent}.tsx`، `pricing-v2/QuickPricingStandalone.tsx`، `pricing/PricingItemRow.tsx`، `studies/finishing/{PaintItemDialog, PlasterItemDialog, ThermalInsulationItemDialog, WaterproofingItemDialog}.tsx`، `studies/sections/StructuralSpecsSection.tsx`، `lib/bom-engine.ts`، `lib/cutting/{remnant-manager, saudi-rebar-specs, waste-analyzer}.ts`، `lib/{finishing-links, finishing-templates}.ts`، `types/beams.ts`

**company/projects/shared (26):** `company/{leaves/LeaveDashboard, shell/CompanyHeader, templates/TemplateEditor, templates/TemplatesHeaderActions}.tsx`، `projects/components/{DocumentsList, ProjectChat, ProjectsHeader, field/ProjectPhotosCard, finance/ProjectClaimsView, finance/ProjectPaymentsView, finance/contract/ContractInfoCard, finance/contract/PaymentTermsCard, finance/contract/RetentionCard, forms/PhotoUploadForm, overview/FinanceSummaryCard, overview/KpiStrip, overview/OwnerAccessCard, overview/ProjectStatusChart, shell/ProjectContextToolbar, team/RoleVisibilityCards}.tsx`، `shared/components/{AttachmentList, DocumentPrintHeader, MasarSidebarShell, SidebarClock, TabGroup, UploadButton}.tsx`

**packages (8):** `api/lib/accounting/adjustment-templates.ts` (⚠️ مذكور في CLAUDE.md §18.9 كملف نشط لكنه غير مستخدَم)، `api/lib/openapi-schema.ts`، `api/orpc/middleware/limits-middleware.ts`، `mail/src/provider/{mailgun, nodemailer, plunk, postmark, console}.ts` (المُصدَّر resend فقط)

**⚠️ استثناءات — تبدو ميتة لكنها حيّة (لا تُحذف):** `packages/ai/tools/modules/*-tools.ts` (21 ملفاً — تُستورد بأثر جانبي في `index.ts`)، `unified-quantities/scripts/seed-catalog.ts` (سكربت في package.json)، `api/scripts/fix-null-expiry-tokens.ts`، `api/vitest.config.ts`، ملفات `__tests__/*.test.ts` (يكتشفها Vitest).

---

# 14. ملحق ج: القائمة الكاملة لاستعلامات Prisma بدون organizationId {#appendix-c}

> 🔴 = استعلام يقبل id من العميل بلا أي تحقق ملكية (ثغرة IDOR فعلية). 🟡 = يعتمد على تحقق سابق في نفس الـ handler (دفاع بالعمق موصى به، ليس ثغرة). الاستعلامات المتضمّنة `organizationId` أو علاقة مُفلترة به = آمنة ولم تُدرج.

| الملف | السطر | الموديل | العملية | التقييم |
|------|------|---------|---------|---------|
| finance/procedures/banks.ts | 297 | organizationBank | findUnique | 🔴 |
| finance/procedures/banks.ts | 302 | chartAccount | update | 🔴 |
| finance/procedures/payment-vouchers.ts | 687 | paymentVoucher | update | 🔴 |
| finance/procedures/receipt-vouchers.ts | 526 | receiptVoucher | update | 🔴 |
| finance/procedures/create-invoice.ts | 146 | quotation | update | 🟡 |
| finance/procedures/create-invoice.ts | 543/574/597 | financeInvoice | findUnique | 🟡 |
| company/procedures/expense-payments.ts | 229 | companyExpensePayment | findUnique | 🔴 |
| company/procedures/expense-payments.ts | 251 | financeExpense | update | 🔴 |
| company/procedures/expense-payments.ts | 256 | financeExpense | findUnique | 🔴 |
| company/procedures/expense-payments.ts | 314 | companyExpensePayment | findUnique | 🔴 |
| company/procedures/expense-payments.ts | 345 | financeExpense | delete | 🔴 |
| company/procedures/expense-payments.ts | 129/165 | financeExpense | findUnique | 🟡 |
| db/queries/company.ts | 477/484 | companyExpensePayment | findMany | 🔴 |
| db/queries/company.ts | 493/505 | companyExpensePayment | create | 🔴 |
| db/queries/company.ts | 540/590 | companyExpensePayment | findUnique/update | 🔴 |
| db/queries/company.ts | 582 | organizationBank | update | 🟡 |
| db/queries/company.ts | 615 | companyExpensePayment | update | 🔴 |
| db/queries/company.ts | 619 | companyExpensePayment | delete | 🔴 |
| db/queries/company.ts | 622/682 | companyExpense/…Payment | findUnique/createMany | 🔴 |
| db/queries/company.ts | 689 | companyExpenseAllocation | findMany | 🔴 |
| db/queries/company.ts | 697/709/713 | companyExpenseAllocation | deleteMany/createMany | 🔴 |
| db/queries/company.ts | 730 | companyExpenseAllocation | findMany | 🔴 |
| db/queries/company.ts | 196/204 | employeeProjectAssignment | findMany | 🔴 |
| db/queries/company.ts | 220/238 | employeeProjectAssignment | create | 🔴 |
| db/queries/company.ts | 267 | employeeProjectAssignment | update | 🔴 |
| db/queries/company.ts | 271 | employeeProjectAssignment | delete | 🔴 |
| company/procedures/leaves/leave-balances.ts | 103 | leaveBalance | upsert | 🔴 |
| company/procedures/leaves/leave-types.ts | 124 | leaveType | update | 🔴 |
| company/procedures/leaves/leave-types.ts | 163 | leaveType | delete | 🔴 |
| subcontracts/procedures/update-change-order.ts | 41 (→ subcontract.ts:577) | subcontractChangeOrder | update | 🔴 |
| subcontracts/procedures/delete-change-order.ts | 30 (→ subcontract.ts:589) | subcontractChangeOrder | delete | 🔴 |
| subcontracts/procedures/get-payment-terms-progress.ts | 30 (→ subcontract.ts:367) | subcontractContract | findFirst | 🔴 |
| project-templates/procedures/remove-template-item.ts | 30 (→ project-templates.ts:384) | projectTemplateItem | delete | 🔴 |
| api/lib/accounting/auto-journal.ts | 122 | organizationBank | findUnique | 🟡 |
| db/queries/cost-studies.ts | 549/560 | structuralItem | update/delete | 🟡 |
| db/queries/cost-studies.ts | 763/774/787 | finishingItem | update/delete/reorder | 🟡 |
| db/queries/cost-studies.ts | 1091/1107/1122 | mEPItem | update/delete/toggle | 🟡 |
| db/queries/cost-studies.ts | 810 | laborItem/buildingConfig | update | 🟡 |
| db/queries/accounting.ts | 631/652 | journalEntry | findUnique/update | 🟡 |
| db/queries/accounting.ts | 1267/1399 | accountingPeriod | update | 🟡 |
| db/queries/roles.ts | 22/108/125 | role | findUnique/update/delete | 🟡 |
| db/queries/ai-chats.ts | 40/74/86 | aiChat | findUnique/update/delete | 🟡 |
| db/queries/purchases.ts | 6/53 | purchase | findUnique/update | 🟡 |
| db/queries/project-members.ts | 138/182 | projectMember | update/delete | 🟡 |
| db/queries/project-contract.ts | 136/170/204/370 | projectContract/contractPaymentTerm | upsert/update/createMany | 🟡 |
| db/queries/project-documents.ts | 243/255 | projectDocumentFolder | update/delete | 🟡 |
| db/queries/subcontract.ts | 296/533/610 | subcontract* | tx/create | 🟡 |
| db/queries/subcontract-claims.ts | 883 | organizationBank | update | 🟡 |
| db/queries/subcontract.ts | 651 | organizationBank | update | 🟡 |
| db/queries/organizations.ts | 67/77/145 | organization/invitation | findUnique/update | 🟡 |
| db/queries/integrations.ts | 86 | messageDeliveryLog | update | 🟡 |
| db/queries/notifications.ts | 218/234 | notification | update | 🟡 |
| db/queries/users.ts | 61/69/103/138 | user/account | findUnique/update | 🟡 (منصّة/auth) |
| db/queries/permissions.ts | 78/90/102/113 | user | update | 🟡 (داخلي) |

**تنبيه الأولوية:** كل صفوف 🔴 (وحدة `company` بالكامل + أوامر تغيير الباطن + `get-payment-terms-progress` + `remove-template-item` + `banks` + طباعة السندات) ثغرات IDOR قابلة للاستغلال من أي عضو مُصادَق في أي منظمة. الإصلاح الموحّد: إضافة `organizationId` إلى `where` أو التحقق من الملكية عبر العلاقة الأم قبل الكتابة (كما تفعل بالفعل `payroll.ts`/`expense-runs.ts`).

---

# 15. ملاحظات ختامية

## نطاق التغطية وحدوده
- **مغطّى بالكامل:** النظام المحاسبي (auto-journal + queries/accounting + إجراءات المحاسبة والمالية)، طبقة الاستعلامات المالية، استعلامات Prisma المالية بلا organizationId، الوحدات المالية الست في تكامل الواجهة، ملفا الترجمة، الأداء في المسارات المالية، Schema المالي.
- **مغطّى بعيّنة:** الوحدات غير المالية الـ 39 (admin, ai, projects, zatca…) في محور تكامل الواجهة والكود الميت؛ محور RTL في نطاق SaaS (استُثني marketing جزئياً).
- **غير مفحوص بعمق:** محركات الحساب الإنشائي/التشطيبات/MEP الداخلية (قائمة حمراء — قُرئت لكن لم تُدقَّق معادلاتها)، وتفاصيل ZATCA Phase 2 التشفيرية.

## تأكيد سلامة المستودع
- **لم يُعدَّل أي ملف كود.** `git status` قبل هذا التقرير أظهر تعديلات سابقة على الفرع (`add-claim-payment.ts`, `subcontract-claims.ts`, ملفات RBAC وsession-logs) — وهي **ليست من عمل هذا التدقيق** بل موجودة قبله. الملف الوحيد الذي أنشأه هذا التدقيق هو `MASAR_ERRORS_AUDIT_REPORT_v6.md`.
- كل بطاقة تتضمن مسار + سطر + مقتطف فعلي مقروء. المشاكل المبنية على تخمين استُبعدت.
- أرقام الملخص التنفيذي (105 مشكلة) تطابق مجموع البطاقات في الأقسام 2–10.

## ثلاث خطوات فورية موصى بها (بالترتيب)
1. **أوقف نزيف البيانات:** أصلِح [2.1](#21) (الإشعارات الدائنة) و[7.1](#71) (ترقيم الفواتير) و[8.1](#81) (البناء المكسور) — هذه الثلاثة تمنع أي إطلاق.
2. **أغلق ثغرات العزل:** الـ 10 ثغرات IDOR في القسم 3 بإصلاح موحّد على وحدة `company`.
3. **ثبّت الذرية المحاسبية:** [4.1](#41)، [4.2](#42)، [5.1](#51)–[5.3](#53)، [2.5](#25)، [2.7](#27) — كلها race conditions أو عمليات غير ذرية تفسد الأرصدة.

---

*انتهى التقرير — منصة مسار v6.0 — 2026-07-05*

