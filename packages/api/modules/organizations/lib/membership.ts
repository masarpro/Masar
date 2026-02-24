import { getOrganizationMembership } from "@repo/database";

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
		/** @deprecated Use permissions from getUserPermissions() instead. This is kept only for Better Auth compatibility. */
		role: membership.role,
	};
}
