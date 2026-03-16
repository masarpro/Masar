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
	createIpRateLimitKey,
	RATE_LIMITS,
} from "./lib/rate-limit";

// Rate limit configs for auth endpoints
const AUTH_RATE_LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
	"/auth/sign-in": { windowMs: 60_000, maxRequests: 10 },
	"/auth/forgot-password": { windowMs: 60_000, maxRequests: 5 },
	"/auth/magic-link": { windowMs: 60_000, maxRequests: 5 },
	"/auth/sign-up": { windowMs: 60_000, maxRequests: 5 },
};

export const app = new Hono()
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
	// Rate limiting for auth endpoints
	.use("/auth/*", async (c, next) => {
		const path = new URL(c.req.url).pathname.replace(/^\/api/, "");
		const matchedRule = Object.entries(AUTH_RATE_LIMITS).find(([prefix]) =>
			path.startsWith(prefix),
		);

		if (matchedRule) {
			const [, limits] = matchedRule;
			const ip =
				c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
			const key = createIpRateLimitKey(ip, `auth:${path}`);
			const result = await checkRateLimit(key, limits);

			if (!result.allowed) {
				return c.json(
					{ error: "Too many requests. Please try again later." },
					429,
				);
			}
		}

		return next();
	})
	// Auth handler
	.on(["POST", "GET"], "/auth/**", (c) => auth.handler(c.req.raw))
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
