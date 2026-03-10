import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { db } from "@repo/database";
import { z } from "zod";
import { toNum } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";

// ═══════════════════════════════════════════════════════════════
// 1. GET MARKUP SETTINGS
// ═══════════════════════════════════════════════════════════════

export const markupGetSettings = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{studyId}/markup/settings",
		tags: ["Quantities", "Markup"],
		summary: "Get markup settings for a study",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		const study = await db.costStudy.findFirst({
			where: {
				id: input.studyId,
				organizationId: input.organizationId,
			},
			select: {
				overheadPercent: true,
				profitPercent: true,
				contingencyPercent: true,
				vatIncluded: true,
				contractValue: true,
				studyType: true,
				buildingArea: true,
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", { message: STUDY_ERRORS.NOT_FOUND });
		}

		const sectionMarkups = await db.sectionMarkup.findMany({
			where: {
				costStudyId: input.studyId,
				organizationId: input.organizationId,
			},
			orderBy: { section: "asc" },
		});

		// Determine method based on whether section markups exist
		const method = sectionMarkups.length > 0 ? "per_section" : "uniform";

		return {
			method,
			uniformSettings: {
				overheadPercent: toNum(study.overheadPercent),
				profitPercent: toNum(study.profitPercent),
				contingencyPercent: toNum(study.contingencyPercent),
				vatIncluded: study.vatIncluded,
			},
			sectionMarkups: sectionMarkups.map((sm) => ({
				id: sm.id,
				section: sm.section,
				markupPercent: toNum(sm.markupPercent),
			})),
			studyType: study.studyType,
			contractValue: study.contractValue != null ? toNum(study.contractValue) : null,
			buildingArea: toNum(study.buildingArea),
		};
	});

// ═══════════════════════════════════════════════════════════════
// 2. SET UNIFORM MARKUP
// ═══════════════════════════════════════════════════════════════

export const markupSetUniform = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/markup/uniform",
		tags: ["Quantities", "Markup"],
		summary: "Set uniform markup settings",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			overheadPercent: z.number().min(0).max(100),
			profitPercent: z.number().min(0).max(100),
			contingencyPercent: z.number().min(0).max(100),
			vatIncluded: z.boolean(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		// Remove any section markups when switching to uniform
		await db.sectionMarkup.deleteMany({
			where: {
				costStudyId: input.studyId,
				organizationId: input.organizationId,
			},
		});

		const updated = await db.costStudy.update({
			where: { id: input.studyId },
			data: {
				overheadPercent: input.overheadPercent,
				profitPercent: input.profitPercent,
				contingencyPercent: input.contingencyPercent,
				vatIncluded: input.vatIncluded,
			},
			select: {
				overheadPercent: true,
				profitPercent: true,
				contingencyPercent: true,
				vatIncluded: true,
			},
		});

		return {
			overheadPercent: toNum(updated.overheadPercent),
			profitPercent: toNum(updated.profitPercent),
			contingencyPercent: toNum(updated.contingencyPercent),
			vatIncluded: updated.vatIncluded,
		};
	});

// ═══════════════════════════════════════════════════════════════
// 3. SET SECTION MARKUPS
// ═══════════════════════════════════════════════════════════════

export const markupSetSectionMarkups = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/markup/sections",
		tags: ["Quantities", "Markup"],
		summary: "Set per-section markup percentages",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			markups: z.array(
				z.object({
					section: z.string(),
					markupPercent: z.number().min(0).max(200),
				}),
			),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		// Upsert each section markup
		await db.$transaction(
			input.markups.map((m) =>
				db.sectionMarkup.upsert({
					where: {
						costStudyId_section: {
							costStudyId: input.studyId,
							section: m.section,
						},
					},
					create: {
						costStudyId: input.studyId,
						organizationId: input.organizationId,
						section: m.section,
						markupPercent: m.markupPercent,
					},
					update: {
						markupPercent: m.markupPercent,
					},
				}),
			),
		);

		const markups = await db.sectionMarkup.findMany({
			where: {
				costStudyId: input.studyId,
				organizationId: input.organizationId,
			},
		});

		return markups.map((sm) => ({
			id: sm.id,
			section: sm.section,
			markupPercent: toNum(sm.markupPercent),
		}));
	});

// ═══════════════════════════════════════════════════════════════
// 4. GET PROFIT ANALYSIS
// ═══════════════════════════════════════════════════════════════

