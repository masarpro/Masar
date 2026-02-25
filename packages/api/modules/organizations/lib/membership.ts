import { getOrganizationMembership } from "@repo/database";

/**
 * Verify that a user is a Member of an organization (Better Auth Member table).
 *
 * This checks MEMBERSHIP only (does the user belong to this org?), NOT
 * authorization. All authorization decisions must go through:
 *   getUserPermissions(userId, organizationId) → Role.permissions
 *
 * Architecture decision (Sprint 1.2):
 * - Member.role is FROZEN — required by BetterAuth internally, but never used
 *   for Masar authorization. Do not add logic that branches on this value.
 * - Authorization source of truth: User.organizationRoleId → Role.permissions
 * - User.organizationId is the user's primary org. Sprint 1.1 guard in
 *   getUserPermissions prevents cross-tenant privilege escalation.
 */
export async function verifyOrganizationMembership(
	organizationId: string,
	userId: string,
) {
	const membership = await getOrganizationMembership(organizationId, userId);

	if (!membership) {
		return null;
	}

	return {
		organization: membership.organization,
		/** @deprecated DO NOT use for authorization. BetterAuth Member.role is frozen. */
		role: membership.role,
	};
}
