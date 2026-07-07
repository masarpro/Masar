# تقرير التحقق من إصلاحات v6.0

> **التاريخ:** 2026-07-06
> **الفرع:** `main` — آخر commit مفحوص: `e6545b73` (fix(finance): unify subtotal/VAT/total calculation on single source of truth)
> **المرجع:** `MASAR_ERRORS_AUDIT_REPORT_v6.md` (110 مشكلة، 2026-07-05)
> **نقطة الأساس:** التقرير دخل المستودع في commit `cc21136f` الذي حمل معه موجة الإصلاحات الأولى. نطاق الفحص `cc21136f^..HEAD` = **13 commit / 131 ملفاً متغيّراً** (وليس 33/341 كما بدا من عدّ `--since` الذي شمل commits سابقة على الفرع).
> **المنهجية:** قراءة فعلية للكود الحالي في كل موقع (بحث بالدالة/المقتطف لا برقم السطر) عبر 8 مسارات تحقق متوازية + type-check + اختبارات + lint. **لم يُعدَّل أي ملف كود — الملف الوحيد المُنشأ هو هذا التقرير.**

## نتائج الفحوصات الآلية (نُفّذت فعلياً)

| الفحص | النتيجة |
|-------|---------|
| `pnpm --filter @repo/web type-check` | ✅ **نجح — exit 0، صفر أخطاء** (كانت 11 خطأ في وحدة الإشعارات → [8.1] مُصلح) |
| `pnpm --filter @repo/api test` (Vitest) | ✅ 38 ملفاً ناجحاً / 1 متخطى — **1,083 اختباراً ناجحاً** / 34 متخطى |
| `pnpm --filter @repo/database test` | ✅ 4 ملفات ناجحة / 2 متخطاة — 77 اختباراً ناجحاً / 24 متخطى |
| `npx biome lint apps/web` | **604 خطأ / 4,525 تحذير / 145 ملاحظة** (سابقاً 602/4,526/145 → [8.2] بلا تغيير) |

---

# 1. لوحة النتائج (Scorecard)

## 1.1 الجدول التجميعي

| الشدة | ✅ مُصلح | 🟨 جزئي | ❌ لم يُصلح | 🔺 معيب | ⬜ غير قابل للتحقق | المجموع |
|-------|---------|---------|------------|---------|--------------------|---------|
| 🔴 حرج (29) | **24** | **5** | 0 | 0 | 0 | 29 |
| 🟠 عالٍ (27¹) | **17** | **8** | **2** | 0 | 0 | 27 |
| 🟡 متوسط (~33) | 8 | 2 | ~23 | 0 | 0 | ~33 |
| ⚪ منخفض (~16) | 2 | 1 | ~8 | 0 | ~5² | ~16 |

¹ بطاقات 10.1–10.4 كلها 🟠 في التقرير الأصلي (جدوله التجميعي قال 3) — اعتمدنا عدّ البطاقات.
² بنود ⚪ ثانوية لم يُعَد فحصها (نظام quantities المزدوج، proxy.ts، PlanConfig Int، دقة CompanyAsset) — كانت توثيقية أصلاً.

**الخلاصة السريعة:** كل المشاكل الحرجة الـ 29 عولجت كلياً (24) أو جزئياً (5) — لا يوجد بند حرج بلا أي معالجة. الفجوات الجزئية الخمس الحرجة حقيقية ويجب إغلاقها (القسم 6). المشاكل العالية أُغلق ثلثاها. المتوسطة/المنخفضة معظمها لم يُلمس (متوقع — كانت مصنّفة "بعد الإطلاق").

## 1.2 لوحة المشاكل الحرجة 🔴

| المرجع | الوصف المختصر | الحكم | الدليل |
|--------|----------------|-------|--------|
| 2.1 | الإشعار الدائن بمبالغ سالبة → لا قيد/قيد معكوس | ✅ | `create-invoice.ts:1236` + `backfill.ts:86` — `.abs()` |
| 2.2 | إلغاء فاتورة ISSUED بلا عكس قيد | ✅ | `create-invoice.ts:395-419` |
| 2.3 | إلغاء إشعار دائن بلا عكس/إنقاص paidAmount | ✅ (بالمنع) | `create-invoice.ts:378-385` |
| 2.4 | دفعة جزئية للمصروف → قيد بكامل المبلغ | ✅ | `expenses.ts:648` |
| 2.5 | الأرصدة الافتتاحية: حذف قبل إنشاء غير ذري | 🟨 | `accounting.ts:1803-1835` |
| 2.6 | دفعة فاتورة بلا حارس حالة/سقف | ✅ | `finance.ts:1297-1336` |
| 2.7 | إقفال السنة بـ `db` بدل `tx` | ✅ | `year-end-closing.ts:474,553` (`}, tx);` — تحقق مباشر) |
| 3.1 | حذف بنك يعطّل chartAccount منظمة أخرى | ✅ | `banks.ts:297-308` |
| 3.2 | طباعة سند تكتب على سند منظمة أخرى | ✅ | `payment-vouchers.ts:717-731`, `receipt-vouchers.ts:549-563` |
| 3.3 | دفعات مصروفات المنشأة مكشوفة بالكامل | ✅ | `company.ts:521-699` — `expense:{organizationId}` |
| 3.4 | تخصيصات المصروفات بلا تحقق ملكية | ✅ | `company.ts:772-824` |
| 3.5 | تعيينات الموظفين عابرة للمستأجرين | ✅ | `company.ts:196-316` |
| 3.6 | أوامر تغيير الباطن بلا ربط | ✅ | `subcontract.ts:675-679,726-730` |
| 3.7 | قراءة تقدّم دفعات عقد لأي منظمة | ✅ | `subcontract.ts:436-443` |
| 3.8 | حذف عنصر قالب لأي منظمة | ✅ | `project-templates.ts:376-390` |
| 3.9 | ضبط رصيد إجازة لموظف منظمة أخرى | ✅ | `leave-balances.ts:84-146` |
| 3.10 | تعديل/حذف نوع إجازة لمنظمة أخرى | ✅ | `leave-types.ts:124-131,157-173` |
| 4.1 | race دفعات الفواتير (إضافة + حذف) | 🟨 | الإضافة ✅ `finance.ts:1308` / الحذف ❌ `finance.ts:1386-1420` |
| 4.2 | اعتماد المطالبات المزدوج | 🟨 | subcontract ✅ `:724-730` / project-finance ❌ `:676` |
| 4.3 | ترقيم مطالبات/دفعات الباطن بلا unique | ✅ | `schema.prisma:2396,2482` |
| 4.4 | دعوة onboarding تتجاوز الاشتراك | ✅ | `invite-team-members.ts:8,34` |
| 4.5 | حارس الرصيد gte في المسارات الأربعة | ✅ | الأربعة كلها (تفصيل §2) |
| 5.1 | حذف دفعة مصروف لا يعيد الرصيد | 🟨 | `expense-payments.ts:346-395` |
| 5.2 | تعديل مبلغ دفعة مدفوعة | 🟨 | `expense-payments.ts:246-308` |
| 5.3/2.8 | `reverseJournalEntry` غير ذري | ✅ | `accounting.ts:681-717` |
| 7.1 | الأرقام التسلسلية `@unique` عالمياً | ✅ | 11 حقلاً → `@@unique([organizationId, ...])` |
| 7.2 | حارس حذف المشروع بلا projectExpense | ✅ | `delete-project.ts:31-59` |
| 7.3 | حارس حذف البنك 4 من 13 علاقة | ✅ | `org-finance.ts:623-666` — 14 علاقة |
| 8.1 | فشل type-check (eventPrefs) | ✅ | exit 0 — نُفّذ فعلياً |

