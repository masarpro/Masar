/**
 * Cloudflare Turnstile server-side verification.
 *
 * Setup:
 * 1. https://dash.cloudflare.com/ → Turnstile → Add site
 * 2. Domains: app-masar.com, localhost, *.vercel.app
 * 3. Copy Site Key → NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * 4. Copy Secret Key → TURNSTILE_SECRET_KEY
 */
import { ORPCError } from "@orpc/client";

const VERIFY_URL =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResult {
	success: boolean;
	"error-codes"?: string[];
	challenge_ts?: string;
	hostname?: string;
}

/**
 * Verifies a Turnstile token server-side.
 *
 * - Dev mode without secret key → silently passes
 * - Production without secret key → throws (misconfiguration)
 * - Empty token → rejects
 * - Cloudflare API failure → rejects (fail-closed)
 */
export async function verifyTurnstileToken(
	token: string,
	ip?: string,
): Promise<void> {
	const secret = process.env.TURNSTILE_SECRET_KEY;

	// Dev bypass — no key configured
	if (!secret) {
		if (process.env.NODE_ENV === "development") return;
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Turnstile not configured",
		});
	}

	if (!token?.trim()) {
		throw new ORPCError("BAD_REQUEST", {
			message: "التحقق الأمني مطلوب",
		});
	}

	const body = new URLSearchParams({ secret, response: token });
	if (ip) body.set("remoteip", ip);

	try {
		const res = await fetch(VERIFY_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: body.toString(),
		});

		const result: TurnstileVerifyResult = await res.json();

		if (!result.success) {
			throw new ORPCError("BAD_REQUEST", {
				message: "فشل التحقق الأمني. يرجى إعادة المحاولة.",
			});
		}
	} catch (error) {
		if (error instanceof ORPCError) throw error;
		// Cloudflare API unreachable — reject for safety
		throw new ORPCError("BAD_REQUEST", {
			message: "فشل التحقق الأمني. يرجى إعادة المحاولة.",
		});
	}
}
