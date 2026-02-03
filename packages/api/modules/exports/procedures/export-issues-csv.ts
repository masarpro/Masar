import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { generateIssuesCsv } from "../lib/csv-generator";

export const exportIssuesCsvProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/exports/issues-csv",
		tags: ["Exports"],
		summary: "Export project issues to CSV",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			status: z.string().optional(),
			priority: z.string().optional(),
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

		// Build where clause
		const where: {
			projectId: string;
			project: { organizationId: string };
			status?: string;
			priority?: string;
		} = {
			projectId: input.projectId,
			project: { organizationId: input.organizationId },
		};

		if (input.status) {
			where.status = input.status;
		}

		if (input.priority) {
			where.priority = input.priority;
		}

		// Get issues
		const issues = await db.projectIssue.findMany({
			where,
			include: {
				reportedByUser: { select: { name: true } },
			},
			orderBy: { createdAt: "desc" },
		});

		// Transform to CSV format
		const csvData = issues.map((i) => ({
			title: i.title,
			description: i.description,
			priority: i.priority,
			status: i.status,
			category: i.category,
			createdAt: i.createdAt,
			resolvedAt: i.resolvedAt,
			reportedBy: i.reportedByUser?.name || "",
		}));

		const csv = generateIssuesCsv(csvData, input.language);

		return {
			filename: `issues-${input.projectId}.csv`,
			mimeType: "text/csv",
			content: Buffer.from(csv, "utf-8").toString("base64"),
			rowCount: issues.length,
		};
	});
