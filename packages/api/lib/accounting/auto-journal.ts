// ══════════════════════════════════════════════════════════════════════════
// Auto-Journal Engine — Masar Accounting
// ══════════════════════════════════════════════════════════════════════════
//
// RULE: Silent failure — never break the original financial operation
// Accounting is a core part of the system — seeded automatically with every organization
//
// Complete Operations Map (28 operations):
//
// الفواتير (Invoices):
//   #1  إصدار فاتورة          → onInvoiceIssued            → DR 1120 / CR 4100 + 2130
//   #2  تحصيل فاتورة         → onInvoicePaymentReceived   → DR بنك / CR 1120
//   #3  حذف دفعة فاتورة      → reverseAutoJournalEntry    → عكس #2
//   #4  حذف فاتورة           → reverseAutoJournalEntry    → عكس #1
//   #5  إشعار دائن           → onCreditNoteIssued         → DR 4100+2130 / CR 1120
//
// المصروفات (Expenses):
//   #6  مصروف COMPLETED      → onExpenseCompleted         → DR مصروف+1150 / CR بنك
//   #7  دفع مصروف معلق      → onExpenseCompleted         → DR مصروف+1150 / CR بنك
//   #8  حذف مصروف           → reverseAutoJournalEntry    → عكس
//   #9  إلغاء مصروف         → reverseAutoJournalEntry    → عكس
//
// المقبوضات (Receipts):
//   #10 مقبوض مباشر         → onOrganizationPaymentReceived → DR بنك / CR 4300
//   #11 حذف مقبوض           → reverseAutoJournalEntry    → عكس
//
// التحويلات (Transfers):
//   #12 تحويل بنكي          → onTransferCompleted        → DR بنك2 / CR بنك1
//   #13 إلغاء تحويل         → reverseAutoJournalEntry    → عكس
//
// مقاولو الباطن (Subcontracts):
//   #14 دفعة مباشرة         → onSubcontractPayment       → DR 5200 / CR بنك
//   #15 دفعة على مستخلص     → onSubcontractPayment       → DR 2120 / CR بنك
//   #16 اعتماد مستخلص       → onSubcontractClaimApproved → DR 5200 / CR 2120
//   #17 رفض/إلغاء مستخلص   → reverseAutoJournalEntry    → عكس #16
//
// الرواتب (Payroll):
//   #18 اعتماد مسيّر        → onPayrollApproved          → DR 6100 / CR بنك + 2170
//   #19 إلغاء مسيّر         → reverseAutoJournalEntry    → عكس
//
// مصروفات الشركة (Company Expenses):
//   #20 دفع مصروف شركة     → onExpenseCompleted         → DR مصروف / CR بنك
//   #21 تعديل مصروف شركة   → reverse+recreate           → عكس + إعادة
//   #22 حذف مصروف شركة     → reverseAutoJournalEntry    → عكس
//
// المشاريع (Projects):
//   #23 دفعة مشروع         → onProjectPaymentReceived   → DR بنك / CR 1120
//   #24 تعديل دفعة مشروع   → reverse+recreate           → عكس + إعادة
//   #25 حذف دفعة مشروع     → reverseAutoJournalEntry    → عكس
//   #26 اعتماد مستخلص      → onProjectClaimApproved     → DR 1120 / CR 4100
//   #27 رفض مستخلص مشروع   → reverseAutoJournalEntry    → عكس #26
//
// السندات (Vouchers):
//   #28 سند قبض يدوي        → onReceiptVoucherIssued     → DR بنك / CR 4300
//   #29 سند صرف يدوي        → onPaymentVoucherApproved   → DR مصروف / CR بنك
//   (إلغاء سندات)           → reverseAutoJournalEntry    → عكس (يدوي فقط)
//
// لا تحتاج hooks: ProjectExpense (معلوماتي), ChangeOrders (تعديل عقد فقط)
// ══════════════════════════════════════════════════════════════════════════

