# إكمال نظام المحاسبة — البرومبتات المتبقية

## ملخص الوضع الحالي

### ✅ ما تم تنفيذه (Backend فقط):
- **المرحلة 1:** 4 تقارير محاسبية سلبية (Aged Receivables/Payables, VAT, Income Statement) — Backend + UI كامل ✅
- **المرحلة 2:** Schema (3 models + 3 enums) + دليل حسابات (45 حساب + seed + CRUD) + القيود (CRUD + ترحيل + عكس) + محرك التوليد (8 hooks) + راوتر + ترجمة — **Backend فقط**
- **المرحلة 3:** ميزان مراجعة (raw SQL) + قائمة الدخل من القيود + الميزانية العمومية + قيود تسوية (6 قوالب) + إقفال الفترات (AccountingPeriod model) — **Backend فقط**

### ❌ ما لم يُنفّذ:
1. **`db:push`** — Schema المرحلة 2 و 3 لم تُطبّق على قاعدة البيانات
2. **ربط Auto-Journal Hooks** — الـ 8 hooks موجودة لكن غير مستدعاة من الـ procedures المالية
3. **كل صفحات UI** للمرحلة 2 و 3 (دليل حسابات، قيود، تقارير، تسوية، فترات)

---
---
---

# البرومبت 1/4 — تطبيق Schema + ربط الـ Hooks (البنية التحتية الحرجة)

## الهدف
تطبيق Schema على قاعدة البيانات + ربط محرك التوليد التلقائي بكل العمليات المالية. **بدون هذا البرومبت لا شيء يعمل.**

## ⛔ القائمة الحمراء — ملفات لا تلمسها أبداً
- `structural-calculations.ts`
- `derivation-engine.ts`
- `packages/api/modules/quantities/**`
- لا تغيّر أي منطق في الـ procedures المالية — فقط **أضف سطر واحد** بعد نجاح كل عملية

## المرحلة الفرعية 1: تطبيق Schema

### الخطوة 1: تشغيل db:push

```bash
cd D:\Masar\Masar
pnpm --filter @repo/database db:push
```

إذا فشل بسبب timeout مع Supabase Mumbai:
```bash
# جرّب مع timeout أطول
DATABASE_URL="postgresql://...?connect_timeout=60" pnpm --filter @repo/database db:push
```

### الخطوة 2: إعادة Generate

```bash
pnpm --filter @repo/database db:generate
pnpm tsc --noEmit
```

### الخطوة 3: التحقق

تأكد أن هذه الـ models موجودة في Prisma Client:
- `ChartAccount` (أو `Account` — اقرأ schema.prisma أولاً لمعرفة الاسم الفعلي)
- `JournalEntry`
- `JournalEntryLine`
- `AccountingPeriod`

والـ enums:
- `ChartAccountType` (أو `AccountType`)
- `NormalBalance`
- `JournalEntryStatus`

---

## المرحلة الفرعية 2: ربط Auto-Journal Hooks

### الخطوة 1: قراءة الملفات (إلزامي)

```
اقرأ هذه الملفات بالكامل قبل أي تعديل:
1. packages/api/lib/accounting/auto-journal.ts — لفهم الـ 8 hook functions وما تتوقعه من parameters
2. packages/api/modules/finance/procedures/ — كل الملفات — لفهم أين تنجح العملية وأين يكون الـ return
3. packages/database/prisma/queries/org-finance.ts — createExpense, createTransfer, createPayment
4. packages/api/modules/subcontract/procedures/ — ملف المدفوعات
5. packages/api/modules/company/procedures/ — payroll
```

### الخطوة 2: إضافة استدعاءات try/catch

**النمط الموحّد لكل استدعاء:**
```typescript
// بعد نجاح العملية مباشرة، قبل الـ return:
try {
  await onXXX(db, { ...relevantData });
} catch (e) {
  console.error("[AutoJournal] Failed:", e);
  // صامت — لا تفشل العملية الأصلية بسبب خطأ محاسبي
}
```

**الجدول التفصيلي — اقرأ كل ملف أولاً لتحديد الموقع الصحيح:**

| # | العملية | Hook Function | الملف المتوقع | أين تضيف الاستدعاء | البيانات المطلوبة |
|---|---------|--------------|--------------|-------------------|-----------------|
| 1 | إصدار فاتورة | `onInvoiceIssued` | `invoice-issue.ts` أو procedure الفواتير | بعد تغيير status لـ ISSUED | `{ id, organizationId, number, issueDate, clientName, totalAmount, vatAmount, projectId }` |
| 2 | دفعة على فاتورة | `onInvoicePaymentReceived` | `invoice-add-payment.ts` أو المكافئ | بعد إنشاء FinanceInvoicePayment | `{ organizationId, invoiceId, invoiceNumber, clientName, amount, date, sourceAccountId, projectId }` |
| 3 | إشعار دائن | `onCreditNoteIssued` | `invoice-create-credit-note.ts` أو المكافئ | بعد إنشاء الإشعار | `{ id, organizationId, number, issueDate, clientName, totalAmount, vatAmount, projectId }` |
| 4 | مصروف مكتمل | `onExpenseCompleted` | `org-finance.ts` أو procedure المصروفات | بعد إنشاء/تحديث مصروف بحالة COMPLETED | `{ id, organizationId, category, amount, date, description, sourceAccountId, projectId }` |
| 5 | تحويل بين حسابات | `onTransferCompleted` | `org-finance.ts` أو procedure التحويلات | بعد إنشاء التحويل | `{ id, organizationId, amount, date, fromAccountId, toAccountId, description }` |
| 6 | دفعة مقاول باطن | `onSubcontractPayment` | `subcontract-payments.ts` أو المكافئ | بعد إنشاء الدفعة | `{ id, organizationId, contractorName, amount, date, sourceAccountId, projectId }` |
| 7 | اعتماد رواتب | `onPayrollApproved` | `payroll.ts` أو المكافئ | بعد تغيير status لـ APPROVED | `{ id, organizationId, month, year, totalNet, totalGosi, sourceAccountId }` |
| 8 | مقبوضات مباشرة | `onOrganizationPaymentReceived` | `org-finance.ts` أو procedure المقبوضات | بعد إنشاء المقبوض | `{ id, organizationId, amount, date, description, destinationAccountId, projectId }` |

