import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getPhaseBreakdown = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/quantities/phase-breakdown",
		tags: ["Project Quantities"],
		summary: "Get quantities breakdown by project phases",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			studyId: z.string().trim().max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);

		// Get project milestones with linked items
		const milestones = await db.projectMilestone.findMany({
			where: {
				projectId: input.projectId,
				organizationId: input.organizationId,
			},
			include: {
				structuralItems: {
					where: input.studyId
						? { costStudy: { projectId: input.projectId }, costStudyId: input.studyId }
						: { costStudy: { projectId: input.projectId } },
				},
				finishingItems: {
					where: input.studyId
						? { costStudy: { projectId: input.projectId }, costStudyId: input.studyId }
						: { costStudy: { projectId: input.projectId } },
				},
				mepItems: {
					where: input.studyId
						? { costStudy: { projectId: input.projectId }, costStudyId: input.studyId }
						: { costStudy: { projectId: input.projectId } },
				},
				laborItems: {
					where: input.studyId
						? { costStudy: { projectId: input.projectId }, costStudyId: input.studyId }
						: { costStudy: { projectId: input.projectId } },
				},
			},
			orderBy: { orderIndex: "asc" },
		});

		// Get unassigned items (projectPhaseId = null)
		const studyFilter = input.studyId
			? { costStudyId: input.studyId, costStudy: { projectId: input.projectId } }
			: { costStudy: { projectId: input.projectId, organizationId: input.organizationId } };

		const [unassignedStructural, unassignedFinishing, unassignedMep, unassignedLabor] =
			await Promise.all([
				db.structuralItem.findMany({
					where: { ...studyFilter, projectPhaseId: null },
				}),
				db.finishingItem.findMany({
					where: { ...studyFilter, projectPhaseId: null },
				}),
				db.mEPItem.findMany({
					where: { ...studyFilter, projectPhaseId: null },
				}),
				db.laborItem.findMany({
					where: { ...studyFilter, projectPhaseId: null },
				}),
			]);

		const toNumber = (val: unknown) => Number(val);

		const phases = milestones.map((m) => {
			const phaseTotal =
				m.structuralItems.reduce((s, i) => s + Number(i.totalCost), 0) +
				m.finishingItems.reduce((s, i) => s + Number(i.totalCost), 0) +
				m.mepItems.reduce((s, i) => s + Number(i.totalCost), 0) +
				m.laborItems.reduce((s, i) => s + Number(i.totalCost), 0);

			return {
				milestone: {
					id: m.id,
					title: m.title,
					status: m.status,
					sortOrder: m.orderIndex,
				},
				structural: m.structuralItems.map((i) => ({
					...i,
					quantity: toNumber(i.quantity),
					concreteVolume: i.concreteVolume ? toNumber(i.concreteVolume) : null,
					steelWeight: i.steelWeight ? toNumber(i.steelWeight) : null,
					steelRatio: i.steelRatio ? toNumber(i.steelRatio) : null,
					wastagePercent: toNumber(i.wastagePercent),
					materialCost: toNumber(i.materialCost),
					laborCost: toNumber(i.laborCost),
					totalCost: toNumber(i.totalCost),
				})),
				finishing: m.finishingItems.map((i) => ({
					...i,
					area: i.area ? toNumber(i.area) : null,
					length: i.length ? toNumber(i.length) : null,
					height: i.height ? toNumber(i.height) : null,
					width: i.width ? toNumber(i.width) : null,
					perimeter: i.perimeter ? toNumber(i.perimeter) : null,
					quantity: i.quantity ? toNumber(i.quantity) : null,
					wastagePercent: i.wastagePercent ? toNumber(i.wastagePercent) : null,
					materialPrice: i.materialPrice ? toNumber(i.materialPrice) : null,
					laborPrice: i.laborPrice ? toNumber(i.laborPrice) : null,
					materialCost: toNumber(i.materialCost),
					laborCost: toNumber(i.laborCost),
					totalCost: toNumber(i.totalCost),
				})),
				mep: m.mepItems.map((i) => ({
					...i,
					quantity: toNumber(i.quantity),
					length: i.length ? toNumber(i.length) : null,
					area: i.area ? toNumber(i.area) : null,
					materialPrice: toNumber(i.materialPrice),
					laborPrice: toNumber(i.laborPrice),
					wastagePercent: toNumber(i.wastagePercent),
					materialCost: toNumber(i.materialCost),
					laborCost: toNumber(i.laborCost),
					unitPrice: toNumber(i.unitPrice),
					totalCost: toNumber(i.totalCost),
				})),
				labor: m.laborItems.map((i) => ({
					...i,
					dailyRate: toNumber(i.dailyRate),
					insuranceCost: toNumber(i.insuranceCost),
					housingCost: toNumber(i.housingCost),
					otherCosts: toNumber(i.otherCosts),
					totalCost: toNumber(i.totalCost),
				})),
				phaseTotal,
			};
		});

		const unassignedTotal =
			unassignedStructural.reduce((s, i) => s + Number(i.totalCost), 0) +
			unassignedFinishing.reduce((s, i) => s + Number(i.totalCost), 0) +
			unassignedMep.reduce((s, i) => s + Number(i.totalCost), 0) +
			unassignedLabor.reduce((s, i) => s + Number(i.totalCost), 0);

		return {
			phases,
			unassigned: {
				structural: unassignedStructural.map((i) => ({
					...i,
					quantity: toNumber(i.quantity),
					concreteVolume: i.concreteVolume ? toNumber(i.concreteVolume) : null,
					steelWeight: i.steelWeight ? toNumber(i.steelWeight) : null,
					steelRatio: i.steelRatio ? toNumber(i.steelRatio) : null,
					wastagePercent: toNumber(i.wastagePercent),
					materialCost: toNumber(i.materialCost),
					laborCost: toNumber(i.laborCost),
					totalCost: toNumber(i.totalCost),
				})),
				finishing: unassignedFinishing.map((i) => ({
					...i,
					area: i.area ? toNumber(i.area) : null,
					length: i.length ? toNumber(i.length) : null,
					height: i.height ? toNumber(i.height) : null,
					width: i.width ? toNumber(i.width) : null,
					perimeter: i.perimeter ? toNumber(i.perimeter) : null,
					quantity: i.quantity ? toNumber(i.quantity) : null,
					wastagePercent: i.wastagePercent ? toNumber(i.wastagePercent) : null,
					materialPrice: i.materialPrice ? toNumber(i.materialPrice) : null,
					laborPrice: i.laborPrice ? toNumber(i.laborPrice) : null,
					materialCost: toNumber(i.materialCost),
					laborCost: toNumber(i.laborCost),
					totalCost: toNumber(i.totalCost),
				})),
				mep: unassignedMep.map((i) => ({
					...i,
					quantity: toNumber(i.quantity),
					length: i.length ? toNumber(i.length) : null,
					area: i.area ? toNumber(i.area) : null,
					materialPrice: toNumber(i.materialPrice),
					laborPrice: toNumber(i.laborPrice),
					wastagePercent: toNumber(i.wastagePercent),
					materialCost: toNumber(i.materialCost),
					laborCost: toNumber(i.laborCost),
					unitPrice: toNumber(i.unitPrice),
					totalCost: toNumber(i.totalCost),
				})),
				labor: unassignedLabor.map((i) => ({
					...i,
					dailyRate: toNumber(i.dailyRate),
					insuranceCost: toNumber(i.insuranceCost),
					housingCost: toNumber(i.housingCost),
					otherCosts: toNumber(i.otherCosts),
					totalCost: toNumber(i.totalCost),
				})),
				total: unassignedTotal,
			},
		};
	});
