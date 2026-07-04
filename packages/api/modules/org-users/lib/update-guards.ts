import { ORPCError } from "@orpc/server";
import { countActiveOrganizationOwners, getOrgUserById } from "@repo/database";

export interface OrgUserUpdateGuardInput {
	targetUserId: string;
	organizationId: string;
	actorUserId: string;
	organizationRoleId?: string;
	isActive?: boolean;
	customPermissions?: Record<string, Record<string, boolean>>;
}

/**
 * حارسا تحديث المستخدمين (RBAC-UI Stage 6):
 * 1. منع تعديل الذات — يقطع طريق رفع الصلاحيات الذاتية.
 * 2. حماية آخر مالك فعّال من التنزيل أو التعطيل، ومنع تخصيص
 *    صلاحيات دور المالك (قد يقفل المنشأة بالكامل).
 *
 * يُستدعى بعد verifyOrganizationAccess وقبل الكتابة.
 * @throws ORPCError عند مخالفة أي حارس
 */
export async function assertOrgUserUpdateAllowed(
	input: OrgUserUpdateGuardInput,
): Promise<void> {
	// حارس 1: لا يعدّل العضو نفسه
	if (input.targetUserId === input.actorUserId) {
		throw new ORPCError("FORBIDDEN", {
			message: "لا يمكنك تعديل صلاحياتك أو بياناتك من هذه الشاشة",
		});
	}

	// حارس 2: حماية آخر مالك
	const targetUser = await getOrgUserById(
		input.targetUserId,
		input.organizationId,
	);
	if (!targetUser) {
		throw new ORPCError("NOT_FOUND", {
			message: "المستخدم غير موجود",
		});
	}

	const targetIsOwner =
		targetUser.organizationRole?.type === "OWNER" ||
		targetUser.accountType === "OWNER";

	if (!targetIsOwner) {
		return;
	}

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