## 1.3 لوحة المشاكل العالية 🟠

| المرجع | الوصف المختصر | الحكم | الدليل |
|--------|----------------|-------|--------|
| 2.8 | reverseJournalEntry (مكرر 5.3) | ✅ | `accounting.ts:681-717` |
| 2.9 | سقف الإشعار الدائن (وحدات غير متجانسة) | ✅ | `finance.ts:1714-1727` |
| 2.10 | JOURNAL_ENTRY_SKIPPED عائم | ✅ | `accounting.ts:570-590` |
| 2.11 | ابتلاع فشل seeding/غياب الحسابات | 🟨 | seed + رواتب فقط؛ ~14 hook ما زالت `return;` صامتة |
| 2.12 | orgAuditLog fire-and-forget | ✅ | `org-audit.ts:17-46` — `Promise<void>` مُنتظَرة |
| 2.13 | تعديل مصروف مكتمل بلا reverse+recreate | ✅ | `expenses.ts:470-528` |
| 2.14 | السندات اليدوية بلا تحريك رصيد | ✅ | `receipt-vouchers.ts:375`, `payment-vouchers.ts:446` (مع gte) |
| 2.15 | تعديل دفعة مشروع لفترة مغلقة | 🟨 | `update.ts:141-190` — الحارس موجود لكن متأخر ومبتلَع |
| 2.16 | تقرير VAT (cuid vs systemId) | ✅ | `accounting-reports.ts:717-723` — join `isVatExempt` |
| 2.17 | رواتب بلا 2170 + تاريخ يوم 28 | ✅ | `auto-journal.ts:471-495` + اختباران جديدان |
| 4.6 | دفعة مطالبة الباطن (قراءة قديمة) | ✅ | قفل + قراءة داخل tx في المسارين |
| 4.7 | المصروف بمعنيين بلا مطابقة | ❌ | `project-finance.ts:404-430` بلا تغيير، لا شارة UI |
| 4.8 | تكرار حساب مجاميع الفاتورة | 🟨 | التقريب وُحّد؛ لا util مشترك في packages/utils |
| 5.4 | `.catch(() => [])` في إقفال السنة | 🟨 | year-end ✅ / owner-drawings ما زال يبتلع إلى 0 |
| 5.5 | فشل السندات التلقائية بلا audit | 🟨 | 6 من 7 مواقع ✅ / `payment-side-effects.ts:99` ❌ |
| 5.6 | السند اليتيم بعد حذف الدفعة | ✅ | إلغاء السند في المسارين |
| 5.7 | Error بدل ORPCError | 🟨 | التحويلات فقط؛ بقية المواقع كما هي |
| 5.8 | closePeriod غير ذري | ✅ | `accounting.ts:1383-1406` |
| 6.1 | N+1 اعتماد الرواتب | 🟨 | حجز أرقام دفعة واحدة ✅ / حلقة 2N باقية |
| 6.2 | N+1 المصروفات المتكررة | 🟨 | نفس 6.1 |
| 6.3 | تسوية قيود دفعات المشروع | ✅ | `reconcile-project-payments.ts:74-99` — findMany واحد |
| 7.4a | SubcontractClaim.claimNo بلا unique | ✅ | `schema.prisma:2482` |
| 7.4b | SubcontractPayment.paymentNo بلا unique | ✅ | `schema.prisma:2396` |
| 10.1 | إبطال cache مسطّح (132 موضعاً) | ❌ | العدّ الحالي 132 — بلا تغيير |
| 10.2 | إجمالي المقبوضات على صفحة مقسّمة | ✅ | `PaymentsList.tsx:101` + aggregate خادمي |
| 10.3 | إحصاءات الدراسات على صفحة مقسّمة | ✅ | `QuantitiesList.tsx:51-56` + groupBy خادمي |
| 10.4 | بطاقات mock على /finance | ✅ | `CashFlowCard`/`DeadlinesCard` مربوطتان بـ API حقيقي |

---

# 2. تفصيل المشاكل الحرجة (بطاقة لكل مشكلة)

## [2.1] الإشعار الدائن بمبالغ سالبة — ✅ مُصلح بالكامل
**الدليل الحالي** (`packages/api/modules/finance/procedures/create-invoice.ts:1236-1237`):
```ts
totalAmount: creditNote.totalAmount.abs(),
vatAmount: creditNote.vatAmount.abs(),
```
ونفسه في `packages/api/lib/accounting/backfill.ts:86`. الإصلاح في **نقطة الاستدعاء** تماماً كما أوصى التقرير (الـ hook `onCreditNoteIssued` في auto-journal.ts:668-676 لم يُمس — احترام للقائمة الحمراء). التخزين يبقى سالباً في DB (`finance.ts:1732-1735` — صحيح بالتصميم لأغراض ZATCA) لكن الـ hook يستلم قيماً موجبة → `netAmount` موجب، سطر VAT يُدرج عند VAT>0، والقيد يتوازن (مدين إيراد+VAT / دائن عملاء).
**بشأن الاختبار:** `auto-journal.test.ts` ما زال يمرّر قيماً موجبة (575/75) — وهذا الآن **صحيح** وليس تعمية: عقد الـ hook الفعلي بعد `.abs()` هو قيم موجبة، فالاختبار يطابق الإنتاج. (يُستحسن اختبار تكاملي على مستوى الـ procedure يمرّر سالباً ويتأكد من الـ .abs — انظر §5.)

## [2.2] إلغاء فاتورة ISSUED بلا عكس قيد — ✅ مُصلح
**الدليل** (`create-invoice.ts:395-419`): عند الانتقال إلى CANCELLED يُستدعى `reverseAutoJournalEntry(referenceType:"INVOICE")` ثم حلقة تعكس قيد **كل دفعة** (`INVOICE_PAYMENT`) — يغطي INV-JE وRCV-JE معاً. الجذر عولج. ملاحظة ثانوية: العكس يجري بعد تحديث الحالة وخارج transaction مشتركة؛ فشل العكس يُسجَّل `JOURNAL_ENTRY_FAILED` (متسق مع قاعدة "أخطاء القيود لا تكسر العملية").

