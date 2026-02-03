/**
 * Rate Limiting Helper - حماية من الإساءة
 * Phase 6: Production Hardening
 *
 * Simple in-memory rate limiter using sliding window.
 * Note: For multi-instance deployments, consider using Redis-based solution.
 */

interface RateLimitEntry {
	count: number;
	windowStart: number;
}

interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Max requests per window
}

// In-memory store (LRU-style with max entries)
const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 10000;
const CLEANUP_INTERVAL = 60000; // 1 minute

// Cleanup old entries periodically
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
	if (cleanupTimer) return;
	cleanupTimer = setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of store.entries()) {
			// Remove entries older than 5 minutes
			if (now - entry.windowStart > 5 * 60 * 1000) {
				store.delete(key);
			}
		}
		// If store is too large, remove oldest entries
		if (store.size > MAX_STORE_SIZE) {
			const entries = Array.from(store.entries());
			entries.sort((a, b) => a[1].windowStart - b[1].windowStart);
			const toRemove = entries.slice(0, store.size - MAX_STORE_SIZE + 1000);
			for (const [key] of toRemove) {
				store.delete(key);
			}
		}
	}, CLEANUP_INTERVAL);
}

// Start cleanup on module load
startCleanup();

// ═══════════════════════════════════════════════════════════════════════════
// Rate Limit Presets
// ═══════════════════════════════════════════════════════════════════════════

export const RATE_LIMITS = {
	// Standard read operations
	READ: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 req/min

	// Standard write operations
	WRITE: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 req/min

	// Token/auth sensitive operations
	TOKEN: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 req/min

	// Upload operations
	UPLOAD: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 req/min

	// Message sending
	MESSAGE: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 req/min

	// Strict for sensitive operations
	STRICT: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 req/min
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Core Rate Limit Function
// ═══════════════════════════════════════════════════════════════════════════

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: number;
	retryAfterMs?: number;
}

/**
 * Check rate limit for a key
 * @param key - Unique identifier (e.g., "userId:procedureName")
 * @param config - Rate limit configuration
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
	const now = Date.now();
	const entry = store.get(key);

	// No existing entry or window expired
	if (!entry || now - entry.windowStart >= config.windowMs) {
		store.set(key, { count: 1, windowStart: now });
		return {
			allowed: true,
			remaining: config.maxRequests - 1,
			resetAt: now + config.windowMs,
		};
	}

	// Within window
	if (entry.count < config.maxRequests) {
		entry.count++;
		return {
			allowed: true,
			remaining: config.maxRequests - entry.count,
			resetAt: entry.windowStart + config.windowMs,
		};
	}

	// Rate limited
	const retryAfterMs = entry.windowStart + config.windowMs - now;
	return {
		allowed: false,
		remaining: 0,
		resetAt: entry.windowStart + config.windowMs,
		retryAfterMs,
	};
}

/**
 * Create a rate limit key from user ID and procedure name
 */
export function createRateLimitKey(userId: string, procedureName: string): string {
	return `${userId}:${procedureName}`;
}

/**
 * Create a rate limit key for IP-based limiting (for public endpoints)
 */
export function createIpRateLimitKey(ip: string, procedureName: string): string {
	return `ip:${ip}:${procedureName}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Rate Limit Error
// ═══════════════════════════════════════════════════════════════════════════

export class RateLimitError extends Error {
	public readonly retryAfterMs: number;
	public readonly resetAt: number;

	constructor(result: RateLimitResult) {
		const retrySeconds = Math.ceil((result.retryAfterMs || 0) / 1000);
		super(`تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد ${retrySeconds} ثانية`);
		this.name = "RateLimitError";
		this.retryAfterMs = result.retryAfterMs || 0;
		this.resetAt = result.resetAt;
	}
}

/**
 * Check rate limit and throw error if exceeded
 */
export function enforceRateLimit(
	key: string,
	config: RateLimitConfig = RATE_LIMITS.WRITE,
): void {
	const result = checkRateLimit(key, config);
	if (!result.allowed) {
		throw new RateLimitError(result);
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// ORPC Middleware Helper
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a rate limit checker for use in ORPC procedures
 * Usage: rateLimitChecker(ctx.user.id, 'createClaim', RATE_LIMITS.WRITE)
 */
export function rateLimitChecker(
	userId: string,
	procedureName: string,
	config: RateLimitConfig = RATE_LIMITS.WRITE,
): void {
	const key = createRateLimitKey(userId, procedureName);
	enforceRateLimit(key, config);
}

/**
 * Rate limit for token-based endpoints (owner portal)
 */
export function rateLimitToken(token: string, procedureName: string): void {
	const key = `token:${token}:${procedureName}`;
	enforceRateLimit(key, RATE_LIMITS.TOKEN);
}
