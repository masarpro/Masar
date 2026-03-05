import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../../lib/permissions";
import { subscriptionProcedure } from "../../../../../orpc/procedures";

export const saveFile = subscriptionProcedure
	.route({
		method: "POST",
		path: "/pricing/leads/{leadId}/files",
		tags: ["Leads"],
		summary: "Save a lead file after upload",
	})
	.input(
		z.object({
			organizationId: z.string(),
			leadId: z.string(),
			name: z.string().min(1),
			storagePath: z.string().min(1),
			fileSize: z.number().int().positive().optional(),
			mimeType: z.string().optional(),
			category: z
				.enum(["BLUEPRINT", "STRUCTURE", "SITE_PHOTO", "SCOPE", "OTHER"])
				.optional(),
			description: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "leads" },
		);

		const lead = await db.lead.findFirst({
			where: { id: input.leadId, organizationId: input.organizationId },
		});
		if (!lead) {
			throw new ORPCError("NOT_FOUND", {
				message: "العميل المحتمل غير موجود",
			});
		}

		const file = await db.leadFile.create({
			data: {
				leadId: input.leadId,
				organizationId: input.organizationId,
				createdById: context.user.id,
				name: input.name,
				fileUrl: input.storagePath,
				storagePath: input.storagePath,
				fileSize: input.fileSize,
				mimeType: input.mimeType,
				category: input.category,
				description: input.description,
			},
			include: {
				createdBy: { select: { id: true, name: true } },
			},
		});

		await db.leadActivity.create({
			data: {
				leadId: input.leadId,
				organizationId: input.organizationId,
				createdById: context.user.id,
				type: "FILE_UPLOADED",
				metadata: {
					fileId: file.id,
					fileName: input.name,
					category: input.category || "OTHER",
				},
			},
		});

		// Touch lead updatedAt
		await db.lead.update({
			where: { id: input.leadId },
			data: { updatedAt: new Date() },
		});

		return file;
	});
