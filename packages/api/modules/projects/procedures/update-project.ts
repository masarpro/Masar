import { ORPCError } from "@orpc/server";
import { updateProject, db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import {
	idString,
	optionalTrimmed,
	positiveAmount,
	percentage,
	MAX_NAME,
	MAX_DESC,
} from "../../../lib/validation-constants";

export const updateProjectProcedure = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/projects/{id}",
		tags: ["Projects"],
		summary: "Update a project",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			name: z.string().trim().min(1).max(MAX_NAME).optional(),
			description: optionalTrimmed(MAX_DESC),
			status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
			type: z
				.enum([
					"RESIDENTIAL",
					"COMMERCIAL",
					"INDUSTRIAL",
					"INFRASTRUCTURE",
					"MIXED",
				])
				.optional(),
			clientName: optionalTrimmed(MAX_NAME),
			clientId: z.string().trim().max(100).nullable().optional(),
			location: optionalTrimmed(MAX_DESC),
			contractValue: positiveAmount().optional(),
			progress: percentage().optional(),
			startDate: z.coerce.date().nullable().optional(),
			endDate: z.coerce.date().nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission to edit
		await verifyProjectAccess(
			input.id,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		// Validate startDate <= endDate
		if (input.startDate && input.endDate && input.startDate > input.endDate) {
			throw new ORPCError("BAD_REQUEST", {
				message: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
			});
		} else if (input.startDate || input.endDate) {
			const existing = await db.project.findFirst({
				where: { id: input.id, organizationId: input.organizationId },
				select: { startDate: true, endDate: true },
			});
			if (existing) {
				const startDate = input.startDate ?? existing.startDate;
				const endDate = input.endDate ?? existing.endDate;
				if (startDate && endDate && startDate > endDate) {
					throw new ORPCError("BAD_REQUEST", {
						message: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
					});
				}
			}
		}

		try {
			const project = await updateProject(input.id, input.organizationId, {
				name: input.name,
				description: input.description,
				status: input.status,
				type: input.type,
				clientName: input.clientName,
				clientId: input.clientId,
				location: input.location,
				contractValue: input.contractValue,
				progress: input.progress,
				startDate: input.startDate ?? undefined,
				endDate: input.endDate ?? undefined,
			});

			return {
				...project,
				contractValue: project.contractValue
					? Number(project.contractValue)
					: null,
				progress: Number(project.progress),
			};
		} catch (error) {
			throw new ORPCError("BAD_REQUEST", {
				message: "فشل في تحديث المشروع",
			});
		}
	});