**⚠️ تعليمات حرجة:**
- **اقرأ كل ملف بالكامل أولاً** — أسماء الملفات أعلاه تقديرية، الفعلية قد تختلف
- **ابحث عن النقطة بعد نجاح العملية وقبل `return`** — هناك تضيف الـ try/catch
- **لا تغيّر أي منطق موجود** — فقط أضف block جديد
- **طابق الـ parameters** بما هو متاح في السياق — إذا حقل غير متاح (مثل `clientName`)، اقرأه من الـ include أو أضف select
- **Import** كل hook function من `@repo/api/lib/accounting/auto-journal` (أو المسار الصحيح — اقرأ أولاً)

### الخطوة 3: التحقق

```bash
pnpm tsc --noEmit
pnpm build
```

**تأكد أن:**
- لا أخطاء TypeScript جديدة
- الـ imports صحيحة
- كل try/catch block يلتقط الخطأ بصمت

---
---
---

# البرومبت 2/4 — واجهات دليل الحسابات + القيود اليومية

## الهدف
بناء صفحات UI لدليل الحسابات (شجرة تفاعلية) + القيود اليومية (قائمة + تفاصيل + إنشاء يدوي).

## ⛔ القائمة الحمراء — نفس القائمة السابقة

## التعليمات

### الخطوة 1: قراءة الملفات (إلزامي)

```
اقرأ هذه الملفات بالكامل:
1. packages/api/modules/accounting/router.ts — لفهم كل الـ procedures المتاحة وأسماءها ومدخلاتها ومخرجاتها
2. packages/api/modules/accounting/procedures/chart-of-accounts.ts — 7 procedures: seed, list, getById, create, update, deactivate, getBalance
3. packages/api/modules/accounting/procedures/journal-entries.ts — 7 procedures: list, getById, create, post, reverse, delete, trialBalance, balanceSheet
4. packages/database/prisma/queries/accounting.ts — كل الاستعلامات والأنواع
5. apps/web/modules/saas/finance/components/ — لفهم أنماط التصميم المالية الحالية
6. apps/web/modules/saas/finance/components/shell/constants.ts — للـ navigation
7. apps/web/modules/saas/shared/components/sidebar/use-sidebar-menu.ts — للـ sidebar links
8. apps/web/modules/saas/finance/components/accounting-reports/ — مكونات المرحلة 1 كمرجع للتصميم
9. packages/i18n/translations/ar.json — مفاتيح الترجمة الموجودة (تحت "accounting")
10. packages/i18n/translations/en.json — نفس الشيء
```

### الخطوة 2: صفحة دليل الحسابات (Chart of Accounts)

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/chart-of-accounts/page.tsx
apps/web/app/[locale]/app/[slug]/finance/chart-of-accounts/loading.tsx
apps/web/modules/saas/finance/components/accounting/ChartOfAccountsPage.tsx
```

**مكون `ChartOfAccountsPage.tsx`:**

**حالة عدم التفعيل (لا يوجد حسابات):**
- بطاقة في المنتصف: أيقونة كبيرة + عنوان "تفعيل المحاسبة" + وصف "إنشاء دليل حسابات افتراضي مُعد لشركات المقاولات السعودية"
- زر "تفعيل المحاسبة" يستدعي `accounting.accounts.seed`
- بعد النجاح: يُعيد تحميل الصفحة لعرض الشجرة

**حالة التفعيل (الحسابات موجودة):**

1. **شريط علوي:**
   - حقل بحث سريع — يفلتر الشجرة حسب الرمز أو الاسم (client-side filtering)
   - زر "إضافة حساب" → يفتح Dialog

2. **شجرة الحسابات (Tree View):**
   - اجلب الحسابات عبر `accounting.accounts.list` — ترجع flat list مع `parentId`
   - ابنِ الشجرة في الـ client من `parentId`
   - كل عقدة قابلة للتوسيع/الطي عبر أيقونة `ChevronLeft` (RTL) / `ChevronDown`
   - **المستوى 1** (1000, 2000, 3000, 4000, 5000, 6000): خط عريض، خلفية ملونة خفيفة:
     - أصول (1xxx) = أزرق خفيف
     - خصوم (2xxx) = أحمر خفيف
     - حقوق ملكية (3xxx) = بنفسجي خفيف
     - إيرادات (4xxx) = أخضر خفيف
     - مصروفات (5xxx, 6xxx) = برتقالي خفيف
   - **المستوى 2-4:** مسافة بادئة متزايدة (`ps-4` per level)
   - كل سطر يعرض: `[رمز الحساب]` `[اسم الحساب]` `[badge النوع]` `[الرصيد إذا > 0]`
   - حسابات النظام (`isSystem`) تعرض badge صغير "نظام"
   - حسابات غير قابلة للترحيل (`isPostable = false`) بلون رمادي خفيف
   - أيقونات: `Folder` للحسابات غير القابلة للترحيل، `FileText` للقابلة

3. **Dialog إضافة حساب:**
   - رمز الحساب (4 أرقام) — مع validation: فريد ضمن المنظمة
   - الاسم بالعربية + الاسم بالإنجليزية
   - الحساب الأب — dropdown بحث يعرض شجرة الحسابات المتاحة
   - النوع — auto-filled من الأب (أصول/خصوم/إلخ)
   - هل قابل للترحيل؟ — checkbox (default: true)
   - يستدعي `accounting.accounts.create`

4. **كل حساب قابل للنقر** → يفتح drawer أو dialog جانبي فيه:
   - تفاصيل الحساب (رمز، اسم، نوع، مستوى، الأب)
   - الرصيد الحالي
   - زر "تعديل" (إذا ليس isSystem)
   - زر "إلغاء تفعيل" (إذا ليس isSystem ولا عليه قيود)

**RTL:** استخدم `ms-`, `me-`, `ps-`, `pe-` بدل `ml-`, `mr-`, `pl-`, `pr-`

### الخطوة 3: صفحة القيود اليومية (Journal Entries List)

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/journal-entries/page.tsx
apps/web/app/[locale]/app/[slug]/finance/journal-entries/loading.tsx
apps/web/modules/saas/finance/components/accounting/JournalEntriesPage.tsx
```

