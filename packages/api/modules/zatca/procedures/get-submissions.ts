// ZATCA Submissions List — قائمة الفواتير المُرسلة لزاتكا

import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import {
	idString,
	paginationLimit,
	paginationOffset,
} from "../../../lib/validation-constants";
import { Prisma } from "@repo/database/prisma/generated/client";

export const getSubmissions = protectedProcedure
	.route({
		method: "GET",
		path: "/zatca/submissions",
		tags: ["ZATCA"],
		summary: "List ZATCA invoice submissions",
	})
	.input(
		z.object({
			organizationId: idString(),
			status: z
				.enum([
					"NOT_APPLICABLE",
					"PENDING",
					"SUBMITTED",
					"CLEARED",
					"REPORTED",
					"REJECTED",
					"FAILED",
				])
				.optional(),
			invoiceId: idString().optional(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const where: Prisma.ZatcaSubmissionWhereInput = {
			organizationId: input.organizationId,
		};
		if (input.status) where.status = input.status;
		if (input.invoiceId) where.invoiceId = input.invoiceId;

		const [submissions, total] = await Promise.all([
			db.zatcaSubmission.findMany({
				where,
				include: {
					invoice: {
						select: {
							invoiceNo: true,
							totalAmount: true,
							clientName: true,
							invoiceType: true,
							issueDate: true,
						},
					},
					device: {
						select: {
							deviceName: true,
							invoiceType: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
				take: input.limit,
				skip: input.offset,
			}),
			db.zatcaSubmission.count({ where }),
		]);

		return { submissions, total };
	});

export const getSubmissionById = protectedProcedure
	.route({
		method: "GET",
		path: "/zatca/submissions/{id}",
		tags: ["ZATCA"],
		summary: "Get ZATCA submission details",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const submission = await db.zatcaSubmission.findFirst({
			where: {
				id: input.id,
				organizationId: input.organizationId,
			},
			include: {
				invoice: {
					select: {
						invoiceNo: true,
						totalAmount: true,
						vatAmount: true,
						clientName: true,
						invoiceType: true,
						issueDate: true,
						status: true,
					},
				},
				device: {
					select: {
						deviceName: true,
						invoiceType: true,
						status: true,
					},
				},
			},
		});

		if (!submission) {
			throw new Error("الإرسال غير موجود");
		}

		return submission;
	});
