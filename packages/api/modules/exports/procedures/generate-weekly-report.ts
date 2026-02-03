import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { generateWeeklyReportPDF } from "../lib/pdf-generator";

export const generateWeeklyReportProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/exports/weekly-report",
		tags: ["Exports"],
		summary: "Generate weekly report PDF for a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			weekStart: z.string().datetime(),
			weekEnd: z.string().datetime(),
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

		const weekStart = new Date(input.weekStart);
		const weekEnd = new Date(input.weekEnd);

		// Get the project
		const project = await db.project.findFirst({
			where: {
				id: input.projectId,
				organizationId: input.organizationId,
			},
			include: {
				organization: true,
			},
		});

		if (!project) {
			throw new ORPCError("NOT_FOUND", { message: "Project not found" });
		}

		// Get updates for the week
		const updates = await db.projectUpdate.findMany({
			where: {
				projectId: input.projectId,
				createdAt: {
					gte: weekStart,
					lte: weekEnd,
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// Get expenses for the week
		const expenses = await db.projectExpense.findMany({
			where: {
				projectId: input.projectId,
				date: {
					gte: weekStart,
					lte: weekEnd,
				},
			},
		});

		// Get issues for the week
		const issues = await db.projectIssue.findMany({
			where: {
				projectId: input.projectId,
				OR: [
					{
						createdAt: {
							gte: weekStart,
							lte: weekEnd,
						},
					},
					{
						status: { in: ["OPEN", "IN_PROGRESS"] },
					},
				],
			},
		});

		// Group expenses by category
		const expensesByCategory: Record<string, number> = {};
		for (const expense of expenses) {
			const category = expense.category;
			expensesByCategory[category] =
				(expensesByCategory[category] || 0) + expense.amount.toNumber();
		}

		// Calculate progress (simplified - would need actual progress tracking)
		const progress = project.progress || 0;

		// Generate PDF
		const pdfBuffer = await generateWeeklyReportPDF(
			{
				projectName: project.name,
				weekStart,
				weekEnd,
				updates: updates.map((u) => ({
					date: u.createdAt,
					type: u.type,
					title: u.title,
				})),
				expenses: Object.entries(expensesByCategory).map(
					([category, amount]) => ({
						category,
						amount,
					}),
				),
				issues: issues.map((i) => ({
					title: i.title,
					status: i.status,
				})),
				progress,
				companyName: project.organization.name,
				companyLogo: project.organization.logo || undefined,
			},
			{
				title:
					input.language === "ar"
						? `التقرير الأسبوعي - ${project.name}`
						: `Weekly Report - ${project.name}`,
				language: input.language,
			},
		);

		// Return as base64 for easy transport
		return {
			filename: `weekly-report-${weekStart.toISOString().split("T")[0]}.html`,
			mimeType: "text/html",
			content: pdfBuffer.toString("base64"),
			size: pdfBuffer.length,
		};
	});
