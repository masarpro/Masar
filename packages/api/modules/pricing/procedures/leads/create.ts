import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import type { ClientType, LeadPriority, LeadSource, LeadStatus, ProjectType } from "@repo/database/prisma/generated/client";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { subscriptionProcedure } from "../../../../orpc/procedures";

export const create = subscriptionProcedure
	.route({
		method: "POST",
		path: "/pricing/leads",
		tags: ["Leads"],
		summary: "Create a new lead",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string().min(1),
			phone: z.string().optional(),
			email: z.string().email().optional().or(z.literal("")),
			company: z.string().optional(),
			clientType: z.enum(["INDIVIDUAL", "COMMERCIAL"]).optional(),
			projectType: z
				.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "INFRASTRUCTURE", "MIXED"])
				.optional(),
			projectLocation: z.string().optional(),
			estimatedArea: z.number().positive().optional(),
			estimatedValue: z.number().positive().optional(),
			status: z
				.enum(["NEW", "STUDYING", "QUOTED", "NEGOTIATING", "WON", "LOST"])
				.optional(),
			source: z
				.enum(["REFERRAL", "SOCIAL_MEDIA", "WEBSITE", "DIRECT", "EXHIBITION", "OTHER"])
				.optional(),
			priority: z.enum(["NORMAL", "HIGH", "URGENT"]).optional(),
			assignedToId: z.string().optional(),
			expectedCloseDate: z.string().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "leads" },
		);

		// Verify assignedTo user belongs to the organization
		if (input.assignedToId) {
			const assignee = await db.user.findFirst({
				where: { id: input.assignedToId, organizationId: input.organizationId },
				select: { id: true },
			});
			if (!assignee) {
				throw new ORPCError("BAD_REQUEST", {
					message: "المستخدم المعيّن ليس عضواً في هذه المنظمة",
				});
			}
		}

		const lead = await db.lead.create({
			data: {
				organizationId: input.organizationId,
				createdById: context.user.id,
				name: input.name,
				phone: input.phone || undefined,
				email: input.email || undefined,
				company: input.company || undefined,
				clientType: (input.clientType ?? "INDIVIDUAL") as ClientType,
				projectType: input.projectType ? (input.projectType as ProjectType) : undefined,
				projectLocation: input.projectLocation || undefined,
				estimatedArea: input.estimatedArea ?? undefined,
				estimatedValue: input.estimatedValue ?? undefined,
				status: (input.status ?? "NEW") as LeadStatus,
				source: (input.source ?? "DIRECT") as LeadSource,
				priority: (input.priority ?? "NORMAL") as LeadPriority,
				assignedToId: input.assignedToId || undefined,
				expectedCloseDate: input.expectedCloseDate
					? new Date(input.expectedCloseDate)
					: undefined,
				notes: input.notes || undefined,
				activities: {
					create: {
						organizationId: input.organizationId,
						createdById: context.user.id,
						type: "STATUS_CHANGE",
						content: null,
						metadata: { system: true, event: "CREATED", newStatus: input.status ?? "NEW" },
					},
				},
			},
			include: {
				createdBy: { select: { id: true, name: true, image: true } },
				assignedTo: { select: { id: true, name: true, image: true } },
			},
		});

		return {
			...lead,
			estimatedArea: lead.estimatedArea ? Number(lead.estimatedArea) : null,
			estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : null,
		};
	});