export const markupGetProfitAnalysis = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{studyId}/markup/profit-analysis",
		tags: ["Quantities", "Markup"],
		summary: "Get profit analysis for a study",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		const study = await db.costStudy.findFirst({
			where: {
				id: input.studyId,
				organizationId: input.organizationId,
			},
			select: {
				overheadPercent: true,
				profitPercent: true,
				contingencyPercent: true,
				vatIncluded: true,
				contractValue: true,
				studyType: true,
				buildingArea: true,
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", { message: STUDY_ERRORS.NOT_FOUND });
		}

		// Get costing items grouped by section
		const items = await db.costingItem.findMany({
			where: {
				costStudyId: input.studyId,
				organizationId: input.organizationId,
			},
		});

		// Calculate section totals
		const sectionTotals = new Map<string, number>();
		let totalCost = 0;
		for (const item of items) {
			const cost = toNum(item.totalCost);
			const s = item.section;
			sectionTotals.set(s, (sectionTotals.get(s) || 0) + cost);
			totalCost += cost;
		}

		// Check if per-section markups exist
		const sectionMarkups = await db.sectionMarkup.findMany({
			where: {
				costStudyId: input.studyId,
				organizationId: input.organizationId,
			},
		});

		const method = sectionMarkups.length > 0 ? "per_section" : "uniform";

		let overheadAmount: number;
		let sellingPriceBeforeVat: number;
		let profitAmount: number;
		let contingencyAmount: number;

		if (method === "per_section") {
			// Per-section markup calculation
			let totalWithMarkup = 0;
			const sectionBreakdown: Array<{ section: string; cost: number; markupPercent: number; total: number }> = [];

			for (const [section, sectionCost] of sectionTotals.entries()) {
				const markup = sectionMarkups.find((m) => m.section === section);
				const markupPct = markup ? toNum(markup.markupPercent) : 0;
				const sectionTotal = sectionCost * (1 + markupPct / 100);
				totalWithMarkup += sectionTotal;
				sectionBreakdown.push({
					section,
					cost: sectionCost,
					markupPercent: markupPct,
					total: sectionTotal,
				});
			}

			overheadAmount = totalCost * (toNum(study.overheadPercent) / 100);
			sellingPriceBeforeVat = totalWithMarkup + overheadAmount;
			profitAmount = sellingPriceBeforeVat - totalCost - overheadAmount;
			contingencyAmount = 0;
		} else {
			// Uniform markup calculation
			overheadAmount = totalCost * (toNum(study.overheadPercent) / 100);
			profitAmount = totalCost * (toNum(study.profitPercent) / 100);
			contingencyAmount = totalCost * (toNum(study.contingencyPercent) / 100);
			sellingPriceBeforeVat = totalCost + overheadAmount + profitAmount + contingencyAmount;
		}

		const vatAmount = study.vatIncluded ? sellingPriceBeforeVat * 0.15 : 0;
		const grandTotal = sellingPriceBeforeVat + vatAmount;

		const buildingArea = toNum(study.buildingArea);
		const pricePerSqm = buildingArea > 0 ? grandTotal / buildingArea : 0;
		const costPerSqm = buildingArea > 0 ? totalCost / buildingArea : 0;

		const profitPercent = totalCost > 0 ? ((sellingPriceBeforeVat - totalCost) / totalCost) * 100 : 0;

		// Lump sum analysis
		const contractValue = study.contractValue != null ? toNum(study.contractValue) : null;
		let lumpSumAnalysis = null;
		if (study.studyType === "LUMP_SUM_ANALYSIS" && contractValue != null) {
			const expectedProfit = contractValue - totalCost - overheadAmount;
			const profitFromContract = totalCost > 0 ? (expectedProfit / totalCost) * 100 : 0;
			const safetyMargin = contractValue > 0 ? ((contractValue - totalCost) / contractValue) * 100 : 0;
			lumpSumAnalysis = {
				contractValue,
				expectedProfit,
				profitFromContract,
				safetyMargin,
			};
		}

		// Section breakdown for the UI
		const sections = Array.from(sectionTotals.entries()).map(([section, cost]) => {
			const markup = sectionMarkups.find((m) => m.section === section);
			return {
				section,
				cost,
				markupPercent: markup ? toNum(markup.markupPercent) : toNum(study.profitPercent),
				total: method === "per_section"
					? cost * (1 + (markup ? toNum(markup.markupPercent) : 0) / 100)
					: cost * (1 + toNum(study.profitPercent) / 100),
			};
		});

		return {
			method,
			totalCost,
			overheadAmount,
			profitAmount,
			contingencyAmount,
			sellingPriceBeforeVat,
			vatAmount,
			grandTotal,
			profitPercent,
			pricePerSqm,
			costPerSqm,
			buildingArea,
			sections,
			lumpSumAnalysis,
		};
	});
