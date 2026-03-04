import { ORPCError } from "@orpc/server";
import { db, type ClaimStatus } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { enforceFeatureAccess } from "../../../lib/feature-gate";
import { generateClaimsCsv } from "../lib/csv-generator";

export const exportClaimsCsvProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/exports/claims-csv",
		tags: ["Exports"],
		summary: "Export project claims to CSV",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			status: z.string().optional(),
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

		await enforceFeatureAccess(input.organizationId, "export.pdf", context.user);

		// Build where clause
		const where: {
			projectId: string;
			project: { organizationId: string };
			status?: ClaimStatus;
		} = {
			projectId: input.projectId,
			project: { organizationId: input.organizationId },
		};

		if (input.status) {
			where.status = input.status as ClaimStatus;
		}

		// Get claims
		const claims = await db.projectClaim.findMany({
			where,
			orderBy: { claimNo: "desc" },
		});

		// Transform to CSV format
		const csvData = claims.map((c) => ({
			claimNumber: c.claimNo,
			periodStart: c.periodStart ?? new Date(),
			periodEnd: c.periodEnd ?? new Date(),
			amount: c.amount.toNumber(),
			status: c.status,
			dueDate: c.dueDate,
			note: c.note,
		}));

		const csv = generateClaimsCsv(csvData, input.language);

		return {
			filename: `claims-${input.projectId}.csv`,
			mimeType: "text/csv",
			content: Buffer.from(csv, "utf-8").toString("base64"),
			rowCount: claims.length,
		};
	});
