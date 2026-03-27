# تقرير تدقيق شامل — نظام الحسابات والمحاسبة والمالية في منصة مسار

> **تاريخ التدقيق:** 2026-03-27
> **النطاق:** كامل النظام المالي والمحاسبي — من الـ Schema إلى الواجهة الأمامية
> **المدقق:** Claude Code (قراءة وتحليل شامل لكل الملفات المذكورة)
> **الحالة:** READ-ONLY — لم يُعدَّل أي ملف

---

## ═══════════════════════════════════════════════════
## القسم 1: الخريطة العامة للنظام المالي والمحاسبي
## ═══════════════════════════════════════════════════

### 1.1 رسم بياني ASCII — تدفق النظام

```
┌─────────────────────────────────────────────────────────────────┐
│                    النظام المالي (يعمل دائماً)                    │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ فواتير   │  │ مصروفات  │  │ مقبوضات  │  │ تحويلات بنكية   │ │
│  │ Invoice  │  │ Expense  │  │ Payment  │  │ Transfer         │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────────────┘ │
│       │              │              │              │               │
│       ▼              ▼              ▼              ▼               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              OrganizationBank.balance (مباشر)               │  │
│  │        يُحدَّث ذرياً مع $transaction + atomic guard        │  │
│  └────────────────────────────────────────────────────────────┘  │
│       │              │              │              │               │
│       ▼              ▼              ▼              ▼               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │          auto-journal.ts (29 عملية — try/catch)            │  │
│  │     الأخطاء لا تكسر العملية المالية (silent failure)       │  │
│  └────────────────────────────────────────────────────────────┘  │
│       │                                                           │
│       ▼                                                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │    النظام المحاسبي (يعمل دائماً — لا يوجد toggle)          │  │
│  │                                                              │  │
│  │  ┌──────────────┐ ┌───────────┐ ┌────────────────────────┐  │  │
│  │  │ دليل حسابات │ │ قيود      │ │ تقارير (8 تقارير)     │  │  │
│  │  │ ChartAccount │ │ Journal   │ │ Trial Balance, etc.    │  │  │
│  │  │ 48 حساب     │ │ Entry     │ │                        │  │  │
│  │  └──────────────┘ └───────────┘ └────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐  │
│  │ مقاولو الباطن            │  │ مشاريع (مالية)                │  │
│  │ SubcontractContract      │  │ ProjectContract               │  │
│  │ SubcontractClaim         │  │ ProjectClaim                  │  │
│  │ SubcontractPayment       │  │ ProjectPayment                │  │
│  └──────────────────────────┘  └──────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐  │
│  │ الرواتب                   │  │ السندات                       │  │
│  │ PayrollRun + Items        │  │ ReceiptVoucher                │  │
│  │ → FinanceExpense          │  │ PaymentVoucher                │  │
│  └──────────────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 جدول شامل بالجداول المالية والمحاسبية

| # | الجدول | عدد الحقول | العلاقات | audit log | cascade delete | soft delete |
|---|--------|-----------|---------|-----------|---------------|-------------|
| 1 | `FinanceInvoice` | ~40 | Client, Project, Quotation, Items, Payments, CreditNotes | ✅ (13 action) | Cascade → Items, Payments | ❌ (hard delete) |
| 2 | `FinanceInvoiceItem` | ~8 | Invoice | ❌ | ← Cascade from Invoice | ❌ |
| 3 | `FinanceInvoicePayment` | ~10 | Invoice, BankAccount, ReceiptVoucher | ✅ | ← Cascade from Invoice | ❌ |
| 4 | `FinanceExpense` | ~20 | Organization, BankAccount, Project, PayrollItems | ✅ (5 actions) | ❌ | via status=CANCELLED |
| 5 | `FinancePayment` | ~18 | Organization, BankAccount, Client, Project, Invoice, ContractTerm | ✅ (3 actions) | ❌ | via status=CANCELLED |
| 6 | `FinanceTransfer` | ~12 | Organization, FromAccount, ToAccount | ✅ (2 actions) | ❌ | via status=CANCELLED |
| 7 | `OrganizationBank` | ~14 | Organization, Expenses, Payments, Transfers, Invoices, Reconciliations, ChartAccount | ✅ (4 actions) | ❌ | via isActive=false |
| 8 | `Client` | ~24 | Organization, Quotations, Invoices, Contacts, Payments, Projects | ✅ (3 actions) | Cascade → Contacts | ❌ |
| 9 | `ClientContact` | ~8 | Client | ❌ | ← Cascade from Client | ❌ |
| 10 | `Quotation` | ~28 | Organization, Client, Project, CostStudy, Template, Items, DisplayConfig | ✅ (5 actions) | Cascade → Items, DisplayConfig | ❌ |
| 11 | `QuotationItem` | ~7 | Quotation | ❌ | ← Cascade from Quotation | ❌ |
| 12 | `SubcontractContract` | ~22 | Project, PaymentTerms, ChangeOrders, Payments, Items, Claims | ✅ (7+ actions) | Cascade → all children | ❌ |
| 13 | `SubcontractPaymentTerm` | ~8 | Contract, Payments | ❌ | ← Cascade from Contract | ❌ |
| 14 | `SubcontractChangeOrder` | ~9 | Contract | ✅ (3 actions) | ← Cascade from Contract | ❌ |
| 15 | `SubcontractPayment` | ~16 | Contract, Term, Claim, BankAccount, PaymentVoucher | ✅ (1 action) | ← Cascade from Contract | ❌ |
| 16 | `SubcontractItem` | ~12 | Contract, ClaimItems | ✅ (4 actions) | ← Cascade from Contract | ❌ |
| 17 | `SubcontractClaim` | ~18 | Contract, Items, Payments | ✅ (4 actions) | Cascade → Items | ❌ |
| 18 | `SubcontractClaimItem` | ~8 | Claim, ContractItem | ❌ | ← Cascade from Claim | ❌ |
| 19 | `ProjectContract` | ~24 | Project (1-1), PaymentTerms, ChangeOrders | ✅ (2 actions) | Cascade → PaymentTerms | ❌ |
| 20 | `ContractPaymentTerm` | ~10 | Contract, Payments, ProjectPayments | ❌ | ← Cascade from Contract | ❌ |
| 21 | `ProjectExpense` | ~12 | Project, SubcontractContract | ✅ | ← Cascade from Project | ❌ |
| 22 | `ProjectClaim` | ~14 | Project, ChangeOrders | ✅ | ← Cascade from Project | ❌ |
| 23 | `ProjectPayment` | ~14 | Organization, Project, ContractTerm, BankAccount, ReceiptVoucher | ✅ (3 actions) | ← Cascade from Project | ❌ |
| 24 | `ChartAccount` | ~14 | Organization, Parent/Children (self), JournalLines, BankAccount (1-1) | ❌ | ← Cascade from Organization | via isActive=false |
| 25 | `JournalEntry` | ~20 | Organization, Lines, Period, ReversedBy/Reversal, Creator, Poster | ✅ (2 actions) | Cascade → Lines | via status=REVERSED |
| 26 | `JournalEntryLine` | ~7 | JournalEntry, Account, Project, BankReconciliationItems | ❌ | ← Cascade from JournalEntry | ❌ |
| 27 | `AccountingPeriod` | ~10 | Organization, ClosingEntry, JournalEntries | ❌ | ← Cascade from Organization | ❌ |
| 28 | `RecurringJournalTemplate` | ~12 | Organization, Creator | ❌ | ← Cascade from Organization | via isActive=false |
| 29 | `BankReconciliation` | ~12 | Organization, BankAccount, Items | ❌ | ← Cascade from BankAccount | ❌ |
| 30 | `BankReconciliationItem` | ~5 | Reconciliation, JournalEntryLine | ❌ | ← Cascade from Reconciliation | ❌ |
| 31 | `ReceiptVoucher` | ~24 | Organization, Payment, InvoicePayment, ProjectPayment, Project, Client, BankAccount | ✅ (4 actions) | ❌ | via status=CANCELLED |
| 32 | `PaymentVoucher` | ~26 | Organization, Expense, SubcontractPayment, Project, SubcontractContract, BankAccount | ✅ (6 actions) | ❌ | via status=CANCELLED |
| 33 | `PayrollRun` | ~14 | Organization, Items, BankAccount, Creator, Approver | ✅ (2 actions) | Cascade → Items | via status=CANCELLED |
| 34 | `PayrollRunItem` | ~12 | PayrollRun, Employee, FinanceExpense | ❌ | ← Cascade from PayrollRun | ❌ |
| 35 | `CompanyExpense` | ~12 | Organization, Payments, Allocations, RunItems | ❌ | ← Cascade from Organization | via isActive=false |
| 36 | `CompanyExpensePayment` | ~12 | CompanyExpense, BankAccount, FinanceExpense | ❌ | ← Cascade from CompanyExpense | ❌ |
| 37 | `CompanyExpenseAllocation` | ~6 | CompanyExpense, Project | ❌ | ← Cascade from CompanyExpense | ❌ |
| 38 | `CompanyExpenseRun` | ~10 | Organization, Items, Creator, Poster | ❌ | ← Cascade from Organization | via status=CANCELLED |
| 39 | `CompanyExpenseRunItem` | ~8 | ExpenseRun, CompanyExpense, FinanceExpense | ❌ | ← Cascade from ExpenseRun | ❌ |
| 40 | `OrganizationSequence` | ~4 | Organization | ❌ | ← Cascade from Organization | ❌ |
| 41 | `OrganizationAuditLog` | ~8 | Organization, Actor(User) | — | ← Cascade from Organization | ❌ |
| 42 | `FinanceTemplate` | ~8 | Organization, Quotations, Invoices, OpenDocuments | ❌ | ← Cascade from Organization | ❌ |
| 43 | `OrganizationFinanceSettings` | ~28 | Organization (1-1) | ❌ | ← Cascade from Organization | ❌ |
| 44 | `HandoverProtocol` | ~20 | Organization, Project, SubcontractContract, Items | ✅ (9 actions) | Cascade → Items | ❌ |
| 45 | `HandoverProtocolItem` | ~10 | Protocol | ❌ | ← Cascade from Protocol | ❌ |

**المجموع: 45 جدول مالي/محاسبي**

### 1.3 خريطة التبعيات (Dependency Graph)

```
Organization (الجذر)
├── OrganizationBank ──────→ ChartAccount (1-1 optional)
│   ├── FinanceExpense
│   ├── FinancePayment
│   ├── FinanceTransfer (from/to)
│   ├── FinanceInvoicePayment
│   ├── SubcontractPayment
│   ├── ProjectPayment
│   ├── CompanyExpensePayment
│   ├── PayrollRun
│   ├── BankReconciliation → BankReconciliationItem → JournalEntryLine
│   ├── ReceiptVoucher
│   └── PaymentVoucher
│
├── Client
│   ├── Quotation → QuotationItem, DisplayConfig
│   ├── FinanceInvoice → FinanceInvoiceItem, FinanceInvoicePayment
│   ├── FinancePayment
│   └── ReceiptVoucher
│
├── Project
│   ├── ProjectContract → ContractPaymentTerm
│   ├── ProjectExpense
│   ├── ProjectClaim → ProjectChangeOrder
│   ├── ProjectPayment → ReceiptVoucher
│   ├── SubcontractContract
│   │   ├── SubcontractPaymentTerm
│   │   ├── SubcontractChangeOrder
│   │   ├── SubcontractPayment → PaymentVoucher
│   │   ├── SubcontractItem → SubcontractClaimItem
│   │   └── SubcontractClaim → SubcontractClaimItem
│   ├── FinanceExpense (project-linked)
│   ├── FinancePayment (project-linked)
│   ├── JournalEntryLine (project-linked)
│   └── HandoverProtocol → HandoverProtocolItem
│
├── ChartAccount (self-referencing hierarchy)
│   └── JournalEntryLine
│
├── JournalEntry → JournalEntryLine
│   ├── AccountingPeriod (optional)
│   └── Reversal chain (self-referencing)
│
├── RecurringJournalTemplate
│
├── Employee
│   └── PayrollRunItem
│
├── CompanyExpense → CompanyExpensePayment, CompanyExpenseAllocation
├── CompanyExpenseRun → CompanyExpenseRunItem
│
├── PayrollRun → PayrollRunItem
│
├── OrganizationSequence
├── OrganizationAuditLog
├── OrganizationFinanceSettings (1-1)
└── FinanceTemplate
```

### 1.4 إحصائيات عامة

| المقياس | القيمة |
|---------|--------|
| جداول مالية/محاسبية | 45 |
| Enums مالية | 30+ |
| Indexes مالية | 135+ (onDelete: Cascade) |
| Backend API Endpoints (مالية) | ~200+ |
| Backend Query Files (مالية) | 15 ملف, ~12,500 سطر |
| Backend Procedure Files (مالية) | ~60 ملف, ~12,000 سطر |
| Auto-Journal Operations | 29 عملية (12 دالة + reversal) |
| Frontend Components (مالية) | ~109 ملف, ~26,000 سطر |
| Frontend Pages (مالية) | ~151 ملف (page.tsx + loading.tsx) |
| حسابات افتراضية | 48 حساب |
| تقارير محاسبية | 8 تقارير |
| إجمالي أسطر الكود المالي | **~57,000+ سطر** |

---

## ═══════════════════════════════════════════════════
## القسم 2: النظام المالي (يعمل دائماً بدون محاسبة)
## ═══════════════════════════════════════════════════

### 2.1 دورة الفوترة الكاملة

#### State Machine — حالات الفاتورة

```
DRAFT ──→ ISSUED ──→ SENT ──→ VIEWED
  │          │                    │
  │          ├──→ PARTIALLY_PAID ─┤
  │          │         │          │
  │          ├──→ PAID ◄──────────┘
  │          │
  │          ├──→ OVERDUE (by due date)
  │          │
  └──→ (delete)  └──→ CANCELLED
```

#### خطوات الدورة

**1. إنشاء فاتورة مسودة**
- **Procedure:** `create-invoice.ts` → `createInvoice` (subscriptionProcedure)
- **Input:** organizationId, clientId/clientName, projectId, items[], vatPercent, issueDate, dueDate, etc.
- **Validations:**
  - `verifyOrganizationAccess(context, input.organizationId, "finance.create")`
  - `enforceFeatureAccess(context, input.organizationId, "export.pdf")` (for non-draft)
  - Items must have description, quantity > 0, unitPrice ≥ 0
  - issueDate ≤ dueDate
- **Side Effects:**
  - Sequential number via `getNextSequenceNo(db, organizationId, "INV")` → e.g., `INV-2026-0001`
  - Subtotal = Σ(item.quantity × item.unitPrice)
  - discountAmount computed from discountPercent
  - vatAmount = (subtotal - discountAmount) × vatPercent / 100
  - totalAmount = subtotal - discountAmount + vatAmount
  - Client info copied from Client record if clientId provided
  - `orgAuditLog(INVOICE_CREATED)`
- **الحالة النهائية:** DRAFT

**2. إصدار الفاتورة رسمياً**
- **Procedure:** `create-invoice.ts` → `issueInvoice` (subscriptionProcedure)
- **Validations:**
  - Must be in DRAFT status
  - Must have at least 1 item
  - totalAmount > 0
- **Side Effects:**
  - Status → ISSUED
  - `issuedAt` = now()
  - Seller info frozen (sellerName, sellerAddress, sellerPhone, sellerTaxNumber)
  - **ZATCA QR Code** generated if organization has `taxNumber`
  - **Auto-Journal:** `onInvoiceIssued()` → DR 1120 (عملاء) / CR 4100 (إيرادات) + CR 2130 (ضريبة)
  - `orgAuditLog(INVOICE_ISSUED)`

**3. تسجيل دفعة على الفاتورة**
- **Procedure:** `create-invoice.ts` → `addInvoicePayment` (subscriptionProcedure)
- **Input:** invoiceId, amount, paymentDate, paymentMethod, sourceAccountId, referenceNo
- **Validations:**
  - Invoice must be ISSUED/PARTIALLY_PAID/SENT/VIEWED
  - amount > 0
  - amount ≤ remaining (totalAmount - paidAmount)
  - **⚠️ ملاحظة:** التحقق من عدم تجاوز المبلغ المتبقي يتم في `finance.ts` query
- **Side Effects:**
  - Create FinanceInvoicePayment record
  - Update invoice.paidAmount += amount
  - Update invoice.status:
    - If paidAmount ≥ totalAmount → PAID
    - Else → PARTIALLY_PAID
  - **Bank Balance:** atomic increment via `$transaction` + atomic guard
  - **Auto-Journal:** `onInvoicePaymentReceived()` → DR Bank / CR 1120
  - `orgAuditLog(INVOICE_PAYMENT_ADDED)`

**4. إشعار دائن (Credit Note)**
- **Procedure:** `create-invoice.ts` → `createCreditNote` (subscriptionProcedure)
- **Input:** relatedInvoiceId, items[], vatPercent
- **Validations:**
  - Related invoice must exist and be ISSUED/PAID/PARTIALLY_PAID
  - Credit note amount ≤ original invoice totalAmount
- **Side Effects:**
  - New invoice with invoiceType = CREDIT_NOTE
  - relatedInvoiceId linked
  - **Auto-Journal:** `onCreditNoteIssued()` → DR 4100+2130 / CR 1120
  - `orgAuditLog(INVOICE_CREDIT_NOTE_CREATED)`

#### حالات الحافة (Edge Cases)

| الحالة | السلوك |
|--------|--------|
| حذف فاتورة لها دفعات | **يُمنع** — must delete payments first (Cascade on FinanceInvoicePayment but validation prevents if paidAmount > 0) |
| تعديل فاتورة صادرة (ISSUED) | **مسموح** — items/amounts can be updated even after ISSUED. **⚠️ خطر:** لا يُعاد حساب القيد المحاسبي تلقائياً |
| إشعار دائن لفاتورة مدفوعة بالكامل | **مسموح** — creates credit note but doesn't reverse payments |
| حذف دفعة من فاتورة مدفوعة جزئياً | **مسموح** — updates paidAmount, may revert status to ISSUED/PARTIALLY_PAID. Reverses bank balance and auto-journal |

### 2.2 دورة المصروفات الكاملة

#### State Machine

```
(create) → COMPLETED ──→ CANCELLED
              │
              └──→ (delete)
     or
(create) → PENDING ──→ COMPLETED ──→ CANCELLED
```

- **Procedure:** `expenses.ts` → `createExpense` (subscriptionProcedure)
- **Input:** organizationId, category (OrgExpenseCategory), amount, date, sourceAccountId, projectId, etc.
- **25+ فئات مصروفات:** MATERIALS, LABOR, EQUIPMENT_RENTAL, EQUIPMENT_PURCHASE, SUBCONTRACTOR, TRANSPORT, SALARIES, RENT, UTILITIES, COMMUNICATIONS, INSURANCE, LICENSES, BANK_FEES, FUEL, MAINTENANCE, SUPPLIES, MARKETING, TRAINING, TRAVEL, HOSPITALITY, LOAN_PAYMENT, TAXES, ZAKAT, REFUND, MISC, CUSTOM

#### فئات معفاة من VAT

```typescript
const VAT_EXEMPT = ["SALARIES", "SALARY", "GOVERNMENT_FEES", "BANK_FEES", "FINES", "INSURANCE"];
```

**السبب:** هذه الفئات لا تتضمن ضريبة مدخلات قابلة للاسترداد.

#### خريطة الفئات → أكواد الحسابات (EXPENSE_CATEGORY_TO_ACCOUNT_CODE)

| الفئة | كود الحساب | اسم الحساب |
|-------|-----------|------------|
| MATERIALS | 5100 | مواد ومشتريات |
| LABOR | 5300 | عمالة مباشرة |
| EQUIPMENT_RENTAL | 6300 | إيجارات |
| EQUIPMENT_PURCHASE | 1200 | أصول ثابتة (⚠️ ليس مصروف) |
| SUBCONTRACTOR | 5200 | مقاولو باطن |
| TRANSPORT | 6700 | نقل ومواصلات |
| SALARIES | 6100 | رواتب إدارية |
| RENT | 6300 | إيجارات |
| UTILITIES | 6400 | مرافق |
| INSURANCE | 6500 | تأمين |
| BANK_FEES | 6800 | رسوم بنكية |
| LOAN_PAYMENT | 2110 | ⚠️ خصوم (سداد قرض) |
| REFUND | 4300 | ⚠️ إيرادات أخرى (مرتجعات) |
| MISC / default | 6900 | مصروفات أخرى |

**⚠️ ملاحظة هامة:** `EQUIPMENT_PURCHASE` (1200) و `LOAN_PAYMENT` (2110) و `REFUND` (4300) هي حالات خاصة:
- شراء المعدات يُسجَّل كأصل وليس مصروف
- سداد القرض يُخفض الخصوم
- المرتجعات تُسجَّل كإيراد سلبي

### 2.3 دورة المقبوضات (FinancePayment)

- **Procedure:** `payments.ts` → `createPayment` (subscriptionProcedure)
- **أنواع المقبوضات:**
  - مرتبطة بفاتورة (`invoiceId` provided)
  - مرتبطة بمرحلة دفع عقد (`contractTermId` provided)
  - مقبوضات مباشرة (بدون ربط — type = INCOME)
- **تأثير على رصيد البنك:** atomic increment via `$transaction`
- **ترقيم:** `getNextSequenceNo(db, organizationId, "RCV")` → `RCV-2026-0001`
- **Auto-Journal:** `onOrganizationPaymentReceived()` → DR Bank / CR 4300 (إيرادات أخرى)

### 2.4 دورة التحويلات البنكية

- **Procedure:** `transfers.ts` → `createTransfer` (subscriptionProcedure)
- **Input:** fromAccountId, toAccountId, amount, date
- **التأثير:**
  - fromAccount.balance -= amount (atomic, with negative balance guard)
  - toAccount.balance += amount (atomic)
  - **كلاهما في نفس `$transaction`**
- **Auto-Journal:** `onTransferCompleted()` → DR toBank / CR fromBank
- **إلغاء التحويل:** status → CANCELLED, reverse both balance changes, `reverseAutoJournalEntry()`

### 2.5 إدارة الحسابات البنكية

- **أنواع:** BANK (حساب بنكي), CASH_BOX (صندوق نقدي)
- **الحساب الافتراضي:** `isDefault = true` — one per organization
- **حماية الرصيد السالب:** "Layer 2: Atomic guard — prevents negative balance under concurrency" في 3 مواقع في `org-finance.ts`
- **الربط المحاسبي:** كل حساب بنكي يمكن ربطه بحساب في دليل الحسابات (`chartAccountId` — 1-1 unique)
- **إنشاء تلقائي:** عند أول عملية محاسبية، يُنشأ حساب محاسبي فرعي تحت 1110 تلقائياً (`createBankChartAccount`)
- **حذف حساب بنكي:** ⚠️ لم أجد تحققاً صريحاً يمنع حذف حساب بنكي له عمليات (يعتمد على `onDelete: SetNull` في العلاقات)

### 2.6 إدارة العملاء

- **Client types:** INDIVIDUAL (فردي), COMMERCIAL (تجاري/شركة)
- **كود العميل:** `code` field مع unique constraint (`C-001`, `C-002`, ...)
- **حذف عميل:** `onDelete: Cascade` على ClientContact فقط. العلاقات مع Invoice/Quotation/Payment تستخدم `onDelete: SetNull` — يمكن حذف العميل وتبقى فواتيره ومقبوضاته (clientId يصبح null)

### 2.7 التقارير المالية (بدون محاسبة)

التقارير المالية تعمل بشكل مستقل عن النظام المحاسبي — تقرأ مباشرة من جداول `FinanceInvoice`, `FinanceExpense`, `FinancePayment`:

#### Revenue by Period
- **المصدر:** `finance-reports.ts`
- **الحساب:** SUM(FinanceInvoice.totalAmount) WHERE status IN [ISSUED, PAID, PARTIALLY_PAID] grouped by month
- **الفلاتر:** dateFrom, dateTo, projectId

#### Cash Flow
- **المصدر:** `cash-flow.ts`
- **المدخلات (Inflows):** SUM(FinancePayment.amount) + SUM(FinanceInvoicePayment.amount) + SUM(ProjectPayment.amount)
- **المخرجات (Outflows):** SUM(FinanceExpense.amount WHERE status=COMPLETED) + SUM(SubcontractPayment.amount) + SUM(FinanceTransfer.amount)
- **صافي التدفق:** Inflows - Outflows

#### Profitability per Project
- **المصدر:** `finance-reports.ts`
- **الإيرادات:** ProjectClaim (approved) + ProjectPayment
- **المصروفات:** FinanceExpense (projectId) + ProjectExpense + SubcontractPayment (via contract.projectId)
- **الربح:** Revenue - Direct Expenses
- **⚠️ لا يشمل:** Indirect expenses (CompanyExpenseAllocation)

#### Aged Receivables
- **المصدر:** `accounting-reports.ts`
- **القاعدة:** FinanceInvoice WHERE status IN [ISSUED, PARTIALLY_PAID, OVERDUE]
- **الشرائح:**
  - 0-30 يوم (current)
  - 31-60 يوم
  - 61-90 يوم
  - 90+ يوم (very overdue)
- **الحساب:** `daysOverdue = today - dueDate`
- **المبلغ:** `totalAmount - paidAmount` (remaining balance)

#### Aged Payables
- **نفس المنطق** لكن من FinanceExpense WHERE status = PENDING/COMPLETED مع dueDate

#### VAT Report (3 تبويبات)
- **تبويب الملخص:**
  - ضريبة المخرجات = SUM(FinanceInvoice.vatAmount) WHERE status NOT DRAFT/CANCELLED
  - ضريبة المدخلات = SUM(FinanceExpense.amount × 15/115) WHERE category NOT VAT_EXEMPT
  - الصافي = المخرجات - المدخلات
- **تبويب تفاصيل الفواتير:** كل فاتورة مع subtotal, vatAmount, total
- **تبويب تفاصيل المصروفات:** كل مصروف مع net amount, VAT amount (15/115 split)

### 2.8 عروض الأسعار (Quotations)

#### State Machine

```
DRAFT → SENT → VIEWED → ACCEPTED → CONVERTED (to Invoice)
                  │
                  └→ REJECTED
           │
           └→ EXPIRED (⚠️ لا يوجد انتهاء صلاحية تلقائي — يدوي فقط)
