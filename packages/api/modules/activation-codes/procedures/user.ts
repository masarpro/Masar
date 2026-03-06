import { ORPCError } from "@orpc/client";
import { db } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { codeInput } from "../schema";

export const validate = protectedProcedure
	.route({
		method: "POST",
		path: "/activation-codes/validate",
		tags: ["Activation Codes"],
		summary: "Validate an activation code without activating",
	})
	.input(codeInput)
	.handler(async ({ input }) => {
		const code = await db.activationCode.findUnique({
			where: { code: input.code },
		});

		if (!code) {
			throw new ORPCError("NOT_FOUND", {
				message: "الكود غير صحيح",
			});
		}

		if (!code.isActive) {
			throw new ORPCError("BAD_REQUEST", {
				message: "هذا الكود معطّل",
			});
		}

		if (code.expiresAt && new Date() > code.expiresAt) {
			throw new ORPCError("BAD_REQUEST", {
				message: "انتهت صلاحية هذا الكود",
			});
		}

		if (code.usedCount >= code.maxUses) {
			throw new ORPCError("BAD_REQUEST", {
				message: "تم استخدام هذا الكود بالكامل",
			});
		}

		return {
			valid: true,
			planType: code.planType,
			durationDays: code.durationDays,
			maxUsers: code.maxUsers,
			maxProjects: code.maxProjects,
			maxStorageGB: code.maxStorageGB,
			expiresAt: code.expiresAt?.toISOString() ?? null,
		};
	});

export const activate = protectedProcedure
	.route({
		method: "POST",
		path: "/activation-codes/activate",
		tags: ["Activation Codes"],
		summary: "Activate a code on the current organization",
	})
	.input(codeInput)
	.handler(async ({ input, context }) => {
		let orgId = context.session.activeOrganizationId;

		// Fallback: find the organization owned by this user
		if (!orgId) {
			const ownedOrg = await db.organization.findFirst({
				where: { ownerId: context.user.id },
				select: { id: true },
			});
			if (ownedOrg) {
				orgId = ownedOrg.id;
			}
		}

		if (!orgId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "لم يتم العثور على منظمة مرتبطة بحسابك",
			});
		}

		// Verify user is OWNER of this organization
		const org = await db.organization.findUnique({
			where: { id: orgId },
			select: {
				id: true,
				ownerId: true,
				plan: true,
				subscriptionStatus: true,
				slug: true,
			},
		});

		if (!org) {
			throw new ORPCError("NOT_FOUND", {
				message: "المنظمة غير موجودة",
			});
		}

		if (org.ownerId !== context.user.id) {
			throw new ORPCError("FORBIDDEN", {
				message: "فقط مالك المنظمة يمكنه تفعيل الكود",
			});
		}

		// Don't allow if org already has active PRO
		if (
			org.plan === "PRO" &&
			org.subscriptionStatus === "ACTIVE"
		) {
			throw new ORPCError("BAD_REQUEST", {
				message: "المنظمة لديها بالفعل اشتراك PRO نشط",
			});
		}

		// Use a transaction to prevent race conditions
		const result = await db.$transaction(async (tx) => {
			const code = await tx.activationCode.findUnique({
				where: { code: input.code },
			});

			if (!code) {
				throw new ORPCError("NOT_FOUND", {
					message: "الكود غير صحيح",
				});
			}

			if (!code.isActive) {
				throw new ORPCError("BAD_REQUEST", {
					message: "هذا الكود معطّل",
				});
			}

			if (code.expiresAt && new Date() > code.expiresAt) {
				throw new ORPCError("BAD_REQUEST", {
					message: "انتهت صلاحية هذا الكود",
				});
			}

			if (code.usedCount >= code.maxUses) {
				throw new ORPCError("BAD_REQUEST", {
					message: "تم استخدام هذا الكود بالكامل",
				});
			}

			// Check if this org already used this code
			const existingUsage = await tx.activationCodeUsage.findFirst({
				where: { codeId: code.id, organizationId: orgId },
			});

			if (existingUsage) {
				throw new ORPCError("BAD_REQUEST", {
					message: "تم استخدام هذا الكود على هذه المنظمة مسبقاً",
				});
			}

			const now = new Date();
			const planExpiresAt = new Date(now);
			planExpiresAt.setDate(planExpiresAt.getDate() + code.durationDays);

			// Update organization
			await tx.organization.update({
				where: { id: orgId },
				data: {
					plan: "PRO",
					status: "ACTIVE",
					subscriptionStatus: "ACTIVE",
					currentPeriodStart: now,
					currentPeriodEnd: planExpiresAt,
					maxUsers: code.maxUsers,
					maxProjects: code.maxProjects,
					maxStorage: code.maxStorageGB,
					planName: "PRO (Activation Code)",
				},
			});

			// Increment usedCount
			await tx.activationCode.update({
				where: { id: code.id },
				data: { usedCount: { increment: 1 } },
			});

			// Record usage
			await tx.activationCodeUsage.create({
				data: {
					codeId: code.id,
					organizationId: orgId,
					activatedById: context.user.id,
					planExpiresAt,
				},
			});

			return { planExpiresAt, slug: org.slug };
		});

		return {
			success: true,
			planExpiresAt: result.planExpiresAt.toISOString(),
			orgSlug: result.slug,
		};
	});
