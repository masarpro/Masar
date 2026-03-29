import { auth } from "@repo/auth";
import { logger } from "@repo/logs";
import { webhookHandler as paymentsWebhookHandler } from "@repo/payments";
import { getBaseUrl } from "@repo/utils";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { logger as honoLogger } from "hono/logger";
import { openApiHandler, rpcHandler } from "./orpc/handler";
import {
	checkRateLimit,
	clearFailedLogins,
	createEmailRateLimitKey,
	createIpRateLimitKey,
	getClientIp,
	getFailedLoginCount,
	getProgressiveDelay,
	isAccountLocked,
	RATE_LIMITS,
	recordFailedLogin,
} from "./lib/rate-limit";

// Rate limit configs for auth endpoints (IP-based)
const AUTH_RATE_LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
	"/auth/sign-in": { windowMs: 60_000, maxRequests: 10 },
	"/auth/forgot-password": { windowMs: 60_000, maxRequests: 5 },
	"/auth/magic-link": { windowMs: 60_000, maxRequests: 5 },
	"/auth/sign-up": { windowMs: 60_000, maxRequests: 5 },
};

// Rate limit configs for auth endpoints (email-based)
const AUTH_EMAIL_LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
	"/auth/sign-in": { windowMs: 60_000, maxRequests: 5 },
	"/auth/sign-up": { windowMs: 60_000, maxRequests: 3 },
	"/auth/forgot-password": { windowMs: 300_000, maxRequests: 3 },
	"/auth/magic-link": { windowMs: 300_000, maxRequests: 3 },
};

type HonoEnv = { Variables: { authEmail?: string } };

export const app = new Hono<HonoEnv>()
	.basePath("/api")
	// Logger middleware
	.use(honoLogger((message, ...rest) => logger.log(message, ...rest)))
	// Body limit (10MB for base64 image payloads)
	.use(bodyLimit({ maxSize: 10 * 1024 * 1024 }))
	// Cors middleware
	.use(
		cors({
			origin: [getBaseUrl(), "https://app-masar.com"].filter(
				(v, i, a) => a.indexOf(v) === i,
			),
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["POST", "GET", "OPTIONS"],
			exposeHeaders: ["Content-Length"],
			maxAge: 600,
			credentials: true,
		}),
	)
	// Rate limiting for auth endpoints (IP + email-based + lockout + progressive delay)
	.use("/auth/*", async (c, next) => {
		const path = new URL(c.req.url).pathname.replace(/^\/api/, "");

		// Layer 1: IP-based rate limiting (existing)
		const ipRule = Object.entries(AUTH_RATE_LIMITS).find(([prefix]) =>
			path.startsWith(prefix),
		);

		if (ipRule) {
			const [, limits] = ipRule;
			const ip = getClientIp(c.req.raw.headers);
			const key = createIpRateLimitKey(ip, `auth:${path}`);
			const result = await checkRateLimit(key, limits);

			if (!result.allowed) {
				return c.json(
					{ error: "تم تجاوز الحد المسموح من المحاولات. يرجى المحاولة لاحقاً" },
					429,
				);
			}
		}

		// Layer 2+3+4: Email-based rate limiting, lockout, and progressive delay
		if (c.req.method === "POST") {
			const cloned = c.req.raw.clone();
			const body = await cloned.json().catch(() => null);
			const email = (body as Record<string, unknown> | null)?.email;

			if (typeof email === "string" && email) {
				c.set("authEmail", email);

				// Sign-in specific: account lockout check + progressive delay
				if (path.startsWith("/auth/sign-in")) {
					const lockStatus = await isAccountLocked(email);
					if (lockStatus.locked) {
						return c.json(
							{ error: "تم تجاوز الحد المسموح من المحاولات. يرجى المحاولة لاحقاً" },
							429,
						);
					}

					const failCount = await getFailedLoginCount(email);
					const delay = getProgressiveDelay(failCount);
					if (delay > 0) {
						await new Promise<void>((r) => setTimeout(r, delay));
					}
				}

				// All auth endpoints: email-based rate limit
				const emailRule = Object.entries(AUTH_EMAIL_LIMITS).find(
					([prefix]) => path.startsWith(prefix),
				);
				if (emailRule) {
					const [prefix, limits] = emailRule;
					const emailKey = createEmailRateLimitKey(email, prefix);
					const emailResult = await checkRateLimit(emailKey, limits);
					if (!emailResult.allowed) {
						return c.json(
							{ error: "تم تجاوز الحد المسموح من المحاولات. يرجى المحاولة لاحقاً" },
							429,
						);
					}
				}
			}
		}

		return next();
	})
	// Auth handler (with sign-in success/failure tracking for account lockout)
	.on(["POST", "GET"], "/auth/**", async (c) => {
		const response = await auth.handler(c.req.raw);

		// Track sign-in success/failure for lockout mechanism
		const email = c.get("authEmail");
		if (email) {
			const path = new URL(c.req.url).pathname.replace(/^\/api/, "");
			if (path.startsWith("/auth/sign-in")) {
				if (response.status === 200) {
					clearFailedLogins(email).catch(() => {});
				} else {
					recordFailedLogin(email).catch(() => {});
				}
			}
		}

		return response;
	})
	// Payments webhook handler
	.post("/webhooks/payments", (c) => paymentsWebhookHandler(c.req.raw))
	// Health check
	.get("/health", (c) => c.text("OK"))
	// oRPC handlers (for RPC and OpenAPI)
	.use("*", async (c, next) => {
		const context = {
			headers: c.req.raw.headers,
		};

		const isRpc = c.req.path.includes("/rpc/");

		const handler = isRpc ? rpcHandler : openApiHandler;

		const prefix = isRpc ? "/api/rpc" : "/api";

		const { matched, response } = await handler.handle(c.req.raw, {
			prefix,
			context,
		});

		if (matched) {
			return c.newResponse(response.body, response);
		}

		await next();
	});
