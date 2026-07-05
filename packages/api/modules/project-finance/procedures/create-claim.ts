import { createProjectClaim, getProjectById } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyEvent } from "../../notifications/lib/notify";
import { idString, positiveAmount, MAX_DESC } from "../../../lib/validation-constants";

export const createClaim = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/finance/claims",
		tags: ["Project Finance"],
		summary: "Create a new project claim",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			periodStart: z.coerce.date().optional(),
			periodEnd: z.coerce.date().optional(),
			amount: positiveAmount(),
			dueDate: z.coerce.date().optional(),
			note: z.string().trim().max(MAX_DESC).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission to manage payments
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		let claim: Awaited<ReturnType<typeof createProjectClaim>>;
		try {
			claim = await createProjectClaim({
				organizationId: input.organizationId,
				projectId: input.projectId,
				createdById: context.user.id,
				periodStart: input.periodStart,
				periodEnd: input.periodEnd,
				amount: input.amount,
				dueDate: input.dueDate,
				note: input.note,
			});
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "CLAIMS_EXCEED_CONTRACT_VALUE") {
					throw new ORPCError("BAD_REQUEST", {
						message: "إجمالي المستخلصات يتجاوز قيمة العقد المعدلة",
					});
				}
			}
			throw error;
		}

		const project = await getProjectById(input.projectId, input.organizationId);
		await notifyEvent({
			event: "projects.claimCreated",
			organizationId: input.organizationId,
			actorId: context.user.id,
			projectId: input.projectId,
			entity: { type: "claim", id: claim.id },
			data: {
				projectName: project?.name,
				claimNo: claim.claimNo,
				amount: `${new Intl.NumberFormat("en-US").format(Number(claim.amount))} ر.س`,
			},
		});

		return {
			...claim,
			amount: Number(claim.amount),
		};
	});
