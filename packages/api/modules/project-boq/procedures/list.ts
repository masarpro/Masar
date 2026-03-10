import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

const boqSectionEnum = z.enum([
	"STRUCTURAL",
	"FINISHING",
	"MEP",
	"LABOR",
	"GENERAL",
]);

const boqSourceTypeEnum = z.enum([
	"MANUAL",
	"COST_STUDY",
	"IMPORTED",
	"CONTRACT",
	"QUOTATION",
]);

export const list = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/boq",
		tags: ["Project BOQ"],
		summary: "List project BOQ items with filters and pagination",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			limit: z.number().min(1).max(100).default(50),
			offset: z.number().min(0).default(0),
			section: boqSectionEnum.optional(),
			sourceType: boqSourceTypeEnum.optional(),
			phaseId: z.string().optional(),
			isPriced: z.boolean().optional(),
			search: z.string().max(200).optional(),
			sortBy: z
				.enum(["sortOrder", "code", "section", "totalPrice", "createdAt"])
				.default("sortOrder"),
			sortDirection: z.enum(["asc", "desc"]).default("asc"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);

		const where: any = {
			projectId: input.projectId,
			organizationId: input.organizationId,
		};

		if (input.section) {
			where.section = input.section;
		}
		if (input.sourceType) {
			where.sourceType = input.sourceType;
		}
		if (input.phaseId) {
			where.projectPhaseId = input.phaseId;
		}
		if (input.isPriced === true) {
			where.unitPrice = { not: null };
		} else if (input.isPriced === false) {
			where.unitPrice = null;
		}
		if (input.search) {
			where.OR = [
				{ description: { contains: input.search, mode: "insensitive" } },
				{ code: { contains: input.search, mode: "insensitive" } },
			];
		}

		const [items, total] = await Promise.all([
			db.projectBOQItem.findMany({
				where,
				take: input.limit,
				skip: input.offset,
				orderBy: { [input.sortBy]: input.sortDirection },
				include: {
					projectPhase: { select: { id: true, title: true } },
					createdBy: { select: { id: true, name: true } },
				},
			}),
			db.projectBOQItem.count({ where }),
		]);

		return {
			items: items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
				totalPrice: item.totalPrice != null ? Number(item.totalPrice) : null,
			})),
			total,
			limit: input.limit,
			offset: input.offset,
		};
	});
