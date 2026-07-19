import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";
import { canViewBoqPrices } from "../lib/price-visibility";

const num = (v: any) => (v == null ? null : Number(v));

export const getStudyItemsDetail = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/boq/study-items-detail",
		tags: ["Project BOQ"],
		summary:
			"List all items from a cost study, grouped by kind, for selective copy",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			studyId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		const { permissions } = await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);
		const showPrices = canViewBoqPrices(permissions);
		// Study item costs are money — zeroed for members without price access
		const cost = (v: any) => (showPrices ? (num(v) ?? 0) : 0);

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

		return {
			studyId: study.id,
			studyName: study.name,
			structural: study.structuralItems.map((it) => ({
				id: it.id,
				kind: "STRUCTURAL" as const,
				category: it.category,
				subCategory: it.subCategory,
				name: it.name,
				description: it.description,
				unit: it.unit,
				quantity: num(it.quantity) ?? 0,
				totalCost: cost(it.totalCost),
			})),
			finishing: study.finishingItems.map((it) => ({
				id: it.id,
				kind: "FINISHING" as const,
				category: it.category,
				subCategory: it.subCategory,
				name: it.name,
				floorName: it.floorName,
				unit: it.unit,
				area: num(it.area),
				quantity: num(it.quantity),
				totalCost: cost(it.totalCost),
				specifications: it.specifications,
			})),
			mep: study.mepItems.map((it) => ({
				id: it.id,
				kind: "MEP" as const,
				category: it.category,
				subCategory: it.subCategory,
				name: it.name,
				floorName: it.floorName,
				roomName: it.roomName,
				unit: it.unit,
				quantity: num(it.quantity) ?? 0,
				unitPrice: cost(it.unitPrice),
				totalCost: cost(it.totalCost),
				specifications: it.specifications,
			})),
			labor: study.laborItems.map((it) => ({
				id: it.id,
				kind: "LABOR" as const,
				laborType: it.laborType,
				workerType: it.workerType,
				name: it.name,
				quantity: it.quantity,
				durationDays: it.durationDays,
				dailyRate: cost(it.dailyRate),
				totalCost: cost(it.totalCost),
			})),
		};
	});
