# تقرير التوافق بين النظام المالي الأساسي والنظام المحاسبي في مسار

**تاريخ التحليل:** 2026-03-24
**المحلل:** Claude Code
**نطاق التحليل:** كل الملفات المالية والمحاسبية في المشروع (40+ ملف، ~15,000 سطر كود)

---

## الملخص التنفيذي

النظامان **متوافقان جزئياً** مع **7 فجوات جوهرية** و**3 حالات ازدواجية بيانات** قد تؤدي لعدم تطابق الأرقام. النظام المالي الأساسي يعمل بشكل مستقل تماماً عن المحاسبة — يتتبع الأرصدة مباشرة في `OrganizationBank.balance`. النظام المحاسبي يعمل بالتوازي عبر القيود اليومية. المشكلة الأساسية: **ليس كل عملية مالية تؤثر على رصيد البنك تولّد قيداً محاسبياً**. أبرز الفجوات:

1. **مدفوعات المشاريع** (ProjectPayment) — تزيد رصيد البنك بدون قيد محاسبي ❌
2. **دفعات مستخلصات مقاولي الباطن** (addSubcontractClaimPayment) — تخصم من البنك بدون قيد ❌
3. **مصروفات المشاريع** (ProjectExpense) — لا تؤثر على البنك ولا على المحاسبة (سجل تتبعي فقط)
4. **البنوك الجديدة بعد التفعيل** لا تُربط تلقائياً بحساب محاسبي
5. **النظام المحاسبي يُفعّل تلقائياً** في الخلفية عند أول عملية مالية — مستقل عن toggle الواجهة

**الخلاصة:** محاسب يفعّل وضع المحاسبة على بيانات موجودة سيرى ميزان مراجعة غير مكتمل — القيود التلقائية تُنشأ فقط من لحظة تفعيل المحاسبة (أو أول عملية مالية)، وليس بأثر رجعي.

---

## 1. خريطة النظام المالي الأساسي

### 1.1 الفواتير (FinanceInvoice)

- **الملفات:** `packages/database/prisma/queries/finance.ts` (2,152 سطر) + `packages/api/modules/finance/procedures/create-invoice.ts` (1,022 سطر)
- **النموذج:** `FinanceInvoice` — 37 حقل، 7 indexes
- **الأنواع:** `STANDARD`, `TAX`, `SIMPLIFIED`, `CREDIT_NOTE`, `DEBIT_NOTE`
- **الحالات:** `DRAFT → ISSUED → SENT → VIEWED → PARTIALLY_PAID → PAID` + `OVERDUE`, `CANCELLED`
- **الحقول المالية:** `subtotal`, `discountPercent`, `discountAmount`, `vatPercent`, `vatAmount`, `totalAmount`, `paidAmount` — كلها `Decimal(15,2)`
- **الحسابات:** `calculateInvoiceTotals()` (finance.ts:25-57) — مصدر الحقيقة الوحيد لحساب المبالغ
- **Endpoints:** createInvoice, updateInvoice, updateInvoiceItems, updateInvoiceStatus, issueInvoice, addInvoicePayment, deleteInvoicePayment, deleteInvoice, duplicateInvoice, createCreditNote, convertToTaxInvoice, updateInvoiceNotes (12 endpoint)
- **تأثير على البنك:** لا — الفاتورة نفسها لا تغيّر رصيد البنك. الدفعات عليها (`FinanceInvoicePayment`) أيضاً لا تغيّر رصيد البنك مباشرة (تُسجّل كسجل مرتبط بالفاتورة فقط)
- **تأثير على Dashboard:** تظهر في إحصائيات الفواتير (عدد، مبالغ، مستحقات)

### 1.2 دفعات الفواتير (FinanceInvoicePayment)

- **النموذج:** `FinanceInvoicePayment` — 10 حقول
- **الحقول الرئيسية:** `invoiceId`, `amount`, `paymentDate`, `sourceAccountId`, `paymentMethod`
- **تأثير:** تزيد `paidAmount` في الفاتورة وتغيّر حالتها (PARTIALLY_PAID / PAID)
- **تأثير على البنك:** ❌ **لا** — `addInvoicePayment()` في finance.ts:1195-1255 لا تلمس `OrganizationBank.balance`
- **ملاحظة مهمة:** `sourceAccountId` هو `String?` (اختياري) — يُستخدم فقط لإنشاء القيد المحاسبي

### 1.3 المصروفات التنظيمية (FinanceExpense)

- **الملفات:** `packages/database/prisma/queries/org-finance.ts` (1,476 سطر) + `packages/api/modules/finance/procedures/expenses.ts` (611 سطر)
- **النموذج:** `FinanceExpense` — 24 حقل، 7 indexes
- **الفئات:** `OrgExpenseCategory` — 27 قيمة (MATERIALS, LABOR, EQUIPMENT_RENTAL, EQUIPMENT_PURCHASE, SUBCONTRACTOR, TRANSPORT, SALARIES, RENT, UTILITIES, COMMUNICATIONS, INSURANCE, LICENSES, BANK_FEES, FUEL, MAINTENANCE, SUPPLIES, MARKETING, TRAINING, TRAVEL, HOSPITALITY, LOAN_PAYMENT, TAXES, ZAKAT, REFUND, MISC, CUSTOM)
- **الحالات:** `FinanceTransactionStatus` — `PENDING`, `COMPLETED`, `CANCELLED`
- **مصدر المصروف:** `ExpenseSourceType` — `MANUAL`, `FACILITY_PAYROLL`, `FACILITY_RECURRING`, `FACILITY_ASSET`, `PROJECT`
- **تأثير على البنك:**
  - `createExpense(COMPLETED)` → **خصم** من `OrganizationBank.balance` (org-finance.ts:563)
  - `payExpense(PENDING→COMPLETED)` → **خصم** (org-finance.ts:646)
  - `cancelExpense()` → **استرداد** paidAmount إلى البنك (org-finance.ts:785)
  - `deleteExpense()` → **استرداد** paidAmount إلى البنك (org-finance.ts:686)
- **حماية الرصيد:** طبقتين — فحص UX مبكر + `updateMany` ذري مع شرط `balance >= amount`
- **Endpoints:** listExpenses, getExpense, getExpensesSummary, createExpense, updateExpense, deleteExpense, payExpense, cancelExpense, listExpensesWithSubcontracts (9 endpoints)

### 1.4 المقبوضات المباشرة (FinancePayment)

- **النموذج:** `FinancePayment` — 18 حقل، 6 indexes
- **الحقول الرئيسية:** `amount`, `destinationAccountId`, `clientId`, `projectId`, `invoiceId`, `contractTermId`
- **الحالة:** دائماً `COMPLETED` عند الإنشاء
- **تأثير على البنك:** `createPayment()` → **إضافة** إلى `OrganizationBank.balance` (org-finance.ts:1069)
- **الحذف:** `deletePayment()` → **خصم** من البنك (org-finance.ts:1132)
- **Endpoints:** listOrgPayments, getOrgPayment, createOrgPayment, updateOrgPayment, deleteOrgPayment (5 endpoints)

### 1.5 التحويلات البنكية (FinanceTransfer)

- **النموذج:** `FinanceTransfer` — 14 حقل، 3 indexes
- **الحالة:** دائماً `COMPLETED` عند الإنشاء
- **تأثير على البنك:**
  - `createTransfer()` → **خصم** من المصدر + **إضافة** للوجهة (org-finance.ts:1304-1313)
  - `cancelTransfer()` → **عكس**: إضافة للمصدر + خصم من الوجهة (org-finance.ts:1355-1359)
- **Endpoints:** listTransfers, getTransfer, createTransfer, cancelTransfer (4 endpoints)

### 1.6 الحسابات البنكية (OrganizationBank)

- **النموذج:** `OrganizationBank` — 17 حقل (أهمها: `balance`, `openingBalance`, `chartAccountId`)
- **`chartAccountId`:** `String? @unique` — ربط 1:1 مع `ChartAccount` (اختياري)
- **`balance`:** يتغيّر ذرياً عبر `increment`/`decrement` في كل عملية مالية
- **`openingBalance`:** الرصيد الافتتاحي (ثابت بعد الإنشاء)
- **Endpoints:** listBankAccounts, getBankAccount, getBalancesSummary, createBankAccount, updateBankAccount, setDefaultBankAccount, deleteBankAccount, reconcileBankAccount (8 endpoints)

### 1.7 مصروفات المشاريع (ProjectExpense)

- **الملف:** `packages/database/prisma/queries/project-finance.ts` (749 سطر)
- **النموذج:** `ProjectExpense` — 13 حقل
- **الفئات:** `ExpenseCategory` — 6 قيم فقط (MATERIALS, LABOR, EQUIPMENT, SUBCONTRACTOR, TRANSPORT, MISC)
- **تأثير على البنك:** ❌ **لا** — نموذج تتبعي فقط
- **تأثير على المحاسبة:** ❌ **لا** — لا يولّد أي قيد
- **ملاحظة:** هذا نموذج منفصل عن `FinanceExpense`. يُستخدم لتتبع مصروفات المشروع فقط. العرض الموحد في `getProjectExpenses()` يدمج `FinanceExpense` + `SubcontractPayment`