import { type PrismaClient, Prisma } from "@repo/database/prisma/generated/client";
import { createJournalEntry, reverseJournalEntry, seedChartOfAccounts, createBankChartAccount, EXPENSE_CATEGORY_TO_ACCOUNT_CODE, isPeriodClosed } from "@repo/database";

const ZERO = new Prisma.Decimal(0);

// ========================================
// Helper: Ensure chart of accounts exists — cached check with 5-min TTL
// ========================================
const chartExistsCache = new Map<string, { exists: boolean; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function invalidateAccountingCache(organizationId: string) {
	chartExistsCache.delete(organizationId);
}

async function ensureChartExists(db: PrismaClient, organizationId: string): Promise<boolean> {
	const cached = chartExistsCache.get(organizationId);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.exists;
	}
	const count = await db.chartAccount.count({ where: { organizationId }, take: 1 });
	if (count > 0) {
		chartExistsCache.set(organizationId, { exists: true, timestamp: Date.now() });
		return true;
	}
	// Auto-seed chart of accounts on first financial operation
	try {
		await seedChartOfAccounts(db, organizationId);
		chartExistsCache.set(organizationId, { exists: true, timestamp: Date.now() });
		return true;
	} catch {
		// Do not cache failure — allow retry on next financial operation
		return false;
	}
}

// ========================================
// Helper: Get account by code
// ========================================
async function getAccountByCode(db: PrismaClient, organizationId: string, code: string): Promise<string | null> {
	const account = await db.chartAccount.findUnique({
		where: { organizationId_code: { organizationId, code } },
		select: { id: true },
	});
	return account?.id ?? null;
}

// ========================================
// Helper: Get bank's chart account
// ========================================
async function getBankChartAccountId(db: PrismaClient, organizationId: string, bankId: string): Promise<string | null> {
	if (bankId) {
		const bank = await db.organizationBank.findUnique({
			where: { id: bankId },
			select: { id: true, name: true, chartAccountId: true },
		});
		if (bank?.chartAccountId) return bank.chartAccountId;

		// Bank exists but has no chart account — auto-create one
		if (bank) {
			const newAccId = await createBankChartAccount(db, organizationId, bank.id, bank.name);
			if (newAccId) return newAccId;
		}
	}

	// Fallback: find first postable child of 1110 (1110 itself is not postable)
	const cashParent = await db.chartAccount.findUnique({
		where: { organizationId_code: { organizationId, code: "1110" } },
		select: { id: true, isPostable: true },
	});
	if (!cashParent) return null;
	if (cashParent.isPostable) return cashParent.id;

	const firstChild = await db.chartAccount.findFirst({
		where: { organizationId, parentId: cashParent.id, isPostable: true, isActive: true },
		orderBy: { code: "asc" },
		select: { id: true },
	});
	return firstChild?.id ?? null;
}

// ========================================
// 1. Invoice Issued → DR: Receivable / CR: Revenue + VAT
// ========================================
export async function onInvoiceIssued(db: PrismaClient, invoice: {
	id: string;
	organizationId: string;
	number: string;
	issueDate: Date;
	clientName: string;
	totalAmount: Prisma.Decimal;
	vatAmount: Prisma.Decimal;
	projectId?: string | null;
	userId?: string;
}) {
	if (!(await ensureChartExists(db, invoice.organizationId))) return;

	const receivableId = await getAccountByCode(db, invoice.organizationId, "1120");
	const revenueId = await getAccountByCode(db, invoice.organizationId, "4100");
	const vatPayableId = await getAccountByCode(db, invoice.organizationId, "2130");

	if (!receivableId || !revenueId || !vatPayableId) return;

	const netAmount = invoice.totalAmount.sub(invoice.vatAmount);
	const lines: any[] = [
		{ accountId: receivableId, debit: invoice.totalAmount, credit: ZERO, description: `فاتورة ${invoice.number} — ${invoice.clientName} | Invoice ${invoice.number} — ${invoice.clientName}`, projectId: invoice.projectId },
		{ accountId: revenueId, debit: ZERO, credit: netAmount, description: `إيراد فاتورة ${invoice.number} | Invoice revenue ${invoice.number}`, projectId: invoice.projectId },
	];

	if (invoice.vatAmount.greaterThan(0)) {
		lines.push({ accountId: vatPayableId, debit: ZERO, credit: invoice.vatAmount, description: `ضريبة فاتورة ${invoice.number} | Invoice VAT ${invoice.number}` });
	}

	await createJournalEntry(db, {
		organizationId: invoice.organizationId,
		date: invoice.issueDate,
		description: `إصدار فاتورة ${invoice.number} — ${invoice.clientName} | Invoice issued ${invoice.number} — ${invoice.clientName}`,
		referenceType: "INVOICE",
		referenceId: invoice.id,
		referenceNo: invoice.number,
		isAutoGenerated: true,
		createdById: invoice.userId,
		lines,
	});
}

