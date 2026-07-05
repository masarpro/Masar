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
import {
	ALL_PROJECTS_ROLE_TYPES,
	invalidateAccessCache,
	verifyOrganizationAccess,
} from "../../../lib/permissions";
import { enforceFeatureAccess } from "../../../lib/feature-gate";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { notifyEvent } from "../../notifications/lib/notify";
import type { ProjectRole } from "@repo/database/prisma/generated/client";

/** Map an organization role type to the initial ProjectMember role. */
function mapOrgRoleTypeToProjectRole(roleType?: string | null): ProjectRole {
	switch (roleType) {
		case "PROJECT_MANAGER":
			return "MANAGER";
		case "ENGINEER":
			return "ENGINEER";
		case "SUPERVISOR":
			return "SUPERVISOR";
		case "ACCOUNTANT":
			return "ACCOUNTANT";
		default:
			return "VIEWER";
	}
}

export const createOrgUser = subscriptionProcedure
	.route({
		method: "POST",
		path: "/org-users",
		tags: ["Organization Users"],
		summary: "Create organization user",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			name: z.string().trim().min(1).max(200),
			email: z.string().trim().email().max(254),
			organizationRoleId: z.string().trim().max(100),
			password: z.string().min(8).max(200).optional(),
			// نطاق رؤية المشاريع. عند true يرى كل المشاريع؛ غير ذلك يُقيَّد بـ projectIds.
			// الأدوار الإدارية ترى الكل بصرف النظر عن هذه القيمة.
			allProjectsAccess: z.boolean().optional().default(false),
			projectIds: z.array(z.string().trim().max(100)).max(500).optional().default([]),
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

		// Get organization and role (name + type) for the email and project-role mapping
		const [organization, role] = await Promise.all([
			db.organization.findUnique({
				where: { id: input.organizationId },
				select: { name: true },
			}),
			db.role.findUnique({
				where: { id: input.organizationRoleId },
				select: { name: true, type: true },
			}),
		]);

		// Managerial roles always see every project — the explicit grant/assignment
		// is only meaningful for project-scoped roles.
		const isManagerialRole =
			!!role?.type &&
			(ALL_PROJECTS_ROLE_TYPES as readonly string[]).includes(role.type);
		const allProjectsAccess = isManagerialRole || input.allProjectsAccess;

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
			allProjectsAccess,
		});

		// Create the BetterAuth Member link at creation time so the user belongs
		// to the organization from the start. listOrganizations()/
		// getFullOrganization()/verifyOrganizationMembership() all read the Member
		// table; without this the invitee logs in with "no organization" and gets
		// routed to create a brand-new org in their own name. accept-invitation
		// upserts this too — idempotent via the unique (organizationId, userId).
		await db.member.upsert({
			where: {
				organizationId_userId: {
					organizationId: input.organizationId,
					userId: user.id,
				},
			},
			update: {},
			create: {
				organizationId: input.organizationId,
				userId: user.id,
				role: "member",
				createdAt: new Date(),
			},
		});

		// Assign the member to specific projects when not all-access. Validate the
		// projects belong to this org before linking (cross-tenant safety).
		if (!allProjectsAccess && input.projectIds.length > 0) {
			const validProjects = await db.project.findMany({
				where: { id: { in: input.projectIds }, organizationId: input.organizationId },
				select: { id: true },
			});
			if (validProjects.length > 0) {
				const projectRole = mapOrgRoleTypeToProjectRole(role?.type);
				await db.projectMember.createMany({
					data: validProjects.map((p) => ({
						projectId: p.id,
						userId: user.id,
						role: projectRole,
						assignedById: context.user.id,
					})),
					skipDuplicates: true,
				});
			}
		}

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

		// Drop any cached deny result for this fresh user key.
		invalidateAccessCache(input.organizationId, user.id);

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

		await notifyEvent({
			event: "org.userAdded",
			organizationId: input.organizationId,
			actorId: context.user.id,
			entity: { type: "user", id: user.id },
			data: { userName: input.name, roleName: role?.name },
		});

		return { user };
	});