**مكون `JournalEntriesPage.tsx`:**

1. **شريط فلاتر علوي:**
   - تاريخ من / إلى
   - حالة: الكل | مسودة | مرحّل | معكوس
   - نوع المرجع: الكل | فاتورة | مصروف | دفعة | تحويل | مقاول باطن | رواتب | يدوي | تسوية
   - حقل بحث (بالوصف أو رقم القيد)

2. **أزرار:**
   - "قيد يدوي جديد" → يفتح Dialog الإنشاء
   - "قيد تسوية جديد" → ينتقل لصفحة التسوية (سنبنيها في برومبت لاحق)

3. **جدول القيود:**
   - الأعمدة: رقم القيد | التاريخ | الوصف | المرجع | المبلغ | الحالة
   - badge الحالة: أصفر = مسودة، أخضر = مرحّل، رمادي = معكوس
   - badge المرجع: لون مختلف لكل نوع (فاتورة=أزرق، مصروف=أحمر، دفعة=أخضر، يدوي=رمادي)
   - إذا `isAutoGenerated = true`: أيقونة صغيرة "⚡ تلقائي"
   - كل صف قابل للنقر → ينتقل لصفحة تفاصيل القيد
   - pagination

4. **حالة فارغة:** "لا توجد قيود بعد. ابدأ بتفعيل المحاسبة من دليل الحسابات."

5. **Dialog إنشاء قيد يدوي:**
   - التاريخ (date picker)
   - الوصف (text)
   - **جدول بنود ديناميكي:**
     - كل بند: حساب (dropdown بحث في الحسابات القابلة للترحيل) | وصف (اختياري) | مدين | دائن | مشروع (اختياري dropdown)
     - زر "إضافة بند" يضيف صف جديد فارغ
     - زر حذف (❌) لكل بند
     - **صف إجمالي** ثابت في الأسفل: مجموع المدين | مجموع الدائن | الفرق
     - إذا الفرق ≠ 0: خلفية حمراء + رسالة "القيد غير متوازن"
     - زر "حفظ كمسودة" — يستدعي `accounting.journal.create`
     - الحفظ معطّل إذا: أقل من بندين، أو القيد غير متوازن

