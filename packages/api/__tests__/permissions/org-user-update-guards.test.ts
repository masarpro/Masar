/**
 * Org-user update guards (RBAC-UI Stage 6)
 *
 * 1. Self-edit prevention — a member can never change their own role,
 *    permissions or active state through orgUsers.update.
 * 2. Last-owner protection — the last active OWNER cannot be demoted or
 *    deactivated, and OWNER-role permissions cannot be customized.
 *
 * Uses mocked @repo/database — no real DB connections.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORPCError } from "@orpc/server";

vi.mock("@repo/database", () => ({
	getOrgUserById: vi.fn(),
	countActiveOrganizationOwners: vi.fn(),
}));

import {
	countActiveOrganizationOwners,
	getOrgUserById,
} from "@repo/database";
import { assertOrgUserUpdateAllowed } from "../../modules/org-users/lib/update-guards";

const mockGetOrgUserById = getOrgUserById as unknown as ReturnType<
	typeof vi.fn
>;
const mockCountOwners = countActiveOrganizationOwners as unknown as ReturnType<
	typeof vi.fn
>;

function mockTargetUser(overrides?: {
	roleType?: string | null;
	accountType?: string;
	organizationRoleId?: string | null;
}) {
	mockGetOrgUserById.mockResolvedValue({
		id: "target-1",
		accountType: overrides?.accountType ?? "EMPLOYEE",
		organizationRoleId: overrides?.organizationRoleId ?? "role-1",
		organizationRole: {
			id: overrides?.organizationRoleId ?? "role-1",
			type: overrides?.roleType ?? "ENGINEER",
		},
	});
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("guard 1: self-edit prevention", () => {
	it("rejects when actor targets themselves", async () => {
		await expect(
			assertOrgUserUpdateAllowed({
				targetUserId: "user-1",
				organizationId: "org-1",
				actorUserId: "user-1",
				customPermissions: { finance: { view: true } },
			}),
		).rejects.toThrowError(ORPCError);
		// The DB is never consulted — rejected before any read
		expect(mockGetOrgUserById).not.toHaveBeenCalled();
	});

	it("allows editing a different member", async () => {
		mockTargetUser({ roleType: "SUPERVISOR" });
		await expect(
			assertOrgUserUpdateAllowed({
				targetUserId: "target-1",
				organizationId: "org-1",
				actorUserId: "actor-1",
				customPermissions: { finance: { view: true } },
			}),
		).resolves.toBeUndefined();
	});
});

describe("guard 2: last-owner protection", () => {
	it("rejects demoting the last active owner", async () => {
		mockTargetUser({ roleType: "OWNER", organizationRoleId: "owner-role" });
		mockCountOwners.mockResolvedValue(1);

		await expect(
			assertOrgUserUpdateAllowed({
				targetUserId: "target-1",
				organizationId: "org-1",
				actorUserId: "actor-1",
				organizationRoleId: "engineer-role",
			}),
		).rejects.toThrowError("لا يمكن تنزيل أو تعطيل آخر مالك في المنشأة");
	});

	it("rejects deactivating the last active owner", async () => {
		mockTargetUser({ roleType: "OWNER", organizationRoleId: "owner-role" });
		mockCountOwners.mockResolvedValue(1);

		await expect(
			assertOrgUserUpdateAllowed({
				targetUserId: "target-1",
				organizationId: "org-1",
				actorUserId: "actor-1",
				isActive: false,
			}),
		).rejects.toThrowError("لا يمكن تنزيل أو تعطيل آخر مالك في المنشأة");
	});

	it("allows demoting an owner when another active owner exists", async () => {
		mockTargetUser({ roleType: "OWNER", organizationRoleId: "owner-role" });
		mockCountOwners.mockResolvedValue(2);

		await expect(
			assertOrgUserUpdateAllowed({
				targetUserId: "target-1",
				organizationId: "org-1",
				actorUserId: "actor-1",
				organizationRoleId: "engineer-role",
			}),
		).resolves.toBeUndefined();
	});

	it("rejects customizing an OWNER-role member's permissions", async () => {
		mockTargetUser({ roleType: "OWNER", organizationRoleId: "owner-role" });

		await expect(
			assertOrgUserUpdateAllowed({
				targetUserId: "target-1",
				organizationId: "org-1",
				actorUserId: "actor-1",
				customPermissions: { settings: { users: false } },
			}),
		).rejects.toThrowError("لا يمكن تخصيص صلاحيات دور المالك");
	});

	it("keeping the same owner role is not a demotion", async () => {
		mockTargetUser({ roleType: "OWNER", organizationRoleId: "owner-role" });
		mockCountOwners.mockResolvedValue(1);

		await expect(
			assertOrgUserUpdateAllowed({
				targetUserId: "target-1",
				organizationId: "org-1",
				actorUserId: "actor-1",
				organizationRoleId: "owner-role",
			}),
		).resolves.toBeUndefined();
		expect(mockCountOwners).not.toHaveBeenCalled();
	});

	it("rejects when the target user does not exist in the organization", async () => {
		mockGetOrgUserById.mockResolvedValue(null);

		await expect(
			assertOrgUserUpdateAllowed({
				targetUserId: "ghost",
				organizationId: "org-1",
				actorUserId: "actor-1",
			}),
		).rejects.toThrowError("المستخدم غير موجود");
	});

	it("non-owner members are not affected by owner guards", async () => {
		mockTargetUser({ roleType: "ACCOUNTANT" });

		await expect(
			assertOrgUserUpdateAllowed({
				targetUserId: "target-1",
				organizationId: "org-1",
				actorUserId: "actor-1",
				organizationRoleId: "another-role",
				isActive: false,
				customPermissions: { finance: { view: false } },
			}),
		).resolves.toBeUndefined();
		expect(mockCountOwners).not.toHaveBeenCalled();
	});
});
