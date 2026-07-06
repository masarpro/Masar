import { deleteSubcontractChangeOrder, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const deleteSubcontractChangeOrderProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/projects/{projectId}/subcontracts/{contractId}/change-orders/{changeOrderId}",
		tags: ["Subcontracts"],
		summary: "Delete a subcontract change order",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractId: idString(),
			changeOrderId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		try {
			await deleteSubcontractChangeOrder(
				input.changeOrderId,
				input.contractId,
				input.organizationId,
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
						message: `لا يمكن حذف أمر التغيير — تخفيض قيمة العقد المعدّلة إلى ${fmt(newCeiling)} ريال يقل عن الالتزامات القائمة البالغة ${fmt(committed)} ريال`,
					});
				}
			}
			throw error;
		}

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_CO_DELETED",
			entityType: "subcontract_change_order",
			entityId: input.changeOrderId,
			metadata: { contractId: input.contractId },
		}).catch(() => {});

		return { success: true };
	});
