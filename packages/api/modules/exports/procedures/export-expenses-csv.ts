import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { generateExpensesCsv } from "../lib/csv-generator";

export const exportExpensesCsvProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/exports/expenses-csv",
		tags: ["Exports"],
		summary: "Export project expenses to CSV",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			dateFrom: z.string().datetime().optional(),
			dateTo: z.string().datetime().optional(),
			category: z.string().optional(),
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
			date?: { gte?: Date; lte?: Date };
			category?: string;
		} = {
			projectId: input.projectId,
			project: { organizationId: input.organizationId },
		};

		if (input.dateFrom || input.dateTo) {
			where.date = {};
			if (input.dateFrom) where.date.gte = new Date(input.dateFrom);
			if (input.dateTo) where.date.lte = new Date(input.dateTo);
		}

		if (input.category) {
			where.category = input.category;
		}

		// Get expenses
		const expenses = await db.projectExpense.findMany({
			where,
			include: {
				createdByUser: { select: { name: true } },
			},
			orderBy: { date: "desc" },
		});

		// Transform to CSV format
		const csvData = expenses.map((e) => ({
			date: e.date,
			category: e.category,
			amount: e.amount.toNumber(),
			vendor: e.vendor,
			note: e.note,
			createdBy: e.createdByUser?.name || "",
		}));

		const csv = generateExpensesCsv(csvData, input.language);

		return {
			filename: `expenses-${input.projectId}.csv`,
			mimeType: "text/csv",
			content: Buffer.from(csv, "utf-8").toString("base64"),
			rowCount: expenses.length,
		};
	});
