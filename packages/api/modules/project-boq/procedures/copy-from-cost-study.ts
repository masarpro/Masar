import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const copyFromCostStudy = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/boq/copy-from-cost-study",
		tags: ["Project BOQ"],
		summary: "Copy items from a cost study to project BOQ",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			studyId: z.string().trim().max(100),
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

		// Fetch study with all items
		const study = await db.costStudy.findFirst({
			where: { id: input.studyId, organizationId: input.organizationId },
			include: {
				structuralItems: true,
				finishingItems: true,
				mepItems: true,
				laborItems: true,
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "الدراسة غير موجودة أو لا تنتمي لهذه المنظمة",
			});
		}

		// Prevent duplicate copy
		const existingCount = await db.projectBOQItem.count({
			where: {
				projectId: input.projectId,
				costStudyId: input.studyId,
			},
		});
		if (existingCount > 0) {
			throw new ORPCError("CONFLICT", {
				message: "بنود هذه الدراسة مضافة مسبقاً لهذا المشروع",
			});
		}

		// Get last sortOrder
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

		// StructuralItem → BOQItem
		for (const item of study.structuralItems) {
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
				sortOrder: nextSortOrder++,
				createdById: context.user.id,
			});
		}

		// FinishingItem → BOQItem
		for (const item of study.finishingItems) {
			const quantity = item.quantity
				? Number(item.quantity)
				: item.area
					? Number(item.area)
					: 0;
			const totalCost = Number(item.totalCost);
			const unitPrice = quantity > 0 ? totalCost / quantity : 0;

			if (!input.includeUnpriced && totalCost === 0) continue;

			// Build specifications from specData
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
				sortOrder: nextSortOrder++,
				createdById: context.user.id,
			});
		}

		// MEPItem → BOQItem
		for (const item of study.mepItems) {
			const quantity = Number(item.quantity);
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
				sortOrder: nextSortOrder++,
				createdById: context.user.id,
			});
		}

		// LaborItem → BOQItem
		for (const item of study.laborItems) {
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
				sortOrder: nextSortOrder++,
				createdById: context.user.id,
			});
		}

		// Create all items in a transaction
		const created = await db.$transaction(
			boqData.map((data) => db.projectBOQItem.create({ data })),
		);

		// Count by section
		const sections = {
			structural: boqData.filter((d) => d.section === "STRUCTURAL").length,
			finishing: boqData.filter((d) => d.section === "FINISHING").length,
			mep: boqData.filter((d) => d.section === "MEP").length,
			labor: boqData.filter((d) => d.section === "LABOR").length,
		};

		return {
			copiedCount: created.length,
			sections,
		};
	});
