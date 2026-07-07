import { updateSubcontractChangeOrder, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import {
	MAX_DESC, MAX_URL,
	idString, nullishTrimmed, signedAmount,
} from "../../../lib/validation-constants";

export const updateSubcontractChangeOrderProcedure = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/subcontracts/{contractId}/change-orders/{changeOrderId}",
		tags: ["Subcontracts"],
		summary: "Update a subcontract change order",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractId: idString(),
			changeOrderId: idString(),
			description: z.string().trim().min(1).max(MAX_DESC).optional(),
			amount: signedAmount().optional(),
			status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
			approvedDate: z.coerce.date().nullish(),
			attachmentUrl: nullishTrimmed(MAX_URL),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		const { organizationId, projectId, contractId, changeOrderId, ...data } =
			input;

		let co: Awaited<ReturnType<typeof updateSubcontractChangeOrder>>;
		try {
			co = await updateSubcontractChangeOrder(
				changeOrderId,
				contractId,
				organizationId,
				data,
			);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "CHANGE_ORDER_NOT_FOUND") {
					throw new ORPCError("NOT_FOUND", {
						message: "أمر التغيير غير موجود",
					});
				}
				if (error.message.startsWith("CEILING_BELOW_COMMITTED:")) {
					const [, newCeiling, committed] = error.message.split(":");
					const fmt = (v?: string) =>
						new Intl.NumberFormat("en-US").format(Number(v ?? 0));
					throw new ORPCError("BAD_REQUEST", {
						message: `لا يمكن تخفيض قيمة العقد المعدّلة إلى ${fmt(newCeiling)} ريال — الالتزامات القائمة (مستخلصات معتمدة أو دفعات) تبلغ ${fmt(committed)} ريال`,
					});
				}
			}
			throw error;
		}

		logAuditEvent(organizationId, projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_CO_UPDATED",
			entityType: "subcontract_change_order",
			entityId: changeOrderId,
			metadata: { contractId },
		}).catch((e) => console.error("[Subcontracts] audit log failed:", e));

		return { ...co, amount: Number(co.amount) };
	});
