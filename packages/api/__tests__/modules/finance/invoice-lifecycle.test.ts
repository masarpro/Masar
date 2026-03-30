import { describe, it } from "vitest";

describe("Invoice Lifecycle", () => {
	describe("State Transitions", () => {
		it.todo("DRAFT → ISSUED: should set issueDate and generate number");
		it.todo("ISSUED → PAID: should update status when fully paid");
		it.todo("ISSUED → PARTIALLY_PAID: should track partial payments");
		it.todo("should reject invalid state transitions");
		it.todo("should prevent editing ISSUED invoices");
	});

	describe("Validation", () => {
		it.todo("should validate issueDate ≤ dueDate");
		it.todo("should reject negative amounts");
		it.todo("should calculate VAT correctly at 15%");
		it.todo("should require at least one line item");
	});

	describe("Payments", () => {
		it.todo("should not allow payment exceeding remaining balance");
		it.todo("should update paidAmount on payment");
		it.todo("should update bank balance on payment within transaction");
	});

	describe("Credit Notes", () => {
		it.todo("should not exceed original invoice total");
		it.todo("should increment paidAmount to reduce outstanding balance");
		it.todo("should create reversal journal entry");
	});
});