### 1.8 مطالبات المشاريع (ProjectClaim)

- **النموذج:** `ProjectClaim` — 14 حقل
- **الحالات:** `DRAFT → SUBMITTED → APPROVED → PAID`
- **تأثير على البنك:** ❌ **لا** — المطالبة نفسها لا تغيّر الرصيد
- **تأثير على المحاسبة:** ❌ **لا** — لا يولّد أي قيد
- **ملاحظة:** المطالبة هي طلب دفعة من المالك — القبض الفعلي يتم عبر ProjectPayment

### 1.9 مدفوعات المشاريع (ProjectPayment)

- **الملف:** `packages/database/prisma/queries/project-payments.ts` (388 سطر)
- **النموذج:** `ProjectPayment` — 14 حقل
- **تأثير على البنك:** ✅ **نعم** — `createProjectPayment()` يزيد `OrganizationBank.balance` (project-payments.ts:223)
- **تأثير على المحاسبة:** ❌ **لا** — لا يوجد أي استدعاء لـ auto-journal ⚠️ **فجوة**
- **ملاحظة:** يُحدّث `ContractPaymentTerm.paidAmount` و status (PENDING → PARTIALLY_PAID → FULLY_PAID)

### 1.10 عقود مقاولي الباطن (SubcontractContract)

- **الملف:** `packages/database/prisma/queries/subcontract.ts` (707 سطر)
- **النموذج:** `SubcontractContract` — 28 حقل
- **الحالات:** `DRAFT`, `ACTIVE`, `SUSPENDED`, `COMPLETED`, `TERMINATED`
- **تأثير على البنك:** ❌ **لا** — العقد نفسه لا يغيّر الرصيد
- **تأثير على المحاسبة:** ❌ **لا** — العقد لا يولّد قيد (وهذا صحيح محاسبياً — العقد التزام مستقبلي)

### 1.11 مدفوعات مقاولي الباطن (SubcontractPayment)

- **النموذج:** `SubcontractPayment` — 17 حقل
- **مساران للإنشاء:**
  1. **مباشر:** `createSubcontractPayment()` في subcontract.ts → خصم بنك ✅ + قيد محاسبي ✅
  2. **عبر مستخلص:** `addSubcontractClaimPayment()` في subcontract-claims.ts → خصم بنك ✅ + قيد محاسبي ❌ ⚠️ **فجوة**
- **تأثير على البنك:** **خصم** من `OrganizationBank.balance` (في كلا المسارين)

### 1.12 مستخلصات مقاولي الباطن (SubcontractClaim)

- **الملف:** `packages/database/prisma/queries/subcontract-claims.ts` (735 سطر)
- **النموذج:** `SubcontractClaim` — 20 حقل + `SubcontractClaimItem`
- **الحالات:** `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → PARTIALLY_PAID → PAID` + `REJECTED`, `CANCELLED`
- **الحسابات:** gross, retention, advance deduction, VAT, net (محسوبة تلقائياً)
- **تأثير على البنك:** ❌ المستخلص نفسه لا يغيّر الرصيد — الدفعة المرتبطة هي التي تخصم
- **تأثير على المحاسبة:** ❌ **لا** — اعتماد المستخلص لا يولّد قيد التزام ⚠️

### 1.13 الرواتب (PayrollRun + PayrollRunItem)

- **الملف:** `packages/database/prisma/queries/payroll.ts` (499 سطر)
- **النموذج:** `PayrollRun` — 15 حقل، `PayrollRunItem` — 13 حقل
- **الحالات:** `DRAFT → APPROVED → PAID` + `CANCELLED`
- **تأثير على البنك:** عند الاعتماد (APPROVED): يُنشئ `FinanceExpense` بحالة PENDING لكل موظف — لا خصم فوري. الخصم يحدث عند دفع المصروفات لاحقاً
- **تأثير على المحاسبة:** ✅ `onPayrollApproved()` يُستدعى عند الاعتماد — DR: 6100 رواتب / CR: بنك + 2170 تأمينات

### 1.14 مصروفات الشركة الثابتة (CompanyExpense)

- **النموذج:** `CompanyExpense` — 15 حقل (مصروف متكرر: إيجار، مرافق، إلخ)
- **النموذج المرتبط:** `CompanyExpensePayment` — 14 حقل (دفعة فترة محددة)
- **التدفق:** CompanyExpense → CompanyExpensePayment (isPaid=false) → markPaymentPaid → FinanceExpense (COMPLETED) → خصم بنك
- **تأثير على المحاسبة:** ✅ عند `markPaymentPaid` → `onExpenseCompleted()` يُستدعى (عبر expense-payments.ts:116)

### 1.15 دورات ترحيل المصروفات (CompanyExpenseRun)

- **الملف:** `packages/database/prisma/queries/expense-runs.ts` (456 سطر)
- **النموذج:** `CompanyExpenseRun` — 13 حقل + `CompanyExpenseRunItem`
- **الحالات:** `DRAFT → POSTED` + `CANCELLED`
- **التدفق:** عند الترحيل (POSTED) → يُنشئ `FinanceExpense` بحالة PENDING لكل بند — لا خصم فوري
- **تأثير على المحاسبة:** ❌ مباشرة لا — لكن عند دفع المصروفات المُنشأة لاحقاً → `onExpenseCompleted()` يُستدعى

### 1.16 العقد الرئيسي (ProjectContract)

- **النموذج:** `ProjectContract` — 28 حقل (1:1 مع Project عبر `projectId @unique`)
- **النموذج المرتبط:** `ContractPaymentTerm` — 12 حقل
- **الحالات:** `DRAFT`, `ACTIVE`, `SUSPENDED`, `CLOSED`
- **تأثير على البنك والمحاسبة:** ❌ **لا** — العقد وثيقة تعاقدية فقط

### 1.17 أوامر التغيير (ProjectChangeOrder)

- **النموذج:** `ProjectChangeOrder` — 20 حقل
- **الحالات:** `DRAFT → SUBMITTED → APPROVED → IMPLEMENTED` + `REJECTED`
- **تأثير على البنك والمحاسبة:** ❌ **لا** — أمر التغيير يؤثر على `costImpact` في تقارير الربحية فقط

### 1.18 العملاء (Client)

- **النموذج:** `Client` — 27 حقل
- **تأثير مالي:** لا — بيانات مرجعية

### 1.19 عروض الأسعار (Quotation)

- **النموذج:** `Quotation` — 28 حقل + `QuotationItem`
- **الحالات:** `DRAFT → SENT → VIEWED → ACCEPTED → REJECTED → EXPIRED → CONVERTED`
- **تأثير مالي:** لا مباشرة — عند CONVERTED يُنشئ فاتورة DRAFT

### 1.20 إشعارات دائنة/مدينة

- **إشعار دائن (CREDIT_NOTE):** يُنشأ عبر `createCreditNote()` — ينفي المبالغ → يولّد قيد محاسبي عكسي ✅
- **إشعار مدين (DEBIT_NOTE):** معرّف في `InvoiceType` enum لكن **لا يوجد إجراء مخصص لإنشائه** — يُنشأ كفاتورة عادية بنوع DEBIT_NOTE

---

## 2. خريطة النظام المحاسبي الجديد

### 2.1 دليل الحسابات الافتراضي (44 حساب)

**الملف:** `packages/database/prisma/queries/accounting.ts` (سطر 23-87)

#### الأصول (Assets — 1xxx)

| الكود | الاسم بالعربية | الاسم بالإنجليزية | المستوى | قابل للترحيل | نظامي |
|-------|---------------|-------------------|---------|-------------|-------|
| 1000 | الأصول | Assets | 1 | ❌ | ✅ |
| 1100 | الأصول المتداولة | Current Assets | 2 | ❌ | ✅ |
| 1110 | النقدية والبنوك | Cash & Banks | 3 | ✅ | ✅ |
| 1120 | العملاء (ذمم مدينة) | Accounts Receivable | 3 | ✅ | ✅ |
| 1130 | مخزون المواد | Material Inventory | 3 | ✅ | ❌ |
| 1140 | سلف ودفعات مقدمة | Prepayments & Advances | 3 | ✅ | ❌ |
| 1150 | ضريبة مدخلات قابلة للاسترداد | Input VAT Recoverable | 3 | ✅ | ✅ |
| 1200 | الأصول الثابتة | Fixed Assets | 2 | ❌ | ✅ |
| 1210 | معدات وآلات | Equipment & Machinery | 3 | ✅ | ❌ |
| 1220 | مركبات | Vehicles | 3 | ✅ | ❌ |
| 1230 | أثاث ومفروشات | Furniture & Fixtures | 3 | ✅ | ❌ |
| 1290 | إهلاك متراكم | Accumulated Depreciation | 3 | ✅ | ❌ |

