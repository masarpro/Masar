import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { subscriptionProcedure } from "../../../../orpc/procedures";

export const convertToProject = subscriptionProcedure
	.route({
		method: "POST",
		path: "/pricing/leads/{leadId}/convert",
		tags: ["Leads"],
		summary: "Convert a lead to a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			leadId: z.string(),
			projectName: z.string().optional(),
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
			include: {
				quotation: true,
			},
		});

		if (!lead) {
			throw new ORPCError("NOT_FOUND", {
				message: "العميل المحتمل غير موجود",
			});
		}

		if (lead.convertedProjectId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "تم تحويل هذا العميل المحتمل مسبقاً",
			});
		}

		if (lead.status === "LOST") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن تحويل عميل محتمل بحالة خسارة",
			});
		}

		const name = input.projectName || `${lead.name} - مشروع`;
		const slug =
			name.replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]/g, "") +
			"-" +
			Date.now();

		const project = await db.project.create({
			data: {
				name,
				slug,
				organizationId: lead.organizationId,
				createdById: context.user.id,
				status: "ACTIVE",
				clientName: lead.name,
			},
		});

		await db.lead.update({
			where: { id: input.leadId },
			data: {
				status: "WON",
				convertedProjectId: project.id,
			},
		});

		await db.leadActivity.create({
			data: {
				leadId: input.leadId,
				organizationId: input.organizationId,
				createdById: context.user.id,
				type: "CONVERTED",
				content: null,
				metadata: {
					projectId: project.id,
					projectName: project.name,
				},
			},
		});

		return project;
	});
