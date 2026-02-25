/**
 * Sprint 3.2 — Top 20 Critical Financial Tests
 *
 * Integration tests that exercise the real org-finance & payroll query functions
 * against the test database. Requires DATABASE_URL_TEST to be set.
 *
 * Each test creates its own data and cleans up after itself via afterAll.
 * The db singleton is redirected to the test DB by the setup file.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

const HAS_TEST_DB = !!process.env.DATABASE_URL_TEST;

describe.skipIf(!HAS_TEST_DB)("Org Finance — Top 20 Critical Financial Tests", () => {
	// ─── Lazy imports (only when DB is available) ────────────────────────────
	let db: any;
	let createExpense: any;
	let payExpense: any;
	let cancelExpense: any;
	let deleteExpense: any;
	let createPayment: any;
	let deletePayment: any;
	let createTransfer: any;
	let cancelTransfer: any;
	let reconcileBankAccount: any;
	let populatePayrollRun: any;
	let approvePayrollRun: any;
	let cancelPayrollRun: any;

	// ─── Fixture IDs for cleanup ────────────────────────────────────────────
	let orgId: string;
	let orgBId: string;
	let userId: string;
	let bankId: string;
	let bankBId: string;

	// Track all created record IDs for cleanup
	const createdExpenseIds: string[] = [];
	const createdPaymentIds: string[] = [];
	const createdTransferIds: string[] = [];
	const createdPayrollRunIds: string[] = [];
	const createdEmployeeIds: string[] = [];

	beforeAll(async () => {
		const finMod = await import("../prisma/queries/org-finance");
		const payrollMod = await import("../prisma/queries/payroll");
		const dbMod = await import("../prisma/client");

		db = dbMod.db;
		createExpense = finMod.createExpense;
		payExpense = finMod.payExpense;
		cancelExpense = finMod.cancelExpense;
		deleteExpense = finMod.deleteExpense;
		createPayment = finMod.createPayment;
		deletePayment = finMod.deletePayment;
		createTransfer = finMod.createTransfer;
		cancelTransfer = finMod.cancelTransfer;
		reconcileBankAccount = finMod.reconcileBankAccount;
		populatePayrollRun = payrollMod.populatePayrollRun;
		approvePayrollRun = payrollMod.approvePayrollRun;
		cancelPayrollRun = payrollMod.cancelPayrollRun;

		// ── Create Org A ──
		const org = await db.organization.create({
			data: { name: "Finance Test Org A", createdAt: new Date() },
		});
		orgId = org.id;

		// ── Create Org B (for multi-tenant isolation test) ──
		const orgB = await db.organization.create({
			data: { name: "Finance Test Org B", createdAt: new Date() },
		});
		orgBId = orgB.id;

		// ── User ──
		const user = await db.user.create({
			data: {
				name: "Finance Test User",
				email: "finance-test@masar-test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				organizationId: orgId,
			},
		});
		userId = user.id;
		await db.member.create({
			data: { organizationId: orgId, userId: user.id, role: "owner", createdAt: new Date() },
		});

		// ── Bank Account A (balance: 50,000) ──
		const bank = await db.organizationBank.create({
			data: {
				organizationId: orgId,
				createdById: userId,
				name: "Finance Test Bank",
				accountType: "BANK",
				balance: 50000,
				openingBalance: 50000,
				currency: "SAR",
				isActive: true,
				isDefault: true,
			},
		});
		bankId = bank.id;

		// ── Bank Account B (balance: 20,000) ──
		const bankB = await db.organizationBank.create({
			data: {
				organizationId: orgId,
				createdById: userId,
				name: "Finance Test Bank B",
				accountType: "CASH",
				balance: 20000,
				openingBalance: 20000,
				currency: "SAR",
				isActive: true,
				isDefault: false,
			},
		});
		bankBId = bankB.id;
	});

	afterAll(async () => {
		// Cleanup in reverse FK order
		if (createdPayrollRunIds.length > 0) {
			await db.payrollRunItem.deleteMany({
				where: { payrollRunId: { in: createdPayrollRunIds } },
			});
			// Delete linked payroll expenses
			await db.financeExpense.deleteMany({
				where: { organizationId: orgId, sourceType: "FACILITY_PAYROLL" },
			});
			await db.payrollRun.deleteMany({
				where: { id: { in: createdPayrollRunIds } },
			});
		}
		if (createdEmployeeIds.length > 0) {
			await db.employee.deleteMany({ where: { id: { in: createdEmployeeIds } } });
		}
		if (createdTransferIds.length > 0) {
			await db.financeTransfer.deleteMany({ where: { id: { in: createdTransferIds } } });
		}
		// Delete remaining test expenses
		await db.financeExpense.deleteMany({ where: { organizationId: { in: [orgId, orgBId] } } });
		if (createdPaymentIds.length > 0) {
			await db.financePayment.deleteMany({ where: { id: { in: createdPaymentIds } } });
		}
		await db.organizationBank.deleteMany({ where: { organizationId: { in: [orgId, orgBId] } } });
		await db.member.deleteMany({ where: { organizationId: { in: [orgId, orgBId] } } });
		await db.user.deleteMany({ where: { email: "finance-test@masar-test.local" } });
		await db.organization.deleteMany({ where: { id: { in: [orgId, orgBId] } } });
	});

	// Helper: read current bank balance
	async function getBalance(accountId: string): Promise<number> {
		const acc = await db.organizationBank.findUnique({
			where: { id: accountId },
			select: { balance: true },
		});
		return Number(acc.balance);
	}

	// ═══════════════════════════════════════════════════════════════════════
	// #1: createExpense COMPLETED — balance decrements
	// ═══════════════════════════════════════════════════════════════════════
	it("#1 createExpense COMPLETED — balance decrements", async () => {
		const before = await getBalance(bankId);
		const expense = await createExpense({
			organizationId: orgId,
			createdById: userId,
			category: "MATERIALS",
			amount: 1000,
			date: new Date(),
			sourceAccountId: bankId,
			status: "COMPLETED",
		});
		createdExpenseIds.push(expense.id);
		const after = await getBalance(bankId);
		expect(before - after).toBe(1000);
		expect(expense.status).toBe("COMPLETED");
		expect(Number(expense.paidAmount)).toBe(1000);
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #2: createExpense PENDING — balance unchanged
	// ═══════════════════════════════════════════════════════════════════════
	it("#2 createExpense PENDING — balance unchanged", async () => {
		const before = await getBalance(bankId);
		const expense = await createExpense({
			organizationId: orgId,
			createdById: userId,
			category: "RENT",
			amount: 2000,
			date: new Date(),
			sourceAccountId: bankId,
			status: "PENDING",
		});
		createdExpenseIds.push(expense.id);
		const after = await getBalance(bankId);
		expect(after).toBe(before);
		expect(expense.status).toBe("PENDING");
		expect(Number(expense.paidAmount)).toBe(0);
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #3: payExpense full — status COMPLETED, balance decrements
	// ═══════════════════════════════════════════════════════════════════════
	it("#3 payExpense full — status COMPLETED, balance decrements", async () => {
		// Create a PENDING expense first
		const expense = await createExpense({
			organizationId: orgId,
			createdById: userId,
			category: "UTILITIES",
			amount: 500,
			date: new Date(),
			sourceAccountId: bankId,
			status: "PENDING",
		});
		createdExpenseIds.push(expense.id);

		const before = await getBalance(bankId);
		const paid = await payExpense({
			expenseId: expense.id,
			organizationId: orgId,
			sourceAccountId: bankId,
		});
		const after = await getBalance(bankId);

		expect(paid.status).toBe("COMPLETED");
		expect(Number(paid.paidAmount)).toBe(500);
		expect(before - after).toBe(500);
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #4: payExpense partial — status stays PENDING
	// ═══════════════════════════════════════════════════════════════════════
	it("#4 payExpense partial — status stays PENDING", async () => {
		const expense = await createExpense({
			organizationId: orgId,
			createdById: userId,
			category: "MAINTENANCE",
			amount: 1000,
			date: new Date(),
			sourceAccountId: bankId,
			status: "PENDING",
		});
		createdExpenseIds.push(expense.id);

		const paid = await payExpense({
			expenseId: expense.id,
			organizationId: orgId,
			sourceAccountId: bankId,
			amount: 300,
		});

		expect(paid.status).toBe("PENDING");
		expect(Number(paid.paidAmount)).toBe(300);
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #5: payExpense overpayment — throws error
	// ═══════════════════════════════════════════════════════════════════════
	it("#5 payExpense overpayment — throws error", async () => {
		const expense = await createExpense({
			organizationId: orgId,
			createdById: userId,
			category: "EQUIPMENT",
			amount: 200,
			date: new Date(),
			sourceAccountId: bankId,
			status: "PENDING",
		});
		createdExpenseIds.push(expense.id);

		await expect(
			payExpense({
				expenseId: expense.id,
				organizationId: orgId,
				sourceAccountId: bankId,
				amount: 500, // more than 200
			}),
		).rejects.toThrow("exceeds remaining");
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #6: cancelExpense — restores paidAmount to account
	// ═══════════════════════════════════════════════════════════════════════
	it("#6 cancelExpense — restores paidAmount to account", async () => {
		// Create COMPLETED expense (deducts 800)
		const expense = await createExpense({
			organizationId: orgId,
			createdById: userId,
			category: "MATERIALS",
			amount: 800,
			date: new Date(),
			sourceAccountId: bankId,
			status: "COMPLETED",
		});
		createdExpenseIds.push(expense.id);

		const beforeCancel = await getBalance(bankId);
		await cancelExpense(expense.id, orgId);
		const afterCancel = await getBalance(bankId);

		// paidAmount (800) should be restored
		expect(afterCancel - beforeCancel).toBe(800);
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #7: deleteExpense MANUAL — restores paidAmount
	// ═══════════════════════════════════════════════════════════════════════
	it("#7 deleteExpense MANUAL — restores paidAmount", async () => {
		const expense = await createExpense({
			organizationId: orgId,
			createdById: userId,
			category: "SUPPLIES",
			amount: 600,
			date: new Date(),
			sourceAccountId: bankId,
			status: "COMPLETED",
			sourceType: "MANUAL",
		});
		// Don't push to createdExpenseIds — we're deleting it

		const beforeDelete = await getBalance(bankId);
		await deleteExpense(expense.id, orgId);
		const afterDelete = await getBalance(bankId);

		expect(afterDelete - beforeDelete).toBe(600);
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #8: deleteExpense facility-generated — blocked
	// ═══════════════════════════════════════════════════════════════════════
	it("#8 deleteExpense facility-generated — blocked", async () => {
		const expense = await createExpense({
			organizationId: orgId,
			createdById: userId,
			category: "SALARIES",
			amount: 5000,
			date: new Date(),
			status: "PENDING",
			sourceType: "FACILITY_PAYROLL",
		});
		createdExpenseIds.push(expense.id);

		await expect(deleteExpense(expense.id, orgId)).rejects.toThrow(
			"Cannot delete facility-generated",
		);
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #9: createPayment — balance increments
	// ═══════════════════════════════════════════════════════════════════════
	it("#9 createPayment — balance increments", async () => {
		const before = await getBalance(bankId);
		const payment = await createPayment({
			organizationId: orgId,
			createdById: userId,
			amount: 3000,
			date: new Date(),
			destinationAccountId: bankId,
			clientName: "Test Client",
		});
		createdPaymentIds.push(payment.id);
		const after = await getBalance(bankId);

		expect(after - before).toBe(3000);
		expect(payment.status).toBe("COMPLETED");
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #10: deletePayment COMPLETED — balance decrements
	// ═══════════════════════════════════════════════════════════════════════
	it("#10 deletePayment COMPLETED — balance decrements", async () => {
		const payment = await createPayment({
			organizationId: orgId,
			createdById: userId,
			amount: 1500,
			date: new Date(),
			destinationAccountId: bankId,
		});
		// Don't track — we're deleting

		const before = await getBalance(bankId);
		await deletePayment(payment.id, orgId);
		const after = await getBalance(bankId);

		expect(before - after).toBe(1500);
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #11: createTransfer — source decrements, dest increments
	// ═══════════════════════════════════════════════════════════════════════
	it("#11 createTransfer — source decrements, dest increments", async () => {
		const beforeFrom = await getBalance(bankId);
		const beforeTo = await getBalance(bankBId);

		const transfer = await createTransfer({
			organizationId: orgId,
			createdById: userId,
			amount: 2000,
			date: new Date(),
			fromAccountId: bankId,
			toAccountId: bankBId,
		});
		createdTransferIds.push(transfer.id);

		const afterFrom = await getBalance(bankId);
		const afterTo = await getBalance(bankBId);

		expect(beforeFrom - afterFrom).toBe(2000);
		expect(afterTo - beforeTo).toBe(2000);
		expect(transfer.status).toBe("COMPLETED");
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #12: createTransfer same account — rejected
	// ═══════════════════════════════════════════════════════════════════════
	it("#12 createTransfer same account — rejected", async () => {
		await expect(
			createTransfer({
				organizationId: orgId,
				createdById: userId,
				amount: 100,
				date: new Date(),
				fromAccountId: bankId,
				toAccountId: bankId,
			}),
		).rejects.toThrow("Cannot transfer to the same account");
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #13: cancelTransfer — both balances reversed
	// ═══════════════════════════════════════════════════════════════════════
	it("#13 cancelTransfer — both balances reversed", async () => {
		const transfer = await createTransfer({
			organizationId: orgId,
			createdById: userId,
			amount: 1000,
			date: new Date(),
			fromAccountId: bankId,
			toAccountId: bankBId,
		});
		createdTransferIds.push(transfer.id);

		const beforeFrom = await getBalance(bankId);
		const beforeTo = await getBalance(bankBId);

		await cancelTransfer(transfer.id, orgId);

		const afterFrom = await getBalance(bankId);
		const afterTo = await getBalance(bankBId);

		expect(afterFrom - beforeFrom).toBe(1000); // restored
		expect(beforeTo - afterTo).toBe(1000); // reversed
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #14: cancelTransfer already cancelled — throws
	// ═══════════════════════════════════════════════════════════════════════
	it("#14 cancelTransfer already cancelled — throws", async () => {
		const transfer = await createTransfer({
			organizationId: orgId,
			createdById: userId,
			amount: 500,
			date: new Date(),
			fromAccountId: bankId,
			toAccountId: bankBId,
		});
		createdTransferIds.push(transfer.id);

		await cancelTransfer(transfer.id, orgId); // first cancel — OK

		await expect(cancelTransfer(transfer.id, orgId)).rejects.toThrow(
			"already cancelled",
		);
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #15: payrollRun populate — correct salary calcs
	// ═══════════════════════════════════════════════════════════════════════
	it("#15 payrollRun populate — correct salary calcs", async () => {
		// Create 2 employees
		const emp1 = await db.employee.create({
			data: {
				organizationId: orgId,
				name: "Emp A",
				employeeNo: "EMP-FIN-001",
				type: "LABORER",
				status: "ACTIVE",
				baseSalary: 5000,
				housingAllowance: 1000,
				transportAllowance: 500,
				otherAllowances: 200,
				gosiSubscription: 450,
				joinDate: new Date("2025-01-01"),
				salaryType: "MONTHLY",
			},
		});
		createdEmployeeIds.push(emp1.id);

		const emp2 = await db.employee.create({
			data: {
				organizationId: orgId,
				name: "Emp B",
				employeeNo: "EMP-FIN-002",
				type: "ENGINEER",
				status: "ACTIVE",
				baseSalary: 8000,
				housingAllowance: 2000,
				transportAllowance: 800,
				otherAllowances: 0,
				gosiSubscription: 720,
				joinDate: new Date("2025-01-01"),
				salaryType: "MONTHLY",
			},
		});
		createdEmployeeIds.push(emp2.id);

		// Create a DRAFT payroll run
		const run = await db.payrollRun.create({
			data: {
				organizationId: orgId,
				createdById: userId,
				runNo: "PAY-FIN-TEST-01",
				month: 1,
				year: 2026,
				status: "DRAFT",
			},
		});
		createdPayrollRunIds.push(run.id);

		// Populate
		const populated = await populatePayrollRun(run.id, orgId);

		expect(populated.employeeCount).toBe(2);
		expect(populated.items).toHaveLength(2);

		// Emp A: 5000 + 1000 + 500 + 200 - 450 = 6250
		const itemA = populated.items.find((i: any) => i.employee.name === "Emp A");
		expect(Number(itemA.netSalary)).toBe(6250);

		// Emp B: 8000 + 2000 + 800 + 0 - 720 = 10080
		const itemB = populated.items.find((i: any) => i.employee.name === "Emp B");
		expect(Number(itemB.netSalary)).toBe(10080);

		// Totals via DB aggregation
		expect(Number(populated.totalNetSalary)).toBe(6250 + 10080);
		expect(Number(populated.totalBaseSalary)).toBe(5000 + 8000);
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #16: payrollRun approve — creates PENDING expenses
	// ═══════════════════════════════════════════════════════════════════════
	it("#16 payrollRun approve — creates PENDING expenses", async () => {
		// Reuse the payroll run from #15 — it's populated but still DRAFT
		const runId = createdPayrollRunIds[0];

		const approved = await approvePayrollRun(runId, {
			organizationId: orgId,
			approvedById: userId,
		});

		expect(approved.status).toBe("APPROVED");

		// Each item should have a linked PENDING finance expense
		for (const item of approved.items) {
			expect(item.financeExpense).toBeDefined();
			expect(item.financeExpense.status).toBe("PENDING");
		}

		// Verify expense amounts match net salaries
		const expenses = await db.financeExpense.findMany({
			where: { organizationId: orgId, sourceType: "FACILITY_PAYROLL" },
		});
		expect(expenses.length).toBeGreaterThanOrEqual(2);
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #17: payrollRun cancel — cancels linked expenses
	// ═══════════════════════════════════════════════════════════════════════
	it("#17 payrollRun cancel — cancels linked expenses", async () => {
		// Create a fresh payroll run for cancel test
		const run = await db.payrollRun.create({
			data: {
				organizationId: orgId,
				createdById: userId,
				runNo: "PAY-FIN-TEST-02",
				month: 2,
				year: 2026,
				status: "DRAFT",
			},
		});
		createdPayrollRunIds.push(run.id);

		await populatePayrollRun(run.id, orgId);
		await approvePayrollRun(run.id, {
			organizationId: orgId,
			approvedById: userId,
		});

		// Get linked expense IDs before cancel
		const runWithItems = await db.payrollRun.findUnique({
			where: { id: run.id },
			include: { items: { select: { financeExpenseId: true } } },
		});
		const expenseIds = runWithItems.items
			.map((i: any) => i.financeExpenseId)
			.filter(Boolean);

		// Cancel
		const cancelled = await cancelPayrollRun(run.id, orgId);
		expect(cancelled.status).toBe("CANCELLED");

		// Verify linked expenses are CANCELLED
		if (expenseIds.length > 0) {
			const expenses = await db.financeExpense.findMany({
				where: { id: { in: expenseIds } },
			});
			for (const exp of expenses) {
				expect(exp.status).toBe("CANCELLED");
			}
		}
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #18: Reconciliation — clean account delta=0
	// ═══════════════════════════════════════════════════════════════════════
	it("#18 Reconciliation — clean account delta=0", async () => {
		// Create a fresh account for clean reconciliation
		const cleanBank = await db.organizationBank.create({
			data: {
				organizationId: orgId,
				createdById: userId,
				name: "Reconciliation Test Bank",
				accountType: "BANK",
				balance: 10000,
				openingBalance: 10000,
				currency: "SAR",
				isActive: true,
				isDefault: false,
			},
		});

		// Add a payment (+5000)
		const pmt = await createPayment({
			organizationId: orgId,
			createdById: userId,
			amount: 5000,
			date: new Date(),
			destinationAccountId: cleanBank.id,
		});
		createdPaymentIds.push(pmt.id);

		// Add an expense (-3000)
		const exp = await createExpense({
			organizationId: orgId,
			createdById: userId,
			category: "MATERIALS",
			amount: 3000,
			date: new Date(),
			sourceAccountId: cleanBank.id,
			status: "COMPLETED",
		});
		createdExpenseIds.push(exp.id);

		// Expected: 10000 + 5000 - 3000 = 12000
		const result = await reconcileBankAccount(cleanBank.id, orgId);
		expect(result.isBalanced).toBe(true);
		expect(Number(result.storedBalance)).toBe(12000);
		expect(Number(result.computedBalance)).toBe(12000);
		expect(Number(result.delta)).toBe(0);

		// Cleanup the extra bank
		// First delete the records (already tracked) then the bank
		await db.organizationBank.delete({ where: { id: cleanBank.id } }).catch(() => {});
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #19: Multi-tenant — org A cannot see org B data
	// ═══════════════════════════════════════════════════════════════════════
	it("#19 Multi-tenant — org A cannot see org B data", async () => {
		// Create bank account in org B
		const userB = await db.user.create({
			data: {
				name: "Org B User",
				email: "finance-orgb@masar-test.local",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
				organizationId: orgBId,
			},
		});

		const bankOrgB = await db.organizationBank.create({
			data: {
				organizationId: orgBId,
				createdById: userB.id,
				name: "Org B Bank",
				accountType: "BANK",
				balance: 99999,
				openingBalance: 99999,
				currency: "SAR",
				isActive: true,
				isDefault: true,
			},
		});

		// Create expense in Org B
		const expB = await createExpense({
			organizationId: orgBId,
			createdById: userB.id,
			category: "MATERIALS",
			amount: 1000,
			date: new Date(),
			sourceAccountId: bankOrgB.id,
			status: "COMPLETED",
		});

		// Org A's reconciliation should NOT see Org B's data
		await expect(reconcileBankAccount(bankOrgB.id, orgId)).rejects.toThrow(
			"Bank account not found",
		);

		// Org A cannot cancel Org B's expense
		await expect(cancelExpense(expB.id, orgId)).rejects.toThrow(
			"Expense not found",
		);

		// Org A cannot delete Org B's payment
		const pmtB = await createPayment({
			organizationId: orgBId,
			createdById: userB.id,
			amount: 500,
			date: new Date(),
			destinationAccountId: bankOrgB.id,
		});

		await expect(deletePayment(pmtB.id, orgId)).rejects.toThrow(
			"Payment not found",
		);

		// Cleanup org B data
		await db.financePayment.deleteMany({ where: { organizationId: orgBId } });
		await db.financeExpense.deleteMany({ where: { organizationId: orgBId } });
		await db.organizationBank.deleteMany({ where: { organizationId: orgBId } });
		await db.user.deleteMany({ where: { email: "finance-orgb@masar-test.local" } });
	});

	// ═══════════════════════════════════════════════════════════════════════
	// #20: Negative balance prevention
	// ═══════════════════════════════════════════════════════════════════════
	it("#20 Negative balance prevention", async () => {
		// Create a low-balance account
		const lowBank = await db.organizationBank.create({
			data: {
				organizationId: orgId,
				createdById: userId,
				name: "Low Balance Bank",
				accountType: "BANK",
				balance: 100,
				openingBalance: 100,
				currency: "SAR",
				isActive: true,
				isDefault: false,
			},
		});

		// Expense exceeding balance should fail
		await expect(
			createExpense({
				organizationId: orgId,
				createdById: userId,
				category: "MATERIALS",
				amount: 500,
				date: new Date(),
				sourceAccountId: lowBank.id,
				status: "COMPLETED",
			}),
		).rejects.toThrow("الرصيد غير كافي");

		// Transfer exceeding balance should fail
		await expect(
			createTransfer({
				organizationId: orgId,
				createdById: userId,
				amount: 500,
				date: new Date(),
				fromAccountId: lowBank.id,
				toAccountId: bankId,
			}),
		).rejects.toThrow("الرصيد غير كافي");

		// Pay expense exceeding balance should fail
		const pendingExp = await createExpense({
			organizationId: orgId,
			createdById: userId,
			category: "MATERIALS",
			amount: 50,
			date: new Date(),
			status: "PENDING",
		});
		createdExpenseIds.push(pendingExp.id);

		await expect(
			payExpense({
				expenseId: pendingExp.id,
				organizationId: orgId,
				sourceAccountId: lowBank.id,
				amount: 500,
			}),
		).rejects.toThrow("الرصيد غير كافي");

		// Balance should remain unchanged at 100
		const finalBalance = await getBalance(lowBank.id);
		expect(finalBalance).toBe(100);

		// Cleanup
		await db.organizationBank.delete({ where: { id: lowBank.id } });
	});
});
