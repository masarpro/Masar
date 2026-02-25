import {
	createBankAccount,
	deleteBankAccount,
	getBankAccountById,
	getOrganizationBalancesSummary,
	getOrganizationBankAccounts,
	reconcileBankAccount,
	setDefaultBankAccount,
	updateBankAccount,
	orgAuditLog,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

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
			action: "settings",
		});

		const account = await createBankAccount({
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

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "BANK_ACCOUNT_CREATED",
			entityType: "bank_account",
			entityId: account.id,
			metadata: { name: input.name, accountType: input.accountType },
		});

		return account;
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
			action: "settings",
		});

		const { organizationId, id, ...data } = input;

		const account = await updateBankAccount(id, organizationId, data);

		orgAuditLog({
			organizationId,
			actorId: context.user.id,
			action: "BANK_ACCOUNT_UPDATED",
			entityType: "bank_account",
			entityId: id,
			metadata: data,
		});

		return account;
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
			action: "settings",
		});

		const account = await setDefaultBankAccount(input.id, input.organizationId);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "BANK_ACCOUNT_SET_DEFAULT",
			entityType: "bank_account",
			entityId: input.id,
		});

		return account;
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
			action: "settings",
		});

		const result = await deleteBankAccount(input.id, input.organizationId);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "BANK_ACCOUNT_DELETED",
			entityType: "bank_account",
			entityId: input.id,
		});

		return result;
	});

// ═══════════════════════════════════════════════════════════════════════════
// RECONCILE BANK ACCOUNT (read-only diagnostic)
// ═══════════════════════════════════════════════════════════════════════════
export const reconcileBankAccountProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/banks/{id}/reconcile",
		tags: ["Finance", "Banks"],
		summary: "Reconcile a bank account (read-only report)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Gated to finance.settings (OWNER + ACCOUNTANT only)
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		const result = await reconcileBankAccount(input.id, input.organizationId);

		// Convert Prisma.Decimal to number for JSON serialization
		return {
			storedBalance: Number(result.storedBalance),
			computedBalance: Number(result.computedBalance),
			delta: Number(result.delta),
			isBalanced: result.isBalanced,
			components: {
				openingBalance: Number(result.components.openingBalance),
				paymentsIn: Number(result.components.paymentsIn),
				expensesOut: Number(result.components.expensesOut),
				subcontractPaymentsOut: Number(result.components.subcontractPaymentsOut),
				transfersIn: Number(result.components.transfersIn),
				transfersOut: Number(result.components.transfersOut),
			},
		};
	});