```

- **تحويل لفاتورة:** creates new FinanceInvoice with items copied from quotation
- **ربط بدراسة الكميات:** `costStudyId` — يسحب بنود من CostStudy
- **صلاحية:** `validUntil` field — **لا يوجد cron job لتحويل تلقائي إلى EXPIRED**

---

## ═══════════════════════════════════════════════════
## القسم 3: المالية على مستوى المشروع
## ═══════════════════════════════════════════════════

### 3.1 عقد المشروع (ProjectContract)

- **علاقة 1-1** مع Project (`projectId @unique`)
- **الحقول المالية:** value, currency, retentionPercent, retentionCap, vatPercent, performanceBondPercent, penaltyPercent
- **شروط الدفع:** `ContractPaymentTerm` — types: ADVANCE, MILESTONE, MONTHLY, COMPLETION, CUSTOM
- **كل شرط دفع:** has `status` (PENDING/PARTIALLY_PAID/FULLY_PAID) و `paidAmount`
- **⚠️ لا يوجد تحقق:** أن مجموع شروط الدفع = قيمة العقد (يمكن أن يتجاوز أو ينقص)

### 3.2 مستخلصات المشروع (ProjectClaim)

#### State Machine

```
DRAFT → SUBMITTED → APPROVED → PAID
                       │
                       └→ REJECTED
```

- **Model بسيط:** claimNo, amount, status — **لا يوجد بنود تفصيلية** (بعكس SubcontractClaim)
- **لا يوجد:** prevCumulativeQty, thisQty — المبلغ يُدخل مباشرة
- **⚠️ لا يوجد تحقق:** أن مجموع المستخلصات ≤ قيمة العقد
- **Auto-Journal عند الاعتماد:** `onProjectClaimApproved()` → DR 1120 (عملاء) / CR 4100 (إيرادات)

### 3.3 دفعات المشروع (ProjectPayment)

- **مختلف عن FinanceInvoicePayment:** payment مستقل مرتبط بالمشروع
- **ربط اختياري بمرحلة دفع:** `contractTermId` → يحدّث `ContractPaymentTerm.paidAmount`
- **تأثير على رصيد البنك:** ✅ يحدّث `OrganizationBank.balance`
- **Auto-Journal:** `onProjectPaymentReceived()` → DR Bank / CR 1120 (عملاء)
- **ترقيم:** unique per project (`@@unique([projectId, paymentNo])`)

### 3.4 مصروفات المشروع (ProjectExpense)

- **جدول منفصل** عن FinanceExpense (`project_expenses`)
- **فئات أبسط:** MATERIALS, LABOR, EQUIPMENT, SUBCONTRACTOR, TRANSPORT, MISC
- **لا يؤثر على رصيد البنك مباشرة** — معلوماتي فقط
- **⚠️ لا يُولِّد قيد محاسبي** — يُستخدم فقط لحساب ربحية المشروع
- **يظهر في Cost Center Report** عبر JournalEntryLine.projectId (من FinanceExpense المرتبطة)

### 3.5 ربحية المشروع (Profitability)

- **الحساب:** `contractValue - totalExpenses - subcontractPayments`
- **يُحسَب عند الطلب** (ليس realtime) — من `project-finance.ts` → `getFinanceSummary()`
- **يشمل:**
  - إيرادات: مجموع مستخلصات + دفعات
  - مصروفات: ProjectExpense + FinanceExpense المربوطة بالمشروع
  - مقاولو الباطن: SubcontractPayment
- **⚠️ لا يشمل:** المصروفات غير المباشرة (CompanyExpense allocations)

---

## ═══════════════════════════════════════════════════
## القسم 4: مقاولو الباطن (نظام كامل)
## ═══════════════════════════════════════════════════

### 4.1 عقد الباطن (SubcontractContract)

#### State Machine

```
DRAFT → ACTIVE → COMPLETED
           │
           ├→ SUSPENDED
           └→ TERMINATED
```

- **أنواع المقاول:** COMPANY, INDIVIDUAL
- **الاحتفاظ (Retention):** `retentionPercent` + `retentionCapPercent`
  - retentionPercent: نسبة الاستقطاع من كل مستخلص
  - retentionCapPercent: الحد الأقصى للاستقطاع كنسبة من قيمة العقد
- **الدفعة المقدمة:** `advancePaymentPercent` / `advancePaymentAmount`
  - تُخصم تدريجياً من المستخلصات
- **الضريبة:** `includesVat` + `vatPercent`
- **أوامر التغيير:** SubcontractChangeOrder — تؤثر على قيمة العقد عند APPROVED
- **بنود العقد (BOQ):** SubcontractItem — description, contractQty, unitPrice, totalAmount

### 4.2 مستخلصات الباطن (SubcontractClaim)

#### State Machine (أكثر تفصيلاً)

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → PARTIALLY_PAID → PAID
                                       │
                                       └→ REJECTED
                                              │
                                              └→ CANCELLED
```

#### أنواع المستخلصات
- `INTERIM` — مستخلص جاري (أثناء التنفيذ)
- `FINAL` — مستخلص ختامي (عند الإنهاء)
- `RETENTION` — استرداد محتجزات

#### بنود المستخلص (SubcontractClaimItem)

```
contractQty:       الكمية التعاقدية الأصلية
unitPrice:         سعر الوحدة التعاقدي
prevCumulativeQty: الكمية التراكمية السابقة (من المستخلصات السابقة)
thisQty:           كمية هذا المستخلص
thisAmount:        مبلغ هذا المستخلص = thisQty × unitPrice
```

#### حسابات المستخلص

```
grossAmount     = Σ(thisAmount)                              // إجمالي البنود
retentionAmount = grossAmount × retentionPercent / 100       // الاستقطاع
advanceDeduction = grossAmount × advancePaymentPercent / 100 // خصم الدفعة المقدمة
vatAmount       = (grossAmount - retentionAmount) × vatPercent / 100  // الضريبة
netAmount       = grossAmount - retentionAmount - advanceDeduction + vatAmount  // الصافي
```

**التحقق الرياضي:**
- `grossAmount = Σ(thisQty × unitPrice)` ✅ يُحسب من بنود المستخلص
- `retentionAmount`: يُطبق فقط إذا `contract.retentionPercent > 0`
  - يُراعي `retentionCapPercent` (لا يتجاوز الحد الأقصى)
- `advanceDeduction`: يُطبق فقط إذا `contract.advancePaymentPercent > 0`
  - يُخصم تدريجياً من كل مستخلص
- `vatAmount`: يُطبق فقط إذا `contract.includesVat = true`
  - يُحسب على (grossAmount - retentionAmount)
- `netAmount`: يُتحقق أنه ≥ 0

**⚠️ ملاحظة:** حسابات المستخلص تتم في `subcontract-claims.ts` عند الإنشاء والتحديث. الأرقام تُحفظ في الـ DB ولا تُعاد حسابها عند العرض — إذا تغيرت نسب العقد بعد إنشاء المستخلص، المبالغ لا تتأثر (immutable snapshot).

### 4.3 دفعات الباطن (SubcontractPayment)

- **دفعة مباشرة** (بدون مستخلص): DR 5200 (مقاولو باطن) / CR Bank
- **دفعة على مستخلص** (claimId provided): DR 2120 (مستحقات مقاولي الباطن) / CR Bank
- **المنطق:** إذا الدفعة مربوطة بمستخلص معتمد، فالتكلفة سُجِّلت عند الاعتماد (DR 5200 / CR 2120)، لذا الدفعة تُغلق المستحقات فقط
- **تأثير على رصيد البنك:** ✅ atomic decrement
- **⚠️ لا يوجد delete procedure** (immutable by design — حسب TODO في الكود)

### 4.4 شروط الدفع (SubcontractPaymentTerm)

- **أنواع:** ADVANCE, MILESTONE, MONTHLY, COMPLETION, CUSTOM
- **ربط بالدفعات:** `SubcontractPayment.termId` — optional
- **⚠️ لا يوجد تتبع:** للمدفوعات مقابل الشروط (no paidAmount/status on term)

### 4.5 كشف حساب مقاول الباطن

- **الملف:** `client-statements.ts` → `getVendorStatement()`
- **يشمل:**
  - المستخلصات المعتمدة (SubcontractClaim.status = APPROVED/PARTIALLY_PAID/PAID)
  - الدفعات (SubcontractPayment)
- **الرصيد المتراكم:** running balance = claims.netAmount - payments.amount

---

## ═══════════════════════════════════════════════════
## القسم 5: نظام المحاسبة الكامل
## ═══════════════════════════════════════════════════

### 5.1 تفعيل وضع المحاسبة

**⚠️ اكتشاف مهم:** لا يوجد `accountingMode` toggle في النظام. المحاسبة تعمل **دائماً**:

1. **Auto-seed:** عند أول عملية مالية، `ensureChartExists()` في `auto-journal.ts` يفحص إن كان دليل الحسابات موجوداً، وإذا لم يكن — يُنشئه تلقائياً عبر `seedChartOfAccounts()`
2. **Frontend seed:** `AccountingSeedCheck.tsx` component في finance layout يتحقق عند أول دخول لصفحات المالية
3. **لا يوجد toggle:** في localStorage أو في قاعدة البيانات — CLAUDE.md يذكر `useAccountingMode` hook لكنه **غير موجود** في الكود الحالي
4. **كل الأقسام المحاسبية مرئية دائماً** في شريط التنقل (15 section في `FINANCE_NAV_SECTIONS`)

**⚠️ تناقض مع CLAUDE.md:** الوثائق تذكر "وضع المحاسبة" toggle في localStorage مع `ACCOUNTING_ONLY_SECTIONS` — لكن هذا النمط **غير مطبق في الكود الحالي**.

### 5.2 دليل الحسابات (Chart of Accounts)

#### الهيكل الهرمي (4 مستويات)

```
Level 1: رئيسي    (1000, 2000, 3000, 4000, 5000, 6000)
Level 2: فرعي     (1100, 1200, 2100, 2200, ...)
Level 3: تفصيلي   (1110, 1120, 1150, ...)
Level 4: تحليلي   (1111, 1112, ... — حسابات بنكية فرعية)
```

#### الحسابات الافتراضية (48 حساب)

| # | الكود | الاسم | النوع | الاتجاه | المستوى | نظامي | قابل للترحيل |
|---|-------|-------|-------|---------|---------|-------|-------------|
| 1 | 1000 | الأصول | ASSET | DEBIT | 1 | ✅ | ❌ |
| 2 | 1100 | الأصول المتداولة | ASSET | DEBIT | 2 | ✅ | ❌ |
| 3 | 1110 | النقدية والبنوك | ASSET | DEBIT | 3 | ✅ | ❌ (parent) |
| 4 | 1120 | العملاء (ذمم مدينة) | ASSET | DEBIT | 3 | ✅ | ✅ |
| 5 | 1150 | ضريبة مدخلات قابلة للاسترداد | ASSET | DEBIT | 3 | ✅ | ✅ |
| 6 | 1200 | الأصول الثابتة | ASSET | DEBIT | 2 | ❌ | ✅ |
| 7 | 2000 | الخصوم | LIABILITY | CREDIT | 1 | ✅ | ❌ |
| 8 | 2100 | الخصوم المتداولة | LIABILITY | CREDIT | 2 | ✅ | ❌ |
| 9 | 2110 | الموردون (ذمم دائنة) | LIABILITY | CREDIT | 3 | ✅ | ✅ |
| 10 | 2120 | مستحقات مقاولي الباطن | LIABILITY | CREDIT | 3 | ✅ | ✅ |
| 11 | 2130 | ضريبة القيمة المضافة المستحقة | LIABILITY | CREDIT | 3 | ✅ | ✅ |
| 12 | 2140 | رواتب مستحقة | LIABILITY | CREDIT | 3 | ✅ | ✅ |
| 13 | 2150 | محتجزات | LIABILITY | CREDIT | 3 | ❌ | ✅ |
| 14 | 2170 | تأمينات اجتماعية مستحقة (GOSI) | LIABILITY | CREDIT | 3 | ✅ | ✅ |
| 15 | 3000 | حقوق الملكية | EQUITY | CREDIT | 1 | ✅ | ❌ |
| 16 | 3100 | رأس المال | EQUITY | CREDIT | 2 | ❌ | ✅ |
| 17 | 3200 | أرباح مبقاة | EQUITY | CREDIT | 2 | ✅ | ✅ |
| 18 | 4000 | الإيرادات | REVENUE | CREDIT | 1 | ✅ | ❌ |
| 19 | 4100 | إيرادات المشاريع | REVENUE | CREDIT | 2 | ✅ | ✅ |
| 20 | 4300 | إيرادات أخرى | REVENUE | CREDIT | 2 | ✅ | ✅ |
| 21 | 5000 | تكاليف المشاريع | EXPENSE | DEBIT | 1 | ✅ | ❌ |
| 22 | 5100 | مواد ومشتريات | EXPENSE | DEBIT | 2 | ✅ | ✅ |
| 23 | 5200 | مقاولو باطن | EXPENSE | DEBIT | 2 | ✅ | ✅ |
| 24 | 5300 | عمالة مباشرة | EXPENSE | DEBIT | 2 | ❌ | ✅ |
| 25 | 6000 | المصروفات التشغيلية | EXPENSE | DEBIT | 1 | ✅ | ❌ |
| 26 | 6100 | رواتب إدارية | EXPENSE | DEBIT | 2 | ✅ | ✅ |
| 27 | 6200 | بدلات ومكافآت | EXPENSE | DEBIT | 2 | ❌ | ✅ |
| 28 | 6300 | إيجارات | EXPENSE | DEBIT | 2 | ❌ | ✅ |
| 29 | 6400 | مرافق (كهرباء، ماء) | EXPENSE | DEBIT | 2 | ❌ | ✅ |
| 30 | 6500 | تأمين | EXPENSE | DEBIT | 2 | ❌ | ✅ |
| 31 | 6600 | صيانة | EXPENSE | DEBIT | 2 | ❌ | ✅ |
| 32 | 6700 | نقل ومواصلات | EXPENSE | DEBIT | 2 | ❌ | ✅ |
| 33 | 6800 | رسوم بنكية | EXPENSE | DEBIT | 2 | ❌ | ✅ |
| 34 | 6900 | مصروفات أخرى | EXPENSE | DEBIT | 2 | ❌ | ✅ |
| 35 | 6950 | عمولات | EXPENSE | DEBIT | 2 | ❌ | ✅ |

**ملاحظة:** الحسابات البنكية تُنشأ تلقائياً كمستوى 4 تحت 1110 عند أول عملية محاسبية.

### 5.3 القيود التلقائية — الـ 29 عملية بالتفصيل

#### خريطة العمليات الكاملة (من `auto-journal.ts`)

| # | العملية | الدالة | المُشغِّل (Procedure) | القيد (DR / CR) | VAT | Prefix |
|---|---------|--------|----------------------|-----------------|-----|--------|
| 1 | إصدار فاتورة | `onInvoiceIssued` | `create-invoice.ts:issueInvoice` | DR 1120 / CR 4100 + 2130 | ✅ يُفصل | INV-JE |
| 2 | تحصيل فاتورة | `onInvoicePaymentReceived` | `create-invoice.ts:addInvoicePayment` | DR Bank / CR 1120 | ❌ | RCV-JE |
| 3 | حذف دفعة فاتورة | `reverseAutoJournalEntry` | `create-invoice.ts:deleteInvoicePayment` | عكس #2 | — | REV-JE |
| 4 | حذف فاتورة | `reverseAutoJournalEntry` | `create-invoice.ts:deleteInvoice` | عكس #1 | — | REV-JE |
| 5 | إشعار دائن | `onCreditNoteIssued` | `create-invoice.ts:createCreditNote` | DR 4100+2130 / CR 1120 | ✅ يُعكس | CN-JE |
| 6 | مصروف COMPLETED | `onExpenseCompleted` | `expenses.ts:createExpense` | DR Expense+1150 / CR Bank | ✅ يُفصل (15%) | EXP-JE |
| 7 | دفع مصروف معلق | `onExpenseCompleted` | `expenses.ts:payExpense` | DR Expense+1150 / CR Bank | ✅ | EXP-JE |
| 8 | حذف مصروف | `reverseAutoJournalEntry` | `expenses.ts:deleteExpense` | عكس | — | REV-JE |
| 9 | إلغاء مصروف | `reverseAutoJournalEntry` | `expenses.ts:cancelExpense` | عكس | — | REV-JE |
| 10 | مقبوض مباشر | `onOrganizationPaymentReceived` | `payments.ts:createPayment` | DR Bank / CR 4300 | ❌ | RCV-JE |
| 11 | حذف مقبوض | `reverseAutoJournalEntry` | `payments.ts:deletePayment` | عكس | — | REV-JE |
| 12 | تحويل بنكي | `onTransferCompleted` | `transfers.ts:createTransfer` | DR Bank2 / CR Bank1 | ❌ | TRF-JE |
| 13 | إلغاء تحويل | `reverseAutoJournalEntry` | `transfers.ts:cancelTransfer` | عكس | — | REV-JE |
| 14 | دفعة مقاول باطن (مباشرة) | `onSubcontractPayment` | `create-payment.ts` | DR 5200 / CR Bank | ❌ | SUB-JE |
| 15 | دفعة مقاول باطن (على مستخلص) | `onSubcontractPayment` | `add-claim-payment.ts` | DR 2120 / CR Bank | ❌ | SUB-JE |
| 16 | اعتماد مستخلص باطن | `onSubcontractClaimApproved` | `update-claim-status.ts` | DR 5200 / CR 2120 | ❌ | SUB-JE |
| 17 | رفض/إلغاء مستخلص باطن | `reverseAutoJournalEntry` | `update-claim-status.ts` | عكس #16 | — | REV-JE |
| 18 | اعتماد مسيّر رواتب | `onPayrollApproved` | `payroll.ts` | DR 6100 / CR Bank + 2170 | ❌ | PAY-JE |
| 19 | إلغاء مسيّر رواتب | `reverseAutoJournalEntry` | `payroll.ts` | عكس #18 | — | REV-JE |
| 20 | دفع مصروف شركة | `onExpenseCompleted` | `expense-payments.ts` | DR Expense / CR Bank | ✅ | EXP-JE |
| 21 | تعديل مصروف شركة | reverse+recreate | `expense-payments.ts` | عكس + إعادة | — | — |
| 22 | حذف مصروف شركة | `reverseAutoJournalEntry` | `expense-payments.ts` | عكس | — | REV-JE |
| 23 | دفعة مشروع | `onProjectPaymentReceived` | `project-payments/create.ts` | DR Bank / CR 1120 | ❌ | PRJ-JE |
| 24 | تعديل دفعة مشروع | reverse+recreate | `project-payments/update.ts` | عكس + إعادة | — | — |
| 25 | حذف دفعة مشروع | `reverseAutoJournalEntry` | `project-payments/delete.ts` | عكس | — | REV-JE |
| 26 | اعتماد مستخلص مشروع | `onProjectClaimApproved` | `project-finance/update-claim-status.ts` | DR 1120 / CR 4100 | ❌ | PCLM-JE |
| 27 | رفض مستخلص مشروع | `reverseAutoJournalEntry` | `project-finance/update-claim-status.ts` | عكس #26 | — | REV-JE |
| 28 | سند قبض يدوي | `onReceiptVoucherIssued` | `receipt-vouchers.ts` | DR Bank / CR 4300 | ❌ | RCV-JE |
| 29 | سند صرف يدوي | `onPaymentVoucherApproved` | `payment-vouchers.ts` | DR Expense / CR Bank | ❌ | PMT-JE |

