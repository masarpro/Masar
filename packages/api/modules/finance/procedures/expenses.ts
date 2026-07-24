import {
	getOrganizationExpenses,
	getExpenseById,
	createExpense,
	updateExpense,
	deleteExpense,
	payExpense,
	cancelExpense,
	getExpensesSummaryByCategory,
	getOrganizationSubcontractPayments,
	orgAuditLog,
	isPeriodClosed,
	db,
} from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { resolvePartnerAccessLevel } from "../../accounting/lib/partner-access";
import {
	MAX_NAME, MAX_DESC, MAX_CODE,
	idString, optionalTrimmed, searchQuery,
	positiveAmount, paginationLimit, paginationOffset,
} from "../../../lib/validation-constants";
import { ensureCategoriesSeeded } from "../../../lib/categories/ensure-categories-seeded";
import { notifyEvent } from "../../notifications/lib/notify";

// Enums
const orgExpenseCategoryEnum = z.enum([
	"MATERIALS",
	"LABOR",
	"EQUIPMENT_RENTAL",
	"EQUIPMENT_PURCHASE",
	"SUBCONTRACTOR",
	"TRANSPORT",
	"SALARIES",
	"RENT",
	"UTILITIES",
	"COMMUNICATIONS",
	"INSURANCE",
	"LICENSES",
	"BANK_FEES",
	"FUEL",
	"MAINTENANCE",
	"SUPPLIES",
	"MARKETING",
	"TRAINING",
	"TRAVEL",
	"HOSPITALITY",
	"LOAN_PAYMENT",
	"TAXES",
	"ZAKAT",
	"REFUND",
	"MISC",
	"CUSTOM",
]);

const paymentMethodEnum = z.enum([
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
]);

const financeTransactionStatusEnum = z.enum([
	"PENDING",
	"COMPLETED",
	"CANCELLED",
]);

const expenseSourceTypeEnum = z.enum([
	"MANUAL",
	"FACILITY_PAYROLL",
	"FACILITY_RECURRING",
	"FACILITY_ASSET",
	"PROJECT",
]);

