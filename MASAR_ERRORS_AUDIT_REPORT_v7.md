# تقرير الأخطاء والمشاكل الشامل — منصة مسار v7.0

> **التاريخ:** 2026-07-14
> **الفرع:** main (آخر commit: `dcd63fee` — landing v3)
> **الملفات المفحوصة:** ~2,511 ملف مصدر (1,655 في `apps/web` + 856 في `packages` منها 655 في `packages/api`)
> **نتيجة type-check:** ✅ نجح — `@repo/web` و`@repo/database` كلاهما exit 0، صفر أخطاء (كانت 11 خطأ في v6)
> **نتيجة الاختبارات:** ✅ API: 1,109 ناجحاً / 34 متخطى (40 ملفاً) — DB: 77 ناجحاً / 24 متخطى
> **نتيجة lint (Biome):** 483 خطأ + 4,217 تحذير + 126 ملاحظة (تحسّن من 602/4,526/145 في v6)
> **منهجية التدقيق:** قراءة فعلية للكود عبر 8 مسارات تدقيق متوازية + type-check + tests + lint + تحقق يدوي مباشر لأخطر البنود. **لم يُعدَّل أي ملف كود — تدقيق قراءة فقط.**

---

## ملاحظة منهجية

هذا التقرير امتداد لـ `MASAR_ERRORS_AUDIT_REPORT_v6.md` (110 مشكلة، 2026-07-05) وتقرير التحقق `MASAR_V6_FIXES_VERIFICATION_REPORT.md`. كل بطاقة تتضمن المسار ورقم السطر الفعلي ومقتطف الكود المقروء مباشرة. المشاكل المبنية على تخمين استُبعدت. كل بطاقة تحمل عمود **حالة v6**: `جديدة` (كود أُضيف بعد v6، غالباً إعادة تصميم Botly + الداشبورد + البحث + Unified Quantities) / `متبقية من v6` (لم تُغلق) / `تراجُع` (كانت سليمة فانكسرت).

**تحقق مباشر (يدوي، خارج الوكلاء):** أكّدتُ بنفسي أخطر 3 بنود (V7-01 كتابة بنك عابرة، ACC-2 تاريخ عكس الإقفال، B1 تسريب اعتماد ZATCA) بقراءة الكود الفعلي، بالإضافة إلى تأكيد إغلاق إصلاحَي v6 الأبرز (4.1 حذف دفعة الفاتورة، 4.2 اعتماد المستخلص المزدوج).

**القائمة الحمراء (قُرئت ودُقّقت، لم تُعدَّل):** `auto-journal.ts`، `structural-calculations.ts`، `schema.prisma`، ملفات ZATCA. المشاكل المكتشفة فيها موسومة "يمس قائمة حمراء؟ نعم".

---

# 1. الملخص التنفيذي

## 1.1 توزيع المشاكل حسب الشدة

| الشدة | العدد |
|-------|-------|
| 🔴 حرج | 4 |
| 🟠 عالٍ | 27 |
| 🟡 متوسط | 22 |
| ⚪ منخفض | 14 |
| **المجموع** | **67** |

> **قراءة سريعة للاتجاه:** انخفاض حاد عن v6 (110 → 63). كل المشاكل الحرجة الـ 29 والعالية في v6 التي فُحصت أُغلقت أو خُفّفت (لا تراجع في أي إصلاح v6 معاد فحصه). المشاكل الجديدة في v7 تتركز في **الكود المُضاف بعد v6**: مسار مساهمات رأس المال، البحث الشامل، إعادة تصميم الداشبورد، Unified Quantities، وتسريبات تصحيح (DEBUG logs) منسية. ثقل المخاطر انتقل من "النظام المحاسبي الأساسي" (الذي صُلّب في v6) إلى **حواف العزل والذرية في المسارات الجديدة**.

## 1.2 توزيع المشاكل حسب المحور

| # | المحور | 🔴 | 🟠 | 🟡 | ⚪ |
|---|--------|----|----|----|----|
| 2 | سلامة النظام المحاسبي | 3 | 8 | 6 | 1 |
| 3 | الأمان متعدد المستأجرين والصلاحيات | 1 | 4 | 1 | 3 |
| 4 | التضارب والتكرار | 0 | 3 | 4 | 0 |
| 5 | معالجة الأخطاء والذرية | 0 | 4 | 2 | 1 |
| 6 | الأداء | 0 | 3 | 3 | 3 |
| 7 | Schema والبيانات | 0 | 1 | 2 | 2 |
| 8 | أمان المدخلات والأسرار | 1 | 2 | 2 | 1 |
| 9 | الترجمة وRTL | 0 | 1 | 0 | 1 |
| 10 | تكامل الواجهة والكود الميت | 0 | 2 | 3 | 3 |

> بعض البطاقات تظهر في محورين (مثلاً كتابة البنك العابرة = محاسبة + أمان)؛ تُحسب مرة واحدة في المجموع الكلي وتُذكر إحالة متبادلة.

## 1.3 أخطر 12 مشكلة يجب حلها قبل الإطلاق (مرتبة)

