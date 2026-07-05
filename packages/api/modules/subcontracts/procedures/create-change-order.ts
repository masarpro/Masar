import { createSubcontractChangeOrder, db, getSubcontractById, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import {
	MAX_DESC, MAX_ID, MAX_URL,
	idString, nullishTrimmed, signedAmount,
} from "../../../lib/validation-constants";
import { notifyEvent } from "../../notifications/lib/notify";

export const createSubcontractChangeOrderProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/subcontracts/{contractId}/change-orders",
		tags: ["Subcontracts"],
		summary: "Create a change order for a subcontract",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractId: idString(),
			description: z.string().trim().min(1, "وصف أمر التغيير مطلوب").max(MAX_DESC),
			amount: signedAmount(),
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

		const contract = await getSubcontractById(
			input.contractId,
			input.organizationId,
			input.projectId,
		);

		if (!contract) {
			throw new ORPCError("NOT_FOUND", {
				message: "عقد الباطن غير موجود",
			});
		}

		let co: Awaited<ReturnType<typeof createSubcontractChangeOrder>>;
		try {
			co = await createSubcontractChangeOrder({
				contractId: input.contractId,
				organizationId: input.organizationId,
				createdById: context.user.id,
				description: input.description,
				amount: input.amount,
				status: input.status,
				approvedDate: input.approvedDate,
				attachmentUrl: input.attachmentUrl,
			});
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.startsWith("CEILING_BELOW_COMMITTED:")
			) {
				const [, newCeiling, committed] = error.message.split(":");
				const fmt = (v?: string) =>
					new Intl.NumberFormat("en-US").format(Number(v ?? 0));
				throw new ORPCError("BAD_REQUEST", {
					message: `لا يمكن تخفيض قيمة العقد المعدّلة إلى ${fmt(newCeiling)} ريال — الالتزامات القائمة (مستخلصات معتمدة أو دفعات) تبلغ ${fmt(committed)} ريال`,
				});
			}
			throw error;
		}

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_CO_CREATED",
			entityType: "subcontract_change_order",
			entityId: co.id,
			metadata: { contractId: input.contractId, amount: input.amount },
		}).catch(() => {});

		const project = await db.project.findFirst({
			where: { id: input.projectId, organizationId: input.organizationId },
			select: { name: true },
		});
		await notifyEvent({
			event: "projects.subcontractChangeOrderCreated",
			organizationId: input.organizationId,
			actorId: context.user.id,
			projectId: input.projectId,
			entity: { type: "subcontractChangeOrder", id: co.id },
			data: {
				projectName: project?.name,
				subcontractorName: contract.name,
				amount: `${new Intl.NumberFormat("en-US").format(Number(co.amount))} ر.س`,
			},
		});

		return { ...co, amount: Number(co.amount) };
	});
