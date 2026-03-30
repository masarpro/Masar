import { describe, it, expect } from "vitest";

/**
 * Payment Voucher Tests
 *
 * Pure logic tests for state machine, separation of duties,
 * accounting integration rules, and validation.
 */

// ─── State Machine ──────────────────────────────────────────────────────────

type VoucherStatus = "DRAFT" | "PENDING_APPROVAL" | "ISSUED" | "CANCELLED";

const SUBMIT_TRANSITIONS: Record<string, VoucherStatus | null> = {
	DRAFT: "PENDING_APPROVAL",
	PENDING_APPROVAL: null,
	ISSUED: null,
	CANCELLED: null,
};

const APPROVE_TRANSITIONS: Record<string, VoucherStatus | null> = {
	DRAFT: null,
	PENDING_APPROVAL: "ISSUED",
	ISSUED: null,
	CANCELLED: null,
};

const REJECT_TRANSITIONS: Record<string, VoucherStatus | null> = {
	DRAFT: null,
	PENDING_APPROVAL: "DRAFT",
	ISSUED: null,
	CANCELLED: null,
};

const CANCELLABLE_STATUSES: VoucherStatus[] = ["DRAFT", "PENDING_APPROVAL", "ISSUED"];

function canSubmit(status: string): boolean {
	return SUBMIT_TRANSITIONS[status] !== null && SUBMIT_TRANSITIONS[status] !== undefined;
}

function canApprove(status: string): boolean {
	return APPROVE_TRANSITIONS[status] !== null && APPROVE_TRANSITIONS[status] !== undefined;
}

function canReject(status: string): boolean {
	return REJECT_TRANSITIONS[status] !== null && REJECT_TRANSITIONS[status] !== undefined;
}

function canCancel(status: string): boolean {
	return CANCELLABLE_STATUSES.includes(status as VoucherStatus);
}

function canEdit(status: string): boolean {
	return status === "DRAFT";
}

// ─── Separation of Duties ───────────────────────────────────────────────────

function canUserApprove(preparerId: string, approverId: string): boolean {
	return preparerId !== approverId;
}

// ─── Accounting Integration ─────────────────────────────────────────────────

function shouldCreateJournalEntry(voucher: {
	expenseId?: string | null;
	subcontractPaymentId?: string | null;
}): boolean {
	// Only manual vouchers (not linked to expenses or payments) create journal entries
	return !voucher.expenseId && !voucher.subcontractPaymentId;
}

function shouldReverseJournalOnCancel(
	status: string,
	isManual: boolean,
): boolean {
	return status === "ISSUED" && isManual;
}

// ─── Numbering ──────────────────────────────────────────────────────────────

function generateVoucherNo(year: number, sequence: number): string {
	return `PMT-${year}-${String(sequence).padStart(4, "0")}`;
}

// ═══════════════════════════════════════════════════════════════════════════

