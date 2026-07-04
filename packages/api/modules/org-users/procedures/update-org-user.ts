import { ORPCError } from "@orpc/server";
import {
	countActiveOrganizationOwners,
	getOrgUserById,
	updateOrgUser as updateOrgUserQuery,
} from "@repo/database";
import { z } from "zod";
import {
	invalidateAccessCache,
	verifyOrganizationAccess,
} from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

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

		// حارس 1: لا يعدّل العضو نفسه — يمنع رفع الصلاحيات الذاتية
		if (input.id === context.user.id) {
			throw new ORPCError("FORBIDDEN", {
				message: "لا يمكنك تعديل صلاحياتك أو بياناتك من هذه الشاشة",
			});
		}

		// حارس 2: حماية آخر مالك في المنشأة من التنزيل أو التعطيل
		const targetUser = await getOrgUserById(input.id, input.organizationId);
		if (!targetUser) {
			throw new ORPCError("NOT_FOUND", {
				message: "المستخدم غير موجود",
			});
		}

		const targetIsOwnerRole =
			targetUser.organizationRole?.type === "OWNER" ||
			targetUser.accountType === "OWNER";

		if (targetIsOwnerRole) {
			const isDemotion =
				!!input.organizationRoleId &&
				input.organizationRoleId !== targetUser.organizationRoleId;
			const isDeactivation = input.isActive === false;

			if (isDemotion || isDeactivation) {
				const ownersCount = await countActiveOrganizationOwners(
					input.organizationId,
				);
				if (ownersCount <= 1) {
					throw new ORPCError("BAD_REQUEST", {
						message: "لا يمكن تنزيل أو تعطيل آخر مالك في المنشأة",
					});
				}
			}

			// تخصيص صلاحيات المالك قد يقفل المنشأة بالكامل — ممنوع
			if (input.customPermissions) {
				throw new ORPCError("BAD_REQUEST", {
					message: "لا يمكن تخصيص صلاحيات دور المالك",
				});
			}
		}

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
