import "server-only";
import { auth } from "@repo/auth";
import type { ActiveOrganization } from "@repo/auth";
import { db, getInvitationById } from "@repo/database";
import { headers } from "next/headers";
import { cache } from "react";

export const getSession = cache(async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	return session;
});

/**
 * Force a fresh session read that bypasses the signed cookie-cache snapshot.
 *
 * Use this ONLY right after a server action mutates the user record directly
 * (onboarding completion, role/permission change, mustChangePassword) so the
 * next render reflects the change immediately instead of waiting out the
 * cookie-cache TTL. Not React-cached — each call re-validates against the DB.
 */
export const getFreshSession = async () => {
	return auth.api.getSession({
		headers: await headers(),
		query: {
			disableCookieCache: true,
		},
	});
};

/**
 * Lightweight replacement for auth.api.getFullOrganization on the navigation
 * critical path. The full call loaded the org + ALL members (joined to users)
 * + all invitations on every navigation, while layouts/pages only need the
 * org row and the current user's own member row (for client-side role
 * helpers, which do `members.find(m => m.userId === me)`).
 *
 * One indexed query both verifies membership (non-members get null → 404,
 * same as the better-auth behavior) and returns the org. Full member and
 * invitation lists stay on the dedicated `useFullOrganizationQuery` used by
 * the settings pages.
 */
export const getActiveOrganization = cache(
	async (slug: string): Promise<ActiveOrganization | null> => {
		try {
			const session = await getSession();
			if (!session) {
				return null;
			}

			const member = await db.member.findFirst({
				where: {
					userId: session.user.id,
					organization: { slug },
				},
				select: {
					id: true,
					organizationId: true,
					userId: true,
					role: true,
					createdAt: true,
					// Mirror the fields better-auth's getFullOrganization returned —
					// consumers never saw Masar's extra org columns, and the full row
					// contains a Prisma Decimal (lastPaymentAmount) that cannot cross
					// the RSC serialization boundary.
					organization: {
						select: {
							id: true,
							name: true,
							slug: true,
							logo: true,
							createdAt: true,
							metadata: true,
							paymentsCustomerId: true,
						},
					},
					user: {
						select: { id: true, name: true, email: true, image: true },
					},
				},
			});

			if (!member) {
				return null;
			}

			const { organization, user, ...memberRow } = member;

			let metadata: Record<string, unknown> | undefined;
			if (organization.metadata) {
				try {
					metadata = JSON.parse(organization.metadata);
				} catch {
					metadata = undefined;
				}
			}

			return {
				...organization,
				metadata,
				members: [{ ...memberRow, user }],
				invitations: [],
			} as unknown as ActiveOrganization;
		} catch {
			return null;
		}
	},
);

export const getOrganizationList = cache(async () => {
	try {
		const organizationList = await auth.api.listOrganizations({
			headers: await headers(),
		});

		return organizationList;
	} catch {
		return [];
	}
});

export const getUserAccounts = cache(async () => {
	try {
		const userAccounts = await auth.api.listUserAccounts({
			headers: await headers(),
		});

		return userAccounts;
	} catch {
		return [];
	}
});

export const getUserPasskeys = cache(async () => {
	try {
		const userPasskeys = await auth.api.listPasskeys({
			headers: await headers(),
		});

		return userPasskeys;
	} catch {
		return [];
	}
});

export const getInvitation = cache(async (id: string) => {
	try {
		return await getInvitationById(id);
	} catch {
		return null;
	}
});
