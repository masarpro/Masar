import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../../lib/permissions";
import { subscriptionProcedure } from "../../../../../orpc/procedures";

export const deleteFile = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/pricing/leads/{leadId}/files/{fileId}",
		tags: ["Leads"],
		summary: "Delete a lead file",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			leadId: z.string().trim().max(100),
			fileId: z.string().trim().max(100),
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

		const file = await db.leadFile.findFirst({
			where: { id: input.fileId, leadId: input.leadId },
		});
		if (!file) {
			throw new ORPCError("NOT_FOUND", {
				message: "الملف غير موجود",
			});
		}

		await db.leadFile.delete({ where: { id: input.fileId } });

		await db.leadActivity.create({
			data: {
				leadId: input.leadId,
				organizationId: input.organizationId,
				createdById: context.user.id,
				type: "FILE_DELETED",
				metadata: { fileId: input.fileId, fileName: file.name },
			},
		});

		return { success: true };
	});
