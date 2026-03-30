import { ORPCError } from "@orpc/server";
import { auth } from "@repo/auth";
import { db } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";

export const acceptInvitation = publicProcedure
	.route({
		method: "POST",
		path: "/org-users/accept-invitation",
		tags: ["Organization Users"],
		summary: "Accept an invitation and set password",
	})
	.input(
		z.object({
			token: z.string().trim().max(200),
			password: z.string().min(8).max(200),
			name: z.string().trim().min(1).max(200).optional(),
		}),
	)
	.handler(async ({ input }) => {
		// البحث عن الدعوة بالرمز
		const invitation = await db.userInvitation.findUnique({
			where: { token: input.token },
		});

		if (!invitation) {
			throw new ORPCError("NOT_FOUND", {
				message: "رابط الدعوة غير صالح",
			});
		}

		// التحقق أن الدعوة ما انتهت
		if (invitation.expiresAt < new Date()) {
			await db.userInvitation.update({
				where: { id: invitation.id },
				data: { status: "EXPIRED" },
			});
			throw new ORPCError("BAD_REQUEST", {
				message: "هذه الدعوة منتهية الصلاحية",
			});
		}

		// التحقق أن الدعوة ما قُبلت مسبقاً
		if (invitation.status !== "PENDING") {
			throw new ORPCError("BAD_REQUEST", {
				message: "هذه الدعوة مقبولة مسبقاً أو ملغاة",
			});
		}

		// البحث عن المستخدم بالبريد الإلكتروني
		const user = await db.user.findUnique({
			where: { email: invitation.email },
		});

		if (!user) {
			throw new ORPCError("NOT_FOUND", {
				message: "المستخدم غير موجود",
			});
		}

		// تفعيل المستخدم وتحديث الاسم إذا مُقدّم
		await db.user.update({
			where: { id: user.id },
			data: {
				isActive: true,
				emailVerified: true,
				...(input.name ? { name: input.name } : {}),
			},
		});

		// تعيين كلمة المرور عبر BetterAuth
		const authContext = await auth.$context;
		const hashedPassword = await authContext.password.hash(input.password);

		// Check if account already exists (shouldn't, but be safe)
		const existingAccount = await db.account.findFirst({
			where: { userId: user.id, providerId: "credential" },
		});

		if (existingAccount) {
			await db.account.update({
				where: { id: existingAccount.id },
				data: { password: hashedPassword, updatedAt: new Date() },
			});
		} else {
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
		}

		// علّم الدعوة كمقبولة
		await db.userInvitation.update({
			where: { id: invitation.id },
			data: {
				status: "ACCEPTED",
				acceptedAt: new Date(),
			},
		});

		return { success: true };
	});