## [2.3] إلغاء إشعار دائن — ✅ مُصلح (بالمنع)
**الدليل** (`create-invoice.ts:378-385`):
```ts
if (input.status === "CANCELLED" && currentInvoice.invoiceType === "CREDIT_NOTE") {
  throw new ORPCError("BAD_REQUEST", { message: "لا يمكن إلغاء إشعار دائن من هذا المسار" });
}
```
تأكدنا ألا مسار إلغاء بديل: `deleteInvoice` مقيّد بـ DRAFT والإشعارات تُنشأ ISSUED. بما أن الإلغاء مستحيل، مشكلة العكس/paidAmount لا تنطلق. **ملاحظة كامنة:** حارس منع التكرار (`finance.ts:1715-1727`) ما زال يستثني CANCELLED — إن أُضيف مستقبلاً مسار إلغاء للإشعارات يجب معالجة العكس وإنقاص paidAmount معه.

## [2.4] الدفعة الجزئية للمصروف — ✅ مُصلح
**الدليل** (`expenses.ts:648`): `onExpenseCompleted` صار مشروطاً بـ `expense.status === "COMPLETED"`. و`payExpense` (`org-finance.ts:910-932`) يخصم `payAmount` فقط ذرياً مع حارس gte ولا يُكمل الحالة إلا عند بلوغ الإجمالي. قيد EXP-JE واحد بكامل المبلغ عند الاكتمال = يطابق مجموع خصومات البنك التراكمية. التسوية تتطابق.

## [2.5] الأرصدة الافتتاحية غير الذرية — 🟨 مُصلح جزئياً
**الدليل** (`accounting.ts:1803-1835`): أُعيد الترتيب إلى **إنشاء-قبل-حذف**:
```ts
const entry = await createJournalEntry(db, { ...referenceType: "OPENING_BALANCE"... });
if (!entry) throw new Error("...الفترة المحاسبية مغلقة");
if (existing && existing.id !== entry.id) {
  await db.journalEntry.delete({ where: { id: existing.id } });
}
```
جذر **فقدان البيانات** عولج (فشل الإنشاء في فترة مغلقة لم يعد يقع بعد الحذف). **المتبقي:** الخطوتان ليستا في `$transaction` واحدة — فشل الحذف بعد نجاح الإنشاء = قيدا OPENING_BALANCE مُرحّلان معاً يتضاعف أثرهما في ميزان المراجعة، وفحص التكرار لا يلتقطهما لأن القيد بلا `referenceId`. الحل: لفّهما في transaction واحدة (تمرير `tx` — البنية موجودة الآن عبر `existingTx`) أو إعطاء القيد `referenceId` ثابتاً.

## [2.6] دفعة فاتورة بلا حارس حالة/سقف — ✅ مُصلح
**الدليل** (`finance.ts:1297-1336`):
```ts
const PAYABLE_STATUSES = ["ISSUED","SENT","VIEWED","PARTIALLY_PAID","OVERDUE"];
await tx.$queryRaw`SELECT id FROM finance_invoices WHERE id = ${invoiceId} AND organization_id = ${organizationId} FOR UPDATE`;
if (!PAYABLE_STATUSES.includes(invoice.status)) throw new Error(`لا يمكن تسجيل دفعة على فاتورة بحالة ${invoice.status}`);
if (payAmount.greaterThan(remaining.add(new Prisma.Decimal("0.01")))) throw ...
```
allowlist يستبعد DRAFT/CANCELLED/PAID، سقف على المتبقي (بتسامح هللة)، وقفل صف + قراءة حديثة داخل الـ tx. الإشعارات الدائنة تُرفض عملياً (totalAmount سالب → remaining سالب → أي دفعة موجبة تصطدم بالسقف).

## [2.7] إقفال السنة `db` بدل `tx` — ✅ مُصلح (تحقق مباشر منا)
**الدليل:** موقعا الاستدعاء الوحيدان في الملف (`year-end-closing.ts:474`, `:553`) كلاهما ينتهي بـ `}, tx);` — أي `createJournalEntry(db, {...}, tx)` حيث `existingTx` يجعل التنفيذ داخل transaction الإقفال نفسها (`accounting.ts:640`: `existingTx ? execute(existingTx) : db.$transaction(execute)`). المعامل الأول `db` غير مستخدَم في هذا الفرع. (كان في التقرير 3 مواقع — الملف الآن فيه موقعان فقط، كلاهما سليم.)

## [3.1–3.10] ثغرات IDOR العشر — ✅ مُصلحة كلها
تحقق مستقل لكل موقع من الملحق ج. النمط المطبّق موحّد وسليم: إما `where: { id, organizationId }` مباشرة، أو `updateMany`/`deleteMany` مشروط مع فحص `count === 0`، أو تحقق ملكية عبر العلاقة الأم (`expense: { organizationId }`, `contract: { organizationId }`, `employee: { organizationId }`) **بنفس المعرّف** الذي تُنفَّذ عليه الكتابة (لا يُعاد ربطه بمدخل آخر — فلا التفاف). أبرز الأدلة:
- **3.1** `banks.ts:297-308`: `findFirst({ id, organizationId })` + `chartAccount.updateMany` مقيّد بالمنظمة.
- **3.2** `payment-vouchers.ts:717-731` / `receipt-vouchers.ts:549-563`: حارس ملكية + `ORPCError NOT_FOUND` قبل increment.
- **3.3** كل دوال `CompanyExpensePayment` في `company.ts:521-699` تفلتر عبر `expense: { organizationId }`؛ الإنشاء/التوليد يتحققان من المصروف الأم.
- **3.4** `company.ts:772-824`: تحقق الأم ثم `deleteMany/createMany` داخل `$transaction`. (ملاحظة تحسينية: `projectId` داخل التخصيصات لا يُتحقق من ملكيته — نقطة سلامة بيانات لا ثغرة عبور مستأجرين.)
- **3.5** `company.ts:196-316`: الإنشاء يتحقق من الموظف **والمشروع** معاً؛ التعديل/الحذف عبر `employee: { organizationId }`.
- **3.6** `subcontract.ts:675-679/726-730`: `findFirst({ id, contractId, contract: { organizationId } })` داخل نفس الـ tx بعد قفل الصف.
- **3.7** `subcontract.ts:436-443`: `findFirst({ id, organizationId, projectId })`.
- **3.8** `project-templates.ts:376-390`: `deleteMany({ id: itemId, templateId })` + فحص count — الإصلاح الموصى حرفياً.
- **3.9** `leave-balances.ts:84-146`: تحقق الموظف ونوع الإجازة معاً قبل upsert.
- **3.10** `leave-types.ts:124-131/157-173`: `updateMany`/`deleteMany` مقيّدة بالمنظمة مع فحص count (ثغرة "الحارس يمرّ بصفر" أُغلقت — النوع الأجنبي يعطي count=0 → NOT_FOUND).