// ========================================
// 2. Invoice Payment → DR: Bank / CR: Receivable
// ========================================
export async function onInvoicePaymentReceived(db: PrismaClient, payment: {
	paymentId: string;
	organizationId: string;
	invoiceId: string;
	invoiceNumber: string;
	clientName: string;
	amount: Prisma.Decimal;
	date: Date;
	sourceAccountId: string;
	projectId?: string | null;
	userId?: string;
}) {
	if (!(await ensureChartExists(db, payment.organizationId))) return;

	const bankAccId = await getBankChartAccountId(db, payment.organizationId, payment.sourceAccountId);
	const receivableId = await getAccountByCode(db, payment.organizationId, "1120");
	if (!bankAccId || !receivableId) return;

	await createJournalEntry(db, {
		organizationId: payment.organizationId,
		date: payment.date,
		description: `تحصيل دفعة — فاتورة ${payment.invoiceNumber} — ${payment.clientName} | Payment received — Invoice ${payment.invoiceNumber} — ${payment.clientName}`,
		referenceType: "INVOICE_PAYMENT",
		referenceId: payment.paymentId,
		referenceNo: payment.invoiceNumber,
		isAutoGenerated: true,
		createdById: payment.userId,
		lines: [
			{ accountId: bankAccId, debit: payment.amount, credit: ZERO, projectId: payment.projectId },
			{ accountId: receivableId, debit: ZERO, credit: payment.amount, projectId: payment.projectId },
		],
	});
}

// ========================================
// 3. Expense Completed → DR: Expense / CR: Bank
// ========================================
export async function onExpenseCompleted(db: PrismaClient, expense: {
	id: string;
	organizationId: string;
	category: string;
	amount: Prisma.Decimal;
	date: Date;
	description: string;
	sourceAccountId?: string | null;
	projectId?: string | null;
	sourceType?: string | null;
	userId?: string;
}) {
	if (!(await ensureChartExists(db, expense.organizationId))) return;

	// Skip payroll expenses — journal entry already created by onPayrollApproved
	if (expense.sourceType === "FACILITY_PAYROLL") return;

	const expenseCode = EXPENSE_CATEGORY_TO_ACCOUNT_CODE[expense.category] || "6900";
	const expenseAccId = await getAccountByCode(db, expense.organizationId, expenseCode);

	let bankAccId: string | null = null;
	if (expense.sourceAccountId) {
		bankAccId = await getBankChartAccountId(db, expense.organizationId, expense.sourceAccountId);
	} else {
		bankAccId = await getAccountByCode(db, expense.organizationId, "1110");
	}

	if (!expenseAccId || !bankAccId) return;

	// VAT-exempt categories (no input VAT to recover)
	const VAT_EXEMPT = ["SALARIES", "SALARY", "GOVERNMENT_FEES", "BANK_FEES", "FINES", "INSURANCE"];

	const lines: any[] = [];

	if (VAT_EXEMPT.includes(expense.category)) {
		// Full amount to expense account — no VAT split
		lines.push(
			{ accountId: expenseAccId, debit: expense.amount, credit: ZERO, projectId: expense.projectId },
			{ accountId: bankAccId, debit: ZERO, credit: expense.amount, projectId: expense.projectId },
		);
	} else {
		// Split: net expense + input VAT (Saudi 15%) — use Prisma.Decimal for consistency with reports
		const netAmount = expense.amount.div(new Prisma.Decimal("1.15")).toDecimalPlaces(2);
		const vatAmount = expense.amount.sub(netAmount);

		lines.push(
			{ accountId: expenseAccId, debit: netAmount, credit: ZERO, projectId: expense.projectId },
		);

		if (vatAmount.greaterThan(ZERO)) {
			const inputVatAccId = await getAccountByCode(db, expense.organizationId, "1150");
			if (inputVatAccId) {
				lines.push(
					{ accountId: inputVatAccId, debit: vatAmount, credit: ZERO, description: "ضريبة مدخلات | Input VAT" },
				);
			} else {
				// Fallback: add VAT to expense if 1150 account doesn't exist
				lines[0] = { accountId: expenseAccId, debit: expense.amount, credit: ZERO, projectId: expense.projectId };
			}
		}

		lines.push(
			{ accountId: bankAccId, debit: ZERO, credit: expense.amount, projectId: expense.projectId },
		);
	}

	await createJournalEntry(db, {
		organizationId: expense.organizationId,
		date: expense.date,
		description: `مصروف: ${expense.description} | Expense: ${expense.description}`,
		referenceType: "EXPENSE",
		referenceId: expense.id,
		isAutoGenerated: true,
		createdById: expense.userId,
		lines,
	});
}

