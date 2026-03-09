/**
 * Mock context builders for oRPC procedure tests.
 *
 * These simulate the context objects that oRPC procedures inject,
 * allowing handler functions to be called directly without HTTP.
 */

import type { Permissions } from "@repo/database/prisma/permissions";
import { DEFAULT_ROLE_PERMISSIONS, createEmptyPermissions } from "@repo/database/prisma/permissions";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MockUser {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	isActive: boolean;
	role: "admin" | "member";
	organizationId: string | null;
	accountType: string;
	image?: string | null;
	createdAt: Date;
	updatedAt: Date;
	[key: string]: unknown;
}

export interface MockSession {
	id: string;
	userId: string;
	expiresAt: Date;
	token: string;
	createdAt: Date;
	updatedAt: Date;
	[key: string]: unknown;
}

export interface ProtectedContext {
	session: MockSession;
	user: MockUser;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

let contextSeq = 0;

function nextId(): string {
	return `mock-${++contextSeq}-${Date.now()}`;
}

function defaultUser(overrides?: Partial<MockUser>): MockUser {
	const id = overrides?.id ?? nextId();
	return {
		id,
		name: "Test User",
		email: `test-${id}@masar-test.local`,
		emailVerified: true,
		isActive: true,
		role: "member",
		organizationId: overrides?.organizationId ?? nextId(),
		accountType: "EMPLOYEE",
		image: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

function defaultSession(userId: string, overrides?: Partial<MockSession>): MockSession {
	return {
		id: nextId(),
		userId,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
		token: `tok_${nextId()}`,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

// ─── Public Builders ─────────────────────────────────────────────────────────

/**
 * Build a mock context matching protectedProcedure's output.
 */
export function mockProtectedContext(overrides?: {
	user?: Partial<MockUser>;
	session?: Partial<MockSession>;
}): ProtectedContext {
	const user = defaultUser(overrides?.user);
	const session = defaultSession(user.id, overrides?.session);
	return { session, user };
}

/**
 * Build a mock context matching subscriptionProcedure's output.
 * Same shape as protectedContext (subscription check happens in middleware).
 */
export function mockSubscriptionContext(overrides?: {
	user?: Partial<MockUser>;
	session?: Partial<MockSession>;
}): ProtectedContext {
	return mockProtectedContext(overrides);
}

/**
 * Build a mock context matching adminProcedure's output.
 */
export function mockAdminContext(overrides?: {
	user?: Partial<MockUser>;
	session?: Partial<MockSession>;
}): ProtectedContext {
	return mockProtectedContext({
		user: { role: "admin", accountType: "ADMIN", ...overrides?.user },
		session: overrides?.session,
	});
}

/**
 * Build a context for a user with a specific role's permissions.
 */
export function mockContextWithRole(
	roleType: keyof typeof DEFAULT_ROLE_PERMISSIONS,
	overrides?: {
		user?: Partial<MockUser>;
		session?: Partial<MockSession>;
	},
): ProtectedContext & { permissions: Permissions } {
	const ctx = mockProtectedContext(overrides);
	return {
		...ctx,
		permissions: { ...DEFAULT_ROLE_PERMISSIONS[roleType] },
	};
}

/**
 * Build a context for a user with custom permissions.
 */
export function mockContextWithPermissions(
	permissions: Partial<Permissions>,
	overrides?: {
		user?: Partial<MockUser>;
		session?: Partial<MockSession>;
	},
): ProtectedContext & { permissions: Permissions } {
	const ctx = mockProtectedContext(overrides);
	const base = createEmptyPermissions();
	const merged = { ...base };

	for (const section of Object.keys(permissions) as (keyof Permissions)[]) {
		if (permissions[section]) {
			merged[section] = {
				...base[section],
				...permissions[section],
			} as any;
		}
	}

	return {
		...ctx,
		permissions: merged,
	};
}

/**
 * Build a mock owner portal context (token-based access, no session).
 */
export function mockOwnerPortalContext(overrides?: {
	token?: string;
	projectId?: string;
	organizationId?: string;
}): {
	token: string;
	projectId: string;
	organizationId: string;
} {
	return {
		token: overrides?.token ?? `portal_${nextId()}`,
		projectId: overrides?.projectId ?? nextId(),
		organizationId: overrides?.organizationId ?? nextId(),
	};
}
