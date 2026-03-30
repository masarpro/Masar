import { getClaimPrintData, markClaimAsPrinted, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getSubcontractClaimPrintDataProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/subcontracts/claims/{claimId}/print-data",
		tags: ["Subcontract Claims"],
		summary: "Get all data needed for printing a subcontract claim",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			claimId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "view" },
		);

		const data = await getClaimPrintData(input.claimId, input.organizationId);
		if (!data) {
			throw new ORPCError("NOT_FOUND", {
				message: "المستخلص غير موجود",
			});
		}

		return data;
	});

export const markSubcontractClaimAsPrintedProcedure = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/subcontracts/claims/{claimId}/printed",
		tags: ["Subcontract Claims"],
		summary: "Mark a subcontract claim as printed",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			claimId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		await markClaimAsPrinted(input.claimId, input.organizationId);

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_CLAIM_UPDATED",
			entityType: "subcontract_claim",
			entityId: input.claimId,
			metadata: { action: "printed" },
		}).catch(() => {});

		return { success: true };
	});