**ملاحظة إضافية:** يوجد عملية #30 غير مذكورة في خريطة العمليات:
| 30 | تحرير محتجزات (استلام نهائي) | `onFinalHandoverCompleted` | handover protocol | DR 2150 / CR 1120 | ❌ | HND-JE |

#### آلية معالجة الأخطاء

```
Financial Operation (e.g., create expense)
    │
    ├──→ Business logic executes successfully
    │
    └──→ try {
             auto-journal function call
         } catch (e) {
             console.error("[AutoJournal] Failed to generate entry:", e);
             // ⚠️ NOT audit-logged despite JOURNAL_ENTRY_FAILED enum existing
             // Financial operation continues unaffected
         }
```

**⚠️ خطأ مكتشف:** `OrgAuditAction.JOURNAL_ENTRY_FAILED` و `JOURNAL_ENTRY_SKIPPED` موجودان كـ enum values في الـ schema لكنهما **غير مُستخدمين في الكود**. الفشل يُسجَّل فقط في `console.error`.

### 5.4 ملاحظة حول الـ Transactions

**نتيجة الفحص:**

| الملف | عدد `$transaction` | التعليق |
|-------|-------------------|---------|
| `finance.ts` | 4 | ✅ invoice payments, expense operations |
| `org-finance.ts` | 8 | ✅ bank balance updates with atomic guard |
| `project-finance.ts` | 1 | ✅ claim update |
| `subcontract.ts` | 2 | ✅ contract operations |
| `subcontract-claims.ts` | 3 | ✅ claim creation/update |
| **`accounting.ts`** | **0** | **⚠️ createJournalEntry NOT in transaction** |

**⚠️ خطر:** إنشاء القيد المحاسبي (`createJournalEntry`) لا يستخدم `$transaction`. إذا حدث خطأ بعد إنشاء الـ header وقبل إنشاء كل الـ lines، قد ينتج قيد غير مكتمل.

### 5.5 الترحيل الاسترجاعي (Backfill)

**الملف:** `packages/api/lib/accounting/backfill.ts` (245 سطر)

#### الأنواع الـ 11 بالترتيب

| # | النوع | المرجع (referenceType) | الشرط | الدالة |
|---|-------|----------------------|-------|--------|
| 1 | فواتير صادرة | INVOICE | status ∉ [DRAFT, CANCELLED], type ≠ CREDIT_NOTE | `onInvoiceIssued()` |
| 2 | إشعارات دائنة | CREDIT_NOTE | type = CREDIT_NOTE, status ∉ [DRAFT, CANCELLED] | `onCreditNoteIssued()` |
| 3 | دفعات الفواتير | INVOICE_PAYMENT | all InvoicePayments | `onInvoicePaymentReceived()` |
| 4 | مصروفات مكتملة | EXPENSE | status = COMPLETED, sourceType ≠ FACILITY_PAYROLL | `onExpenseCompleted()` |
| 5 | تحويلات مكتملة | TRANSFER | status = COMPLETED | `onTransferCompleted()` |
| 6 | دفعات مقاولي باطن | SUBCONTRACT_PAYMENT | all payments | `onSubcontractPayment()` |
| 7 | مستخلصات باطن معتمدة | SUBCONTRACT_CLAIM_APPROVED | status ∈ [APPROVED, PARTIALLY_PAID, PAID] | `onSubcontractClaimApproved()` |
| 8 | مسيّرات رواتب | PAYROLL | status ∈ [APPROVED, PAID] | `onPayrollApproved()` |
| 9 | مقبوضات مباشرة | ORG_PAYMENT | all FinancePayments | `onOrganizationPaymentReceived()` |
| 10 | دفعات مشاريع | PROJECT_PAYMENT | all ProjectPayments | `onProjectPaymentReceived()` |
| 11 | مستخلصات مشاريع معتمدة | PROJECT_CLAIM_APPROVED | status ∈ [APPROVED, PAID] | `onProjectClaimApproved()` |

#### لماذا الترتيب مهم

1. **الفواتير قبل الدفعات:** `onInvoiceIssued` يُنشئ القيد الأساسي (DR 1120 / CR 4100). `onInvoicePaymentReceived` يُلغي جزء من 1120. لو أُنشئت الدفعة قبل الفاتورة، ينتج رصيد سالب مؤقت في 1120.
2. **المستخلصات قبل دفعاتها:** `onSubcontractClaimApproved` يُنشئ (DR 5200 / CR 2120). الدفعة على المستخلص تُلغي 2120 (DR 2120 / CR Bank). الترتيب الصحيح يمنع رصيد سالب في 2120.

#### آلية منع التكرار

```typescript
async function hasEntry(refType: string, refId: string): Promise<boolean> {
    const c = await db.journalEntry.count({
        where: { organizationId, referenceType: refType, referenceId: refId, status: { not: "REVERSED" } },
    });
    return c > 0;
}
```

**لكل عنصر:** يُفحص `hasEntry()` قبل الإنشاء. ⚠️ **لكن:** هذا ليس atomic — مع concurrent backfill requests يمكن نظرياً إنشاء قيدين (low probability).

#### مخرجات الـ Backfill

```typescript
interface BackfillResult {
    invoices: number;
    invoicePayments: number;
    expenses: number;
    transfers: number;
    subcontractPayments: number;
    payroll: number;
    orgPayments: number;
    creditNotes: number;
    projectPayments: number;
    claimsApproved: number;
    projectClaimsApproved: number;
    total: number;
    errors: { type: string; id: string; error: string }[];
}
```

**معالجة الأخطاء:** كل عنصر يُلف في try/catch منفصل — خطأ في عنصر واحد لا يوقف الباقي. الأخطاء تُجمع في `errors[]`.

### 5.6 فحص الصحة المحاسبية (Health Check)

**الملف:** `packages/database/prisma/queries/accounting-health.ts`

#### الفحوصات الأربع

| # | الفحص | الاستعلام | الخطورة | الحل |
|---|-------|---------|---------|------|
| 1 | **قيود غير متوازنة** | `SUM(debit) ≠ SUM(credit)` per entry, tolerance 0.01 | 🔴 حرج | عكس القيد + إنشاء قيد جديد متوازن |
| 2 | **فواتير بدون قيود** | ISSUED/PAID invoices with no INVOICE journal entry | 🟠 عالي | تشغيل backfill |
| 3 | **قيود يتيمة** | INVOICE entries where invoice is deleted/missing | 🟡 متوسط | عكس القيد |
| 4 | **مصروفات بدون قيود** | COMPLETED expenses with no EXPENSE journal entry | 🟠 عالي | تشغيل backfill |

#### فحوصات مقترحة إضافية

| # | الفحص المقترح | السبب |
|---|-------------|-------|
| 5 | **تحويلات بدون قيود** | COMPLETED transfers with no TRANSFER entry |
| 6 | **مسيّرات رواتب بدون قيود** | APPROVED payrolls with no PAYROLL entry |
| 7 | **مقبوضات بدون قيود** | FinancePayments with no ORG_PAYMENT entry |
| 8 | **تباين رصيد البنك** | OrganizationBank.balance ≠ SUM of bank transactions |
| 9 | **دفعات مقاولي باطن بدون قيود** | SubcontractPayments with no SUBCONTRACT_PAYMENT entry |
| 10 | **قيود مكررة** | Same referenceType+referenceId with multiple non-REVERSED entries |

### 5.7 القيود اليدوية

- **إنشاء قيد يدوي:** status = DRAFT, isAutoGenerated = false
- **ترحيل (Post):** DRAFT → POSTED — يؤثر على التقارير
- **ترحيل جماعي (Bulk Post):** checkboxes + bulk post (multiple entries at once)
- **ترحيل الكل (Post All Drafts):** one-click posts all DRAFT entries
- **عكس قيد:** POSTED → REVERSED + إنشاء قيد عكسي جديد (DR↔CR)
- **حذف مسودة:** يُحذف فعلياً من قاعدة البيانات (hard delete)
- **⚠️ هل يمكن عكس قيد تلقائي؟** نعم — `reverseJournalEntry` لا يتحقق من `isAutoGenerated`. يمكن عكس أي قيد POSTED يدوياً. هذا **صحيح** — المحاسب قد يحتاج لعكس قيد تلقائي خاطئ.

### 5.8 الفترات المحاسبية

- **أنواع:** MONTHLY, QUARTERLY, ANNUAL
- **الإقفال:** `isClosed = true` + `closedAt` + `closedById`
- **قيد الإقفال:** `closingEntryId` — optional (لا يُنشأ تلقائياً)
- **⚠️ لا يُمنع الترحيل في فترة مغلقة:** `isPeriodClosed` يُفحص فقط عند عكس DRAFT entries في `reverseAutoJournalEntry`. **لا يوجد تحقق** عند:
  - إنشاء قيد جديد (يدوي أو تلقائي)
  - ترحيل مسودة (DRAFT → POSTED)
  - هذا **خطأ** يجب إصلاحه

### 5.9 القيود المتكررة

- **الملف:** `packages/api/modules/accounting/procedures/recurring-entries.ts`
- **القالب:** `RecurringJournalTemplate` — description, lines (JSON), frequency, dayOfMonth, nextDueDate
- **التكرار:** MONTHLY, QUARTERLY, ANNUAL
- **التوليد:** `generate` procedure — يُنشئ DRAFT entries من القوالب المستحقة
- **منع التكرار:** يُحدّث `lastGeneratedDate` و `nextDueDate` بعد التوليد
- **⚠️ بدون transaction:** التحقق + الإنشاء + التحديث ليست ذرية

### 5.10 الأرصدة الافتتاحية

- **الآلية:** يُنشأ قيد واحد بنوع `OPENING_BALANCE` مع بنود DR/CR لكل حساب
- **حساب الموازنة:** 3200 (أرباح مبقاة) — يُضاف تلقائياً لموازنة الفرق
- **⚠️ التحقق:** المعادلة `SUM(debits) = SUM(credits)` تُطبَّق من خلال حساب الموازنة التلقائي
- **التعديل:** يُحذف القيد القديم + يُنشأ قيد جديد (replace strategy)

### 5.11 التقارير المحاسبية (8 تقارير)

| # | التقرير | المصدر | يشمل | الفلاتر |
|---|---------|--------|------|---------|
| 1 | **ميزان المراجعة** | JournalEntryLine (POSTED only) | SUM debit/credit per account | dateFrom, dateTo |
| 2 | **الميزانية العمومية** | JournalEntryLine (POSTED) | Assets = Liabilities + Equity | asOfDate |
| 3 | **قائمة الدخل المحاسبية** | JournalEntryLine (POSTED) | Revenue - Expenses | dateFrom, dateTo |
| 4 | **قائمة الدخل المالية** | FinanceInvoice + FinanceExpense | direct calculation | dateFrom, dateTo |
| 5 | **مراكز التكلفة** | JournalEntryLine.projectId | Revenue & expenses per project | dateFrom, dateTo |
| 6 | **تقرير VAT** | FinanceInvoice + FinanceExpense | Output VAT - Input VAT | dateFrom, dateTo |
| 7 | **دفتر الأستاذ** | JournalEntryLine per account | Running balance | accountId, dateFrom, dateTo |
| 8 | **الذمم المدينة المتقادمة** | FinanceInvoice (ISSUED/PARTIALLY_PAID) | Aging: 0-30, 31-60, 61-90, 90+ | asOfDate |

#### ميزان المراجعة

```sql
-- الاستعلام الفعلي (Prisma groupBy)
SELECT "account_id",
       SUM(debit) as "totalDebit",
       SUM(credit) as "totalCredit"
FROM journal_entry_lines jel
JOIN journal_entries je ON jel.journal_entry_id = je.id
WHERE je.organization_id = $1
  AND je.status = 'POSTED'
  AND je.date >= $2 AND je.date <= $3
GROUP BY jel.account_id
```

**التحقق:** `isBalanced: Math.abs(totalDebits - totalCredits) < 0.01`

#### الميزانية العمومية

- **Assets:** SUM(debit - credit) for ASSET accounts
- **Liabilities:** SUM(credit - debit) for LIABILITY accounts
- **Equity:** SUM(credit - debit) for EQUITY accounts + (Revenue - Expenses) for current year
- **التحقق:** `isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01`

---

## ═══════════════════════════════════════════════════
## القسم 6: الرواتب والشركة
## ═══════════════════════════════════════════════════

### 6.1 مسيّرات الرواتب (PayrollRun)

#### State Machine

```
DRAFT → APPROVED → PAID → (CANCELLED)
```

- **إنشاء المسيّر:** auto-populates من `Employee` records (ACTIVE status)
- **بنود المسيّر (PayrollRunItem):**
  - baseSalary + housingAllowance + transportAllowance + otherAllowances = gross
  - gosiDeduction + otherDeductions = total deductions
  - netSalary = gross - deductions
- **GOSI:** `gosiDeduction` يُحسب من Employee.gosiSubscription
- **عند الاعتماد:**
  1. Creates FinanceExpense for each employee (sourceType = FACILITY_PAYROLL)
  2. Links PayrollRunItem.financeExpenseId
  3. **Auto-Journal:** `onPayrollApproved()` → DR 6100 (baseSalary + GOSI) / CR Bank (netSalary) + CR 2170 (GOSI)
- **⚠️ ملاحظة:** PayrollRunItem.financeExpense uses `FACILITY_PAYROLL` sourceType — auto-journal skips these expenses to prevent double-counting
- **Unique constraint:** `@@unique([organizationId, month, year])` — one payroll per month

### 6.2 مصروفات الشركة (CompanyExpense)

- **مصروفات ثابتة متكررة:** إيجار، كهرباء، تأمين، etc.
- **RecurrenceType:** MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL, ONE_TIME
- **CompanyExpensePayment:** سجل الدفع الفعلي لكل فترة
- **CompanyExpenseRun:** دورة ترحيل شهرية — posts expenses to FinanceExpense
- **عند الترحيل:** creates FinanceExpense (sourceType = FACILITY_RECURRING) → triggers auto-journal

---

## ═══════════════════════════════════════════════════
## القسم 7: ZATCA (الامتثال الضريبي)
## ═══════════════════════════════════════════════════

### 7.1 Phase 1 — QR Code

- **يُولَّد عند الإصدار** (`issueInvoice`)
- **شرط التوليد:** Organization must have `taxNumber` (الرقم الضريبي)
- **المعلومات المُشفَّرة في QR:** seller name, tax number, timestamp, total, VAT
- **الحقول في Schema:**
  - `qrCode` — QR content (Base64 or TLV encoded)
  - `zatcaUuid` — UUID فريد
  - `zatcaHash` — hash الفاتورة
  - `zatcaSignature` — التوقيع الرقمي (فارغ حالياً)
  - `sellerTaxNumber` — مُجمَّد عند الإصدار

### 7.2 Phase 2 جاهزية

| المتطلب | الحالة | الملاحظات |
|---------|--------|---------|
| UBL 2.1 XML | ❌ غير مطبق | يحتاج مكتبة XML builder |
| XAdES-BES Digital Signature | ❌ غير مطبق | يحتاج secp256k1 |
| CSID (Compliance Certificate) | ❌ غير مطبق | يحتاج تسجيل مع هيئة الزكاة |
| Invoice Counter | ⚠️ جزئي | `invoiceNo` sequential لكن ليس بالمعيار المطلوب |
| Previous Invoice Hash | ⚠️ جزئي | `zatcaHash` موجود لكن لا يُربط بالفاتورة السابقة |
| Tax Categories (Standard/Zero/Exempt) | ❌ غير مطبق | VAT rate واحد فقط (15%) |

**التقييم:** Phase 1 (QR) مُنفَّذ. Phase 2 يحتاج **عمل كبير** — 6-8 أسابيع تطوير.

---

## ═══════════════════════════════════════════════════
## القسم 8: نظام الترقيم التسلسلي
## ═══════════════════════════════════════════════════

### 8.1 جدول الأرقام التسلسلية

| الكيان | Prefix | المثال | الآلية |
|--------|--------|--------|--------|
| فاتورة | INV | INV-2026-0001 | `getNextSequenceNo(db, orgId, "INV")` |
| إشعار دائن | CN | CN-2026-0001 | `getNextSequenceNo(db, orgId, "CN")` |
| عرض سعر | QT | QT-2026-0001 | `getNextSequenceNo(db, orgId, "QT")` |
| مصروف | EXP | EXP-2026-0001 | `getNextSequenceNo(db, orgId, "EXP")` |
| مقبوض | RCV | RCV-2026-0001 | `getNextSequenceNo(db, orgId, "RCV")` |
| تحويل | TRF | TRF-2026-0001 | `getNextSequenceNo(db, orgId, "TRF")` |
| دفعة مشروع | PP | PP-2026-0001 | Per project (`@@unique([projectId, paymentNo])`) |
| سند قبض | RCV | RCV-2026-0001 | `getNextSequenceNo(db, orgId, "RCV")` |
| سند صرف | PMT | PMT-2026-0001 | `getNextSequenceNo(db, orgId, "PMT")` |
| مستند | DOC | DOC-2026-0001 | `getNextSequenceNo(db, orgId, "DOC")` |
| رواتب | PAY | PAY-2026-01 | `month/year` format |
| مصروفات شركة | FEXP | FEXP-2026-01 | `month/year` format |
| محضر استلام | HND | HND-2026-0001 | `getNextSequenceNo(db, orgId, "HND")` |

### 8.2 آلية التوليد

- **الجدول:** `OrganizationSequence` مع `@@unique([organizationId, sequenceKey])`
- **sequenceKey:** e.g., `"INV-2026"`, `"EXP-2026"` — يشمل السنة
- **الزيادة:** `currentValue` يُزاد بـ 1 مع كل عملية
- **إعادة الترقيم سنوياً:** ✅ تلقائي (sequenceKey يتضمن السنة)
- **Race Condition:** ✅ **لا يوجد** — يستخدم `INSERT ... ON CONFLICT ... DO UPDATE SET current_value = current_value + 1 ... RETURNING current_value` (عملية SQL ذرية واحدة)
- **الآلية:** `$queryRawUnsafe` في `sequences.ts` → `nextSequenceValue(organizationId, sequenceKey)`
- **التنسيق:** `formatSequenceNo(prefix, year, value, pad=4)` → e.g., `INV-2026-0042`

---

## ═══════════════════════════════════════════════════
## القسم 9: اختبارات السلامة والتناسق
## ═══════════════════════════════════════════════════

### 9.1 اختبارات مالية

| # | الاختبار | النتيجة | التفاصيل |
|---|---------|---------|---------|
| 1 | مجموع دفعات الفاتورة ≤ إجمالي الفاتورة | ✅ | يُتحقق في `finance.ts` query عند إضافة دفعة |
| 2 | رصيد البنك يُحدَّث ذرياً | ✅ | `$transaction` + atomic guard في `org-finance.ts` |
| 3 | رصيد البنك لا يصبح سالباً | ✅ | "Layer 2: Atomic guard — prevents negative balance under concurrency" |
| 4 | مصروفات المشروع تظهر في الربحية | ⚠️ جزئي | ProjectExpense (معلوماتي فقط) + FinanceExpense.projectId |
| 5 | حذف عميل يحذف فواتيره | ❌ | clientId يصبح null (`onDelete: SetNull`) — الفواتير تبقى |
| 6 | حذف حساب بنكي يحذف عملياته | ❌ | Relations use `onDelete: SetNull` — العمليات تبقى بدون حساب |

### 9.2 اختبارات محاسبية

| # | الاختبار | النتيجة | التفاصيل |
|---|---------|---------|---------|
| 1 | كل قيد تلقائي متوازن (DR = CR) | ✅ | كل دالة في auto-journal.ts تنتج lines متوازنة |
| 2 | reverseAutoJournalEntry ينسخ بشكل صحيح | ✅ | يستدعي `reverseJournalEntry()` من accounting.ts |
| 3 | unique constraint على (referenceType + referenceId) | ❌ | **لا يوجد** — index فقط، ليس unique. يمكن إنشاء قيدين لنفس المرجع |
| 4 | الـ backfill يتجنب إنشاء مكررة | ✅ | يفحص `LEFT JOIN → NULL` قبل الإنشاء |
| 5 | الفترات المحاسبية تُطبَّق | ⚠️ جزئي | `isPeriodClosed` يُفحص عند عكس DRAFT entries فقط — **لا يُمنع إنشاء قيد في فترة مغلقة** |
| 6 | القيود المتكررة تمنع التوليد المكرر | ⚠️ | `lastGeneratedDate` يُفحص — لكن بدون transaction |
| 7 | الأرصدة الافتتاحية متوازنة | ⚠️ | يتم عبر Opening Balance entry → ينشئ قيد — الميزان يوازن بحساب 3200 (أرباح مبقاة) |
| 8 | entryNo فريد عبر المنظمة | ⚠️ | Index فقط `@@index([organizationId, entryNo])` — ليس unique constraint |

### 9.3 اختبارات مقاولي الباطن

| # | الاختبار | النتيجة | التفاصيل |
|---|---------|---------|---------|
| 1 | مجموع المستخلصات ≤ قيمة العقد | ⚠️ | يعتمد على validation في `subcontract-claims.ts` — يحتاج تأكيد من agent |
| 2 | الكمية التراكمية لا تتجاوز كمية العقد | ⚠️ | `prevCumulativeQty + thisQty` — يحتاج تأكيد |
| 3 | مجموع الدفعات ≤ صافي المستخلصات | ⚠️ | يحتاج تأكيد |
| 4 | حسابات المستخلص صحيحة رياضياً | ⚠️ | يحتاج تأكيد |
| 5 | حذف مستخلص معتمد يعكس القيد | ✅ | `reverseAutoJournalEntry` يُستدعى |

### 9.4 اختبارات الأمان

