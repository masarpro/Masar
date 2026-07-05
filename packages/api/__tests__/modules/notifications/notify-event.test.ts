/**
 * notifyEvent — dispatcher behavior tests (no DB required)
 *
 * The hard invariants:
 *   1. NEVER throws — even on unknown keys or DB failures
 *   2. actor is always excluded
 *   3. OWNER bypasses the permission gate; empty-permission users are dropped
 *   4. muteAll drops the recipient; eventPrefs override channels
 *   5. EMAIL channel rows are written alongside IN_APP (queue), with
 *      distinct dedupe keys
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyPermissions } from "@repo/database/prisma/permissions";

const {
	mockCreateNotificationRows,
	mockGetOrganizationAdminUserIds,
	mockUserFindMany,
	mockPrefFindMany,
	mockProjectMemberFindMany,
	mockGetCachedUserPermissions,
} = vi.hoisted(() => ({
	mockCreateNotificationRows: vi.fn().mockResolvedValue({ count: 1 }),
	mockGetOrganizationAdminUserIds: vi.fn().mockResolvedValue([]),
	mockUserFindMany: vi.fn().mockResolvedValue([]),
	mockPrefFindMany: vi.fn().mockResolvedValue([]),
	mockProjectMemberFindMany: vi.fn().mockResolvedValue([]),
	mockGetCachedUserPermissions: vi.fn(),
}));

vi.mock("@repo/database", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		createNotificationRows: mockCreateNotificationRows,
		getOrganizationAdminUserIds: mockGetOrganizationAdminUserIds,
		db: {
			user: { findMany: mockUserFindMany },
			notificationPreference: { findMany: mockPrefFindMany },
			projectMember: { findMany: mockProjectMemberFindMany },
		},
	};
});

vi.mock("../../../lib/permissions", () => ({
	getCachedUserPermissions: mockGetCachedUserPermissions,
}));

import { notifyEvent } from "../../../modules/notifications/lib/notify";

const ORG = "org-1";

function fullFinancePerms() {
	const perms = createEmptyPermissions();
	perms.finance.view = true;
	perms.finance.payments = true;
	perms.finance.invoices = true;
	return perms;
}

beforeEach(() => {
	vi.clearAllMocks();
	mockCreateNotificationRows.mockResolvedValue({ count: 1 });
	mockGetOrganizationAdminUserIds.mockResolvedValue([]);
	mockUserFindMany.mockResolvedValue([]);
	mockPrefFindMany.mockResolvedValue([]);
	mockProjectMemberFindMany.mockResolvedValue([]);
	mockGetCachedUserPermissions.mockResolvedValue(createEmptyPermissions());
});

describe("notifyEvent — never-throw invariant", () => {
	it("resolves silently on unknown event key", async () => {
		await expect(
			notifyEvent({ event: "nope.unknown", organizationId: ORG }),
		).resolves.toBeUndefined();
		expect(mockCreateNotificationRows).not.toHaveBeenCalled();
	});

	it("resolves even when the DB write throws", async () => {
		mockCreateNotificationRows.mockRejectedValue(new Error("db down"));
		await expect(
			notifyEvent({
				event: "documents.approvalDecided",
				organizationId: ORG,
				recipients: ["u1"],
			}),
		).resolves.toBeUndefined();
	});

	it("resolves even when audience resolution throws", async () => {
		mockGetOrganizationAdminUserIds.mockRejectedValue(new Error("boom"));
		await expect(
			notifyEvent({
				event: "finance.paymentVoucherSubmitted",
				organizationId: ORG,
				data: { voucherNo: "PMT-1", amount: "10 ر.س" },
			}),
		).resolves.toBeUndefined();
	});
});

describe("notifyEvent — audience & gate", () => {
	it("excludes the actor from explicit recipients", async () => {
		await notifyEvent({
			event: "documents.approvalDecided",
			organizationId: ORG,
			actorId: "actor",
			recipients: ["actor", "u1"],
			data: { documentTitle: "مستند", decision: "تمت الموافقة" },
		});
		expect(mockCreateNotificationRows).toHaveBeenCalledTimes(1);
		const rows = mockCreateNotificationRows.mock.calls[0][0];
		expect(rows.map((r: { userId: string }) => r.userId)).toEqual(["u1"]);
	});

	it("OWNER passes the permission gate even with empty permissions", async () => {
		// audience: org-permission finance.view → user list
		mockUserFindMany.mockImplementation((args: Record<string, any>) => {
			// getOwnerUserIds queries with organizationRole.type = OWNER
			if (args?.where?.organizationRole?.type === "OWNER") {
				return Promise.resolve([{ id: "owner-1" }]);
			}
			return Promise.resolve([
				{
					id: "owner-1",
					organizationRole: { type: "OWNER", organizationId: ORG },
				},
				{
					id: "member-1",
					organizationRole: { type: "CUSTOM", organizationId: ORG },
				},
			]);
		});
		mockGetCachedUserPermissions.mockResolvedValue(createEmptyPermissions());

		await notifyEvent({
			event: "finance.expenseCreated",
			organizationId: ORG,
			actorId: "someone-else",
			entity: { id: "exp-1" },
			data: { amount: "100 ر.س" },
		});

		expect(mockCreateNotificationRows).toHaveBeenCalledTimes(1);
		const rows = mockCreateNotificationRows.mock.calls[0][0];
		const userIds = rows.map((r: { userId: string }) => r.userId);
		expect(userIds).toContain("owner-1");
		expect(userIds).not.toContain("member-1"); // empty perms → dropped
	});

	it("members with the permission pass the gate", async () => {
		mockUserFindMany.mockImplementation((args: Record<string, any>) => {
			if (args?.where?.organizationRole?.type === "OWNER") {
				return Promise.resolve([]);
			}
			return Promise.resolve([
				{
					id: "acct-1",
					organizationRole: { type: "ACCOUNTANT", organizationId: ORG },
				},
			]);
		});
		mockGetCachedUserPermissions.mockResolvedValue(fullFinancePerms());

		await notifyEvent({
			event: "finance.expenseCreated",
			organizationId: ORG,
			entity: { id: "exp-2" },
			data: { amount: "50 ر.س" },
		});

		const rows = mockCreateNotificationRows.mock.calls[0][0];
		expect(rows.map((r: { userId: string }) => r.userId)).toEqual(["acct-1"]);
	});
});

describe("notifyEvent — preferences & channels", () => {
	it("muteAll drops the recipient entirely", async () => {
		mockPrefFindMany.mockResolvedValue([
			{ userId: "u1", muteAll: true, eventPrefs: {} },
		]);
		await notifyEvent({
			event: "documents.approvalDecided",
			organizationId: ORG,
			recipients: ["u1"],
		});
		expect(mockCreateNotificationRows).not.toHaveBeenCalled();
	});

	it("eventPrefs override adds an EMAIL queue row with distinct dedupe key", async () => {
		mockPrefFindMany.mockResolvedValue([
			{
				userId: "u1",
				muteAll: false,
				eventPrefs: { "documents.approvalRequested": ["IN_APP", "EMAIL"] },
			},
		]);
		await notifyEvent({
			event: "documents.approvalRequested",
			organizationId: ORG,
			recipients: ["u1"],
			entity: { id: "doc-1" },
			data: { documentTitle: "مخطط" },
		});
		const rows = mockCreateNotificationRows.mock.calls[0][0];
		expect(rows).toHaveLength(2);
		const channels = rows.map((r: { channel: string }) => r.channel).sort();
		expect(channels).toEqual(["EMAIL", "IN_APP"]);
		const inApp = rows.find((r: { channel: string }) => r.channel === "IN_APP");
		const email = rows.find((r: { channel: string }) => r.channel === "EMAIL");
		expect(inApp.dedupeKey).toBeDefined();
		expect(email.dedupeKey).toBe(`${inApp.dedupeKey}:email`);
	});

	it("wildcard mute silences a whole module", async () => {
		mockPrefFindMany.mockResolvedValue([
			{ userId: "u1", muteAll: false, eventPrefs: { "documents.*": [] } },
		]);
		await notifyEvent({
			event: "documents.approvalDecided",
			organizationId: ORG,
			recipients: ["u1"],
		});
		expect(mockCreateNotificationRows).not.toHaveBeenCalled();
	});

	it("writes stored Arabic content + metadata with event key", async () => {
		await notifyEvent({
			event: "documents.approvalDecided",
			organizationId: ORG,
			recipients: ["u1"],
			projectId: "p1",
			entity: { id: "doc-9" },
			data: { projectName: "فيلا", documentTitle: "مخطط", decision: "تمت الموافقة" },
		});
		const rows = mockCreateNotificationRows.mock.calls[0][0];
		expect(rows[0].type).toBe("documents.approvalDecided");
		expect(rows[0].title).toContain("قرار اعتماد");
		expect(rows[0].projectId).toBe("p1");
		expect(rows[0].metadata.eventKey).toBe("documents.approvalDecided");
		expect(rows[0].metadata.documentTitle).toBe("مخطط");
	});
});
