/**
 * API test data factories.
 *
 * These create real database records for integration tests.
 * For pure unit tests, use mock-context.ts instead.
 *
 * Requires DATABASE_URL_TEST to be set.
 */

import type { Permissions } from "@repo/database/prisma/permissions";
import { DEFAULT_ROLE_PERMISSIONS } from "@repo/database/prisma/permissions";

// ─── Helpers ─────────────────────────────────────────────────────────────────

let seq = 0;
function nextSeq(): number {
	return ++seq;
}

// Lazy db import — only loaded when factories are actually called
let _db: any = null;
async function getDb() {
	if (!_db) {
		const mod = await import("@repo/database");
		_db = mod.db;
	}
	return _db;
}

// ─── Organization ────────────────────────────────────────────────────────────

export async function createTestOrganization(overrides?: Record<string, unknown>) {
	const db = await getDb();
	const n = nextSeq();
	return db.organization.create({
		data: {
			name: `Test Org ${n}`,
			slug: `test-org-${n}-${Date.now()}`,
			createdAt: new Date(),
			...overrides,
		},
	});
}

// ─── Role ────────────────────────────────────────────────────────────────────

export async function createTestRole(
	orgId: string,
	roleType: keyof typeof DEFAULT_ROLE_PERMISSIONS = "CUSTOM",
	overrides?: Record<string, unknown>,
) {
	const db = await getDb();
	const n = nextSeq();
	return db.role.create({
		data: {
			name: `Test Role ${n}`,
			type: roleType,
			isSystem: roleType !== "CUSTOM",
			permissions: (overrides?.permissions ?? DEFAULT_ROLE_PERMISSIONS[roleType]) as unknown as object,
			organizationId: orgId,
			...overrides,
		},
	});
}

export async function createTestRoleWithPermissions(
	orgId: string,
	permissions: Partial<Permissions>,
	overrides?: Record<string, unknown>,
) {
	const db = await getDb();
	const n = nextSeq();
	return db.role.create({
		data: {
			name: `Custom Role ${n}`,
			type: "CUSTOM",
			isSystem: false,
			permissions: permissions as unknown as object,
			organizationId: orgId,
			...overrides,
		},
	});
}

// ─── User ────────────────────────────────────────────────────────────────────

export async function createTestUser(
	orgId: string,
	roleId?: string | null,
	overrides?: Record<string, unknown>,
) {
	const db = await getDb();
	const n = nextSeq();

	const user = await db.user.create({
		data: {
			name: `Test User ${n}`,
			email: `api-test-${n}-${Date.now()}@masar-test.local`,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			isActive: true,
			accountType: "EMPLOYEE",
			organizationId: orgId,
			organizationRoleId: roleId ?? null,
			...overrides,
		},
	});

	// Create BetterAuth Member row
	await db.member.create({
		data: {
			organizationId: orgId,
			userId: user.id,
			role: overrides?.accountType === "OWNER" ? "owner" : "member",
			createdAt: new Date(),
		},
	});

	return user;
}

// ─── Project ─────────────────────────────────────────────────────────────────

export async function createTestProject(
	orgId: string,
	createdById: string,
	overrides?: Record<string, unknown>,
) {
	const db = await getDb();
	const n = nextSeq();
	return db.project.create({
		data: {
			organizationId: orgId,
			createdById,
			name: `Test Project ${n}`,
			slug: `test-project-${n}-${Date.now()}`,
			status: "ACTIVE",
			...overrides,
		},
	});
}

// ─── Client ──────────────────────────────────────────────────────────────────

export async function createTestClient(
	orgId: string,
	overrides?: Record<string, unknown>,
) {
	const db = await getDb();
	const n = nextSeq();
	return db.client.create({
		data: {
			organizationId: orgId,
			name: `Test Client ${n}`,
			email: `client-${n}@test.local`,
			type: "INDIVIDUAL",
			...overrides,
		},
	});
}

// ─── Employee ────────────────────────────────────────────────────────────────

export async function createTestEmployee(
	orgId: string,
	overrides?: Record<string, unknown>,
) {
	const db = await getDb();
	const n = nextSeq();
	return db.employee.create({
		data: {
			organizationId: orgId,
			name: `Test Employee ${n}`,
			employeeNo: `EMP-API-${String(n).padStart(4, "0")}`,
			type: "LABORER",
			status: "ACTIVE",
			baseSalary: 5000,
			housingAllowance: 1000,
			transportAllowance: 500,
			otherAllowances: 0,
			gosiSubscription: 450,
			joinDate: new Date("2025-01-01"),
			salaryType: "MONTHLY",
			...overrides,
		},
	});
}

// ─── Member (additional membership) ──────────────────────────────────────────

export async function createTestMember(
	orgId: string,
	userId: string,
	roleId?: string,
	overrides?: Record<string, unknown>,
) {
	const db = await getDb();
	// Update user's organizationRoleId if roleId provided
	if (roleId) {
		await db.user.update({
			where: { id: userId },
			data: { organizationRoleId: roleId },
		});
	}
	return db.member.create({
		data: {
			organizationId: orgId,
			userId,
			role: "member",
			createdAt: new Date(),
			...overrides,
		},
	});
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

/**
 * Clean up test data for a list of organizations.
 * Deletes in reverse dependency order.
 */
export async function cleanupTestData(orgIds: string[]) {
	if (orgIds.length === 0) return;
	const db = await getDb();

	// Delete in reverse FK order
	await db.member.deleteMany({ where: { organizationId: { in: orgIds } } });
	await db.project.deleteMany({ where: { organizationId: { in: orgIds } } });
	await db.user.deleteMany({ where: { organizationId: { in: orgIds } } });
	await db.role.deleteMany({ where: { organizationId: { in: orgIds } } });
	await db.organization.deleteMany({ where: { id: { in: orgIds } } });
}
