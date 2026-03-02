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

		// Get the update message (official updates stored as ProjectMessage with isUpdate=true)
		const update = await db.projectMessage.findFirst({
			where: {
				id: input.updateId,
				projectId: input.projectId,
				project: { organizationId: input.organizationId },
				isUpdate: true,
			},
			include: {
				project: {
					include: {
						organization: true,
					},
				},
			},
		});

		if (!update) {
			throw new ORPCError("NOT_FOUND", { message: "Update not found" });
		}

		// Get recent project photos for context
		const photos = await db.projectPhoto.findMany({
			where: { projectId: input.projectId },
			orderBy: { createdAt: "desc" },
			take: 4,
			select: { url: true, caption: true },
		});

		// Generate PDF
		const pdfBuffer = await generateUpdatePDF(
			{
				projectName: update.project.name,
				updateDate: update.createdAt,
				type: "OFFICIAL_UPDATE",
				title: update.content.split("\n")[0] || "تحديث المشروع",
				body: update.content,
				photos: photos.map((p: { url: string; caption: string | null }) => ({
					url: p.url,
					caption: p.caption || undefined,
				})),
				companyName: update.project.organization.name,
				companyLogo: update.project.organization.logo || undefined,
			},
			{
				title:
					input.language === "ar"
						? `تحديث - ${update.content.split("\n")[0] || "تحديث المشروع"}`
						: `Update - ${update.content.split("\n")[0] || "Project Update"}`,
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
