// Backfill for the org-users onboarding flow.
//
// The org-users invitation flow historically created a `User` (with
// organizationId) but never a BetterAuth `Member` record. Without a Member,
// listOrganizations()/getFullOrganization()/verifyOrganizationMembership()
// treat the user as having no organization — so on login they were routed to
// "create organization" and a brand-new org was spawned in their name.
//
// This script:
//   1. Creates the missing Member record for every user that has an
//      organizationId but no matching Member row (idempotent).
//   2. Clears a stale mustChangePassword flag for already-active employees who
//      already set their password when accepting the invitation.

import { db } from "../prisma/client";

async function main() {
	// 1) Missing BetterAuth Member records
	const usersWithOrg = await db.user.findMany({
		where: { organizationId: { not: null } },
		select: { id: true, organizationId: true },
	});

	let membersCreated = 0;
	for (const u of usersWithOrg) {
		if (!u.organizationId) continue;
		const existing = await db.member.findUnique({
			where: {
				organizationId_userId: {
					organizationId: u.organizationId,
					userId: u.id,
				},
			},
			select: { id: true },
		});
		if (!existing) {
			await db.member.create({
				data: {
					organizationId: u.organizationId,
					userId: u.id,
					role: "member",
					createdAt: new Date(),
				},
			});
			membersCreated++;
		}
	}

	// 2) Stale mustChangePassword on already-accepted employees
	const cleared = await db.user.updateMany({
		where: {
			mustChangePassword: true,
			isActive: true,
			accountType: "EMPLOYEE",
		},
		data: { mustChangePassword: false },
	});

	console.log(`Members created: ${membersCreated}`);
	console.log(`mustChangePassword cleared: ${cleared.count}`);
}

main()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
