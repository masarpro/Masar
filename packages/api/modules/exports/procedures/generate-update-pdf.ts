import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { generateUpdatePDF } from "../lib/pdf-generator";

export const generateUpdatePDFProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/exports/update-pdf",
		tags: ["Exports"],
		summary: "Generate PDF for a project update",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			updateId: z.string(),
			language: z.enum(["ar", "en"]).optional().default("ar"),
		}),
	)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);

		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}

		// Get the update with project info
		const update = await db.projectUpdate.findFirst({
			where: {
				id: input.updateId,
				projectId: input.projectId,
				project: { organizationId: input.organizationId },
			},
			include: {
				project: {
					include: {
						organization: true,
					},
				},
				photos: true,
			},
		});

		if (!update) {
			throw new ORPCError("NOT_FOUND", { message: "Update not found" });
		}

		// Generate PDF
		const pdfBuffer = await generateUpdatePDF(
			{
				projectName: update.project.name,
				updateDate: update.createdAt,
				type: update.type,
				title: update.title,
				body: update.body,
				photos: update.photos.map((p) => ({
					url: p.url,
					caption: p.caption || undefined,
				})),
				companyName: update.project.organization.name,
				companyLogo: update.project.organization.logo || undefined,
			},
			{
				title:
					input.language === "ar"
						? `تحديث - ${update.title}`
						: `Update - ${update.title}`,
				language: input.language,
			},
		);

		// Return as base64 for easy transport
		return {
			filename: `update-${update.id}.html`,
			mimeType: "text/html",
			content: pdfBuffer.toString("base64"),
			size: pdfBuffer.length,
		};
	});
