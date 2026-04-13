import { ORPCError } from "@orpc/server";
import { getUserRoleType } from "../../../lib/permissions/get-user-permissions";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export type PartnerAccessLevel = "full" | "limited" | "none";

/**
 * Resolve the current user's access level to the Partners finance section.
 *
 * full    — OWNER role type. Sees profits, reports, comparisons, net balances.
 * limited — ACCOUNTANT role type. Sees drawings and capital contributions only.
 * none    — Every other role (PROJECT_MANAGER, ENGINEER, SUPERVISOR, CUSTOM, …).
 */
export async function resolvePartnerAccessLevel(
	organizationId: string,
	userId: string,
): Promise<PartnerAccessLevel> {
	const membership = await verifyOrganizationMembership(
		organizationId,
		userId,
	);
	if (!membership) return "none";

	const roleType = await getUserRoleType(userId, organizationId);
	if (roleType === "OWNER") return "full";
	if (roleType === "ACCOUNTANT") return "limited";
	return "none";
}

/**
 * Throw ORPCError("FORBIDDEN") if the caller does not meet the required
 * partner access level. "limited" required allows both "full" and "limited".
 */
export async function verifyPartnerAccess(
	organizationId: string,
	userId: string,
	required: "full" | "limited" = "limited",
): Promise<PartnerAccessLevel> {
	const level = await resolvePartnerAccessLevel(organizationId, userId);

	if (level === "none") {
		throw new ORPCError("FORBIDDEN", {
			message: "ليس لديك صلاحية الوصول لبيانات الشركاء",
		});
	}

	if (required === "full" && level !== "full") {
		throw new ORPCError("FORBIDDEN", {
			message: "هذا القسم متاح لمالكي المنشأة فقط",
		});
	}

	return level;
}
