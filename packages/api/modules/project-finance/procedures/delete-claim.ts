import { ORPCError } from "@orpc/server";
import { deleteProjectClaim, db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const deleteClaim = protectedProcedure
	.route({
		method: "DELETE",
		path: "/projects/{projectId}/finance/claims/{claimId}",
		tags: ["Project Finance"],
		summary: "Delete a project claim",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			claimId: z.string(),
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

		// Check if claim is in DRAFT status before deletion
		const existingClaim = await db.projectClaim.findFirst({
			where: {
				id: input.claimId,
				organizationId: input.organizationId,
				projectId: input.projectId,
			},
			select: { status: true },
		});

		if (!existingClaim) {
			throw new ORPCError("NOT_FOUND", {
				message: "المستخلص غير موجود",
			});
		}

		if (existingClaim.status !== "DRAFT") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن حذف المستخلص إلا في حالة المسودة",
			});
		}

		try {
			await deleteProjectClaim(
				input.claimId,
				input.organizationId,
				input.projectId,
			);

			return {
				success: true,
				message: "تم حذف المستخلص بنجاح",
			};
		} catch (error) {
			throw new ORPCError("NOT_FOUND", {
				message: "المستخلص غير موجود",
			});
		}
	});
