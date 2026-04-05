// Year-End Closing — إقفال نهاية السنة المالية
// Preview + Execute + History + Reverse

import {
	createJournalEntry,
	getJournalIncomeStatement,
	reverseJournalEntry,
} from "@repo/database";
import { db, orgAuditLog } from "@repo/database";
import { z } from "zod";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";
import { Prisma } from "@repo/database/prisma/generated/client";

const ZERO = new Prisma.Decimal(0);

// ========== 1. Preview Year-End Closing ==========

export const previewYearEndProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/year-end/preview",
		tags: ["Accounting", "Year-End Closing"],
		summary: "Preview year-end closing before executing",
	})
	.input(
		z.object({
			organizationId: idString(),
			fiscalYear: z.number().int().min(2020).max(2099),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const { organizationId, fiscalYear } = input;
		const dateFrom = new Date(fiscalYear, 0, 1);
		const dateTo = new Date(fiscalYear, 11, 31);

		// Step 1: Get income statement for the full year
		const incomeStatement = await getJournalIncomeStatement(db, organizationId, {
			dateFrom,
			dateTo,
		});

		const totalRevenue = incomeStatement.revenue.total;
		const totalExpenses =
			incomeStatement.costOfProjects.total + incomeStatement.operatingExpenses.total;
		const netProfit = incomeStatement.netProfit;

		// Step 2: Query all postable REVENUE and EXPENSE accounts with their balances
		const accountBalances = await db.$queryRaw<
			Array<{
				accountId: string;
				code: string;
				nameAr: string;
				nameEn: string;
				type: string;
				totalDebit: string;
				totalCredit: string;
			}>
		>`
			SELECT
				a."id" as "accountId", a."code", a."name_ar" as "nameAr", a."name_en" as "nameEn",
				a."type"::text,
				COALESCE(SUM(jel."debit"), 0)::text as "totalDebit",
				COALESCE(SUM(jel."credit"), 0)::text as "totalCredit"
			FROM "chart_accounts" a
			LEFT JOIN "journal_entry_lines" jel ON jel."account_id" = a."id"
			LEFT JOIN "journal_entries" je ON je."id" = jel."journal_entry_id"
				AND je."status" = 'POSTED'
				AND je."date" >= ${dateFrom}
				AND je."date" <= ${dateTo}
			WHERE a."organization_id" = ${organizationId}
				AND a."is_postable" = true
				AND a."is_active" = true
				AND a."type" IN ('REVENUE', 'EXPENSE')
			GROUP BY a."id"
			HAVING COALESCE(SUM(jel."debit"), 0) != 0 OR COALESCE(SUM(jel."credit"), 0) != 0
			ORDER BY a."code"
		`;

		const revenueAccountDetails = accountBalances
			.filter((a) => a.type === "REVENUE")
			.map((a) => ({
				accountId: a.accountId,
				code: a.code,
				nameAr: a.nameAr,
				nameEn: a.nameEn,
				balance: Number(a.totalCredit) - Number(a.totalDebit),
			}))
			.filter((a) => a.balance !== 0);

		const expenseAccountDetails = accountBalances
			.filter((a) => a.type === "EXPENSE")
			.map((a) => ({
				accountId: a.accountId,
				code: a.code,
				nameAr: a.nameAr,
				nameEn: a.nameEn,
				balance: Number(a.totalDebit) - Number(a.totalCredit),
			}))
			.filter((a) => a.balance !== 0);

		// Step 3: Get all active organization owners
		const owners = await db.organizationOwner.findMany({
			where: { organizationId, isActive: true },
			orderBy: { createdAt: "asc" },
		});

		// Step 4: Get APPROVED drawings per owner for the year
		const drawingsGrouped = await db.ownerDrawing.groupBy({
			by: ["ownerId"],
			where: {
				organizationId,
				status: "APPROVED",
				date: { gte: dateFrom, lte: dateTo },
			},
			_sum: { amount: true },
		});

		const drawingsPerOwner: Record<string, number> = {};
		for (const g of drawingsGrouped) {
			drawingsPerOwner[g.ownerId] = Number(g._sum.amount ?? 0);
		}

		// Step 5: Get drawings sub-account balances (34xx accounts)
		const drawingsAccounts = await db.chartAccount.findMany({
			where: {
				organizationId,
				code: { startsWith: "34" },
				level: { gte: 3 },
				isPostable: true,
				isActive: true,
			},
			select: { id: true, code: true, nameAr: true, nameEn: true },
		});

		const drawingsAccountBalances: Array<{
			accountId: string;
			code: string;
			nameAr: string;
			nameEn: string | null;
			balance: number;
		}> = [];

		if (drawingsAccounts.length > 0) {
			const drawingsBalanceRows = await db.$queryRaw<
				Array<{
					accountId: string;
					totalDebit: string;
					totalCredit: string;
				}>
			>`
				SELECT
					jel."account_id" as "accountId",
					COALESCE(SUM(jel."debit"), 0)::text as "totalDebit",
					COALESCE(SUM(jel."credit"), 0)::text as "totalCredit"
				FROM "journal_entry_lines" jel
				JOIN "journal_entries" je ON je."id" = jel."journal_entry_id"
					AND je."status" = 'POSTED'
					AND je."date" >= ${dateFrom}
					AND je."date" <= ${dateTo}
				WHERE jel."account_id" IN (${Prisma.join(drawingsAccounts.map((a) => a.id))})
				GROUP BY jel."account_id"
			`;

			const balanceMap = new Map(
				drawingsBalanceRows.map((r) => [
					r.accountId,
					Number(r.totalDebit) - Number(r.totalCredit),
				]),
			);

			for (const acc of drawingsAccounts) {
				const balance = balanceMap.get(acc.id) ?? 0;
				if (balance !== 0) {
					drawingsAccountBalances.push({
						accountId: acc.id,
						code: acc.code,
						nameAr: acc.nameAr,
						nameEn: acc.nameEn,
						balance,
					});
				}
			}
		}

		const totalDrawings = drawingsAccountBalances.reduce((s, a) => s + a.balance, 0);

		// Step 6: Compute per-owner distribution
		const profitDistribution = owners.map((owner) => {
			const ownershipPercent = Number(owner.ownershipPercent);
			const shareOfProfit = netProfit * (ownershipPercent / 100);
			const drawings = drawingsPerOwner[owner.id] ?? 0;
			return {
				ownerId: owner.id,
				ownerName: owner.name,
				ownershipPercent,
				shareOfProfit: Math.round(shareOfProfit * 100) / 100,
				drawings,
				netToRetained: Math.round((shareOfProfit - drawings) * 100) / 100,
			};
		});

		// Step 7: Check warnings
		const warnings: string[] = [];

		// Count DRAFT journal entries for the year
		const draftCount = await db.journalEntry.count({
			where: {
				organizationId,
				status: "DRAFT",
				date: { gte: dateFrom, lte: dateTo },
			},
		});
		if (draftCount > 0) {
			warnings.push(`يوجد ${draftCount} قيد مسودة لم يُرحّل بعد في السنة المالية`);
		}

		// Count open (not closed) accounting periods for the year
		const openPeriodsCount = await db.accountingPeriod.count({
			where: {
				organizationId,
				isClosed: false,
				startDate: { gte: dateFrom },
				endDate: { lte: dateTo },
			},
		});
		if (openPeriodsCount > 0) {
			warnings.push(`يوجد ${openPeriodsCount} فترة محاسبية مفتوحة لم تُغلق بعد`);
		}

		// Check if YearEndClosing already exists for this year
		const existingClosing = await db.yearEndClosing.findUnique({
			where: {
				organizationId_fiscalYear: { organizationId, fiscalYear },
			},
		});
		const isAlreadyClosed =
			existingClosing !== null && existingClosing.status !== "REVERSED";
		if (isAlreadyClosed) {
			warnings.push("تم إقفال هذه السنة المالية مسبقاً");
		}

		// Check if total ownership % = 100
		const totalOwnership = owners.reduce(
			(s, o) => s + Number(o.ownershipPercent),
			0,
		);
		if (owners.length > 0 && Math.abs(totalOwnership - 100) > 0.01) {
			warnings.push(
				`مجموع نسب الملكية ${totalOwnership}% — يجب أن يكون 100%`,
			);
		}

		return {
			fiscalYear,
			totalRevenue,
			totalExpenses,
			netProfit,
			revenueAccounts: revenueAccountDetails,
			expenseAccounts: expenseAccountDetails,
			profitDistribution,
			totalDrawings,
			drawingsAccounts: drawingsAccountBalances,
			retainedEarningsTransfer: Math.round((netProfit - totalDrawings) * 100) / 100,
			warnings,
			isAlreadyClosed,
		};
	});

// ========== 2. Execute Year-End Closing ==========

export const executeYearEndProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/year-end/execute",
		tags: ["Accounting", "Year-End Closing"],
		summary: "Execute year-end closing — creates journal entries and transfers to retained earnings",
	})
	.input(
		z.object({
			organizationId: idString(),
			fiscalYear: z.number().int().min(2020).max(2099),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "edit",
		});

		const { organizationId, fiscalYear } = input;
		const dateFrom = new Date(fiscalYear, 0, 1);
		const dateTo = new Date(fiscalYear, 11, 31);

		// Step 1: Verify year not already closed
		const existing = await db.yearEndClosing.findUnique({
			where: {
				organizationId_fiscalYear: { organizationId, fiscalYear },
			},
		});
		if (existing && existing.status !== "REVERSED") {
			throw new Error("تم إقفال هذه السنة المالية مسبقاً — لا يمكن إقفالها مرة أخرى");
		}

		// Step 2: Get income statement for the year
		const incomeStatement = await getJournalIncomeStatement(db, organizationId, {
			dateFrom,
			dateTo,
		});

		const totalRevenue = incomeStatement.revenue.total;
		const totalExpenses =
			incomeStatement.costOfProjects.total + incomeStatement.operatingExpenses.total;
		const netProfit = incomeStatement.netProfit;

		// Step 3: Inside transaction — build and create closing entries
		const result = await db.$transaction(async (tx) => {
			// 3a: Get all postable REVENUE and EXPENSE accounts with balances for the year
			const accountBalances = await tx.$queryRaw<
				Array<{
					accountId: string;
					code: string;
					type: string;
					totalDebit: string;
					totalCredit: string;
				}>
			>`
				SELECT
					a."id" as "accountId", a."code",
					a."type"::text,
					COALESCE(SUM(jel."debit"), 0)::text as "totalDebit",
					COALESCE(SUM(jel."credit"), 0)::text as "totalCredit"
				FROM "chart_accounts" a
				LEFT JOIN "journal_entry_lines" jel ON jel."account_id" = a."id"
				LEFT JOIN "journal_entries" je ON je."id" = jel."journal_entry_id"
					AND je."status" = 'POSTED'
					AND je."date" >= ${dateFrom}
					AND je."date" <= ${dateTo}
				WHERE a."organization_id" = ${organizationId}
					AND a."is_postable" = true
					AND a."is_active" = true
					AND a."type" IN ('REVENUE', 'EXPENSE')
				GROUP BY a."id"
				HAVING COALESCE(SUM(jel."debit"), 0) != 0 OR COALESCE(SUM(jel."credit"), 0) != 0
				ORDER BY a."code"
			`;

			// 3b: Build closing entry lines
			const closingLines: Array<{
				accountId: string;
				debit: Prisma.Decimal;
				credit: Prisma.Decimal;
				description?: string;
			}> = [];

			for (const acct of accountBalances) {
				const debit = Number(acct.totalDebit);
				const credit = Number(acct.totalCredit);

				if (acct.type === "REVENUE") {
					// Revenue accounts have credit balance — debit them to zero out
					const balance = credit - debit;
					if (balance > 0) {
						closingLines.push({
							accountId: acct.accountId,
							debit: new Prisma.Decimal(balance.toFixed(2)),
							credit: ZERO,
							description: `إقفال حساب إيرادات ${acct.code}`,
						});
					} else if (balance < 0) {
						closingLines.push({
							accountId: acct.accountId,
							debit: ZERO,
							credit: new Prisma.Decimal(Math.abs(balance).toFixed(2)),
							description: `إقفال حساب إيرادات ${acct.code}`,
						});
					}
				} else if (acct.type === "EXPENSE") {
					// Expense accounts have debit balance — credit them to zero out
					const balance = debit - credit;
					if (balance > 0) {
						closingLines.push({
							accountId: acct.accountId,
							debit: ZERO,
							credit: new Prisma.Decimal(balance.toFixed(2)),
							description: `إقفال حساب مصروفات ${acct.code}`,
						});
					} else if (balance < 0) {
						closingLines.push({
							accountId: acct.accountId,
							debit: new Prisma.Decimal(Math.abs(balance).toFixed(2)),
							credit: ZERO,
							description: `إقفال حساب مصروفات ${acct.code}`,
						});
					}
				}
			}

			// Find retained earnings account (3200)
			const retainedEarningsAccount = await tx.chartAccount.findFirst({
				where: { organizationId, code: "3200", isActive: true },
			});
			if (!retainedEarningsAccount) {
				throw new Error("حساب الأرباح المبقاة (3200) غير موجود — يرجى إنشاء دليل الحسابات أولاً");
			}

			// Net difference goes to 3200 (Retained Earnings)
			if (netProfit > 0) {
				// Net profit — credit retained earnings
				closingLines.push({
					accountId: retainedEarningsAccount.id,
					debit: ZERO,
					credit: new Prisma.Decimal(netProfit.toFixed(2)),
					description: `صافي ربح السنة المالية ${fiscalYear} → أرباح مبقاة`,
				});
			} else if (netProfit < 0) {
				// Net loss — debit retained earnings
				closingLines.push({
					accountId: retainedEarningsAccount.id,
					debit: new Prisma.Decimal(Math.abs(netProfit).toFixed(2)),
					credit: ZERO,
					description: `صافي خسارة السنة المالية ${fiscalYear} → أرباح مبقاة`,
				});
			}

			// 3c: Create closing journal entry
			let closingEntry: { id: string } | null = null;
			if (closingLines.length >= 2) {
				closingEntry = await createJournalEntry(db, {
					organizationId,
					date: dateTo,
					description: `قيد إقفال نهاية السنة المالية ${fiscalYear}`,
					referenceType: "YEAR_END_CLOSING",
					referenceId: `year-end-${fiscalYear}`,
					isAutoGenerated: true,
					lines: closingLines,
					createdById: context.user.id,
				});
			}

			// 3d: Get all owner drawings sub-accounts (34xx level 3) with balances > 0
			const drawingsAccounts = await tx.chartAccount.findMany({
				where: {
					organizationId,
					code: { startsWith: "34" },
					level: { gte: 3 },
					isPostable: true,
					isActive: true,
				},
				select: { id: true, code: true },
			});

			let drawingsClosingEntry: { id: string } | null = null;
			let totalDrawingsAmount = 0;

			if (drawingsAccounts.length > 0) {
				const drawingsBalanceRows = await tx.$queryRaw<
					Array<{
						accountId: string;
						totalDebit: string;
						totalCredit: string;
					}>
				>`
					SELECT
						jel."account_id" as "accountId",
						COALESCE(SUM(jel."debit"), 0)::text as "totalDebit",
						COALESCE(SUM(jel."credit"), 0)::text as "totalCredit"
					FROM "journal_entry_lines" jel
					JOIN "journal_entries" je ON je."id" = jel."journal_entry_id"
						AND je."status" = 'POSTED'
						AND je."date" >= ${dateFrom}
						AND je."date" <= ${dateTo}
					WHERE jel."account_id" IN (${Prisma.join(drawingsAccounts.map((a) => a.id))})
					GROUP BY jel."account_id"
				`;

				// 3e: If any drawings exist, build drawings closing entry
				const drawingsLines: Array<{
					accountId: string;
					debit: Prisma.Decimal;
					credit: Prisma.Decimal;
					description?: string;
				}> = [];

				for (const row of drawingsBalanceRows) {
					const balance = Number(row.totalDebit) - Number(row.totalCredit);
					if (balance > 0) {
						// Drawings accounts have debit balance — credit to zero out
						drawingsLines.push({
							accountId: row.accountId,
							debit: ZERO,
							credit: new Prisma.Decimal(balance.toFixed(2)),
							description: `إقفال حساب سحوبات شريك`,
						});
						totalDrawingsAmount += balance;
					}
				}

				if (drawingsLines.length > 0) {
					// DR 3200 by total drawings
					drawingsLines.push({
						accountId: retainedEarningsAccount.id,
						debit: new Prisma.Decimal(totalDrawingsAmount.toFixed(2)),
						credit: ZERO,
						description: `إقفال سحوبات الشركاء → أرباح مبقاة ${fiscalYear}`,
					});

					drawingsClosingEntry = await createJournalEntry(db, {
						organizationId,
						date: dateTo,
						description: `قيد إقفال سحوبات الشركاء للسنة المالية ${fiscalYear}`,
						referenceType: "YEAR_END_RETAINED",
						referenceId: `year-end-drawings-${fiscalYear}`,
						isAutoGenerated: true,
						lines: drawingsLines,
						createdById: context.user.id,
					});
				}
			}

			// 3f: Build distribution details for owners
			const owners = await tx.organizationOwner.findMany({
				where: { organizationId, isActive: true },
				orderBy: { createdAt: "asc" },
			});

			const drawingsGrouped = await tx.ownerDrawing.groupBy({
				by: ["ownerId"],
				where: {
					organizationId,
					status: "APPROVED",
					date: { gte: dateFrom, lte: dateTo },
				},
				_sum: { amount: true },
			});

			const drawingsPerOwner: Record<string, number> = {};
			for (const g of drawingsGrouped) {
				drawingsPerOwner[g.ownerId] = Number(g._sum.amount ?? 0);
			}

			const distributionDetails = owners.map((owner) => {
				const ownershipPercent = Number(owner.ownershipPercent);
				const shareOfProfit = netProfit * (ownershipPercent / 100);
				const drawings = drawingsPerOwner[owner.id] ?? 0;
				return {
					ownerId: owner.id,
					ownerName: owner.name,
					ownershipPercent,
					shareOfProfit: Math.round(shareOfProfit * 100) / 100,
					drawings,
					netToRetained: Math.round((shareOfProfit - drawings) * 100) / 100,
				};
			});

			// If a previous REVERSED closing exists for this year, delete it before creating new one
			if (existing && existing.status === "REVERSED") {
				await tx.yearEndClosing.delete({
					where: { id: existing.id },
				});
			}

			// Create YearEndClosing record
			const yearEndClosing = await tx.yearEndClosing.create({
				data: {
					organizationId,
					fiscalYear,
					closingDate: dateTo,
					totalRevenue: new Prisma.Decimal(totalRevenue.toFixed(2)),
					totalExpenses: new Prisma.Decimal(totalExpenses.toFixed(2)),
					netProfit: new Prisma.Decimal(netProfit.toFixed(2)),
					totalDrawings: new Prisma.Decimal(totalDrawingsAmount.toFixed(2)),
					retainedEarningsTransfer: new Prisma.Decimal(
						(netProfit - totalDrawingsAmount).toFixed(2),
					),
					closingJournalEntryId: closingEntry?.id ?? null,
					drawingsClosingEntryId: drawingsClosingEntry?.id ?? null,
					distributionDetails,
					status: "COMPLETED",
					createdById: context.user.id,
				},
			});

			return yearEndClosing;
		});

		// Audit log (outside transaction — fire and forget)
		orgAuditLog({
			organizationId,
			actorId: context.user.id,
			action: "YEAR_END_CLOSING_EXECUTED",
			entityType: "YearEndClosing",
			entityId: result.id,
			metadata: {
				fiscalYear,
				netProfit,
				totalRevenue,
				totalExpenses,
				closingJournalEntryId: result.closingJournalEntryId,
				drawingsClosingEntryId: result.drawingsClosingEntryId,
			},
		});

		return {
			id: result.id,
			fiscalYear: result.fiscalYear,
			closingDate: result.closingDate,
			totalRevenue: Number(result.totalRevenue),
			totalExpenses: Number(result.totalExpenses),
			netProfit: Number(result.netProfit),
			totalDrawings: Number(result.totalDrawings),
			retainedEarningsTransfer: Number(result.retainedEarningsTransfer),
			closingJournalEntryId: result.closingJournalEntryId,
			drawingsClosingEntryId: result.drawingsClosingEntryId,
			distributionDetails: result.distributionDetails,
			status: result.status,
			createdAt: result.createdAt,
		};
	});

