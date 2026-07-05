import { ORPCError } from "@orpc/server";
import { db, updateOrgUser as updateOrgUserQuery } from "@repo/database";
import { z } from "zod";
import {
	invalidateAccessCache,
	verifyOrganizationAccess,
} from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { notifyEvent } from "../../notifications/lib/notify";
import { assertOrgUserUpdateAllowed } from "../lib/update-guards";

export const updateOrgUser = subscriptionProcedure
	.route({
		method: "POST",
		path: "/org-users/{id}",
		tags: ["Organization Users"],
		summary: "Update organization user",
	})
	.input(
		z.object({
			id: z.string().trim().max(100),
			organizationId: z.string().trim().max(100),
			name: z.string().trim().min(1).max(200).optional(),
			organizationRoleId: z.string().trim().max(100).optional(),
			isActive: z.boolean().optional(),
			customPermissions: z.record(z.string().max(50), z.record(z.string().max(50), z.boolean())).refine(obj => Object.keys(obj).length <= 20, "Too many permission sections").optional(),
			// امسح التخصيصات وأعد المستخدم لصلاحيات دوره فقط
			resetCustomPermissions: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "settings", action: "users" },
		);

		// حارسا RBAC-UI: منع تعديل الذات + حماية آخر مالك
		await assertOrgUserUpdateAllowed({
			targetUserId: input.id,
			organizationId: input.organizationId,
			actorUserId: context.user.id,
			organizationRoleId: input.organizationRoleId,
			isActive: input.isActive,
			customPermissions: input.customPermissions,
		});

		// الدور السابق — لإطلاق إشعار تغيير الدور فقط عند تغيّره فعلياً
		const previousRoleId = input.organizationRoleId
			? (
					await db.user.findFirst({
						where: { id: input.id, organizationId: input.organizationId },
						select: { organizationRoleId: true },
					})
				)?.organizationRoleId
			: undefined;

		try {
			const user = await updateOrgUserQuery(
				input.id,
				input.organizationId,
				{
					name: input.name,
					organizationRoleId: input.organizationRoleId,
					isActive: input.isActive,
					customPermissions: input.customPermissions,
					resetCustomPermissions: input.resetCustomPermissions,
				},
			);

			// Role / isActive / customPermissions change → drop this user's cached
			// membership + permissions so it takes effect on the next request.
			invalidateAccessCache(input.organizationId, input.id);

			if (
				input.organizationRoleId &&
				previousRoleId !== input.organizationRoleId
			) {
				const newRole = await db.role.findUnique({
					where: { id: input.organizationRoleId },
					select: { name: true },
				});
				await notifyEvent({
					event: "org.userRoleChanged",
					organizationId: input.organizationId,
					actorId: context.user.id,
					entity: { type: "user", id: input.id },
					recipients: [input.id],
					data: { roleName: newRole?.name },
				});
			}

			return { user };
		} catch (error) {
			if (error instanceof Error) {
				throw new ORPCError("BAD_REQUEST", {
					message: error.message,
				});
			}
			throw error;
		}
	});
