import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

const DEFAULT_UNIT = "مقطوعية";

function formatDateRange(start: Date | null, end: Date | null): string | null {
	if (!start && !end) return null;
	const fmt = (d: Date) =>
		new Date(d).toISOString().slice(0, 10);
	if (start && end) return `${fmt(start)} → ${fmt(end)}`;
	if (start) return `${fmt(start)}`;
	if (end) return `${fmt(end)}`;
	return null;
}

export const copyFromExecution = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/boq/copy-from-execution",
		tags: ["Project BOQ"],
		summary: "Copy execution milestones/activities into project BOQ",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			milestoneIds: z
				.array(z.string().trim().max(100))
				.max(200)
				.optional()
				.transform((v) => v ?? []),
			includeEmptyMilestones: z.boolean().default(false),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "create" },
		);

		const milestoneWhere = {
			organizationId: input.organizationId,
			projectId: input.projectId,
			...(input.milestoneIds.length > 0
				? { id: { in: input.milestoneIds } }
				: {}),
		};

		const milestones = await db.projectMilestone.findMany({
			where: milestoneWhere,
			orderBy: { orderIndex: "asc" },
			include: {
				activities: {
					orderBy: { orderIndex: "asc" },
				},
			},
		});

		if (milestones.length === 0) {
			throw new ORPCError("NOT_FOUND", {
				message: "لا توجد مراحل تنفيذ للنسخ",
			});
		}

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
		const milestoneSet = new Set<string>();

		for (const milestone of milestones) {
			if (milestone.activities.length === 0) {
				if (!input.includeEmptyMilestones) continue;

				const dateRange = formatDateRange(
					milestone.plannedStart,
					milestone.plannedEnd,
				);
				const specParts = [milestone.description, dateRange].filter(
					(v): v is string => Boolean(v),
				);

				boqData.push({
					projectId: input.projectId,
					organizationId: input.organizationId,
					section: "GENERAL",
					category: null,
					code: null,
					description: milestone.title,
					specifications: specParts.length > 0 ? specParts.join(" — ") : null,
					unit: DEFAULT_UNIT,
					quantity: 1,
					unitPrice: null,
					totalPrice: null,
					sourceType: "MANUAL",
					sortOrder: nextSortOrder++,
					projectPhaseId: milestone.id,
					createdById: context.user.id,
				});
				milestoneSet.add(milestone.id);
				continue;
			}

			for (const activity of milestone.activities) {
				const dateRange = formatDateRange(
					activity.plannedStart,
					activity.plannedEnd,
				);
				const specParts = [activity.description, dateRange].filter(
					(v): v is string => Boolean(v),
				);

				boqData.push({
					projectId: input.projectId,
					organizationId: input.organizationId,
					section: "GENERAL",
					category: milestone.title,
					code: activity.wbsCode ?? null,
					description: activity.title,
					specifications:
						specParts.length > 0 ? specParts.join(" — ") : null,
					unit: DEFAULT_UNIT,
					quantity: 1,
					unitPrice: null,
					totalPrice: null,
					sourceType: "MANUAL",
					sortOrder: nextSortOrder++,
					projectPhaseId: milestone.id,
					createdById: context.user.id,
				});
				milestoneSet.add(milestone.id);
			}
		}

		if (boqData.length === 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا توجد أنشطة قابلة للنسخ في المراحل المحددة",
			});
		}

		const created = await db.$transaction(
			boqData.map((data) => db.projectBOQItem.create({ data })),
		);

		return {
			copiedCount: created.length,
			milestonesCount: milestoneSet.size,
		};
	});