#### الخصوم (Liabilities — 2xxx)

| الكود | الاسم بالعربية | الاسم بالإنجليزية | المستوى | قابل للترحيل | نظامي |
|-------|---------------|-------------------|---------|-------------|-------|
| 2000 | الخصوم | Liabilities | 1 | ❌ | ✅ |
| 2100 | الخصوم المتداولة | Current Liabilities | 2 | ❌ | ✅ |
| 2110 | الموردون (ذمم دائنة) | Accounts Payable | 3 | ✅ | ✅ |
| 2120 | مستحقات مقاولي الباطن | Subcontractor Payables | 3 | ✅ | ✅ |
| 2130 | ضريبة القيمة المضافة المستحقة | VAT Payable | 3 | ✅ | ✅ |
| 2140 | رواتب مستحقة | Salaries Payable | 3 | ✅ | ❌ |
| 2150 | مصروفات مستحقة | Accrued Expenses | 3 | ✅ | ❌ |
| 2160 | إيرادات مقدمة | Unearned Revenue | 3 | ✅ | ❌ |
| 2170 | تأمينات اجتماعية مستحقة | GOSI Payable | 3 | ✅ | ✅ |

#### حقوق الملكية (Equity — 3xxx)

| الكود | الاسم بالعربية | الاسم بالإنجليزية | المستوى | قابل للترحيل | نظامي |
|-------|---------------|-------------------|---------|-------------|-------|
| 3000 | حقوق الملكية | Equity | 1 | ❌ | ✅ |
| 3100 | رأس المال | Capital | 2 | ✅ | ✅ |
| 3200 | أرباح مبقاة | Retained Earnings | 2 | ✅ | ✅ |
| 3300 | أرباح / خسائر العام | Current Year P&L | 2 | ✅ | ❌ |

#### الإيرادات (Revenue — 4xxx)

| الكود | الاسم بالعربية | الاسم بالإنجليزية | المستوى | قابل للترحيل | نظامي |
|-------|---------------|-------------------|---------|-------------|-------|
| 4000 | الإيرادات | Revenue | 1 | ❌ | ✅ |
| 4100 | إيرادات المشاريع | Project Revenue | 2 | ✅ | ✅ |
| 4200 | إيرادات خدمات | Service Revenue | 2 | ✅ | ❌ |
| 4300 | إيرادات أخرى | Other Revenue | 2 | ✅ | ✅ |

#### تكاليف المشاريع (Cost of Projects — 5xxx)

| الكود | الاسم بالعربية | الاسم بالإنجليزية | المستوى | قابل للترحيل | نظامي |
|-------|---------------|-------------------|---------|-------------|-------|
| 5000 | تكاليف المشاريع | Cost of Projects | 1 | ❌ | ✅ |
| 5100 | مواد ومشتريات | Materials & Purchases | 2 | ✅ | ✅ |
| 5200 | مقاولو باطن | Subcontractors | 2 | ✅ | ✅ |
| 5300 | عمالة مباشرة | Direct Labor | 2 | ✅ | ✅ |
| 5400 | معدات | Equipment | 2 | ✅ | ❌ |
| 5500 | نقل ومواصلات | Transportation | 2 | ✅ | ❌ |

#### مصروفات تشغيلية (Operating Expenses — 6xxx)

| الكود | الاسم بالعربية | الاسم بالإنجليزية | المستوى | قابل للترحيل | نظامي |
|-------|---------------|-------------------|---------|-------------|-------|
| 6000 | مصروفات تشغيلية | Operating Expenses | 1 | ❌ | ✅ |
| 6100 | رواتب وأجور إدارية | Administrative Salaries | 2 | ✅ | ✅ |
| 6200 | إيجارات | Rent | 2 | ✅ | ❌ |
| 6300 | مرافق (كهرباء، ماء) | Utilities | 2 | ✅ | ❌ |
| 6400 | اتصالات | Communications | 2 | ✅ | ❌ |
| 6500 | تأمين | Insurance | 2 | ✅ | ❌ |
| 6600 | رسوم وتراخيص | Licenses & Fees | 2 | ✅ | ❌ |
| 6700 | صيانة | Maintenance | 2 | ✅ | ❌ |
| 6800 | تسويق وإعلان | Marketing & Advertising | 2 | ✅ | ❌ |
| 6900 | مصروفات متنوعة | Miscellaneous Expenses | 2 | ✅ | ❌ |
| 6950 | عمولات بنكية | Bank Charges | 2 | ✅ | ❌ |
| 6960 | ضرائب وزكاة | Taxes & Zakat | 2 | ✅ | ❌ |

### 2.2 ربط فئات المصروفات بالحسابات (EXPENSE_CATEGORY_TO_ACCOUNT_CODE)

**الملف:** accounting.ts سطر 93-124

| فئة المصروف | كود الحساب | الحساب |
|-------------|-----------|--------|
| MATERIALS | 5100 | مواد ومشتريات |
| LABOR | 5300 | عمالة مباشرة |
| EQUIPMENT_RENTAL | 5400 | معدات |
| EQUIPMENT_PURCHASE | 5400 | معدات |
| SUBCONTRACTOR | 5200 | مقاولو باطن |
| TRANSPORT | 5500 | نقل ومواصلات |
| SALARIES | 6100 | رواتب إدارية |
| RENT | 6200 | إيجارات |
| UTILITIES | 6300 | مرافق |
| COMMUNICATIONS | 6400 | اتصالات |
| INSURANCE | 6500 | تأمين |
| LICENSES | 6600 | رسوم وتراخيص |
| BANK_FEES | 6950 | عمولات بنكية |
| FUEL | 6900 | مصروفات متنوعة |
| MAINTENANCE | 6700 | صيانة |
| SUPPLIES | 6900 | مصروفات متنوعة |
| MARKETING | 6800 | تسويق وإعلان |
| TRAINING | 6900 | مصروفات متنوعة |
| TRAVEL | 6900 | مصروفات متنوعة |
| HOSPITALITY | 6900 | مصروفات متنوعة |
| LOAN_PAYMENT | 6900 | مصروفات متنوعة |
| TAXES | 6960 | ضرائب وزكاة |
| ZAKAT | 6960 | ضرائب وزكاة |
| **Fallback** | **6900** | **مصروفات متنوعة** |

**ملاحظة:** REFUND, MISC, CUSTOM ليست في الخريطة — تستخدم fallback 6900.

### 2.3 أنواع القيود

| النوع | المصدر | الحالة الأولية | الترقيم |
|-------|--------|---------------|---------|
| تلقائي (Auto-generated) | auto-journal.ts | **POSTED فوراً** | حسب النوع (INV-JE, EXP-JE, إلخ) |
| يدوي (Manual) | المستخدم عبر UI | DRAFT | MAN-JE-{year}-{seq} |
| تسوية (Adjustment) | المستخدم عبر UI | DRAFT | ADJ-JE-{year}-{seq} |
| افتتاحي (Opening Balance) | المستخدم عبر UI | POSTED | OPN-JE-{year}-{seq} |
| عكسي (Reversal) | تلقائي عند العكس | POSTED | REV-JE-{year}-{seq} |

### 2.4 حالات القيد

```
DRAFT → POSTED (عبر post أو bulk post)
POSTED → REVERSED (عبر reverse — يُنشئ قيد عكسي جديد)
DRAFT → (حذف مباشر)
```

### 2.5 الفترات المحاسبية

- يُولّد 12 فترة شهرية لسنة محددة عبر `generateMonthlyPeriods()`
- كل فترة: `startDate`, `endDate`, `isClosed`
- **إغلاق:** يرفض إذا وُجدت قيود DRAFT في الفترة
- **إعادة فتح:** فقط آخر فترة مغلقة
- **القيود التلقائية في فترة مغلقة:** تُتخطّى بصمت (console.warn) — لا تُنشأ

### 2.6 القيود المتكررة

- قالب يحتوي: description, lines (JSON), frequency (MONTHLY/QUARTERLY/ANNUAL), dayOfMonth
- `generateDueRecurringEntries()` يبحث عن قوالب مستحقة ويُنشئ قيود **DRAFT**
- يجب على المستخدم ترحيلها يدوياً

### 2.7 التسوية البنكية

- **النظام الأساسي:** `reconcileBankAccount()` في org-finance.ts — حساب تشخيصي (read-only) يقارن الرصيد المحسوب من العمليات مع `OrganizationBank.balance`
- **النظام المحاسبي:** `createBankReconciliation()` في accounting.ts — مطابقة يدوية لبنود القيود المحاسبية (JournalEntryLine) مع كشف البنك
- **العلاقة:** يعمل على `ChartAccount` المربوط بالبنك — يتطلب وجود `chartAccountId` في `OrganizationBank`

---

## 3. جدول الربط — أي عملية مالية تولّد قيد محاسبي؟

