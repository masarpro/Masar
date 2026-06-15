import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

const itemRef = z.object({
	id: z.string().trim().max(100),
	kind: z.enum(["STRUCTURAL", "FINISHING", "MEP", "LABOR"]),
});

export const addStudyItemsToPhase = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/boq/add-study-items-to-phase",
		tags: ["Project BOQ"],
		summary:
			"Add selected cost-study items as BOQ items linked to a target phase",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			studyId: z.string().trim().max(100),
			targetPhaseId: z
				.string()
				.trim()
				.max(100)
				.optional()
				.nullable()
				.transform((v) => v ?? null),
			items: z.array(itemRef).min(1).max(500),
			includeUnpriced: z.boolean().default(true),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "create" },
		);

		if (input.targetPhaseId) {
			const phase = await db.projectMilestone.findFirst({
				where: {
					id: input.targetPhaseId,
					projectId: input.projectId,
					organizationId: input.organizationId,
				},
				select: { id: true },
			});
			if (!phase) {
				throw new ORPCError("NOT_FOUND", {
					message: "المرحلة غير موجودة أو لا تنتمي لهذا المشروع",
				});
			}
		}

		const study = await db.costStudy.findFirst({
			where: { id: input.studyId, organizationId: input.organizationId },
			select: { id: true },
		});
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "الدراسة غير موجودة أو لا تنتمي لهذه المنظمة",
			});
		}

		const structuralIds = input.items
			.filter((i) => i.kind === "STRUCTURAL")
			.map((i) => i.id);
		const finishingIds = input.items
			.filter((i) => i.kind === "FINISHING")
			.map((i) => i.id);
		const mepIds = input.items
			.filter((i) => i.kind === "MEP")
			.map((i) => i.id);
		const laborIds = input.items
			.filter((i) => i.kind === "LABOR")
			.map((i) => i.id);

		const [structural, finishing, mep, labor] = await Promise.all([
			structuralIds.length > 0
				? db.structuralItem.findMany({
						where: { id: { in: structuralIds }, costStudyId: input.studyId },
					})
				: Promise.resolve([] as any[]),
			finishingIds.length > 0
				? db.finishingItem.findMany({
						where: { id: { in: finishingIds }, costStudyId: input.studyId },
					})
				: Promise.resolve([] as any[]),
			mepIds.length > 0
				? db.mEPItem.findMany({
						where: { id: { in: mepIds }, costStudyId: input.studyId },
					})
				: Promise.resolve([] as any[]),
			laborIds.length > 0
				? db.laborItem.findMany({
						where: { id: { in: laborIds }, costStudyId: input.studyId },
					})
				: Promise.resolve([] as any[]),
		]);

		const lastItem = await db.projectBOQItem.findFirst({
			where: {
				projectId: input.projectId,
				organizationId: input.organizationId,
			},
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});
		let nextSortOrder = (lastItem?.sortOrder ?? -1) + 1;

		const boqData: any[] = [];

		for (const item of structural) {
			const quantity = Number(item.quantity);
			const totalCost = Number(item.totalCost);
			const unitPrice = quantity > 0 ? totalCost / quantity : 0;
			if (!input.includeUnpriced && totalCost === 0) continue;

			boqData.push({
				projectId: input.projectId,
				organizationId: input.organizationId,
				section: "STRUCTURAL",
				category: item.category,
				code: item.subCategory ?? null,
				description: item.name,
				specifications: item.description ?? item.subCategory,
				unit: item.unit,
				quantity: item.quantity,
				unitPrice: unitPrice > 0 ? unitPrice : null,
				totalPrice: totalCost > 0 ? totalCost : null,
				sourceType: "COST_STUDY",
				costStudyId: input.studyId,
				sourceItemId: item.id,
				projectPhaseId: input.targetPhaseId,
				sortOrder: nextSortOrder++,
				createdById: context.user.id,
			});
		}

		for (const item of finishing) {
			const quantity = item.quantity
				? Number(item.quantity)
				: item.area
					? Number(item.area)
					: 0;
			const totalCost = Number(item.totalCost);
			const unitPrice = quantity > 0 ? totalCost / quantity : 0;
			if (!input.includeUnpriced && totalCost === 0) continue;

			let specifications: string | null = null;
			if (item.specifications) {
				specifications = item.specifications;
			} else if (item.specData) {
				try {
					specifications = JSON.stringify(item.specData);
				} catch {
					// ignore
				}
			}

			boqData.push({
				projectId: input.projectId,
				organizationId: input.organizationId,
				section: "FINISHING",
				category: item.category,
				code: item.subCategory ?? null,
				description: item.name,
				specifications,
				unit: item.unit || "م²",
				quantity,
				unitPrice: unitPrice > 0 ? unitPrice : null,
				totalPrice: totalCost > 0 ? totalCost : null,
				sourceType: "COST_STUDY",
				costStudyId: input.studyId,
				sourceItemId: item.id,
				projectPhaseId: input.targetPhaseId,
				sortOrder: nextSortOrder++,
				createdById: context.user.id,
			});
		}

		for (const item of mep) {
			const totalCost = Number(item.totalCost);
			const itemUnitPrice = Number(item.unitPrice);
			if (!input.includeUnpriced && totalCost === 0) continue;

			boqData.push({
				projectId: input.projectId,
				organizationId: input.organizationId,
				section: "MEP",
				category: item.category,
				code: item.subCategory ?? null,
				description: item.name,
				specifications: item.specifications ?? null,
				unit: item.unit || "مقطوعية",
				quantity: item.quantity,
				unitPrice: itemUnitPrice > 0 ? itemUnitPrice : null,
				totalPrice: totalCost > 0 ? totalCost : null,
				sourceType: "COST_STUDY",
				costStudyId: input.studyId,
				sourceItemId: item.id,
				projectPhaseId: input.targetPhaseId,
				sortOrder: nextSortOrder++,
				createdById: context.user.id,
			});
		}

		for (const item of labor) {
			const totalDays = item.quantity * item.durationDays;
			const dailyRate = Number(item.dailyRate);
			const totalCost = Number(item.totalCost);
			if (!input.includeUnpriced && totalCost === 0) continue;

			boqData.push({
				projectId: input.projectId,
				organizationId: input.organizationId,
				section: "LABOR",
				category: item.laborType,
				code: null,
				description: item.name,
				specifications: null,
				unit: "يوم عمل",
				quantity: totalDays,
				unitPrice: dailyRate > 0 ? dailyRate : null,
				totalPrice: totalCost > 0 ? totalCost : null,
				sourceType: "COST_STUDY",
				costStudyId: input.studyId,
				sourceItemId: item.id,
				projectPhaseId: input.targetPhaseId,
				sortOrder: nextSortOrder++,
				createdById: context.user.id,
			});
		}

		if (boqData.length === 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا توجد بنود قابلة للنسخ",
			});
		}

		const created = await db.$transaction(
			boqData.map((data) => db.projectBOQItem.create({ data })),
		);

		return {
			copiedCount: created.length,
			sections: {
				structural: boqData.filter((d) => d.section === "STRUCTURAL").length,
				finishing: boqData.filter((d) => d.section === "FINISHING").length,
				mep: boqData.filter((d) => d.section === "MEP").length,
				labor: boqData.filter((d) => d.section === "LABOR").length,
			},
		};
	});
