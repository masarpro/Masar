import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { generateClaimPDF } from "../lib/pdf-generator";

export const generateClaimPDFProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/exports/claim-pdf",
		tags: ["Exports"],
		summary: "Generate PDF for a project claim",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			claimId: z.string(),
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

		// Get the claim with project info
		const claim = await db.projectClaim.findFirst({
			where: {
				id: input.claimId,
				projectId: input.projectId,
				project: { organizationId: input.organizationId },
			},
			include: {
				project: {
					include: {
						organization: true,
					},
				},
			},
		});

		if (!claim) {
			throw new ORPCError("NOT_FOUND", { message: "Claim not found" });
		}

		// Generate PDF
		const pdfBuffer = await generateClaimPDF(
			{
				projectName: claim.project.name,
				claimNumber: claim.claimNumber,
				periodStart: claim.periodStart,
				periodEnd: claim.periodEnd,
				amount: claim.amount.toNumber(),
				currency: "SAR",
				status: claim.status,
				companyName: claim.project.organization.name,
				companyLogo: claim.project.organization.logo || undefined,
			},
			{
				title:
					input.language === "ar"
						? `مستخلص رقم ${claim.claimNumber}`
						: `Claim #${claim.claimNumber}`,
				language: input.language,
			},
		);

		// Return as base64 for easy transport
		return {
			filename: `claim-${claim.claimNumber}.html`,
			mimeType: "text/html",
			content: pdfBuffer.toString("base64"),
			size: pdfBuffer.length,
		};
	});