| # | العملية | يولّد قيد؟ | Hook المستخدم | المدين | الدائن | sourceAccountId يُمرّر؟ | ملاحظات |
|---|---------|-----------|--------------|--------|--------|------------------------|---------|
| 1 | إصدار فاتورة STANDARD → ISSUED | ✅ | `onInvoiceIssued` (create-invoice.ts:718) | 1120 عملاء | 4100 إيرادات + 2130 ضريبة | N/A | projectId يُمرّر في بند 1120 |
| 2 | إصدار فاتورة TAX → ISSUED | ✅ | `onInvoiceIssued` | 1120 عملاء | 4100 إيرادات + 2130 ضريبة | N/A | نفس القيد |
| 3 | إصدار فاتورة SIMPLIFIED → ISSUED | ✅ | `onInvoiceIssued` | 1120 عملاء | 4100 إيرادات + 2130 ضريبة | N/A | نفس القيد |
| 4 | تسجيل دفعة على فاتورة | ✅ | `onInvoicePaymentReceived` (create-invoice.ts:458) | البنك (من chartAccountId أو 1110) | 1120 عملاء | ✅ sourceAccountId اختياري | fallback إلى 1110 إذا لم يُحدد |
| 5 | إنشاء إشعار دائن CREDIT_NOTE | ✅ | `onCreditNoteIssued` (create-invoice.ts:909) | 4100 إيرادات + 2130 ضريبة | 1120 عملاء | N/A | عكس قيد الفاتورة |
| 6 | إنشاء إشعار مدين DEBIT_NOTE | ❌ | — | — | — | — | **لا يوجد إجراء مخصص** — يُعامل كفاتورة عادية |
| 7 | مصروف COMPLETED (إنشاء مباشر) | ✅ | `onExpenseCompleted` (expenses.ts:263) | حساب المصروف (حسب الفئة) | البنك | ✅ sourceAccountId مطلوب | |
| 8 | مصروف PENDING ثم دفعه | ✅ | `onExpenseCompleted` (expenses.ts:425) | حساب المصروف | البنك | ✅ | يُستدعى عند payExpense |
| 9 | إلغاء مصروف cancelExpense | ✅ عكس | `reverseAutoJournalEntry` (expenses.ts:477) | عكس القيد الأصلي | | | referenceType: "EXPENSE" |
| 10 | مقبوض مباشر createOrgPayment | ✅ | `onOrganizationPaymentReceived` (payments.ts:164) | البنك | 4300 إيرادات أخرى | ✅ destinationAccountId | |
| 11 | تحويل بنكي createTransfer | ✅ | `onTransferCompleted` (transfers.ts:143) | بنك الوجهة | بنك المصدر | ✅ (من from/to) | |
| 12 | إلغاء تحويل cancelTransfer | ✅ عكس | `reverseAutoJournalEntry` (transfers.ts:194) | عكس القيد | | | referenceType: "TRANSFER" |
| 13 | مصروف مشروع ProjectExpense | ❌ | — | — | — | — | **فجوة** — لكنه سجل تتبعي لا يؤثر على البنك |
| 14 | اعتماد مطالبة مشروع APPROVED | ❌ | — | — | — | — | **فجوة** — لا يُسجّل كإيراد مستحق |
| 15 | مدفوعات مشروع ProjectPayment | ❌ | — | — | — | — | **⚠️ فجوة حرجة** — يزيد رصيد البنك بدون قيد |
| 16 | دفعة مقاول باطن (مباشرة) | ✅ | `onSubcontractPayment` (create-payment.ts:79) | 5200 مقاولو باطن | البنك | ✅ sourceAccountId | projectId يُمرّر |
| 17 | اعتماد مستخلص باطن APPROVED | ❌ | — | — | — | — | **فجوة** — لا يُسجّل كالتزام مستحق |
| 18 | دفعة على مستخلص باطن (addSubcontractClaimPayment) | ❌ | — | — | — | — | **⚠️ فجوة حرجة** — يخصم من البنك بدون قيد |
| 19 | اعتماد مسير رواتب APPROVED | ✅ | `onPayrollApproved` (payroll.ts:181) | 6100 رواتب (صافي + تأمينات) | البنك (صافي) + 2170 تأمينات | ✅ | يستخدم bankAccountId |
| 20 | إلغاء مسير رواتب | ✅ عكس | `reverseAutoJournalEntry` (payroll.ts:231) | عكس القيد | | | referenceType: "PAYROLL" |
| 21 | دفع مصروف شركة ثابت markPaymentPaid | ✅ | `onExpenseCompleted` (expense-payments.ts:116) | حساب المصروف | البنك | ✅ | يُنشئ FinanceExpense ثم يستدعي القيد |
| 22 | ترحيل دورة مصروفات postExpenseRun | ❌ مباشرة | — | — | — | — | يُنشئ PENDING FinanceExpenses — القيد يأتي عند الدفع |
| 23 | حذف فاتورة DRAFT | ✅ عكس | `reverseAutoJournalEntry` (create-invoice.ts:565) | عكس القيد | | | referenceType: "INVOICE" |
| 24 | حذف دفعة فاتورة | ✅ عكس | `reverseAutoJournalEntry` (create-invoice.ts:520) | عكس القيد | | | referenceType: "INVOICE_PAYMENT" |
| 25 | حذف مصروف | ✅ عكس | `reverseAutoJournalEntry` (expenses.ts:365) | عكس القيد | | | referenceType: "EXPENSE" |
| 26 | حذف مقبوض | ✅ عكس | `reverseAutoJournalEntry` (payments.ts:262) | عكس القيد | | | referenceType: "ORG_PAYMENT" |
| 27 | اعتماد أمر تغيير APPROVED | ❌ | — | — | — | — | صحيح — لا يُولّد حركة مالية فعلية |

---

## 4. الفجوات — عمليات مالية بدون قيود محاسبية

### فجوة 1: مدفوعات المشاريع (ProjectPayment) — 🔴 حرجة

**الملف:** `packages/database/prisma/queries/project-payments.ts` سطر 155-230
**المشكلة:** عند تسجيل دفعة من المالك على مستوى المشروع، يزداد رصيد البنك (`OrganizationBank.balance`) لكن لا يُنشأ أي قيد محاسبي.

**القيد المحاسبي الصحيح:**
```
مدين: البنك (حسب destinationAccountId)          ← المبلغ المقبوض
دائن: 1120 العملاء (ذمم مدينة)                 ← تخفيض المديونية
  أو: 2160 إيرادات مقدمة                       ← إذا كانت دفعة مقدمة قبل فاتورة
```

**التأثير على التقارير:**
- ميزان المراجعة: رصيد البنك المحاسبي أقل من رصيد البنك الفعلي
- الميزانية العمومية: الأصول (بنوك) ناقصة
- قائمة الدخل: لا تتأثر مباشرة (الإيراد يُسجّل عند إصدار الفاتورة)
- مراكز التكلفة: الإيراد المحصّل لكل مشروع ناقص

**ملاحظة:** هذا المسار منفصل عن دفعات الفواتير (`FinanceInvoicePayment`). `ProjectPayment` يرتبط بـ `ContractPaymentTerm` ويُستخدم في بوابة المالك وتتبع شروط الدفع.

### فجوة 2: دفعات مستخلصات مقاولي الباطن (addSubcontractClaimPayment) — 🔴 حرجة

**الملف:** `packages/database/prisma/queries/subcontract-claims.ts` سطر 655-734
**المشكلة:** عند دفع مستخلص معتمد لمقاول باطن، يُخصم من رصيد البنك لكن لا يُنشأ قيد محاسبي.

**المسار المتأثر:** المستخدم يذهب لمستخلص مقاول باطن → يضغط "دفع" → تُنشأ `SubcontractPayment` مع `claimId` → يُخصم البنك → **لا قيد**

**المسار الذي يعمل:** المستخدم يذهب لعقد مقاول باطن → يضغط "دفعة جديدة" (بدون ربط بمستخلص) → `createSubcontractPayment()` عبر create-payment.ts → يُخصم البنك → ✅ `onSubcontractPayment()` يُستدعى

**السبب:** مساران مختلفان للكود. `addSubcontractClaimPayment` في subcontract-claims.ts لا يستورد auto-journal.

**القيد المحاسبي المفقود:**
```
مدين: 5200 مقاولو باطن                         ← تكلفة المشروع
دائن: البنك (حسب sourceAccountId)               ← المبلغ المدفوع
```

### فجوة 3: اعتماد مستخلص مقاول باطن (SubcontractClaim APPROVED) — 🟡 متوسطة

**المشكلة:** عند اعتماد مستخلص، لا يُسجّل كالتزام مستحق.

**القيد المحاسبي الصحيح (أساس الاستحقاق):**
```
مدين: 5200 مقاولو باطن                         ← الاعتراف بالتكلفة
دائن: 2120 مستحقات مقاولي الباطن               ← الالتزام المستحق
```

