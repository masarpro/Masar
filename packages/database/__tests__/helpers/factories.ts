/**
 * Test data factories.
 *
 * Every factory accepts a Prisma transaction client (`tx`) as first argument
 * so all created rows live inside the test transaction and are rolled back.
 *
 * Use `overrides` to customise any field for edge-case tests.
 */

import { faker } from "@faker-js/faker";
import type { TestTxClient } from "./setup";

// ─── Helpers ────────────────────────────────────────────────────────────────

let seq = 0;
/** Monotonically increasing integer — unique within a test run. */
function nextSeq(): number {
	return ++seq;
}

// ─── Organization ───────────────────────────────────────────────────────────

export async function createTestOrganization(
	tx: TestTxClient,
	overrides?: Record<string, unknown>,
) {
	return tx.organization.create({
		data: {
			name: faker.company.name(),
			slug: faker.helpers.slugify(faker.company.name()).toLowerCase() + nextSeq(),
			createdAt: new Date(),
			...overrides,
		},
	});
}

// ─── User ───────────────────────────────────────────────────────────────────

export async function createTestUser(
	tx: TestTxClient,
	org: { id: string },
	overrides?: Record<string, unknown>,
) {
	const n = nextSeq();
	const user = await tx.user.create({
		data: {
			name: faker.person.fullName(),
			email: `test-${n}@masar-test.local`,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			isActive: true,
			accountType: "OWNER",
			organizationId: org.id,
			...overrides,
		},
	});

	// Also create a Member row (Better Auth requires it)
	await tx.member.create({
		data: {
			organizationId: org.id,
			userId: user.id,
			role: "owner",
			createdAt: new Date(),
		},
	});

	return user;
}

// ─── Bank Account ───────────────────────────────────────────────────────────

export async function createTestBankAccount(
	tx: TestTxClient,
	org: { id: string },
	createdBy: { id: string },
	overrides?: Record<string, unknown>,
) {
	const n = nextSeq();
	return tx.organizationBank.create({
		data: {
			organizationId: org.id,
			createdById: createdBy.id,
			name: `Test Bank ${n}`,
			accountType: "BANK",
			balance: 10000,
			openingBalance: 10000,
			currency: "SAR",
			isActive: true,
			isDefault: false,
			...overrides,
		},
	});
}

// ─── Finance Expense ────────────────────────────────────────────────────────

export async function createTestExpense(
	tx: TestTxClient,
	org: { id: string },
	createdBy: { id: string },
	bankAccount?: { id: string } | null,
	overrides?: Record<string, unknown>,
) {
	const n = nextSeq();
	return tx.financeExpense.create({
		data: {
			organizationId: org.id,
			createdById: createdBy.id,
			expenseNo: `EXP-TEST-${String(n).padStart(4, "0")}`,
			category: "MATERIALS",
			amount: 500,
			paidAmount: 0,
			date: new Date(),
			status: "PENDING",
			sourceType: "MANUAL",
			paymentMethod: "BANK_TRANSFER",
			sourceAccountId: bankAccount?.id ?? null,
			...overrides,
		},
	});
}

// ─── Finance Payment (OrgPayment / Receipt) ────────────────────────────────

export async function createTestPayment(
	tx: TestTxClient,
	org: { id: string },
	createdBy: { id: string },
	bankAccount: { id: string },
	overrides?: Record<string, unknown>,
) {
	const n = nextSeq();
	return tx.financePayment.create({
		data: {
			organizationId: org.id,
			createdById: createdBy.id,
			paymentNo: `RCV-TEST-${String(n).padStart(4, "0")}`,
			amount: 1000,
			date: new Date(),
			destinationAccountId: bankAccount.id,
			status: "COMPLETED",
			paymentMethod: "CASH",
			...overrides,
		},
	});
}

// ─── Finance Transfer ───────────────────────────────────────────────────────

export async function createTestTransfer(
	tx: TestTxClient,
	org: { id: string },
	createdBy: { id: string },
	fromAccount: { id: string },
	toAccount: { id: string },
	overrides?: Record<string, unknown>,
) {
	const n = nextSeq();
	return tx.financeTransfer.create({
		data: {
			organizationId: org.id,
			createdById: createdBy.id,
			transferNo: `TRF-TEST-${String(n).padStart(4, "0")}`,
			amount: 500,
			date: new Date(),
			fromAccountId: fromAccount.id,
			toAccountId: toAccount.id,
			status: "COMPLETED",
			...overrides,
		},
	});
}

// ─── Employee ───────────────────────────────────────────────────────────────

export async function createTestEmployee(
	tx: TestTxClient,
	org: { id: string },
	overrides?: Record<string, unknown>,
) {
	const n = nextSeq();
	return tx.employee.create({
		data: {
			organizationId: org.id,
			name: faker.person.fullName(),
			employeeNo: `EMP-${String(n).padStart(4, "0")}`,
			type: "LABORER",
			status: "ACTIVE",
			baseSalary: 5000,
			housingAllowance: 1000,
			transportAllowance: 500,
			otherAllowances: 0,
			gosiSubscription: 450,
			joinDate: new Date("2025-01-01"),
			salaryType: "MONTHLY",
			...overrides,
		},
	});
}

// ─── Payroll Run ────────────────────────────────────────────────────────────

export async function createTestPayrollRun(
	tx: TestTxClient,
	org: { id: string },
	createdBy: { id: string },
	overrides?: Record<string, unknown>,
) {
	const n = nextSeq();
	return tx.payrollRun.create({
		data: {
			organizationId: org.id,
			createdById: createdBy.id,
			runNo: `PAY-TEST-${String(n).padStart(4, "0")}`,
			month: new Date().getMonth() + 1,
			year: new Date().getFullYear(),
			status: "DRAFT",
			...overrides,
		},
	});
}

/** Create a payroll run item linked to an existing run + employee. */
export async function createTestPayrollRunItem(
	tx: TestTxClient,
	run: { id: string },
	employee: { id: string },
	overrides?: Record<string, unknown>,
) {
	return tx.payrollRunItem.create({
		data: {
			payrollRunId: run.id,
			employeeId: employee.id,
			baseSalary: 5000,
			housingAllowance: 1000,
			transportAllowance: 500,
			otherAllowances: 0,
			gosiDeduction: 450,
			otherDeductions: 0,
			netSalary: 6050,
			...overrides,
		},
	});
}

// ─── Project (lightweight — enough for FK references) ───────────────────────

export async function createTestProject(
	tx: TestTxClient,
	org: { id: string },
	createdBy: { id: string },
	overrides?: Record<string, unknown>,
) {
	const n = nextSeq();
	return tx.project.create({
		data: {
			organizationId: org.id,
			createdById: createdBy.id,
			name: `Test Project ${n}`,
			slug: `test-project-${n}`,
			status: "ACTIVE",
			...overrides,
		},
	});
}

// ─── Cost Study (minimal) ───────────────────────────────────────────────────

export async function createTestCostStudy(
	tx: TestTxClient,
	org: { id: string },
	createdBy: { id: string },
	overrides?: Record<string, unknown>,
) {
	const n = nextSeq();
	return tx.costStudy.create({
		data: {
			organizationId: org.id,
			createdById: createdBy.id,
			name: `Test Cost Study ${n}`,
			projectType: "RESIDENTIAL",
			landArea: 500,
			buildingArea: 400,
			numberOfFloors: 2,
			hasBasement: false,
			finishingLevel: "STANDARD",
			status: "draft",
			...overrides,
		},
	});
}