// ========================================
// 4. Transfer → DR: Destination Bank / CR: Source Bank
// ========================================
export async function onTransferCompleted(db: PrismaClient, transfer: {
	id: string;
	organizationId: string;
	amount: Prisma.Decimal;
	date: Date;
	fromAccountId: string;
	toAccountId: string;
	description?: string;
	userId?: string;
}) {
	if (!(await ensureChartExists(db, transfer.organizationId))) return;

	const fromAccId = await getBankChartAccountId(db, transfer.organizationId, transfer.fromAccountId);
	const toAccId = await getBankChartAccountId(db, transfer.organizationId, transfer.toAccountId);
	if (!fromAccId || !toAccId) return;

	await createJournalEntry(db, {
		organizationId: transfer.organizationId,
		date: transfer.date,
		description: transfer.description || "تحويل بين حسابات | Bank transfer",
		referenceType: "TRANSFER",
		referenceId: transfer.id,
		isAutoGenerated: true,
		createdById: transfer.userId,
		lines: [
			{ accountId: toAccId, debit: transfer.amount, credit: ZERO },
			{ accountId: fromAccId, debit: ZERO, credit: transfer.amount },
		],
	});
}

// ========================================
// 5. Subcontract Payment → DR: Subcontractors (or Payable) / CR: Bank
// ========================================
export async function onSubcontractPayment(db: PrismaClient, payment: {
	id: string;
	organizationId: string;
	contractorName: string;
	amount: Prisma.Decimal;
	date: Date;
	sourceAccountId: string;
	projectId?: string | null;
	claimId?: string | null;
	userId?: string;
}) {
	if (!(await ensureChartExists(db, payment.organizationId))) return;

	// If payment is linked to an approved claim → debit Payable (2120) since cost was recorded at approval
	// Otherwise → debit Subcontractor Cost (5200) directly
	const debitCode = payment.claimId ? "2120" : "5200";
	const debitAccId = await getAccountByCode(db, payment.organizationId, debitCode);
	const bankAccId = await getBankChartAccountId(db, payment.organizationId, payment.sourceAccountId);
	if (!debitAccId || !bankAccId) return;

	await createJournalEntry(db, {
		organizationId: payment.organizationId,
		date: payment.date,
		description: `دفعة مقاول باطن — ${payment.contractorName} | Subcontractor payment — ${payment.contractorName}`,
		referenceType: "SUBCONTRACT_PAYMENT",
		referenceId: payment.id,
		isAutoGenerated: true,
		createdById: payment.userId,
		lines: [
			{ accountId: debitAccId, debit: payment.amount, credit: ZERO, projectId: payment.projectId },
			{ accountId: bankAccId, debit: ZERO, credit: payment.amount },
		],
	});
}
// TODO: No delete procedure exists for SubcontractPayment (immutable by design).
// If delete is added later: call reverseAutoJournalEntry({ referenceType: "SUBCONTRACT_PAYMENT", referenceId })