**ملاحظة:** هذا ضروري فقط في المحاسبة على أساس الاستحقاق. حالياً النظام يسجل التكلفة فقط عند الدفع (أساس نقدي).

### فجوة 4: مصروفات المشاريع (ProjectExpense) — 🟢 منخفضة

**المشكلة:** `ProjectExpense` لا يولّد قيد ولا يؤثر على البنك.

**التحليل:** هذا النموذج سجل تتبعي (informational) — الخصم الفعلي يتم عبر `FinanceExpense`. العرض الموحد (`getProjectExpenses`) يدمج `FinanceExpense` المربوطة بالمشروع + `SubcontractPayment`. لذا هذه ليست فجوة حقيقية بل تصميم مقصود.

### فجوة 5: مطالبات المشاريع (ProjectClaim APPROVED) — 🟡 متوسطة

**المشكلة:** عند اعتماد مطالبة مشروع (طلب دفعة من المالك)، لا يُسجّل كإيراد مستحق.

**القيد المحاسبي الصحيح (أساس الاستحقاق):**
```
مدين: 1120 العملاء (ذمم مدينة)                 ← المبلغ المستحق
دائن: 4100 إيرادات المشاريع                    ← الاعتراف بالإيراد
```

**ملاحظة:** لا حاجة لهذا القيد إذا كانت المطالبة تُحوّل لفاتورة لاحقاً (والفاتورة تولّد القيد). لكن إذا كانت المطالبة تُقبض مباشرة عبر `ProjectPayment` بدون فاتورة — فهناك فجوة.

### فجوة 6: إشعار مدين (DEBIT_NOTE) — 🟢 منخفضة

**المشكلة:** معرّف في الـ enum لكن لا يوجد إجراء مخصص. إذا أُنشئ كفاتورة عادية بنوع DEBIT_NOTE، سيتولّد قيد فاتورة عادي (DR: 1120 / CR: 4100) — وهو صحيح محاسبياً لمعظم الحالات.

### فجوة 7: حذف/إلغاء دفعة مقاول باطن — 🟡 متوسطة

**المشكلة:** `onSubcontractPayment()` يُنشئ قيداً عند الإنشاء، لكن لا يوجد `deleteSubcontractPayment` أو `cancelSubcontractPayment` يستدعي `reverseAutoJournalEntry`. إذا حُذفت الدفعة بطريقة أخرى، يبقى القيد المحاسبي يتيماً.

---

## 5. ازدواجية البيانات — أين يتكرر نفس الرقم؟

### 5.1 أرصدة البنوك

| المقياس | النظام الأساسي | النظام المحاسبي |
|---------|---------------|----------------|
| المصدر | `OrganizationBank.balance` | مجموع (debit - credit) لـ JournalEntryLine حيث accountId = chartAccountId |
| التحديث | ذري عبر `increment`/`decrement` في كل عملية | عبر إنشاء JournalEntryLine في القيد |
| التوقيت | **متزامن** مع العملية (في نفس الـ transaction) | **غير متزامن** (يُنشأ بعد العملية، في try/catch منفصل) |

**هل هما متساويان دائماً؟** ❌ **لا.** يختلفان في الحالات التالية:

1. **ProjectPayment** — يزيد `OrganizationBank.balance` بدون قيد محاسبي → رصيد البنك الأساسي > المحاسبي
2. **addSubcontractClaimPayment** — يخصم `OrganizationBank.balance` بدون قيد → رصيد البنك الأساسي < المحاسبي
3. **فشل auto-journal** — أي خطأ في إنشاء القيد (DB error, حساب مفقود) يُبتلع → العملية تنجح بدون قيد
4. **فترة محاسبية مغلقة** — القيود التلقائية تُتخطّى بصمت → فرق

### 5.2 إجمالي المصروفات

| المقياس | النظام الأساسي | النظام المحاسبي |
|---------|---------------|----------------|
| المصدر | `SUM(FinanceExpense.amount) WHERE status=COMPLETED` | مجموع debit في حسابات 5xxx + 6xxx |

**هل هما متساويان؟** ✅ **نعم، تقريباً** — كل `FinanceExpense` بحالة COMPLETED يولّد قيداً عبر `onExpenseCompleted()`. الاستثناء: إذا فشل إنشاء القيد (silent error) أو الفترة مغلقة.

### 5.3 إجمالي الإيرادات

| المقياس | النظام الأساسي | النظام المحاسبي |
|---------|---------------|----------------|
| المصدر | `SUM(FinanceInvoice.totalAmount) WHERE status IN (ISSUED, SENT, ...)` | مجموع credit في حساب 4100 |

**هل هما متساويان؟** ✅ **نعم، تقريباً** — كل فاتورة مُصدرة تولّد قيداً. الفرق المحتمل:
- إشعارات دائنة تُنقص حساب 4100 لكن لا تغيّر `FinanceInvoice.totalAmount` للفاتورة الأصلية
- المقبوضات المباشرة (`FinancePayment`) تذهب لـ 4300 (إيرادات أخرى) — قد لا تظهر في إحصائيات الفواتير

### 5.4 مديونيات العملاء

| المقياس | النظام الأساسي | النظام المحاسبي |
|---------|---------------|----------------|
| المصدر | `SUM(totalAmount - paidAmount) WHERE status IN (ISSUED, SENT, PARTIALLY_PAID, OVERDUE)` | رصيد حساب 1120 (debit - credit) |

**هل هما متساويان؟** ⚠️ **غالباً نعم، لكن مع فروقات محتملة:**
- `ProjectPayment` المرتبطة بمستحقات عقد (ليست دفعات فواتير) تُخفّض 1120 في النظام المحاسبي ❌ — لكنها لا تولّد قيداً أصلاً (فجوة 1)
- إشعار دائن يُنقص 1120 محاسبياً لكن لا يغيّر `paidAmount` في الفاتورة الأصلية — يُنشئ فاتورة منفصلة بمبالغ سالبة

### 5.5 مستحقات مقاولي الباطن

| المقياس | النظام الأساسي | النظام المحاسبي |
|---------|---------------|----------------|
| المصدر | `SubcontractClaim.netAmount - SubcontractClaim.paidAmount` مجمّعة | رصيد حساب 2120 |

**هل هما متساويان؟** ❌ **لا.**
- حساب 2120 لا يتلقى أي قيود من اعتماد المستخلصات (فجوة 3)
- حساب 2120 لا يتلقى خصومات من دفعات المستخلصات (فجوة 2)
- `onSubcontractPayment()` يخصم من 5200 مباشرة (لا يمر عبر 2120)
- **النتيجة:** حساب 2120 يظل عند الصفر دائماً ❌

### 5.6 الرواتب

| المقياس | النظام الأساسي | النظام المحاسبي |
|---------|---------------|----------------|
| المصدر | `SUM(PayrollRun.totalNetSalary) WHERE status=APPROVED or PAID` | مجموع debit في حساب 6100 |

**هل هما متساويان؟** ✅ **نعم** — `onPayrollApproved()` يسجّل `totalNet + totalGosi` في 6100. التطابق دقيق.
**ملاحظة:** الرواتب تُسجّل محاسبياً عند **الاعتماد** (APPROVED) وليس عند الدفع الفعلي. الدفع الفعلي يتم عبر FinanceExpense لاحقاً مما يولّد قيداً إضافياً — **ازدواجية محتملة في حساب 6100**.

---

## 6. تدفق البيانات — مخطط لكل عملية

### 6.1 إصدار فاتورة + تسجيل دفعة

```
المستخدم يصدر فاتورة (DRAFT → ISSUED)
    ↓
issueInvoiceProcedure (create-invoice.ts:583)
    ↓
issueInvoice() (finance.ts:1402) — يجمّد بيانات البائع، يحسب المبالغ، QR
    ↓ status = ISSUED, issuedAt = now()
orgAuditLog("INVOICE_ISSUED")
    ↓
try { onInvoiceIssued(db, invoice) } catch { console.error }
    ↓
createJournalEntry():
    JournalEntry (POSTED) — entryNo: INV-JE-2026-XXXX
    ├─ Line 1: DR 1120 العملاء         = totalAmount (مع projectId)
    ├─ Line 2: CR 4100 إيرادات المشاريع = totalAmount - vatAmount
    └─ Line 3: CR 2130 ضريبة مستحقة    = vatAmount (فقط إذا > 0)
    ↓
يظهر في: ميزان المراجعة ✅ | قائمة الدخل ✅ | الميزانية ✅ | مراكز التكلفة ✅

---

المستخدم يسجّل دفعة على الفاتورة
    ↓
addInvoicePaymentProcedure (create-invoice.ts:408)
    ↓
addInvoicePayment() (finance.ts:1195) — يُنشئ FinanceInvoicePayment
    ↓ paidAmount += amount, status = PARTIALLY_PAID أو PAID
    ↓ ❌ لا يلمس OrganizationBank.balance
try { onInvoicePaymentReceived(db, payment) } catch { console.error }
    ↓
createJournalEntry():
    JournalEntry (POSTED) — entryNo: RCV-JE-XXXX
    ├─ Line 1: DR البنك (chartAccountId أو 1110) = amount
    └─ Line 2: CR 1120 العملاء                    = amount
```