// ═══════════════════════════════════════════════════════════════════════════
// LIST EXPENSES
// ═══════════════════════════════════════════════════════════════════════════
export const listExpenses = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/expenses",
		tags: ["Finance", "Expenses"],
		summary: "List expenses for an organization",
	})
	.input(
		z.object({
			organizationId: idString(),
			category: orgExpenseCategoryEnum.optional(),
			categoryId: z.string().trim().max(100).optional(),
			sourceAccountId: z.string().trim().max(100).optional(),
			projectId: z.string().trim().max(100).optional(),
			status: financeTransactionStatusEnum.optional(),
			sourceType: expenseSourceTypeEnum.optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
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

		return getOrganizationExpenses(input.organizationId, {
			category: input.category,
			categoryId: input.categoryId,
			sourceAccountId: input.sourceAccountId,
			projectId: input.projectId,
			status: input.status,
			sourceType: input.sourceType,
			dateFrom: input.dateFrom,
			dateTo: input.dateTo,
			query: input.query,
			limit: input.limit,
			offset: input.offset,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET SINGLE EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const getExpense = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/expenses/{id}",
		tags: ["Finance", "Expenses"],
		summary: "Get a single expense",
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

		const expense = await getExpenseById(input.id, input.organizationId);

		if (!expense) {
			throw new Error("Expense not found");
		}

		return expense;
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET EXPENSES SUMMARY BY CATEGORY
// ═══════════════════════════════════════════════════════════════════════════
export const getExpensesSummary = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/expenses/summary",
		tags: ["Finance", "Expenses"],
		summary: "Get expenses summary by category",
	})
	.input(
		z.object({
			organizationId: idString(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			projectId: z.string().trim().max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getExpensesSummaryByCategory(
			input.organizationId,
			input.dateFrom,
			input.dateTo,
			input.projectId,
		);
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const createExpenseProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/expenses",
		tags: ["Finance", "Expenses"],
		summary: "Create a new expense",
	})
	.input(
		z.object({
			organizationId: idString(),
			category: orgExpenseCategoryEnum.optional(),
			customCategory: z.string().trim().max(MAX_NAME).optional(),
			categoryId: z.string().trim().min(1).max(100),
			subcategoryId: z.string().trim().max(100).optional(),
			description: optionalTrimmed(MAX_DESC),
			amount: positiveAmount(),
			date: z.coerce.date(),
			sourceAccountId: z.string().trim().max(100).optional(),
			vendorName: optionalTrimmed(MAX_NAME),
			vendorTaxNumber: z.string().trim().max(MAX_CODE).optional(),
			projectId: z.string().trim().max(100).optional(),
			invoiceRef: z.string().trim().max(MAX_CODE).optional(),
			paymentMethod: paymentMethodEnum.optional().default("BANK_TRANSFER"),
			referenceNo: z.string().trim().max(MAX_CODE).optional(),
			status: financeTransactionStatusEnum.optional(),
			sourceType: expenseSourceTypeEnum.optional(),
			dueDate: z.coerce.date().optional(),
			notes: optionalTrimmed(MAX_DESC),
		}).refine(
			(data) => {
				// sourceAccountId is required when status is not PENDING
				if (data.status !== "PENDING" && !data.sourceAccountId) {
					return false;
				}
				return true;
			},
			{ message: "sourceAccountId is required for non-pending expenses", path: ["sourceAccountId"] },
		),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		// A COMPLETED expense moves the bank and posts an EXP-JE. If it's dated in
		// a closed period the journal is silently skipped while the bank still
		// moves — a silent bank↔ledger divergence. Reject up front. (PENDING
		// expenses post no journal, so they're unaffected.)
		if (
			input.status !== "PENDING" &&
			(await isPeriodClosed(db, input.organizationId, input.date))
		) {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن تسجيل مصروف بتاريخ داخل فترة محاسبية مغلقة",
			});
		}

		// Resolve the DB-backed category. Accepts either the OrgCategory id
		// (cuid, sent by the DB-backed combobox) or the stable systemId
		// (legacy/back-compat callers). Custom categories have no systemId.
		await ensureCategoriesSeeded(input.organizationId, "EXPENSE");
		const dbCategory = await db.orgCategory.findFirst({
			where: {
				organizationId: input.organizationId,
				group: "EXPENSE",
				OR: [{ id: input.categoryId }, { systemId: input.categoryId }],
			},
			select: { id: true, accountCode: true, isVatExempt: true, nameAr: true },
		});
		if (!dbCategory) {
			throw new ORPCError("BAD_REQUEST", {
				message: "فئة المصروف غير صالحة",
			});
		}
		let dbSubcategoryId: string | undefined;
		if (input.subcategoryId) {
			const dbSub = await db.orgSubcategory.findFirst({
				where: {
					categoryId: dbCategory.id,
					organizationId: input.organizationId,
					OR: [{ id: input.subcategoryId }, { systemId: input.subcategoryId }],
				},
				select: { id: true },
			});
			if (!dbSub) {
				throw new ORPCError("BAD_REQUEST", {
					message: "الفئة الفرعية غير صالحة",
				});
			}
			dbSubcategoryId = dbSub.id;
		}

		let expense: Awaited<ReturnType<typeof createExpense>>;
		try {
			expense = await createExpense({
				organizationId: input.organizationId,
				createdById: context.user.id,
				category: input.category ?? "MISC",
				customCategory: input.customCategory,
				categoryId: dbCategory.id,
				subcategoryId: dbSubcategoryId ?? undefined,
				description: input.description,
				amount: input.amount,
				date: input.date,
				sourceAccountId: input.sourceAccountId,
				vendorName: input.vendorName,
				vendorTaxNumber: input.vendorTaxNumber,
				projectId: input.projectId,
				invoiceRef: input.invoiceRef,
				paymentMethod: input.paymentMethod,
				referenceNo: input.referenceNo,
				status: input.status,
				sourceType: input.sourceType,
				dueDate: input.dueDate,
				notes: input.notes,
			});
		} catch (e) {
			console.error("[CreateExpense] Failed:", e);
			const msg = e instanceof Error ? e.message : "فشل إنشاء المصروف";
			throw new ORPCError("BAD_REQUEST", { message: msg });
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "EXPENSE_CREATED",
			entityType: "expense",
			entityId: expense.id,
			metadata: { amount: input.amount, categoryId: input.categoryId, category: input.category, status: input.status ?? "COMPLETED" },
		});

		// Update onboarding checklist
		await db.onboardingProgress.updateMany({
			where: { organizationId: input.organizationId, firstExpenseRecorded: false },
			data: { firstExpenseRecorded: true },
		}).catch(() => {});

		// Auto-Journal: generate accounting entry for completed expense
		if ((input.status ?? "COMPLETED") === "COMPLETED") {
			try {
				const { onExpenseCompleted } = await import("../../../lib/accounting/auto-journal");
				await onExpenseCompleted(db, {
					id: expense.id,
					organizationId: input.organizationId,
					category: input.category ?? "MISC",
					accountCode: dbCategory.accountCode,
					isVatExempt: dbCategory.isVatExempt,
					amount: expense.amount,
					date: expense.date,
					description:
						input.description || expense.description || dbCategory.nameAr,
					sourceAccountId: input.sourceAccountId,
					projectId: input.projectId,
					sourceType: input.sourceType,
					userId: context.user.id,
				});
			} catch (e) {
				console.error("[AutoJournal] Failed to generate entry for expense:", e);
				await orgAuditLog({
					organizationId: input.organizationId,
					actorId: context.user.id,
					action: "JOURNAL_ENTRY_FAILED",
					entityType: "journal_entry",
					entityId: expense.id,
					metadata: { error: String(e), referenceType: "EXPENSE" },
				});
			}

			// Auto-create payment voucher for completed expense
			try {
				const { generateAtomicNo } = await import("@repo/database");
				const { numberToArabicWords } = await import("@repo/utils");
				const voucherNo = await generateAtomicNo(input.organizationId, "PMT");
				await db.paymentVoucher.create({
					data: {
						organizationId: input.organizationId,
						voucherNo,
						expenseId: expense.id,
						date: expense.date,
						amount: expense.amount,
						amountInWords: numberToArabicWords(Number(expense.amount)),
						// لا تسقط أبداً لـ categoryId — كان يظهر CUID خام كاسم مستفيد
						payeeName:
							input.vendorName || input.description || dbCategory.nameAr,
						payeeType: "SUPPLIER",
						paymentMethod: input.paymentMethod || "BANK_TRANSFER",
						sourceAccountId: input.sourceAccountId || null,
						projectId: input.projectId || null,
						status: "ISSUED",
						preparedById: context.user.id,
						approvedById: context.user.id,
						approvedAt: new Date(),
					},
				});
			} catch (e) {
				console.error("[PaymentVoucher] Failed to create auto voucher from expense:", e);
				await orgAuditLog({
					organizationId: input.organizationId,
					actorId: context.user.id,
					action: "JOURNAL_ENTRY_FAILED",
					entityType: "voucher",
					entityId: expense.id,
					metadata: { error: String(e), type: "PAYMENT_VOUCHER_AUTO_CREATE" },
				});
			}
		}

		await notifyEvent({
			event: "finance.expenseCreated",
			organizationId: input.organizationId,
			actorId: context.user.id,
			entity: { type: "expense", id: expense.id },
			data: {
				amount: `${new Intl.NumberFormat("en-US").format(Number(expense.amount))} ر.س`,
				category: dbCategory.nameAr,
			},
		});

		return expense;
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const updateExpenseProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/expenses/{id}",
		tags: ["Finance", "Expenses"],
		summary: "Update an expense",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			category: orgExpenseCategoryEnum.optional(),
			customCategory: z.string().trim().max(MAX_NAME).optional(),
			categoryId: z.string().trim().max(100).optional(),
			subcategoryId: z.string().trim().max(100).optional(),
			description: optionalTrimmed(MAX_DESC),
			amount: positiveAmount().optional(),
			date: z.coerce.date().optional(),
			sourceAccountId: z.string().trim().max(100).optional(),
			vendorName: optionalTrimmed(MAX_NAME),
			vendorTaxNumber: z.string().trim().max(MAX_CODE).optional(),
			projectId: z.string().trim().max(100).nullable().optional(),
			invoiceRef: z.string().trim().max(MAX_CODE).optional(),
			paymentMethod: paymentMethodEnum.optional(),
			referenceNo: z.string().trim().max(MAX_CODE).optional(),
			notes: optionalTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		const { organizationId, id, categoryId: inputCategoryId, subcategoryId: inputSubcategoryId, ...rest } = input;

		// Resolve DB-backed category IDs if provided
		let resolvedCategoryId: string | undefined;
		let resolvedSubcategoryId: string | undefined;
		if (inputCategoryId) {
			await ensureCategoriesSeeded(organizationId, "EXPENSE");
			const dbCat = await db.orgCategory.findFirst({
				where: {
					organizationId,
					group: "EXPENSE",
					OR: [{ id: inputCategoryId }, { systemId: inputCategoryId }],
				},
				select: { id: true },
			});
			if (dbCat) {
				resolvedCategoryId = dbCat.id;
				if (inputSubcategoryId) {
					const dbSub = await db.orgSubcategory.findFirst({
						where: {
							categoryId: dbCat.id,
							organizationId,
							OR: [{ id: inputSubcategoryId }, { systemId: inputSubcategoryId }],
						},
						select: { id: true },
					});
					resolvedSubcategoryId = dbSub?.id;
				}
			}
		}

		const data = {
			...rest,
			...(resolvedCategoryId !== undefined ? { categoryId: resolvedCategoryId } : {}),
			...(resolvedSubcategoryId !== undefined ? { subcategoryId: resolvedSubcategoryId } : {}),
		};

		// Snapshot journal-affecting fields before the update so we can tell if the
		// posted entry needs rebuilding (category/date/project drive GL account,
		// period and cost-center; amount/account drive the entry lines and the
		// bank side — a stale entry silently diverges from the ledger).
		const before = await db.financeExpense.findFirst({
			where: { id, organizationId },
			select: {
				status: true,
				category: true,
				categoryId: true,
				date: true,
				projectId: true,
				amount: true,
				sourceAccountId: true,
			},
		});

		// Closed-period guard BEFORE any write: when a posted expense's
		// journal-affecting fields change we reverse+recreate its entry. If either
		// the existing entry's date OR the new date lands in a closed period, the
		// recreate silently returns null and the ledger diverges. Reject up front.
		if (before?.status === "COMPLETED") {
			const willRebuildJournal =
				(data.category !== undefined && data.category !== before.category) ||
				(resolvedCategoryId !== undefined && resolvedCategoryId !== before.categoryId) ||
				(data.date !== undefined && data.date.getTime() !== before.date.getTime()) ||
				(rest.projectId !== undefined && rest.projectId !== before.projectId) ||
				(rest.amount !== undefined && rest.amount !== Number(before.amount)) ||
				(rest.sourceAccountId !== undefined && rest.sourceAccountId !== before.sourceAccountId);
			if (willRebuildJournal) {
				const newDate = data.date ?? before.date;
				if (
					(await isPeriodClosed(db, organizationId, before.date)) ||
					(await isPeriodClosed(db, organizationId, newDate))
				) {
					throw new ORPCError("BAD_REQUEST", {
						message:
							"لا يمكن تعديل مصروف يقع في فترة محاسبية مغلقة أو نقله إلى فترة مغلقة",
					});
				}
			}
		}

		let expense: Awaited<ReturnType<typeof updateExpense>>;
		try {
			expense = await updateExpense(id, organizationId, data);
		} catch (e) {
			const msg = e instanceof Error ? e.message : "فشل تعديل المصروف";
			throw new ORPCError("BAD_REQUEST", { message: msg });
		}

		// Keep the auto-created payment voucher in sync — a changed amount or
		// source account otherwise leaves the voucher stating the OLD figures.
		if (
			(rest.amount !== undefined && rest.amount !== Number(before?.amount)) ||
			(rest.sourceAccountId !== undefined &&
				rest.sourceAccountId !== before?.sourceAccountId)
		) {
			try {
				const { numberToArabicWords } = await import("@repo/utils");
				await db.paymentVoucher.updateMany({
					where: {
						expenseId: id,
						organizationId,
						status: { not: "CANCELLED" },
					},
					data: {
						amount: expense.amount,
						amountInWords: numberToArabicWords(Number(expense.amount)),
						...(rest.sourceAccountId !== undefined
							? { sourceAccountId: rest.sourceAccountId }
							: {}),
					},
				});
			} catch (e) {
				console.error("[PaymentVoucher] Failed to sync voucher after expense update:", e);
			}
		}

		// If the expense is already posted and a journal-affecting field changed,
		// reverse the old entry and recreate it with the new values.
		if (before?.status === "COMPLETED") {
			const journalFieldsChanged =
				(data.category !== undefined && data.category !== before.category) ||
				(resolvedCategoryId !== undefined && resolvedCategoryId !== before.categoryId) ||
				(data.date !== undefined && data.date.getTime() !== before.date.getTime()) ||
				(rest.projectId !== undefined && rest.projectId !== before.projectId) ||
				(rest.amount !== undefined && rest.amount !== Number(before.amount)) ||
				(rest.sourceAccountId !== undefined && rest.sourceAccountId !== before.sourceAccountId);
			if (journalFieldsChanged) {
				try {
					const { reverseAutoJournalEntry, onExpenseCompleted } = await import("../../../lib/accounting/auto-journal");
					await reverseAutoJournalEntry(db, {
						organizationId,
						referenceType: "EXPENSE",
						referenceId: id,
						userId: context.user.id,
					});
					const payCategory = expense.categoryId
						? await db.orgCategory.findUnique({
								where: { id: expense.categoryId },
								select: { accountCode: true, isVatExempt: true, nameAr: true },
							})
						: null;
					await onExpenseCompleted(db, {
						id: expense.id,
						organizationId,
						category: expense.category,
						accountCode: payCategory?.accountCode,
						isVatExempt: payCategory?.isVatExempt,
						amount: expense.amount,
						date: expense.date,
						description:
							expense.description || payCategory?.nameAr || expense.category,
						sourceAccountId: expense.sourceAccountId,
						projectId: expense.projectId,
						sourceType: expense.sourceType,
						userId: context.user.id,
					});
				} catch (e) {
					console.error("[AutoJournal] Failed to rebuild entry for updated expense:", e);
					await orgAuditLog({
						organizationId,
						actorId: context.user.id,
						action: "JOURNAL_ENTRY_FAILED",
						entityType: "journal_entry",
						entityId: id,
						metadata: { error: String(e), referenceType: "EXPENSE" },
					});
				}
			}
		}

		orgAuditLog({
			organizationId,
			actorId: context.user.id,
			action: "EXPENSE_UPDATED",
			entityType: "expense",
			entityId: id,
			metadata: data,
		});

		return expense;
	});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const deleteExpenseProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/finance/expenses/{id}",
		tags: ["Finance", "Expenses"],
		summary: "Delete an expense",
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
			action: "payments",
		});

		// Cancel the auto-created payment voucher BEFORE deleting the expense —
		// its expenseId FK is severed on delete, so a live voucher would stay
		// ISSUED forever (orphan) with no way to trace it back.
		await db.paymentVoucher.updateMany({
			where: {
				expenseId: input.id,
				organizationId: input.organizationId,
				status: { not: "CANCELLED" },
			},
			data: { status: "CANCELLED" },
		});

		const result = await deleteExpense(input.id, input.organizationId);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "EXPENSE_DELETED",
			entityType: "expense",
			entityId: input.id,
		});

		// Auto-Journal: reverse accounting entry for deleted expense
		try {
			const { reverseAutoJournalEntry } = await import("../../../lib/accounting/auto-journal");
			await reverseAutoJournalEntry(db, {
				organizationId: input.organizationId,
				referenceType: "EXPENSE",
				referenceId: input.id,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to reverse entry for deleted expense:", e);
			await orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: input.id,
				metadata: { error: String(e), referenceType: "EXPENSE" },
			});
		}

		return result;
	});