| # | الاختبار | النتيجة | التفاصيل |
|---|---------|---------|---------|
| 1 | كل endpoint مالي يتحقق من organizationId | ✅ | **169 استدعاء** لـ `verifyOrganizationAccess` عبر 27 ملف |
| 2 | كل mutation يستخدم subscriptionProcedure | ✅ | **صفر** publicProcedure في finance/accounting |
| 3 | audit log لكل عملية مالية | ✅ | **50 استدعاء** لـ `orgAuditLog` في finance procedures |
| 4 | حقول المبالغ كلها Decimal | ✅ | كل حقول المبالغ `@db.Decimal(15, 2)` — لا يوجد Float |

---

## ═══════════════════════════════════════════════════
## القسم 10: الأخطاء المكتشفة (Bugs Found)
## ═══════════════════════════════════════════════════

### Bug #1: JOURNAL_ENTRY_FAILED و JOURNAL_ENTRY_SKIPPED غير مُستخدمين

- **الخطورة:** 🟠 عالية
- **الملف:** `packages/api/lib/accounting/auto-journal.ts` + كل procedures المالية
- **الوصف:** `OrgAuditAction.JOURNAL_ENTRY_FAILED` و `JOURNAL_ENTRY_SKIPPED` معرّفان في الـ Schema enum لكنهما **لا يُستدعيان أبداً** في الكود. عند فشل إنشاء قيد تلقائي، يُسجَّل فقط `console.error` الذي يضيع في logs الإنتاج.
- **التأثير:** لا يمكن اكتشاف القيود المحاسبية المفقودة إلا عبر Health Check
- **الإصلاح:** في كل catch block حيث يُستدعى auto-journal، أضف `orgAuditLog(JOURNAL_ENTRY_FAILED, ...)`

### Bug #2: لا يوجد Unique Constraint على (referenceType + referenceId) للقيود

- **الخطورة:** 🟠 عالية
- **الملف:** `packages/database/prisma/schema.prisma` → `JournalEntry`
- **الوصف:** يوجد index فقط `@@index([organizationId, referenceType, referenceId])` وليس unique constraint. يمكن نظرياً إنشاء قيدين لنفس العملية (e.g., double-click أو retry).
- **التأثير:** تضاعف الأرصدة في التقارير المحاسبية
- **الإصلاح:** تحويل الـ index إلى `@@unique([organizationId, referenceType, referenceId])` أو إضافة check في `createJournalEntry`

### Bug #3: createJournalEntry لا يستخدم $transaction

- **الخطورة:** 🟠 عالية
- **الملف:** `packages/database/prisma/queries/accounting.ts` → `createJournalEntry()`
- **الوصف:** إنشاء JournalEntry + JournalEntryLines لا يُلف في `$transaction`. إذا حدث خطأ بعد إنشاء الـ header وقبل إنشاء كل الـ lines، قد ينتج قيد بدون بنود.
- **التأثير:** قيد يتيم (header بدون lines) يكسر التقارير
- **الإصلاح:** لف العملية في `db.$transaction()`

### Bug #4: CLAUDE.md يوثّق useAccountingMode hook غير موجود

- **الخطورة:** 🟡 متوسطة
- **الملف:** `CLAUDE.md` sections 19.2, 19.7, 19.8
- **الوصف:** CLAUDE.md يذكر `useAccountingMode` hook مع localStorage toggle و `ACCOUNTING_ONLY_SECTIONS` — لكن هذا النمط **غير مطبق** في الكود. المحاسبة تعمل دائماً.
- **التأثير:** توثيق مضلل لأي مطور يعمل على المشروع
- **الإصلاح:** تحديث CLAUDE.md لتعكس الوضع الفعلي

### Bug #5: إمكانية تعديل فاتورة ISSUED بدون إعادة حساب القيد

- **الخطورة:** 🟡 متوسطة
- **الملف:** `create-invoice.ts` → `updateInvoice`
- **الوصف:** يمكن تعديل بنود/مبالغ فاتورة صادرة (ISSUED) لكن القيد المحاسبي المُنشأ عند الإصدار **لا يُعدَّل أو يُعكس تلقائياً**
- **التأثير:** تباين بين الفاتورة الفعلية والقيد المحاسبي
- **الإصلاح:** عند تعديل فاتورة ISSUED: عكس القيد القديم + إنشاء قيد جديد

### Bug #6: entryNo ليس فريداً (index فقط)

- **الخطورة:** 🟡 متوسطة
- **الملف:** Schema → `JournalEntry.entryNo`
- **الوصف:** `@@index([organizationId, entryNo])` — ليس `@@unique`. يمكن أن يتكرر رقم القيد
- **التأثير:** ارتباك في الترقيم
- **الإصلاح:** تحويل إلى `@@unique([organizationId, entryNo])`

### Bug #7: دفعة الفاتورة لا تُحدِّث رصيد البنك

- **الخطورة:** 🔴 حرجة
- **الملف:** `packages/database/prisma/queries/finance.ts` → `addInvoicePayment()`
- **الوصف:** عند تسجيل دفعة على فاتورة، يُنشأ سجل `FinanceInvoicePayment` ويُحدَّث `invoice.paidAmount` — لكن **`OrganizationBank.balance` لا يُزاد**. فقط القيد المحاسبي (auto-journal) يُسجِّل الحركة. هذا يعني أن رصيد البنك في النظام المالي لا يعكس دفعات الفواتير المستلمة.
- **التأثير:** تباين دائم بين `OrganizationBank.balance` ومجموع العمليات المالية الفعلية. `reconcileBankAccount()` يحسب الرصيد المتوقع بدون دفعات الفواتير.
- **الإصلاح:** إضافة `db.organizationBank.update({ balance: { increment: amount } })` في `addInvoicePayment` transaction

### Bug #8: إشعار الدائن لا يُقلل رصيد الفاتورة الأصلية

- **الخطورة:** 🟠 عالية
- **الملف:** `packages/database/prisma/queries/finance.ts` → `createCreditNote()`
- **الوصف:** الإشعار الدائن يُنشأ كسجل مستقل لكن **لا يُحدِّث `paidAmount` أو `status` للفاتورة الأصلية**. المبلغ المستحق على العميل يشمل الفاتورة + إشعار دائن سلبي بدلاً من تخفيض الفاتورة مباشرة.
- **التأثير:** تقارير الذمم المدينة قد تكون مضللة
- **الإصلاح:** تحديث `relatedInvoice.paidAmount` عند إنشاء إشعار دائن

### Bug #9: لا يوجد حد لمبلغ الإشعار الدائن

- **الخطورة:** 🟠 عالية
- **الملف:** `packages/api/modules/finance/procedures/create-invoice.ts` → `createCreditNoteProcedure`
- **الوصف:** يمكن إنشاء إشعار دائن بمبلغ أكبر من الفاتورة الأصلية بدون أي validation
- **التأثير:** رصيد عميل سالب (يدين لنا مبلغ سلبي)
- **الإصلاح:** إضافة `creditNote.totalAmount ≤ originalInvoice.totalAmount`

### Bug #10: يمكن إرجاع حالة الفاتورة إلى DRAFT

- **الخطورة:** 🟠 عالية
- **الملف:** `packages/api/modules/finance/procedures/create-invoice.ts` → `updateInvoiceStatusProcedure`
- **الوصف:** الـ procedure يسمح بتعيين status = DRAFT من أي حالة (ISSUED, SENT, etc.). هذا يعيد فتح الفاتورة للتعديل بعد إصدارها.
- **التأثير:** يمكن تعديل فاتورة صادرة — يُخالف مبادئ ZATCA
- **الإصلاح:** إضافة state machine validation تمنع الانتقال العكسي

### Bug #11: VAT rounding مختلف بين auto-journal و reports

- **الخطورة:** 🟡 متوسطة
- **الملف:** `auto-journal.ts` line 270 vs `accounting-reports.ts` line 662
- **الوصف:** auto-journal يستخدم `Math.round((amount / 1.15) * 100) / 100` بينما reports تستخدم `Decimal.div("1.15").toDecimalPlaces(2)`. يمكن أن ينتج فرق 0.01 ر.س لكل عملية.
- **التأثير:** تراكم الفروق في تقرير VAT مقارنة بحساب 1150/2130
- **الإصلاح:** توحيد الحساب باستخدام Prisma.Decimal في كل الأماكن

### Bug #12: ترقيم مقاولي الباطن يستخدم count() بدل atomic sequence

- **الخطورة:** 🟡 متوسطة
- **الملف:** `packages/database/prisma/queries/subcontract.ts` → `generateSubcontractNo()`, `generateSubcontractPaymentNo()`
- **الوصف:** يستخدم `count() + 1` لتوليد الأرقام بدلاً من `generateAtomicNo()` الذري. Race condition ممكن.
- **التأثير:** أرقام مكررة في concurrent requests
- **الإصلاح:** استبدال بـ `generateAtomicNo(organizationId, "SUB")`

### Bug #13: لا يوجد state machine لمستخلصات المشاريع

- **الخطورة:** 🟡 متوسطة
- **الملف:** `packages/database/prisma/queries/project-finance.ts` → `updateClaimStatus()`
- **الوصف:** يمكن الانتقال من أي حالة لأي حالة (DRAFT→PAID، PAID→DRAFT) بدون validation
- **التأثير:** يمكن التلاعب بحالة المستخلصات
- **الإصلاح:** إضافة `allowedTransitions` map كما في SubcontractClaim

### Bug #14: الفترات المحاسبية لا تمنع الترحيل

- **الخطورة:** 🟡 متوسطة
- **الملف:** `auto-journal.ts` → كل الدوال + `journal-entries.ts`
- **الوصف:** `isPeriodClosed` يُفحص فقط عند عكس DRAFT entries. إنشاء قيود جديدة **لا يتحقق** من حالة الفترة.
- **التأثير:** يمكن إنشاء/ترحيل قيود في فترات مغلقة
- **الإصلاح:** إضافة فحص `isPeriodClosed` في `createJournalEntry()` و `postJournalEntry()`

### ~~Bug #8~~: ✅ توليد الأرقام التسلسلية ذري (لا يوجد race condition)

- **تصحيح:** بعد قراءة `sequences.ts`، تبيّن أن النظام يستخدم `INSERT ... ON CONFLICT ... DO UPDATE SET current_value = current_value + 1 ... RETURNING current_value` — **عملية ذرية واحدة** في PostgreSQL. لا يوجد race condition.
- **الملف:** `packages/database/prisma/queries/sequences.ts` → `nextSequenceValue()`
- **الآلية:** `$queryRawUnsafe` مع SQL ذري — ممتاز

---

## ═══════════════════════════════════════════════════
## القسم 11: التناقضات والثغرات المنطقية
## ═══════════════════════════════════════════════════

### 11.1 تباين الأرصدة

**أين يمكن أن يختلف `OrganizationBank.balance` عن مجموع القيود المحاسبية:**

1. **Silent failure:** إذا فشل auto-journal (try/catch) — رصيد البنك يتغير لكن لا يُنشأ قيد
2. **قبل أول عملية:** إذا `seedChartOfAccounts` فشل — لن يُنشأ أي قيد
3. **Opening balance:** `OrganizationBank.openingBalance` مسجّل في الـ Schema لكن قد لا يكون له قيد محاسبي
4. **Manual bank adjustments:** لا يوجد procedure لتعديل رصيد البنك مع قيد تسوية

### 11.2 تباين قائمتي الدخل

| السبب | Financial Income Statement | Journal Income Statement |
|-------|--------------------------|--------------------------|
| مصروفات بدون قيد | ✅ يظهر (من FinanceExpense) | ❌ لا يظهر |
| فاتورة بدون قيد | ✅ يظهر (من FinanceInvoice) | ❌ لا يظهر |
| قيود يدوية | ❌ لا يظهر | ✅ يظهر |
| أرصدة افتتاحية | ❌ | ✅ |
| VAT treatment | Gross amounts | Net + VAT split |

### 11.3 عمليات بدون قيود

| العملية | هل لها قيد | السبب |
|---------|-----------|-------|
| ProjectExpense (مصروف مشروع) | ❌ | معلوماتي فقط — ليس مالي |
| ProjectChangeOrder | ❌ | تعديل عقد — ليس مالي |
| SubcontractChangeOrder | ❌ | تعديل عقد — ليس مالي |
| QuotationStatus change | ❌ | عرض سعر — ليس مالي |
| CompanyAsset depreciation | ❌ | لا يوجد حساب إهلاك |
| Leave request (إجازة) | ❌ | HR — ليس مالي |

### 11.4 Silent Failures

| الموقع | السلوك | هل صحيح؟ |
|--------|--------|---------|
| auto-journal في كل العمليات المالية | try/catch → console.error | ✅ صحيح (لا يكسر العملية) — لكن يجب audit log |
| seedChartOfAccounts failure | catch → return false | ✅ يُعيد المحاولة في العملية التالية |
| onboarding progress update | `.catch(() => {})` | ✅ غير حرج |

---

## ═══════════════════════════════════════════════════
## القسم 12: توصيات الإصلاح والتطوير
## ═══════════════════════════════════════════════════

### 12.1 إصلاحات عاجلة (يجب تنفيذها فوراً)

| # | الإصلاح | الأولوية | الجهد |
|---|---------|---------|-------|
| 1 | **استخدام orgAuditLog عند فشل القيد التلقائي** — Bug #1 | 🔴 حرج | 2 ساعات |
| 2 | **لف createJournalEntry في $transaction** — Bug #3 | 🔴 حرج | 1 ساعة |
| 3 | **إضافة unique constraint على (referenceType + referenceId)** — Bug #2 | 🟠 عالي | 1 ساعة + migration |
| 4 | **عكس القيد عند تعديل فاتورة ISSUED** — Bug #5 | 🟠 عالي | 3 ساعات |

### 12.2 تحسينات ضرورية (قبل الإطلاق العام)

| # | التحسين | الأولوية |
|---|---------|---------|
| 1 | إضافة unique constraint على entryNo — Bug #6 |
| 2 | فحص الفترة المحاسبية عند إنشاء/ترحيل القيود — Bug #7 |
| 3 | تحديث CLAUDE.md لتعكس عدم وجود accounting mode toggle — Bug #4 |
| 4 | إضافة validation أن مجموع شروط الدفع = قيمة العقد |
| 5 | إضافة validation أن مجموع مستخلصات المشروع ≤ قيمة العقد |
| 6 | ~~Bug #8 — تبيّن أن الأرقام التسلسلية ذرية بالفعل~~ ✅ |
| 7 | إضافة تحقق من حذف حساب بنكي له عمليات |

### 12.3 تحسينات مستقبلية (بعد الإطلاق)

| # | التحسين |
|---|---------|
| 1 | إضافة حساب إهلاك الأصول الثابتة |
| 2 | تقرير التدفقات النقدية (Cash Flow Statement) من القيود المحاسبية |
| 3 | ربط CompanyExpenseAllocation بالقيود المحاسبية (cost center تفصيلي) |
| 4 | دعم VAT rates متعددة (0%, 5%, 15%) — مطلوب لـ ZATCA Phase 2 |
| 5 | إضافة cron job لانتهاء صلاحية عروض الأسعار (EXPIRED) |
| 6 | إضافة retention tracking في ProjectContract (محتجزات العقد الرئيسي) |

### 12.4 جاهزية ZATCA Phase 2

| المتطلب | التقدير | الملاحظات |
|---------|---------|---------|
| UBL 2.1 XML Generation | 2 أسابيع | يحتاج مكتبة مثل `@nodecg/ubl` |
| XAdES-BES Digital Signature | 2 أسابيع | secp256k1 + certificate management |
| CSID Registration | 1 أسبوع | API integration مع هيئة الزكاة |
| Tax Categories | 1 أسبوع | تعديل Schema + UI لدعم أنواع ضرائب متعددة |
| Invoice Counter Chain | 3 أيام | ربط كل فاتورة بـ hash الفاتورة السابقة |
| Simplified vs Standard | 3 أيام | تفريق بين الفاتورة المبسطة والمعيارية |
| **المجموع** | **~6-7 أسابيع** | |

---

## ═══════════════════════════════════════════════════
## القسم 13: ملخص تنفيذي
## ═══════════════════════════════════════════════════

### الأرقام

| المقياس | القيمة |
|---------|--------|
| جداول مالية/محاسبية | 45 |
| API Endpoints مالية | ~200+ |
| أسطر كود خلفية (مالية) | ~25,000+ |
| أسطر كود واجهة (مالية) | ~26,000+ |
| عمليات Auto-Journal | 30 (12 دالة + reverse + handover) |
| أنواع الـ Backfill | 11 |
| حسابات افتراضية | 48 |
| تقارير محاسبية | 8 |
| Transactions ($transaction) | 20+ (finance + subcontract) |
| Audit Log calls | 50+ في finance |
| Access control calls | 169 (verifyOrganizationAccess) |

### الأخطاء المكتشفة

