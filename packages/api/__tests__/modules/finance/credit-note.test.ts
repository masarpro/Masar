/**
 * Credit Note — Pure Logic Tests
 *
 * يثبّت عقد الإشعار الدائن كما هو منفَّذ في:
 * - packages/database/prisma/queries/finance.ts → createCreditNote (حد المبلغ + التخزين بالسالب + تحديث الفاتورة الأصلية)
 * - packages/database/prisma/queries/client-statements.ts → getClientStatement (الرصيد الافتتاحي وحركات الفترة)
 * - packages/api/lib/accounting/auto-journal.ts → onCreditNoteIssued (القيد مغطى في auto-journal.test.ts)
 *
 * بنفس نمط invoice-lifecycle.test.ts: منطق نقي بلا قاعدة بيانات، يوثّق
 * السلوك المتوقع ويكسر لو تغيّرت الدلالات.
 */

import { describe, expect, it } from "vitest";

// ─────────────────────────────────────────────────────────────────
// عقد الإشعار الدائن (مطابق لدلالات createCreditNote)
// ─────────────────────────────────────────────────────────────────

interface InvoiceLike {
	totalAmount: number; // موجب للفاتورة، سالب للإشعار الدائن
	paidAmount: number;
	status: string;
}

/** حد المبلغ: مجموع المعتمد سابقاً (بالقيمة المطلقة) + الجديد ≤ إجمالي الفاتورة الأصلية */
function canIssueCreditNote(
	originalTotal: number,
	existingCreditNoteTotals: number[], // مخزنة بالسالب كما في DB
	newAmount: number,
): boolean {
	const alreadyCredited = existingCreditNoteTotals.reduce(
		(sum, t) => sum + Math.abs(t),
		0,
	);
	return alreadyCredited + newAmount <= originalTotal;
}

/** الإشعار الدائن يُخزَّن بمبالغ سالبة (finance.ts:1720-1724) */
function storedCreditNoteAmount(amount: number): number {
	return -Math.abs(amount);
}

/** أثر الإشعار على الفاتورة الأصلية (Bug #8 fix — finance.ts:1778-1790) */
function applyCreditToOriginal(original: InvoiceLike, creditAmount: number): InvoiceLike {
	const newPaid = original.paidAmount + creditAmount;
	const newStatus =
		newPaid >= original.totalAmount
			? "PAID"
			: newPaid > 0
				? "PARTIALLY_PAID"
				: original.status;
	return { ...original, paidAmount: newPaid, status: newStatus };
}

// ─────────────────────────────────────────────────────────────────
// كشف حساب العميل (مطابق لدلالات getClientStatement)
// ─────────────────────────────────────────────────────────────────

interface StatementInvoice {
	totalAmount: number; // سالب للإشعار الدائن
	issueDate: Date;
	invoiceType: "STANDARD" | "CREDIT_NOTE";
	status: string;
}

interface StatementPayment {
	amount: number;
	date: Date;
}

/** الرصيد الافتتاحي: مجموع الفواتير (شاملة الإشعارات السالبة) - المدفوعات، قبل بداية الفترة */
function openingBalance(
	invoices: StatementInvoice[],
	payments: StatementPayment[],
	dateFrom: Date,
): number {
	const invoicesBefore = invoices
		.filter(
			(inv) =>
				!["DRAFT", "CANCELLED"].includes(inv.status) &&
				inv.issueDate < dateFrom,
		)
		.reduce((sum, inv) => sum + inv.totalAmount, 0);
	const paymentsBefore = payments
		.filter((p) => p.date < dateFrom)
		.reduce((sum, p) => sum + p.amount, 0);
	return invoicesBefore - paymentsBefore;
}

/** حركة الفترة: الإشعار الدائن في عمود الدائن بقيمته المطلقة (client-statements.ts:115-124) */
function statementLine(inv: StatementInvoice) {
	const isCreditNote = inv.invoiceType === "CREDIT_NOTE";
	return {
		debit: isCreditNote ? 0 : inv.totalAmount,
		credit: isCreditNote ? Math.abs(inv.totalAmount) : 0,
	};
}

// ═════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════