// ═══════════════════════════════════════════════════════════════════════════
// PAY EXPENSE (full or partial)
// ═══════════════════════════════════════════════════════════════════════════
export const payExpenseProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/expenses/{id}/pay",
		tags: ["Finance", "Expenses"],
		summary: "Pay a pending expense (full or partial)",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			sourceAccountId: idString(),
			paymentMethod: paymentMethodEnum.optional(),
			referenceNo: z.string().trim().max(MAX_CODE).optional(),
			amount: positiveAmount().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		const expense = await payExpense({
			expenseId: input.id,
			organizationId: input.organizationId,
			sourceAccountId: input.sourceAccountId,
			paymentMethod: input.paymentMethod,
			referenceNo: input.referenceNo,
			amount: input.amount,
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "EXPENSE_PAID",
			entityType: "expense",
			entityId: input.id,
			metadata: { amount: input.amount, sourceAccountId: input.sourceAccountId, newStatus: expense.status },
		});

		// Auto-Journal: generate accounting entry ONLY when the expense is fully
		// paid (COMPLETED). Posting on a partial payment would record a journal
		// for the full expense amount while the bank was only debited the partial
		// amount — breaking the ledger/bank reconciliation. The completing payment
		// posts the full EXP-JE, matching the cumulative bank decrements.
		if (expense.status === "COMPLETED") try {
			const { onExpenseCompleted } = await import("../../../lib/accounting/auto-journal");
			// Prefer the DB-backed category's GL account + VAT treatment (custom categories)
			const payCategory = expense.categoryId
				? await db.orgCategory.findUnique({
						where: { id: expense.categoryId },
						select: { accountCode: true, isVatExempt: true },
					})
				: null;
			await onExpenseCompleted(db, {
				id: expense.id,
				organizationId: input.organizationId,
				category: expense.category,
				accountCode: payCategory?.accountCode,
				isVatExempt: payCategory?.isVatExempt,
				amount: expense.amount,
				date: expense.date,
				description: expense.description ?? expense.category,
				sourceAccountId: input.sourceAccountId,
				projectId: expense.projectId,
				sourceType: expense.sourceType,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to generate entry for expense payment:", e);
			await orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: expense.id,
				metadata: { error: String(e), referenceType: "EXPENSE" },
			});
		}

		// Auto-create payment voucher for paid expense
		try {
			const { generateAtomicNo } = await import("@repo/database");
			const { numberToArabicWords } = await import("@repo/utils");
			const voucherNo = await generateAtomicNo(input.organizationId, "PMT");
			await db.paymentVoucher.create({
				data: {
					organizationId: input.organizationId,
					voucherNo,
					expenseId: expense.id,
					date: expense.date,
					amount: expense.amount,
					amountInWords: numberToArabicWords(Number(expense.amount)),
					payeeName: expense.vendorName || expense.description || expense.category,
					payeeType: "SUPPLIER",
					paymentMethod: input.paymentMethod || "BANK_TRANSFER",
					sourceAccountId: input.sourceAccountId || null,
					projectId: expense.projectId || null,
					status: "ISSUED",
					preparedById: context.user.id,
					approvedById: context.user.id,
					approvedAt: new Date(),
				},
			});
		} catch (e) {
			console.error("[PaymentVoucher] Failed to create auto voucher from expense payment:", e);
			await orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "voucher",
				entityId: input.id ?? input.organizationId,
				metadata: { error: String(e), type: "PAYMENT_VOUCHER_AUTO_CREATE" },
			});
		}

		return expense;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CANCEL EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const cancelExpenseProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/expenses/{id}/cancel",
		tags: ["Finance", "Expenses"],
		summary: "Cancel a pending expense",
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
			action: "payments",
		});

		const expense = await cancelExpense(input.id, input.organizationId);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "EXPENSE_CANCELLED",
			entityType: "expense",
			entityId: input.id,
		});

		// Auto-Journal: reverse accounting entry for cancelled expense
		try {
			const { reverseAutoJournalEntry } = await import("../../../lib/accounting/auto-journal");
			await reverseAutoJournalEntry(db, {
				organizationId: input.organizationId,
				referenceType: "EXPENSE",
				referenceId: input.id,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to reverse entry for cancelled expense:", e);
			await orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: input.id,
				metadata: { error: String(e), referenceType: "EXPENSE" },
			});
		}

		return expense;
	});

