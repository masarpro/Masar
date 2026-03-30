import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getMaterialsList = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/quantities/materials",
		tags: ["Project Quantities"],
		summary: "Get complete materials list for a project",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			groupBy: z.enum(["category", "phase", "study"]).default("category"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);

		const studyFilter = {
			costStudy: {
				projectId: input.projectId,
				organizationId: input.organizationId,
			},
		};

		const [structural, finishing, mep, labor] = await Promise.all([
			db.structuralItem.findMany({
				where: studyFilter,
				include: { costStudy: { select: { id: true, name: true } } },
			}),
			db.finishingItem.findMany({
				where: studyFilter,
				include: { costStudy: { select: { id: true, name: true } } },
			}),
			db.mEPItem.findMany({
				where: studyFilter,
				include: { costStudy: { select: { id: true, name: true } } },
			}),
			db.laborItem.findMany({
				where: studyFilter,
				include: { costStudy: { select: { id: true, name: true } } },
			}),
		]);

		// Normalize all items into a common shape
		type MaterialItem = {
			id: string;
			section: string;
			category: string;
			description: string;
			quantity: number;
			unit: string;
			unitPrice: number;
			totalCost: number;
			studyId: string;
			studyName: string;
			phaseId: string | null;
			specifications: string | null;
		};

		const items: MaterialItem[] = [];

		for (const i of structural) {
			items.push({
				id: i.id,
				section: "structural",
				category: i.category,
				description: i.name,
				quantity: Number(i.quantity),
				unit: i.unit,
				unitPrice: Number(i.quantity) > 0 ? Number(i.totalCost) / Number(i.quantity) : 0,
				totalCost: Number(i.totalCost),
				studyId: i.costStudy.id,
				studyName: i.costStudy.name ?? "",
				phaseId: i.projectPhaseId,
				specifications: null,
			});
		}

		for (const i of finishing) {
			items.push({
				id: i.id,
				section: "finishing",
				category: i.category,
				description: i.name,
				quantity: i.quantity ? Number(i.quantity) : (i.area ? Number(i.area) : 0),
				unit: i.unit,
				unitPrice: i.materialPrice ? Number(i.materialPrice) : 0,
				totalCost: Number(i.totalCost),
				studyId: i.costStudy.id,
				studyName: i.costStudy.name ?? "",
				phaseId: i.projectPhaseId,
				specifications: i.specifications,
			});
		}

		for (const i of mep) {
			items.push({
				id: i.id,
				section: "mep",
				category: i.category,
				description: i.name,
				quantity: Number(i.quantity),
				unit: i.unit,
				unitPrice: Number(i.unitPrice),
				totalCost: Number(i.totalCost),
				studyId: i.costStudy.id,
				studyName: i.costStudy.name ?? "",
				phaseId: i.projectPhaseId,
				specifications: i.specifications,
			});
		}

		for (const i of labor) {
			items.push({
				id: i.id,
				section: "labor",
				category: i.laborType,
				description: i.name,
				quantity: i.quantity,
				unit: "عامل",
				unitPrice: Number(i.dailyRate) * i.durationDays,
				totalCost: Number(i.totalCost),
				studyId: i.costStudy.id,
				studyName: i.costStudy.name ?? "",
				phaseId: i.projectPhaseId,
				specifications: null,
			});
		}

		// Group items
		const groups: Record<string, { label: string; items: MaterialItem[]; total: number }> = {};

		for (const item of items) {
			let key: string;
			let label: string;

			if (input.groupBy === "phase") {
				key = item.phaseId ?? "unassigned";
				label = key === "unassigned" ? "بدون مرحلة" : key;
			} else if (input.groupBy === "study") {
				key = item.studyId;
				label = item.studyName;
			} else {
				key = item.section;
				const sectionLabels: Record<string, string> = {
					structural: "إنشائي",
					finishing: "تشطيبات",
					mep: "MEP",
					labor: "عمالة",
				};
				label = sectionLabels[item.section] ?? item.section;
			}

			if (!groups[key]) {
				groups[key] = { label, items: [], total: 0 };
			}
			groups[key].items.push(item);
			groups[key].total += item.totalCost;
		}

		const grandTotal = items.reduce((s, i) => s + i.totalCost, 0);

		return {
			groups: Object.values(groups),
			grandTotal,
			itemCount: items.length,
		};
	});