describe("Credit note amount limit (حد المبلغ)", () => {
	it("يسمح بإشعار ضمن المتبقي من الفاتورة", () => {
		expect(canIssueCreditNote(10000, [], 2000)).toBe(true);
		expect(canIssueCreditNote(10000, [-3000], 7000)).toBe(true); // بالضبط المتبقي
	});

	it("يرفض إشعاراً يتجاوز المتبقي (تراكمياً)", () => {
		expect(canIssueCreditNote(10000, [], 10001)).toBe(false);
		expect(canIssueCreditNote(10000, [-6000], 5000)).toBe(false);
		expect(canIssueCreditNote(10000, [-4000, -4000], 3000)).toBe(false);
	});

	it("المخزَّن سابقاً بالسالب يُحتسب بقيمته المطلقة", () => {
		// لو جُمعت القيم السالبة كما هي لانفتح الحد بلا سقف
		expect(canIssueCreditNote(10000, [-9000], 9000)).toBe(false);
	});
});

describe("Credit note storage sign (التخزين بالسالب)", () => {
	it("يُخزَّن الإشعار بمبلغ سالب دائماً", () => {
		expect(storedCreditNoteAmount(2000)).toBe(-2000);
		expect(storedCreditNoteAmount(-2000)).toBe(-2000);
	});

	it("يحدّث الفاتورة الأصلية: يزيد paidAmount وقد يقفلها PAID", () => {
		const original: InvoiceLike = { totalAmount: 10000, paidAmount: 8000, status: "PARTIALLY_PAID" };
		const after = applyCreditToOriginal(original, 2000);
		expect(after.paidAmount).toBe(10000);
		expect(after.status).toBe("PAID");
	});

	it("إشعار جزئي يجعلها PARTIALLY_PAID", () => {
		const original: InvoiceLike = { totalAmount: 10000, paidAmount: 0, status: "ISSUED" };
		const after = applyCreditToOriginal(original, 2000);
		expect(after.paidAmount).toBe(2000);
		expect(after.status).toBe("PARTIALLY_PAID");
	});
});

describe("Credit note in opening balance (الرصيد الافتتاحي)", () => {
	const dateFrom = new Date("2026-04-01");
	const before = new Date("2026-03-15");
	const inPeriod = new Date("2026-04-10");

	it("فاتورة 10,000 + إشعار دائن 2,000 قبل الفترة → افتتاحي 8,000", () => {
		const invoices: StatementInvoice[] = [
			{ totalAmount: 10000, issueDate: before, invoiceType: "STANDARD", status: "ISSUED" },
			{ totalAmount: -2000, issueDate: before, invoiceType: "CREDIT_NOTE", status: "ISSUED" },
		];
		expect(openingBalance(invoices, [], dateFrom)).toBe(8000);
	});

	it("الإشعار داخل الفترة لا يدخل الافتتاحي — ويظهر في عمود الدائن", () => {
		const cn: StatementInvoice = {
			totalAmount: -2000,
			issueDate: inPeriod,
			invoiceType: "CREDIT_NOTE",
			status: "ISSUED",
		};
		const invoices: StatementInvoice[] = [
			{ totalAmount: 10000, issueDate: before, invoiceType: "STANDARD", status: "ISSUED" },
			cn,
		];
		expect(openingBalance(invoices, [], dateFrom)).toBe(10000);

		const line = statementLine(cn);
		expect(line.debit).toBe(0);
		expect(line.credit).toBe(2000);
	});

	it("المسودة والملغاة لا تدخلان الافتتاحي", () => {
		const invoices: StatementInvoice[] = [
			{ totalAmount: 10000, issueDate: before, invoiceType: "STANDARD", status: "ISSUED" },
			{ totalAmount: 5000, issueDate: before, invoiceType: "STANDARD", status: "DRAFT" },
			{ totalAmount: 3000, issueDate: before, invoiceType: "STANDARD", status: "CANCELLED" },
		];
		expect(openingBalance(invoices, [], dateFrom)).toBe(10000);
	});

	it("اتساق الرصيد: افتتاحي + حركات الفترة = ختامي", () => {
		const invoices: StatementInvoice[] = [
			{ totalAmount: 10000, issueDate: before, invoiceType: "STANDARD", status: "ISSUED" },
			{ totalAmount: -2000, issueDate: before, invoiceType: "CREDIT_NOTE", status: "ISSUED" },
			{ totalAmount: 4000, issueDate: inPeriod, invoiceType: "STANDARD", status: "ISSUED" },
			{ totalAmount: -1000, issueDate: inPeriod, invoiceType: "CREDIT_NOTE", status: "ISSUED" },
		];
		const opening = openingBalance(invoices, [], dateFrom);
		const periodLines = invoices
			.filter((i) => i.issueDate >= dateFrom)
			.map(statementLine);
		const closing = periodLines.reduce(
			(bal, l) => bal + l.debit - l.credit,
			opening,
		);
		expect(opening).toBe(8000);
		expect(closing).toBe(11000); // 8000 + 4000 - 1000
	});
});
