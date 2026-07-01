import { ORPCError } from "@orpc/server";
import { db, logSuperAdminAction } from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

export const deleteUser = adminProcedure
	.route({
		method: "POST",
		path: "/admin/users/delete",
		tags: ["Administration"],
		summary: "Delete a user",
	})
	.input(z.object({ userId: z.string().trim().min(1).max(100) }))
	.handler(async ({ input, context }) => {
		// BetterAuth's admin.removeUser does a plain delete that fails whenever the
		// user has authored records (createdById / actorId / assignedById … are
		// required FKs with no cascade). Do the delete server-side with a clear,
		// actionable error instead of an opaque 400.
		if (input.userId === context.user.id) {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكنك حذف حسابك الخاص",
			});
		}

		const target = await db.user.findUnique({
			where: { id: input.userId },
			select: { id: true, role: true, email: true, accountType: true },
		});
		if (!target) throw new ORPCError("NOT_FOUND");
		if (target.role === "admin") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن حذف حساب مشرف عام",
			});
		}

		try {
			await db.user.delete({ where: { id: input.userId } });
		} catch (_e) {
			// FK violation (P2003): the user authored records that block deletion.
			throw new ORPCError("CONFLICT", {
				message:
					"تعذّر حذف المستخدم لأنه أنشأ سجلات مرتبطة (مشاريع/فواتير/قيود). احذف منشأته أولاً أو عطّل حسابه بدلاً من الحذف.",
			});
		}

		logSuperAdminAction({
			adminId: context.user.id,
			action: "DELETE_USER",
			targetType: "user",
			targetId: input.userId,
			details: { email: target.email, accountType: target.accountType },
		});

		return { success: true };
	});
