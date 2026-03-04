import { updateSubcontractClaim, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updateSubcontractClaimProcedure = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/subcontracts/claims/{claimId}",
		tags: ["Subcontract Claims"],
		summary: "Update a subcontract claim (DRAFT only)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			claimId: z.string(),
			title: z.string().min(1).optional(),
			periodStart: z.coerce.date().optional(),
			periodEnd: z.coerce.date().optional(),
			claimType: z.enum(["INTERIM", "FINAL", "RETENTION"]).optional(),
			notes: z.string().nullish(),
			items: z
				.array(
					z.object({
						contractItemId: z.string(),
						thisQty: z.number().min(0),
					}),
				)
				.optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		const { organizationId, projectId, claimId, ...data } = input;

		try {
			const claim = await updateSubcontractClaim(claimId, organizationId, data);

			logAuditEvent(organizationId, projectId, {
				actorId: context.user.id,
				action: "SUBCONTRACT_CLAIM_UPDATED",
				entityType: "subcontract_claim",
				entityId: claimId,
				metadata: {},
			}).catch(() => {});

			return {
				...claim,
				grossAmount: Number(claim.grossAmount),
				retentionAmount: Number(claim.retentionAmount),
				advanceDeduction: Number(claim.advanceDeduction),
				vatAmount: Number(claim.vatAmount),
				netAmount: Number(claim.netAmount),
				paidAmount: Number(claim.paidAmount),
			};
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "CLAIM_NOT_FOUND") {
					throw new ORPCError("NOT_FOUND", { message: "المستخلص غير موجود" });
				}
				if (error.message === "CLAIM_NOT_DRAFT") {
					throw new ORPCError("BAD_REQUEST", {
						message: "لا يمكن تعديل المستخلص إلا في حالة المسودة",
					});
				}
				if (error.message === "NO_ITEMS_ADDED") {
					throw new ORPCError("BAD_REQUEST", {
						message: "يجب إضافة كميات لبند واحد على الأقل",
					});
				}
				if (error.message.startsWith("QTY_EXCEEDS_REMAINING:")) {
					throw new ORPCError("BAD_REQUEST", {
						message: "الكمية المدخلة تتجاوز المتبقي من كمية العقد",
					});
				}
			}
			throw error;
		}
	});
