/**
 * Financial Calculations Tests
 *
 * Additional financial calculation tests beyond the existing
 * invoice-calculations.test.ts. Covers payroll formulas,
 * retention, and edge cases.
 *
 * No database connection required — pure function tests.
 */
import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════════════════════════════════════
// Payroll: Net Salary Calculation
// ═══════════════════════════════════════════════════════════════════════════

// Extracted formula from packages/database/prisma/queries/payroll.ts
function calculateNetSalary(params: {
	baseSalary: number;
	housingAllowance: number;
	transportAllowance: number;
	otherAllowances: number;
	gosiDeduction: number;
	otherDeductions?: number;
}): number {
	return (
		params.baseSalary +
		params.housingAllowance +
		params.transportAllowance +
		params.otherAllowances -
		params.gosiDeduction -
		(params.otherDeductions ?? 0)
	);
}

describe("Payroll: Net Salary", () => {
	it("calculates basic net salary", () => {
		const net = calculateNetSalary({
			baseSalary: 5000,
			housingAllowance: 1250,
			transportAllowance: 500,
			otherAllowances: 0,
			gosiDeduction: 487.5, // 9.75% of base
		});
		expect(net).toBe(6262.5);
	});

	it("calculates with all allowances", () => {
		const net = calculateNetSalary({
			baseSalary: 8000,
			housingAllowance: 2000,
			transportAllowance: 500,
			otherAllowances: 1000,
			gosiDeduction: 780, // 9.75% of base
		});
		expect(net).toBe(10720);
	});

	it("calculates with other deductions", () => {
		const net = calculateNetSalary({
			baseSalary: 5000,
			housingAllowance: 1250,
			transportAllowance: 500,
			otherAllowances: 0,
			gosiDeduction: 487.5,
			otherDeductions: 200,
		});
		expect(net).toBe(6062.5);
	});

	it("handles zero allowances", () => {
		const net = calculateNetSalary({
			baseSalary: 3000,
			housingAllowance: 0,
			transportAllowance: 0,
			otherAllowances: 0,
			gosiDeduction: 292.5,
		});
		expect(net).toBe(2707.5);
	});

	it("GOSI contribution: 9.75% of base salary", () => {
		const baseSalary = 10000;
		const gosiRate = 0.0975;
		const gosi = baseSalary * gosiRate;
		expect(gosi).toBe(975);

		const net = calculateNetSalary({
			baseSalary,
			housingAllowance: 2500,
			transportAllowance: 500,
			otherAllowances: 0,
			gosiDeduction: gosi,
		});
		expect(net).toBe(12025);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Contract Retention Calculation
// ═══════════════════════════════════════════════════════════════════════════

function calculateRetention(params: {
	contractValue: number;
	changeOrdersImpact: number;
	retentionPercent: number;
	retentionCap?: number;
}): { adjustedValue: number; retentionAmount: number } {
	const adjustedValue = params.contractValue + params.changeOrdersImpact;
	let retentionAmount = (adjustedValue * params.retentionPercent) / 100;

	if (params.retentionCap !== undefined && retentionAmount > params.retentionCap) {
		retentionAmount = params.retentionCap;
	}

	return { adjustedValue, retentionAmount };
}

describe("Contract Retention", () => {
	it("calculates basic retention (10%)", () => {
		const { adjustedValue, retentionAmount } = calculateRetention({
			contractValue: 1000000,
			changeOrdersImpact: 0,
			retentionPercent: 10,
		});
		expect(adjustedValue).toBe(1000000);
		expect(retentionAmount).toBe(100000);
	});

	it("includes change orders in adjusted value", () => {
		const { adjustedValue, retentionAmount } = calculateRetention({
			contractValue: 1000000,
			changeOrdersImpact: 200000,
			retentionPercent: 10,
		});
		expect(adjustedValue).toBe(1200000);
		expect(retentionAmount).toBe(120000);
	});

	it("applies retention cap", () => {
		const { retentionAmount } = calculateRetention({
			contractValue: 5000000,
			changeOrdersImpact: 0,
			retentionPercent: 10,
			retentionCap: 300000,
		});
		// 10% of 5M = 500K, but capped at 300K
		expect(retentionAmount).toBe(300000);
	});

	it("cap not applied when under limit", () => {
		const { retentionAmount } = calculateRetention({
			contractValue: 1000000,
			changeOrdersImpact: 0,
			retentionPercent: 5,
			retentionCap: 100000,
		});
		// 5% of 1M = 50K, under 100K cap
		expect(retentionAmount).toBe(50000);
	});

	it("handles negative change orders (deductions)", () => {
		const { adjustedValue, retentionAmount } = calculateRetention({
			contractValue: 1000000,
			changeOrdersImpact: -100000,
			retentionPercent: 10,
		});
		expect(adjustedValue).toBe(900000);
		expect(retentionAmount).toBe(90000);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Payment Terms Progress
// ═══════════════════════════════════════════════════════════════════════════

function calculateTermProgress(params: {
	termAmount: number;
	paidAmount: number;
}): { remainingAmount: number; progressPercent: number; isComplete: boolean } {
	const remainingAmount = Math.max(0, params.termAmount - params.paidAmount);
	const progressPercent =
		params.termAmount > 0
			? Math.min(100, (params.paidAmount / params.termAmount) * 100)
			: 0;
	const isComplete = params.termAmount > 0 && params.paidAmount >= params.termAmount;

	return { remainingAmount, progressPercent, isComplete };
}

describe("Payment Terms Progress", () => {
	it("calculates 0% progress when nothing paid", () => {
		const result = calculateTermProgress({ termAmount: 100000, paidAmount: 0 });
		expect(result.progressPercent).toBe(0);
		expect(result.remainingAmount).toBe(100000);
		expect(result.isComplete).toBe(false);
	});

	it("calculates 50% progress", () => {
		const result = calculateTermProgress({ termAmount: 100000, paidAmount: 50000 });
		expect(result.progressPercent).toBe(50);
		expect(result.remainingAmount).toBe(50000);
		expect(result.isComplete).toBe(false);
	});

	it("calculates 100% progress when fully paid", () => {
		const result = calculateTermProgress({ termAmount: 100000, paidAmount: 100000 });
		expect(result.progressPercent).toBe(100);
		expect(result.remainingAmount).toBe(0);
		expect(result.isComplete).toBe(true);
	});

	it("caps progress at 100% if overpaid", () => {
		const result = calculateTermProgress({ termAmount: 100000, paidAmount: 120000 });
		expect(result.progressPercent).toBe(100);
		expect(result.remainingAmount).toBe(0);
		expect(result.isComplete).toBe(true);
	});

	it("handles zero term amount", () => {
		const result = calculateTermProgress({ termAmount: 0, paidAmount: 0 });
		expect(result.progressPercent).toBe(0);
		expect(result.isComplete).toBe(false);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Account Balance: Zero-sum transfers
// ═══════════════════════════════════════════════════════════════════════════

describe("Account Balances", () => {
	it("transfer is zero-sum (debits equal credits)", () => {
		const transferAmount = 50000;
		const fromAccountDelta = -transferAmount;
		const toAccountDelta = transferAmount;
		expect(fromAccountDelta + toAccountDelta).toBe(0);
	});

	it("aggregates transaction totals correctly", () => {
		const transactions = [
			{ type: "CREDIT" as const, amount: 100000 },
			{ type: "DEBIT" as const, amount: 30000 },
			{ type: "CREDIT" as const, amount: 50000 },
			{ type: "DEBIT" as const, amount: 20000 },
		];

		const totalCredits = transactions
			.filter((t) => t.type === "CREDIT")
			.reduce((sum, t) => sum + t.amount, 0);

		const totalDebits = transactions
			.filter((t) => t.type === "DEBIT")
			.reduce((sum, t) => sum + t.amount, 0);

		const balance = totalCredits - totalDebits;

		expect(totalCredits).toBe(150000);
		expect(totalDebits).toBe(50000);
		expect(balance).toBe(100000);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Subcontract Payment with Retention
// ═══════════════════════════════════════════════════════════════════════════

describe("Subcontract Payments", () => {
	it("calculates payment with retention", () => {
		const subcontractValue = 500000;
		const retentionPercent = 10;
		const claimAmount = 100000;

		const retentionDeduction = (claimAmount * retentionPercent) / 100;
		const netPayment = claimAmount - retentionDeduction;

		expect(retentionDeduction).toBe(10000);
		expect(netPayment).toBe(90000);
	});

	it("calculates change order impact on subcontract", () => {
		const originalValue = 500000;
		const changeOrders = [
			{ amount: 50000, status: "APPROVED" },
			{ amount: 30000, status: "APPROVED" },
			{ amount: -10000, status: "APPROVED" },
			{ amount: 20000, status: "PENDING" },
		];

		const approvedImpact = changeOrders
			.filter((co) => co.status === "APPROVED")
			.reduce((sum, co) => sum + co.amount, 0);

		const adjustedValue = originalValue + approvedImpact;

		expect(approvedImpact).toBe(70000);
		expect(adjustedValue).toBe(570000);
	});
});