// ========================================
// 5b. Subcontract Claim Approved → DR: Subcontractor Cost / CR: Subcontractor Payable
// ========================================
export async function onSubcontractClaimApproved(db: PrismaClient, claim: {
	id: string;
	organizationId: string;
	claimNo: number;
	contractorName: string;
	netAmount: Prisma.Decimal;
	date: Date;
	projectId?: string | null;
	userId?: string;
}) {
	if (!(await ensureChartExists(db, claim.organizationId))) return;

	const subCostAccId = await getAccountByCode(db, claim.organizationId, "5200");
	const subPayableAccId = await getAccountByCode(db, claim.organizationId, "2120");
	if (!subCostAccId || !subPayableAccId) return;

	await createJournalEntry(db, {
		organizationId: claim.organizationId,
		date: claim.date,
		description: `اعتماد مستخلص #${claim.claimNo} — ${claim.contractorName} | Claim #${claim.claimNo} approved — ${claim.contractorName}`,
		referenceType: "SUBCONTRACT_CLAIM_APPROVED",
		referenceId: claim.id,
		referenceNo: `CLM-${claim.claimNo}`,
		isAutoGenerated: true,
		createdById: claim.userId,
		lines: [
			{ accountId: subCostAccId, debit: claim.netAmount, credit: ZERO, projectId: claim.projectId },
			{ accountId: subPayableAccId, debit: ZERO, credit: claim.netAmount, projectId: claim.projectId },
		],
	});
}

// ========================================
// 6. Payroll Approved → DR: Salaries / CR: Bank + GOSI
// ========================================
export async function onPayrollApproved(db: PrismaClient, payroll: {
	id: string;
	organizationId: string;
	month: number;
	year: number;
	totalNet: Prisma.Decimal;
	totalGosi: Prisma.Decimal;
	sourceAccountId?: string | null;
	userId?: string;
}) {
	if (!(await ensureChartExists(db, payroll.organizationId))) return;

	const salaryAccId = await getAccountByCode(db, payroll.organizationId, "6100");
	const gosiAccId = await getAccountByCode(db, payroll.organizationId, "2170");
	let bankAccId: string | null = null;
	if (payroll.sourceAccountId) {
		bankAccId = await getBankChartAccountId(db, payroll.organizationId, payroll.sourceAccountId);
	} else {
		bankAccId = await getAccountByCode(db, payroll.organizationId, "1110");
	}

	if (!salaryAccId || !bankAccId) return;

	const lines: any[] = [
		{ accountId: salaryAccId, debit: payroll.totalNet.add(payroll.totalGosi), credit: ZERO, description: `رواتب ${payroll.month}/${payroll.year} | Salaries ${payroll.month}/${payroll.year}` },
		{ accountId: bankAccId, debit: ZERO, credit: payroll.totalNet, description: `صرف رواتب ${payroll.month}/${payroll.year} | Salary disbursement ${payroll.month}/${payroll.year}` },
	];

	if (gosiAccId && payroll.totalGosi.greaterThan(0)) {
		lines.push({ accountId: gosiAccId, debit: ZERO, credit: payroll.totalGosi, description: `تأمينات اجتماعية ${payroll.month}/${payroll.year} | GOSI ${payroll.month}/${payroll.year}` });
	}

	await createJournalEntry(db, {
		organizationId: payroll.organizationId,
		date: new Date(payroll.year, payroll.month - 1, 28),
		description: `مسير رواتب ${payroll.month}/${payroll.year} | Payroll ${payroll.month}/${payroll.year}`,
		referenceType: "PAYROLL",
		referenceId: payroll.id,
		isAutoGenerated: true,
		createdById: payroll.userId,
		lines,
	});
}