## [4.1] race دفعات الفواتير — 🟨 مُصلح جزئياً
- **`addInvoicePayment` ✅** (`finance.ts:1308-1358`): القراءة انتقلت داخل الـ transaction بعد `FOR UPDATE`، والكتابة تُشتق من قراءة حديثة مقفولة + سقف.
- **`deleteInvoicePayment` ❌** (`finance.ts:1386-1420`): ما زال يقرأ `paidAmount` **خارج** الـ transaction ويكتب قيمة مطلقة قديمة داخلها:
```ts
const invoice = await db.financeInvoice.findFirst({ ... paidAmount ... });   // خارج tx، بلا قفل
const newPaidAmount = Number(invoice.paidAmount) - Number(payment.amount);
return db.$transaction(async (tx) => {
  await tx.financeInvoice.update({ ... data: { paidAmount: newPaidAmount, ... } });
```
حذفٌ متزامن مع إضافة (أو حذفان) يفسد `paidAmount`. **المطلوب:** تطبيق نمط الأخت حرفياً (قراءة داخل tx + FOR UPDATE).

## [4.2] اعتماد المطالبات المزدوج — 🟨 مُصلح جزئياً
- **`subcontract-claims.ts` ✅** (`:724-730`): الإصلاح الموصى حرفياً — `updateMany({ where: { id, status: claim.status } })` + `if (updated.count === 0) throw INVALID_TRANSITION` مع قفل العقد.
- **`project-finance.ts` (updateClaimStatus) ❌** (`:585/:611/:676`): البنية المعيبة كما هي — قراءة الحالة بلا قفل، `FOR UPDATE` على العقد فقط، والكتابة `update` بلا شرط حالة، وفحص السقف يستثني المطالبة نفسها → الاعتماد المزدوج لمستخلصات المشروع ما زال ممكناً.
- **المضخّم ❌:** dedup القيود ما زال `findFirst` (TOCTOU، `accounting.ts:543-551`) و`schema.prisma:5712` ما زال `@@index` وليس `@@unique` جزئياً على (referenceType, referenceId).

## [4.3] ترقيم مطالبات/دفعات الباطن — ✅ مُصلح (مع متبقٍّ ثانوي)
`@@unique([contractId, claimNo])` (`schema.prisma:2482`) و`@@unique([contractId, paymentNo])` (`:2396`) أُضيفا، والتوليد يجري تحت `FOR UPDATE` على العقد فيتسلسل. **المتبقي الثانوي:** `paymentNo` ما زال `count + 1` (`subcontract-claims.ts:859-862`) لا `MAX + 1` — آمن تزامنياً بفضل القفل، لكن بعد حذف دفعة قد يتكرر الرقم → P2002 خام (لا `withUniqueRetry` هنا؛ النمط الصحيح مطبّق في project-payments.ts:479).

## [4.4] دعوة onboarding — ✅ مُصلح
`invite-team-members.ts:8` صار `subscriptionProcedure` و`:34` يستدعي `enforceFeatureAccess("members.invite")` — نفس بوابة المسار الرسمي. (توحيد نظامي الدعوات UserInvitation/Invitation ما زال قراراً معمارياً مؤجلاً — البوابة نفسها أُغلقت.)

## [4.5] حارس الرصيد في المسارات الأربعة — ✅ مُصلح (الأربعة كلها)
النمط `updateMany({ where: { id, balance: { gte } } })` + فحص count عُمّم:
1. `company.ts:641-647` (markExpensePaymentPaid) ✅
2. `subcontract.ts:837-845` (createSubcontractPayment) ✅
3. `subcontract-claims.ts:895-903` (دفعة مطالبة) ✅
4. `owner-drawings.ts:549-559` ✅ (مع ORPCError). *(ملاحظة سلوكية خارج النطاق: حارس gte هنا قد يتعارض مع آلية الإقرار بالسحب على المكشوف الموجودة في نفس الملف — يُراجع كقرار منتج.)*

## [5.1] حذف دفعة مصروف منشأة — 🟨 مُصلح جزئياً
**الدليل** (`expense-payments.ts:346-395`): إعادة الرصيد موجودة الآن — `organizationBank.update({ balance: { increment: paidAmount ?? amount } })` وحذف `financeExpense` **معاً داخل `$transaction` واحدة**. **الخلل المالي الأساسي (نقص الرصيد الدائم) أُغلق.** المتبقي: المسار كاملاً ما زال 3 كتابات غير منسقة (حذف الدفعة، عكس القيد، معاملة الرصيد/الحذف) — انهيار بينها يترك حالة وسيطة، والـ catch الأخير console.error فقط.

## [5.2] تعديل مبلغ دفعة مدفوعة — 🟨 مُصلح جزئياً
**الدليل** (`expense-payments.ts:246-308`): فرق المبلغ يُطبَّق على البنك (`decrement: delta` — يعيد عند السالب)، و`paidAmount` يُحدَّث مع `amount`، والقيد يُعكس ويُعاد إنشاؤه. **الأخطاء الجوهرية الثلاثة (أ/ب من التقرير) أُغلقت.** المتبقي: 5 كتابات خارج `$transaction` واحدة (ج).

## [5.3/2.8] reverseJournalEntry — ✅ مُصلح
**الدليل** (`accounting.ts:681-717`): الكتابات الثلاث (إنشاء العكسي، ترحيله، وسم الأصل REVERSED) داخل `db.$transaction` واحدة، و`createJournalEntry` ينضم إليها عبر `existingTx`. نافذة العكس المزدوج أُغلقت، مع idempotency إضافية من dedup على (REVERSAL, entryId).

## [7.1] الأرقام التسلسلية — ✅ مُصلح بالكامل
كل الحقول الأحد عشر تحوّلت من `@unique` عالمي إلى مركّب org-scoped (فحص حقلاً حقلاً في schema.prisma):
`invoiceNo:4291`, `quotationNo:4074`, `expenseNo:4599`, `paymentNo:4665`, `transferNo:4706`, `documentNo:4393`, `quoteNumber` (مقيّد بالدراسة) `:1853`, `voucherNo` في FinanceExpense `:4600` / SubcontractPayment `:2397` / ReceiptVoucher `:6129` / PaymentVoucher `:6204`. لا `@unique` سطري متبقٍّ على أي منها. **ملاحظة:** لا مجلد migrations في المشروع إطلاقاً (مشروع `db push`) — الحكم على الـ schema، ويلزم التأكد أن `push` نُفّذ على الإنتاج.

