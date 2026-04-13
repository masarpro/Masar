import type { ActiveOrganization } from "../auth";

/**
 * @deprecated This function reads Better Auth's Member.role which is NOT the authoritative
 * permission source. It is kept for UI convenience only (e.g. showing/hiding settings links).
 * All actual authorization is done server-side via the Role model + getUserPermissions().
 *
 * In the future, replace with a client-side permission check using the user's effective permissions.
 */
export function isOrganizationAdmin(
	organization?: ActiveOrganization | null,
	user?: {
		id: string;
		role?: string | null;
	} | null,
) {
	const userOrganizationRole = organization?.members.find(
		(member) => member.userId === user?.id,
	)?.role;

	return (
		["owner", "admin"].includes(userOrganizationRole ?? "") ||
		user?.role === "admin"
	);
}

export function isOrganizationAccountant(
	organization?: ActiveOrganization | null,
	user?: {
		id: string;
		role?: string | null;
	} | null,
) {
	const userOrganizationRole = organization?.members.find(
		(member) => member.userId === user?.id,
	)?.role as string | undefined;

	// Better Auth's built-in roles are owner/admin/member, but Masar extends
	// with custom role types (e.g. "accountant") via the Role model. When a
	// user's Better Auth member role is the custom "accountant" string, treat
	// them as an accountant for UI purposes. Server-side authorization still
	// uses user.organizationRole.type (OWNER/ACCOUNTANT/...) as source of truth.
	return userOrganizationRole === "accountant";
}

export type PartnerAccessLevel = "full" | "limited" | "none";

export function getPartnerAccessLevel(
	organization?: ActiveOrganization | null,
	user?: {
		id: string;
		role?: string | null;
	} | null,
): PartnerAccessLevel {
	if (isOrganizationAdmin(organization, user)) {
		return "full";
	}
	if (isOrganizationAccountant(organization, user)) {
		return "limited";
	}
	return "none";
}