### الخطوة 4: صفحة تفاصيل القيد

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/journal-entries/[id]/page.tsx
apps/web/app/[locale]/app/[slug]/finance/journal-entries/[id]/loading.tsx
apps/web/modules/saas/finance/components/accounting/JournalEntryDetails.tsx
```

**مكون `JournalEntryDetails.tsx`:**

1. **بيانات رئيسية:**
   - رقم القيد + التاريخ + الحالة (badge)
   - الوصف
   - المرجع: نوع + رقم + رابط للمصدر (إذا موجود)
   - "تلقائي" أو "يدوي"
   - تاريخ الإنشاء + تاريخ الترحيل (إذا مرحّل) + من رحّله

2. **جدول البنود:**
   - الأعمدة: رمز الحساب | اسم الحساب | الوصف | المشروع | مدين | دائن
   - صف إجمالي في الأسفل
   - الخلايا الفارغة تبقى فارغة (لا تعرض 0)

3. **أزرار الإجراءات (حسب الحالة):**
   - **مسودة:** ترحيل | تعديل | حذف
   - **مرحّل:** عكس القيد
   - **معكوس:** رابط للقيد العكسي
   - ترحيل يستدعي `accounting.journal.post`
   - عكس يستدعي `accounting.journal.reverse` — يطلب تأكيد أولاً
   - حذف يستدعي `accounting.journal.delete` — يطلب تأكيد أولاً

4. **إذا معكوس:** رسالة "هذا القيد تم عكسه" + رابط للقيد العكسي

### الخطوة 5: إضافة روابط في Sidebar والـ Navigation

اقرأ أولاً:
```
apps/web/modules/saas/finance/components/shell/constants.ts
apps/web/modules/saas/shared/components/sidebar/use-sidebar-menu.ts
```

أضف (إذا لم تُضَف مسبقاً في المراحل السابقة):
- "دليل الحسابات" → `/finance/chart-of-accounts`
- "القيود اليومية" → `/finance/journal-entries`

### الخطوة 6: الترجمة

تحقق من `ar.json` و `en.json` — المفاتيح تحت `accounting` يُفترض أنها أُضيفت في المراحل السابقة. إذا ناقص أي مفتاح، أضفه. المفاتيح المتوقعة:

```json
"accounting": {
  "chartOfAccounts": "...",
  "activateAccounting": "...",
  "activateDescription": "...",
  "accountCode": "...",
  "accountName": "...",
  "accountType": "...",
  "balance": "...",
  "assets": "...", "liabilities": "...", "equity": "...", "revenue": "...", "expenses": "...",
  "systemAccount": "...",
  "addAccount": "...",
  "parentAccount": "...",
  "journalEntries": "...",
  "debit": "...", "credit": "...",
  "posted": "...", "draft": "...", "reversed": "...",
  "entryNo": "رقم القيد",
  "referenceType": "نوع المرجع",
  "autoGenerated": "تلقائي",
  "manual": "يدوي",
  "postEntry": "ترحيل القيد",
  "reverseEntry": "عكس القيد",
  "deleteEntry": "حذف القيد",
  "addLine": "إضافة بند",
  "unbalanced": "القيد غير متوازن",
  "balanceDifference": "الفرق",
  "saveDraft": "حفظ كمسودة",
  "noEntries": "لا توجد قيود بعد",
  "confirmPost": "هل تريد ترحيل هذا القيد؟ لا يمكن التراجع.",
  "confirmReverse": "هل تريد عكس هذا القيد؟ سيُنشأ قيد عكسي.",
  "confirmDelete": "هل تريد حذف هذا القيد نهائياً؟"
}
```

### الخطوة 7: التحقق

```bash
pnpm tsc --noEmit
pnpm build
```

---
---
---

# البرومبت 3/4 — واجهات التقارير المحاسبية (ميزان + قائمة دخل + ميزانية)

## الهدف
بناء 3 صفحات تقارير محاسبية تُبنى من القيود المرحّلة: ميزان المراجعة + قائمة الدخل التفصيلية + الميزانية العمومية.

## ⛔ القائمة الحمراء — نفس القائمة السابقة

## التعليمات

### الخطوة 1: قراءة الملفات (إلزامي)

```
اقرأ هذه الملفات بالكامل:
1. packages/api/modules/accounting/router.ts — لفهم procedures التقارير المتاحة
2. packages/database/prisma/queries/accounting.ts — getTrialBalance, getJournalIncomeStatement (أو getIncomeStatement), getBalanceSheet — افهم المدخلات والمخرجات بالضبط
3. apps/web/modules/saas/finance/components/accounting-reports/ — تقارير المرحلة 1 كمرجع للتصميم
4. apps/web/modules/saas/finance/components/reports/ — تقارير مالية أخرى كمرجع
```

**⚠️ مهم جداً:** الأسماء الفعلية للـ procedures والـ types قد تختلف عما هو مذكور هنا. **اقرأ الملفات أولاً واستخدم الأسماء الحقيقية.**

### قواعد التنسيق المحاسبي — تُطبّق على كل التقارير الثلاثة:

```
1. الأرقام السالبة: بين أقواس (10,000) وليس -10,000
2. فواصل الآلاف: 500,000
3. الخلايا الفارغة: لا تعرض "0" — تبقى فارغة (نمط محاسبي)
4. المجاميع الفرعية: خط تحتها (border-bottom)
5. المجاميع الرئيسية: خط مزدوج (border-bottom-2 أو double)
6. النسب المئوية: بخط أصغر ولون رمادي: 36.0%
7. محاذاة الأرقام: text-start (في RTL الأرقام على اليسار فعلياً)
8. أسماء الأقسام: خط عريض بخلفية ملونة خفيفة
9. العملة: ريال (SAR) — لا تعرضها مع كل رقم، فقط في العنوان
```

أنشئ helper function مشترك:
```
apps/web/modules/saas/finance/components/accounting/formatters.ts
```

يحتوي:
- `formatAccounting(amount: number): string` — فواصل آلاف + أقواس للسالب + فارغ للصفر
- `formatPercent(value: number): string` — نسبة مئوية بدقة 1
- مكون `<AccountingAmount>` — يعرض الرقم بالتنسيق الصحيح مع اللون (أخضر للموجب، أحمر للسالب)

### الخطوة 2: صفحة ميزان المراجعة (Trial Balance)

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/accounting-reports/trial-balance/page.tsx
apps/web/app/[locale]/app/[slug]/finance/accounting-reports/trial-balance/loading.tsx
apps/web/modules/saas/finance/components/accounting/TrialBalanceReport.tsx
```

**مكون `TrialBalanceReport.tsx`:**

1. **شريط فلاتر علوي:**
   - تاريخ "كما في" (as of date) — date picker — الافتراضي: اليوم
   - فترة "من" (اختياري) — لعرض حركة الفترة فقط
   - أزرار اختيار سريع: "اليوم" | "نهاية الشهر" | "نهاية الربع" | "نهاية السنة"
   - checkbox: "إظهار الحسابات بدون حركة"
   - فلتر نوع الحساب (dropdown اختياري): الكل | أصول | خصوم | ملكية | إيرادات | مصروفات