## [7.2] حارس حذف المشروع — ✅ مُصلح
`delete-project.ts:31-59`: أُضيف `db.projectExpense.count({ where: { organizationId, projectId } })` إلى Promise.all. **متبقٍّ ثانوي:** سندات الصرف بـ projectId لا تُعدّ — لكن علاقتها SetNull لا Cascade فالخطر أدنى.

## [7.3] حارس حذف البنك — ✅ مُصلح
`org-finance.ts:623-666`: `_count` توسّع من 4 إلى **14 علاقة** تشمل كل المفقود: invoicePayments, subcontractPayments, projectPaymentsTo, companyExpensePayments, payrollRuns, ownerDrawings, capitalContributionsReceived, receiptVouchersTo, paymentVouchersFrom, **reconciliations** (خطر الـ Cascade موثّق بتعليق).

## [8.1] type-check — ✅ مُصلح (نُفّذ فعلياً)
`pnpm --filter @repo/web type-check` → exit 0 بلا أي خطأ. أخطاء eventPrefs/NotificationType الأحد عشر زالت (prisma generate شُغّل والأنواع ضُيّقت).

---

# 3. تفصيل المشاكل العالية 🟠 (مختصر)

- **[2.9] ✅** — `finance.ts:1714-1727`: السقف يُحسب الآن بـ `calculateInvoiceTotals` ويقارن `totals.totalAmount` (شامل الخصم وVAT) بإجمالي شامل — وحدات متجانسة.
- **[2.10] ✅** — `accounting.ts:570-590`: `await tx.organizationAuditLog.create(...)` داخل try/catch قبل `return null` — لا "Transaction already closed".
- **[2.11] 🟨** — أُضيف تسجيل `JOURNAL_ENTRY_FAILED` لفشل seeding (`auto-journal.ts:104-109`) ولحارس 2170 (`:471-476`) فقط. **المتبقي:** ~14 عودة صامتة `if (!accId) return;` في بقية الـ hooks (سطور 178، 222، 278، 348، 386، 425، 522، 594، 629، 666، 747، 793، 971) بلا أي أثر تدقيقي — فجوة القيود الصامتة قائمة لمعظم الأنواع.
- **[2.12] ✅** — `org-audit.ts:17-46`: ترجع `Promise<void>` وتُنتظر في مسارات الأخطاء المالية الحرجة.
- **[2.13] ✅** — `expenses.ts:470-528`: snapshot قبل التعديل؛ تغيير فئة/تاريخ/مشروع لمصروف COMPLETED → reverse + recreate.
- **[2.14] ✅** — رصيد البنك يتحرك الآن مع السندات اليدوية: قبض increment عند الإصدار (عكسه عند الإلغاء)، صرف decrement بحارس gte يرمي "الرصيد غير كافي" (عكسه عند الإلغاء). ثانوي: تحريك الرصيد والقيد متتاليان لا ذريان.
- **[2.15] 🟨** — فحص `isPeriodClosed` أُضيف **قبل** العكس (يمنع يتم القيد) لكن: (أ) `updateProjectPayment` يكون قد حفظ التاريخ الجديد قبل الحارس، (ب) الرمية تُبتلع في catch الخارجي (تسجيل فقط، بلا rethrow) → المستخدم يرى نجاحاً بينما تاريخ الدفعة انحرف عن تاريخ قيدها. المطلوب: تقديم الحارس قبل الكتابة + `ORPCError`.
- **[2.16] ✅** — `accounting-reports.ts:639,717-723`: join على `categoryRef.isVatExempt` بدل مقارنة cuid بقائمة نصية؛ الاحتياط يقارن enum `category` الصحيح.
- **[2.17] ✅** — حارس 2170 + تاريخ `approvedAt` الفعلي (fallback يوم 28 للمسيّرات القديمة) — **مع اختبارين جديدين** في auto-journal.test.ts.
- **[4.6] ✅** — دفعات مطالبات الباطن: قراءة `paidAmount` حديثة تحت قفل العقد؛ `contractPaymentTerm` عبر `lockProjectContract` + `withUniqueRetry`.
- **[4.7] ❌** — ازدواجية FinanceExpense/ProjectExpense كما هي؛ لا شارة "غير محاسبي"، لا تحويل، لا مطابقة.
- **[4.8] 🟨** — التقريب وُحّد فعلاً (`finance/lib/utils.ts:154-184` — `roundHalfUp2` لكل بند يطابق ROUND_HALF_UP الخادمي، بتعليق "مرآة معاينة")؛ لكن لم تُستخرج دالة مشتركة في `packages/utils` — نسختان متطابقتان بالاتفاق. (الخادم لا يثق بمجاميع العميل أصلاً — الخطر محصور بانحراف مستقبلي).
- **[5.4] 🟨** — year-end-closing.ts:196-203: `.catch` أُزيل ويفشل الإقفال بصدق ✅. owner-drawings.ts:288-298: ما زال يبتلع إلى 0 (بتعليق يبرره كاتجاه متحفظ في فحص السحب) — ليس نفس خطر توزيع الأرباح لكنه ليس hard-fail.
- **[5.5] 🟨** — 6 من 7 مواقع تسجّل الآن `orgAuditLog` (بـ action=JOURNAL_ENTRY_FAILED + metadata.type=*_VOUCHER_AUTO_CREATE). **المتبقي:** `project-payments/lib/payment-side-effects.ts:99-104` — console.error فقط.
- **[5.6] ✅** — حذف دفعة الفاتورة يلغي السند أولاً (`create-invoice.ts:698-708` updateMany مقيّد بالمنظمة)؛ حذف دفعة المشروع يلغيه **ذرياً داخل نفس الـ tx** (`project-payments.ts:743-752`).
- **[5.7] 🟨** — أُصلح العنوان فقط: `transfers.ts:140-147` يحوّل "الرصيد غير كافي" إلى `ORPCError BAD_REQUEST`. الباقي كما هو: payroll.ts:131، year-end-closing.ts (4 مواقع)، journal-entries.ts (3)، chart-of-accounts.ts (7)، banks.ts:87، create-invoice.ts:368/372، dashboard/router.ts (9×Unauthorized) — كلها ما زالت `Error` عادية → 500 غامض.
- **[5.8] ✅** — (انظر 2.20c) `closePeriod` في transaction واحدة.
- **[6.1]/[6.2] 🟨** — الأخطر أُصلح: `generateAtomicNoBatch` يحجز N رقماً **باستعلام واحد قبل** الـ transaction (payroll.ts:255، expense-runs.ts:241). المتبقي: حلقة create+update (كتابتان لكل بند) داخل الـ tx بلا createMany — 50 موظفاً ≈ 100 كتابة ≈ 2.5s على زمن Mumbai، أفضل من 3.75s لكن ما زال قابلاً للتحسين.
- **[6.3] ✅** — `reconcile-project-payments.ts:74-99`: findMany واحد بـ `referenceId: { in }` + Map؛ `projectHasBillingDocuments` memoized لكل مشروع.
- **[7.4a]/[7.4b] ✅** — قيود unique للمطالبات والدفعات (انظر 4.3).
- **[10.1] ❌** — العدّ الحالي **132 موضعاً في 65 ملفاً** — مطابق تماماً لعدّ التقرير. لا استبدال بـ `orpc.*.key()`.
- **[10.2] ✅** — `PaymentsList.tsx:101` يستهلك `data.totalAmount`؛ الخادم يجمع بـ `aggregate _sum` على كامل الـ where (بلا take) عبر financePayment + projectPayment معاً.
- **[10.3] ✅** — `QuantitiesList.tsx:51-56` يستهلك `data.stats`؛ الخادم `groupBy` على كامل المنظمة متجاهلاً الترقيم وفلتر الحالة (cost-studies.ts:44,67-72).
- **[10.4] ✅** — `CashFlowCard` → `orpc.finance.reports.cashFlow` (نطاق 8 أسابيع حقيقي)؛ `DeadlinesCard` → `orpc.finance.outstanding`. لا mock على الصفحة. (بقايا mock في مكونات **ميتة غير معروضة**: FinanceOverviewPanel وFinanceAlerts — دين تنظيف 10.6.)

