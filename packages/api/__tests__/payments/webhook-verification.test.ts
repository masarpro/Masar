/**
 * Payments Webhook Verification Tests
 *
 * يثبّت سلوك التحقق من webhook بوابة الدفع (Stripe):
 * - غياب STRIPE_WEBHOOK_SECRET في البيئة = رفض كل الطلبات (fail-closed) دون أي معالجة
 * - توقيع غائب أو خاطئ = 401 دون أي معالجة
 * - توقيع صحيح = يمر إلى المعالجة
 *
 * لا يتطلب اتصالاً بـStripe — التوقيع يُنشأ محلياً بنفس مخطط Stripe v1
 * (HMAC-SHA256 على "{timestamp}.{payload}").
 */

import crypto from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique } = vi.hoisted(() => ({
	mockFindUnique: vi.fn(),
}));

vi.mock("@repo/database", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		db: {
			subscriptionEvent: { findUnique: mockFindUnique },
		},
	};
});

import { webhookHandler } from "@repo/payments";

const WEBHOOK_SECRET = "whsec_test_secret_for_unit_tests";

const ORIGINAL_ENV = {
	STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
	STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
};

function stripeSignature(payload: string, secret: string, timestamp?: number) {
	const t = timestamp ?? Math.floor(Date.now() / 1000);
	const signed = crypto
		.createHmac("sha256", secret)
		.update(`${t}.${payload}`)
		.digest("hex");
	return `t=${t},v1=${signed}`;
}

function makeEventPayload() {
	return JSON.stringify({
		id: "evt_test_0001",
		object: "event",
		type: "some.unhandled.event",
		data: { object: {} },
	});
}

function makeRequest(payload: string, signature?: string) {
	const headers = new Headers({ "content-type": "application/json" });
	if (signature) {
		headers.set("stripe-signature", signature);
	}
	return new Request("http://localhost/api/webhooks/payments", {
		method: "POST",
		body: payload,
		headers,
	});
}

describe("payments webhook verification (Stripe)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFindUnique.mockResolvedValue(null);
		process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
		process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
	});

	afterAll(() => {
		process.env.STRIPE_SECRET_KEY = ORIGINAL_ENV.STRIPE_SECRET_KEY;
		process.env.STRIPE_WEBHOOK_SECRET = ORIGINAL_ENV.STRIPE_WEBHOOK_SECRET;
	});

	it("يقبل طلباً بتوقيع صحيح ويمرره للمعالجة", async () => {
		const payload = makeEventPayload();
		const res = await webhookHandler(
			makeRequest(payload, stripeSignature(payload, WEBHOOK_SECRET)),
		);

		expect(res.status).toBe(200);
		// وصل إلى فحص الـidempotency — أي أن التحقق من التوقيع نجح
		expect(mockFindUnique).toHaveBeenCalledWith({
			where: { stripeEventId: "evt_test_0001" },
		});
	});

	it("يرفض توقيعاً خاطئاً بـ401 دون أي معالجة", async () => {
		const payload = makeEventPayload();
		const res = await webhookHandler(
			makeRequest(payload, stripeSignature(payload, "whsec_wrong_secret")),
		);

		expect(res.status).toBe(401);
		expect(mockFindUnique).not.toHaveBeenCalled();
	});

	it("يرفض طلباً بلا توقيع بـ401 دون أي معالجة", async () => {
		const res = await webhookHandler(makeRequest(makeEventPayload()));

		expect(res.status).toBe(401);
		expect(mockFindUnique).not.toHaveBeenCalled();
	});

	it("يرفض توقيعاً معدّل الحمولة (payload tampering) بـ401", async () => {
		const payload = makeEventPayload();
		const signature = stripeSignature(payload, WEBHOOK_SECRET);
		const tampered = payload.replace("evt_test_0001", "evt_test_9999");

		const res = await webhookHandler(makeRequest(tampered, signature));

		expect(res.status).toBe(401);
		expect(mockFindUnique).not.toHaveBeenCalled();
	});

	it("fail-closed: غياب STRIPE_WEBHOOK_SECRET = رفض حتى التوقيعات الصحيحة", async () => {
		const payload = makeEventPayload();
		const signature = stripeSignature(payload, WEBHOOK_SECRET);
		delete process.env.STRIPE_WEBHOOK_SECRET;

		const res = await webhookHandler(makeRequest(payload, signature));

		expect(res.status).toBe(500);
		expect(mockFindUnique).not.toHaveBeenCalled();
	});
});