2. **بطاقة حالة التوازن:**
   - إذا `isBalanced = true`: ✅ "ميزان المراجعة متوازن" — خلفية خضراء خفيفة
   - إذا `isBalanced = false`: ❌ "يوجد فرق: {difference} ريال" — خلفية حمراء خفيفة
   - عدد الحسابات النشطة

3. **جدول ميزان المراجعة:**
   ```
   رمز الحساب | اسم الحساب | مدين (حركة) | دائن (حركة) | رصيد مدين | رصيد دائن
   ```
   - الحسابات مرتّبة بالرمز تصاعدياً
   - مسافة بادئة حسب المستوى (level) — استخدم `ps-{level * 4}`
   - حسابات المستوى 1 (1000, 2000...) بخط عريض وخلفية ملونة خفيفة حسب النوع
   - صف الإجمالي في الأسفل بخط عريض وخلفية مميزة + خط مزدوج تحته
   - الخلايا الفارغة تبقى فارغة — لا تعرض "0"
   - تنسيق الأرقام: `formatAccounting()`

4. **حالة فارغة:** "لا توجد قيود مرحّلة بعد. ابدأ بتفعيل المحاسبة من دليل الحسابات."

### الخطوة 3: صفحة قائمة الدخل التفصيلية (Income Statement)

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/accounting-reports/journal-income-statement/page.tsx
apps/web/app/[locale]/app/[slug]/finance/accounting-reports/journal-income-statement/loading.tsx
apps/web/modules/saas/finance/components/accounting/JournalIncomeStatementReport.tsx
```

**ملاحظة:** هذه قائمة الدخل من **القيود المحاسبية** (المرحلة 3) — مختلفة عن قائمة الدخل المبسّطة (المرحلة 1) اللي تُبنى من جداول الفواتير/المصروفات مباشرة. استخدم اسم مميز في الـ URL.

**مكون `JournalIncomeStatementReport.tsx`:**

1. **شريط فلاتر:**
   - فترة: اختيار سريع (هذا الشهر | الربع الحالي | السنة | مخصص)
   - checkbox: "مقارنة بالفترة السابقة"

2. **4 بطاقات KPI:**
   - إجمالي الإيرادات (أخضر) + نسبة التغيير عن الفترة السابقة
   - تكاليف المشاريع (برتقالي) + نسبة من الإيرادات
   - مجمل الربح (أزرق) + هامش %
   - صافي الربح (أخضر/أحمر حسب القيمة) + هامش %

3. **قائمة الدخل بالتنسيق المحاسبي الكلاسيكي:**

   ```
   الإيرادات                                          ← خلفية خضراء خفيفة، خط عريض
     إيرادات المشاريع                    450,000
     إيرادات أوامر التغيير                 30,000
     إيرادات أخرى                         20,000
                                      ──────────       ← border-bottom
     إجمالي الإيرادات                    500,000

   تكاليف المشاريع                                     ← خلفية برتقالية خفيفة
     مواد ومشتريات                       120,000
     مقاولو باطن                         150,000
     عمالة مباشرة                         40,000
                                      ──────────
     إجمالي تكاليف المشاريع            (320,000)
                                      ══════════       ← border-bottom-2
   مجمل الربح                            180,000       ← خط عريض
   هامش مجمل الربح                         36.0%       ← لون رمادي، خط أصغر

   المصروفات التشغيلية                                  ← خلفية حمراء خفيفة
     رواتب وأجور إدارية                   45,000
     إيجارات                              15,000
     ...
                                      ──────────
     إجمالي المصروفات التشغيلية          (80,000)
                                      ══════════
   صافي الربح                            100,000       ← خط عريض كبير
   هامش صافي الربح                         20.0%
   ```

4. **إذا مقارنة مفعّلة:** عمود إضافي يعرض أرقام الفترة السابقة + عمود نسبة التغيير (%)

5. **مخطط Recharts (أسفل القائمة):**
   - Bar chart: إيرادات (أخضر) vs تكاليف (برتقالي) vs مصروفات تشغيلية (أحمر)

### الخطوة 4: صفحة الميزانية العمومية (Balance Sheet)

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/accounting-reports/balance-sheet/page.tsx
apps/web/app/[locale]/app/[slug]/finance/accounting-reports/balance-sheet/loading.tsx
apps/web/modules/saas/finance/components/accounting/BalanceSheetReport.tsx
```

**مكون `BalanceSheetReport.tsx`:**

1. **شريط فلاتر:**
   - تاريخ "كما في" — date picker — الافتراضي: اليوم
   - أزرار اختيار سريع: "اليوم" | "نهاية الشهر" | "نهاية الربع" | "نهاية السنة"

2. **بطاقة تأكيد التوازن:**
   - "الأصول ({مبلغ}) = الخصوم + حقوق الملكية ({مبلغ}) ✅" — أخضر
   - أو "يوجد فرق: {مبلغ} ❌" — أحمر

