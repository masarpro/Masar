import {
	getOrganizationBankAccounts,
	getBankAccountById,
	getOrganizationBalancesSummary,
	createBankAccount,
	updateBankAccount,
	setDefaultBankAccount,
	deleteBankAccount,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

// Enums
const financeAccountTypeEnum = z.enum(["BANK", "CASH_BOX"]);

// ═══════════════════════════════════════════════════════════════════════════
// LIST BANK ACCOUNTS
// ═══════════════════════════════════════════════════════════════════════════
export const listBankAccounts = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/banks",
		tags: ["Finance", "Banks"],
		summary: "List bank accounts for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			accountType: financeAccountTypeEnum.optional(),
			isActive: z.boolean().optional(),
			query: z.string().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getOrganizationBankAccounts(input.organizationId, {
			accountType: input.accountType,
			isActive: input.isActive,
			query: input.query,
			limit: input.limit,
			offset: input.offset,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET SINGLE BANK ACCOUNT
// ═══════════════════════════════════════════════════════════════════════════
export const getBankAccount = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/banks/{id}",
		tags: ["Finance", "Banks"],
		summary: "Get a single bank account",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const account = await getBankAccountById(input.id, input.organizationId);

		if (!account) {
			throw new Error("Bank account not found");
		}

		return account;
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET BALANCES SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
export const getBalancesSummary = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/banks/summary",
		tags: ["Finance", "Banks"],
		summary: "Get balances summary for all accounts",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getOrganizationBalancesSummary(input.organizationId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE BANK ACCOUNT
// ═══════════════════════════════════════════════════════════════════════════
export const createBankAccountProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/banks",
		tags: ["Finance", "Banks"],
		summary: "Create a new bank account",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string().min(1),
			accountNumber: z.string().optional(),
			bankName: z.string().optional(),
			iban: z.string().optional(),
			accountType: financeAccountTypeEnum.optional().default("BANK"),
			balance: z.number().optional().default(0),
			currency: z.string().optional().default("SAR"),
			isDefault: z.boolean().optional().default(false),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "create",
		});

		return createBankAccount({
			organizationId: input.organizationId,
			createdById: context.user.id,
			name: input.name,
			accountNumber: input.accountNumber,
			bankName: input.bankName,
			iban: input.iban,
			accountType: input.accountType,
			balance: input.balance,
			currency: input.currency,
			isDefault: input.isDefault,
			notes: input.notes,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE BANK ACCOUNT
// ═══════════════════════════════════════════════════════════════════════════
export const updateBankAccountProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/banks/{id}",
		tags: ["Finance", "Banks"],
		summary: "Update a bank account",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			name: z.string().min(1).optional(),
			accountNumber: z.string().optional(),
			bankName: z.string().optional(),
			iban: z.string().optional(),
			accountType: financeAccountTypeEnum.optional(),
			currency: z.string().optional(),
			isActive: z.boolean().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "update",
		});

		const { organizationId, id, ...data } = input;

		return updateBankAccount(id, organizationId, data);
	});

// ═══════════════════════════════════════════════════════════════════════════
// SET DEFAULT BANK ACCOUNT
// ═══════════════════════════════════════════════════════════════════════════
export const setDefaultBankAccountProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/banks/{id}/set-default",
		tags: ["Finance", "Banks"],
		summary: "Set a bank account as default",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "update",
		});

		return setDefaultBankAccount(input.id, input.organizationId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE BANK ACCOUNT
// ═══════════════════════════════════════════════════════════════════════════
export const deleteBankAccountProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/finance/banks/{id}",
		tags: ["Finance", "Banks"],
		summary: "Delete a bank account",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "delete",
		});

		return deleteBankAccount(input.id, input.organizationId);
	});