// ========== 3. Year-End Closing History ==========

export const yearEndHistoryProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/year-end/history",
		tags: ["Accounting", "Year-End Closing"],
		summary: "List all year-end closings for the organization",
	})
	.input(z.object({ organizationId: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const closings = await db.yearEndClosing.findMany({
			where: { organizationId: input.organizationId },
			orderBy: { fiscalYear: "desc" },
			include: {
				createdBy: { select: { name: true } },
				reversedBy: { select: { name: true } },
			},
		});

		return closings.map((c) => ({
			id: c.id,
			fiscalYear: c.fiscalYear,
			closingDate: c.closingDate,
			totalRevenue: Number(c.totalRevenue),
			totalExpenses: Number(c.totalExpenses),
			netProfit: Number(c.netProfit),
			totalDrawings: Number(c.totalDrawings),
			retainedEarningsTransfer: Number(c.retainedEarningsTransfer),
			closingJournalEntryId: c.closingJournalEntryId,
			drawingsClosingEntryId: c.drawingsClosingEntryId,
			distributionDetails: c.distributionDetails,
			status: c.status,
			createdBy: c.createdBy,
			createdAt: c.createdAt,
			reversedBy: c.reversedBy,
			reversedAt: c.reversedAt,
		}));
	});

// ========== 4. Reverse Year-End Closing ==========

export const reverseYearEndProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/accounting/year-end/reverse",
		tags: ["Accounting", "Year-End Closing"],
		summary: "Reverse a year-end closing — reverses journal entries and marks as reversed",
	})
	.input(
		z.object({
			organizationId: idString(),
			fiscalYear: z.number().int().min(2020).max(2099),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "edit",
		});

		const { organizationId, fiscalYear } = input;

		// Find YearEndClosing for this year/org
		const closing = await db.yearEndClosing.findUnique({
			where: {
				organizationId_fiscalYear: { organizationId, fiscalYear },
			},
		});

		if (!closing) {
			throw new Error("لا يوجد إقفال لهذه السنة المالية");
		}
		if (closing.status === "REVERSED") {
			throw new Error("تم عكس إقفال هذه السنة المالية مسبقاً");
		}

		// Reverse both journal entries if they exist
		if (closing.closingJournalEntryId) {
			await reverseJournalEntry(
				db,
				closing.closingJournalEntryId,
				context.user.id,
				new Date(),
			);
		}

		if (closing.drawingsClosingEntryId) {
			await reverseJournalEntry(
				db,
				closing.drawingsClosingEntryId,
				context.user.id,
				new Date(),
			);
		}

		// Update YearEndClosing status
		await db.yearEndClosing.update({
			where: { id: closing.id },
			data: {
				status: "REVERSED",
				reversedAt: new Date(),
				reversedById: context.user.id,
			},
		});

		// Audit log
		orgAuditLog({
			organizationId,
			actorId: context.user.id,
			action: "YEAR_END_CLOSING_REVERSED",
			entityType: "YearEndClosing",
			entityId: closing.id,
			metadata: {
				fiscalYear,
				closingId: closing.id,
			},
		});

		return { success: true };
	});
