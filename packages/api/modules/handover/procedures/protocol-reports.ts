// Handover Protocols — Print & Warranty Reports

// TODO(#114): Implement PDF generation for handover protocols using pdfkit
// TODO(#115): Add cron job to check warranty expiry and send notifications

import { db, orgAuditLog } from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import {
	protectedProcedure,
	subscriptionProcedure,
} from "../../../orpc/procedures";
import { verifyOrganizationAccess, verifyProjectAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

// ═══════════════════════════════════════════════════════════════════════════
// 14. PRINT HANDOVER PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════
export const printHandoverProtocol = subscriptionProcedure
	.route({
		method: "POST",
		path: "/handover/protocols/{id}/print",
		tags: ["Handover"],
		summary: "Record a print event",
	})
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		const protocol = await db.handoverProtocol.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: { projectId: true },
		});
		if (!protocol) {
			throw new ORPCError("NOT_FOUND", { message: "المحضر غير موجود" });
		}

		await verifyProjectAccess(protocol.projectId, input.organizationId, context.user.id, {
			section: "projects",
			action: "view",
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "HANDOVER_COMPLETED", // reuse — no dedicated print action needed
			entityType: "handover_protocol",
			entityId: input.id,
			metadata: { action: "print" },
		});

		return { success: true };
	});

// ═══════════════════════════════════════════════════════════════════════════
// 15. GET WARRANTY STATUS
// ═══════════════════════════════════════════════════════════════════════════
export const getWarrantyStatus = protectedProcedure
	.route({
		method: "GET",
		path: "/handover/warranty-status",
		tags: ["Handover"],
		summary: "Get warranty status for protocols",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		if (input.projectId) {
			await verifyProjectAccess(input.projectId, input.organizationId, context.user.id, {
				section: "projects",
				action: "view",
			});
		} else {
			await verifyOrganizationAccess(input.organizationId, context.user.id, {
				section: "projects",
				action: "view",
			});
		}

		const where: any = {
			organizationId: input.organizationId,
			type: "PRELIMINARY",
			status: "COMPLETED",
			warrantyEndDate: { not: null },
		};
		if (input.projectId) where.projectId = input.projectId;

		const protocols = await db.handoverProtocol.findMany({
			where,
			include: {
				project: { select: { id: true, name: true } },
			},
			orderBy: { warrantyEndDate: "asc" },
		});

		const now = new Date();
		return protocols.map((p) => {
			const endDate = p.warrantyEndDate!;
			const diffMs = endDate.getTime() - now.getTime();
			const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
			return {
				id: p.id,
				protocolNo: p.protocolNo,
				projectName: p.project.name,
				projectId: p.project.id,
				warrantyStartDate: p.warrantyStartDate,
				warrantyEndDate: p.warrantyEndDate,
				daysRemaining: Math.max(0, daysRemaining),
				isExpired: daysRemaining <= 0,
				status: daysRemaining <= 0 ? "EXPIRED" : daysRemaining <= 30 ? "EXPIRING_SOON" : "ACTIVE",
			};
		});
	});
