import "server-only";
import { config } from "@repo/config";
import {
	createDefaultRoles,
	createDefaultTemplatesForOrganization,
	createOrganizationForUser,
	getUserOrganizationsCount,
} from "@repo/database";
import { auth, type Session } from "@repo/auth";
import { headers } from "next/headers";

/**
 * Automatically create an organization for a user if:
 * 1. The autoCreateOnSignup feature is enabled
 * 2. The user doesn't have any organizations
 *
 * @param session - The user's session
 * @returns The created organization or null
 */
export async function autoCreateOrganizationIfNeeded(session: Session) {
	// Check if auto-creation is enabled
	if (!config.organizations.autoCreateOnSignup) {
		return null;
	}

	// Check if user already has organizations
	const orgCount = await getUserOrganizationsCount(session.user.id);
	if (orgCount > 0) {
		return null;
	}

	try {
		// Create the organization name
		const userName = session.user.name || session.user.email?.split("@")[0];
		const organizationName = userName ? `منشأة ${userName}` : "منشأتي";

		// Create the organization with membership
		const organization = await createOrganizationForUser({
			userId: session.user.id,
			userName: userName || "",
			organizationName,
		});

		// Create default roles for the organization
		await createDefaultRoles(organization.id);

		// Create default finance templates for the organization
		await createDefaultTemplatesForOrganization(organization.id, session.user.id);

		// Set the organization as active
		await auth.api.setActiveOrganization({
			headers: await headers(),
			body: {
				organizationId: organization.id,
			},
		});

		return organization;
	} catch (error) {
		console.error("Failed to auto-create organization:", error);
		return null;
	}
}