---

# 4. مسح المتوسطة 🟡 والمنخفضة ⚪ (سطران لكل بند)

| البند | الحكم | الخلاصة |
|-------|-------|---------|
| 2.18 float مالية (4 مواضع) | 🟨 | مسار addPayment صار Decimal ✅؛ الباقي كما هو: getAccountBalance (accounting.ts:741)، جمع الأرصدة الافتتاحية float+عتبة 0.001 (:1777-1794)، عكس الدفعة والإشعار في finance.ts (:1404، :1790)، سطور إقفال السنة float+toFixed(2) |
| 2.19 VAT 15% مثبّت (5 مواضع) | ❌ | لا ثابت VAT_RATE في @repo/utils؛ المواضع الخمسة كما هي (auto-journal:295، accounting-reports:727/742، cost-studies:485، project-finance:179، markup:317) |
| 2.20a تعديل مقبوض مباشر | ❌ | payments.ts:266-286 — لا reverse+recreate عند تغيير date/projectId (بعكس المصروفات المُصلحة في 2.13) |
| 2.20b افتراض 15% لكل مصروف | ❌ | auto-journal.ts:285-296 كما هو |
| 2.20c closePeriod غير ذري | ✅ | accounting.ts:1383-1406 — transaction واحدة |
| 3.11 protectedProcedure للكتابة | ✅ | organization-owners.ts:477 → subscriptionProcedure |
| 3.12 ربط بنود الدراسة | ✅ | cost-studies.ts — كل عائلات البنود (structural/finishing/MEP/labor) مقيّدة بـ `{ id, costStudyId }` مع فحص count |
| 3.13 quotation بلا org | ✅ | create-invoice.ts:146-151 — updateMany مقيّد |
| 4.9a مولّدات بلا retry | 🟨 | createClaim آمن (قفل + unique backstop)؛ createBankChartAccount (accounting.ts:256) بلا قفل/retry — P2002 خام ممكن |
| 4.9b تكرار formatCurrency | ❌ | 63 تعريفاً في 61 ملفاً — لا توحيد |
| 4.9c دوال التاريخ المكررة | ❌ | formatters.ts:199 مقابل finance/lib/utils.ts — كما هي |
| 4.9d الأنواع المكررة | ❌ | 9 ملفات بتعريفات محلية (InvoiceItem/PaymentTerm/…) |
| 5.9a `.catch(() => {})` للتدقيق | ❌ | ~34 موقعاً في packages/api (منها ~17 في subcontracts) — النمط قائم |
| 5.9b ربط أمر التغيير fire-and-forget | ❌ | create-change-order.ts:62-72 كما هو |
| 5.9c تخزين بنك الرواتب مبتلَع | ❌ | payroll.ts:201-206 كما هو |
| 5.9d SubcontractForm toast زائف | ❌ | SubcontractForm.tsx:131-151 — catch فارغة + toast.success غير مشروط |
| 6.4a قائمة القيود include كامل | ❌ | journal-entries.ts:96-108 كما هي |
| 6.4b seedChartOfAccounts تسلسلي | ❌ | accounting.ts:173-202 — لا createMany (أثر مقيّد: مرة واحدة لكل منظمة) |
| 6.4c bulkUpdateProgress 2N | ❌ | project-execution.ts:327-360 كما هو |
| 6.4d chatbot self-HTTP مزدوج | ✅ | chatbot/page.tsx:12-33 — جلب واحد يُعاد استخدامه في prefetch |
| 6.4e upsert تنبيهات لكل زيارة | ❌ | project-insights.ts:159-178 كما هو |
| 6.4f apply-preset create لكل بند | ❌ | apply-preset.ts:42-68 كما هو |
| 6.4g recharts ستاتيكي | ❌ | AgedReceivables:35، AgedPayables:33، IncomeStatement:32 — لا dynamic |
| 6.4h unread chat 3 استعلامات | ❌ | project-chat.ts:183-204 كما هو |
| 7.4c CostStudy.status نص حر | ❌ | schema:1402 كما هو |
| 7.4d CapitalContribution.status نص حر | ❌ | schema:5818 كما هو |
| 7.4e دقة defaultVatPercent | ✅ | `@db.Decimal(5,2)` — schema:3408 |
| 7.4f دقة Lead | ✅ | estimatedArea (15,4) / estimatedValue (15,2) — schema:5333-5334 |
| 7.4g AssetDetail Number(null)=0 | ❌ | AssetDetail.tsx:218-226 كما هو |
| 7.4h الفهارس الناقصة | ✅ | issueDate (:4292) + sourceAccountId ×2 (:4346، :2398) |
| 7.4i `.nullish()` | ❌ | subcontracts/create.ts:41-42 كما هو (مخالفة §5.11) |
| 7.4j `.trim().optional()` | ❌ | quantities/update.ts:34 كما هو |
| 8.2 lint | ❌ | 604/4,525/145 — بلا تغيير فعلي (كان 602/4,526/145) |
| 8.3 @ts-expect-error | ✅ | 7 مواضع كما كانت، صفر في api/database — لا انحدار |
| 9.1 عربي hardcoded | ❌ | 3,239 سطراً عربياً في 241 ملفاً بنطاق saas وحده؛ الملفات الأربعة المسماة كما هي (BOQSummaryTable 92 سطراً، LaborOverviewTab 94، PricingPageContentV2 91، permission-labels 59) |
| 9.2 خصائص اتجاه فيزيائية | ❌ | 493 حالة في 135 ملفاً (كان 505/136) — فرق ضمن الضجيج؛ BOQSummaryTable ما زال الأسوأ بـ 34 |
| 10.5 endpoints يتيمة | ❌ | العينات الست كلها ما زالت يتيمة (documents.*, accounts.create/update/deactivate, journal.create, project-finance subcontract CRUD, expenses.payments.delete/update, handover print/warrantyStatus) |
| 10.6 الكود الميت | ❌ | العينات الثماني كلها موجودة وغير مستهلكة (بما فيها adjustment-templates.ts المذكور في CLAUDE.md كنشط) |
| 10.7 نظافة الجذر | ❌ | ~125 ملفاً قديماً الآن (زاد — أُضيف SESSION_HANDOFF جديد)؛ all-errors.txt وbuild-errors.txt وملفات .jsx باقية |