// ========================================
// 7. Direct Payment (FinancePayment) → DR: Bank / CR: Revenue
// ========================================
export async function onOrganizationPaymentReceived(db: PrismaClient, payment: {
	id: string;
	organizationId: string;
	amount: Prisma.Decimal;
	date: Date;
	description: string;
	destinationAccountId: string;
	projectId?: string | null;
	userId?: string;
}) {
	if (!(await ensureChartExists(db, payment.organizationId))) return;

	const bankAccId = await getBankChartAccountId(db, payment.organizationId, payment.destinationAccountId);
	const revenueAccId = await getAccountByCode(db, payment.organizationId, "4300");
	if (!bankAccId || !revenueAccId) return;

	await createJournalEntry(db, {
		organizationId: payment.organizationId,
		date: payment.date,
		description: `مقبوضات: ${payment.description} | Receipt: ${payment.description}`,
		referenceType: "ORG_PAYMENT",
		referenceId: payment.id,
		isAutoGenerated: true,
		createdById: payment.userId,
		lines: [
			{ accountId: bankAccId, debit: payment.amount, credit: ZERO, projectId: payment.projectId },
			{ accountId: revenueAccId, debit: ZERO, credit: payment.amount, projectId: payment.projectId },
		],
	});
}

// ========================================
// 7b. Project Payment Received → DR: Bank / CR: Receivable
// ========================================
export async function onProjectPaymentReceived(db: PrismaClient, payment: {
	id: string;
	organizationId: string;
	amount: Prisma.Decimal;
	date: Date;
	destinationAccountId: string;
	projectId: string;
	paymentNo?: string;
	userId?: string;
}) {
	if (!(await ensureChartExists(db, payment.organizationId))) return;

	const bankAccId = payment.destinationAccountId
		? await getBankChartAccountId(db, payment.organizationId, payment.destinationAccountId)
		: await getAccountByCode(db, payment.organizationId, "1110");
	const receivableId = await getAccountByCode(db, payment.organizationId, "1120");
	if (!bankAccId || !receivableId) return;

	await createJournalEntry(db, {
		organizationId: payment.organizationId,
		date: payment.date,
		description: `دفعة مشروع ${payment.paymentNo ?? ""} | Project payment ${payment.paymentNo ?? ""}`,
		referenceType: "PROJECT_PAYMENT",
		referenceId: payment.id,
		referenceNo: payment.paymentNo,
		isAutoGenerated: true,
		createdById: payment.userId,
		lines: [
			{ accountId: bankAccId, debit: payment.amount, credit: ZERO, projectId: payment.projectId },
			{ accountId: receivableId, debit: ZERO, credit: payment.amount, projectId: payment.projectId },
		],
	});
}

// ========================================
// 8a. Project Claim Approved → DR: Receivable / CR: Project Revenue (accrual)
// ========================================
export async function onProjectClaimApproved(db: PrismaClient, claim: {
	id: string;
	organizationId: string;
	claimNo: number;
	clientName: string;
	netAmount: Prisma.Decimal;
	date: Date;
	projectId: string;
	userId?: string;
}) {
	if (!(await ensureChartExists(db, claim.organizationId))) return;

	const receivableId = await getAccountByCode(db, claim.organizationId, "1120");
	const revenueId = await getAccountByCode(db, claim.organizationId, "4100");
	if (!receivableId || !revenueId) return;

	await createJournalEntry(db, {
		organizationId: claim.organizationId,
		date: claim.date,
		description: `اعتماد مستخلص مشروع #${claim.claimNo} — ${claim.clientName} | Project claim #${claim.claimNo} approved — ${claim.clientName}`,
		referenceType: "PROJECT_CLAIM_APPROVED",
		referenceId: claim.id,
		referenceNo: `PCLM-${claim.claimNo}`,
		isAutoGenerated: true,
		createdById: claim.userId,
		lines: [
			{ accountId: receivableId, debit: claim.netAmount, credit: ZERO, projectId: claim.projectId },
			{ accountId: revenueId, debit: ZERO, credit: claim.netAmount, projectId: claim.projectId },
		],
	});
}