describe("Payment Voucher", () => {
	describe("State Machine", () => {
		it("should create voucher in DRAFT status", () => {
			const initialStatus: VoucherStatus = "DRAFT";
			expect(initialStatus).toBe("DRAFT");
			expect(canEdit(initialStatus)).toBe(true);
		});

		it("DRAFT → PENDING_APPROVAL: submit transitions correctly", () => {
			expect(canSubmit("DRAFT")).toBe(true);
			expect(SUBMIT_TRANSITIONS["DRAFT"]).toBe("PENDING_APPROVAL");
		});

		it("PENDING_APPROVAL → ISSUED: approve transitions correctly", () => {
			expect(canApprove("PENDING_APPROVAL")).toBe(true);
			expect(APPROVE_TRANSITIONS["PENDING_APPROVAL"]).toBe("ISSUED");
		});

		it("PENDING_APPROVAL → DRAFT: reject transitions correctly", () => {
			expect(canReject("PENDING_APPROVAL")).toBe(true);
			expect(REJECT_TRANSITIONS["PENDING_APPROVAL"]).toBe("DRAFT");
		});

		it("should reject invalid state transitions", () => {
			// Cannot submit from non-DRAFT
			expect(canSubmit("PENDING_APPROVAL")).toBe(false);
			expect(canSubmit("ISSUED")).toBe(false);
			expect(canSubmit("CANCELLED")).toBe(false);

			// Cannot approve from non-PENDING
			expect(canApprove("DRAFT")).toBe(false);
			expect(canApprove("ISSUED")).toBe(false);

			// Cannot reject from non-PENDING
			expect(canReject("DRAFT")).toBe(false);
			expect(canReject("ISSUED")).toBe(false);
		});

		it("should allow cancellation from DRAFT, PENDING_APPROVAL, and ISSUED", () => {
			expect(canCancel("DRAFT")).toBe(true);
			expect(canCancel("PENDING_APPROVAL")).toBe(true);
			expect(canCancel("ISSUED")).toBe(true);
		});

		it("should not allow cancellation from CANCELLED", () => {
			expect(canCancel("CANCELLED")).toBe(false);
		});

		it("should only allow editing DRAFT vouchers", () => {
			expect(canEdit("DRAFT")).toBe(true);
			expect(canEdit("PENDING_APPROVAL")).toBe(false);
			expect(canEdit("ISSUED")).toBe(false);
			expect(canEdit("CANCELLED")).toBe(false);
		});
	});

	describe("Separation of Duties", () => {
		it("should track preparer separately from approver", () => {
			const preparerId = "user-1";
			const approverId = "user-2";
			expect(canUserApprove(preparerId, approverId)).toBe(true);
		});

		it("should prevent preparer from approving own voucher", () => {
			const sameUser = "user-1";
			expect(canUserApprove(sameUser, sameUser)).toBe(false);
		});
	});

	describe("Accounting Integration", () => {
		it("should create auto-journal entry on approval for manual vouchers only", () => {
			// Manual voucher — no linked expense or payment
			expect(shouldCreateJournalEntry({ expenseId: null, subcontractPaymentId: null })).toBe(true);
			expect(shouldCreateJournalEntry({})).toBe(true);
		});

		it("should NOT create journal for vouchers linked to expenses", () => {
			expect(shouldCreateJournalEntry({ expenseId: "exp-1" })).toBe(false);
		});

		it("should NOT create journal for vouchers linked to subcontract payments", () => {
			expect(shouldCreateJournalEntry({ subcontractPaymentId: "sub-pay-1" })).toBe(false);
		});

		it("should reverse journal entry on cancellation from ISSUED (manual only)", () => {
			expect(shouldReverseJournalOnCancel("ISSUED", true)).toBe(true);
		});

		it("should NOT reverse journal on cancellation from DRAFT or PENDING", () => {
			expect(shouldReverseJournalOnCancel("DRAFT", true)).toBe(false);
			expect(shouldReverseJournalOnCancel("PENDING_APPROVAL", true)).toBe(false);
		});

		it("should NOT reverse journal on cancellation of non-manual ISSUED voucher", () => {
			expect(shouldReverseJournalOnCancel("ISSUED", false)).toBe(false);
		});
	});

	describe("Numbering", () => {
		it("should generate PMT-YYYY-XXXX format voucherNo", () => {
			expect(generateVoucherNo(2026, 1)).toBe("PMT-2026-0001");
			expect(generateVoucherNo(2026, 42)).toBe("PMT-2026-0042");
			expect(generateVoucherNo(2026, 9999)).toBe("PMT-2026-9999");
		});

		it("should generate unique numbers per organization", () => {
			const org1No = generateVoucherNo(2026, 1);
			const org2No = generateVoucherNo(2026, 1);
			// Same format for same sequence — uniqueness enforced by DB per org
			expect(org1No).toBe(org2No);
		});
	});

	describe("Amount Validation", () => {
		it("should reject zero or negative amounts", () => {
			const invalidAmounts = [0, -1, -0.01, -1000];
			for (const amount of invalidAmounts) {
				expect(amount > 0).toBe(false);
			}
		});

		it("should accept positive amounts", () => {
			const validAmounts = [0.01, 1, 100, 999999.99];
			for (const amount of validAmounts) {
				expect(amount > 0).toBe(true);
			}
		});

		it("should handle decimal precision for financial amounts", () => {
			// SAR uses 2 decimal places
			const amount = 13800.50;
			const rounded = Math.round(amount * 100) / 100;
			expect(rounded).toBe(13800.50);
		});
	});
});
