import {
	seedChartOfAccounts,
	getChartOfAccounts,
	getChartAccountById,
	getAccountBalance,
	getAccountLedger,
	getOpeningBalances,
	saveOpeningBalances,
} from "@repo/database";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

// ========== Seed (Activate Accounting) ==========

export const seedChartOfAccountsProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/accounts/seed",
		tags: ["Accounting", "Chart of Accounts"],
		summary: "Activate accounting by seeding default chart of accounts",
	})
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		const result = await seedChartOfAccounts(db, input.organizationId);
		// Invalidate cache so next operation picks up the new accounts
		const { invalidateAccountingCache } = await import("../../../lib/accounting/auto-journal");
		invalidateAccountingCache(input.organizationId);
		return result;
	});

// ========== List Accounts ==========

export const listAccountsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/accounts",
		tags: ["Accounting", "Chart of Accounts"],
		summary: "List all accounts in chart of accounts",
	})
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getChartOfAccounts(db, input.organizationId);
	});

// ========== Get Account by ID ==========

export const getAccountByIdProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/accounts/{id}",
		tags: ["Accounting", "Chart of Accounts"],
		summary: "Get account details with balance",
	})
	.input(z.object({ organizationId: z.string(), id: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const account = await getChartAccountById(db, input.id, input.organizationId);
		if (!account) {
			throw new Error("Account not found");
		}

		const balance = await getAccountBalance(db, input.id);

		return {
			...account,
			balance: Number(balance),
		};
	});

// ========== Create Account ==========

export const createAccountProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/accounts",
		tags: ["Accounting", "Chart of Accounts"],
		summary: "Create a new account",
	})
	.input(
		z.object({
			organizationId: z.string(),
			code: z.string().min(1).max(20),
			nameAr: z.string().min(1).max(200),
			nameEn: z.string().min(1).max(200),
			description: z.string().optional(),
			type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
			normalBalance: z.enum(["DEBIT", "CREDIT"]),
			level: z.number().min(1).max(5),
			parentId: z.string().optional(),
			isPostable: z.boolean().optional().default(true),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		// Verify parent exists if provided
		if (input.parentId) {
			const parent = await db.chartAccount.findFirst({
				where: { id: input.parentId, organizationId: input.organizationId },
			});
			if (!parent) throw new Error("Parent account not found");
		}

		// Check code uniqueness
		const existing = await db.chartAccount.findUnique({
			where: {
				organizationId_code: {
					organizationId: input.organizationId,
					code: input.code,
				},
			},
		});
		if (existing) throw new Error("Account code already exists");

		return db.chartAccount.create({
			data: {
				organizationId: input.organizationId,
				code: input.code,
				nameAr: input.nameAr,
				nameEn: input.nameEn,
				description: input.description,
				type: input.type,
				normalBalance: input.normalBalance,
				level: input.level,
				parentId: input.parentId,
				isPostable: input.isPostable,
				isSystem: false,
			},
		});
	});

// ========== Update Account ==========

export const updateAccountProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/accounting/accounts/{id}",
		tags: ["Accounting", "Chart of Accounts"],
		summary: "Update account",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			nameAr: z.string().min(1).max(200).optional(),
			nameEn: z.string().min(1).max(200).optional(),
			description: z.string().optional(),
			isActive: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		const account = await db.chartAccount.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
		});
		if (!account) throw new Error("Account not found");

		return db.chartAccount.update({
			where: { id: input.id },
			data: {
				nameAr: input.nameAr,
				nameEn: input.nameEn,
				description: input.description,
				isActive: input.isActive,
			},
		});
	});

// ========== Deactivate Account ==========

export const deactivateAccountProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/accounts/{id}/deactivate",
		tags: ["Accounting", "Chart of Accounts"],
		summary: "Deactivate account (no delete — may be linked to entries)",
	})
	.input(z.object({ organizationId: z.string(), id: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		const account = await db.chartAccount.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
		});
		if (!account) throw new Error("Account not found");
		if (account.isSystem) throw new Error("System accounts cannot be deactivated");

		// Check no posted entries
		const postedLines = await db.journalEntryLine.count({
			where: {
				accountId: input.id,
				journalEntry: { status: "POSTED" },
			},
		});
		if (postedLines > 0) {
			throw new Error("Cannot deactivate account with posted journal entries");
		}

		return db.chartAccount.update({
			where: { id: input.id },
			data: { isActive: false },
		});
	});

// ========== Get Account Balance ==========

export const getAccountBalanceProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/accounts/{id}/balance",
		tags: ["Accounting", "Chart of Accounts"],
		summary: "Get account balance as of date",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			asOfDate: z.string().datetime().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const balance = await getAccountBalance(
			db,
			input.id,
			input.asOfDate ? new Date(input.asOfDate) : undefined,
		);

		return { balance: Number(balance) };
	});

// ========== Get Account Ledger ==========

export const getAccountLedgerProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/accounts/{id}/ledger",
		tags: ["Accounting", "Chart of Accounts"],
		summary: "Get account ledger with running balance",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			dateFrom: z.string().datetime().optional(),
			dateTo: z.string().datetime().optional(),
			page: z.number().min(1).optional().default(1),
			pageSize: z.number().min(10).max(200).optional().default(50),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getAccountLedger(db, input.id, input.organizationId, {
			dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
			dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
			page: input.page,
			pageSize: input.pageSize,
		});
	});

// ========== Get Opening Balances ==========

export const getOpeningBalancesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/opening-balances",
		tags: ["Accounting", "Opening Balances"],
		summary: "Get opening balances for all postable accounts",
	})
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getOpeningBalances(db, input.organizationId);
	});

// ========== Save Opening Balances ==========

export const saveOpeningBalancesProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/opening-balances",
		tags: ["Accounting", "Opening Balances"],
		summary: "Save or update opening balances",
	})
	.input(
		z.object({
			organizationId: z.string(),
			entryDate: z.string().datetime().optional(),
			lines: z
				.array(
					z.object({
						accountId: z.string(),
						debit: z.number().nonnegative(),
						credit: z.number().nonnegative(),
					}),
				)
				.min(1),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "edit",
		});

		return saveOpeningBalances(
			db,
			input.organizationId,
			input.lines,
			context.user.id,
			input.entryDate ? new Date(input.entryDate) : undefined,
		);
	});