3. **التنسيق — T-Account بعمودين جنب-لجنب:**

   على الشاشات الكبيرة (`grid-cols-2`):
   ```
   ┌──────────────────────────────┬──────────────────────────────┐
   │ الأصول (يمين — RTL)          │ الخصوم وحقوق الملكية (يسار)  │
   ├──────────────────────────────┼──────────────────────────────┤
   │                              │                              │
   │ الأصول المتداولة   ← عنوان  │ الخصوم المتداولة   ← عنوان  │
   │   النقدية    250,000        │   الموردون     80,000        │
   │   العملاء    350,000        │   مقاولو باطن 120,000        │
   │   ...                       │   ...                        │
   │            ──────────       │              ──────────       │
   │   إجمالي    650,000        │   إجمالي     300,000         │
   │                              │                              │
   │ الأصول الثابتة               │ حقوق الملكية                 │
   │   معدات      180,000        │   رأس المال   200,000        │
   │   مجمع إهلاك (60,000)      │   أرباح مبقاة  60,000        │
   │            ──────────       │   أرباح السنة 290,000  ← لون │
   │   إجمالي    200,000        │              ──────────       │
   │                              │   إجمالي     550,000         │
   │                              │                              │
   │ ══════════════════════      │ ══════════════════════        │
   │ إجمالي الأصول  850,000      │ إجمالي الخصوم+  850,000      │
   │                              │ حقوق الملكية                 │
   └──────────────────────────────┴──────────────────────────────┘
   ```

   على الموبايل: عمود واحد (الأصول أولاً ثم الخصوم + الملكية)

   - "أرباح/خسائر السنة الحالية" تُعرض بلون مميز (أزرق) لأنها **محسوبة** وليست من القيود مباشرة
   - القيم السالبة (مثل مجمع الإهلاك) بين أقواس

### الخطوة 5: إضافة بطاقات في صفحة التقارير المحاسبية الرئيسية

اقرأ:
```
apps/web/modules/saas/finance/components/accounting-reports/AccountingReportsLanding.tsx
```

أضف 3 بطاقات جديدة (إذا لم تكن موجودة):
- ميزان المراجعة → `/finance/accounting-reports/trial-balance`
- قائمة الدخل التفصيلية → `/finance/accounting-reports/journal-income-statement`
- الميزانية العمومية → `/finance/accounting-reports/balance-sheet`

### الخطوة 6: الترجمة

تحقق من المفاتيح الموجودة وأضف الناقص:

```json
"trialBalance": {
  "title": "ميزان المراجعة",
  "asOfDate": "كما في تاريخ",
  "periodFrom": "من تاريخ",
  "balanced": "ميزان المراجعة متوازن",
  "notBalanced": "يوجد فرق في ميزان المراجعة",
  "difference": "الفرق",
  "periodDebit": "مدين (حركة)",
  "periodCredit": "دائن (حركة)",
  "debitBalance": "رصيد مدين",
  "creditBalance": "رصيد دائن",
  "includeZero": "إظهار الحسابات بدون حركة",
  "noEntries": "لا توجد قيود مرحّلة بعد",
  "accountCount": "عدد الحسابات"
},
"journalIncomeStatement": {
  "title": "قائمة الدخل التفصيلية",
  "fromJournalEntries": "من القيود المحاسبية",
  "revenue": "الإيرادات",
  "costOfProjects": "تكاليف المشاريع",
  "grossProfit": "مجمل الربح",
  "grossProfitMargin": "هامش مجمل الربح",
  "operatingExpenses": "المصروفات التشغيلية",
  "operatingProfit": "الربح التشغيلي",
  "netProfit": "صافي الربح",
  "netProfitMargin": "هامش صافي الربح",
  "compareWithPrevious": "مقارنة بالفترة السابقة",
  "change": "التغيير"
},
"balanceSheet": {
  "title": "الميزانية العمومية",
  "assets": "الأصول",
  "currentAssets": "الأصول المتداولة",
  "fixedAssets": "الأصول الثابتة",
  "totalAssets": "إجمالي الأصول",
  "liabilities": "الخصوم",
  "currentLiabilities": "الخصوم المتداولة",
  "totalLiabilities": "إجمالي الخصوم",
  "equity": "حقوق الملكية",
  "currentYearPL": "أرباح/خسائر السنة الحالية",
  "totalEquity": "إجمالي حقوق الملكية",
  "totalLiabilitiesAndEquity": "إجمالي الخصوم وحقوق الملكية",
  "balanced": "الميزانية متوازنة",
  "notBalanced": "الميزانية غير متوازنة"
}
```

### الخطوة 7: التحقق

```bash
pnpm tsc --noEmit
pnpm build
```

---
---
---

# البرومبت 4/4 — واجهات قيود التسوية + إقفال الفترات المحاسبية

## الهدف
بناء صفحة إنشاء قيود التسوية (مع القوالب الجاهزة) + صفحة إدارة الفترات المحاسبية (توليد + إقفال + إعادة فتح).

## ⛔ القائمة الحمراء — نفس القائمة السابقة

## التعليمات

### الخطوة 1: قراءة الملفات (إلزامي)

```
اقرأ هذه الملفات بالكامل:
1. packages/api/modules/accounting/router.ts — procedures التسوية والفترات
2. packages/api/lib/accounting/adjustment-templates.ts — الـ 6 قوالب الجاهزة
3. packages/database/prisma/queries/accounting.ts — generateMonthlyPeriods, closePeriod, reopenPeriod, isPeriodClosed
4. الصفحات المبنية في البرومبت السابق (دليل الحسابات + القيود) كمرجع للتصميم
5. packages/i18n/translations/ar.json + en.json — المفاتيح الموجودة
```

