import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { subscriptionProcedure } from "../../../../orpc/procedures";

export const linkQuotation = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/pricing/leads/{leadId}/link-quotation",
		tags: ["Leads"],
		summary: "Link a quotation to a lead",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			leadId: z.string().trim().max(100),
			quotationId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "leads" },
		);

		// Verify lead belongs to org
		const lead = await db.lead.findFirst({
			where: { id: input.leadId, organizationId: input.organizationId },
		});
		if (!lead) {
			throw new ORPCError("NOT_FOUND", {
				message: "العميل المحتمل غير موجود",
			});
		}

		// Verify quotation belongs to org
		const quotation = await db.quotation.findFirst({
			where: { id: input.quotationId, organizationId: input.organizationId },
		});
		if (!quotation) {
			throw new ORPCError("NOT_FOUND", {
				message: "عرض السعر غير موجود",
			});
		}

		// Check if quotation is already linked to another lead
		const existing = await db.lead.findFirst({
			where: { quotationId: input.quotationId },
		});
		if (existing && existing.id !== input.leadId) {
			throw new ORPCError("CONFLICT", {
				message: "عرض السعر مرتبط بعميل محتمل آخر",
			});
		}

		const updated = await db.lead.update({
			where: { id: input.leadId },
			data: { quotationId: input.quotationId },
			include: {
				quotation: {
					select: { id: true, quotationNo: true, totalAmount: true, status: true },
				},
				createdBy: { select: { id: true, name: true, image: true } },
				assignedTo: { select: { id: true, name: true, image: true } },
			},
		});

		await db.leadActivity.create({
			data: {
				leadId: input.leadId,
				organizationId: input.organizationId,
				createdById: context.user.id,
				type: "QUOTATION_LINKED",
				metadata: {
					quotationId: input.quotationId,
					quotationNo: quotation.quotationNo,
				},
			},
		});

		return {
			...updated,
			estimatedArea: updated.estimatedArea ? Number(updated.estimatedArea) : null,
			estimatedValue: updated.estimatedValue ? Number(updated.estimatedValue) : null,
			quotation: updated.quotation
				? { ...updated.quotation, totalAmount: Number(updated.quotation.totalAmount) }
				: null,
		};
	});
