import {
	createBankAccount,
	createBankChartAccount,
	deleteBankAccount,
	getBankAccountById,
	getOrganizationBalancesSummary,
	getOrganizationBankAccounts,
	reconcileBankAccount,
	setDefaultBankAccount,
	updateBankAccount,
	orgAuditLog,
	db,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import {
	MAX_NAME, MAX_DESC,
	idString, optionalTrimmed, searchQuery,
	signedAmount, paginationLimit, paginationOffset,
} from "../../../lib/validation-constants";

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
			organizationId: idString(),
			accountType: financeAccountTypeEnum.optional(),
			isActive: z.boolean().optional(),
			query: searchQuery(),
			limit: paginationLimit(),
			offset: paginationOffset(),
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
			organizationId: idString(),
			id: idString(),
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
			organizationId: idString(),
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
export const createBankAccountProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/banks",
		tags: ["Finance", "Banks"],
		summary: "Create a new bank account",
	})
	.input(
		z.object({
			organizationId: idString(),
			name: z.string().trim().min(1).max(MAX_NAME),
			accountNumber: z.string().trim().max(50).optional(),
			bankName: optionalTrimmed(MAX_NAME),
			iban: z.string().trim().max(34).optional(),
			accountType: financeAccountTypeEnum.optional().default("BANK"),
			balance: signedAmount().optional().default(0),
			currency: z.string().trim().max(3).optional().default("SAR"),
			isDefault: z.boolean().optional().default(false),
			notes: optionalTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		// Atomic: create bank account + chart account in one transaction
		const account = await db.$transaction(async (tx: any) => {
			// If this is marked as default, unset other defaults
			if (input.isDefault) {
				await tx.organizationBank.updateMany({
					where: { organizationId: input.organizationId, isDefault: true },
					data: { isDefault: false },
				});
			}

			const bank = await tx.organizationBank.create({
				data: {
					organizationId: input.organizationId,
					createdById: context.user.id,
					name: input.name,
					accountNumber: input.accountNumber,
					bankName: input.bankName,
					iban: input.iban,
					accountType: input.accountType ?? "BANK",
					balance: input.balance ?? 0,
					currency: input.currency ?? "SAR",
					isDefault: input.isDefault ?? false,
					isActive: true,
					notes: input.notes,
				},
			});

			// Auto-create chart account if accounting is enabled
			await createBankChartAccount(tx, input.organizationId, bank.id, input.name);

			return bank;
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
export const updateBankAccountProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/banks/{id}",
		tags: ["Finance", "Banks"],
		summary: "Update a bank account",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			name: z.string().trim().min(1).max(MAX_NAME).optional(),
			accountNumber: z.string().trim().max(50).optional(),
			bankName: optionalTrimmed(MAX_NAME),
			iban: z.string().trim().max(34).optional(),
			accountType: financeAccountTypeEnum.optional(),
			currency: z.string().trim().max(3).optional(),
			isActive: z.boolean().optional(),
			notes: optionalTrimmed(MAX_DESC),
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
export const setDefaultBankAccountProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/banks/{id}/set-default",
		tags: ["Finance", "Banks"],
		summary: "Set a bank account as default",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
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
export const deleteBankAccountProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/finance/banks/{id}",
		tags: ["Finance", "Banks"],
		summary: "Delete a bank account",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "settings",
		});

		// Deactivate linked chart account before deletion (if exists)
		try {
			const bank = await db.organizationBank.findUnique({
				where: { id: input.id },
				select: { chartAccountId: true },
			});
			if (bank?.chartAccountId) {
				await db.chartAccount.update({
					where: { id: bank.chartAccountId },
					data: { isActive: false },
				});
			}
		} catch (e) {
			console.error("[Accounting] Failed to deactivate chart account:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "bank_chart_account",
				entityId: input.id,
				metadata: {
					operation: "BANK_CHART_ACCOUNT_DEACTIVATION",
					error: e instanceof Error ? e.message : String(e),
				},
			});
		}

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
			organizationId: idString(),
			id: idString(),
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