**⚠️ ملاحظة مهمة:** دفعة الفاتورة (`FinanceInvoicePayment`) لا تغيّر رصيد البنك في النظام الأساسي. القيد المحاسبي يزيد رصيد البنك محاسبياً فقط. هذا يعني أن رصيد البنك الأساسي وقيد البنك المحاسبي **لا يتغيّران بنفس الطريقة** عند هذه العملية.

### 6.2 إنشاء مصروف + دفعه

```
المستخدم يُنشئ مصروف بحالة COMPLETED
    ↓
createExpenseProcedure (expenses.ts:181)
    ↓
createExpense() (org-finance.ts:494) — paidAmount = amount
    ↓ OrganizationBank.balance -= amount (ذري مع حماية)
try { onExpenseCompleted(db, expense) } catch { console.error }
    ↓
createJournalEntry():
    JournalEntry (POSTED) — entryNo: EXP-JE-2026-XXXX
    ├─ Line 1: DR [حساب المصروف حسب الفئة] = amount
    └─ Line 2: CR البنك (chartAccountId)     = amount

---

أو: مصروف PENDING ثم يُدفع لاحقاً
    ↓
payExpenseProcedure (expenses.ts:382)
    ↓
payExpense() (org-finance.ts:577) — paidAmount += paymentAmount
    ↓ OrganizationBank.balance -= paymentAmount
try { onExpenseCompleted(db, expense) } catch { console.error }
    ↓
نفس القيد أعلاه
```

### 6.3 تسجيل مقبوض مباشر

```
المستخدم يُسجّل مقبوض (إيراد مباشر — غير مرتبط بفاتورة)
    ↓
createOrgPaymentProcedure (payments.ts:106)
    ↓
createPayment() (org-finance.ts:1024) — status = COMPLETED
    ↓ OrganizationBank.balance += amount (ذري)
try { onOrganizationPaymentReceived(db, payment) } catch { console.error }
    ↓
createJournalEntry():
    JournalEntry (POSTED) — entryNo: RCV-JE-XXXX
    ├─ Line 1: DR البنك (chartAccountId) = amount
    └─ Line 2: CR 4300 إيرادات أخرى     = amount
```

### 6.4 دفعة مقاول باطن (مباشرة)

```
المستخدم يُنشئ دفعة لمقاول باطن (من صفحة العقد)
    ↓
createSubcontractPaymentProcedure (create-payment.ts)
    ↓
createSubcontractPayment() (subcontract.ts:605) — status = COMPLETED
    ↓ OrganizationBank.balance -= amount (ذري)
try { onSubcontractPayment(db, payment) } catch { console.error }
    ↓
createJournalEntry():
    JournalEntry (POSTED) — entryNo: SUB-JE-XXXX
    ├─ Line 1: DR 5200 مقاولو باطن (مع projectId) = amount
    └─ Line 2: CR البنك (chartAccountId)            = amount
```

### 6.5 اعتماد رواتب

```
المستخدم يعتمد مسير رواتب (DRAFT → APPROVED)
    ↓
approvePayrollRunProcedure (payroll.ts)
    ↓
approvePayrollRun() (payroll.ts:226) — يُنشئ FinanceExpense PENDING لكل موظف
    ↓ PayrollRun.status = APPROVED
    ↓ ❌ لا يلمس OrganizationBank.balance (المصروفات PENDING)
try {
    totalGosi = SUM(PayrollRunItem.gosiDeduction)
    onPayrollApproved(db, { ...payroll, totalGosi, bankAccountId })
} catch { console.error }
    ↓
createJournalEntry():
    JournalEntry (POSTED) — entryNo: PAY-JE-2026-XXXX — date: 28 من الشهر
    ├─ Line 1: DR 6100 رواتب إدارية = totalNet + totalGosi
    ├─ Line 2: CR البنك              = totalNet
    └─ Line 3: CR 2170 تأمينات      = totalGosi (فقط إذا > 0)

⚠️ لاحقاً: عند دفع مصروفات الرواتب (FinanceExpense PENDING → COMPLETED)
    ↓ يُستدعى onExpenseCompleted() — يولّد قيد إضافي:
    DR 6100 رواتب / CR البنك ← ازدواجية محتملة في 6100!
```

### 6.6 تحويل بين حسابات

```
المستخدم يُنشئ تحويل بنكي
    ↓
createTransferProcedure (transfers.ts:95)
    ↓
createTransfer() (org-finance.ts:1241)
    ↓ fromAccount.balance -= amount (ذري)
    ↓ toAccount.balance += amount (ذري)
try { onTransferCompleted(db, transfer) } catch { console.error }
    ↓
createJournalEntry():
    JournalEntry (POSTED) — entryNo: TRF-JE-2026-XXXX
    ├─ Line 1: DR بنك الوجهة (chartAccountId) = amount
    └─ Line 2: CR بنك المصدر (chartAccountId) = amount
```

### 6.7 مصروف شركة ثابت → دفعه → المحاسبة

```
مصروف شركة ثابت (CompanyExpense — مثلاً إيجار شهري)
    ↓ CompanyExpensePayment (isPaid = false)
    ↓
المستخدم يدفع الدفعة (markPaymentPaid)
    ↓
markPaymentPaidProcedure (expense-payments.ts)
    ↓
markExpensePaymentPaid() (company.ts:529) — يُنشئ FinanceExpense COMPLETED
    ↓ OrganizationBank.balance -= amount
    ↓ CompanyExpensePayment.isPaid = true, financeExpenseId = ...
try { onExpenseCompleted(db, financeExpense) } catch { console.error }
    ↓
createJournalEntry():
    JournalEntry (POSTED) — entryNo: EXP-JE-2026-XXXX
    ├─ Line 1: DR [حساب المصروف حسب الفئة] = amount
    └─ Line 2: CR البنك                      = amount

✅ يصل للمحاسبة بنجاح عبر FinanceExpense
```

### 6.8 مصروف مشروع → المحاسبة؟

```
المستخدم يُنشئ مصروف مشروع (ProjectExpense)
    ↓
createProjectExpense() (project-finance.ts:333)
    ↓
ProjectExpense يُحفظ في DB
    ↓ ❌ لا خصم من البنك
    ↓ ❌ لا قيد محاسبي
    ↓
❌ لا يصل للمحاسبة

ملاحظة: هذا سجل تتبعي. المصروف "الحقيقي" هو FinanceExpense المربوط بالمشروع.
```

### 6.9 مطالبة مشروع → المحاسبة؟

```
المستخدم يُنشئ مطالبة مشروع (ProjectClaim)
    ↓
createProjectClaim() → status = DRAFT
    ↓
updateClaimStatus(APPROVED) → approvedAt = now()
    ↓ ❌ لا قيد محاسبي (الإيراد لا يُعترف به عند الاعتماد)
    ↓
updateClaimStatus(PAID) → paidAt = now()
    ↓ ❌ لا قيد محاسبي
    ↓
❌ المطالبة نفسها لا تصل للمحاسبة
القبض يتم عبر ProjectPayment (الذي أيضاً لا يولّد قيداً — فجوة 1)
```

### 6.10 مستخلص مقاول باطن → المحاسبة؟

```
المستخدم يُنشئ مستخلص (SubcontractClaim)
    ↓
createSubcontractClaim() → status = DRAFT (حسابات: gross, retention, VAT, net)
    ↓
updateSubcontractClaimStatus(APPROVED) → approvedAt = now()
    ↓ ❌ لا قيد التزام (2120 لا يتغيّر)
    ↓
addSubcontractClaimPayment() → SubcontractPayment مع claimId
    ↓ OrganizationBank.balance -= amount ✅
    ↓ SubcontractClaim.paidAmount += amount
    ↓ ❌ لا قيد محاسبي ⚠️

مقارنة مع المسار المباشر:
createSubcontractPayment() (بدون claimId)
    ↓ OrganizationBank.balance -= amount ✅
    ↓ ✅ onSubcontractPayment() → قيد محاسبي
```

---

## 7. مقارنة التقارير بين النظامين

### الملفات المعنية:
- **النظام الأساسي:** `packages/database/prisma/queries/finance-reports.ts` (505 سطر) + `packages/database/prisma/queries/cash-flow.ts` (283 سطر) + `packages/database/prisma/queries/accounting-reports.ts` (1,036 سطر — يقرأ من الجداول المالية مباشرة رغم اسمه)
- **النظام المحاسبي:** `packages/database/prisma/queries/accounting.ts` (1,920 سطر) — يقرأ من القيود

