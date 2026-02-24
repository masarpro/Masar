/**
 * Data Migration Script: Assign organizationRoleId to all users
 *
 * This script ensures every user with a Member record has a proper
 * organizationRoleId assigned based on their Member.role value.
 *
 * Run with: pnpm tsx packages/database/prisma/scripts/migrate-member-roles.ts
 */

import { db } from "../client";
import { createDefaultRolesInTx } from "../queries/roles";

async function migrate() {
	console.log("🔄 Starting role migration...\n");

	// Get all organizations
	const organizations = await db.organization.findMany({
		select: { id: true, name: true },
	});

	console.log(`Found ${organizations.length} organization(s)\n`);

	let totalMigrated = 0;
	let totalSkipped = 0;
	let totalErrors = 0;

	for (const org of organizations) {
		console.log(`--- Organization: ${org.name} (${org.id}) ---`);

		// Step 1: Ensure default roles exist (including OWNER)
		const roles = await createDefaultRolesInTx(db, org.id);
		const roleMap = new Map(roles.map((r) => [r.type, r.id]));
		console.log(`  Roles ensured: ${roles.map((r) => r.type).join(", ")}`);

		// Step 2: Get members without organizationRoleId
		const members = await db.member.findMany({
			where: { organizationId: org.id },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						organizationRoleId: true,
					},
				},
			},
		});

		for (const member of members) {
			if (member.user.organizationRoleId) {
				totalSkipped++;
				continue;
			}

			// Map Member.role to RoleType
			const memberRole = member.role.toUpperCase();
			let targetRoleType: string;

			if (memberRole === "OWNER" || memberRole === "ADMIN") {
				targetRoleType = "OWNER";
			} else {
				targetRoleType = "ENGINEER"; // Default for "member" and unknown
			}

			const roleId = roleMap.get(targetRoleType);
			if (!roleId) {
				console.error(
					`  ❌ No ${targetRoleType} role for user ${member.user.name} (${member.user.id})`,
				);
				totalErrors++;
				continue;
			}

			try {
				await db.user.update({
					where: { id: member.user.id },
					data: {
						organizationRoleId: roleId,
						organizationId: org.id,
						accountType:
							memberRole === "OWNER" || memberRole === "ADMIN"
								? "OWNER"
								: "EMPLOYEE",
					},
				});
				console.log(
					`  ✅ ${member.user.name}: ${member.role} → ${targetRoleType}`,
				);
				totalMigrated++;
			} catch (e) {
				console.error(
					`  ❌ Failed for ${member.user.name}: ${e instanceof Error ? e.message : e}`,
				);
				totalErrors++;
			}
		}
	}

	console.log("\n═══════════════════════════════════════");
	console.log(`Migration complete:`);
	console.log(`  Migrated: ${totalMigrated}`);
	console.log(`  Skipped (already assigned): ${totalSkipped}`);
	console.log(`  Errors: ${totalErrors}`);

	// Verification
	const usersWithoutRole = await db.$queryRaw<{ count: bigint }[]>`
		SELECT COUNT(*) as count FROM "user" u
		INNER JOIN member m ON m."userId" = u.id
		WHERE u."organizationRoleId" IS NULL
	`;
	const count = Number(usersWithoutRole[0]?.count ?? 0);
	if (count > 0) {
		console.log(`\n⚠️ WARNING: ${count} user(s) still without organizationRoleId`);
	} else {
		console.log(`\n✅ All users with memberships have organizationRoleId assigned`);
	}
}

migrate()
	.catch((e) => {
		console.error("Migration failed:", e);
		process.exit(1);
	})
	.finally(() => {
		db.$disconnect();
	});