### الخطوة 2: صفحة قيود التسوية (Adjusting Entries)

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/journal-entries/new-adjustment/page.tsx
apps/web/app/[locale]/app/[slug]/finance/journal-entries/new-adjustment/loading.tsx
apps/web/modules/saas/finance/components/accounting/NewAdjustmentEntry.tsx
```

**مكون `NewAdjustmentEntry.tsx`:**

1. **اختيار القالب (Step 1):**
   - 6 بطاقات (grid-cols-3 على desktop, cols-1 على mobile):
     - كل بطاقة: أيقونة + اسم القالب + وصف مختصر
     - الأيقونات:
       - إيرادات مستحقة → `TrendingUp`
       - مصروفات مستحقة → `TrendingDown`
       - إهلاك → `Timer`
       - مقدمات → `CalendarClock`
       - مخصص نهاية خدمة → `ShieldCheck`
       - تصحيحي → `Eraser`
     - عند النقر على قالب: ينتقل للخطوة 2 مع ملء الحقول تلقائياً
   - بطاقة إضافية "قيد حر" → بدون حسابات مسبقة

2. **نموذج القيد (Step 2):**
   - dropdown "نوع التسوية": ACCRUAL | PREPAYMENT | DEPRECIATION | PROVISION | CORRECTION — مملوء تلقائياً من القالب
   - التاريخ (date picker)
   - الوصف — مملوء تلقائياً من القالب
   - الملاحظات (textarea اختياري)
   - checkbox "ترحيل فوري" (default: false)
   - **جدول بنود** — نفس جدول القيد اليدوي بالضبط (من البرومبت السابق):
     - إذا قالب مختار: البنود مملوءة بالحسابات الافتراضية — المبالغ فارغة يدخلها المستخدم
     - إذا قيد حر: جدول فارغ
     - صف إجمالي + مؤشر التوازن
   - زر "حفظ" يستدعي `accounting.journal.createAdjustment`

3. **زر رجوع** يعود لصفحة القيود اليومية

### الخطوة 3: صفحة الفترات المحاسبية (Accounting Periods)

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/accounting-periods/page.tsx
apps/web/app/[locale]/app/[slug]/finance/accounting-periods/loading.tsx
apps/web/modules/saas/finance/components/accounting/AccountingPeriodsPage.tsx
```

**مكون `AccountingPeriodsPage.tsx`:**

1. **شريط علوي:**
   - اختيار السنة: dropdown (2024, 2025, 2026, 2027) — الافتراضي: السنة الحالية
   - زر "توليد الفترات الشهرية" — يظهر فقط إذا لم تُولّد فترات لهذه السنة
   - عند النقر يستدعي `accounting.periods.generate` ثم يُعيد التحميل

2. **جدول الفترات:**
   ```
   الفترة        | النوع  | البداية    | النهاية    | القيود | الحالة     | إجراء
   ─────────────────────────────────────────────────────────────────────────
   يناير 2026    | شهري   | 01/01/2026 | 31/01/2026 | 45     | مغلقة ✅   | إعادة فتح
   فبراير 2026   | شهري   | 01/02/2026 | 28/02/2026 | 38     | مغلقة ✅   | —
   مارس 2026     | شهري   | 01/03/2026 | 31/03/2026 | 52     | مفتوحة 🟡  | إقفال
   أبريل 2026    | شهري   | 01/04/2026 | 30/04/2026 | 12     | مفتوحة 🟡  | —
   ```

   - badge الحالة: أخضر = مغلقة ✅، أصفر = مفتوحة 🟡
   - عمود "القيود": عدد القيود المرحّلة — **قابل للنقر** → يفتح `/finance/journal-entries?dateFrom=...&dateTo=...`
   - زر "إقفال": يظهر **فقط للفترة المفتوحة الأقدم** (لا يمكن إقفال مارس قبل يناير وفبراير)
   - زر "إعادة فتح": يظهر **فقط لآخر فترة مغلقة**

3. **Dialog إقفال الفترة:**
   - عنوان: "إقفال فترة {اسم الفترة}"
   - ملخص:
     - عدد القيود المرحّلة
     - إجمالي المدين / إجمالي الدائن
     - هل متوازن؟ (✅/❌)
   - ⚠️ تحذير: "لا يمكن تعديل أو إضافة قيود بعد إقفال الفترة"
   - **إذا يوجد قيود DRAFT:** رسالة خطأ حمراء: "يوجد {عدد} قيود مسودة في هذه الفترة. يجب ترحيلها أو حذفها أولاً." + رابط "عرض القيود المسودة" → `/finance/journal-entries?status=DRAFT&dateFrom=...&dateTo=...`
   - **إذا إقفال سنوي (آخر شهر في السنة):** checkbox "إنشاء قيد إقفال (ترحيل الأرباح لحساب الأرباح المبقاة)"
   - زر "أقفل الفترة" (أحمر، ليس مجرد "تأكيد") → يستدعي `accounting.periods.close`
   - بعد النجاح: toast نجاح + إعادة تحميل الجدول

4. **Dialog إعادة الفتح:**
   - تأكيد بسيط: "هل تريد إعادة فتح فترة {الاسم}؟"
   - إذا كان هناك قيد إقفال: "سيتم عكس قيد الإقفال تلقائياً"
   - يستدعي `accounting.periods.reopen`