// ═══════════════════════════════════════════════════════════════════════════
// LIST EXPENSES WITH SUBCONTRACT PAYMENTS (UNIFIED)
// ═══════════════════════════════════════════════════════════════════════════
export const listExpensesWithSubcontracts = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/expenses-unified",
		tags: ["Finance", "Expenses"],
		summary: "List expenses + subcontract payments unified",
	})
	.input(
		z.object({
			organizationId: idString(),
			category: orgExpenseCategoryEnum.optional(),
			categoryId: z.string().trim().max(100).optional(),
			sourceAccountId: z.string().trim().max(100).optional(),
			projectId: z.string().trim().max(100).optional(),
			status: financeTransactionStatusEnum.optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
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

		const partnerAccessLevel = await resolvePartnerAccessLevel(
			input.organizationId,
			context.user.id,
		);
		const canSeeOwnerDrawings = partnerAccessLevel !== "none";
		const categoryFilterBlocksDrawings =
			(!!input.category && input.category !== "SUBCONTRACTOR") ||
			!!input.categoryId;

		// Fetch all three streams in parallel
		const [expensesResult, subPaymentsResult, ownerDrawings] = await Promise.all([
			getOrganizationExpenses(input.organizationId, {
				category: input.category,
				categoryId: input.categoryId,
				sourceAccountId: input.sourceAccountId,
				projectId: input.projectId,
				status: input.status,
				dateFrom: input.dateFrom,
				dateTo: input.dateTo,
				query: input.query,
				limit: 200, // fetch more so we can merge and re-sort
				offset: 0,
			}),
			// Only fetch subcontract payments if no category filter (or if category is SUBCONTRACTOR)
			(!input.category && !input.categoryId) || input.category === "SUBCONTRACTOR"
				? getOrganizationSubcontractPayments(input.organizationId, {
						projectId: input.projectId,
						status: input.status,
						dateFrom: input.dateFrom,
						dateTo: input.dateTo,
						query: input.query,
						limit: 200,
						offset: 0,
					})
				: { payments: [], total: 0 },
			// Owner drawings — only for OWNER / ACCOUNTANT, and only when category filter doesn't exclude them
			canSeeOwnerDrawings && !categoryFilterBlocksDrawings
				? db.ownerDrawing.findMany({
						where: {
							organizationId: input.organizationId,
							status: "APPROVED",
							...(input.projectId ? { projectId: input.projectId } : {}),
							...(input.sourceAccountId
								? { bankAccountId: input.sourceAccountId }
								: {}),
							...(input.dateFrom || input.dateTo
								? {
										date: {
											...(input.dateFrom ? { gte: input.dateFrom } : {}),
											...(input.dateTo ? { lte: input.dateTo } : {}),
										},
									}
								: {}),
							...(input.query
								? {
										OR: [
											{
												drawingNo: {
													contains: input.query,
													mode: "insensitive" as const,
												},
											},
											{
												description: {
													contains: input.query,
													mode: "insensitive" as const,
												},
											},
											{
												owner: {
													name: {
														contains: input.query,
														mode: "insensitive" as const,
													},
												},
											},
										],
									}
								: {}),
						},
						include: {
							owner: { select: { id: true, name: true } },
							bankAccount: { select: { id: true, name: true } },
							project: { select: { id: true, name: true } },
							createdBy: { select: { id: true, name: true } },
						},
						orderBy: [{ date: "desc" }, { createdAt: "desc" }],
						take: 200,
					})
				: [],
		]);

		// Normalize expenses
		const normalizedExpenses = expensesResult.expenses.map((e) => ({
			_type: "expense" as const,
			id: e.id,
			refNo: e.expenseNo,
			date: e.date,
			category: e.categoryId ?? e.category,
			categoryNameAr: e.categoryRef?.nameAr ?? null,
			categoryNameEn: e.categoryRef?.nameEn ?? null,
			subcategoryNameAr: e.subcategoryRef?.nameAr ?? null,
			subcategoryNameEn: e.subcategoryRef?.nameEn ?? null,
			description: e.description,
			amount: Number(e.amount),
			vendorName: e.vendorName,
			status: e.status,
			sourceAccount: e.sourceAccount,
			project: e.project,
			createdBy: e.createdBy,
			// Subcontract-specific fields
			contractName: null as string | null,
			contractNo: null as string | null,
			ownerId: null as string | null,
			hasOverdrawWarning: false,
		}));

		// Normalize subcontract payments
		const normalizedSubPayments = subPaymentsResult.payments.map((p) => ({
			_type: "subcontract_payment" as const,
			id: p.id,
			refNo: p.paymentNo,
			date: p.date,
			category: "SUBCONTRACTOR" as const,
			categoryNameAr: null as string | null,
			categoryNameEn: null as string | null,
			subcategoryNameAr: null as string | null,
			subcategoryNameEn: null as string | null,
			description: p.description,
			amount: Number(p.amount),
			vendorName: p.contract.name,
			status: p.status,
			sourceAccount: p.sourceAccount,
			project: p.contract.project,
			createdBy: p.createdBy,
			contractName: p.contract.name,
			contractNo: p.contract.contractNo,
			ownerId: null as string | null,
			hasOverdrawWarning: false,
		}));

		// Normalize owner drawings
		const normalizedOwnerDrawings = ownerDrawings.map((d) => ({
			_type: "owner_drawing" as const,
			id: d.id,
			refNo: d.drawingNo,
			date: d.date,
			category: "OWNER_DRAWING" as const,
			categoryNameAr: null as string | null,
			categoryNameEn: null as string | null,
			subcategoryNameAr: null as string | null,
			subcategoryNameEn: null as string | null,
			description: d.description ?? "",
			amount: Number(d.amount),
			vendorName: d.owner.name,
			status: d.status,
			sourceAccount: d.bankAccount ?? null,
			project: d.project ?? null,
			createdBy: d.createdBy,
			contractName: null as string | null,
			contractNo: null as string | null,
			ownerId: d.ownerId,
			hasOverdrawWarning: d.hasOverdrawWarning,
		}));

		// Merge and sort by date descending
		const unified = [
			...normalizedExpenses,
			...normalizedSubPayments,
			...normalizedOwnerDrawings,
		].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);

		// Apply pagination
		const paged = unified.slice(input.offset, input.offset + input.limit);
		const total =
			expensesResult.total +
			subPaymentsResult.total +
			normalizedOwnerDrawings.length;

		// Compute combined summary
		const expensesTotal = normalizedExpenses.reduce(
			(sum, e) => sum + e.amount,
			0,
		);
		const subcontractTotal = normalizedSubPayments.reduce(
			(sum, p) => sum + p.amount,
			0,
		);
		const ownerDrawingsTotal = normalizedOwnerDrawings.reduce(
			(sum, d) => sum + d.amount,
			0,
		);

		return {
			items: paged,
			total,
			expensesTotal,
			subcontractTotal,
			ownerDrawingsTotal,
			grandTotal: expensesTotal + subcontractTotal + ownerDrawingsTotal,
			partnerAccessLevel,
		};
	});