// ========================================
// 8b. Credit Note → DR: Revenue + VAT / CR: Receivable
// ========================================
export async function onCreditNoteIssued(db: PrismaClient, creditNote: {
	id: string;
	organizationId: string;
	number: string;
	issueDate: Date;
	clientName: string;
	totalAmount: Prisma.Decimal;
	vatAmount: Prisma.Decimal;
	projectId?: string | null;
	userId?: string;
}) {
	if (!(await ensureChartExists(db, creditNote.organizationId))) return;

	const receivableId = await getAccountByCode(db, creditNote.organizationId, "1120");
	const revenueId = await getAccountByCode(db, creditNote.organizationId, "4100");
	const vatPayableId = await getAccountByCode(db, creditNote.organizationId, "2130");
	if (!receivableId || !revenueId || !vatPayableId) return;

	const netAmount = creditNote.totalAmount.sub(creditNote.vatAmount);
	const lines: any[] = [
		{ accountId: revenueId, debit: netAmount, credit: ZERO, description: `إشعار دائن ${creditNote.number} | Credit note ${creditNote.number}`, projectId: creditNote.projectId },
		{ accountId: receivableId, debit: ZERO, credit: creditNote.totalAmount, projectId: creditNote.projectId },
	];

	if (creditNote.vatAmount.greaterThan(0)) {
		lines.push({ accountId: vatPayableId, debit: creditNote.vatAmount, credit: ZERO });
	}

	await createJournalEntry(db, {
		organizationId: creditNote.organizationId,
		date: creditNote.issueDate,
		description: `إشعار دائن ${creditNote.number} — ${creditNote.clientName} | Credit note ${creditNote.number} — ${creditNote.clientName}`,
		referenceType: "CREDIT_NOTE",
		referenceId: creditNote.id,
		referenceNo: creditNote.number,
		isAutoGenerated: true,
		createdById: creditNote.userId,
		lines,
	});
}

// ========================================
// 9. Reverse Auto-Journal Entry — generic helper for delete/cancel operations
// ========================================
export async function reverseAutoJournalEntry(db: PrismaClient, data: {
	organizationId: string;
	referenceType: string;
	referenceId: string;
	userId: string;
}) {
	if (!(await ensureChartExists(db, data.organizationId))) return;

	const entry = await db.journalEntry.findFirst({
		where: {
			organizationId: data.organizationId,
			referenceType: data.referenceType,
			referenceId: data.referenceId,
			status: { not: "REVERSED" },
		},
	});

	if (!entry) return; // No entry found or already reversed — silent return

	if (entry.status === "POSTED") {
		await reverseJournalEntry(db, entry.id, data.userId, new Date());
	} else if (entry.status === "DRAFT") {
		// Check closed period before deleting DRAFT entries
		const closed = await isPeriodClosed(db, entry.organizationId, entry.date);
		if (!closed) {
			await db.journalEntry.delete({ where: { id: entry.id } });
		}
		// If period is closed, silently skip — DRAFT entries don't affect POSTED reports
	}
}

// ========================================
// 10. Receipt Voucher Issued (Manual Only) → DR: Bank / CR: Other Revenue
// ========================================
export async function onReceiptVoucherIssued(db: PrismaClient, voucher: {
	id: string;
	organizationId: string;
	voucherNo: string;
	amount: Prisma.Decimal;
	date: Date;
	receivedFrom: string;
	destinationAccountId?: string | null;
	projectId?: string | null;
	userId?: string;
}) {
	if (!(await ensureChartExists(db, voucher.organizationId))) return;

	// Debit: Bank/Cash destination or fallback to 1110
	const bankAccId = voucher.destinationAccountId
		? await getBankChartAccountId(db, voucher.organizationId, voucher.destinationAccountId)
		: await getAccountByCode(db, voucher.organizationId, "1110");
	// Credit: Other Revenue (4300)
	const revenueId = await getAccountByCode(db, voucher.organizationId, "4300");
	if (!bankAccId || !revenueId) return;

	await createJournalEntry(db, {
		organizationId: voucher.organizationId,
		date: voucher.date,
		description: `سند قبض ${voucher.voucherNo} — ${voucher.receivedFrom} | Receipt voucher ${voucher.voucherNo} — ${voucher.receivedFrom}`,
		referenceType: "RECEIPT_VOUCHER",
		referenceId: voucher.id,
		referenceNo: voucher.voucherNo,
		isAutoGenerated: true,
		createdById: voucher.userId,
		lines: [
			{ accountId: bankAccId, debit: voucher.amount, credit: ZERO, projectId: voucher.projectId },
			{ accountId: revenueId, debit: ZERO, credit: voucher.amount, projectId: voucher.projectId },
		],
	});
}

