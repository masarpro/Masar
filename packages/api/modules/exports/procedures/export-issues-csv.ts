import { ORPCError } from "@orpc/server";
import { db, type IssueStatus, type IssueSeverity } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { enforceFeatureAccess } from "../../../lib/feature-gate";
import { generateIssuesCsv } from "../lib/csv-generator";

export const exportIssuesCsvProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/exports/issues-csv",
		tags: ["Exports"],
		summary: "Export project issues to CSV",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			status: z.string().trim().max(100).optional(),
			severity: z.string().trim().max(100).optional(),
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
			status?: IssueStatus;
			severity?: IssueSeverity;
		} = {
			projectId: input.projectId,
			project: { organizationId: input.organizationId },
		};

		if (input.status) {
			where.status = input.status as IssueStatus;
		}

		if (input.severity) {
			where.severity = input.severity as IssueSeverity;
		}

		// Get issues
		const issues = await db.projectIssue.findMany({
			where,
			include: {
				createdBy: { select: { name: true } },
			},
			orderBy: { createdAt: "desc" },
		});

		// Transform to CSV format
		const csvData = issues.map((i) => ({
			title: i.title,
			description: i.description,
			severity: i.severity,
			status: i.status,
			createdAt: i.createdAt,
			resolvedAt: i.resolvedAt,
			reportedBy: i.createdBy?.name || "",
		}));

		const csv = generateIssuesCsv(csvData, input.language);

		return {
			filename: `issues-${input.projectId}.csv`,
			mimeType: "text/csv",
			content: Buffer.from(csv, "utf-8").toString("base64"),
			rowCount: issues.length,
		};
	});
