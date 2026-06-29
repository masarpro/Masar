import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { sendEmail } from "@repo/mail";
import { getBaseUrl } from "@repo/utils";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const resendInvitation = subscriptionProcedure
	.route({
		method: "POST",
		path: "/org-users/{id}/resend-invitation",
		tags: ["Organization Users"],
		summary: "Resend an organization user invitation",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			id: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "settings",
			action: "users",
		});

		const user = await db.user.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: {
				id: true,
				email: true,
				name: true,
				isActive: true,
				organizationRoleId: true,
			},
		});
		if (!user) {
			throw new ORPCError("NOT_FOUND", { message: "المستخدم غير موجود" });
		}
		if (user.isActive) {
			throw new ORPCError("BAD_REQUEST", {
				message: "المستخدم مفعّل بالفعل ولا يحتاج إعادة دعوة",
			});
		}

		const [organization, role] = await Promise.all([
			db.organization.findUnique({
				where: { id: input.organizationId },
				select: { name: true },
			}),
			user.organizationRoleId
				? db.role.findUnique({
						where: { id: user.organizationRoleId },
						select: { name: true },
					})
				: Promise.resolve(null),
		]);

		// Regenerate token + expiry; reuse the latest pending invitation if present.
		const token = crypto.randomUUID();
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		const existing = await db.userInvitation.findFirst({
			where: {
				email: user.email,
				organizationId: input.organizationId,
				status: "PENDING",
			},
			orderBy: { createdAt: "desc" },
			select: { id: true },
		});

		if (existing) {
			await db.userInvitation.update({
				where: { id: existing.id },
				data: { token, expiresAt, status: "PENDING" },
			});
		} else {
			if (!user.organizationRoleId) {
				throw new ORPCError("BAD_REQUEST", {
					message: "لا يمكن إنشاء دعوة لمستخدم بدون دور",
				});
			}
			await db.userInvitation.create({
				data: {
					email: user.email,
					name: user.name,
					roleId: user.organizationRoleId,
					token,
					expiresAt,
					status: "PENDING",
					organizationId: input.organizationId,
					invitedById: context.user.id,
				},
			});
		}

		const baseUrl = getBaseUrl();
		const invitationUrl = `${baseUrl}/invitation/accept?token=${token}`;

		await sendEmail({
			to: user.email,
			templateId: "userInvitation",
			context: {
				url: invitationUrl,
				organizationName: organization?.name ?? "المنظمة",
				inviterName: context.user.name ?? "مدير المنظمة",
				roleName: role?.name ?? "عضو",
			},
		});

		return { success: true };
	});