// ========================================
// 11. Payment Voucher Approved (Manual Only) → DR: Expense / CR: Bank
// ========================================
export async function onPaymentVoucherApproved(db: PrismaClient, voucher: {
	id: string;
	organizationId: string;
	voucherNo: string;
	amount: Prisma.Decimal;
	date: Date;
	payeeName: string;
	payeeType: string;
	sourceAccountId?: string | null;
	projectId?: string | null;
	userId?: string;
}) {
	if (!(await ensureChartExists(db, voucher.organizationId))) return;

	// Credit: Bank/Cash source or fallback to 1110
	const bankAccId = voucher.sourceAccountId
		? await getBankChartAccountId(db, voucher.organizationId, voucher.sourceAccountId)
		: await getAccountByCode(db, voucher.organizationId, "1110");

	// Debit: Expense account based on payee type
	let expenseCode = "6900"; // default: other expenses
	if (voucher.payeeType === "SUBCONTRACTOR") expenseCode = "5200";
	else if (voucher.payeeType === "EMPLOYEE") expenseCode = "6100";

	const expenseAccId = await getAccountByCode(db, voucher.organizationId, expenseCode);
	if (!bankAccId || !expenseAccId) return;

	await createJournalEntry(db, {
		organizationId: voucher.organizationId,
		date: voucher.date,
		description: `سند صرف ${voucher.voucherNo} — ${voucher.payeeName} | Payment voucher ${voucher.voucherNo} — ${voucher.payeeName}`,
		referenceType: "PAYMENT_VOUCHER",
		referenceId: voucher.id,
		referenceNo: voucher.voucherNo,
		isAutoGenerated: true,
		createdById: voucher.userId,
		lines: [
			{ accountId: expenseAccId, debit: voucher.amount, credit: ZERO, projectId: voucher.projectId },
			{ accountId: bankAccId, debit: ZERO, credit: voucher.amount },
		],
	});
}

// ========================================
// 12. Final Handover Completed → Retention Release
//     DR: Retentions Payable (2150) / CR: Accounts Receivable (1120)
// ========================================
export async function onFinalHandoverCompleted(db: PrismaClient, handover: {
	id: string;
	organizationId: string;
	protocolNo: string;
	retentionReleaseAmount: Prisma.Decimal;
	projectId: string;
	date: Date;
	userId?: string;
}) {
	if (!(await ensureChartExists(db, handover.organizationId))) return;
	if (!handover.retentionReleaseAmount || handover.retentionReleaseAmount.lessThanOrEqualTo(ZERO)) return;

	const retentionAccId = await getAccountByCode(db, handover.organizationId, "2150"); // محتجزات
	const receivableId = await getAccountByCode(db, handover.organizationId, "1120");   // عملاء
	if (!retentionAccId || !receivableId) return;

	await createJournalEntry(db, {
		organizationId: handover.organizationId,
		date: handover.date,
		description: `تحرير محتجزات — محضر استلام نهائي ${handover.protocolNo} | Retention release — Final handover ${handover.protocolNo}`,
		referenceType: "HANDOVER_RETENTION_RELEASE",
		referenceId: handover.id,
		referenceNo: handover.protocolNo,
		isAutoGenerated: true,
		createdById: handover.userId,
		lines: [
			{ accountId: retentionAccId, debit: handover.retentionReleaseAmount, credit: ZERO, projectId: handover.projectId },
			{ accountId: receivableId, debit: ZERO, credit: handover.retentionReleaseAmount, projectId: handover.projectId },
		],
	});
}
