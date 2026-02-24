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