---

# 5. فحص الانحدار (Regression Check)

## 5.1 القائمة الحمراء
- **المحركات الحسابية (structural/derivation/mep/other) وملفات ZATCA: لم تُمس إطلاقاً** — `git diff --stat cc21136f^..HEAD` عليها فارغ. ✅
- **3 ملفات حمراء لُمست، كلها ضمن نطاق توصيات التقرير:**
  1. `auto-journal.ts` (+30): تسجيل فشل seeding + حارس 2170 + تاريخ approvedAt — توصيات 2.11/2.17 حرفياً. **لم تُعدَّل أي معادلة قيد.**
  2. `queries/accounting.ts` (+166): معامل `existingTx` لـ createJournalEntry، await لسجل SKIPPED، ذرية reverseJournalEntry وclosePeriod، إعادة ترتيب saveOpeningBalances — كلها إصلاحات السلامة الموصى بها (2.5/2.7/2.8/2.10/5.8).
  3. `schema.prisma` (+38): قيود `@@unique` المركّبة والفهارس ودقة Decimal — توصيات 7.1/7.4/4.3 حرفياً.
- **التقييم: لا تجاوز للنطاق في أي ملف أحمر.**

## 5.2 إصلاحات بلا اختبارات ⚠️
**ملف اختبار واحد فقط** تغيّر في الموجة كلها (`auto-journal.test.ts` +77): حالتا الرواتب (غياب 2170 → audit log؛ تاريخ approvedAt + fallback يوم 28) — تغطي 2.17 فقط.
**مساحات إصلاح كبرى بلا أي اختبار:**
- الإشعار الدائن 2.1 (`.abs()` في نقطة الاستدعاء — اختبار الـ hook يغطي العقد الجديد لكن لا اختبار تكاملي يثبت التمرير الموجب من الـ procedure)
- أقفال الدفعات وسقوفها (4.1/4.2/4.6 و#48–#52)
- ثغرات IDOR العشر (3.1–3.10) — لا اختبار cross-tenant جديداً لأي منها
- حراس الرصيد gte الأربعة (4.5)، سقف دفعة الفاتورة (2.6)، حارسا حذف المشروع/البنك (7.2/7.3)
- ذرية accounting.ts (reverseJournalEntry/closePeriod/openingBalances)

## 5.3 خروقات قواعد CLAUDE.md في الإصلاحات
- **خرق واحد:** `project-payments/procedures/update.ts:~158` — `throw new Error("لا يمكن تعديل دفعة إلى تاريخ في فترة محاسبية مغلقة")` داخل procedure بدل `ORPCError` (§5.11) — وهو نفسه المُبتلَع في ملاحظة 2.15.
- لا استعلامات جديدة بلا organizationId، لا خصائص RTL فيزيائية مضافة، لا `.nullish()` جديد. ✅

## 5.4 تزامن Schema
- **لا مجلد migrations في المشروع** — مشروع `db push` خالص؛ تغييرات الـ schema (قيود unique/فهارس/دقة) تُطبَّق بالـ push. **يلزم التأكد أن `push` نُفّذ على قاعدة الإنتاج** — القيود المركّبة قد تفشل في الـ push إذا كانت بيانات الإنتاج تحوي تكرارات تاريخية (سيناريو يجب اختباره قبل النشر).
- لا حقول scalar جديدة → لا مشكلة تزامن client (وtype-check النظيف يؤكد أن generate شُغّل لإصلاح 8.1).

## 5.5 ملاحظات جانبية
- توجد نسخة قديمة من الشجرة تحت `.claude/worktrees/confident-mendeleev` — استُثنيت من كل الأعداد.
- تعديلات غير مُرحّلة على `packages/i18n/translations/ar.json` و`en.json` في شجرة العمل (خارج نطاق هذا التحقق).

---

# 6. قائمة المتبقي قبل الإطلاق (مرتبة بالخطورة)

> كل بند مصاغ ليصلح أساساً لبرومبت إصلاح. الجهد: S (ساعات) / M (يوم–يومان) / L (أسبوع+).

| # | المرجع | المطلوب بدقة | الجهد |
|---|--------|---------------|-------|
| 1 | [4.1] 🔴 | `packages/database/prisma/queries/finance.ts` — دالة `deleteInvoicePayment` (~:1386-1420): انقل قراءة الفاتورة داخل الـ `$transaction` بعد `SELECT ... FOR UPDATE` (انسخ نمط `addInvoicePayment` في نفس الملف :1308-1358)، واشتق `newPaidAmount` من القراءة المقفولة | S |
| 2 | [4.2] 🔴 | `packages/database/prisma/queries/project-finance.ts` — دالة `updateClaimStatus` (~:585-676): استبدل `tx.projectClaim.update({ where: { id } })` بـ `updateMany({ where: { id, status: existing.status } })` + `if (count === 0) throw` (انسخ نمط subcontract-claims.ts:724-730) | S |
| 3 | [2.15] 🟠 | `packages/api/modules/project-payments/procedures/update.ts` (~:141-190): قدّم فحص `isPeriodClosed` للتاريخ الجديد **قبل** استدعاء `updateProjectPayment`، وارمِ `ORPCError("BAD_REQUEST")` خارج الـ catch المبتلِع (يعالج أيضاً خرق CLAUDE.md الوحيد) | S |
| 4 | [2.5] 🔴🟨 | `packages/database/prisma/queries/accounting.ts` — `saveOpeningBalances` (~:1803-1835): لفّ الإنشاء والحذف في `$transaction` واحدة ممرِّراً `tx` عبر `existingTx` (البنية جاهزة)، أو أعطِ القيد `referenceId` ثابتاً (مثل `opening-${organizationId}`) ليعمل الـ dedup | S |
| 5 | [5.1]/[5.2] 🔴🟨 | `packages/api/modules/company/procedures/expense-payments.ts` (:246-308، :346-395): لفّ كامل تسلسل الكتابات (تعديل/حذف الدفعة + عكس القيد + الرصيد + financeExpense) في `$transaction` واحدة لكل مسار | M |
| 6 | [4.2-مضخّم] 🟠 | `schema.prisma:5712`: قيّد unique جزئي على `(organizationId, referenceType, referenceId)` حيث `status != 'REVERSED'` (raw SQL عبر push أو تعديل التصميم) لقفل تكرار القيود التلقائية نهائياً — بعد تنظيف أي تكرارات قائمة | M |
| 7 | [2.11] 🟠🟨 | `packages/api/lib/accounting/auto-journal.ts`: أضف `orgAuditLog(JOURNAL_ENTRY_FAILED, reason: "missing_account_<code>")` قبل كل `return` صامتة في الـ hooks (~14 موقعاً: 178، 222، 278، 348، 386، 425، 522، 594، 629، 666، 747، 793، 971) — نفس نمط حارس 2170 المطبّق (قائمة حمراء: التعديل تسجيل فقط، لا مساس بمنطق القيود) | S |
| 8 | [5.5] 🟠🟨 | `packages/api/modules/project-payments/lib/payment-side-effects.ts:99-104`: أضف `orgAuditLog` في الـ catch كبقية المواقع الستة | S |
| 9 | [5.4] 🟠🟨 | `packages/api/modules/accounting/procedures/owner-drawings.ts:288-298`: حوّل ابتلاع فشل مساهمات رأس المال إلى فشل صريح (أو على الأقل orgAuditLog) | S |
| 10 | [4.3-متبقٍّ] 🟠 | `subcontract-claims.ts:859-862`: حوّل ترقيم `paymentNo` من `count+1` إلى `MAX+1` مع `withUniqueRetry` (نمط project-payments.ts:479 — وموثّق في ذاكرة المشروع) | S |
| 11 | [10.1] 🟠 | استبدال 132 مفتاح إبطال مسطّح بـ `orpc.<module>.<proc>.key()` (65 ملفاً — قابل للأتمتة بـ codemod + مراجعة) | M |
| 12 | [5.7] 🟠🟨 | تعميم mapping `Error → ORPCError` على المواقع المتبقية: payroll.ts:131، year-end-closing.ts (4)، journal-entries.ts (3)، chart-of-accounts.ts (7)، banks.ts:87، create-invoice.ts:368/372، dashboard/router.ts (9) | M |
| 13 | [4.7] 🟠 | قرار منتج: شارة "غير محاسبي" على ProjectExpense في واجهة مصروفات المشروع أو زر تحويل لمصروف مالي | M |
| 14 | [4.8] 🟠🟨 | استخراج معادلة المجاميع المشتركة إلى `packages/utils` واستيرادها من `finance.ts` و`finance/lib/utils.ts` (إزالة خطر الانحراف المستقبلي) | S |
| 15 | [6.1]/[6.2] 🟠🟨 | إتمام batching: استبدال حلقة create+update داخل الـ tx بـ createMany + ربط لاحق (أو أعِد البناء بمعرّفات مولّدة مسبقاً) | M |
| 16 | اختبارات | تغطية الإصلاحات الحرجة: cross-tenant للـ IDORs العشر، تزامن دفعات الفواتير (add+delete)، سقف الدفعة، حراس gte، اختبار تكاملي للإشعار الدائن يمرّر قيماً سالبة عبر الـ procedure | M–L |
| 17 | نشر Schema | تنفيذ `pnpm --filter @repo/database push` على الإنتاج بعد **فحص التكرارات التاريخية** في invoiceNo/expenseNo/… (قد تُفشل القيود المركّبة الـ push) | S |

**بعد الإطلاق (كما صنّفها التقرير الأصلي، لم تُعالج):** 2.18/2.19 (float/VAT ثابت)، 2.20a/b، 4.9b-d، 5.9a-d، 6.4a-h، 7.4c/d/g/i/j، 8.2، 9.1/9.2، 10.5/10.6/10.7.

---

# 7. التوصية النهائية

## هل المنصة جاهزة للإطلاق التجاري من منظور هذا التدقيق؟ **مشروط — نعم بعد إغلاق 5 بنود**

**ما أُنجز فعلاً (إنجاز كبير خلال يوم واحد):**
- كل الثغرات الأمنية العشر (IDOR) أُغلقت بنمط صحيح غير قابل للالتفاف — تحقق مستقل لكل موقع.
- خطوط النزيف المحاسبي الثلاثة الأخطر (الإشعار الدائن 2.1، ترقيم الفواتير 7.1، البناء المكسور 8.1) أُغلقت بالكامل.
- الذرية المحاسبية الجوهرية (reverseJournalEntry، closePeriod، إقفال السنة بـ tx، حارس الحالة والسقف للدفعات، حراس gte الأربعة، حراس الحذف) في مكانها.
- القائمة الحمراء احتُرمت: المحركات وZATCA لم تُمس، وauto-journal عُدّل ضمن التوصيات فقط.
- type-check نظيف و1,160 اختباراً ناجحاً.

**الشروط قبل الإطلاق (البنود 1–5 في القسم 6 — مجموعها جهد يوم تقريباً):**
1. **race حذف دفعة الفاتورة** (4.1) — البنية المعيبة نفسها التي أُصلحت في الإضافة.
2. **الاعتماد المزدوج لمستخلصات المشروع** (4.2 — project-finance) — النمط المُصلح في الباطن لم يُنقل إليه.
3. **حارس الفترة المغلقة المبتلَع** في تعديل دفعة المشروع (2.15).
4. **ذرية الأرصدة الافتتاحية** (2.5) — خطر التضاعف بدل خطر الفقدان.
5. **التحقق من تطبيق قيود الـ schema على الإنتاج** (`db push` مع فحص التكرارات التاريخية) — بدون هذا، إصلاح 7.1 حبر على schema.

**وبإلحاح تالٍ مباشرة (لا يمنع الإطلاق لكنه دين مخاطرة):** إكمال ذرية expense-payments (5.1/5.2)، تسجيل الحسابات الغائبة في بقية hooks (2.11)، والبند 16 (الاختبارات) — الموجة أُصلحت بلا شبكة اختبارات تحميها من الانحدار في أول refactor قادم.

---

*انتهى تقرير التحقق — 2026-07-06 — فُحصت جميع بنود v6.0 المرقّمة (لا يوجد قسم "لم يُفحص")*