| # | التقرير | النظام الأساسي | النظام المحاسبي | النتائج متطابقة؟ |
|---|---------|---------------|----------------|-----------------|
| 1 | **الإيرادات حسب الفترة** | `getRevenueByPeriod()` — يجمع `FinanceInvoicePayment.amount` مجمّعة بالشهر | `getJournalIncomeStatement()` — credit في حسابات 4xxx | ⚠️ **مختلفة** — الأساسي يحسب الإيراد عند **التحصيل** (payment date)، المحاسبي يحسبه عند **الإصدار** (invoice date). أيضاً المقبوضات المباشرة (4300) تظهر في المحاسبي لكن ليست في الأساسي |
| 2 | **الإيرادات حسب المشروع** | `getRevenueByProject()` — يجمع totalAmount من فواتير PAID/PARTIALLY_PAID | `getCostCenterByProject()` — يجمع credit في 4xxx مع projectId | ⚠️ **قد تختلف** — الأساسي يحسب إيراد الفواتير المدفوعة فقط، المحاسبي يحسب كل الفواتير المُصدرة. أيضاً ProjectPayment غير مشمول في المحاسبي |
| 3 | **الربحية** | `getIncomeStatement()` في accounting-reports.ts — يقرأ مباشرة من جداول المالية (FinanceExpense, SubcontractPayment, PayrollRun, CompanyExpense) | `getJournalIncomeStatement()` — من القيود فقط | ⚠️ **مختلفة** — الأساسي يشمل كل المصروفات بما فيها ProjectPayment وCompanyExpense. المحاسبي يشمل فقط ما ولّد قيداً |
| 4 | **التدفق النقدي** | `getCashFlowReport()` — يحسب من FinancePayment + FinanceExpense + SubcontractPayment + رصيد البنوك | لا يوجد تقرير تدفق نقدي محاسبي مخصص | ❌ **لا مقارنة** — لا يوجد تقرير مقابل |
| 5 | **المديونيات المتقادمة** | `getAgedReceivables()` في accounting-reports.ts — من FinanceInvoice مباشرة (فواتير غير مدفوعة) | حساب 1120 في ميزان المراجعة | ⚠️ **يجب أن تتطابق** لكن الفرق يأتي من: (1) إشعارات دائنة تُنقص 1120 لكنها فواتير منفصلة في النظام الأساسي، (2) ProjectPayment لا يُنقص 1120 |
| 6 | **المستحقات المتقادمة** | `getAgedPayables()` في accounting-reports.ts — من SubcontractClaim مباشرة | حساب 2120 في ميزان المراجعة | ❌ **مختلفة تماماً** — 2120 = 0 دائماً (فجوة 3) بينما التقرير الأساسي يحسب من المستخلصات |
| 7 | **تقرير VAT** | `getVATReport()` في accounting-reports.ts — output VAT من فواتير، input VAT 15% من مصروفات | 2130 ضريبة مستحقة + 1150 ضريبة مدخلات | ⚠️ **مختلفة** — الأساسي يحسب input VAT reverse-engineered (15% من المصروفات). المحاسبي يسجّل VAT فقط على الفواتير (output). input VAT (1150) لا يُغذّى بأي قيد تلقائي |
| 8 | **Dashboard المالي vs المحاسبي** | `getOrgFinanceDashboard()` — أرصدة بنوك + مصروفات + مقبوضات | `getAccountingDashboard()` — إجمالي أصول + خصوم + ربح/خسارة الشهر + drafts + تنبيهات | **مختلفة بالتصميم** — لوحتان بمقاييس مختلفة |

---

## 8. ربط الحسابات البنكية

### 8.1 هل كل بنك مربوط بحساب محاسبي؟

**الجواب:** ليس بالضرورة.
- `OrganizationBank.chartAccountId` هو `String?` (nullable)
- عند `seedChartOfAccounts()` — Phase C (accounting.ts:188-218) تُنشئ حسابات فرعية تحت 1110 لكل بنك موجود وتربطها
- البنوك المُنشأة **بعد** التفعيل لا تُربط تلقائياً

### 8.2 ماذا يحدث عند إنشاء بنك جديد بعد تفعيل المحاسبة؟

**الجواب:** ❌ **لا يُنشأ حساب محاسبي تلقائياً.** لا يوجد hook في `createBankAccount()` (org-finance.ts:272-309) يستدعي إنشاء حساب فرعي. البنك الجديد سيكون بدون `chartAccountId`.

**التأثير:**
- `getBankChartAccountId()` في auto-journal.ts يعود بـ fallback لحساب 1110 (Cash & Banks العام) — القيود تُنشأ لكن على الحساب الأب
- `getBankLinesForReconciliationProcedure` يرمي خطأ إذا `chartAccountId` غير موجود — التسوية البنكية مستحيلة للبنك الجديد

### 8.3 ماذا يحدث عند حذف بنك؟

**الجواب:** `deleteBankAccount()` يحذف البنك فقط (بعد التأكد من عدم وجود عمليات). ❌ الحساب المحاسبي المربوط لا يُحذف ولا يُعطّل — يبقى يتيماً في دليل الحسابات.

### 8.4 هل الرصيدان يتغيّران بالتوازي؟

**الجواب:** ❌ **لا.** كما شُرح في القسم 5.1:
- `OrganizationBank.balance` يتغيّر ضمن transaction العملية المالية
- `JournalEntryLine` يُنشأ **بعد** العملية في try/catch منفصل
- إذا فشل القيد، الرصيد الأساسي تغيّر والمحاسبي لم يتغيّر

### 8.5 التسوية البنكية: أي رصيد تُقارن؟

**نظامان منفصلان:**

1. **النظام الأساسي** (`reconcileBankAccount` في org-finance.ts:167-267):
   - يحسب: `openingBalance + paymentsIn - expensesOut - subcontractPaymentsOut + transfersIn - transfersOut`
   - يقارن مع: `OrganizationBank.balance`
   - الهدف: التأكد من سلامة الرصيد الأساسي (هل balance يعكس كل العمليات)

2. **النظام المحاسبي** (`createBankReconciliation` في accounting.ts:1849):
   - يعرض: `JournalEntryLine` المرتبطة بالحساب المحاسبي للبنك
   - يُدخل المستخدم: `statementBalance` (رصيد كشف البنك الورقي)
   - يطابق يدوياً: كل بند في القيود مع كشف البنك
   - يحسب: `difference = statementBalance - bookBalance`

**الخلاصة:** التسوية المحاسبية لا تقارن مع `OrganizationBank.balance` — تقارن بنود القيود مع كشف البنك الخارجي. هذا تصميم صحيح محاسبياً.

---

## 9. حالات تسبب عدم تطابق

### 9.1 تعديل فاتورة بعد إصدارها

**الجواب:** ❌ **غير ممكن.** `updateInvoice()` (finance.ts:1051) يرفض أي تعديل إذا `status !== "DRAFT"`. الحقول الوحيدة القابلة للتعديل بعد الإصدار: `notes` (عبر `updateInvoiceNotes`).
**لا مشكلة تطابق هنا.**

### 9.2 حذف دفعة من فاتورة

**الجواب:** ✅ يُعكس القيد.
```
deleteInvoicePaymentProcedure (create-invoice.ts:483)
→ deleteInvoicePayment() — يُنقص paidAmount، يُعيد حساب الحالة
→ reverseAutoJournalEntry(db, { referenceType: "INVOICE_PAYMENT", referenceId: paymentId })
```
**لا مشكلة تطابق — بشرط نجاح العكس.**

### 9.3 تعديل مبلغ مصروف بعد الدفع

**الجواب:** ❌ **غير ممكن.** `updateExpense()` (org-finance.ts:724) لا يسمح بتغيير المبلغ — يُحدّث فقط: category, description, vendorName, vendorTaxNumber, invoiceRef, paymentMethod, referenceNo, notes.
**لا مشكلة تطابق.**

### 9.4 تعديل قيمة عقد مقاول باطن

**الجواب:** لا يؤثر على القيود. القيود تُنشأ فقط عند **الدفع** (وليس عند تغيير قيمة العقد). تغيير قيمة العقد يؤثر فقط على تقارير الربحية (`getProjectProfitabilityReport`).

### 9.5 تعديل بنود الفاتورة بعد الإصدار

**الجواب:** ❌ **غير ممكن.** `updateInvoiceItems()` (finance.ts:1102) يتحقق من `status === "DRAFT"`.

### 9.6 تكرار فاتورة (duplicateInvoice)

**الجواب:** يُنشئ فاتورة DRAFT جديدة — لا يولّد قيداً (القيد يُنشأ فقط عند الإصدار). **لا مشكلة.**

### 9.7 تحويل عرض سعر لفاتورة

**الجواب:** `convertQuotationToInvoice()` يُنشئ فاتورة DRAFT — القيد يُنشأ عند إصدارها لاحقاً. **لا مشكلة.**

### 9.8 مصروف PENDING يُدفع في فترة مغلقة

