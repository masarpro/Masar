import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../../organizations/lib/membership";

export const update = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/pricing/leads/{leadId}",
		tags: ["Leads"],
		summary: "Update a lead",
	})
	.input(
		z.object({
			organizationId: z.string(),
			leadId: z.string(),
			name: z.string().min(1).optional(),
			phone: z.string().optional().nullable(),
			email: z.string().email().optional().nullable().or(z.literal("")),
			company: z.string().optional().nullable(),
			clientType: z.enum(["INDIVIDUAL", "COMMERCIAL"]).optional(),
			projectType: z
				.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "INFRASTRUCTURE", "MIXED"])
				.optional()
				.nullable(),
			projectLocation: z.string().optional().nullable(),
			estimatedArea: z.number().positive().optional().nullable(),
			estimatedValue: z.number().positive().optional().nullable(),
			source: z
				.enum(["REFERRAL", "SOCIAL_MEDIA", "WEBSITE", "DIRECT", "EXHIBITION", "OTHER"])
				.optional(),
			priority: z.enum(["NORMAL", "HIGH", "URGENT"]).optional(),
			assignedToId: z.string().optional().nullable(),
			expectedCloseDate: z.string().optional().nullable(),
			lostReason: z.string().optional().nullable(),
			notes: z.string().optional().nullable(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "leads" },
		);

		// Verify lead belongs to organization
		const existingLead = await db.lead.findFirst({
			where: { id: input.leadId, organizationId: input.organizationId },
		});
		if (!existingLead) {
			throw new ORPCError("NOT_FOUND", {
				message: "العميل المحتمل غير موجود",
			});
		}

		// Verify new assignee if changed
		if (input.assignedToId !== undefined && input.assignedToId !== null) {
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

		// Create assignment activity if assignedToId changed
		const assignedChanged =
			input.assignedToId !== undefined &&
			input.assignedToId !== existingLead.assignedToId;

		const updateData: Record<string, unknown> = {};
		if (input.name !== undefined) updateData.name = input.name;
		if (input.phone !== undefined) updateData.phone = input.phone;
		if (input.email !== undefined) updateData.email = input.email === "" ? null : input.email;
		if (input.company !== undefined) updateData.company = input.company;
		if (input.clientType !== undefined) updateData.clientType = input.clientType;
		if (input.projectType !== undefined) updateData.projectType = input.projectType;
		if (input.projectLocation !== undefined) updateData.projectLocation = input.projectLocation;
		if (input.estimatedArea !== undefined) updateData.estimatedArea = input.estimatedArea;
		if (input.estimatedValue !== undefined) updateData.estimatedValue = input.estimatedValue;
		if (input.source !== undefined) updateData.source = input.source;
		if (input.priority !== undefined) updateData.priority = input.priority;
		if (input.assignedToId !== undefined) updateData.assignedToId = input.assignedToId;
		if (input.expectedCloseDate !== undefined)
			updateData.expectedCloseDate =
				input.expectedCloseDate === null ? null : new Date(input.expectedCloseDate);
		if (input.lostReason !== undefined) updateData.lostReason = input.lostReason;
		if (input.notes !== undefined) updateData.notes = input.notes;

		const lead = await db.lead.update({
			where: { id: input.leadId },
			data: updateData as any,
			include: {
				createdBy: { select: { id: true, name: true, image: true } },
				assignedTo: { select: { id: true, name: true, image: true } },
			},
		});

		if (assignedChanged) {
			await db.leadActivity.create({
				data: {
					leadId: input.leadId,
					organizationId: input.organizationId,
					createdById: context.user.id,
					type: "ASSIGNED",
					metadata: {
						oldAssignedToId: existingLead.assignedToId,
						newAssignedToId: input.assignedToId,
					},
				},
			});
		}

		return {
			...lead,
			estimatedArea: lead.estimatedArea ? Number(lead.estimatedArea) : null,
			estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : null,
		};
	});
