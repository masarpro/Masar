import { ORPCError } from "@orpc/server";
import { auth } from "@repo/auth";
import {
	createOrgUser as createOrgUserQuery,
	getUserByEmail,
	db,
} from "@repo/database";
import { sendEmail } from "@repo/mail";
import { getBaseUrl } from "@repo/utils";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { enforceFeatureAccess } from "../../../lib/feature-gate";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const createOrgUser = subscriptionProcedure
	.route({
		method: "POST",
		path: "/org-users",
		tags: ["Organization Users"],
		summary: "Create organization user",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string().min(1),
			email: z.string().email(),
			organizationRoleId: z.string(),
			password: z.string().min(8).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "settings", action: "users" },
		);

		// Feature gate: check member invite limit
		await enforceFeatureAccess(input.organizationId, "members.invite", context.user);

		// التحقق من عدم وجود المستخدم مسبقاً
		const existingUser = await getUserByEmail(input.email);
		if (existingUser) {
			throw new ORPCError("CONFLICT", {
				message: "البريد الإلكتروني مستخدم مسبقاً",
			});
		}

		// Get organization and role names for the email
		const [organization, role] = await Promise.all([
			db.organization.findUnique({
				where: { id: input.organizationId },
				select: { name: true },
			}),
			db.role.findUnique({
				where: { id: input.organizationRoleId },
				select: { name: true },
			}),
		]);

		// إنشاء المستخدم بحالة غير مفعّلة (ينتظر قبول الدعوة)
		const user = await createOrgUserQuery({
			name: input.name,
			email: input.email,
			organizationRoleId: input.organizationRoleId,
			organizationId: input.organizationId,
			createdById: context.user.id,
			mustChangePassword: true,
			isActive: false,
			emailVerified: false,
		});

		// توليد رمز الدعوة
		const token = crypto.randomUUID();
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		// إنشاء سجل الدعوة
		await db.userInvitation.create({
			data: {
				email: input.email,
				name: input.name,
				roleId: input.organizationRoleId,
				token,
				expiresAt,
				status: "PENDING",
				organizationId: input.organizationId,
				invitedById: context.user.id,
			},
		});

		// إرسال بريد الدعوة
		const baseUrl = getBaseUrl();
		const invitationUrl = `${baseUrl}/invitation/accept?token=${token}`;

		await sendEmail({
			to: input.email,
			templateId: "userInvitation",
			context: {
				url: invitationUrl,
				organizationName: organization?.name ?? "المنظمة",
				inviterName: context.user.name ?? "مدير المنظمة",
				roleName: role?.name ?? "عضو",
			},
		});

		return { user };
	});
