import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../../organizations/lib/membership";

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

		// Verify assignedTo user is a member of the organization
		if (input.assignedToId) {
			const assigneeMembership = await verifyOrganizationMembership(
				input.organizationId,
				input.assignedToId,
			);
			if (!assigneeMembership) {
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
				phone: input.phone,
				email: input.email || null,
				company: input.company,
				clientType: input.clientType as any,
				projectType: input.projectType as any,
				projectLocation: input.projectLocation,
				estimatedArea: input.estimatedArea,
				estimatedValue: input.estimatedValue,
				status: input.status as any,
				source: input.source as any,
				priority: input.priority as any,
				assignedToId: input.assignedToId,
				expectedCloseDate: input.expectedCloseDate
					? new Date(input.expectedCloseDate)
					: undefined,
				notes: input.notes,
				activities: {
					create: {
						organizationId: input.organizationId,
						createdById: context.user.id,
						type: "COMMENT",
						content: null,
						metadata: { system: true, event: "CREATED" },
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