5. **حالة فارغة:** "لا توجد فترات محاسبية. اضغط 'توليد الفترات الشهرية' لإنشاء فترات لهذه السنة."

### الخطوة 4: إضافة روابط في Sidebar والـ Navigation

اقرأ ملفات الـ navigation واضف (إذا لم تُضف مسبقاً):
- "الفترات المحاسبية" → `/finance/accounting-periods`

### الخطوة 5: الترجمة

تحقق من المفاتيح الموجودة وأضف الناقص:

```json
"accountingPeriods": {
  "title": "الفترات المحاسبية",
  "period": "الفترة",
  "monthly": "شهري",
  "quarterly": "ربع سنوي",
  "annual": "سنوي",
  "open": "مفتوحة",
  "closed": "مغلقة",
  "close": "إقفال الفترة",
  "reopen": "إعادة فتح",
  "generate": "توليد الفترات",
  "generateForYear": "توليد الفترات الشهرية لسنة {year}",
  "closingConfirm": "هل أنت متأكد من إقفال هذه الفترة؟",
  "closingWarning": "لا يمكن تعديل أو إضافة قيود بعد الإقفال",
  "draftEntriesExist": "يوجد {count} قيود مسودة. يجب ترحيلها أو حذفها أولاً.",
  "viewDraftEntries": "عرض القيود المسودة",
  "closingEntry": "قيد إقفال",
  "generateClosingEntry": "إنشاء قيد إقفال (ترحيل الأرباح)",
  "cannotModifyClosed": "لا يمكن تعديل قيود في فترة مغلقة",
  "cannotReopenMiddle": "لا يمكن إعادة فتح فترة لاحقة مغلقة",
  "entriesCount": "عدد القيود",
  "periodSummary": "ملخص الفترة",
  "totalDebit": "إجمالي المدين",
  "totalCredit": "إجمالي الدائن",
  "noPeriods": "لا توجد فترات محاسبية"
},
"adjustments": {
  "title": "قيود التسوية",
  "newAdjustment": "قيد تسوية جديد",
  "type": "نوع التسوية",
  "accrual": "استحقاق",
  "prepayment": "مقدمات",
  "depreciation": "إهلاك",
  "provision": "مخصص",
  "correction": "تصحيح",
  "template": "اختر قالب",
  "freeEntry": "قيد حر",
  "autoPost": "ترحيل فوري",
  "selectTemplate": "اختر قالب أو ابدأ قيد حر",
  "accruedRevenue": "إيرادات مستحقة",
  "accruedExpense": "مصروفات مستحقة",
  "fixedAssetDepreciation": "إهلاك أصول ثابتة",
  "prepaidExpense": "مصروف مدفوع مقدماً",
  "endOfServiceProvision": "مخصص نهاية خدمة",
  "correctionEntry": "قيد تصحيحي"
}
```

### الخطوة 6: التحقق النهائي

```bash
pnpm tsc --noEmit
pnpm build
```

---
---
---

# ملاحظات عامة لكل البرومبتات

## ترتيب التنفيذ الإلزامي:
```
البرومبت 1 (Schema + Hooks)   → db:push → tsc → build → commit ← الأهم
البرومبت 2 (دليل حسابات + قيود UI) → tsc → build → commit
البرومبت 3 (تقارير محاسبية UI) → tsc → build → commit
البرومبت 4 (تسوية + فترات UI) → tsc → build → commit
```

**لا تنفّذ البرومبت 2 قبل 1 — الـ UI يحتاج Schema مطبّق + hooks مربوطة.**

## أنماط يجب اتباعها:
1. **كل query يبدأ بـ `organizationId`** — multi-tenancy إلزامي
2. **`Prisma.Decimal`** للحسابات المالية — `Number()` فقط عند العرض
3. **RTL-safe:** `ms-`, `me-`, `ps-`, `pe-` بدل `ml-`, `mr-`, `pl-`, `pr-`
4. **ترجمة:** كل مفتاح جديد في `ar.json` و `en.json` بالتوازي
5. **لا مكونات عملاقة:** إذا تجاوز 400 سطر، قسّمه
6. **بعد كل مرحلة:** `pnpm tsc --noEmit && pnpm build`
7. **اقرأ الملفات أولاً** — الأسماء الفعلية للـ procedures والـ types والملفات قد تختلف عما هو مذكور هنا. ما هو مكتوب في هذه البرومبتات مبني على البرومبتات الأصلية وقد يكون Claude Code اختار أسماء مختلفة أثناء التنفيذ.

## الـ Design Reference:
- **لا تبتكر تصميم جديد** — ارجع دائماً للمكونات الموجودة في:
  - `apps/web/modules/saas/finance/components/` — مكونات المالية
  - `apps/web/modules/saas/finance/components/accounting-reports/` — تقارير المرحلة 1 (مبنية)
  - `apps/web/modules/saas/finance/components/reports/` — تقارير مالية حالية
- استخدم نفس الـ shadcn/ui components: `Card`, `Table`, `Badge`, `Dialog`, `Button`, `Select`, `Input`
- استخدم `lucide-react` icons

## ما بعد هذه البرومبتات:
- تصدير PDF/Excel لكل التقارير
- أداة AI: `queryAccounting` في مساعد مسار
- توليد القيود بأثر رجعي (backfill) للعمليات القديمة
- تقرير حركة حساب (Account Ledger)
- تقرير دفتر الأستاذ العام (General Ledger)
- dashboard محاسبي يعرض ملخص القوائم المالية
