/**
 * Email queue — drain behavior (no DB, no provider)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	mockGetPending,
	mockMarkSent,
	mockMarkFailed,
	mockUpdateMany,
	mockSendMessage,
	mockIsConfigured,
} = vi.hoisted(() => ({
	mockGetPending: vi.fn().mockResolvedValue([]),
	mockMarkSent: vi.fn().mockResolvedValue({}),
	mockMarkFailed: vi.fn().mockResolvedValue({}),
	mockUpdateMany: vi.fn().mockResolvedValue({ count: 0 }),
	mockSendMessage: vi.fn().mockResolvedValue({ success: true, provider: "resend" }),
	mockIsConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock("@repo/database", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		getPendingEmailNotifications: mockGetPending,
		markEmailSent: mockMarkSent,
		markEmailFailed: mockMarkFailed,
		db: { notification: { updateMany: mockUpdateMany } },
	};
});

vi.mock("../../../lib/messaging/send", () => ({
	isChannelConfigured: mockIsConfigured,
	sendMessage: mockSendMessage,
}));

import { processEmailNotificationQueue } from "../../../modules/notifications/lib/email-queue";

beforeEach(() => {
	vi.clearAllMocks();
	mockGetPending.mockResolvedValue([]);
	mockUpdateMany.mockResolvedValue({ count: 0 });
	mockSendMessage.mockResolvedValue({ success: true, provider: "resend" });
	mockIsConfigured.mockReturnValue(true);
});

describe("processEmailNotificationQueue", () => {
	it("skips sending when no email provider is configured (still sweeps stale)", async () => {
		mockIsConfigured.mockReturnValue(false);
		mockUpdateMany.mockResolvedValue({ count: 4 });

		const result = await processEmailNotificationQueue();

		expect(result.emailConfigured).toBe(false);
		expect(result.sweptStale).toBe(4);
		expect(mockGetPending).not.toHaveBeenCalled();
		expect(mockSendMessage).not.toHaveBeenCalled();
	});

	it("sends pending rows and marks SENT / FAILED accordingly", async () => {
		mockGetPending.mockResolvedValue([
			{ id: "n1", title: "إشعار 1", body: "نص", user: { email: "a@x.com" } },
			{ id: "n2", title: "إشعار 2", body: null, user: { email: "b@x.com" } },
			{ id: "n3", title: "إشعار 3", body: null, user: { email: null } },
		]);
		mockSendMessage
			.mockResolvedValueOnce({ success: true, provider: "resend" })
			.mockResolvedValueOnce({ success: false, provider: "resend", error: "bounce" });

		const result = await processEmailNotificationQueue(10);

		expect(result.processed).toBe(3);
		expect(result.sent).toBe(1);
		expect(result.failed).toBe(2); // provider failure + missing email
		expect(mockMarkSent).toHaveBeenCalledWith("n1");
		expect(mockMarkFailed).toHaveBeenCalledWith("n2", "bounce");
		expect(mockMarkFailed).toHaveBeenCalledWith(
			"n3",
			"recipient has no email address",
		);
	});

	it("sweeps stale PENDING rows older than 24h to FAILED", async () => {
		mockUpdateMany.mockResolvedValue({ count: 2 });
		const result = await processEmailNotificationQueue();
		expect(mockUpdateMany).toHaveBeenCalledTimes(1);
		const arg = mockUpdateMany.mock.calls[0][0];
		expect(arg.where.channel).toBe("EMAIL");
		expect(arg.where.deliveryStatus).toBe("PENDING");
		expect(arg.data.deliveryStatus).toBe("FAILED");
		expect(result.sweptStale).toBe(2);
	});
});
