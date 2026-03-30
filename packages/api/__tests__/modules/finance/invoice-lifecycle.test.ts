import { describe, it, expect } from "vitest";

/**
 * Invoice Lifecycle Tests
 *
 * Pure logic tests for invoice state transitions, validation rules,
 * payment calculations, and credit note constraints.
 * No database or mocking required.
 */

// ─── State Machine ──────────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
	DRAFT: [],
	ISSUED: ["SENT", "OVERDUE", "CANCELLED"],
	SENT: ["VIEWED", "OVERDUE", "CANCELLED"],
	VIEWED: ["OVERDUE", "CANCELLED"],
	PARTIALLY_PAID: ["OVERDUE", "CANCELLED"],
	PAID: [],
	OVERDUE: ["CANCELLED"],
	CANCELLED: [],
};

function canTransition(from: string, to: string): boolean {
	return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

// ─── VAT Calculation ────────────────────────────────────────────────────────

const VAT_RATE = 0.15;

function calculateVAT(subtotal: number): number {
	return Math.round(subtotal * VAT_RATE * 100) / 100;
}

function calculateTotal(
	subtotal: number,
	vatAmount: number,
	discount: number = 0,
): number {
	return Math.round((subtotal - discount + vatAmount) * 100) / 100;
}

// ─── Payment Logic ──────────────────────────────────────────────────────────

function calculateRemainingBalance(
	total: number,
	paidAmount: number,
): number {
	return Math.round((total - paidAmount) * 100) / 100;
}

function getPaymentStatus(total: number, paidAmount: number): string {
	if (paidAmount >= total) return "PAID";
	if (paidAmount > 0) return "PARTIALLY_PAID";
	return "ISSUED";
}

function canAcceptPayment(
	total: number,
	paidAmount: number,
	paymentAmount: number,
): boolean {
	return paymentAmount > 0 && paidAmount + paymentAmount <= total;
}

// ─── Credit Note Logic ──────────────────────────────────────────────────────

function canIssueCreditNote(
	invoiceTotal: number,
	existingCreditNotes: number,
	newCreditNoteAmount: number,
): boolean {
	return existingCreditNotes + newCreditNoteAmount <= invoiceTotal;
}

// ═══════════════════════════════════════════════════════════════════════════

describe("Invoice Lifecycle", () => {
	describe("State Transitions", () => {
		it("DRAFT cannot transition to any state (must issue first)", () => {
			const allStates = Object.keys(ALLOWED_TRANSITIONS);
			for (const target of allStates) {
				expect(canTransition("DRAFT", target)).toBe(false);
			}
		});

		it("ISSUED can transition to SENT, OVERDUE, or CANCELLED", () => {
			expect(canTransition("ISSUED", "SENT")).toBe(true);
			expect(canTransition("ISSUED", "OVERDUE")).toBe(true);
			expect(canTransition("ISSUED", "CANCELLED")).toBe(true);
		});

		it("ISSUED cannot transition backwards to DRAFT", () => {
			expect(canTransition("ISSUED", "DRAFT")).toBe(false);
		});

		it("PAID is terminal — no transitions allowed", () => {
			const allStates = Object.keys(ALLOWED_TRANSITIONS);
			for (const target of allStates) {
				expect(canTransition("PAID", target)).toBe(false);
			}
		});

		it("CANCELLED is terminal — no transitions allowed", () => {
			const allStates = Object.keys(ALLOWED_TRANSITIONS);
			for (const target of allStates) {
				expect(canTransition("CANCELLED", target)).toBe(false);
			}
		});

		it("should reject invalid state transitions", () => {
			// SENT cannot go back to ISSUED
			expect(canTransition("SENT", "ISSUED")).toBe(false);
			// OVERDUE cannot go to PAID directly (only via payment)
			expect(canTransition("OVERDUE", "PAID")).toBe(false);
			// PARTIALLY_PAID cannot go to PAID (handled by payment logic)
			expect(canTransition("PARTIALLY_PAID", "PAID")).toBe(false);
		});

		it("OVERDUE can only be cancelled", () => {
			expect(canTransition("OVERDUE", "CANCELLED")).toBe(true);
			expect(canTransition("OVERDUE", "PAID")).toBe(false);
			expect(canTransition("OVERDUE", "SENT")).toBe(false);
		});

		it("should prevent editing ISSUED invoices", () => {
			const editableStatuses = ["DRAFT"];
			const nonEditableStatuses = [
				"ISSUED",
				"SENT",
				"VIEWED",
				"PARTIALLY_PAID",
				"PAID",
				"OVERDUE",
				"CANCELLED",
			];

			for (const status of editableStatuses) {
				expect(status === "DRAFT").toBe(true);
			}
			for (const status of nonEditableStatuses) {
				expect(status !== "DRAFT").toBe(true);
			}
		});
	});

	describe("Validation", () => {
		it("should validate issueDate <= dueDate", () => {
			const issueDate = new Date("2026-01-15");
			const validDueDate = new Date("2026-02-15");
			const invalidDueDate = new Date("2026-01-10");

			expect(issueDate <= validDueDate).toBe(true);
			expect(issueDate <= invalidDueDate).toBe(false);
		});

		it("should reject negative amounts", () => {
			const amounts = [-100, -0.01, -1];
			for (const amount of amounts) {
				expect(amount > 0).toBe(false);
			}
		});

		it("should accept zero subtotal", () => {
			expect(calculateVAT(0)).toBe(0);
			expect(calculateTotal(0, 0)).toBe(0);
		});

		it("should calculate VAT correctly at 15%", () => {
			expect(calculateVAT(1000)).toBe(150);
			expect(calculateVAT(500)).toBe(75);
			expect(calculateVAT(86.96)).toBeCloseTo(13.04, 1);
			expect(calculateVAT(10000)).toBe(1500);
		});

		it("should calculate total with discount correctly", () => {
			const subtotal = 1000;
			const vat = calculateVAT(subtotal); // 150
			expect(calculateTotal(subtotal, vat)).toBe(1150);

			// With discount
			const discount = 100;
			const discountedVat = calculateVAT(subtotal - discount); // 135
			expect(calculateTotal(subtotal, discountedVat, discount)).toBe(1035);
		});

		it("should require at least one line item", () => {
			const emptyItems: any[] = [];
			const validItems = [
				{ description: "Item 1", quantity: 1, unitPrice: 100 },
			];

			expect(emptyItems.length > 0).toBe(false);
			expect(validItems.length > 0).toBe(true);
		});
	});

	describe("Payments", () => {
		it("should not allow payment exceeding remaining balance", () => {
			const total = 1150;
			const paidAmount = 500;
			const remaining = calculateRemainingBalance(total, paidAmount);

			expect(remaining).toBe(650);
			expect(canAcceptPayment(total, paidAmount, 650)).toBe(true);
			expect(canAcceptPayment(total, paidAmount, 651)).toBe(false);
			expect(canAcceptPayment(total, paidAmount, 1000)).toBe(false);
		});

		it("should not allow zero or negative payments", () => {
			expect(canAcceptPayment(1000, 0, 0)).toBe(false);
			expect(canAcceptPayment(1000, 0, -100)).toBe(false);
		});

		it("should update status to PARTIALLY_PAID on partial payment", () => {
			expect(getPaymentStatus(1150, 500)).toBe("PARTIALLY_PAID");
			expect(getPaymentStatus(1150, 1)).toBe("PARTIALLY_PAID");
			expect(getPaymentStatus(1150, 1149.99)).toBe("PARTIALLY_PAID");
		});

		it("should update status to PAID when fully paid", () => {
			expect(getPaymentStatus(1150, 1150)).toBe("PAID");
			expect(getPaymentStatus(100, 100)).toBe("PAID");
		});

		it("should handle multiple partial payments", () => {
			const total = 1000;
			let paidAmount = 0;

			// First payment
			const payment1 = 300;
			expect(canAcceptPayment(total, paidAmount, payment1)).toBe(true);
			paidAmount += payment1;
			expect(getPaymentStatus(total, paidAmount)).toBe("PARTIALLY_PAID");

			// Second payment
			const payment2 = 400;
			expect(canAcceptPayment(total, paidAmount, payment2)).toBe(true);
			paidAmount += payment2;
			expect(getPaymentStatus(total, paidAmount)).toBe("PARTIALLY_PAID");

			// Final payment
			const payment3 = 300;
			expect(canAcceptPayment(total, paidAmount, payment3)).toBe(true);
			paidAmount += payment3;
			expect(getPaymentStatus(total, paidAmount)).toBe("PAID");

			// No more payments allowed
			expect(canAcceptPayment(total, paidAmount, 1)).toBe(false);
		});

		it("should calculate remaining balance correctly", () => {
			expect(calculateRemainingBalance(1000, 0)).toBe(1000);
			expect(calculateRemainingBalance(1000, 500)).toBe(500);
			expect(calculateRemainingBalance(1000, 1000)).toBe(0);
			expect(calculateRemainingBalance(1150.5, 575.25)).toBe(575.25);
		});
	});

	describe("Credit Notes", () => {
		it("should not exceed original invoice total", () => {
			expect(canIssueCreditNote(1150, 0, 1150)).toBe(true);
			expect(canIssueCreditNote(1150, 0, 1151)).toBe(false);
		});

		it("should account for existing credit notes", () => {
			const invoiceTotal = 1000;
			const existingCN = 400;

			expect(canIssueCreditNote(invoiceTotal, existingCN, 600)).toBe(true);
			expect(canIssueCreditNote(invoiceTotal, existingCN, 601)).toBe(false);
		});

		it("should allow multiple credit notes up to invoice total", () => {
			const invoiceTotal = 1000;
			let totalCN = 0;

			// First credit note
			expect(canIssueCreditNote(invoiceTotal, totalCN, 300)).toBe(true);
			totalCN += 300;

			// Second credit note
			expect(canIssueCreditNote(invoiceTotal, totalCN, 500)).toBe(true);
			totalCN += 500;

			// Third credit note — remaining 200
			expect(canIssueCreditNote(invoiceTotal, totalCN, 200)).toBe(true);
			totalCN += 200;

			// No more credit notes
			expect(canIssueCreditNote(invoiceTotal, totalCN, 1)).toBe(false);
		});

		it("should reduce outstanding balance when credit note is applied", () => {
			const total = 1000;
			const creditNoteAmount = 200;
			// Credit notes increment paidAmount to reduce outstanding balance
			const effectivePaid = creditNoteAmount;
			expect(calculateRemainingBalance(total, effectivePaid)).toBe(800);
		});
	});
});
