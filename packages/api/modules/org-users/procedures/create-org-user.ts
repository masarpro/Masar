import { ORPCError } from "@orpc/server";
import { auth } from "@repo/auth";
import {
	createOrgUser as createOrgUserQuery,
	getUserByEmail,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const createOrgUser = protectedProcedure
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
			password: z.string().min(8),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "settings", action: "users" },
		);

		// التحقق من عدم وجود المستخدم مسبقاً
		const existingUser = await getUserByEmail(input.email);
		if (existingUser) {
			throw new ORPCError("CONFLICT", {
				message: "البريد الإلكتروني مستخدم مسبقاً",
			});
		}

		// إنشاء المستخدم
		const user = await createOrgUserQuery({
			name: input.name,
			email: input.email,
			organizationRoleId: input.organizationRoleId,
			organizationId: input.organizationId,
			createdById: context.user.id,
			mustChangePassword: true,
		});

		// إنشاء حساب بكلمة مرور عبر better-auth
		const authContext = await auth.$context;
		const hashedPassword = await authContext.password.hash(input.password);

		await authContext.adapter.create({
			model: "account",
			data: {
				userId: user.id,
				accountId: user.id,
				providerId: "credential",
				password: hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});

		return { user };
	});
