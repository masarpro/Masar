// Partners Finance — unified financial view per partner
// listWithSummary + detail + comparisonReport
// Access: OWNER → full | ACCOUNTANT → limited (drawings+contributions only) | other → forbidden

import { db, getJournalIncomeStatement } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { idString } from "../../../lib/validation-constants";
import { ORPCError } from "@orpc/server";
import {
	resolvePartnerAccessLevel,
	verifyPartnerAccess,
} from "../lib/partner-access";

// ═══════════════════════════════════════════════════════════════════════════
// 1. LIST WITH SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
export const partnerListWithSummaryProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/partners/summary",
		tags: ["Accounting", "Partners"],
		summary: "List partners with financial summary (access-gated)",
	})
	.input(
		z.object({
			organizationId: idString(),
			year: z.number().int().min(2000).max(2100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const level = await verifyPartnerAccess(
			input.organizationId,
			context.user.id,
			"limited",
		);

		const owners = await db.organizationOwner.findMany({
			where: { organizationId: input.organizationId, isActive: true },
			orderBy: { ownershipPercent: "desc" },
		});

		const now = new Date();
		const year = input.year ?? now.getFullYear();
		const yearStart = new Date(year, 0, 1);
		const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

		// Company-wide net profit — needed only for full-access consumers
		let netProfit = 0;
		if (level === "full") {
			const statement = await getJournalIncomeStatement(
				db,
				input.organizationId,
				{ dateFrom: yearStart, dateTo: yearEnd },
			);
			netProfit = Number(statement.netProfit ?? 0);
		}

		const summaries = await Promise.all(
			owners.map(async (owner) => {
				const [drawingsAgg, contributionsAgg] = await Promise.all([
					db.ownerDrawing.aggregate({
						_sum: { amount: true },
						_count: { _all: true },
						where: {
							organizationId: input.organizationId,
							ownerId: owner.id,
							status: "APPROVED",
							date: { gte: yearStart, lte: yearEnd },
						},
					}),
					db.capitalContribution.aggregate({
						_sum: { amount: true },
						_count: { _all: true },
						where: {
							organizationId: input.organizationId,
							ownerId: owner.id,
						},
					}),
				]);

				const totalDrawings = Number(drawingsAgg._sum.amount ?? 0);
				const totalContributions = Number(
					contributionsAgg._sum.amount ?? 0,
				);
				const ownershipPercent = Number(owner.ownershipPercent);

				if (level !== "full") {
					return {
						id: owner.id,
						name: owner.name,
						nameEn: owner.nameEn,
						ownershipPercent,
						totalDrawings,
						drawingsCount: drawingsAgg._count._all,
						totalContributions,
						contributionsCount: contributionsAgg._count._all,
						shareOfProfit: null,
						netBalance: null,
					};
				}

				const shareOfProfit = netProfit * (ownershipPercent / 100);
				const netBalance =
					totalContributions + shareOfProfit - totalDrawings;

				return {
					id: owner.id,
					name: owner.name,
					nameEn: owner.nameEn,
					ownershipPercent,
					totalDrawings,
					drawingsCount: drawingsAgg._count._all,
					totalContributions,
					contributionsCount: contributionsAgg._count._all,
					shareOfProfit,
					netBalance,
				};
			}),
		);

		return {
			partners: summaries,
			year,
			accessLevel: level,
			totals:
				level === "full"
					? {
							netProfit,
							totalDrawings: summaries.reduce(
								(s, p) => s + p.totalDrawings,
								0,
							),
							totalContributions: summaries.reduce(
								(s, p) => s + p.totalContributions,
								0,
							),
							totalShareOfProfit: summaries.reduce(
								(s, p) => s + (p.shareOfProfit ?? 0),
								0,
							),
						}
					: null,
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// 2. PARTNER DETAIL
// ═══════════════════════════════════════════════════════════════════════════
export const partnerDetailProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/partners/{id}",
		tags: ["Accounting", "Partners"],
		summary: "Partner full detail (access-gated)",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			year: z.number().int().min(2000).max(2100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const level = await verifyPartnerAccess(
			input.organizationId,
			context.user.id,
			"limited",
		);

		const owner = await db.organizationOwner.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
		});
		if (!owner) {
			throw new ORPCError("NOT_FOUND", {
				message: "الشريك غير موجود",
			});
		}

		const now = new Date();
		const year = input.year ?? now.getFullYear();
		const yearStart = new Date(year, 0, 1);
		const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

		const [drawings, contributions] = await Promise.all([
			db.ownerDrawing.findMany({
				where: {
					organizationId: input.organizationId,
					ownerId: input.id,
					date: { gte: yearStart, lte: yearEnd },
				},
				include: {
					project: { select: { id: true, name: true } },
					bankAccount: { select: { id: true, name: true } },
				},
				orderBy: { date: "desc" },
			}),
			db.capitalContribution.findMany({
				where: {
					organizationId: input.organizationId,
					ownerId: input.id,
				},
				include: {
					bankAccount: { select: { id: true, name: true } },
				},
				orderBy: { date: "desc" },
			}),
		]);

		const approvedDrawings = drawings.filter((d) => d.status === "APPROVED");
		const totalDrawings = approvedDrawings.reduce(
			(sum, d) => sum + Number(d.amount),
			0,
		);
		const totalContributions = contributions.reduce(
			(sum, c) => sum + Number(c.amount),
			0,
		);
		const ownershipPercent = Number(owner.ownershipPercent);

		let netProfit: number | null = null;
		let shareOfProfit: number | null = null;
		let netBalance: number | null = null;
		let drawingsByProject: Array<{
			projectId: string | null;
			projectName: string;
			total: number;
			count: number;
		}> | null = null;

		if (level === "full") {
			const statement = await getJournalIncomeStatement(
				db,
				input.organizationId,
				{ dateFrom: yearStart, dateTo: yearEnd },
			);
			netProfit = Number(statement.netProfit ?? 0);
			shareOfProfit = netProfit * (ownershipPercent / 100);
			netBalance = totalContributions + shareOfProfit - totalDrawings;

			const projectMap = new Map<
				string | null,
				{ name: string; total: number; count: number }
			>();
			for (const d of approvedDrawings) {
				const key = d.projectId;
				const existing = projectMap.get(key);
				if (existing) {
					existing.total += Number(d.amount);
					existing.count += 1;
				} else {
					projectMap.set(key, {
						name: d.project?.name ?? "عام / بدون مشروع",
						total: Number(d.amount),
						count: 1,
					});
				}
			}
			drawingsByProject = Array.from(projectMap.entries()).map(
				([projectId, data]) => ({
					projectId,
					projectName: data.name,
					total: data.total,
					count: data.count,
				}),
			);
		}

		return {
			owner: {
				id: owner.id,
				name: owner.name,
				nameEn: owner.nameEn,
				ownershipPercent,
				phone: owner.phone,
				email: owner.email,
				nationalId: owner.nationalId,
				isActive: owner.isActive,
			},
			drawings: drawings.map((d) => ({
				id: d.id,
				drawingNo: d.drawingNo,
				date: d.date,
				amount: Number(d.amount),
				status: d.status,
				description: d.description,
				project: d.project,
				bankAccount: d.bankAccount,
				hasOverdrawWarning: d.hasOverdrawWarning,
			})),
			contributions: contributions.map((c) => ({
				id: c.id,
				contributionNo: c.contributionNo,
				date: c.date,
				amount: Number(c.amount),
				type: c.type,
				description: c.description,
				bankAccount: c.bankAccount,
			})),
			summary: {
				totalDrawings,
				totalContributions,
				drawingsCount: approvedDrawings.length,
				contributionsCount: contributions.length,
				netProfit,
				shareOfProfit,
				netBalance,
				drawingsByProject,
			},
			year,
			accessLevel: level,
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// 3. COMPARISON REPORT (FULL ACCESS ONLY)
// ═══════════════════════════════════════════════════════════════════════════
export const partnersComparisonReportProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/accounting/partners/report",
		tags: ["Accounting", "Partners"],
		summary: "Full comparison report across partners (OWNER only)",
	})
	.input(
		z.object({
			organizationId: idString(),
			year: z.number().int().min(2000).max(2100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyPartnerAccess(
			input.organizationId,
			context.user.id,
			"full",
		);

		const owners = await db.organizationOwner.findMany({
			where: { organizationId: input.organizationId, isActive: true },
			orderBy: { ownershipPercent: "desc" },
		});

		const now = new Date();
		const year = input.year ?? now.getFullYear();
		const yearStart = new Date(year, 0, 1);
		const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

		const statement = await getJournalIncomeStatement(
			db,
			input.organizationId,
			{ dateFrom: yearStart, dateTo: yearEnd },
		);
		const netProfit = Number(statement.netProfit ?? 0);
		const revenue = Number(statement.revenue?.total ?? 0);
		const expenses =
			Number(statement.costOfProjects?.total ?? 0) +
			Number(statement.operatingExpenses?.total ?? 0);

		const rows = await Promise.all(
			owners.map(async (owner) => {
				const [drawingsAgg, contributionsAgg, monthlyDrawings] =
					await Promise.all([
						db.ownerDrawing.aggregate({
							_sum: { amount: true },
							_count: { _all: true },
							where: {
								organizationId: input.organizationId,
								ownerId: owner.id,
								status: "APPROVED",
								date: { gte: yearStart, lte: yearEnd },
							},
						}),
						db.capitalContribution.aggregate({
							_sum: { amount: true },
							_count: { _all: true },
							where: {
								organizationId: input.organizationId,
								ownerId: owner.id,
							},
						}),
						db.ownerDrawing.findMany({
							where: {
								organizationId: input.organizationId,
								ownerId: owner.id,
								status: "APPROVED",
								date: { gte: yearStart, lte: yearEnd },
							},
							select: { date: true, amount: true },
							orderBy: { date: "asc" },
						}),
					]);

				const totalDrawings = Number(drawingsAgg._sum.amount ?? 0);
				const totalContributions = Number(
					contributionsAgg._sum.amount ?? 0,
				);
				const ownershipPercent = Number(owner.ownershipPercent);
				const shareOfProfit = netProfit * (ownershipPercent / 100);
				const netBalance =
					totalContributions + shareOfProfit - totalDrawings;

				const monthMap = new Map<number, number>();
				for (const d of monthlyDrawings) {
					const m = d.date.getMonth();
					monthMap.set(m, (monthMap.get(m) ?? 0) + Number(d.amount));
				}
				const monthly = Array.from({ length: 12 }, (_, i) => ({
					month: i + 1,
					total: monthMap.get(i) ?? 0,
				}));

				return {
					id: owner.id,
					name: owner.name,
					nameEn: owner.nameEn,
					ownershipPercent,
					totalDrawings,
					drawingsCount: drawingsAgg._count._all,
					totalContributions,
					contributionsCount: contributionsAgg._count._all,
					shareOfProfit,
					netBalance,
					monthlyDrawings: monthly,
				};
			}),
		);

		return {
			year,
			company: {
				revenue,
				expenses,
				netProfit,
			},
			partners: rows,
			totals: {
				totalOwnership: rows.reduce(
					(s, r) => s + r.ownershipPercent,
					0,
				),
				totalDrawings: rows.reduce((s, r) => s + r.totalDrawings, 0),
				totalContributions: rows.reduce(
					(s, r) => s + r.totalContributions,
					0,
				),
				totalShareOfProfit: rows.reduce(
					(s, r) => s + r.shareOfProfit,
					0,
				),
			},
		};
	});