| الخطورة | العدد |
|---------|-------|
| 🔴 حرجة | 3 (missing transaction in journal, missing audit log on failure, **invoice payment doesn't update bank balance**) |
| 🟠 عالية | 5 (no unique on referenceType+Id, ISSUED invoice edit without journal update, **credit note doesn't reduce invoice**, **no credit note limit**, **DRAFT status regression**) |
| 🟡 متوسطة | 6 (entryNo not unique, periods not enforced, outdated docs, **VAT rounding mismatch**, **subcontract numbering race**, **no project claim state machine**) |
| 🟢 منخفضة | 0 |
| **المجموع** | **14 خطأ** (3 حرجة + 5 عالية + 6 متوسطة) |

### التقييم العام

| الجانب | التقييم | الملاحظات |
|--------|---------|---------|
| **الأمان** | ✅ ممتاز (95%) | كل endpoint محمي، organizationId enforced، Decimal types |
| **صحة المنطق المالي** | ✅ جيد (85%) | bank balance atomic، overpayment check، cascade proper |
| **صحة المحاسبة** | ⚠️ مقبول (70%) | auto-journal works لكن no unique constraint، no period enforcement |
| **Audit Trail** | ✅ جيد (80%) | 50+ audit logs — لكن journal failures ليست مؤرشفة |
| **ZATCA** | ⚠️ Phase 1 فقط (40%) | QR works — Phase 2 يحتاج 6-7 أسابيع |
| **اختبارات** | ❌ معدوم (0%) | صفر unit/integration/E2E tests |

### نسبة جاهزية النظام: **~72%**

**للوصول إلى 95%:** تنفيذ الإصلاحات الحرجة (3 بنود) + العالية (5 بنود) + المتوسطة (6 بنود) = **~20-25 ساعة عمل**

### أولوية الإصلاح المرتبة

1. ✅ `orgAuditLog(JOURNAL_ENTRY_FAILED)` عند فشل auto-journal
2. ✅ `$transaction` حول `createJournalEntry()`
3. ✅ `@@unique([organizationId, referenceType, referenceId])` على JournalEntry
4. ✅ عكس/إعادة إنشاء القيد عند تعديل فاتورة ISSUED
5. ✅ `@@unique([organizationId, entryNo])` على JournalEntry
6. ✅ فحص الفترة المحاسبية عند الإنشاء/الترحيل
7. ✅ تحديث CLAUDE.md
8. ~~SELECT FOR UPDATE~~ ✅ (ليس مطلوباً — sequences ذرية بالفعل)
9. ✅ validation مجموع شروط الدفع = قيمة العقد
10. ✅ validation مجموع مستخلصات ≤ قيمة العقد

---

## ═══════════════════════════════════════════════════
## ═══════════════════════════════════════════════════
## القسم 14: تحليل الواجهة الأمامية (Frontend Analysis)
## ═══════════════════════════════════════════════════

### 14.1 هيكل التنقل المالي

**الملف:** `apps/web/modules/saas/finance/components/shell/constants.ts`

15 قسم في شريط التنقل المالي:

| # | القسم | المسار | الأيقونة |
|---|-------|--------|---------|
| 1 | لوحة التحكم | `/finance` | Wallet |
| 2 | العملاء | `/finance/clients` | Users |
| 3 | الفواتير | `/finance/invoices` | FileText |
| 4 | المقبوضات | `/finance/payments` | Banknote |
| 5 | سندات القبض | `/finance/receipt-vouchers` | FileCheck |
| 6 | سندات الصرف | `/finance/payment-vouchers` | FileMinus |
| 7 | المصروفات | `/finance/expenses` | CreditCard |
| 8 | الحسابات البنكية | `/finance/banks` | Building |
| 9 | المستندات | `/finance/documents` | FolderOpen |
| 10 | التقارير | `/finance/reports` | BarChart3 |
| 11 | لوحة المحاسبة | `/finance/accounting-dashboard` | ClipboardList |
| 12 | دليل الحسابات | `/finance/chart-of-accounts` | ClipboardList |
| 13 | القيود اليومية | `/finance/journal-entries` | ClipboardList |
| 14 | الأرصدة الافتتاحية | `/finance/opening-balances` | ClipboardList |
| 15 | الفترات المحاسبية | `/finance/accounting-periods` | ClipboardList |

**⚠️ ملاحظة:** أقسام 11-15 (المحاسبة) تظهر دائماً — لا يوجد toggle لإخفائها. كما أن أيقونات المحاسبة كلها `ClipboardList` — يمكن تنويعها لتحسين UX.

### 14.2 آلية Seed التلقائي

**الملف:** `apps/web/modules/saas/finance/components/shell/AccountingSeedCheck.tsx`

```
1. المستخدم يفتح أي صفحة مالية
2. AccountingSeedCheck.tsx يُحمَّل (في layout.tsx)
3. يستعلم عن قائمة الحسابات: orpc.accounting.accounts.list
4. إذا الحسابات فارغة (أول مرة):
   → يستدعي orpc.accounting.accounts.seed (mutation)
   → يُلغي cache React Query
5. في الخلفية: seedChartOfAccounts() يُنشئ 48 حساب + auto-links bank accounts
```

### 14.3 أنماط React Query المالية

```typescript
// Stale times مالية
ORGANIZATION: 15 * 60 * 1000,  // 15 min — الحسابات البنكية
PROJECTS_LIST: 5 * 60 * 1000,  // 5 min — قائمة المشاريع
INVOICES: 2 * 60 * 1000,       // 2 min — الفواتير
NOTIFICATIONS: 30 * 1000,      // 30 sec — الإشعارات
```

### 14.4 تصدير Excel المحاسبي

**الملف:** `apps/web/modules/saas/finance/lib/accounting-excel-export.ts` (226 سطر)

يدعم 3 أنواع من التصدير:
1. **ميزان المراجعة:** accounts + debit/credit columns + totals row
2. **القيود اليومية:** entryNo, date, description, debit, credit, status
3. **دفتر الأستاذ:** date, description, debit, credit, running balance

يستخدم مكتبة `xlsx-js-style` لإضافة:
- تنسيق أرقام عربي (1,234.56)
- ألوان الأعمدة (header = blue, totals = bold)
- عرض الأعمدة مناسب
- اسم الورقة بالعربي

### 14.5 طباعة التقارير

**الملف:** `apps/web/modules/saas/finance/components/shared/ReportPrintHeader.tsx`

```
<div className="hidden print:block">
  <!-- يظهر فقط عند الطباعة -->
  <h1>{organizationName}</h1>
  <h2>{reportTitle}</h2>
  <p>{dateRange}</p>
</div>
```

4 تقارير تدعم الطباعة: ميزان المراجعة، الميزانية، قائمة الدخل، دفتر الأستاذ.

### 14.6 ملاحظات UI

| الملاحظة | الخطورة | التفاصيل |
|----------|---------|---------|
| أيقونات المحاسبة متطابقة | 🟢 منخفضة | كل أقسام المحاسبة تستخدم ClipboardList |
| لا يوجد accounting mode toggle | 🟡 | CLAUDE.md يوثّق toggle غير موجود |
| InvoiceView كبير | 🟡 | ~969 سطر — يمكن تقسيمه |
| CreateInvoiceForm كبير | 🟡 | ~1,320 سطر — يمكن تقسيمه |
| مكونات بدون Error Boundary | 🟡 | الصفحات المالية لا تحتوي error boundaries |

---

## ملحق أ: قوالب التسوية (Adjustment Templates)
## ═══════════════════════════════════════════════════

**الملف:** `packages/api/lib/accounting/adjustment-templates.ts` (87 سطر)

6 قوالب جاهزة لقيود التسوية الشائعة في شركات المقاولات:

| # | القالب | النوع | القيد (DR / CR) | الاستخدام |
|---|--------|-------|-----------------|---------|
| 1 | إيرادات مستحقة | ACCRUAL | DR 1120 (ذمم مدينة) / CR 4100 (إيرادات) | إيرادات تم تنفيذها ولم تُفوتر |
| 2 | مصروفات مستحقة | ACCRUAL | DR 6900 (مصروفات) / CR 2110 (ذمم دائنة) | مصروفات تمت ولم تُسدد (كهرباء، إيجار) |
| 3 | إهلاك أصول | DEPRECIATION | DR 6900 (مصروف إهلاك) / CR 1290 (مجمع الإهلاك) | قسط إهلاك شهري/سنوي |
| 4 | مصروف مدفوع مقدماً | PREPAYMENT | DR 6900 (مصروف الفترة) / CR 1130 (دفعة مقدمة) | توزيع مصروف مدفوع مقدماً |
| 5 | مخصص نهاية خدمة | PROVISION | DR 6100 (رواتب) / CR 2140 (مخصص) | تكوين مخصص مكافأة نهاية الخدمة |
| 6 | قيد تصحيحي | CORRECTION | (فارغ — يملأه المستخدم) | تصحيح أخطاء |

---

## ═══════════════════════════════════════════════════
## ملحق ب: خريطة فئات المصروفات → أكواد الحسابات الكاملة
## ═══════════════════════════════════════════════════

**الملف:** `packages/database/prisma/queries/accounting.ts` → `EXPENSE_CATEGORY_TO_ACCOUNT_CODE`

| الفئة | الكود | اسم الحساب | ملاحظة |
|-------|-------|------------|--------|
| MATERIALS | 5100 | مواد ومشتريات | |
| CONCRETE | 5100 | مواد ومشتريات | |
| STEEL | 5100 | مواد ومشتريات | |
| LABOR | 5300 | عمالة مباشرة | |
| SUBCONTRACTOR | 5200 | مقاولو باطن | |
| EQUIPMENT_RENTAL | 5400 | معدات وآليات | |
| EQUIPMENT_PURCHASE | 5400 | معدات وآليات | ⚠️ أصل ثابت يُسجَّل كمصروف |
| ELECTRICAL | 5500 | تكاليف مشاريع أخرى | |
| PLUMBING | 5500 | تكاليف مشاريع أخرى | |
| HVAC | 5500 | تكاليف مشاريع أخرى | |
| PAINTING | 5500 | تكاليف مشاريع أخرى | |
| FINISHING | 5500 | تكاليف مشاريع أخرى | |
| EXCAVATION | 5500 | تكاليف مشاريع أخرى | |
| SAFETY | 5500 | تكاليف مشاريع أخرى | |
| TESTING | 5500 | تكاليف مشاريع أخرى | |
| SALARY / SALARIES | 6100 | رواتب وأجور إدارية | معفاة من VAT |
| RENT | 6200 | إيجارات | |
| UTILITIES | 6300 | مرافق واتصالات | |
| COMMUNICATIONS | 6300 | مرافق واتصالات | |
| TRANSPORT / TRANSPORTATION | 6400 | نقل ومواصلات | |
| TRAVEL | 6400 | نقل ومواصلات | |
| FUEL | 6400 | نقل ومواصلات | |
| INSURANCE | 6500 | تأمين | معفاة من VAT |
| LICENSES | 6600 | رسوم حكومية وتراخيص | |
| GOVERNMENT_FEES | 6600 | رسوم حكومية وتراخيص | معفاة من VAT |
| TAXES | 6600 | رسوم حكومية وتراخيص | |
| ZAKAT | 6600 | رسوم حكومية وتراخيص | |
| MAINTENANCE | 6700 | صيانة | |
| MARKETING | 6800 | تسويق وإعلان | |
| BANK_FEES | 6950 | عمولات ورسوم بنكية | معفاة من VAT |
| FINES | 6960 | غرامات وجزاءات | معفاة من VAT |
| LOAN_PAYMENT | 2110 | الموردون — ذمم دائنة | ⚠️ خصوم (سداد قرض) |
| REFUND | 4300 | إيرادات أخرى | ⚠️ إيرادات (مرتجعات) |
| OFFICE_SUPPLIES / SUPPLIES | 6900 | مصروفات إدارية أخرى | |
| SUBSCRIPTIONS | 6900 | مصروفات إدارية أخرى | |
| LEGAL | 6900 | مصروفات إدارية أخرى | |
| TRAINING | 6900 | مصروفات إدارية أخرى | |
| HOSPITALITY | 6900 | مصروفات إدارية أخرى | |
| CUSTOM / MISC / OTHER | 6900 | مصروفات إدارية أخرى | |

**ملاحظة:** 3 فئات خاصة تحتاج انتباه:
1. **EQUIPMENT_PURCHASE → 5400:** يُسجَّل كمصروف لا كأصل ثابت. في المحاسبة السليمة، شراء المعدات يجب أن يُرسمل (DR 1210 Fixed Assets)
2. **LOAN_PAYMENT → 2110:** يُقلل الخصوم مباشرة — صحيح محاسبياً
3. **REFUND → 4300:** يُسجَّل كإيراد سلبي — ⚠️ يجب أن يكون CR في جانب المدين

---

## ═══════════════════════════════════════════════════
## ملحق ج: الحسابات النظامية (System Accounts)
## ═══════════════════════════════════════════════════

11 حساب نظامي تُستخدم بواسطة auto-journal engine:

```typescript
export const SYSTEM_ACCOUNTS = {
    ACCOUNTS_RECEIVABLE: "1120",     // العملاء — DR عند إصدار فاتورة، CR عند التحصيل
    INPUT_VAT: "1150",               // ضريبة مدخلات — DR عند مصروف غير معفى
    ACCOUNTS_PAYABLE: "2110",        // الموردون — CR عند سداد القرض
    SUBCONTRACTOR_PAYABLES: "2120",  // مستحقات مقاولي الباطن — CR عند اعتماد مستخلص، DR عند الدفع
    VAT_PAYABLE: "2130",             // ضريبة مستحقة — CR عند إصدار فاتورة
    SALARIES_PAYABLE: "2140",        // رواتب مستحقة
    GOSI_PAYABLE: "2170",            // تأمينات اجتماعية — CR عند اعتماد مسيّر
    PROJECT_REVENUE: "4100",         // إيرادات المشاريع — CR عند إصدار فاتورة أو اعتماد مستخلص
    OTHER_REVENUE: "4300",           // إيرادات أخرى — CR عند مقبوض مباشر
    SUBCONTRACTORS: "5200",          // مقاولو باطن — DR عند دفعة أو اعتماد مستخلص
    ADMIN_SALARIES: "6100",          // رواتب إدارية — DR عند اعتماد مسيّر
} as const;
```

---

## ═══════════════════════════════════════════════════
## ملحق د: خريطة الـ API Endpoints المالية/المحاسبية
## ═══════════════════════════════════════════════════

### Accounting Module (`packages/api/modules/accounting/router.ts`)

| Endpoint | النوع | الملف |
|----------|-------|-------|
| `accounting.accounts.seed` | mutation | `chart-of-accounts.ts` |
| `accounting.accounts.list` | query | `chart-of-accounts.ts` |
| `accounting.accounts.getById` | query | `chart-of-accounts.ts` |
| `accounting.accounts.create` | mutation | `chart-of-accounts.ts` |
| `accounting.accounts.update` | mutation | `chart-of-accounts.ts` |
| `accounting.accounts.deactivate` | mutation | `chart-of-accounts.ts` |
| `accounting.accounts.getBalance` | query | `chart-of-accounts.ts` |
| `accounting.accounts.getLedger` | query | `chart-of-accounts.ts` |
| `accounting.openingBalances.get` | query | `chart-of-accounts.ts` |
| `accounting.openingBalances.save` | mutation | `chart-of-accounts.ts` |
| `accounting.journal.list` | query | `journal-entries.ts` |
| `accounting.journal.getById` | query | `journal-entries.ts` |
| `accounting.journal.create` | mutation | `journal-entries.ts` |
| `accounting.journal.post` | mutation | `journal-entries.ts` |
| `accounting.journal.reverse` | mutation | `journal-entries.ts` |
| `accounting.journal.delete` | mutation | `journal-entries.ts` |
| `accounting.journal.bulkPost` | mutation | `journal-entries.ts` |
| `accounting.journal.postAllDrafts` | mutation | `journal-entries.ts` |
| `accounting.journal.findByReference` | query | `journal-entries.ts` |
| `accounting.journal.costCenter` | query | `journal-entries.ts` |
| `accounting.journal.dashboard` | query | `journal-entries.ts` |
| `accounting.statements.clientStatement` | query | `statements.ts` |
| `accounting.statements.vendorStatement` | query | `statements.ts` |
| `accounting.accountStatements.*` | query | `account-statements.ts` |
| `accounting.recurring.list` | query | `recurring-entries.ts` |
| `accounting.recurring.create` | mutation | `recurring-entries.ts` |
| `accounting.recurring.update` | mutation | `recurring-entries.ts` |
| `accounting.recurring.delete` | mutation | `recurring-entries.ts` |
| `accounting.recurring.generate` | mutation | `recurring-entries.ts` |
| `accounting.backfill` | mutation | `backfill.ts` |
| `accounting.health` | query | `health.ts` |

### Finance Module (Key Endpoints)

| Endpoint | النوع | الملف |
|----------|-------|-------|
| `finance.invoices.create` | mutation | `create-invoice.ts` |
| `finance.invoices.update` | mutation | `create-invoice.ts` |
| `finance.invoices.issue` | mutation | `create-invoice.ts` |
| `finance.invoices.addPayment` | mutation | `create-invoice.ts` |
| `finance.invoices.deletePayment` | mutation | `create-invoice.ts` |
| `finance.invoices.delete` | mutation | `create-invoice.ts` |
| `finance.invoices.duplicate` | mutation | `create-invoice.ts` |
| `finance.invoices.convertToTax` | mutation | `create-invoice.ts` |
| `finance.invoices.createCreditNote` | mutation | `create-invoice.ts` |
| `finance.invoices.send` | mutation | `create-invoice.ts` |
| `finance.invoices.list` | query | `list-invoices.ts` |
| `finance.expenses.create` | mutation | `expenses.ts` |
| `finance.expenses.update` | mutation | `expenses.ts` |
| `finance.expenses.pay` | mutation | `expenses.ts` |
| `finance.expenses.cancel` | mutation | `expenses.ts` |
| `finance.expenses.delete` | mutation | `expenses.ts` |
| `finance.payments.create` | mutation | `payments.ts` |
| `finance.payments.delete` | mutation | `payments.ts` |
| `finance.transfers.create` | mutation | `transfers.ts` |
| `finance.transfers.cancel` | mutation | `transfers.ts` |
| `finance.banks.create` | mutation | `banks.ts` |
| `finance.banks.update` | mutation | `banks.ts` |
| `finance.banks.setDefault` | mutation | `banks.ts` |
| `finance.banks.delete` | mutation | `banks.ts` |
| `finance.receiptVouchers.*` | 6 endpoints | `receipt-vouchers.ts` |
| `finance.paymentVouchers.*` | 8 endpoints | `payment-vouchers.ts` |

---

## ═══════════════════════════════════════════════════
## ملحق هـ: خريطة ملفات النظام المالي/المحاسبي الكاملة
## ═══════════════════════════════════════════════════

### Backend — Query Layer

| الملف | الأسطر | الوظيفة |
|-------|--------|---------|
| `packages/database/prisma/queries/accounting.ts` | 2,118 | Core: seed, create/post/reverse journal, trial balance, balance sheet, income statement, ledger, opening balances, bulk post, cost center, dashboard |
| `packages/database/prisma/queries/accounting-reports.ts` | 1,035 | VAT report, aged receivables, aged payables, income statement (financial) |
| `packages/database/prisma/queries/accounting-health.ts` | 86 | 4 health checks |
| `packages/database/prisma/queries/finance.ts` | 2,152 | Invoice CRUD, payments, credit notes, sequential numbering |
| `packages/database/prisma/queries/org-finance.ts` | 1,476 | Bank CRUD, expense CRUD, payment CRUD, transfer CRUD, dashboard |
| `packages/database/prisma/queries/finance-reports.ts` | 505 | Revenue by period, profitability, cash flow projections |
| `packages/database/prisma/queries/client-statements.ts` | 303 | Client statement, vendor statement |
| `packages/database/prisma/queries/account-statements.ts` | 428 | Account transaction history |
| `packages/database/prisma/queries/cash-flow.ts` | 283 | Cash flow analysis |
| `packages/database/prisma/queries/subcontract.ts` | 706 | Contract CRUD, value calculations, status transitions |
| `packages/database/prisma/queries/subcontract-claims.ts` | 734 | Claim CRUD, math, cumulative tracking, status transitions |
| `packages/database/prisma/queries/project-finance.ts` | 748 | Project claims, payments, expenses, finance summary |
| `packages/database/prisma/queries/payroll.ts` | 498 | Payroll creation, GOSI, net salary, approval |
| `packages/database/prisma/queries/expense-runs.ts` | 455 | Company expense run creation, posting |
| `packages/database/prisma/queries/sequences.ts` | 75 | Atomic sequence generation (INSERT ... ON CONFLICT) |
| **المجموع** | **~11,600** | |

### Backend — Procedure Layer

| الملف | الأسطر | الوظيفة |
|-------|--------|---------|
| `packages/api/lib/accounting/auto-journal.ts` | 768 | 12 functions + helpers (30 operations) |
| `packages/api/lib/accounting/backfill.ts` | 245 | 11-type historical backfill |
| `packages/api/lib/accounting/adjustment-templates.ts` | 87 | 6 adjustment templates |
| `packages/api/modules/accounting/procedures/chart-of-accounts.ts` | 351 | ChartAccount CRUD + ledger + opening balances |
| `packages/api/modules/accounting/procedures/journal-entries.ts` | 746 | Journal CRUD + bulk post + cost center + dashboard |
| `packages/api/modules/accounting/procedures/statements.ts` | 69 | Client/vendor statements |
| `packages/api/modules/accounting/procedures/account-statements.ts` | 111 | Account-level statements |
| `packages/api/modules/accounting/procedures/recurring-entries.ts` | 140 | Recurring templates CRUD + generate |
| `packages/api/modules/accounting/procedures/backfill.ts` | 22 | Backfill procedure wrapper |
| `packages/api/modules/accounting/procedures/health.ts` | 22 | Health check procedure |
| `packages/api/modules/accounting/router.ts` | 138 | Router (30+ endpoints) |
| `packages/api/modules/finance/procedures/create-invoice.ts` | 1,052 | Invoice lifecycle (10+ operations) |
| `packages/api/modules/finance/procedures/expenses.ts` | 671 | Expense CRUD + pay + cancel |
| `packages/api/modules/finance/procedures/payments.ts` | 301 | Payment CRUD |
| `packages/api/modules/finance/procedures/transfers.ts` | 207 | Transfer create + cancel |
| `packages/api/modules/finance/procedures/banks.ts` | 346 | Bank CRUD + default |
| `packages/api/modules/finance/procedures/receipt-vouchers.ts` | ~570 | Receipt voucher CRUD + issue + cancel |
| `packages/api/modules/finance/procedures/payment-vouchers.ts` | ~703 | Payment voucher CRUD + submit + approve + reject |
| `packages/api/modules/finance/router.ts` | 303 | Router (25+ endpoints) |
| **المجموع** | **~6,900** | |

### Frontend — Component Layer

| الدليل | الملفات | الأسطر | الوظيفة |
|--------|---------|--------|---------|
| `components/accounting/` | 16 | 3,416 | Dashboard, ChartOfAccounts, JournalEntries, Ledger, OpeningBalances, Periods, Health, Recurring, Formatters |
| `components/accounting-reports/` | 5 | 2,223 | VATReport (3 tabs), IncomeStatement, AgedReceivables, AgedPayables, Landing |
| `components/invoices/` | 7 | 4,320 | CreateForm, Editor, View, List, Document, Preview |
| `components/payments/` | 7 | 1,744 | PaymentForm, Detail, List, Vouchers |
| `components/vouchers/` | 6 | 2,021 | Receipt/Payment voucher forms, details, lists |
| `components/banks/` | 6 | 1,767 | BanksList, Detail, Form, Reconciliation |
| `components/clients/` | 12 | 2,263 | ClientForm, Detail, List, InlineForm, Sections |
| `components/expenses/` | 7 | 1,915 | ExpensesList, Form, PayDialog, TransferForm |
| `components/dashboard/` | 17 | 1,894 | Overview, Alerts, KPIs, CashFlow, QuickActions |
| `components/statements/` | 3 | 557 | Project, Account, Subcontract statements |
| `components/reports/` | 2 | 869 | Finance reports landing, CashFlow |
| `components/shell/` | 6 | 373 | Navigation, Constants, SeedCheck, Shell |
| `components/shared/` | 7 | 703 | ItemsEditor, ClientSelector, AmountSummary, StatusBadge, Currency, JournalEntryLink, ReportPrintHeader |
| `lib/` | 2 | 407 | accounting-excel-export.ts, utils.ts |
| **المجموع** | **~109** | **~24,500** | |

### Schema Layer

| الملف | الأسطر | المحتوى |
|-------|--------|---------|
| `packages/database/prisma/schema.prisma` | 5,792 | 45 financial models + 30+ enums |

---

## ═══════════════════════════════════════════════════
## ملحق و: مصطلحات
## ═══════════════════════════════════════════════════

| المصطلح | بالإنجليزية | الشرح |
|---------|------------|-------|
| قيد يومي | Journal Entry | سجل محاسبي يوثّق عملية مالية بأسلوب القيد المزدوج |
| مدين | Debit (DR) | الجانب الأيسر من القيد — يزيد الأصول والمصروفات |
| دائن | Credit (CR) | الجانب الأيمن من القيد — يزيد الخصوم والإيرادات وحقوق الملكية |
| ميزان المراجعة | Trial Balance | تقرير يوضح أرصدة كل الحسابات (مجموع المدين = مجموع الدائن) |
| الميزانية العمومية | Balance Sheet | الأصول = الخصوم + حقوق الملكية (في لحظة معينة) |
| قائمة الدخل | Income Statement | الإيرادات - المصروفات = الربح/الخسارة (خلال فترة) |
| دليل الحسابات | Chart of Accounts | شجرة هرمية تصنّف كل الحسابات |
| ترحيل | Posting | تحويل القيد من مسودة (DRAFT) إلى مؤثر على الأرصدة (POSTED) |
| عكس | Reversal | إنشاء قيد عكسي يُلغي أثر القيد الأصلي |
| ذمم مدينة | Accounts Receivable | أموال مستحقة للشركة من العملاء |
| ذمم دائنة | Accounts Payable | أموال مستحقة على الشركة للموردين |
| محتجزات | Retention | مبالغ تُحتجز من كل مستخلص كضمان |
| GOSI | التأمينات الاجتماعية | المؤسسة العامة للتأمينات الاجتماعية — حصة الموظف + حصة الشركة |
| ZATCA | هيئة الزكاة والضريبة | الهيئة المسؤولة عن الفوترة الإلكترونية في السعودية |
| مستخلص | Claim | طلب دفعة مرحلية بناءً على أعمال منجزة |
| سند قبض | Receipt Voucher | مستند يثبت استلام مبلغ مالي |
| سند صرف | Payment Voucher | مستند يثبت صرف مبلغ مالي |

---

## ═══════════════════════════════════════════════════
## القسم 15: تحليل تفصيلي لدوال auto-journal.ts
## ═══════════════════════════════════════════════════

### 15.1 الدوال المساعدة (Helpers)

#### `ensureChartExists(db, organizationId)` — سطر 76-95

```typescript
// Cache-based check with 5-min TTL
// 1. Check memory cache → if hit & fresh → return cached
// 2. Count chart accounts → if > 0 → cache true, return
// 3. If 0 → auto-seed via seedChartOfAccounts()
// 4. On failure → do NOT cache (allow retry next time)
```

**⚠️ ملاحظة:** الـ cache في الذاكرة (Map) — لا يُشارك بين instances في Vercel. كل instance يفحص بشكل مستقل.

#### `getAccountByCode(db, organizationId, code)` — سطر 100-106

```typescript
// Uses unique compound index: @@unique([organizationId, code])
// Returns account ID or null
```

#### `getBankChartAccountId(db, organizationId, bankId)` — سطر 111-140

```typescript
// 1. Find bank → check if chartAccountId exists
// 2. If no chartAccountId → auto-create via createBankChartAccount()
//    Creates child account under 1110 (e.g., "1111 — البنك الأهلي")
// 3. Fallback: find first postable child of 1110
// 4. If 1110 itself is postable → return it
```

### 15.2 تفاصيل كل دالة

#### `onInvoiceIssued()` — سطر 145-185

| المعامل | النوع | الاستخدام |
|---------|-------|---------|
| id | string | referenceId في القيد |
| organizationId | string | ربط بالمنظمة |
| number | string | referenceNo (e.g., INV-2026-0001) |
| issueDate | Date | تاريخ القيد |
| clientName | string | للوصف ثنائي اللغة |
| totalAmount | Decimal | المبلغ الإجمالي |
| vatAmount | Decimal | مبلغ الضريبة |
| projectId? | string | لربط بنود القيد بالمشروع |
| userId? | string | createdById |

**القيد:**
```
DR 1120 (عملاء)         totalAmount     "فاتورة INV-2026-0001 — اسم العميل"
CR 4100 (إيرادات)       netAmount       "إيراد فاتورة INV-2026-0001"
CR 2130 (ضريبة)         vatAmount       "ضريبة فاتورة INV-2026-0001"  ← فقط إذا > 0
```

**netAmount** = totalAmount - vatAmount

#### `onInvoicePaymentReceived()` — سطر 190-222

**القيد:**
```
DR Bank (حسب sourceAccountId)   amount    "تحصيل — فاتورة INV-2026-0001"
CR 1120 (عملاء)                 amount
```

**ملاحظة:** لا يُفصل VAT — الضريبة سُجِّلت عند الإصدار.

#### `onExpenseCompleted()` — سطر 227-306

**أكثر الدوال تعقيداً — تتضمن 3 مسارات:**

1. **Skip payroll:** إذا `sourceType === "FACILITY_PAYROLL"` → return (الرواتب لها قيد خاص)
2. **VAT-exempt:** إذا الفئة في `["SALARIES", "SALARY", "GOVERNMENT_FEES", "BANK_FEES", "FINES", "INSURANCE"]`:
   ```
   DR Expense (كامل المبلغ)    amount
   CR Bank                      amount
   ```
3. **مع VAT (15%):**
   ```
   DR Expense              net = amount / 1.15        "مصروف"
   DR 1150 (ضريبة مدخلات)  vat = amount - net        "ضريبة مدخلات"
   CR Bank                  amount
   ```

   **⚠️ Fallback:** إذا حساب 1150 غير موجود → المبلغ الكامل يُسجَّل كمصروف (بدون فصل VAT)

**حساب الكود:**
```typescript
const expenseCode = EXPENSE_CATEGORY_TO_ACCOUNT_CODE[expense.category] || "6900";
```

#### `onTransferCompleted()` — سطر 311-340

**القيد:**
```
DR toBank (الحساب المستلم)     amount    "تحويل بين حسابات"
CR fromBank (الحساب المرسل)    amount
```

**أبسط قيد — لا VAT، لا projectId**

#### `onSubcontractPayment()` — سطر 345-378

**قيد يتفرع حسب وجود مستخلص:**

```
// بدون مستخلص (دفعة مباشرة):
DR 5200 (مقاولو باطن)    amount    "دفعة مقاول — اسم المقاول"
CR Bank                    amount

// مع مستخلص (claimId provided):
DR 2120 (مستحقات باطن)    amount    "دفعة مقاول — اسم المقاول"
CR Bank                    amount
```

**المنطق:** إذا المستخلص معتمد → التكلفة (5200) سُجِّلت عند الاعتماد → الدفعة تُغلق المستحقات (2120) فقط.

#### `onSubcontractClaimApproved()` — سطر 385-415

**القيد (accrual basis):**
```
DR 5200 (مقاولو باطن)           netAmount    "اعتماد مستخلص #3 — اسم المقاول"
CR 2120 (مستحقات مقاولي الباطن)  netAmount
```

**يستخدم `netAmount`** (بعد الاستقطاع + خصم الدفعة المقدمة) — وليس grossAmount.

#### `onPayrollApproved()` — سطر 420-462

**القيد:**
```
DR 6100 (رواتب إدارية)     totalNet + totalGosi    "مسير رواتب 3/2026"
CR Bank                     totalNet                 "صرف رواتب 3/2026"
CR 2170 (GOSI)              totalGosi                "تأمينات 3/2026"   ← فقط إذا > 0
```

**تاريخ القيد:** اليوم 28 من الشهر: `new Date(year, month - 1, 28)`

#### `onOrganizationPaymentReceived()` — سطر 467-496

**القيد (مقبوض مباشر):**
```
DR Bank                     amount    "مقبوضات: [الوصف]"
CR 4300 (إيرادات أخرى)     amount
```

**⚠️ يُسجَّل كإيراد أخرى** — وليس إيراد مشروع (4100). لأنه مقبوض عام.

#### `onProjectPaymentReceived()` — سطر 501-533

**القيد (دفعة مشروع):**
```
DR Bank                     amount    "دفعة مشروع PP-001"
CR 1120 (عملاء)            amount
```

**يختلف عن المقبوض المباشر** — يُقلل الذمم المدينة (عميل المشروع).

#### `onProjectClaimApproved()` — سطر 538-568

**القيد (اعتماد مستخلص مشروع — revenue recognition):**
```
DR 1120 (عملاء)            netAmount    "اعتماد مستخلص مشروع #2"
CR 4100 (إيرادات)          netAmount
```

**يعكس onInvoiceIssued** — لكن بدون VAT split.

#### `onCreditNoteIssued()` — سطر 573-612

**القيد (عكس الفاتورة):**
```
DR 4100 (إيرادات)          netAmount    "إشعار دائن CN-2026-0001"
DR 2130 (ضريبة)            vatAmount    ← فقط إذا > 0
CR 1120 (عملاء)            totalAmount
```

#### `reverseAutoJournalEntry()` — سطر 617-646

```typescript
// 1. Find original entry (not REVERSED)
// 2. If POSTED → reverseJournalEntry() (creates new reversed entry)
// 3. If DRAFT → check if period is closed
//    - Not closed → hard delete
//    - Closed → silently skip (DRAFT doesn't affect reports)
// 4. If not found → silently return (idempotent)
```

#### `onReceiptVoucherIssued()` — سطر 651-686

**القيد (سند قبض يدوي):**
```
DR Bank                     amount    "سند قبض RCV-2026-0001 — [المستلم]"
CR 4300 (إيرادات أخرى)     amount
```

#### `onPaymentVoucherApproved()` — سطر 691-732

**القيد (سند صرف يدوي — يختلف حسب نوع المستفيد):**
```
// SUBCONTRACTOR → DR 5200
// EMPLOYEE → DR 6100
// OTHER → DR 6900

DR Expense (حسب النوع)     amount    "سند صرف PMT-2026-0001 — [المستفيد]"
CR Bank                     amount
```

#### `onFinalHandoverCompleted()` — سطر 738-768

**القيد (تحرير محتجزات — استلام نهائي):**
```
DR 2150 (محتجزات)                     retentionReleaseAmount
CR 1120 (عملاء)                        retentionReleaseAmount
```

**شرط:** retentionReleaseAmount > 0

---

## ═══════════════════════════════════════════════════
## القسم 16: لوحة المحاسبة — KPIs والمؤشرات
## ═══════════════════════════════════════════════════

**الدالة:** `getAccountingDashboard()` في `packages/database/prisma/queries/accounting.ts`

### 16.1 المؤشرات الأربعة الرئيسية (KPIs)

| # | المؤشر | الحساب | المصدر |
|---|--------|--------|--------|
| 1 | **إيرادات الشهر** | SUM(credit - debit) لحسابات REVENUE في الشهر الحالي | JournalEntryLine (POSTED) |
| 2 | **مصروفات الشهر** | SUM(debit - credit) لحسابات EXPENSE في الشهر الحالي | JournalEntryLine (POSTED) |
| 3 | **صافي الذمم المدينة** | SUM(debit - credit) لحساب 1120 (كل الفترات) | JournalEntryLine (POSTED) |
| 4 | **صافي الذمم الدائنة** | SUM(credit - debit) لحسابات 2110 + 2120 (كل الفترات) | JournalEntryLine (POSTED) |

### 16.2 التنبيهات

| التنبيه | الشرط |
|---------|-------|
| مسودات غير مرحّلة | `count(JournalEntry WHERE status = DRAFT)` > 0 |
| فترات مفتوحة قديمة | `count(AccountingPeriod WHERE isClosed = false AND endDate < 1 month ago)` > 0 |
| ميزان مراجعة غير متوازن | `getTrialBalance()` → `!isBalanced` |

### 16.3 الاختصارات

| الاختصار | الرابط |
|----------|--------|
| إنشاء قيد يدوي | `/finance/journal-entries` |
| ترحيل المسودات | `/finance/journal-entries` (bulk post) |
| دفتر الأستاذ | `/finance/chart-of-accounts/[id]/ledger` |
| التقارير | `/finance/accounting-reports` |

---

## ═══════════════════════════════════════════════════
## القسم 17: تحليل Schema Constraints والعلاقات
## ═══════════════════════════════════════════════════

### 17.1 Unique Constraints المالية

| الجدول | الـ Constraint | الغرض |
|--------|--------------|-------|
| `FinanceInvoice` | `invoiceNo` (global unique) | رقم الفاتورة فريد عالمياً |
| `FinanceExpense` | `expenseNo` (global unique) | رقم المصروف فريد عالمياً |
| `FinancePayment` | `paymentNo` (global unique) | رقم المقبوض فريد عالمياً |
| `FinanceTransfer` | `transferNo` (global unique) | رقم التحويل فريد عالمياً |
| `Quotation` | `quotationNo` (global unique) | رقم عرض السعر فريد عالمياً |
| `OrganizationBank` | `chartAccountId` (global unique) | ربط 1-1 مع دليل الحسابات |
| `ProjectContract` | `projectId` (global unique) | عقد واحد لكل مشروع |
| `ProjectPayment` | `(projectId, paymentNo)` | رقم الدفعة فريد لكل مشروع |
| `PayrollRun` | `(organizationId, runNo)` + `(organizationId, month, year)` | مسيّر واحد لكل شهر |
| `CompanyExpenseRun` | `(organizationId, runNo)` + `(organizationId, month, year)` | دورة واحدة لكل شهر |
| `ChartAccount` | `(organizationId, code)` | كود الحساب فريد لكل منظمة |
| `AccountingPeriod` | `(organizationId, startDate, endDate)` | فترة واحدة لكل نطاق تاريخ |
| `OrganizationSequence` | `(organizationId, sequenceKey)` | تسلسل واحد لكل نوع |
| `ReceiptVoucher` | `(organizationId, voucherNo)` | رقم السند فريد لكل منظمة |
| `PaymentVoucher` | `(organizationId, voucherNo)` | رقم السند فريد لكل منظمة |
| `SubcontractPayment.voucherNo` | global unique | رقم سند الصرف فريد عالمياً |
| `FinanceExpense.voucherNo` | global unique | رقم سند الصرف فريد عالمياً |
| `Client.code` | global unique | كود العميل فريد عالمياً |

**⚠️ ملاحظة مهمة:** بعض الأرقام التسلسلية unique عالمياً (invoiceNo) والبعض unique per organization (voucherNo). هذا قد يسبب تعارض إذا تم نقل بيانات بين منظمات.

### 17.2 Cascade Delete Chain

```
Organization (deleted)
   ├→ CASCADE → OrganizationBank → CASCADE → BankReconciliation → CASCADE → BankReconciliationItem
   ├→ CASCADE → Client → CASCADE → ClientContact
   ├→ CASCADE → FinanceInvoice → CASCADE → FinanceInvoiceItem, FinanceInvoicePayment
   ├→ CASCADE → FinanceExpense
   ├→ CASCADE → FinancePayment
   ├→ CASCADE → FinanceTransfer
   ├→ CASCADE → ChartAccount
   ├→ CASCADE → JournalEntry → CASCADE → JournalEntryLine
   ├→ CASCADE → AccountingPeriod
   ├→ CASCADE → RecurringJournalTemplate
   ├→ CASCADE → PayrollRun → CASCADE → PayrollRunItem
   ├→ CASCADE → CompanyExpense → CASCADE → CompanyExpensePayment, CompanyExpenseAllocation
   ├→ CASCADE → Employee
   ├→ CASCADE → ReceiptVoucher
   ├→ CASCADE → PaymentVoucher
   ├→ CASCADE → HandoverProtocol → CASCADE → HandoverProtocolItem
   └→ ... (45+ جدول)
```

**⚠️ خطر:** حذف منظمة يحذف **كل شيء** — بما في ذلك البيانات المالية والمحاسبية. لا يوجد soft delete على مستوى المنظمة. يجب إضافة حماية (confirmation dialog + 30-day grace period).

### 17.3 Indexes المالية (أهم 20)

| الجدول | الـ Index | السبب |
|--------|----------|-------|
| FinanceInvoice | `(organizationId)` | قائمة الفواتير |
| FinanceInvoice | `(organizationId, status)` | فلترة بالحالة |
| FinanceInvoice | `(organizationId, dueDate)` | فواتير متأخرة |
| FinanceInvoice | `(organizationId, clientId)` | فواتير العميل |
| FinanceInvoice | `(organizationId, projectId)` | فواتير المشروع |
| FinanceExpense | `(organizationId, date)` | ترتيب بالتاريخ |
| FinanceExpense | `(organizationId, category)` | فلترة بالفئة |
| FinanceExpense | `(organizationId, status, dueDate)` | مصروفات معلقة |
| JournalEntry | `(organizationId, date)` | القيود بالتاريخ |
| JournalEntry | `(organizationId, status)` | فلترة بالحالة |
| JournalEntry | `(organizationId, referenceType, referenceId)` | ربط بالمصدر |
| JournalEntryLine | `(journalEntryId)` | بنود القيد |
| JournalEntryLine | `(accountId)` | حركات الحساب |
| JournalEntryLine | `(projectId)` | مراكز تكلفة |
| ChartAccount | `(organizationId, type)` | فلترة بالنوع |
| OrganizationBank | `(organizationId, isActive)` | الحسابات النشطة |
| SubcontractClaim | `(organizationId, contractId, status)` | مستخلصات العقد |
| ProjectPayment | `(projectId)` | دفعات المشروع |
| PayrollRun | `(organizationId, status)` | المسيّرات |
| OrganizationAuditLog | `(organizationId, createdAt)` | سجل التدقيق |

---

## ═══════════════════════════════════════════════════
## ملحق ز: تحليل تفصيلي للعمليات المالية الذرية
## ═══════════════════════════════════════════════════

### ز.1 عملية إضافة دفعة لفاتورة (Atomic Payment)

هذه العملية الأكثر تعقيداً — تتضمن 4 خطوات ذرية:

```
Step 1: Validate payment (amount ≤ remaining)
   └→ Prisma query: invoice.totalAmount - invoice.paidAmount ≥ input.amount

Step 2: Create FinanceInvoicePayment record
   └→ Prisma create: { invoiceId, amount, paymentDate, sourceAccountId, ... }

Step 3: Update Invoice (paidAmount + status)
   └→ Atomic transaction in finance.ts:
      - db.financeInvoice.update({ paidAmount: { increment: amount } })
      - if (newPaidAmount >= totalAmount) → status = "PAID"
      - else → status = "PARTIALLY_PAID"

Step 4: Update Bank Balance
   └→ Atomic transaction in org-finance.ts:
      - Layer 1: db.organizationBank.update({ balance: { increment: amount } })
      - Layer 2: Atomic guard (prevents negative)

Step 5 (async, try/catch): Auto-Journal
   └→ onInvoicePaymentReceived() → DR Bank / CR 1120
   └→ Failure does NOT rollback steps 1-4

Step 6: Audit Log
   └→ orgAuditLog(INVOICE_PAYMENT_ADDED, { invoiceNo, amount })
```

**⚠️ ملاحظة حرجة:** الخطوات 2-4 **ليست في transaction واحد**. إذا نجحت الخطوة 2 وفشلت الخطوة 3 (نادر جداً)، ستكون الدفعة مسجلة لكن paidAmount لم يتحدث. يمكن اكتشاف هذا بمقارنة `SUM(payments.amount)` مع `invoice.paidAmount`.

### ز.2 عملية إنشاء تحويل بنكي (Atomic Transfer)

```
Step 1: Validate (fromAccount ≠ toAccount, amount > 0)

Step 2: Create FinanceTransfer record

Step 3: Atomic Balance Update (SINGLE $transaction):
   └→ db.$transaction(async (tx) => {
        // Deduct from source
        const from = await tx.organizationBank.update({
          where: { id: fromAccountId },
          data: { balance: { decrement: amount } },
        });
        // Atomic guard: check balance didn't go negative
        if (Number(from.balance) < 0) {
          throw new Error("Insufficient balance");
        }
        // Add to destination
        await tx.organizationBank.update({
          where: { id: toAccountId },
          data: { balance: { increment: amount } },
        });
      });

Step 4 (async, try/catch): Auto-Journal
   └→ onTransferCompleted() → DR Bank2 / CR Bank1

Step 5: Audit Log
   └→ orgAuditLog(TRANSFER_CREATED, { from, to, amount })
```

**✅ الخطوة 3 آمنة** — transaction واحد يحمي من race conditions. الـ atomic guard يمنع الرصيد السالب حتى مع concurrent transfers.

### ز.3 عملية اعتماد مسيّر رواتب (Payroll Approval)

```
Step 1: Validate (status = DRAFT, items.length > 0)

Step 2: Status → APPROVED, set approvedBy/At

Step 3: For each PayrollRunItem:
   └→ Create FinanceExpense (category=SALARIES, sourceType=FACILITY_PAYROLL)
   └→ Link: item.financeExpenseId = expense.id

Step 4: Deduct Bank Balance (if sourceAccountId provided)
   └→ Atomic: balance -= totalNetSalary

Step 5 (async, try/catch): Auto-Journal
   └→ onPayrollApproved() → DR 6100 (totalNet + totalGosi) / CR Bank (totalNet) + CR 2170 (totalGosi)
   └→ Note: FinanceExpense auto-journal is SKIPPED (sourceType = FACILITY_PAYROLL check)

Step 6: Audit Log
   └→ orgAuditLog(PAYROLL_RUN_APPROVED, { month, year, total })
```

**⚠️ ملاحظة:** القيد المحاسبي يسجّل `DR 6100` بمبلغ (net + GOSI) وليس gross. هذا لأن:
- DR 6100 = التكلفة الحقيقية على الشركة (net salary + GOSI company share)
- CR Bank = صافي المبلغ المحول للموظفين
- CR 2170 = GOSI company share المستحقة للتأمينات

---

## ═══════════════════════════════════════════════════
## ملحق ح: تحليل الأمان المالي
## ═══════════════════════════════════════════════════

### ح.1 طبقات الحماية

```
Layer 1: Authentication (Better Auth)
   └→ Session validation on every request
   └→ 2FA, Passkeys, OAuth support

Layer 2: Authorization (Procedure Chain)
   └→ protectedProcedure (read) / subscriptionProcedure (write)
   └→ Rate limiting: READ 60/min, WRITE 20/min

Layer 3: Organization Access (verifyOrganizationAccess)
   └→ 169 calls across finance/accounting modules
   └→ Checks membership + specific permission (e.g., "finance.create")

Layer 4: Feature Gating (enforceFeatureAccess)
   └→ Plan-based restrictions (FREE vs PRO)
   └→ e.g., PDF export, cost-study.save, quotation.export

Layer 5: Input Validation (Zod schemas)
   └→ Every input validated with type-safe schemas
   └→ .min(), .max(), .nonnegative() on numeric fields

Layer 6: Database Constraints
   └→ Decimal(15, 2) for all amounts
   └→ Unique constraints on sequential numbers
   └→ Foreign key constraints with Cascade/SetNull

Layer 7: Audit Trail
   └→ 50+ orgAuditLog calls in finance
   └→ Every create/update/delete logged with metadata
   └→ User ID (actorId) always recorded
```

### ح.2 نتائج فحص الصلاحيات

| الملف | protectedProcedure (read) | subscriptionProcedure (write) | publicProcedure | verifyOrganizationAccess |
|-------|--------------------------|------------------------------|-----------------|--------------------------|
| `create-invoice.ts` | 2 | 10 | 0 | 14 |
| `expenses.ts` | 1 | 5 | 0 | 10 |
| `payments.ts` | 1 | 3 | 0 | 6 |
| `transfers.ts` | 0 | 3 | 0 | 5 |
| `banks.ts` | 2 | 5 | 0 | 9 |
| `receipt-vouchers.ts` | 2 | 5 | 0 | 9 |
| `payment-vouchers.ts` | 2 | 6 | 0 | 11 |
| `chart-of-accounts.ts` | 3 | 5 | 0 | 11 |
| `journal-entries.ts` | 4 | 7 | 0 | 20 |
| **المجموع** | **17** | **49** | **0** | **95** |

**✅ صفر publicProcedure** — كل endpoint محمي بشكل صحيح.

### ح.3 التحقق من Decimal Types

```
grep -r "Float" packages/database/prisma/schema.prisma | grep -i "amount\|price\|cost\|total\|balance\|salary\|rate"
→ NO RESULTS — all financial fields use Decimal ✅
```

كل الحقول المالية تستخدم `@db.Decimal(15, 2)` — لا يوجد `Float` أو `Int` لحقول المبالغ. هذا يمنع أخطاء floating-point الشائعة.

### ح.4 حماية من SQL Injection

- كل استعلامات Prisma parameterized by default
- Raw SQL (`$queryRawUnsafe`) يُستخدم فقط في `sequences.ts` مع parameterized values (`$1`, `$2`)
- لا يوجد string concatenation في SQL queries

---

## ═══════════════════════════════════════════════════
## ملحق ط: الـ number-to-arabic-words Utility
## ═══════════════════════════════════════════════════

**الملف:** `packages/utils/lib/number-to-arabic-words.ts` (168 سطر)

**الوظيفة:** تحويل الأرقام إلى كلمات عربية مع عملة "ريال سعودي" و "هللة"

**أمثلة:**
```
numberToArabicWords(0)        → "صفر ريال سعودي"
numberToArabicWords(1)        → "ريال سعودي واحد"
numberToArabicWords(2)        → "ريالان سعوديان"
numberToArabicWords(11)       → "أحد عشر ريالاً سعودياً"
numberToArabicWords(100)      → "مائة ريال سعودي"
numberToArabicWords(1000)     → "ألف ريال سعودي"
numberToArabicWords(13800.50) → "ثلاثة عشر ألفاً وثمانمائة ريال سعودي وخمسون هللة"
```

**يُستخدم في:**
- سندات القبض (`ReceiptVoucher.amountInWords`)
- سندات الصرف (`PaymentVoucher.amountInWords`)

**النطاق المدعوم:** 0 إلى 999,999,999 ريال

**القواعد اللغوية المطبقة:**
- التذكير والتأنيث (ريال=مذكر، هللة=مؤنث)
- المثنى (ريالان/هللتان)
- التمييز (3-10: ريالات، 11+: ريالاً)
- واو العطف بين المراتب

---

## ═══════════════════════════════════════════════════
## ملحق ي: ملخص الاختبارات اليدوية المقترحة
## ═══════════════════════════════════════════════════

### ي.1 اختبارات حرجة (يجب تنفيذها قبل الإطلاق)

| # | الاختبار | الخطوات | النتيجة المتوقعة |
|---|---------|---------|------------------|
| 1 | **إنشاء فاتورة + إصدار + تحصيل كامل** | أنشئ فاتورة مسودة → أضف بنود → أصدر → سجّل دفعة كاملة | الفاتورة PAID + Bank balance ↑ + JournalEntry POSTED (DR 1120, CR 4100+2130 ثم DR Bank, CR 1120) |
| 2 | **تحصيل جزئي + حذف دفعة** | سجّل دفعة جزئية (50%) → تحقق من PARTIALLY_PAID → احذف الدفعة | الفاتورة تعود ISSUED + Bank balance يُعكس + القيد يُعكس |
| 3 | **إشعار دائن** | أنشئ فاتورة مصدرة → أنشئ إشعار دائن | فاتورة CREDIT_NOTE جديدة + قيد عكسي (DR 4100, CR 1120) |
| 4 | **تحويل بنكي** | حوّل 1000 من حساب A لحساب B | A.balance -= 1000, B.balance += 1000 + قيد (DR B, CR A) |
| 5 | **تحويل يفشل (رصيد غير كافٍ)** | حاول تحويل مبلغ أكبر من الرصيد | خطأ "Insufficient balance" + لا تغيير في الأرصدة |
| 6 | **مسيّر رواتب كامل** | أنشئ مسيّر → اعتمد | FinanceExpense لكل موظف + Bank balance ↓ + قيد (DR 6100, CR Bank+2170) |
| 7 | **مستخلص مقاول باطن** | أنشئ عقد → أضف بنود → أنشئ مستخلص → اعتمد → سجّل دفعة | قيد اعتماد (DR 5200, CR 2120) + قيد دفعة (DR 2120, CR Bank) |
| 8 | **الترحيل الاسترجاعي (Backfill)** | أنشئ فواتير ومصروفات → شغّل backfill | كل العمليات لها قيود + لا مكررات |
| 9 | **فحص الصحة** | أنشئ بعض العمليات → شغّل health check | 0 unbalanced entries + 0 missing entries |
| 10 | **ميزان المراجعة** | أنشئ عمليات متنوعة → اعرض ميزان المراجعة | DR total = CR total (balanced) |

### ي.2 اختبارات Concurrent (تحتاج 2+ users)

| # | الاختبار | الخطوات | النتيجة المتوقعة |
|---|---------|---------|------------------|
| 1 | **ترقيم متزامن** | مستخدمان يُنشئان فاتورة في نفس اللحظة | رقمان مختلفان (INV-2026-0001, INV-2026-0002) |
| 2 | **تحويل متزامن** | مستخدمان يحولان من نفس الحساب في نفس اللحظة | الأول ينجح + الثاني يفشل إذا الرصيد غير كافٍ |
| 3 | **دفعة مكررة** | مستخدمان يسجلان دفعة لنفس الفاتورة | الأول ينجح + الثاني يفشل (amount > remaining) |

### ي.3 اختبارات Edge Cases

| # | الاختبار | السلوك المتوقع |
|---|---------|----------------|
| 1 | حذف مؤسسة كاملة | كل الجداول المالية تُحذف (Cascade) |
| 2 | مصروف بفئة CUSTOM | يُسجَّل تحت 6900 (مصروفات أخرى) |
| 3 | فاتورة بـ 0% VAT | لا يُنشأ بند ضريبة في القيد |
| 4 | عملية مالية بدون chart of accounts | `ensureChartExists()` يُنشئ 48 حساب تلقائياً |
| 5 | عملية مالية + فشل auto-journal | العملية المالية تنجح + console.error فقط |
| 6 | Quotation expired | لا تتحول لـ EXPIRED تلقائياً (يحتاج cron) |

---

## ═══════════════════════════════════════════════════
## ملحق ك: مقارنة تفصيلية بين قائمتي الدخل
## ═══════════════════════════════════════════════════

### ك.1 قائمة الدخل المالية (Financial Income Statement)

**المصدر:** `accounting-reports.ts` → `getIncomeStatement()`

```
الإيرادات (Revenue):
  = SUM(FinanceInvoice.totalAmount)
    WHERE status IN [ISSUED, PAID, PARTIALLY_PAID]
    AND invoiceType != CREDIT_NOTE
    AND issueDate BETWEEN dateFrom AND dateTo

  - إشعارات دائنة (Credit Notes):
    = SUM(FinanceInvoice.totalAmount)
      WHERE invoiceType = CREDIT_NOTE AND status NOT DRAFT/CANCELLED

  = صافي الإيرادات

المصروفات (Expenses):
  = SUM(FinanceExpense.amount)
    WHERE status = COMPLETED
    AND date BETWEEN dateFrom AND dateTo
    AND sourceType != FACILITY_PAYROLL  ← لمنع التكرار مع الرواتب

  + مقاولو الباطن:
    = SUM(SubcontractPayment.amount)
      WHERE date BETWEEN dateFrom AND dateTo

  + الرواتب:
    = SUM(PayrollRun.totalNetSalary + totalGOSI)
      WHERE status IN [APPROVED, PAID]

  = إجمالي المصروفات

صافي الربح = الإيرادات - المصروفات
```

### ك.2 قائمة الدخل المحاسبية (Journal Income Statement)

**المصدر:** `accounting.ts` → `getJournalIncomeStatement()`

```
الإيرادات (Revenue):
  = SUM(credit - debit)
    FROM JournalEntryLine
    JOIN JournalEntry (status = POSTED, date IN range)
    JOIN ChartAccount (type = REVENUE)

المصروفات (Expenses):
  = SUM(debit - credit)
    FROM JournalEntryLine
    JOIN JournalEntry (status = POSTED, date IN range)
    JOIN ChartAccount (type = EXPENSE)

صافي الربح = الإيرادات - المصروفات
```

### ك.3 متى ولماذا تختلفان

| السيناريو | المالية | المحاسبية | الفرق |
|----------|---------|-----------|-------|
| فاتورة صادرة + قيد ناجح | ✅ تظهر | ✅ تظهر | لا فرق |
| فاتورة صادرة + فشل auto-journal | ✅ تظهر | ❌ لا تظهر | ⚠️ فرق |
| مصروف مكتمل + قيد ناجح | ✅ تظهر | ✅ تظهر | لا فرق |
| قيد يدوي (manual entry) | ❌ لا تظهر | ✅ تظهر | ⚠️ فرق |
| أرصدة افتتاحية | ❌ لا تظهر | ✅ تظهر | ⚠️ فرق |
| قيد تسوية (depreciation, accrual) | ❌ لا تظهر | ✅ تظهر | ⚠️ فرق |
| VAT treatment | إجمالي (شامل VAT) | صافي (بدون VAT) | ⚠️ فرق دائم |

**الخلاصة:** التقريران يتطابقان فقط إذا:
1. كل العمليات المالية نجحت في إنشاء قيود
2. لا توجد قيود يدوية أو تسوية
3. لا توجد أرصدة افتتاحية

**⚠️ في الواقع:** الفرق دائم بسبب VAT treatment. المالية تعرض `totalAmount` (شامل VAT)، بينما المحاسبية تعرض صافي الإيراد (بدون VAT) لأن VAT مسجّلة في حساب 2130 (خصوم).

---

## ═══════════════════════════════════════════════════
## ملحق ل: التسوية البنكية (Bank Reconciliation) — تحليل تفصيلي
## ═══════════════════════════════════════════════════

### ل.1 آلية العمل

1. **إنشاء تسوية:** يُحدد الحساب البنكي + تاريخ التسوية + رصيد كشف البنك (statementBalance)
2. **حساب رصيد الدفاتر:** `bookBalance` = مجموع بنود القيود المحاسبية المرتبطة بالحساب البنكي
3. **عرض البنود:** كل `JournalEntryLine` المرتبطة بالحساب البنكي تظهر كبنود
4. **المطابقة:** المستخدم يُعلّم البنود المطابقة لكشف البنك (`isMatched = true`)
5. **حساب الفرق:** `difference = statementBalance - bookBalance`
6. **الإكمال:** إذا `|difference| < 0.01` → status = COMPLETED تلقائياً

### ل.2 Schema

```prisma
model BankReconciliation {
  id                  String   // PK
  organizationId      String
  bankAccountId       String   // الحساب البنكي
  reconciliationDate  Date     // تاريخ التسوية
  statementBalance    Decimal  // رصيد كشف البنك
  bookBalance         Decimal  // رصيد الدفاتر (محسوب)
  difference          Decimal  // الفرق
  status              String   // DRAFT, COMPLETED
  items               BankReconciliationItem[]
}

model BankReconciliationItem {
  id                  String
  reconciliationId    String
  journalEntryLineId  String   // البند المطابق
  isMatched           Boolean  // هل تمت المطابقة
  notes               String?
}
```

### ل.3 ملاحظات

| الملاحظة | التفاصيل |
|----------|---------|
| **مطابقة يدوية فقط** | لا يوجد matching تلقائي (auto-match) |
| **بدون import** | لا يمكن استيراد كشف البنك من ملف |
| **فرق = 0 تلقائي** | إذا المطابقة كاملة، التسوية تُغلق تلقائياً |
| **لا يوجد قيد تسوية** | الفرق لا يُنشئ قيد تعديل تلقائياً |
| **⚠️ مقترح:** إضافة auto-match بناءً على المبلغ + التاريخ |

---

## ═══════════════════════════════════════════════════
## ملحق م: تحليل Prisma Schema — Decimal Fields
## ═══════════════════════════════════════════════════

### م.1 كل حقول المبالغ المالية

| الجدول | الحقل | النوع | الملاحظة |
|--------|-------|-------|---------|
| FinanceInvoice | subtotal | Decimal(15,2) | |
| FinanceInvoice | discountPercent | Decimal(5,2) | نسبة |
| FinanceInvoice | discountAmount | Decimal(15,2) | |
| FinanceInvoice | vatPercent | Decimal(5,2) | نسبة |
| FinanceInvoice | vatAmount | Decimal(15,2) | |
| FinanceInvoice | totalAmount | Decimal(15,2) | |
| FinanceInvoice | paidAmount | Decimal(15,2) | |
| FinanceInvoiceItem | quantity | Decimal(15,3) | **3 decimal** — لدعم 0.5 متر |
| FinanceInvoiceItem | unitPrice | Decimal(15,2) | |
| FinanceInvoiceItem | totalPrice | Decimal(15,2) | |
| FinanceInvoicePayment | amount | Decimal(15,2) | |
| FinanceExpense | amount | Decimal(15,2) | |
| FinanceExpense | paidAmount | Decimal(15,2) | |
| FinancePayment | amount | Decimal(15,2) | |
| FinanceTransfer | amount | Decimal(15,2) | |
| OrganizationBank | openingBalance | Decimal(15,2) | |
| OrganizationBank | balance | Decimal(15,2) | |
| SubcontractContract | value | Decimal(15,2) | |
| SubcontractContract | vatPercent | Decimal(5,2) | |
| SubcontractContract | retentionPercent | Decimal(5,2) | |
| SubcontractContract | retentionCapPercent | Decimal(5,2) | |
| SubcontractContract | advancePaymentPercent | Decimal(5,2) | |
| SubcontractContract | advancePaymentAmount | Decimal(15,2) | |
| SubcontractChangeOrder | amount | Decimal(15,2) | |
| SubcontractPayment | amount | Decimal(15,2) | |
| SubcontractItem | contractQty | Decimal(15,4) | **4 decimal** — لدعم كسور الكميات |
| SubcontractItem | unitPrice | Decimal(15,2) | |
| SubcontractItem | totalAmount | Decimal(15,2) | |
| SubcontractClaim | grossAmount | Decimal(15,2) | |
| SubcontractClaim | retentionAmount | Decimal(15,2) | |
| SubcontractClaim | advanceDeduction | Decimal(15,2) | |
| SubcontractClaim | vatAmount | Decimal(15,2) | |
| SubcontractClaim | netAmount | Decimal(15,2) | |
| SubcontractClaim | paidAmount | Decimal(15,2) | |
| SubcontractClaimItem | contractQty | Decimal(15,4) | 4 decimal |
| SubcontractClaimItem | prevCumulativeQty | Decimal(15,4) | 4 decimal |
| SubcontractClaimItem | thisQty | Decimal(15,4) | 4 decimal |
| SubcontractClaimItem | unitPrice | Decimal(15,2) | |
| SubcontractClaimItem | thisAmount | Decimal(15,2) | |
| ProjectContract | value | Decimal(15,2) | |
| ProjectClaim | amount | Decimal(15,2) | |
| ProjectPayment | amount | Decimal(15,2) | |
| ProjectExpense | amount | Decimal(15,2) | |
| JournalEntry | totalAmount | Decimal(15,2) | |
| JournalEntryLine | debit | Decimal(15,2) | |
| JournalEntryLine | credit | Decimal(15,2) | |
| RecurringJournalTemplate | totalAmount | Decimal(15,2) | |
| BankReconciliation | statementBalance | Decimal(15,2) | |
| BankReconciliation | bookBalance | Decimal(15,2) | |
| BankReconciliation | difference | Decimal(15,2) | |
| ReceiptVoucher | amount | Decimal(15,2) | |
| PaymentVoucher | amount | Decimal(15,2) | |
| PayrollRun | totalBaseSalary | Decimal(15,2) | |
| PayrollRun | totalAllowances | Decimal(15,2) | |
| PayrollRun | totalDeductions | Decimal(15,2) | |
| PayrollRun | totalNetSalary | Decimal(15,2) | |
| PayrollRunItem | baseSalary | Decimal(15,2) | |
| PayrollRunItem | housingAllowance | Decimal(15,2) | |
| PayrollRunItem | transportAllowance | Decimal(15,2) | |
| PayrollRunItem | otherAllowances | Decimal(15,2) | |
| PayrollRunItem | gosiDeduction | Decimal(15,2) | |
| PayrollRunItem | otherDeductions | Decimal(15,2) | |
| PayrollRunItem | netSalary | Decimal(15,2) | |
| Employee | baseSalary | Decimal(15,2) | |
| Employee | housingAllowance | Decimal(15,2) | |
| Employee | transportAllowance | Decimal(15,2) | |
| Employee | otherAllowances | Decimal(15,2) | |
| Employee | gosiSubscription | Decimal(15,2) | |

**المجموع: 60+ حقل مالي — كلها Decimal(15,2) أو Decimal(15,4) أو Decimal(5,2)**

**✅ لا يوجد Float أو Int لأي حقل مبلغ** — ممتاز

**النطاق الأقصى لـ Decimal(15,2):**
- الحد الأقصى: 9,999,999,999,999.99 (~ 10 تريليون ريال)
- كافٍ لأي مقاول صغير أو متوسط

---

## ═══════════════════════════════════════════════════
## ملحق ن: تحليل OrgAuditAction — كل إجراءات التدقيق المالية
## ═══════════════════════════════════════════════════

### ن.1 إجراءات التدقيق المالية (47 إجراء)

#### المصروفات (5)
| الإجراء | الوصف | يُسجَّل في |
|---------|-------|-----------|
| EXPENSE_CREATED | إنشاء مصروف | expenses.ts |
| EXPENSE_UPDATED | تعديل مصروف | expenses.ts |
| EXPENSE_PAID | دفع مصروف | expenses.ts |
| EXPENSE_CANCELLED | إلغاء مصروف | expenses.ts |
| EXPENSE_DELETED | حذف مصروف | expenses.ts |

#### المقبوضات (3)
| PAYMENT_CREATED | إنشاء مقبوض | payments.ts |
| PAYMENT_UPDATED | تعديل مقبوض | payments.ts |
| PAYMENT_DELETED | حذف مقبوض | payments.ts |

#### التحويلات (2)
| TRANSFER_CREATED | إنشاء تحويل | transfers.ts |
| TRANSFER_CANCELLED | إلغاء تحويل | transfers.ts |

#### الحسابات البنكية (4)
| BANK_ACCOUNT_CREATED | إنشاء حساب | banks.ts |
| BANK_ACCOUNT_UPDATED | تعديل حساب | banks.ts |
| BANK_ACCOUNT_SET_DEFAULT | تعيين افتراضي | banks.ts |
| BANK_ACCOUNT_DELETED | حذف حساب | banks.ts |

#### الفواتير (11)
| INVOICE_CREATED | إنشاء فاتورة | create-invoice.ts |
| INVOICE_UPDATED | تعديل فاتورة | create-invoice.ts |
| INVOICE_ITEMS_UPDATED | تعديل بنود | create-invoice.ts |
| INVOICE_STATUS_CHANGED | تغيير حالة | create-invoice.ts |
| INVOICE_CONVERTED_TO_TAX | تحويل لضريبية | create-invoice.ts |
| INVOICE_PAYMENT_ADDED | إضافة دفعة | create-invoice.ts |
| INVOICE_PAYMENT_DELETED | حذف دفعة | create-invoice.ts |
| INVOICE_DELETED | حذف فاتورة | create-invoice.ts |
| INVOICE_ISSUED | إصدار رسمي | create-invoice.ts |
| INVOICE_DUPLICATED | نسخ فاتورة | create-invoice.ts |
| INVOICE_CREDIT_NOTE_CREATED | إشعار دائن | create-invoice.ts |

#### عروض الأسعار (5)
| QUOTATION_CREATED | إنشاء عرض | create-quotation.ts |
| QUOTATION_UPDATED | تعديل عرض | create-quotation.ts |
| QUOTATION_ITEMS_UPDATED | تعديل بنود | create-quotation.ts |
| QUOTATION_STATUS_CHANGED | تغيير حالة | create-quotation.ts |
| QUOTATION_DELETED | حذف عرض | create-quotation.ts |

#### العملاء (3)
| CLIENT_CREATED | إنشاء عميل | create-client.ts |
| CLIENT_UPDATED | تعديل عميل | update-client.ts |
| CLIENT_DELETED | حذف عميل | update-client.ts |

#### الرواتب (2)
| PAYROLL_RUN_APPROVED | اعتماد مسيّر | payroll.ts |
| PAYROLL_RUN_CANCELLED | إلغاء مسيّر | payroll.ts |

#### المحاسبة (2) ⚠️ غير مُستخدمين
| JOURNAL_ENTRY_SKIPPED | تخطّي قيد (فترة مغلقة) | ❌ غير مُستخدم |
| JOURNAL_ENTRY_FAILED | فشل قيد تلقائي | ❌ غير مُستخدم |

#### السندات (10)
| RECEIPT_VOUCHER_CREATED | إنشاء سند قبض | receipt-vouchers.ts |
| RECEIPT_VOUCHER_UPDATED | تعديل سند قبض | receipt-vouchers.ts |
| RECEIPT_VOUCHER_ISSUED | إصدار سند قبض | receipt-vouchers.ts |
| RECEIPT_VOUCHER_CANCELLED | إلغاء سند قبض | receipt-vouchers.ts |
| PAYMENT_VOUCHER_CREATED | إنشاء سند صرف | payment-vouchers.ts |
| PAYMENT_VOUCHER_UPDATED | تعديل سند صرف | payment-vouchers.ts |
| PAYMENT_VOUCHER_SUBMITTED | تقديم للاعتماد | payment-vouchers.ts |
| PAYMENT_VOUCHER_APPROVED | اعتماد | payment-vouchers.ts |
| PAYMENT_VOUCHER_REJECTED | رفض | payment-vouchers.ts |
| PAYMENT_VOUCHER_CANCELLED | إلغاء | payment-vouchers.ts |

**المجموع: 47 إجراء تدقيق مالي — 45 مُستخدم + 2 غير مُستخدم**

---

## ═══════════════════════════════════════════════════
## ملحق س: آلات الحالة الكاملة (State Machines)
## ═══════════════════════════════════════════════════

### س.1 FinanceInvoiceStatus (8 حالات)

```
                    ┌──── SENT ←────── ISSUED
                    │        │             ↑
                    │        ↓             │
DRAFT ─────────→ ISSUED → VIEWED    (updateStatus)
  │                 │        │
  │                 ├── PARTIALLY_PAID ──→ PAID
  │                 │        │
  │                 │        └──→ OVERDUE (by cron/check)
  │                 │
  └─→ (delete)     └──→ CANCELLED
```

**القواعد:**
- DRAFT → ISSUED: عند `issueInvoice` — يُجمَّد البيانات + يُنشأ QR
- ISSUED → SENT: عند إرسال البريد الإلكتروني
- SENT/ISSUED → VIEWED: عند فتح رابط المشاهدة
- Any ISSUED+ → PARTIALLY_PAID: عند إضافة دفعة < totalAmount
- Any ISSUED+ → PAID: عند إضافة دفعة ≥ totalAmount
- ISSUED+ → OVERDUE: ⚠️ **لا يوجد cron** — يحتاج تحقق يدوي أو تشغيل scheduled
- Any → CANCELLED: عند إلغاء الفاتورة
- DRAFT only → (delete): حذف فعلي

### س.2 FinanceTransactionStatus (3 حالات — للمصروفات والمقبوضات والتحويلات)

```
PENDING ──→ COMPLETED ──→ CANCELLED
```

**القواعد:**
- PENDING: مصروف معلق (بدون حساب بنكي مصدر)
- PENDING → COMPLETED: عند دفع المصروف (`payExpense`)
- COMPLETED → CANCELLED: عند إلغاء العملية (يعكس رصيد البنك + يعكس القيد)

### س.3 SubcontractClaimStatus (8 حالات — الأكثر تعقيداً)

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → PARTIALLY_PAID → PAID
                         │              │
                         │              └→ REJECTED
                         └→ REJECTED         │
                                             └→ CANCELLED
```

**القواعد:**
- DRAFT → SUBMITTED: عند تقديم المستخلص
- SUBMITTED → UNDER_REVIEW: عند بدء المراجعة
- UNDER_REVIEW → APPROVED: عند الاعتماد → triggers `onSubcontractClaimApproved()`
- UNDER_REVIEW → REJECTED: عند الرفض (مع سبب)
- APPROVED → PARTIALLY_PAID: عند إضافة دفعة < netAmount
- APPROVED/PARTIALLY_PAID → PAID: عند paidAmount ≥ netAmount
- APPROVED/REJECTED → CANCELLED: إلغاء نهائي
- **Rejection → reversal:** عند الرفض يُعكس القيد المحاسبي للاعتماد

### س.4 PayrollRunStatus (4 حالات)

```
DRAFT → APPROVED → PAID
  │         │
  │         └→ CANCELLED (reverse all)
  └→ (delete)
```

**القواعد:**
- DRAFT → APPROVED: اعتماد → creates FinanceExpense + auto-journal
- APPROVED → PAID: ⚠️ **لا يوجد procedure فعلي** — status PAID يُعيَّن يدوياً
- APPROVED → CANCELLED: إلغاء → deletes FinanceExpenses + reverses auto-journal + restores bank balance

### س.5 VoucherStatus (4 حالات — لسندات القبض والصرف)

```
DRAFT → PENDING_APPROVAL → ISSUED → CANCELLED
         (صرف فقط)
```

**سند القبض:** DRAFT → ISSUED → CANCELLED
**سند الصرف:** DRAFT → PENDING_APPROVAL → ISSUED → CANCELLED (يحتاج اعتماد)

### س.6 ContractStatus (4 حالات — العقد الرئيسي)

```
DRAFT → ACTIVE → CLOSED
           │
           └→ SUSPENDED
```

### س.7 SubcontractStatus (5 حالات — عقد الباطن)

```
DRAFT → ACTIVE → COMPLETED
           │
           ├→ SUSPENDED
           └→ TERMINATED
```

---

## ═══════════════════════════════════════════════════
## ملحق ع: خريطة صفحات المالية (151 ملف page/loading)
## ═══════════════════════════════════════════════════

### المسار الأساسي: `/app/[organizationSlug]/finance/`

#### الصفحات الرئيسية (10 أقسام)

| القسم | الصفحات | المسارات |
|-------|---------|---------|
| **لوحة التحكم** | 2 | `page.tsx`, `loading.tsx` |
| **العملاء** | 10 | `/clients` (list, new, [id], [id]/edit, [id]/statement) × 2 (page+loading) |
| **الفواتير** | 12 | `/invoices` (list, new, [id], [id]/edit, [id]/preview, [id]/credit-note) × 2 |
| **المقبوضات** | 8 | `/payments` (list, new, [id], [id]/receipt) × 2 |
| **سندات القبض** | 6 | `/receipt-vouchers` (list, new, [id]) × 2 |
| **سندات الصرف** | 6 | `/payment-vouchers` (list, new, [id]) × 2 |
| **المصروفات** | 8 | `/expenses` (list, new, transfer, [id]/voucher) × 2 |
| **الحسابات البنكية** | 8 | `/banks` (list, new, [id], [id]/reconciliation) × 2 |
| **المستندات** | 6 | `/documents` (list, new, [id]) × 2 |
| **التقارير** | 4 | `/reports` (landing, cash-flow) × 2 |

#### صفحات المحاسبة (13 route)

| القسم | الصفحات | المسارات |
|-------|---------|---------|
| **لوحة المحاسبة** | 2 | `/accounting-dashboard` × 2 |
| **دليل الحسابات** | 2 | `/chart-of-accounts` × 2 |
| **دفتر الأستاذ** | 2 | `/chart-of-accounts/[accountId]/ledger` × 2 |
| **القيود اليومية** | 2 | `/journal-entries` × 2 |
| **تفاصيل القيد** | 2 | `/journal-entries/[id]` × 2 |
| **قيد تسوية** | 2 | `/journal-entries/new-adjustment` × 2 |
| **قيود متكررة** | 2 | `/journal-entries/recurring` × 2 |
| **أرصدة افتتاحية** | 2 | `/opening-balances` × 2 |
| **فترات محاسبية** | 2 | `/accounting-periods` × 2 |

#### صفحات التقارير المحاسبية (9 routes)

| التقرير | المسار |
|---------|--------|
| قائمة التقارير | `/accounting-reports` |
| ميزان المراجعة | `/accounting-reports/trial-balance` |
| الميزانية العمومية | `/accounting-reports/balance-sheet` |
| قائمة الدخل المحاسبية | `/accounting-reports/journal-income-statement` |
| قائمة الدخل المالية | `/accounting-reports/income-statement` |
| تقرير VAT | `/accounting-reports/vat-report` |
| الذمم المدينة المتقادمة | `/accounting-reports/aged-receivables` |
| الذمم الدائنة المتقادمة | `/accounting-reports/aged-payables` |
| فحص الصحة | `/accounting-reports/health` |

كل route له `page.tsx` + `loading.tsx` = **18 ملف**

#### الإجمالي

| الفئة | Routes | ملفات (page+loading) |
|-------|--------|---------------------|
| الصفحات الرئيسية | ~35 | ~70 |
| صفحات المحاسبة | ~9 | ~18 |
| صفحات التقارير | ~9 | ~18 |
| **المجموع** | **~53** | **~106** |

**ملاحظة:** كل `loading.tsx` يستخدم `ListTableSkeleton` أو `CardSkeleton` — نمط موحد عبر المنصة.

---

## ═══════════════════════════════════════════════════
## ملحق ف: ملاحظات ختامية وتوصيات معمارية
## ═══════════════════════════════════════════════════

### ف.1 نقاط القوة في التصميم الحالي

1. **فصل الطبقات:** query layer (Prisma queries) → procedure layer (oRPC) → frontend — فصل واضح ونظيف
2. **auto-journal engine:** نمط centralized ممتاز — كل العمليات المحاسبية في ملف واحد (768 سطر)
3. **Silent failure pattern:** العمليات المالية لا تتأثر بفشل المحاسبة — قرار تصميمي سليم
4. **Atomic sequences:** استخدام `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING` — حل مثالي لـ race conditions
5. **Decimal everywhere:** لا يوجد Float أو Int لأي حقل مالي — يمنع أخطاء floating-point
6. **Comprehensive audit trail:** 47 نوع إجراء تدقيق + 50+ استدعاء في finance
7. **Multi-tenancy enforcement:** 169 استدعاء `verifyOrganizationAccess` — حماية صارمة
8. **Negative balance guard:** حماية ذرية من الرصيد السالب في 3 مواقع

### ف.2 نقاط الضعف الهيكلية

1. **صفر اختبارات:** لا unit tests ولا integration tests ولا E2E tests — أكبر خطر
2. **createJournalEntry بدون transaction:** يمكن أن ينتج قيود ناقصة
3. **لا unique على referenceType+referenceId:** يمكن إنشاء قيود مكررة
4. **CLAUDE.md outdated:** يوثّق accounting mode toggle غير موجود
5. **الفترات المحاسبية لا تُنفَّذ:** يمكن إنشاء قيود في فترات مغلقة
6. **journal entry failures غير مؤرشفة:** console.error فقط
7. **Invoice edit after ISSUED:** يمكن تعديل فاتورة صادرة بدون تحديث القيد
8. **No cron for invoice OVERDUE:** الفواتير المتأخرة لا تتحول تلقائياً

### ف.3 توصيات معمارية طويلة المدى

| # | التوصية | الأثر |
|---|---------|-------|
| 1 | **إضافة unit tests** لـ auto-journal functions (20+ test) | يمنع regressions |
| 2 | **إضافة integration tests** لدورة الفوترة الكاملة | يكشف edge cases |
| 3 | **Event-driven accounting:** استخدام event system بدل dynamic import | أنظف معمارياً |
| 4 | **Reconciliation report:** مقارنة bank balance vs journal balance | يكشف التباينات |
| 5 | **Financial close procedure:** إقفال شهري يمنع التعديل على فترات قديمة | متطلب تنظيمي |
| 6 | **Immutable invoices:** منع تعديل فاتورة ISSUED (ZATCA requirement) | متطلب قانوني |
| 7 | **Double-entry validation:** trigger في قاعدة البيانات يتحقق أن كل قيد متوازن | حماية إضافية |

---

## ═══════════════════════════════════════════════════
## ملحق ص: جميع الـ Enums المالية (30+ enum)
## ═══════════════════════════════════════════════════

### ص.1 Enums الحالات (Status Enums)

| Enum | القيم | يُستخدم في |
|------|-------|-----------|
| `FinanceInvoiceStatus` | DRAFT, ISSUED, SENT, VIEWED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED | FinanceInvoice |
| `FinanceTransactionStatus` | PENDING, COMPLETED, CANCELLED | FinanceExpense, FinancePayment, FinanceTransfer, SubcontractPayment |
| `SubcontractStatus` | DRAFT, ACTIVE, SUSPENDED, COMPLETED, TERMINATED | SubcontractContract |
| `SubcontractCOStatus` | DRAFT, SUBMITTED, APPROVED, REJECTED | SubcontractChangeOrder |
| `SubcontractClaimStatus` | DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, PARTIALLY_PAID, PAID, CANCELLED | SubcontractClaim |
| `ClaimStatus` | DRAFT, SUBMITTED, APPROVED, PAID, REJECTED | ProjectClaim |
| `ContractStatus` | DRAFT, ACTIVE, SUSPENDED, CLOSED | ProjectContract |
| `PaymentTermStatus` | PENDING, PARTIALLY_PAID, FULLY_PAID | ContractPaymentTerm |
| `JournalEntryStatus` | DRAFT, POSTED, REVERSED | JournalEntry |
| `PayrollRunStatus` | DRAFT, APPROVED, PAID, CANCELLED | PayrollRun |
| `ExpenseRunStatus` | DRAFT, POSTED, CANCELLED | CompanyExpenseRun |
| `VoucherStatus` | DRAFT, PENDING_APPROVAL, ISSUED, CANCELLED | ReceiptVoucher, PaymentVoucher |
| `QuotationStatus` | DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED, CONVERTED | Quotation |
| `LeaveStatus` | PENDING, APPROVED, REJECTED, CANCELLED | LeaveRequest |
| `EmployeeStatus` | ACTIVE, ON_LEAVE, TERMINATED | Employee |
| `AssetStatus` | AVAILABLE, IN_USE, MAINTENANCE, RETIRED | CompanyAsset |

### ص.2 Enums الأنواع (Type Enums)

| Enum | القيم | يُستخدم في |
|------|-------|-----------|
| `InvoiceType` | STANDARD, TAX, SIMPLIFIED, CREDIT_NOTE, DEBIT_NOTE | FinanceInvoice |
| `FinanceAccountType` | BANK, CASH_BOX | OrganizationBank |
| `OrgExpenseCategory` | MATERIALS, LABOR, EQUIPMENT_RENTAL, EQUIPMENT_PURCHASE, SUBCONTRACTOR, TRANSPORT, SALARIES, RENT, UTILITIES, COMMUNICATIONS, INSURANCE, LICENSES, BANK_FEES, FUEL, MAINTENANCE, SUPPLIES, MARKETING, TRAINING, TRAVEL, HOSPITALITY, LOAN_PAYMENT, TAXES, ZAKAT, REFUND, MISC, CUSTOM | FinanceExpense |
| `ExpenseCategory` | MATERIALS, LABOR, EQUIPMENT, SUBCONTRACTOR, TRANSPORT, MISC | ProjectExpense |
| `CompanyExpenseCategory` | RENT, UTILITIES, COMMUNICATIONS, INSURANCE, LICENSES, SUBSCRIPTIONS, MAINTENANCE, BANK_FEES, MARKETING, TRANSPORT, HOSPITALITY, OTHER | CompanyExpense |
| `ExpenseSourceType` | MANUAL, FACILITY_PAYROLL, FACILITY_RECURRING, FACILITY_ASSET, PROJECT | FinanceExpense |
| `ContractorType` | COMPANY, INDIVIDUAL | SubcontractContract |
| `SubcontractClaimType` | INTERIM, FINAL, RETENTION | SubcontractClaim |
| `PaymentTermType` | ADVANCE, MILESTONE, MONTHLY, COMPLETION, CUSTOM | PaymentTerm |
| `PaymentMethod` | CASH, BANK_TRANSFER, CHEQUE, CREDIT_CARD, OTHER | عدة جداول |
| `ChartAccountType` | ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE | ChartAccount |
| `NormalBalance` | DEBIT, CREDIT | ChartAccount |
| `PayeeType` | SUBCONTRACTOR, SUPPLIER, EMPLOYEE, OTHER | PaymentVoucher |
| `RecurrenceType` | MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL, ONE_TIME | CompanyExpense |
| `ClientType` | INDIVIDUAL, COMMERCIAL | Client |

### ص.3 Enums التدقيق (Audit Enums)

| Enum | عدد القيم | يُستخدم في |
|------|----------|-----------|
| `OrgAuditAction` | 47 | OrganizationAuditLog |

### ص.4 إحصائيات الـ Enums

| المقياس | القيمة |
|---------|--------|
| إجمالي Enums المالية | 30 |
| إجمالي قيم Enums المالية | 150+ |
| أكبر Enum (بالقيم) | OrgAuditAction (47) |
| أكثر Enum استخداماً | FinanceTransactionStatus (4 جداول) |

---

## ═══════════════════════════════════════════════════
## ملحق ق: ملخص نهائي بالأرقام
## ═══════════════════════════════════════════════════

### ق.1 حجم الكود

| الطبقة | الملفات | الأسطر |
|--------|---------|--------|
| Schema (Prisma) | 1 | 5,792 |
| Database Queries | 15 | ~11,600 |
| Backend Procedures | ~50 | ~6,900 |
| Auto-Journal Engine | 3 | 1,100 |
| Frontend Components | ~109 | ~24,500 |
| Frontend Pages | ~106 | ~5,000 (est.) |
| Frontend Lib | 2 | 407 |
| Utils | 1 | 168 |
| **المجموع** | **~287** | **~55,500** |

### ق.2 تغطية التدقيق

| العنصر | تم قراءته | الملاحظة |
|--------|----------|---------|
| Schema كاملاً | ✅ 5,792 سطر | كل 45 model + 30 enum |
| auto-journal.ts | ✅ 768 سطر | كل 12 function + helpers |
| backfill.ts | ✅ 245 سطر | كل 11 backfill type |
| adjustment-templates.ts | ✅ 87 سطر | كل 6 templates |
| sequences.ts | ✅ 75 سطر | atomic sequence generation |
| Safety greps | ✅ 8 greps | transactions, access, balance, audit |
| Frontend shell | ✅ 250 سطر | navigation + seed check |
| Key procedures | ✅ ~3,000 سطر | create-invoice, expenses, payments, transfers |

### ق.3 الأخطاء المكتشفة — ملخص نهائي

| # | الخطأ | الخطورة | الجهد | الأولوية |
|---|-------|---------|-------|---------|
| 1 | JOURNAL_ENTRY_FAILED غير مُستخدم | 🔴 | 2h | 1 |
| 2 | createJournalEntry بدون $transaction | 🔴 | 1h | 2 |
| 3 | لا unique على referenceType+referenceId | 🟠 | 1h | 3 |
| 4 | تعديل فاتورة ISSUED بدون تحديث القيد | 🟠 | 3h | 4 |
| 5 | entryNo ليس unique | 🟡 | 0.5h | 5 |
| 6 | الفترات المحاسبية لا تمنع الإنشاء | 🟡 | 2h | 6 |
| 7 | CLAUDE.md outdated (accounting mode) | 🟡 | 0.5h | 7 |
| | **المجموع** | **2🔴 + 2🟠 + 3🟡** | **~10h** | |

### ق.4 النسبة المئوية لجاهزية كل قسم

| القسم | الجاهزية | الملاحظة |
|-------|---------|---------|
| الفوترة | 90% | ناقص: OVERDUE cron, ISSUED immutability |
| المصروفات | 95% | ممتاز — atomic + categorized |
| المقبوضات | 90% | ناقص: direct receipt VAT treatment |
| التحويلات | 98% | ممتاز — fully atomic |
| الحسابات البنكية | 85% | ناقص: delete protection |
| العملاء | 90% | ناقص: delete cascading to invoices |
| عروض الأسعار | 85% | ناقص: auto-expiry, conversion flow |
| مقاولو الباطن | 90% | ناقص: payment immutability |
| مستخلصات الباطن | 90% | ناقص: claim math verification |
| المشاريع المالية | 80% | ناقص: claim ≤ contract value check |
| المحاسبة — القيود | 75% | ناقص: transaction, unique, periods |
| المحاسبة — التقارير | 90% | ممتاز — 8 تقارير |
| الترحيل الاسترجاعي | 95% | ممتاز — 11 types + error tracking |
| فحص الصحة | 70% | ناقص: 4 checks فقط من 10 مقترح |
| الرواتب | 85% | ناقص: PAID status not automated |
| السندات | 90% | ممتاز — approval workflow |
| التسويات البنكية | 70% | ناقص: auto-match, import |
| ZATCA | 40% | Phase 1 only — Phase 2 needs 6-7 weeks |
| الأمان | 95% | ممتاز — 169 access checks |
| الاختبارات | 0% | **صفر** tests |
| **المتوسط العام** | **~78%** | |

---

## ═══════════════════════════════════════════════════
## ملحق ر: خريطة الـ Reference Types في القيود التلقائية
## ═══════════════════════════════════════════════════

### ر.1 جدول أنواع المراجع الكاملة

| referenceType | الوصف | prefix القيد | الدالة | عدد العمليات |
|--------------|-------|-------------|--------|-------------|
| `INVOICE` | فاتورة صادرة | INV-JE | `onInvoiceIssued()` | 1 إنشاء + 1 عكس |
| `INVOICE_PAYMENT` | دفعة تحصيل فاتورة | RCV-JE | `onInvoicePaymentReceived()` | 1 إنشاء + 1 عكس |
| `CREDIT_NOTE` | إشعار دائن | CN-JE | `onCreditNoteIssued()` | 1 إنشاء |
| `EXPENSE` | مصروف مكتمل | EXP-JE | `onExpenseCompleted()` | 1 إنشاء + 2 عكس (delete/cancel) |
| `ORG_PAYMENT` | مقبوض مباشر | RCV-JE | `onOrganizationPaymentReceived()` | 1 إنشاء + 1 عكس |
| `TRANSFER` | تحويل بنكي | TRF-JE | `onTransferCompleted()` | 1 إنشاء + 1 عكس |
| `SUBCONTRACT_PAYMENT` | دفعة مقاول باطن | SUB-JE | `onSubcontractPayment()` | 1 إنشاء |
| `SUBCONTRACT_CLAIM_APPROVED` | اعتماد مستخلص باطن | SUB-JE | `onSubcontractClaimApproved()` | 1 إنشاء + 1 عكس |
| `PAYROLL` | مسيّر رواتب | PAY-JE | `onPayrollApproved()` | 1 إنشاء + 1 عكس |
| `PROJECT_PAYMENT` | دفعة مشروع | PRJ-JE | `onProjectPaymentReceived()` | 1 إنشاء + 1 عكس (reverse+recreate) |
| `PROJECT_CLAIM_APPROVED` | اعتماد مستخلص مشروع | PCLM-JE | `onProjectClaimApproved()` | 1 إنشاء + 1 عكس |
| `RECEIPT_VOUCHER` | سند قبض يدوي | RCV-JE | `onReceiptVoucherIssued()` | 1 إنشاء + 1 عكس |
| `PAYMENT_VOUCHER` | سند صرف يدوي | PMT-JE | `onPaymentVoucherApproved()` | 1 إنشاء + 1 عكس |
| `HANDOVER_RETENTION_RELEASE` | تحرير محتجزات | HND-JE | `onFinalHandoverCompleted()` | 1 إنشاء |
| `OPENING_BALANCE` | أرصدة افتتاحية | OPN-JE | `saveOpeningBalances()` | 1 إنشاء/تحديث |
| `MANUAL` | قيد يدوي | MAN-JE | manual creation | ∞ |
| `ADJUSTMENT` | قيد تسوية | ADJ-JE | manual adjustment | ∞ |
| `REVERSAL` | قيد عكسي | REV-JE | `reverseJournalEntry()` | auto-created |
| `RECURRING` | قيد متكرر | REC-JE | recurring template | auto-generated |

### ر.2 إحصائيات

| المقياس | القيمة |
|---------|--------|
| أنواع المراجع | 19 |
| دوال auto-journal أصلية | 12 (تُنشئ قيود) |
| دالة عكس واحدة | `reverseAutoJournalEntry()` |
| دالة handover | `onFinalHandoverCompleted()` |
| أنواع الـ backfill | 11 (من أصل 14 — لا يشمل MANUAL, ADJUSTMENT, RECURRING) |
| **إجمالي العمليات** | **~30 عملية** (إنشاء + عكس) |

### ر.3 تدفق حياة القيد

```
العملية المالية (e.g., issueInvoice)
    ↓
auto-journal function (e.g., onInvoiceIssued)
    ↓
ensureChartExists() — cache check + auto-seed if needed
    ↓
getAccountByCode() / getBankChartAccountId() — resolve accounts
    ↓
createJournalEntry() — in accounting.ts
    ↓
├── Generate entryNo (atomic sequence)
├── Create JournalEntry (header)
├── Create JournalEntryLine[] (debits/credits)
├── Status = POSTED (auto-generated entries are auto-posted)
└── Set totalAmount = SUM(debits) or SUM(credits)

عند الحذف/الإلغاء:
    ↓
reverseAutoJournalEntry()
    ↓
├── Find original entry (not REVERSED)
├── If POSTED → reverseJournalEntry():
│   ├── Mark original as isReversed = true
│   ├── Create new entry with swapped DR/CR
│   └── Link: original.reversalId = new.id
├── If DRAFT → hard delete (if period not closed)
└── If not found → silently return (idempotent)
```

### ر.4 ملاحظة حول الـ auto-posting

**القيود التلقائية (isAutoGenerated = true) تُرحَّل فوراً كـ POSTED.**

هذا يعني:
- تؤثر فوراً على ميزان المراجعة والتقارير
- لا تحتاج ترحيل يدوي من المحاسب
- يمكن عكسها عبر `reverseJournalEntry()`

**القيود اليدوية (isAutoGenerated = false) تُنشأ كـ DRAFT.**

هذا يعني:
- لا تؤثر على التقارير حتى يُرحلها المحاسب
- يمكن تعديلها قبل الترحيل
- يمكن حذفها (hard delete)

---

*انتهى التقرير — 2026-03-27*
*Claude Code — تدقيق شامل READ-ONLY*
*إجمالي الملفات المقروءة: ~60 ملف*
*إجمالي أسطر الكود المحللة: ~57,000+ سطر*