| # | المشكلة | المحور | الشدة | المرجع |
|---|---------|--------|-------|--------|
| 1 | **كتابة رصيد بنك عابرة للمستأجرين** — 4 مسارات تعدّل `organizationBank.balance` بـ `where:{id}` بلا `organizationId` (مساهمة رأس مال، دفعة فاتورة، مقبوض مباشر، دفعة مشروع) | أمان/محاسبة | 🔴 | [V7-01](#v701) |
| 2 | **تسريب اعتماد ZATCA (Authorization + OTP) في سجلات الإنتاج** — go-live قريب | أمان | 🔴 | [B1](#b1) |
| 3 | **إقفال السنة يُكمَل صامتاً بلا قيد** حين تكون فترة ديسمبر مغلقة (وهو المسار الموصى به) → حسابات الإيراد/المصروف لا تُصفَّر والنظام يظنّ السنة مُقفلة | محاسبة | 🔴 | [ACC-15](#acc15) |
| 4 | **عكس إقفال السنة مؤرَّخ بتاريخ اليوم** بدل تاريخ الإقفال → يشوّه قائمة دخل السنة التالية وإعادة الإقفال | محاسبة | 🔴 | [ACC-2](#acc2) |
| 6 | **/image-proxy بلا أي مصادقة** — يوقّع أي مفتاح في bucket المرفقات لساعة بلا فحص جلسة/ملكية | أمان | 🟠 | [V7-03](#v703) |
| 7 | **45 موقع `JOURNAL_ENTRY_FAILED` بلا `await`** → شبكة الأمان الوحيدة للقيود المفقودة قد تضيع على serverless | معالجة أخطاء | 🟠 | [EH-3](#eh3) |
| 8 | **نافذة اعتماد مزدوج في الرواتب/المصروفات المتكررة** → مضاعفة مصروفات مالية | تضارب | 🟠 | [RC-1](#rc1) |
| 9 | **غياب `@@unique` على مرجع القيود التلقائية** (dedup بـ `findFirst` = TOCTOU) → قيد محاسبي مزدوج | تضارب/Schema | 🟠 | [RC-3](#rc3) |
| 10 | **`Error` بدل `ORPCError`** في مسارات حرجة (فواتير مُصدرة، فترات مغلقة، نِسب ملكية) → المستخدم يرى 500 مبهم | معالجة أخطاء | 🟠 | [EH-4](#eh4) |
| 11 | **البحث الشامل يتجاهل نطاق مشاريع العضو** → عضو مقيَّد يرى كل مشاريع/عملاء المنظمة | أمان/واجهة | 🟠 | [FE-01](#fe01) |
| 12 | **تعديل مصروف/مقبوض إلى فترة مغلقة** يعكس القيد ولا يعيد إنشاءه (v6 2.15 أُصلح مسار واحد من ثلاثة) | محاسبة | 🟠 | [ACC-5](#acc5) |

---

# 2. سلامة النظام المحاسبي {#2}

> **جرد الـ hooks (17 + العكس):** لم تتغير عن v6. النظام الأساسي (`createJournalEntry`, `reverseJournalEntry`, توازن Decimal، فحص الفترات، dedup بالمرجع، الإقفال السنوي التنفيذي) **متين ومُختبَر** — المشاكل أدناه في *الأطراف*: العكس، التعديل، السباقات، والكود الجديد.

## V7-01 — كتابة رصيد بنك عابرة للمستأجرين (4 مسارات) {#v701}
- **الشدة:** 🔴 (IDOR عابر للمستأجرين — كتابة عمياء / مؤكَّد يدوياً)
- **الملف:** `packages/api/modules/accounting/procedures/capital-contributions.ts:242-248`، و`packages/database/prisma/queries/finance.ts:1367-1372` (`addInvoicePayment`)، و`org-finance.ts:1502-1508` (`createPayment`)، و`project-payments.ts:423-429` (`createProjectPaymentsInTx`)
- **الكود الحالي:**
```ts
// capital-contributions.ts:242 — المالك مُتحقَّق منه، لكن البنك لا
if (input.bankAccountId) {
    await tx.organizationBank.update({
        where: { id: input.bankAccountId },   // ← لا organizationId
        data: { balance: { increment: input.amount } },
    });
}
```
- **المشكلة:** الـ handler يتحقق من عضوية المستخدم في المنظمة المُدّعاة و(في مساهمات رأس المال) من `ownerId`، لكن `bankAccountId`/`sourceAccountId`/`destinationAccountId` تُمرَّر خام إلى `organizationBank.update({ where: { id } })` بلا ربطها بالمنظمة. القيد المحاسبي نفسه محمي (`createJournalEntry` يرفض حسابات دليل خارج المنظمة)، لكن **الرصيد التشغيلي للبنك غير محمي**. اكتُشف مستقلاً من مسارَي التدقيق (الأمان + المحاسبة).
- **الأثر:** عضو في منظمة A يمرّر معرّف بنك منظمة B فيعدّل رصيدها التشغيلي — إفساد صامت عابر للمستأجرين + انحراف دائم بين الرصيد ودفتر الأستاذ في المنظمتين. مخالفة مباشرة للقاعدة 5.2.
- **اتجاه الحل:** تحويل الكتابات إلى `updateMany({ where: { id, organizationId } })` + فحص `count === 0` (النمط الصحيح مطبّق أصلاً في `payment-vouchers.ts:447` و`owner-drawings.ts:559`)، أو تحقق ملكية مسبق في الـ procedure.
- **يمس قائمة حمراء؟** لا (لكن الإصلاح قرب `finance.ts`/`accounting.ts`).
- **حالة v6:** جديدة (كل المسارات الأربعة أُضيفت/لم تُفحص في v6).

## ACC-2 — عكس إقفال السنة مؤرَّخ بتاريخ اليوم {#acc2}
- **الشدة:** 🔴 (مؤكَّد يدوياً)
- **الملف:** `packages/api/modules/accounting/procedures/year-end-closing.ts:771-788`
- **الكود الحالي:**
```ts
if (closing.closingJournalEntryId) {
    await reverseJournalEntry(db, closing.closingJournalEntryId, context.user.id, new Date()); // ← تاريخ اليوم
}
if (closing.drawingsClosingEntryId) {
    await reverseJournalEntry(db, closing.drawingsClosingEntryId, context.user.id, new Date());
}
```
- **المشكلة:** قيد الإقفال (YEC-JE) مؤرَّخ 31 ديسمبر للسنة المُقفلة، لكن قيد العكس يُنشأ بتاريخ **اليوم** (عملياً في السنة التالية). النتيجتان: (1) قائمة دخل السنة الجارية تتضخم بكامل إيرادات/مصروفات السنة المعكوسة. (2) إعادة تنفيذ الإقفال بعد العكس تحسب أرصدة خاطئة (القيد القديم REVERSED داخل السنة بينما عكسه خارجها) → `retainedEarningsTransfer` خاطئ صامتاً. دورة (إقفال → عكس → إعادة إقفال) متوقعة كل يناير.
- **الأثر:** تشويه جسيم لقائمة الدخل والأرباح المبقاة.
- **اتجاه الحل:** تمرير `closing.closingDate` (31 ديسمبر للسنة نفسها) بدل `new Date()`.
- **يمس قائمة حمراء؟** لا.
- **حالة v6:** جديدة.

## ACC-15 — إقفال السنة يُكمَل صامتاً بلا قيد حين تكون فترة ديسمبر مغلقة {#acc15}
- **الشدة:** 🔴 (مؤكَّد يدوياً — يقع في المسار الموصى به)
- **الملف:** `packages/api/modules/accounting/procedures/year-end-closing.ts:486-499` و`628-646`، والسبب في `packages/database/prisma/queries/accounting.ts:579-588`
- **الكود الحالي:**
```ts
// year-end-closing.ts:489 — القيد مؤرَّخ dateTo (31 ديسمبر)، isAutoGenerated: true
closingEntry = await createJournalEntry(db, { date: dateTo, referenceType: "YEAR_END_CLOSING", isAutoGenerated: true, lines: closingLines, ... }, tx);
...
// :640 — يُحفظ COMPLETED حتى لو كان closingEntry = null
closingJournalEntryId: closingEntry?.id ?? null,
status: "COMPLETED",
```
```ts
// accounting.ts:580 — أي قيد تلقائي بتاريخ داخل فترة مغلقة → يعيد null
const closedPeriod = await tx.accountingPeriod.findFirst({ where: { organizationId, isClosed: true, startDate: { lte: data.date }, endDate: { gte: data.date } } });
if (closedPeriod) { if (data.isAutoGenerated) { console.warn(...); return null; } ... }
```
- **المشكلة:** المسار الموصى به هو إغلاق كل الفترات الشهرية أولاً (الكود يُصدر **تحذيراً** فقط إذا بقيت فترات مفتوحة — السطر 250-263)، أي أن فترة ديسمبر تكون **مغلقة** عند تشغيل إقفال السنة. لكن قيد الإقفال مؤرَّخ 31 ديسمبر (داخل الفترة المغلقة) وتلقائي، فيعيد `createJournalEntry` قيمة `null` بصمت. ورغم ذلك يُحفظ `YearEndClosing` بحالة `COMPLETED` و`closingJournalEntryId: null`. حسابات الإيراد والمصروف **لا تُصفَّر إطلاقاً** وأرباح 3200 لا تُرحَّل، بينما تعرض الواجهة "تم إقفال السنة بنجاح".
- **الأثر:** إقفال سنوي وهمي: قوائم الدخل تحتفظ بأرصدة السنة المقفلة، والأرباح المبقاة غير محدّثة، والعكس اللاحق (ACC-2) يجد `closingJournalEntryId = null` فلا يفعل شيئاً — كارثة محاسبية صامتة في العملية الأكثر حساسية في النظام.
- **اتجاه الحل:** إمّا استثناء قيود `YEAR_END_CLOSING`/`YEAR_END_RETAINED` من حارس الفترة المغلقة في `createJournalEntry` (فهي بطبيعتها تُرحَّل في فترة مغلقة)، أو رمي خطأ صريح إذا عاد `closingEntry = null` بدل الحفظ COMPLETED، أو تأريخ القيد بعد آخر فترة مغلقة.
- **يمس قائمة حمراء؟** لا (لكن الإصلاح الأنسب في `createJournalEntry` — طبقة حساسة).
- **حالة v6:** جديدة.

## ACC-3 — `payExpense` يقرأ paidAmount خارج الـ transaction ثم يكتب قيمة مطلقة {#acc3}
- **الشدة:** 🟠
- **الملف:** `packages/database/prisma/queries/org-finance.ts:865-931`
- **الكود الحالي:**
```ts
const expense = await db.financeExpense.findFirst({ ... }); // خارج الـ tx، بلا قفل
const newPaidAmount = Number(expense.paidAmount) + payAmount;
return db.$transaction(async (tx) => {
    await tx.financeExpense.update({ where: { id: data.expenseId }, data: { paidAmount: newPaidAmount, ... } });
```
- **المشكلة:** نفس فئة v6-4.1 التي أُصلحت في `deleteInvoicePayment` بـ `FOR UPDATE`، لكنها قائمة هنا. دفعتان جزئيتان متزامنتان تقرآن `paidAmount` نفسه؛ البنك يُخصم مرتين (atomic decrement)، بينما `paidAmount` يُكتب مرة → دفعة تضيع من السجل.
- **الأثر:** خصم بنكي مزدوج مع `paidAmount` ناقص → مصروف يظهر غير مسدَّد رغم خصم كامل المبلغ.
- **اتجاه الحل:** نقل القراءة داخل الـ tx مع `SELECT ... FOR UPDATE` (نمط `addInvoicePayment:1308`) أو `increment: payAmount` بحارس شرطي.
- **يمس قائمة حمراء؟** لا.
- **حالة v6:** جديدة (شقيقة 4.1).

## ACC-4 — انتقالات حالة السندات (قبض/صرف) غير ذرّية وبلا حارس تفاؤلي {#acc4}
- **الشدة:** 🟠
- **الملف:** `payment-vouchers.ts:446-469` (approve) و`638-659` (cancel)، `receipt-vouchers.ts:363-383` (issue) و`470-491` (cancel)
- **الكود الحالي:**
```ts
const dec = await db.organizationBank.updateMany({ ... decrement ... }); // خصم
const updated = await db.paymentVoucher.update({
    where: { id: input.id }, data: { status: "ISSUED", ... }, // ← بلا شرط status، خارج transaction
});
```
- **المشكلة:** (1) اعتمادان متزامنان لنفس السند يمرّان → خصم البنك مرتين. (2) حركة الرصيد وتغيير الحالة خارج transaction واحدة → انهيار بينهما يترك المال مخصوماً والسند معلقاً (إعادة الاعتماد تخصم ثانية). قارن بـ `updateClaimStatus:680-688` الذي حصل على الحارس التفاؤلي.
- **الأثر:** انحراف رصيد البنك التشغيلي عن دفتر الأستاذ تحت التزامن/الانقطاع.
- **اتجاه الحل:** لفّ حركة الرصيد + تغيير الحالة في `$transaction` واحدة، مع `updateMany({ where: { id, status: <المتوقعة> } })` + فحص count.
- **يمس قائمة حمراء؟** لا.
- **حالة v6:** جديدة.

## ACC-5 — تعديل المصروف/المقبوض إلى فترة مغلقة: عكس بلا إعادة إنشاء {#acc5}
- **الشدة:** 🟠
- **الملف:** `packages/api/modules/finance/procedures/expenses.ts:482-529`، `payments.ts:284-338`
- **الكود الحالي:**
```ts
await reverseAutoJournalEntry(db, { ... referenceType: "EXPENSE" ... }); // ينجح
await onExpenseCompleted(db, { ..., date: expense.date, ... });
// createJournalEntry يرجع null صامتاً إذا وقع التاريخ الجديد في فترة مغلقة
```
- **المشكلة:** إصلاح v6-2.15 طُبّق على `project-payments/update.ts` فقط (حارس `isPeriodClosed` — سليم ✅). المساران المكافئان لتعديل المصروف والمقبوض بلا الحارس: نقل مصروف COMPLETED إلى فترة مغلقة → العكس ينجح والإنشاء يُتخطى صامتاً (`JOURNAL_ENTRY_SKIPPED`) → مصروف بلا قيد نشط.
- **الأثر:** إيرادات/مصروفات تختفي من الدفتر مع بقاء المستند التشغيلي.
- **اتجاه الحل:** نسخ حارس `project-payments/update.ts` إلى `updateExpenseProcedure` و`updateOrgPaymentProcedure` (رفض مبكر إذا كان التاريخ القديم **أو** الجديد في فترة مغلقة).
- **يمس قائمة حمراء؟** لا.
- **حالة v6:** متبقية من v6 (2.15 — أُصلح مسار من ثلاثة).

## ACC-6 — إلغاء سحب شريك في فترة مغلقة: البنك يُسترد والقيد يبقى POSTED والخطأ يُبتلع {#acc6}
- **الشدة:** 🟠
- **الملف:** `packages/api/lib/accounting/auto-journal.ts:968-983` (`onOwnerDrawingCancelled`)، `owner-drawings.ts:722-765`
- **الكود الحالي:**
```ts
export async function onOwnerDrawingCancelled(db, data): Promise<void> {
    try { await reverseAutoJournalEntry(db, { ... }); }
    catch (error) { console.error("[AutoJournal] onOwnerDrawingCancelled failed:", error); } // ابتلاع كامل
}
```
- **المشكلة:** `reverseJournalEntry` يرمي في الفترة المغلقة، لكن الـ hook يبتلع الاستثناء داخلياً بـ console فقط → كتلة `catch` في `cancelDrawingProcedure` (التي تسجّل `JOURNAL_ENTRY_FAILED`) **كود ميت**. النتيجة: CANCELLED + رصيد مسترد بينما OWD-JE يبقى POSTED بلا أثر تدقيق.
- **الأثر:** انحراف دفتر/بنك صامت + فقدان أثر التدقيق.
- **اتجاه الحل:** حارس `isPeriodClosed` على تاريخ القيد قبل استرداد الرصيد في الـ procedure، أو إعادة رمي الخطأ من الـ hook.
- **يمس قائمة حمراء؟** نعم (auto-journal.ts) — الأسلم التعديل في الـ procedure.
- **حالة v6:** جديدة.

## ACC-16 — إلغاء فاتورة مدفوعة جزئياً لا يُحدّث رصيد البنك ولا يلغي سندات القبض {#acc16}
- **الشدة:** 🟠
- **الملف:** `packages/api/modules/finance/procedures/create-invoice.ts:405-443`
- **المشكلة:** إلغاء فاتورة ISSUED/PARTIALLY_PAID يعكس INV-JE وكل RCV-JE للدفعات (الجانب المحاسبي سليم ✅ — v6-2.2)، لكنه **لا يُنقص `OrganizationBank.balance`** بمبالغ الدفعات المعكوسة، ولا يعيد `paidAmount` إلى صفر، ولا يلغي سندات القبض التلقائية، ولا يستدعي `reconcileProjectPaymentEntries`. (نفس نمط V7-01: الجانب التشغيلي للبنك يُدار منفصلاً عن الـ GL.)
- **الأثر:** انحراف دائم بين رصيد البنك التشغيلي (يحتفظ بمبالغ فاتورة ملغاة) ودفتر الأستاذ (عُكس)، وسندات قبض ISSUED يتيمة توثّق أموال فاتورة ملغاة.
- **اتجاه الحل:** ضمن مسار الإلغاء: `decrement` رصيد البنك بمجموع الدفعات، تصفير `paidAmount`، إلغاء سندات القبض المرتبطة (كما في مسار حذف الدفعة الفردية).
- **يمس قائمة حمراء؟** لا.
- **حالة v6:** جديدة (v6 غطّى عكس القيد فقط في 2.2).

## ACC-17 — رواتب: GL البنك يُخصم كاملاً عند الاعتماد بينما الرصيد التشغيلي يُخصم لاحقاً لكل دفعة {#acc17}
- **الشدة:** 🟠
- **الملف:** `packages/api/lib/accounting/auto-journal.ts:521-544` (`onPayrollApproved`)، `payroll.ts:262-321`، وغياب حارس FACILITY_PAYROLL في `cancelExpense`
- **المشكلة:** اعتماد المسير ينشئ قيد PAY-JE يخصم كامل صافي الرواتب من GL البنك فوراً، بينما `OrganizationBank.balance` التشغيلي يُخصم فقط لاحقاً عند سداد كل دفعة مصروف موظف على حدة. النافذة بين الاعتماد والسداد = GL أقل من الرصيد التشغيلي. كما أن `cancelExpense` لا يمنع إلغاء صفوف المصروفات من نوع FACILITY_PAYROLL → يمكن إلغاء مصروف راتب دون عكس قيد المسير.
- **الأثر:** انحراف مؤقت (النافذة) ودائم (إلغاء مصروف راتب مفرد) بين الرصيد التشغيلي والـ GL.
- **اتجاه الحل:** توحيد توقيت خصم الرصيد التشغيلي مع قيد GL (خصم كامل عند الاعتماد أو ترحيل القيد لكل دفعة)، ومنع إلغاء مصروفات FACILITY_PAYROLL عبر المسار العام.
- **يمس قائمة حمراء؟** نعم (auto-journal.ts) — الأنسب التعديل في مسار الرواتب/المصروف.
- **حالة v6:** جديدة.

## ACC-18 — إفراج المحتجزات يخصم 2150 دون أن يقيّده أي hook عند الاستقطاع {#acc18}
- **الشدة:** 🟠
- **الملف:** `packages/api/lib/accounting/auto-journal.ts:1078-1092` (`onFinalHandoverCompleted`)، مقابل `subcontract-claims.ts:604` (استقطاع المحتجز من netAmount بلا قيد)
- **المشكلة:** عند اعتماد مستخلص باطن يُستقطع المحتجز (retention) من `netAmount` **دون** إنشاء قيد يقيّده في حساب المحتجزات 2150. لاحقاً عند الاستلام النهائي، `onFinalHandoverCompleted` يُنشئ قيد إفراج **يخصم (DR) 2150** — حساب لم يُقيَّد فيه شيء أصلاً.
- **الأثر:** رصيد 2150 (التزام محتجزات) يصبح سالباً/غير مبرَّر، مع تخفيض ذمم مدينة بلا أساس محاسبي مقابل.
- **اتجاه الحل:** إضافة قيد استقطاع المحتجز عند اعتماد المستخلص (CR 2150) ليكون للإفراج رصيد يخصم منه، أو مراجعة منطق قيد الإفراج.
- **يمس قائمة حمراء؟** نعم (auto-journal.ts).
- **حالة v6:** جديدة.

## ACC-7 — عكس إقفال السنة غير ذرّي (3 كتابات) {#acc7}
- **الشدة:** 🟡 (مكرر في محور 5 كـ EH-1)
- **الملف:** `year-end-closing.ts:771-798`
- **المشكلة:** عكس قيدَي الإقفال + تحديث حالة `YearEndClosing` ثلاث عمليات على `db` مباشرة. فشل بعد العكس الأول يترك قيد الإقفال REVERSED والسحوبات POSTED والسجل COMPLETED — حالة عالقة تتطلب تدخلاً يدوياً (إعادة المحاولة ترفض عكس المعكوس). التنفيذ نفسه ذرّي بالكامل — العكس فقط نسي ذلك.
- **اتجاه الحل:** لفّ الثلاث في `$transaction` وتمرير `tx` إلى `reverseJournalEntry`.
- **يمس قائمة حمراء؟** لا.
- **حالة v6:** جديدة.

## ACC-8 — سقف الإشعار الدائن يُفحص خارج القفل {#acc8}
- **الشدة:** 🟡 (مكرر في محور 4 كـ RC-2)
- **الملف:** `finance.ts:1720-1733` (الفحص) و`1753` (بداية الـ tx)
- **المشكلة:** v6-2.9 أصلح وحدات القياس، لكن الـ aggregate وفحص السقف يجريان **قبل** فتح الـ transaction وبلا `FOR UPDATE` على الفاتورة الأصلية. إشعاران دائنان متزامنان يمرّان معاً؛ و`paidAmount`/`newStatus` يُشتقان من قيمة قديمة.
- **الأثر:** مجموع الإشعارات يتجاوز إجمالي الفاتورة → إيراد سالب زائد و`paidAmount` متضخم.
- **اتجاه الحل:** نقل الـ aggregate والفحص داخل `$transaction` بعد `SELECT ... FOR UPDATE`.
- **حالة v6:** جديدة (التزامن لم يُغطَّ في v6).

## ACC-9 — حذف مقبوض مباشر لا يلغي سند القبض المرتبط {#acc9}
- **الشدة:** 🟡
- **الملف:** `payments.ts:355-406` (`deleteOrgPaymentProcedure`)
- **المشكلة:** يحذف الدفعة ويعكس القيد فقط. علاقة `ReceiptVoucher.paymentId` هي `SetNull`، ولا `receiptVoucher.updateMany({ status: "CANCELLED" })` كما في مسار حذف دفعة الفاتورة. السند التلقائي يبقى ISSUED يتيماً.
- **الأثر:** سند قبض يوثّق أموالاً محذوفة — تناقض مستندي أمام العميل وZATCA.
- **اتجاه الحل:** إلغاء السند قبل الحذف (نسخ الكتلة من `deleteInvoicePaymentProcedure`).
- **حالة v6:** جديدة.

## ACC-10 — قيد الأرصدة الافتتاحية بلا referenceId (dedup لا يحميه) {#acc10}
- **الشدة:** 🟡
- **الملف:** `accounting.ts:1844-1878` (`saveOpeningBalances`)
- **المشكلة:** الجزء الأساسي من v6-2.5 **أُصلح** (create+delete ذرّيان في `$transaction` عبر `existingTx` ✅). المتبقي: (1) dedup في `createJournalEntry:567` يتطلب `referenceId` غير مُمرَّر → حفظان متزامنان قد يُنشئان قيدَي OPN. (2) حذف القيد القديم لا يفحص الفترة المغلقة.
- **اتجاه الحل:** تمرير `referenceId: organizationId` ثابتاً + فحص `isPeriodClosed` قبل الحذف.
- **يمس قائمة حمراء؟** لا (accounting.ts طبقة حساسة).
- **حالة v6:** متبقية جزئياً من v6 (2.5).

## ACC-11 — `onPayrollApproved` يعود صامتاً عند غياب حساب الرواتب/البنك {#acc11}
- **الشدة:** 🟡
- **الملف:** `auto-journal.ts:509`
- **الكود الحالي:** `if (!salaryAccId || !bankAccId) return;` — بلا console.error وبلا orgAuditLog
- **المشكلة:** v6-2.11 أُصلح في ~15 hook، لكن هذا الفرع بقي صامتاً بالكامل (الفرع المجاور لغياب 2170 يسجّل!). ملاحظة: كل تسجيلات audit في الـ hooks مشروطة بـ `if (userId)`، وbackfill لا يمرر userId لمعظم الأنواع.
- **الأثر:** مسير رواتب معتمد بلا قيد وبلا أثر تدقيق.
- **اتجاه الحل:** إضافة نفس كتلة console.error + orgAuditLog؛ تمرير userId في backfill.
- **يمس قائمة حمراء؟** نعم (auto-journal.ts) — محصور بالتسجيل لا منطق القيد.
- **حالة v6:** متبقية جزئياً من v6 (2.11 — 15/17).

## ACC-12 — عدّادات backfill تحتسب التخطي الصامت "نجاحاً" + تتجاهل فئات GL المخصصة {#acc12}
- **الشدة:** 🟡
- **الملف:** `packages/api/lib/accounting/backfill.ts:65-74, 112-128`
- **المشكلة:** الـ hooks تعود null عند التخطي، لكن العدّاد يزيد دائماً (استثناء: owner drawings/capital تفحص jeId ✅) — تقرير backfill يوهم بالاكتمال. وقسم المصروفات لا يمرر `accountCode`/`isVatExempt` من `OrgCategory` كالمسار الحي → مصروفات الفئات المخصصة تُرحَّل إلى 6900 الافتراضي وبمعاملة VAT مختلفة.
- **اتجاه الحل:** عدّ النتيجة الفعلية؛ جلب `categoryRef.accountCode/isVatExempt` في backfill.
- **يمس قائمة حمراء؟** لا.
- **حالة v6:** جديدة.

## ACC-13 — بقايا float في توزيع أرباح الإقفال ومسارات مالية {#acc13}
- **الشدة:** 🟡
- **الملف:** `year-end-closing.ts:606-618, 633-639`، `org-finance.ts:882-908`
- **المشكلة:** v6-2.18/2.19 أُصلح جوهرياً (VAT كله عبر `VAT_RATE`/`VAT_DIVISOR_STR`، وقيود الإقفال Decimal متوازنة ✅). المتبقي: توزيع الأرباح و`retainedEarningsTransfer` المخزَّنان يُحسبان بـ float، و`payExpense`/تخصيصات الدفعات تجمع بـ Number.
- **الأثر:** انحرافات هللات بين `distributionDetails` المخزَّن وقيود Decimal؛ لا يكسر التوازن.
- **اتجاه الحل:** حساب التوزيع بـ `Prisma.Decimal` من `netProfitDecimal` الموجود أصلاً.
- **حالة v6:** متبقية جزئياً من v6 (2.18/2.19 — أُصلح الجوهر).

## ACC-14 — سجلات DEBUG لبيانات الفواتير + كتلة حراسة مكررة {#acc14}
- **الشدة:** ⚪ (مكرر في محور 8 كـ B2)
- **الملف:** `create-invoice.ts:76-87` و`378-397`
- **المشكلة:** (1) تسجيل تفصيلي لبنود الفواتير (أوصاف/أسعار عملاء) في server logs بكل إنشاء فاتورة. (2) كتلة منع إلغاء الإشعار الدائن مكررة حرفياً مرتين (378-385 ثم 390-397) — كود ميت.
- **اتجاه الحل:** حذف بلوك DEBUG والنسخة الثانية من الحارس.
- **حالة v6:** جديدة.

## ✅ فُحص ووُجد سليماً (المحاسبة)
- **v6-4.1** حذف دفعة الفاتورة: `finance.ts:1381-1442` — `FOR UPDATE` + قراءة داخل الـ tx + `Decimal.max(…,0)`. **أُصلح بالكامل** (تأكيد يدوي).
- **v6-4.2** اعتماد المستخلص المزدوج: `project-finance.ts:680-688` — حارس تفاؤلي + قفل عقد + إعادة فحص السقف داخل الـ tx (مع اختبار `concurrent-claims.test.ts`). **أُصلح** (تأكيد يدوي).
- **v6-5.1/5.2** حذف/تعديل دفعة مصروف الشركة: `$transaction` واحدة + حارس رصيد سالب. **أُصلح.**
- `createJournalEntry`: توازن Decimal صارم، dedup بالمرجع، فحص فترة مغلقة **مُنتظَر داخل الـ tx**، تحقق ملكية الحسابات، `existingTx`. **متين.**
- `reverseJournalEntry`: عكس+ترحيل+وسم REVERSED ذرّياً في `$transaction`. **متين.**
- إلغاء فاتورة ISSUED: يعكس INV-JE **و** كل RCV-JE لدفعاتها، ومنع إلغاء الإشعار الدائن من المسار العام (الجانب المحاسبي فقط — الجانب التشغيلي للبنك في ACC-16).
- الإقفال السنوي (بناء الأسطر): أسطر Decimal، سطر 3200 مشتق من المجموع المقرَّب (يتوازن دائماً)، dedup بـ `year-end-${fiscalYear}` (لكن ترحيل القيد نفسه معطوب — ACC-15/ACC-2).
- تقارير VAT: Decimal طوال الطريق، `isVatExempt` من OrgCategory (v6-2.16 مُصلح). `getTrialBalance`: POSTED+REVERSED بثبات.

---

# 3. الأمان متعدد المستأجرين والصلاحيات {#3}

> **الخلاصة:** البنية الأمنية قوية والنمط السائد سليم. ثغرة IDOR عابرة واحدة مؤكدة (V7-01 — انظر محور 2)، وناقلا قراءة ملفات، وفجوات صلاحيات داخل المنظمة. كل الكود الجديد الجوهري (dashboard، hero cards، unified-quantities، leads) مُنطاق بشكل صحيح فيما عدا ما يلي، وإصلاحات v6 العشرة التي فُحصت بالعيّنة لا تزال قائمة.

## V7-01 — كتابة رصيد بنك عابرة للمستأجرين
انظر [محور 2 / V7-01](#v701) — 🔴 الثغرة الأمنية الوحيدة العابرة للمستأجرين.

## V7-03 — /image-proxy بلا أي مصادقة {#v703}
- **الشدة:** 🟠 (فجوة تفويض — قراءة ملفات عابرة، حتى دون مصادقة / مؤكَّد يدوياً)
- **الملف:** `apps/web/app/image-proxy/[...path]/route.ts:25-48` + `apps/web/proxy.ts:87`
- **الكود الحالي:**
```ts
const allowedBuckets = [config.storage.bucketNames.avatars, ATTACHMENTS_BUCKET];
if (!allowedBuckets.includes(bucket)) return new Response("Not found", { status: 404 });
const signedUrl = await getSignedUrl(filePath, { bucket, expiresIn: 60 * 60 }); // بلا فحص جلسة/ملكية
```
والـ matcher في `proxy.ts:87` يستثني `image-proxy` صراحةً.
- **المشكلة:** الـ route لا يفحص جلسة ولا عضوية منظمة ولا ملكية المفتاح — يتحقق من اسم الـ bucket فقط ثم يوقّع أي مسار لساعة. أي طرف (بما فيهم غير مصادَق) يعرف مفتاح كائن يحصل على signed URL. التخفيف الوحيد: مفاتيح UUID/cuid يصعب تخمينها — لكنها تتسرب عبر مشاركة الروابط أو V7-02، والـ URL يبقى صالحاً بعد إزالة العضو من المنظمة.
- **الأثر:** وصول دائم غير قابل للإبطال لمرفقات مالية/مستندات مشاريع لمن حصل على المسار مرة (موظف سابق مثلاً). هذا مُضخِّم V7-02.
- **اتجاه الحل:** فحص جلسة في الـ route + التحقق أن `organizationId` المضمّن في بادئة المسار ضمن منظمات المستخدم (المسارات تبدأ بـ `attachments/{orgId}/…`)؛ مع مسار استثناء لصور بوابة المالك عبر token.
- **حالة v6:** جديدة (لم تُفحص في v6 التي ركّزت على إجراءات API).

## V7-02 — مسار تخزين يتحكم به العميل يُحفظ بلا تحقق (ملفات Leads) {#v702}
- **الشدة:** 🟠
- **الملف:** `packages/api/modules/pricing/procedures/leads/files/save-file.ts:19, 50-51`
- **الكود الحالي:**
```ts
storagePath: z.string().trim().min(1).max(500),   // سلسلة حرة من العميل
...
fileUrl: input.storagePath, storagePath: input.storagePath, // تُحفظ كما هي
```
- **المشكلة:** `get-upload-url.ts:45` يفرض مفتاحاً من الخادم `leads/{orgId}/{leadId}/{uuid}.{ext}`، لكن `save-file` لا يعيد التحقق أن `storagePath` المُرسَل يبدأ بذلك. `leadId` مُتحقَّق منه — الثغرة في المفتاح. يمكن POST مفتاح كائن اختياري (مفتاح مرفق منظمة أخرى) فيُخزَّن ويُعاد عبر `get-by-id`.
- **الأثر:** تخزين مرجع لأي كائن ثم حلّه إلى signed URL (عبر V7-03) = قراءة ملف عابرة متى عُرف المفتاح.
- **اتجاه الحل:** التحقق `input.storagePath.startsWith(\`leads/${input.organizationId}/${input.leadId}/\`)`، أو تجاهل قيمة العميل وإعادة بناء المفتاح.
- **حالة v6:** جديدة.

## SEC-3.1 — وحدة التصدير (7 endpoints) تتجاوز حجب المشاريع والصلاحيات الدقيقة {#sec31}
- **الشدة:** 🟠 (تجاوز صلاحيات داخل المنظمة — لا يعبر المستأجر)
- **الملف:** `packages/api/modules/exports/procedures/*` — `export-claims-csv/expenses-csv/issues-csv`, `generate-claim-pdf/update-pdf/weekly-report/calendar-ics`
- **المشكلة:** كلها تكتفي بـ `verifyOrganizationMembership` بلا `verifyProjectAccess` (تجاوز حجب المشاريع للأعضاء المقيَّدين) وبلا تدقيق صلاحية دقيقة (عضو بلا `finance.view` يصدّر مبالغ المستخلصات/المصروفات). البيانات مقيّدة بالمنظمة عبر العلاقة فلا تسريب عبر المستأجرين.
- **اتجاه الحل:** إضافة `verifyProjectAccess` + فحص الصلاحية القسمية المناسبة قبل التصدير.
- **حالة v6:** جديدة.

## SEC-3.2 — `subcontracts/copy-items` بلا ربط بالمشروع المُتحقَّق {#sec32}
- **الشدة:** 🟠 (نطاق نفس المنظمة)
- **الملف:** `packages/api/modules/subcontracts/procedures/copy-items.ts`
- **المشكلة:** لا يربط `sourceContractId`/`targetContractId` بـ `projectId` المُتحقَّق (بخلاف `create-item.ts` الذي يستدعي `getSubcontractById`). عضو بصلاحية على مشروع واحد يستطيع نسخ بنود بين عقود أي مشروعين في المنظمة.
- **اتجاه الحل:** التحقق أن كلا العقدين يخصان المشروع/المنظمة قبل النسخ.
- **حالة v6:** جديدة.

## V7-04 — نقطتا كتابة تستخدمان protectedProcedure بدل subscriptionProcedure {#v704}
- **الشدة:** 🟡 (تجاوز بوابة الاشتراك — ليست IDOR)
- **الملف:** `onboarding/set-default-template.ts:7`، `onboarding/setup-company-info.ts:6`
- **المشكلة:** كلاهما endpoint كتابة يستخدم `protectedProcedure`. لا IDOR (كلاهما مُفوَّض بالمنظمة صحيحاً)، لكنهما يتجاوزان بوابة الاشتراك المطبّقة على بقية الكتابات.
- **اتجاه الحل:** ترقية إلى `subscriptionProcedure` (أو تأكيد أن onboarding يُقصد قبل الاشتراك).
- **حالة v6:** جديدة.

## SEC — ملاحظات ⚪ منخفضة
- **V7-05:** `quantities/procedures/costing.ts:660` — `costStudy.findFirst({ where: { id } })` بلا organizationId لقراءة `overheadPercent` (البنود نفسها مُنطاقة). تسريب نسبة واحدة لمعرّف مُخمَّن.
- **V7-06:** `unified-quantities/context/upsert-space.ts:88`, `upsert-opening.ts:42` — التحقق أن العنصر يخص المنظمة دون التحقق أنه يخص `costStudyId` المحدد → نقل عنصر بين دراستين داخل نفس المنظمة (نزاهة بيانات، لا خرق مستأجر).
- **SEC-3.3:** رمز رابط المشاركة يستخدم cuid2 بدل `randomBytes(32)` المستخدم في بوابة المالك — دفاع بالعمق فقط (محمي بحدّ IP + انتهاء + إبطال).

## ✅ فُحص ووُجد سليماً (الأمان)
- **Hero Carousel + UserDashboardPreference:** كل الإجراءات مُنطاقة، والمقاييس المالية/المشاريع **تُجرَّد على الخادم بالـ RBAC** (`dashboard/router.ts:285-300`) لا بالواجهة؛ التفضيل مُنطاق للمستخدم بمفتاح `userId_organizationId`.
- **البحث الشامل (org-scoping):** كل الكيانات الثمانية مُفلترة بـ `organizationId`؛ الأقسام مُبوَّبة بصلاحيات العضو. (فجوة نطاق المشاريع في FE-01.)
- **unified-quantities/quantities/pricing-leads بالكامل:** الملكية عبر `requireStudyAccess`/`loadStudy`/`loadItem`؛ الربط عبر المستأجرين ممنوع صحيحاً؛ الكتابات `subscriptionProcedure`.
- **حقن دور عابر:** `org-users` يتحقق `role.organizationId !== organizationId → throw`.
- **خريطة صلاحيات AI:** fail-closed مؤكد، كل الأدوات الـ 35 في `TOOL_PERMISSION_MAP`.
- **حدود المعدّل (oRPC):** READ 60 / WRITE 20 / STRICT 5 / PUBLIC_FORM 3 / OWNER_EXCHANGE 5 (Redis + circuit breaker).
- **بوابة المالك:** `randomBytes(32)` + حدود معدّل + تأخير ضد التخمين.
- **إصلاحات v6 (عيّنة):** banks (3.1)، payment-vouchers (3.2)، leave-types (3.10)، company expense-payments/allocations/assignments — كلها ما زالت مُغلقة.

---

# 4. التضارب والتكرار (Race Conditions + Duplication) {#4}

## RC-1 — نافذة اعتماد مزدوج في الرواتب وترحيل المصروفات المتكررة {#rc1}
- **الشدة:** 🟠
- **الملف:** `packages/database/prisma/queries/payroll.ts:234-321` (`approvePayrollRun`)، `expense-runs.ts:222-311` (`postExpenseRun`)
- **الكود الحالي:**
```ts
const run = await db.payrollRun.findFirst({ where: { id, ..., status: "DRAFT" } }); // خارج الـ tx
return db.$transaction(async (tx) => {
    await tx.financeExpense.createMany({ ... }); // مصروف لكل موظف
    return tx.payrollRun.update({ where: { id: runId }, data: { status: "APPROVED" } }); // بلا شرط status
```
- **المشكلة:** فحص `status: "DRAFT"` بقراءة خارج الـ tx، والتحديث النهائي غير مشروط بالحالة. ضغطتان متزامنتان على "اعتماد" تمرّان معاً.
- **الأثر:** إنشاء **ضعف** مصروفات الرواتب/المتكررة (لا unique على `sourceType/sourceId`) → تضخم المصروفات والقيود عند السداد.
- **اتجاه الحل:** داخل الـ tx قبل `createMany`: `updateMany({ where: { id: runId, status: "DRAFT" }, data: {...} })` + فحص `count === 0` (نمط `updateClaimStatus`).
- **حالة v6:** متبقية جزئياً (شق الـ timeout 6.1/6.2 أُصلح فعلاً — الأرقام محجوزة دفعة واحدة + createMany؛ نافذة الاعتماد المزدوج باقية).

## RC-2 — سقف الإشعار الدائن يُفحص خارج القفل {#rc2}
مكرر — انظر [ACC-8](#acc8). 🟠

## RC-3 — فحص تكرار القيود التلقائية بـ findFirst + @@index (ليس @@unique) {#rc3}
- **الشدة:** 🟠
- **الملف:** `packages/database/prisma/queries/accounting.ts:567-577`، و`schema.prisma:5736`
- **الكود الحالي:**
```ts
const existing = await tx.journalEntry.findFirst({ where: { organizationId, referenceType, referenceId, status: { not: "REVERSED" } } });
if (existing) return existing;
```
```prisma
@@index([organizationId, referenceType, referenceId])   // ❌ index وليس unique
```
- **المشكلة:** فحص تكرار TOCTOU: عمليتان متزامنتان (double-fire أو retry بعد timeout) كلاهما يجد `existing = null` تحت READ COMMITTED ثم يُنشئ قيداً بـ entryNo مختلف (التسلسل ذري فلا P2002). لا قيد DB يمنع ذلك.
- **الأثر:** قيد تلقائي مزدوج لنفس المرجع → إيراد/ذمم مضاعفة في التقارير (يصعب اكتشافه لأن كل قيد متوازن).
- **اتجاه الحل:** partial unique index خام عبر migration SQL: `CREATE UNIQUE INDEX ... ON journal_entries (organization_id, reference_type, reference_id) WHERE status != 'REVERSED' AND is_auto_generated = true;` + التقاط P2002 في `createJournalEntry` (لا يمكن التعبير عنه بـ `@@unique` بسبب شرط الحالة).
- **يمس قائمة حمراء؟** نعم (schema.prisma).
- **حالة v6:** متبقية من v6 (4.2 — الشق المحاسبي).

## RC-4 — عكس القيد بلا حارس تفاؤلي — عكس مزدوج متزامن ممكن {#rc4}
- **الشدة:** 🟡
- **الملف:** `accounting.ts:689-743` (`reverseJournalEntry`)
- **المشكلة:** فحص `POSTED` خارج الـ tx، والتعليم النهائي `update` غير مشروط بـ `status: "POSTED"`. ولأن قيد العكس `isAutoGenerated: false` فلا ينطبق عليه dedup. طلبا عكس متزامنان (إلغاء فاتورة مرتين بسرعة) يمرّان معاً → قيدا REV-JE.
- **اتجاه الحل:** داخل الـ tx: `updateMany({ where: { id: entryId, status: "POSTED" } })` + فحص count قبل إنشاء العكس.
- **يمس قائمة حمراء؟** لا.
- **حالة v6:** جديدة.

## RC-5 — انتقالات حالة الفاتورة تُفحص بقراءة ثم تُكتب بلا شرط {#rc5}
- **الشدة:** 🟡
- **الملف:** `create-invoice.ts:352-403` + `finance.ts:1249-1279` (`updateInvoiceStatus`)
- **المشكلة:** التحقق من الانتقال المسموح على قراءة منفصلة ثم `update` غير مشروط وبلا قفل. (أ) إلغاءان متزامنان يستدعيان عكس القيود مرتين (يتقاطع مع RC-4)؛ (ب) إلغاء متزامن مع دفعة قد يكتب CANCELLED فوق فاتورة صارت PAID مع بقاء الدفعة.
- **اتجاه الحل:** `updateMany({ where: { id, organizationId, status: currentInvoice.status } })` + فحص count، أو `FOR UPDATE`.
- **حالة v6:** جديدة.

## RC-6 — قفل ترقيم مستخلصات المشروع لا يعمل عند غياب العقد → P2002 عارٍ {#rc6}
- **الشدة:** 🟡
- **الملف:** `project-finance.ts:500-552` (`createProjectClaim`)
- **المشكلة:** الترقيم MAX+1 صحيح، لكن الحماية الوحيدة قفل صف العقد — و`FOR UPDATE` على استعلام بلا نتائج **لا يقفل شيئاً**. مشروع بلا `ProjectContract` (مسموح) → إنشاءان متزامنان يحسبان نفس `claimNo` → P2002 على `@@unique([projectId, claimNo])` يصعد 500 خام (هذا المسار غير ملفوف بـ `withUniqueRetry` بخلاف `project-payments.ts:479`).
- **اتجاه الحل:** القفل على صف المشروع نفسه (موجود دائماً)، أو لفّ بـ `withUniqueRetry`.
- **حالة v6:** جديدة.

## RC-7 — ترحيل الدراسات القديمة: فحص idempotency خارج الـ transaction {#rc7}
- **الشدة:** 🟡
- **الملف:** `unified-quantities/procedures/migrate-legacy-study.ts:49-56, 162-263`؛ `schema.prisma:6588-6595` (لا unique على QuantityItem)
- **المشكلة:** ضمانة "Idempotent" تعتمد `count() === 0` المقروء قبل الـ tx. استدعاءان متزامنان يريان 0. الحارس العرضي (`quantityItemContext.create` unique على costStudyId) لا يُنفَّذ إذا كانت الدراسة بلا buildingConfig → يمرّ `createMany` مرتين. لا مستدعٍ من الواجهة بعد (grep فارغ) — التعرض عبر API مباشرة أو عند الربط لاحقاً.
- **الأثر:** كل بنود الدراسة مكررة ×2 (كميات وأسعار مضاعفة في التجميع).
- **اتجاه الحل:** نقل فحص count داخل الـ tx بعد `SELECT ... FOR UPDATE` على صف الدراسة، أو partial unique على `sourceItemId`.
- **حالة v6:** جديدة (كود بعد v6).

## ✅ فُحص ووُجد سليماً (التضارب)
- **v6-4.1/4.2/4.3:** كلها أُصلحت (تأكيد يدوي لـ 4.1، 4.2) — قفل FOR UPDATE + قراءة داخل الـ tx + حارس تفاؤلي + `@@unique([contractId, paymentNo/claimNo])`.
- **v6-6.1/6.2:** حلقات N+1 في الرواتب/المتكررة أُصلحت — `generateAtomicNoBatch` + `createMany` + UPDATE واحد بـ VALUES join.
- **مولّد التسلسلات** (`sequences.ts`): `INSERT ... ON CONFLICT ... RETURNING` ذري بالكامل.
- **حراس رصيد البنك (`gte`):** كل السحوبات الصادرة محمية عبر `org-finance.ts`, `subcontract.ts`, `subcontract-claims.ts`, `company.ts`.
- **دفعات المشروع:** MAX+1 + قفل عقد + `withUniqueRetry` (النمط المرجعي الصحيح).
- **ازدواجية مجاميع الفاتورة FE/BE:** الخادم يعيد الحساب دائماً ولا يثق بمجاميع العميل؛ mirror موثّق بتقريب HALF_UP مطابق.

---

# 5. معالجة الأخطاء والذرية {#5}

## EH-3 — 45 موقع JOURNAL_ENTRY_FAILED بلا await → قد يضيع على serverless {#eh3}
- **الشدة:** 🟠
- **الملف:** 19 ملفاً — أبرزها `create-invoice.ts` (7)، `expenses.ts` (7)، `payments.ts` (3)، `owner-drawings.ts:596`، `expense-payments.ts:151,195`، `payment-side-effects.ts:69`، `project-payments/update.ts:125,196`، `payroll.ts:241,300`، وtransfers/receipt-vouchers/payment-vouchers/subcontracts/handover
- **الكود الحالي:**
```ts
} catch (e) {
    console.error("[AutoJournal] ...", e);
    orgAuditLog({ ..., action: "JOURNAL_ENTRY_FAILED", ... });  // بلا await
}
```
- **المشكلة:** توثيق `orgAuditLog` نفسه (`org-audit.ts:12-15`) ينص: *"critical callers (e.g. JOURNAL_ENTRY_FAILED) can await it..."* — رغم ذلك **45 استدعاء بلا await مقابل 24 بـ await**. تجميد Vercel بعد إرجاع الاستجابة قد يُسقط الكتابة.
- **الأثر:** سجل التدقيق هو **الأثر الوحيد** لقيد محاسبي مفقود (القاعدة الصامتة §18.1) — فقدانه = قيد مفقود بلا أي أثر، يستحيل الـ backfill لاحقاً.
- **اتجاه الحل:** `await orgAuditLog(...)` في كل مسار JOURNAL_ENTRY_FAILED (الدالة never-throws فلا خطر). سجلات التدقيق العادية (~85 موقعاً) يمكن تركها fire-and-forget بوعي.
- **حالة v6:** متبقية جزئياً (امتداد 5.5).

## EH-4 — throw new Error برسائل عربية للمستخدم تصل كـ 500 مبهم {#eh4}
- **الشدة:** 🟠
- **الملف:** طبقتان — **Procedures (~20 موقعاً في 12 ملفاً):** `transfers.ts:93`، `payments.ts:103`، `expenses.ts:151`، `bank-reconciliation.ts:43`، `company-expenses.ts:113`، `expense-runs.ts:87,126`، `organization-owners.ts:124,188,285,303,393,405`، `recurring-entries.ts:97,122`، `bulk-update-pricing.ts:30`. **طبقة الاستعلام: ~290 موقعاً في 28 ملفاً** (`finance.ts`: 64، `org-finance.ts`: 30، `accounting.ts`: 25…).
- **الكود الحالي:**
```ts
throw new Error(`دورة مصروفات لشهر ${input.month}/${input.year} موجودة بالفعل`); // expense-runs.ts:126
throw new Error(`مجموع نسب الملكية سيتجاوز 100%...`); // organization-owners.ts:188
```
- **المشكلة:** لا mapping عام في `orpc/handler.ts` — أي Error غير ORPCError يصل INTERNAL_SERVER_ERROR بلا رسالة. مسارات مؤكدة غير ملفوفة: `updateInvoice`/`updateInvoiceItems`/`deleteInvoice` (رسائل "لا يمكن تعديل فاتورة مُصدرة")، وقيود اليومية (`journal-entries.ts:223,316,497` → رسائل الفترة المغلقة).
- **الأثر:** المستخدم يرى "خطأ غير متوقع" بدل السبب الفعلي + ضجيج زائف في Sentry.
- **اتجاه الحل:** interceptor عام يحوّل Error برسالة عربية إلى `ORPCError("BAD_REQUEST")`، أو لفّ المسارات المذكورة أولاً (فواتير + قيود يومية + expense-runs + organization-owners).
- **حالة v6:** متبقية من v6 (5.7).

## EH-1 — عكس إقفال السنة: 3 كتابات خارج transaction {#eh1}
مكرر — انظر [ACC-7](#acc7). 🟠

## EH-2 — حذف دفعة فاتورة: إلغاء سند القبض خارج معاملة الحذف {#eh2}
- **الشدة:** 🟠
- **الملف:** `create-invoice.ts:713-726`
- **الكود الحالي:**
```ts
await db.receiptVoucher.updateMany({ where: { invoicePaymentId: input.paymentId, ... }, data: { status: "CANCELLED" } });
await deleteInvoicePayment(input.paymentId, input.invoiceId, input.organizationId);
```
- **المشكلة:** `deleteInvoicePayment` نفسها ذرّية ممتازة، لكن إلغاء السند يسبقها ككتابة مستقلة. فشل الحذف (Payment not found / خطأ DB) يترك السند CANCELLED بينما الدفعة قائمة ورصيد البنك لم يُمس.
- **الأثر:** سند قبض ملغى يوثّق دفعة حقيقية — تناقض أمام العميل وZATCA.
- **اتجاه الحل:** نقل `receiptVoucher.updateMany` داخل معاملة `deleteInvoicePayment` (تمرير tx).
- **حالة v6:** جديدة.

## EH-6 — إنشاء مستند: سجل الإصدار الأول floating promise مبتلَع {#eh6}
- **الشدة:** 🟠
- **الملف:** `packages/api/modules/project-documents/procedures/create-document.ts:95-106`
- **الكود الحالي:**
```ts
if (input.uploadType === "FILE" && input.storagePath && input.fileName) {
    db.documentVersion.create({ data: { documentId: document.id, versionNumber: 1, ... } }).catch(() => {}); // fire-and-forget
}
```
- **المشكلة:** بلا `await` وبـ catch فارغ — فشل الإنشاء (أو تجميد serverless) يترك المستند بلا سجل الإصدار 1 بصمت. الشقيق `upload-version.ts:60` يفعلها داخل `$transaction`.
- **الأثر:** تاريخ إصدارات ناقص: أول upload-version لاحق ينشئ version 2 بينما version 1 غير موجود.
- **اتجاه الحل:** `await` داخل `$transaction` مع إنشاء المستند.
- **حالة v6:** جديدة.

## EH-5 — unified-quantities: حلقات تحديث جماعي بلا $transaction {#eh5}
- **الشدة:** 🟡
- **الملف:** `unified-quantities/procedures/pricing/bulk-update-pricing.ts:34-72`، `pricing/update-global-markup.ts:24-71`
- **المشكلة:** تحديث الدراسة ثم N تحديث بند في حلقة على `db` مباشرة. فشل في منتصف الحلقة يترك بعض البنود بالتسعير الجديد وبعضها بالقديم، و`aggregateStudyTotals` لا تُنفَّذ → إجماليات قديمة مقابل بنود نصف محدّثة. (`reorder-items.ts:25` يستخدم `$transaction` صحيحاً.)
- **اتجاه الحل:** `db.$transaction(items.map(...))`.
- **حالة v6:** جديدة.

## EH-7 — حارس الفترة المغلقة الداخلي يُبتلَع بواسطة catch القيود {#eh7}
- **الشدة:** 🟡
- **الملف:** `project-payments/procedures/update.ts:170-204`
- **المشكلة:** رسالة الحارس (`throw new Error("لا يمكن تعديل دفعة إلى تاريخ في فترة مغلقة")`) داخل نفس try الذي يبتلع أخطاء القيود. عملياً محدود بفضل حارس ORPCError مكافئ قبل أي كتابة (السطور 60-66)، لكنه نمط مضلّل: throw داخل catch-يبتلع = رسالة ميتة.
- **اتجاه الحل:** نقل `isPeriodClosed` خارج الـ try، أو `if (e instanceof ORPCError) throw e`.
- **حالة v6:** جديدة.

## EH-8 — `nullishTrimmed`/`.trim().optional()` نمط مركزي يناقض القاعدة 5.11 {#eh8}
- **الشدة:** ⚪ (حوكمة — ليست خللاً مؤكداً)
- **الملف:** `packages/api/lib/validation-constants.ts:26-29` + 84 موقع `.nullish()` في 18 ملف procedures
- **الكود الحالي:**
```ts
export const optionalTrimmed = (max) => z.string().trim().max(max).optional();
export const nullishTrimmed = (max) => z.string().trim().max(max).nullish();
```
- **المشكلة:** CLAUDE.md 5.11 يحظر النمطين ("يكسر oRPC serialization")، بينما ملف الثوابت المركزي يُصدّرهما ويُستهلكان في مسارات إنتاجية تعمل فعلاً (عقود، مشاريع، باطن). إمّا القاعدة قديمة/مبالغ فيها (الخطر الأصلي في مخططات الإخراج لا الإدخال) أو مشكلة كامنة واسعة.
- **اتجاه الحل:** حسم بتجربة runtime واحدة (إرسال null على endpoint يستخدم `nullishTrimmed`) ثم تحديث القاعدة 5.11 بالنطاق الفعلي للخطر.
- **حالة v6:** جديدة (رصد تناقض).

## ✅ فُحص ووُجد سليماً (الذرية)
- **v6-5.1/5.2:** حذف/تعديل دفعة مصروف الشركة داخل `$transaction` مع حارس رصيد + `await orgAuditLog` عند الفشل. **أُصلح.**
- **v6-5.4:** مساهمات رأس المال في الإقفال: `groupBy` مباشر بلا ابتلاع. **أُصلح.**
- **v6-5.5:** فشل السند التلقائي يُسجَّل في audit (مُخفَّف؛ القيد ضمن EH-3).
- البحث الشامل + hero preference + `reorder-items`/`apply-preset`: ORPCError صحيح، `$transaction`/`createManyAndReturn`، بلا ابتلاع.
- `deleteInvoicePayment`: قفل FOR UPDATE + قراءة داخل المعاملة.
- ابتلاعات مقبولة بوعي: onboardingProgress (علم UX)، email-queue (sweep 24h)، zatca csr-generator (تنظيف مؤقت)، auto-journal:105 fallback موثّق.

---

# 6. الأداء {#6}

> **الاتجاه إيجابي بوضوح:** كل نواقص v6 الكبرى أُغلقت — `no-store` على `/app/*` أُزيل (الآن `private, max-age=60, SWR=300`)، prefetch الخادمي لم يعد self-HTTP (in-process عبر `orpcServer`)، `getFullOrganization` خرج من المسار الحرج، والرواتب/المتكررة batched. **لا 🔴.**

## PERF-1 — تحديث تقدم الأنشطة: N تحديثات داخل transaction + مصفوفة غير محدودة {#perf1}
- **الشدة:** 🟠
- **الملف:** `project-execution/procedures/bulk-update-progress.ts:17-23`، `queries/project-execution.ts:343-378`
- **المشكلة:** القراءة المسبقة أُصلحت (findMany واحد)، لكن يبقى: (1) تحديث لكل نشاط داخل interactive transaction (N متسلسلة)؛ (2) `recalculateMilestoneProgress` (2-5 استعلامات) متسلسلة لكل معلم؛ (3) `updates` بلا `.max()`. تحديث 100 نشاط ≈ 2.5 ثانية داخل الـ tx (مهلة Prisma 5s) + احتجاز اتصال من pool الـ 5.
- **اتجاه الحل:** `.max(200)` + UPDATE واحد بـ VALUES join (نمط `payroll.ts:299`) + `groupBy` للمعالم بدل حلقة.
- **حالة v6:** متبقية جزئياً.

## PERF-2 — اعتماد مستخلص باطن: aggregate لكل بند داخل transaction مع قفل {#perf2}
- **الشدة:** 🟠
- **الملف:** `subcontract-claims.ts:676-699`
- **المشكلة:** aggregate منفصل لكل بند — مستخلص بـ 40 بنداً = 40 استعلاماً متسلسلاً ≈ ثانية، أثناء إمساك قفل صف العقد وداخل interactive transaction.
- **اتجاه الحل:** `groupBy(["contractItemId"])` واحد بـ `{ in: [...] }` ثم التحقق في الذاكرة (نمط `prevQtyMap` الموجود في نفس الملف).
- **حالة v6:** جديدة.

## PERF-5 — بطاقات KPI في قائمة المدفوعات تُجمَع محلياً فوق صفحة limit:200 {#perf5}
- **الشدة:** 🟠
- **الملف:** `apps/web/modules/saas/finance/components/payments/PaymentsList.tsx:149-162` (limit:200)، التجميع 216-233
- **المشكلة:** المؤشر الرئيسي `totalPayments` صحيح من الخادم، لكن بطاقتَي "إجمالي هذا الشهر" و"المكتمل" تُحسبان فوق أول 200 صف فقط. منظمة نشطة > 200 دفعة → أرقام مالية ناقصة صامتة + نقل 200 صف للجمع.
- **اتجاه الحل:** إرجاع `monthTotal`/`completedTotal` كتجميعات من `finance.orgPayments.list`.
- **حالة v6:** متبقية من v6 (النمط نفسه، موضع لم يُغطَّ — الموضع المؤكد الوحيد المتبقي بعد مسح شامل).

## PERF — بنود 🟡/⚪
- **PERF-3 (🟡):** `issueInvoice` (`finance.ts:1578-1584`) تحدّث كل بند منفصلاً داخل tx (فاتورة 30 بنداً ≈ 750ms). `updateInvoiceItems` في نفس الملف يستخدم createMany — فقط issueInvoice بقي قديماً.
- **PERF-4 (🟡):** إلغاء فاتورة يعكس قيود التحصيل واحداً واحداً (`create-invoice.ts:420-431`) — فاتورة 10 دفعات ≈ 40-70 استعلاماً. الحل `Promise.all` أو دالة عكس جماعية (**يمس auto-journal — يتطلب موافقة**).
- **PERF-6 (🟡):** `projects/[projectId]/layout.tsx:29-34` يستدعي `getEffectivePermissions`/`getUserProjectScope` من `@repo/database` **بلا cache** رغم وجود `getCachedUserPermissions`/`getCachedUserProjectScope` (30s) — 2 استعلامَي صلاحيات مكرران × 25ms لكل تنقّل داخل 56+ صفحة مشروع.
- **PERF-7 (⚪):** استعلام Purchases مكرر (user-level في root layout + org-level في app layout) — مفتاحا cache مختلفان.
- **PERF-8 (⚪):** إحصاءات الفواتير/العروض (`finance-reports.ts:363-411`) = 12 استعلاماً حيث يكفي `groupBy` واحد.
- **PERF-9 (⚪):** فوتر جدول BOQ يعرض مجموع الصفحة (limit:50) بعنوان "الإجمالي" — التباس عرض (الإجمالي الصحيح في `BOQSummaryCards`).

## ✅ فُحص ووُجد سليماً (الأداء)
- **البحث الشامل:** 8 استعلامات متوازية، `take:5` لكل نوع، **debounce 250ms** + staleTime + enabled gating، صلاحيات من cache 30s — لا استعلام لكل ضغطة.
- **v6-6.1/6.2:** رواتب/متكررة batched بالكامل (VALUES join). **لا تراجع.**
- **Cache-Control /app/*:** `no-store` أُزيل → `private, max-age=60, SWR=300` + `experimental.staleTimes`.
- **prefetch الخادمي:** in-process عبر `orpcServer` (لا self-HTTP) مع جلسة React-cached.
- **getFullOrganization:** خارج المسار الحرج (استُبدل بـ `getActiveOrganization` مفهرس + React cache).
- **dashboard.getAll:** ~25 استعلاماً كلها `Promise.all` (لكن انظر FE-04 لاستعلامات لا يستهلكها أحد).
- **تقارير المحاسبة:** raw SQL بـ GROUP BY واحد — لا N+1.
- **الفهارس:** تغطية شاملة على الأعمدة الساخنة (JournalEntry, FinanceInvoice ×12، ProjectAlert…).

---

# 7. Schema والبيانات {#7}

## SD-01 — قيد dedup القيود التلقائية @@index وليس @@unique {#sd01}
مكرر — انظر [RC-3](#rc3). 🟠 — يمس قائمة حمراء (schema.prisma).

## SD-02 — `UserInvitation` بلا علاقات FK ولا فهرس — صفوف يتيمة {#sd02}
- **الشدة:** 🟡
- **الملف:** `schema.prisma:1252-1280`
- **الكود الحالي:** `organizationId`/`roleId`/`invitedById` نصوص خام بلا `@relation`، `token String @unique` عالمي، لا `@@index([organizationId])`.
- **المشكلة:** حذف المنظمة (Cascade) يترك دعوات PENDING بـ token صالح؛ حذف Role مخصص يترك دعوات تشير لدور غير موجود؛ لا فهرس لقوائم دعوات المنظمة.
- **الأثر:** صفوف يتيمة تتراكم، وقبول دعوة لمنظمة/دور محذوف يفشل بخطأ FK غامض بدل رفض مبكر.
- **اتجاه الحل:** علاقات `organization`/`role` بـ `onDelete: Cascade` + `@@index([organizationId, status])`، أو تنظيف في مسار حذف المنظمة/الدور.
- **يمس قائمة حمراء؟** نعم (schema.prisma).
- **حالة v6:** جديدة.

## SD-03 — حارس حذف المشروع لا يفحص 3 علاقات مالية تُمسح بـ Cascade {#sd03}
- **الشدة:** 🟡
- **الملف:** `packages/api/modules/projects/procedures/delete-project.ts:31-59` مقابل `schema.prisma` (ProjectChangeOrder:3507، ProjectContract:2521، CompanyExpenseAllocation:4834، HandoverProtocol:6249)
- **المشكلة:** الحارس يعدّ 6 نماذج (financeExpense, projectExpense, projectClaim, subcontractContract, financeInvoice, projectPayment). نماذج مالية أخرى على Cascade خارج العدّ: **ProjectChangeOrder** (أوامر تغيير معتمدة)، **ProjectContract** (قيمة العقد)، **CompanyExpenseAllocation** (يختلّ مجموع 100% لمصروف المنشأة)، **HandoverProtocol**. سيناريو orphan للقيود شبه مستحيل (المستندات المولِّدة للقيود ضمن الفحص)، لكن البيانات التعاقدية تُمسح صامتة.
- **اتجاه الحل:** إضافة `projectChangeOrder.count` و`companyExpenseAllocation.count` (وربما handoverProtocol) للحارس.
- **حالة v6:** جديدة (توسعة — إصلاح `projectExpense` نفسه قائم ✅).

## SD — بنود ⚪
- **SD-04:** `Asset.purchasePrice/monthlyRent/currentValue` بـ `Decimal(12,2)` — الحقول المالية الوحيدة غير المطابقة لمعيار (15,2). السقف أعلى من `MAX_FINANCIAL` فلا خطر overflow — اتساق فقط.
- **SD-05:** فهارس `organizationId` ناقصة على 5 نماذج ثانوية (Purchase الأسخن، NotificationPreference, SubcontractClaimItem, ActivityChecklist, User.organizationId) — أثر هامشي (جداول صغيرة).

## ✅ فُحص ووُجد سليماً (Schema)
- **حارس حذف البنك:** يفحص **14/14** علاقة حركة أموال (طابقتُها واحدة-واحدة). **إصلاح v6-7.3 قائم بالكامل.**
- **حارس حذف المشروع — projectExpense:** موجود مع تعليق. **إصلاح v6-7.2 قائم.**
- **UserDashboardPreference (جديد):** `organizationId` موجود، Cascade مزدوج، `@@unique([userId, organizationId])` + `@@index`. سليم تماماً.
- **الأرقام التسلسلية org-scoped:** كل حقول أرقام المستندات `@@unique([organizationId, …])` — **لا تراجع عن إصلاح v6-7.1.** الـ `@unique` العالمية المتبقية مقصودة (ActivationCode, ItemCatalogEntry, dedupeKey).
- **لا Float/Real** في كامل الـ schema — صفر نتائج. كل المبالغ (15,2).
- **حقول projectId المالية على SetNull** (تنجو من حذف المشروع) — لا مسح مالي عرضي.

---

# 8. أمان المدخلات والأسرار {#8}

## B1 — تسريب اعتماد ZATCA (Authorization + OTP) في سجلات الإنتاج {#b1}
- **الشدة:** 🔴 (مؤكَّد يدوياً — ZATCA Phase 2 go-live قريب)
- **الملف:** `packages/api/lib/zatca/phase2/api-client.ts:62-65` و`:147`
- **الكود الحالي:**
```ts
// DEBUG — log full request for ZATCA troubleshooting
console.log("[ZATCA API] Headers:", JSON.stringify(headers)); // headers.Authorization = `Basic ${token}`
...
console.log("[ZATCA] OTP:", otp);
```
- **المشكلة:** الـ Basic token (اعتماد CSID) والـ OTP يُطبعان كاملَين في Vercel logs (وقد يلتقطهما Sentry breadcrumbs) — بيانات اعتماد فوترة حكومية إلزامية.
- **الأثر:** أي وصول للـ logs = انتحال شخصية المنشأة أمام ZATCA (إصدار/إلغاء فواتير موقّعة).
- **اتجاه الحل:** حذف/تنقية سطر الـ Headers والـ OTP (`Authorization: "***"`) قبل go-live — إلزامي.
- **حالة v6:** جديدة.

## B3 — رفع ملفات Leads بلا allowlist امتدادات ولا فحص اسم الملف {#b3}
- **الشدة:** 🟠
- **الملف:** `packages/api/modules/pricing/procedures/leads/files/get-upload-url.ts:43-50`
- **الكود الحالي:**
```ts
const ext = input.fileName.split(".").pop() || "";
const storagePath = `leads/${input.organizationId}/${input.leadId}/${uniqueId}.${ext}`;
const uploadUrl = await getSignedUploadUrl(storagePath, { bucket: ATTACHMENTS_BUCKET, contentType: input.mimeType });
```
- **المشكلة:** بخلاف مسارَي attachments (`validateFileName` + `validateAttachment`) وproject-documents (allowlist 45 امتداداً + 200MB + فحص maxStorage)، مسار leads يقبل **أي امتداد وأي mimeType** (html, svg, exe…) بحد 50MB فقط وبلا فحص حد تخزين المنظمة.
- **الأثر:** رفع ملفات HTML/SVG/تنفيذية إلى bucket المرفقات؛ يخفّفه التقديم عبر redirect لدومين Supabase (ليس دومين التطبيق)، لكنه قناة توزيع ملفات خبيثة موقّعة باسم المنصة.
- **اتجاه الحل:** نسخ نمط project-documents (allowlist + `validateFileName` + maxStorage).
- **حالة v6:** جديدة.

## B6 — Better Auth بلا تهيئة rate limit (memory-only على serverless) {#b6}
- **الشدة:** 🟡
- **الملف:** `packages/auth/auth.ts` (لا `rateLimit:`/`secondaryStorage:`)
- **المشكلة:** Better Auth يفعّل rate limiting افتراضياً في production لكن بمخزن memory — على Vercel serverless كل instance عدّاد مستقل يتصفّر مع cold start، فحماية brute-force على `/api/auth/sign-in` شبه معدومة. (طبقة oRPC محمية جيداً Redis-backed؛ النماذج العامة مقيّدة.)
- **الأثر:** إمكانية credential stuffing على تسجيل الدخول (يخففه 2FA لمن فعّله).
- **اتجاه الحل:** `rateLimit: { storage: "secondary-storage" }` + `secondaryStorage` مربوط بـ Redis الموجود.
- **حالة v6:** جديدة.

## B2 — console.log تفصيلي لبيانات الفواتير في create-invoice {#b2}
- **الشدة:** 🟡 (= ACC-14)
- **الملف:** `create-invoice.ts:76-87`
- **المشكلة:** كود DEBUG منسي يطبع أوصاف/أسعار بنود فواتير العملاء في server logs بكل إنشاء فاتورة.
- **اتجاه الحل:** حذف بلوك DEBUG.
- **حالة v6:** جديدة.

## B — بنود إضافية
- **B5 (🟡):** CSP `script-src 'unsafe-inline'` في الإنتاج (`next.config.ts:121-122`) — يُفرغ CSP من قيمته ضد XSS (`unsafe-eval` مقصور على dev، وbase-uri/form-action/frame-ancestors مضبوطة). الحل nonce-based CSP — عمل معتبر، بعد الإطلاق. **متبقية من v6** (§10).
- **B7 (⚪):** 41 حقل `z.string()` بلا `.max()` عبر 18 ملفاً — أبرزها `ai/types.ts` (`z.record` بلا حدود في page-context). الوحدات الجديدة (project-boq, chat, attachments, leads) ملتزمة تماماً. **متبقية من v6.**

## ✅ فُحص ووُجد سليماً (المدخلات والأسرار)
- **attachments upload (المسار الرئيسي):** حد 100MB + `validateFileName` (double extensions) + `validateAttachment` (MIME↔ext) + فحص maxStorage + rate limit UPLOAD (10/min) + `subscriptionProcedure`.
- **project-documents upload:** allowlist 45 امتداداً + 200MB.
- **أسرار في Git:** لا ملفات .env/pem/key مرتكبة؛ grep لأنماط `sk_live/pk_live/AKIA/sk-ant/whsec_` = لا شيء حقيقي (whsec_test في اختبارات).
- **headers أمنية:** COOP/CORP/X-Frame-Options DENY/frame-ancestors none/base-uri/form-action مضبوطة على /app و/auth.
- **صلاحية signed upload URLs:** 60 ثانية.

---

# 9. الترجمة وRTL {#9}

## A1 — نصوص عربية hardcoded في 114 مكوّن SaaS {#a1}
- **الشدة:** 🟠
- **الملف:** عبر **114 ملفاً** في `apps/web/modules/saas` (~558 موضعاً: 296 نص JSX + 262 خاصية label/placeholder)
- **الأمثلة المؤكدة:** `auth/components/ChangePasswordForm.tsx:29-226` (14 نصاً — صفحة مصادقة!)، `pricing/components/studies/sections/PlainConcreteSection.tsx:244-249`، `pricing/components/pipeline/ManualItemsTable.tsx:32-49`، `pricing/components/dashboard/PricingPipelineChart.tsx:23`
- **المشكلة:** مخالفة §5.4، متركزة في `pricing/studies/**`، `unified-quantities/**`، `costing-v2/**`، `settings/users/permissions-editor/**`.
- **الأثر:** مستخدم en يرى واجهة مختلطة؛ استحالة توسيع اللغات بلا مسح شامل.
- **اتجاه الحل:** حملة استخراج بالأولوية: (1) ChangePasswordForm، (2) settings/permissions، (3) pricing (الأكبر — يمكن تأجيله لأنه Arabic-first).
- **حالة v6:** متبقية من v6 (دَين قديم — **مكونات إعادة التصميم الجديدة نظيفة**: dashboard/BotlyHero/HeaderSearch عربيتها في التعليقات فقط، عدا PricingPipelineChart:23).

## A2 — 5 مفاتيح ترجمة ar-only (ميتة) {#a2}
- **الشدة:** ⚪
- **الملف:** `packages/i18n/translations/` — namespace `dashboard.alerts` (ar: `empty, dueOn, remaining, inProject, claimsDesc` مفقودة من en). ar: 10,315 مفتاحاً، en: 10,310؛ العكس: 0 en-only.
- **المشكلة:** كسر تكافؤ §5.4 — لكن الخمسة **غير مستدعاة** في أي `t()` (مفاتيح ميتة من نسخة سابقة). لا أثر runtime حالياً.
- **اتجاه الحل:** حذف الخمسة من ar.json أو إضافة مقابلها في en.json.
- **حالة v6:** جديدة.

## ✅ فُحص ووُجد سليماً (الترجمة وRTL)
- **RTL (§5.5):** grep شامل = **6 حالات فقط** كلها `left-1/2`/`right-1/2` مع `translate-x` للتوسيط (محايدة اتجاهياً) — التزام شبه كامل بالخصائص المنطقية، **بما فيها كل مكونات Botly/dashboard الجديدة**.
- **namespaces الجديدة:** `landingVisuals`, `landingRoles`, `globalHeader.search*` (12/12), `dashboard.hero.*` — كلها في الملفين.
- **مكونات إعادة التصميم:** نظيفة i18n (عربيتها في التعليقات فقط، عدا PricingPipelineChart:23).

---

# 10. تكامل الواجهة والكود الميت {#10}

## FE-01 — البحث الشامل لا يحترم نطاق مشاريع العضو {#fe01}
- **الشدة:** 🟠 (تسريب معلومات داخل المنظمة)
- **الملف:** `packages/api/modules/search/router.ts:37-53`، `queries/search.ts:65-94`
- **الكود الحالي:**
```ts
const sections = { projects: permissions?.projects?.view ?? false, ... };
// search.ts: db.project.findMany({ where: { organizationId, OR: [...] }, take })
```
- **المشكلة:** البوابة على مستوى القسم فقط. `list-projects.ts:43-47` و`dashboard.activeProjects` يقيّدان النتائج عبر `getCachedUserProjectScope` عندما `!scope.allProjects` — أما البحث الشامل فيستعلم كل مشاريع المنظمة بلا تقييد.
- **الأثر:** عضو مقيَّد بمشاريع محددة (SUPERVISOR مسند لمشروعين) يرى في نتائج البحث أسماء وأرقام وعملاء **كل** مشاريع المنظمة — يخالف نموذج الرؤية المطبّق في بقية الـ endpoints.
- **اتجاه الحل:** تمرير `restrictToProjectIds` إلى `globalOrganizationSearch` + `id: { in: ... }` على استعلام المشاريع.
- **حالة v6:** جديدة (البحث في bd06b33b).

## FE-02 — prefetch الرئيسية يغذّي مكونات محذوفة والاستعلام الفعلي غير مُسبق {#fe02}
- **الشدة:** 🟠 (تراجُع)
- **الملف:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/page.tsx:92-123`
- **المشكلة:** بعد إعادة بناء الداشبورد، `RecentDocumentsCard` لم يعد يُعرض (يتيم — FE-05)، و`Dashboard.tsx:78` يستخدم `orpc.dashboard.activeProjects` وليس `projects.list`. النتيجة: 3 من 4 prefetches (projects.list + quotations.list + studies.list) استعلامات DB مهدرة على أسخن صفحة، بينما `dashboard.activeProjects` المستخدم فعلاً **غير** مُسبق → skeleton دائم عند أول تحميل.
- **الأثر:** ~3 استعلامات Mumbai مهدرة لكل زيارة + وميض skeleton رغم هدف الـ prefetch.
- **اتجاه الحل:** حذف الـ prefetches الثلاثة اليتيمة + إضافة `orpcServer.dashboard.activeProjects` بنفس input العميل.
- **حالة v6:** جديدة (تراجُع من إعادة تصميم الداشبورد).

## FE-03 — AttentionCard يطلق finance.invoices.list بلا بوابة صلاحية → 403 مضمون {#fe03}
- **الشدة:** 🟡
- **الملف:** `apps/web/modules/saas/dashboard/components/sections/AttentionCard.tsx:37-42`، يُعرض بلا شرط في `Dashboard.tsx:201-226`
- **المشكلة:** `listInvoices` يفرض `finance.view`، وAttentionCard يُعرض حتى لعضو مشاريع فقط. تعليق `Dashboard.tsx:49-51` ينص: "no forbidden RPCs, no 403 noise" — وهذا يخالفه.
- **الأثر:** طلب RPC فاشل (FORBIDDEN) لكل تحميل رئيسية لعضو بلا `finance.view` — ضجيج Sentry + طلب مهدر.
- **اتجاه الحل:** تمرير `showFinance` وجعل `enabled: !!organizationId && showFinance`.
- **حالة v6:** جديدة.

## FE-04 — dashboard.getAll يحسب استعلامات لا يستهلكها أي مكون {#fe04}
- **الشدة:** 🟡
- **الملف:** `packages/api/modules/dashboard/router.ts:260-325`
- **المشكلة:** بعد الانتقال لـ Botly، `activities`/`typeDistribution`/`leadsPipeline`/`netProfit`/`profitMargin` كان يستهلكها فقط مكونات يتيمة الآن (FE-05). grep على dashboard المعروض: صفر استهلاك. (`FinanceDashboard` يستدعي getAll كاملاً لأجل `financialTrend` وحده.)
- **الأثر:** 3+ استعلامات DB لكل نداء getAll (أسخن endpoint) بلا مستهلك.
- **اتجاه الحل:** إسقاط الاستعلامات غير المستهلكة، أو فصل `financialTrend` في procedure خفيف.
- **حالة v6:** جديدة (dead wiring من إعادة التصميم).

## FE-05 — 26 ملف مكوّن يتيم خلّفته إعادة التصميم (v6: 70) {#fe05}
- **الشدة:** 🟡
- **الملفات:** dashboard (8): `EmptyProjectsState`, `sections/{AlertsSection, DidYouKnowCard, OperationalSection, PortfolioPulseCard, ProjectsDonutCard, ProjectsDonutChart, RecentDocumentsCard}` · finance/dashboard (6): `{ActionCards, BalanceCards, CashFlowCard, DeadlinesCard, FinanceHeader, QuickActionsGrid}` · pricing/dashboard (4): `{PricingActionCards, PricingBalanceCards, PricingDeadlinesCard, PricingHeader}` · marketing/home (8): `{BuiltForConstruction, DashboardPreview, ModulesTicker, Newsletter, PainPoints, ParticleDots, PathStrip, StatsSection}`
- **المشكلة:** ملفات ميتة، بعضها يحمل استعلامات RPC حية (RecentDocumentsCard) — سبب بقاء prefetches FE-02. **تضلل الصيانة:** CLAUDE.md §19.10 ما زال يذكر `ActionCards` كنقطة استدعاء لـ AddExpenseDialog وهي يتيمة الآن.
- **اتجاه الحل:** حذف الـ 26 في commit تنظيف + تحديث CLAUDE.md §19.10.
- **حالة v6:** متبقية جزئياً من v6 (70 → معظمها أُزيل؛ هذه دفعة جديدة من الردِزاين).

## FE — بنود ⚪
- **FE-06:** `FinancePanel.tsx:17-37` يستقبل `bankBalance`/`cashBalance` ولا يفكّكهما (props ميتة مضلِّلة).
- **FE-07:** `AssistantWrapper.tsx:19` — `fallback={null}` الوحيد المتبقي (مقبول بوعي للّوحة العائمة lazy، يُفضَّل تعليق يعلّله).
- **FE-08:** `PricingShortcutsCard.tsx:30-67` يعرض أزرار الإنشاء الثلاثة لكل `pricing.view` بلا تغربل قسمي (بخلاف `QuickActionsGrid`) — الصفحات محمية server-side فلا تسريب، فقط عدم اتساق UX.

## ✅ فُحص ووُجد سليماً (التكامل)
- **Hero Carousel:** `setHeroCardPreference` يُبطل الكاش بمفتاح oRPC متداخل صحيح؛ التفضيل مُسبق server-side؛ heroMetrics تُجرَّد فعلاً على الخادم؛ سقوط البطاقة غير المرئية لأول متاحة يعمل.
- **مفاتيح oRPC المسطّحة:** 46 موقعاً في 17 ملفاً (v6: 132) — العينات كلها custom queryFn مُبطلة بنفس المفتاح المسطّح (لا mismatch). **صفر** مفاتيح مسطّحة في كود التصميم الجديد.
- **البحث (UI):** debounce 250ms، حالات تحميل/فراغ، Ctrl/Cmd+K، تصفير عند الإغلاق، كل المسارات الـ 14 موجودة.
- **الترجمات الجديدة:** كل المفاتيح المفحوصة في الملفين.
- **حالات التحميل:** loading.tsx على المسارات المعاد بناؤها + skeletons حقيقية.
- **CSS القديم:** `mas-*`/`--lp-*`/`.landing-*` ما زالت موجودة ومستهلكوها أحياء (auth + ChoosePlan) — لا كسر لقاعدة الذاكرة.
- **لا بيانات وهمية:** كل بطاقات الداشبورد موصولة بـ endpoints حقيقية مجمّعة server-side؛ لا مجاميع محلية فوق قوائم مقطوعة (عدا PERF-5). أرقام `LandingDashboardReplica` تسويقية بالتصميم.

---

# 11. مصفوفة الأولويات {#11}

> الجهد: S (ساعات) / M (يوم–يومان) / L (أسبوع+). التوقيت: **قبل** الإطلاق أو **بعده**.

| المرجع | المشكلة | الشدة | الجهد | التوقيت |
|--------|---------|-------|-------|---------|
| V7-01 | كتابة رصيد بنك عابرة للمستأجرين (4 مسارات) | 🔴 | S | **قبل** |
| B1 | تسريب اعتماد ZATCA (Authorization + OTP) | 🔴 | S | **قبل** |
| ACC-15 | إقفال السنة يُكمَل صامتاً بلا قيد (فترة ديسمبر مغلقة) | 🔴 | S | **قبل** |
| ACC-2 | عكس إقفال السنة مؤرَّخ بتاريخ اليوم | 🔴 | S | **قبل** |
| V7-03 | /image-proxy بلا مصادقة | 🟠 | M | **قبل** |
| EH-3 | JOURNAL_ENTRY_FAILED بلا await (45 موقعاً) | 🟠 | M | **قبل** |
| RC-1 | اعتماد مزدوج رواتب/متكررة | 🟠 | S | **قبل** |
| RC-3/SD-01 | غياب @@unique على مرجع القيود | 🟠 | M (migration) | **قبل** |
| EH-4 | Error بدل ORPCError (مسارات حرجة) | 🟠 | M | **قبل** |
| FE-01 | البحث الشامل يتجاهل نطاق المشاريع | 🟠 | S | **قبل** |
| ACC-5 | تعديل مصروف/مقبوض لفترة مغلقة (2.15) | 🟠 | S | **قبل** |
| ACC-3 | payExpense read-then-write | 🟠 | S | **قبل** |
| ACC-4 | انتقالات السندات غير ذرّية | 🟠 | M | **قبل** |
| ACC-6 | إلغاء سحب شريك في فترة مغلقة | 🟠 | S | **قبل** |
| ACC-16 | إلغاء فاتورة مدفوعة جزئياً لا يُحدّث البنك/السندات | 🟠 | S | **قبل** |
| ACC-17 | رواتب: GL البنك ↔ الرصيد التشغيلي انحراف | 🟠 | M | قبل/بعد |
| ACC-18 | إفراج المحتجزات يخصم 2150 بلا قيد استقطاع | 🟠 | M | قبل/بعد |
| V7-02/B3 | ملفات Leads: مسار غير محقَّق + بلا allowlist | 🟠 | S | **قبل** |
| B2/ACC-14 | تسريب DEBUG لبيانات الفواتير | 🟡→🔴* | S | **قبل** |
| EH-2 | حذف دفعة فاتورة: سند خارج المعاملة | 🟠 | S | قبل/بعد |
| EH-6 | create-document floating promise | 🟠 | S | قبل/بعد |
| RC-2/ACC-8 | سقف الإشعار الدائن خارج القفل | 🟠🟡 | S | قبل/بعد |
| SEC-3.1/3.2 | تصدير + copy-items بلا تحقق قسمي/مشروع | 🟠 | M | قبل/بعد |
| PERF-1/2/5 | N+1 (أنشطة/باطن) + KPI مقطوع | 🟠 | M | قبل/بعد |
| B6 | Better Auth rate limit | 🟡 | S | قبل/بعد |
| ACC-7/EH-1 | عكس الإقفال غير ذرّي | 🟡 | S | بعد |
| RC-4/RC-5/RC-6/RC-7 | حراس تفاؤلية + ترقيم | 🟡 | M | بعد |
| ACC-10/11/12/13 | dedup افتتاحي + رواتب صامتة + backfill + float | 🟡 | M | بعد |
| FE-02/03/04/05 | prefetch ميت + 403 + getAll زائد + 26 ملف يتيم | 🟠🟡 | M | بعد |
| A1 | 114 ملف نص عربي hardcoded | 🟠 | L | بعد |
| SD-02/03/04/05 | FK/فهارس/دقة Schema | 🟡⚪ | M (migration) | بعد |
| B5 | CSP nonce-based | 🟡 | M | بعد |
| B7/EH-8/PERF-6/7/8/9/FE-06/07/08 | بنود منخفضة متنوعة | 🟡⚪ | S–M | بعد |

\* B2 يرتقي عملياً لخطورة أعلى لأنه يسرّب بيانات عملاء في كل فاتورة — يُعامل كـ "قبل" رغم تصنيفه 🟡.

---

# 12. ملحق أ: نتائج الفحوصات الآلية

| الفحص | النتيجة |
|-------|---------|
| `pnpm --filter @repo/web type-check` | ✅ exit 0 — صفر أخطاء |
| `pnpm --filter @repo/database type-check` | ✅ exit 0 — صفر أخطاء |
| `pnpm --filter @repo/api test` (Vitest) | ✅ 40 ملفاً ناجحاً / 1 متخطى — 1,109 اختباراً ناجحاً / 34 متخطى |
| `pnpm --filter @repo/database test` | ✅ 4 ملفات ناجحة / 2 متخطاة — 77 اختباراً ناجحاً / 24 متخطى |
| `npx biome lint apps/web` | 483 خطأ / 4,217 تحذير / 126 ملاحظة (تحسّن من 602/4,526/145) |

> ملاحظة: اختبار `payments/webhook-verification.test.ts` يطبع أثر خطأ Stripe في مخرجاته لكنه ضمن الـ 40 ملفاً الناجحة (يختبر رفض توقيع خاطئ).

---

# 13. ملحق ب: قائمة الملفات اليتيمة (26 ملفاً)

`apps/web/modules/saas/dashboard/components/`: `EmptyProjectsState.tsx`, `sections/{AlertsSection, DidYouKnowCard, OperationalSection, PortfolioPulseCard, ProjectsDonutCard, ProjectsDonutChart, RecentDocumentsCard}.tsx`

`apps/web/modules/saas/finance/components/dashboard/`: `{ActionCards, BalanceCards, CashFlowCard, DeadlinesCard, FinanceHeader, QuickActionsGrid}.tsx`

`apps/web/modules/saas/pricing/components/dashboard/`: `{PricingActionCards, PricingBalanceCards, PricingDeadlinesCard, PricingHeader}.tsx`

`apps/web/modules/marketing/home/components/`: `{BuiltForConstruction, DashboardPreview, ModulesTicker, Newsletter, PainPoints, ParticleDots, PathStrip, StatsSection}.tsx`

> ⚠️ عند الحذف: حدّث CLAUDE.md §19.10 (يذكر `ActionCards` كنقطة استدعاء لـ AddExpenseDialog — لم تعد صحيحة).

---

# 14. ملاحظات ختامية

## نطاق التغطية وحدوده
- **مغطّى بالكامل:** النظام المحاسبي، العزل متعدد المستأجرين، الكود الجديد بعد v6 (dashboard/hero/search/unified-quantities/leads)، الأداء في المسارات المالية والتنقل، Schema المالي، أمان المدخلات/الأسرار، RTL في نطاق SaaS.
- **مغطّى بعيّنة:** الوحدات غير المالية الأقدم (كثير منها مستقر منذ v6)، مفاتيح oRPC المسطّحة (46/46 فُحصت عيّنة منها).
- **غير مفحوص بعمق:** محركات الحساب الإنشائي/التشطيبات/MEP (قائمة حمراء — قُرئت لم تُدقَّق معادلاتها)، تفاصيل ZATCA Phase 2 التشفيرية.

## تأكيد سلامة المستودع
- **لم يُعدَّل أي ملف كود.** الملف الوحيد المُنشأ هو هذا التقرير. (تعديلات working tree الظاهرة في `git status` — PricingDashboard/PricingPipelineChart/dashboard router/schema — سابقة على هذا التدقيق وليست من عمله.)
- كل بطاقة تتضمن مسار + سطر + مقتطف فعلي. أخطر 3 بنود (V7-01, ACC-2, B1) أُكّدت بقراءة يدوية مباشرة.

## أبرز التقدّم منذ v6
1. **type-check أخضر** (كان 11 خطأ) + **الاختبارات كاملة** (1,109 API).
2. **كل إصلاحات v6 الحرجة المعاد فحصها قائمة** — لا تراجع واحد (4.1، 4.2، 5.1، 5.2، 5.3، 7.1، 7.2، 7.3، 6.1، 6.2، 2.16…).
3. **الأداء تحسّن بنيوياً:** no-store أُزيل، self-HTTP prefetch أُلغي، N+1 الرواتب/المتكررة batched.
4. **نظافة الجذر:** ملفات التوثيق من ~90 إلى 8.

## ثلاث خطوات فورية موصى بها (بالترتيب)
1. **أوقف تسريب الأسرار والبيانات:** احذف DEBUG logs (B1 ZATCA، B2 الفواتير) — دقائق، وإلزامي قبل ZATCA go-live.
2. **أغلق العزل والذرية العابرة:** V7-01 (كتابة البنك)، V7-03 (image-proxy)، FE-01 (نطاق البحث) — كلها ثغرات عزل حقيقية.
3. **ثبّت المحاسبة قبل الإطلاق:** ACC-15 (الإقفال الصامت — الأخطر)، ACC-2 (تاريخ العكس)، EH-3 (await للتدقيق)، RC-1 (اعتماد مزدوج)، RC-3 (unique القيود)، ACC-5 (فترة مغلقة).

---

*انتهى التقرير — منصة مسار v7.0 — 2026-07-14*