**الجواب:** ⚠️ **مشكلة محتملة.**
1. `payExpense()` ينجح — يخصم من البنك ✅
2. `onExpenseCompleted()` يُستدعى → `createJournalEntry()` يتحقق من الفترة
3. إذا الفترة مغلقة: `isPeriodClosed()` يُرجع true → القيد يُتخطّى بصمت (accounting.ts: silent skip)
4. **النتيجة:** المصروف مدفوع والبنك مخصوم لكن لا يوجد قيد محاسبي

**هذا يحدث أيضاً لأي عملية مالية تقع في فترة مغلقة — كل القيود التلقائية تُتخطّى بصمت.**

### 9.9 ازدواجية قيود الرواتب (حالة مكتشفة)

**التدفق:**
1. اعتماد رواتب → `onPayrollApproved()` → DR: 6100 (totalNet + totalGosi) / CR: بنك + 2170
2. لكل موظف يُنشأ `FinanceExpense` بحالة PENDING
3. عند دفع مصروفات الموظفين → `onExpenseCompleted()` → DR: 6100 (مرة أخرى) / CR: بنك

**النتيجة:** حساب 6100 يُسجّل **مرتين** — مرة عند الاعتماد ومرة عند الدفع. هذا يُضاعف مصروفات الرواتب في قائمة الدخل والميزان.

**ملاحظة:** هذه الحالة تحتاج التحقق — هل `sourceType: FACILITY_PAYROLL` يمنع `onExpenseCompleted` من الإنشاء؟ بالنظر إلى الكود في expenses.ts:263 — لا يوجد فحص على `sourceType`. القيد يُنشأ لأي مصروف COMPLETED بغض النظر عن مصدره.

---

## 10. التوصيات

### 🔴 أولوية قصوى (يجب إصلاحها قبل الإطلاق)

#### 1. إضافة قيد محاسبي لمدفوعات المشاريع (ProjectPayment)

**الملف:** يجب إضافة استدعاء auto-journal في procedure مدفوعات المشاريع

**القيد المطلوب:**
```
DR: البنك (destinationAccountId → chartAccountId)
CR: 1120 العملاء
```

**الملفات المتأثرة:**
- إنشاء: الـ procedure الذي يستدعي `createProjectPayment`
- تعديل: الـ procedure الذي يستدعي `updateProjectPayment`
- حذف: الـ procedure الذي يستدعي `deleteProjectPayment`

#### 2. إضافة قيد محاسبي لدفعات مستخلصات مقاولي الباطن

**الملف:** الـ procedure الذي يستدعي `addSubcontractClaimPayment` في subcontract-claims

**القيد المطلوب:**
```
DR: 5200 مقاولو باطن (مع projectId)
CR: البنك (sourceAccountId → chartAccountId)
```

#### 3. إصلاح ازدواجية قيود الرواتب

**الحلول المقترحة (اختر واحداً):**
- **الحل أ:** في `onExpenseCompleted()` — تخطّي المصروفات بنوع `sourceType === "FACILITY_PAYROLL"` (لأن القيد أُنشئ بالفعل عبر `onPayrollApproved`)
- **الحل ب:** إزالة `onPayrollApproved()` وترك القيد يُنشأ عند دفع كل مصروف
- **الحل أ أفضل** لأنه يحافظ على الربط المباشر بالمسير

#### 4. ربط تلقائي للبنوك الجديدة

**الملف:** `packages/api/modules/finance/procedures/banks.ts` — `createBankAccountProcedure`

**المطلوب:** بعد إنشاء البنك، إنشاء حساب فرعي تحت 1110 وربطه عبر `chartAccountId`. مشابه لـ Phase C في `seedChartOfAccounts`.

### 🟠 أولوية عالية

#### 5. منع إنشاء قيود في فترات مغلقة بصمت

**الحل:** بدلاً من تخطّي القيد بصمت، يجب تسجيل العمليات الفاشلة في جدول `PendingJournalEntry` أو تنبيه المستخدم.

#### 6. إضافة حذف/إلغاء لدفعات مقاولي الباطن مع عكس القيد

**المطلوب:** إنشاء `deleteSubcontractPayment` أو `cancelSubcontractPayment` مع استدعاء `reverseAutoJournalEntry(db, { referenceType: "SUBCONTRACT_PAYMENT", referenceId })`.

#### 7. معالجة ضريبة المدخلات (Input VAT)

**المشكلة:** حساب 1150 (ضريبة مدخلات) لا يُغذّى بأي قيد تلقائي. المصروفات تُسجّل بالمبلغ الكامل (شامل الضريبة) في حساب المصروف.

**الحل:** عند إنشاء قيد المصروف، فصل الضريبة:
```
DR: حساب المصروف = amount * (100/115)  ← المبلغ قبل الضريبة
DR: 1150 ضريبة مدخلات = amount * (15/115) ← الضريبة
CR: البنك = amount                        ← المبلغ الكامل
```

### 🟡 أولوية متوسطة

#### 8. إضافة قيد التزام عند اعتماد مستخلص مقاول باطن

**القيد المطلوب (اختياري — أساس الاستحقاق):**
```
عند APPROVED:
DR: 5200 مقاولو باطن → CR: 2120 مستحقات مقاولي باطن

عند الدفع:
DR: 2120 مستحقات مقاولي باطن → CR: البنك
```

**هذا يجعل حساب 2120 يعكس الالتزامات الفعلية ويتطابق مع تقرير المستحقات المتقادمة.**

#### 9. توحيد تقارير الإيرادات

**المشكلة:** نظامان للتقارير يعطيان نتائج مختلفة (أساس نقدي vs استحقاقي).

**الحل:** إضافة toggle "أساس نقدي / أساس استحقاقي" في التقارير، أو توضيح الفرق للمستخدم.

#### 10. أداة Backfill للقيود التاريخية

**المشكلة:** محاسب يفعّل وضع المحاسبة على بيانات موجودة يرى ميزان مراجعة فارغ (إلا من الأرصدة الافتتاحية).

**الحل المقترح:** أداة تمر على كل العمليات المالية السابقة وتولّد قيوداً لها (backfill). يجب أن تكون اختيارية وتُشغّل مرة واحدة.

#### 11. توثيق الفرق بين النظامين للمستخدم

**المطلوب:** رسالة واضحة عند تفعيل وضع المحاسبة توضّح أن:
- الأرقام في القسم المحاسبي تعكس فقط العمليات منذ التفعيل
- يجب إدخال أرصدة افتتاحية تعكس الوضع الحالي
- بعض العمليات (مدفوعات المشاريع) قد لا تظهر في التقارير المحاسبية حتى إصلاح الفجوات

### 🟢 أولوية منخفضة

#### 12. تنظيف `invalidateAccountingCache` (Dead Code)

الدالة مُصدّرة لكن لا تُستدعى. إما حذفها أو استدعاؤها عند تعديل/حذف حسابات.

#### 13. إصلاح ترقيم حسابات البنوك في Seed

**المشكلة:** `111${(i + 1).toString().padStart(1, "0")}` — لـ 10+ بنوك يُنتج أكواد بـ 5 أرقام (11110) بدل 4.
**الحل:** استخدام `padStart(2, "0")` مثلاً.

---

## ملحق: ملخص الفجوات بالأرقام

| الرقم | الفجوة | الخطورة | تأثير على الأرصدة | تأثير على التقارير |
|-------|--------|---------|-------------------|-------------------|
| 1 | ProjectPayment بدون قيد | 🔴 حرج | البنك المحاسبي < الفعلي | ميزان + ميزانية ناقصة |
| 2 | addSubcontractClaimPayment بدون قيد | 🔴 حرج | البنك المحاسبي > الفعلي | ميزان + ميزانية غير صحيحة |
| 3 | ازدواجية قيود الرواتب | 🔴 حرج | مصروفات مضاعفة | قائمة دخل وميزان خاطئة |
| 4 | بنوك جديدة بدون ربط | 🟠 عالي | قيود على 1110 العام | تسوية بنكية مستحيلة |
| 5 | فترة مغلقة تبتلع القيود | 🟠 عالي | عمليات بدون قيود | تقارير ناقصة |
| 6 | حذف SubcontractPayment بدون عكس | 🟡 متوسط | قيد يتيم | أرقام زائدة |
| 7 | 2120 مستحقات مقاولي الباطن = 0 دائماً | 🟡 متوسط | حساب ميت | الميزانية ناقصة خصوم |
| 8 | ضريبة المدخلات (1150) = 0 دائماً | 🟡 متوسط | أصل ناقص | VAT report مختلف |
| 9 | لا backfill | 🟡 متوسط | — | بيانات تاريخية مفقودة |
| 10 | ProjectExpense لا يصل للمحاسبة | 🟢 منخفض | — (سجل تتبعي) | — |
| 11 | DEBIT_NOTE لا يوجد إجراء مخصص | 🟢 منخفض | — | — |

---

*انتهى التقرير — 2026-03-24*
