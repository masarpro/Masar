/**
 * Rate Limiting Helper - حماية من الإساءة
 *
 * Redis-backed fixed-window rate limiter with in-memory fallback.
 * Uses INCR + EXPIRE for distributed rate limiting across instances.
 * Falls back to in-memory Map when Redis is unavailable (circuit breaker).
 */
import Redis from "ioredis";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface RateLimitConfig {
	windowMs: number;
	maxRequests: number;
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: number;
	retryAfterMs?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Rate Limit Presets
// ═══════════════════════════════════════════════════════════════════════════

export const RATE_LIMITS = {
	READ: { windowMs: 60 * 1000, maxRequests: 60 },
	WRITE: { windowMs: 60 * 1000, maxRequests: 20 },
	TOKEN: { windowMs: 60 * 1000, maxRequests: 30 },
	UPLOAD: { windowMs: 60 * 1000, maxRequests: 10 },
	MESSAGE: { windowMs: 60 * 1000, maxRequests: 30 },
	STRICT: { windowMs: 60 * 1000, maxRequests: 5 },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// In-Memory Fallback Store
// ═══════════════════════════════════════════════════════════════════════════

interface MemoryEntry {
	count: number;
	windowStart: number;
}

const memoryStore = new Map<string, MemoryEntry>();
const MAX_STORE_SIZE = 10000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startMemoryCleanup() {
	if (cleanupTimer) return;
	cleanupTimer = setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of memoryStore.entries()) {
			if (now - entry.windowStart > 5 * 60 * 1000) {
				memoryStore.delete(key);
			}
		}
		if (memoryStore.size > MAX_STORE_SIZE) {
			const entries = Array.from(memoryStore.entries());
			entries.sort((a, b) => a[1].windowStart - b[1].windowStart);
			const toRemove = entries.slice(0, memoryStore.size - MAX_STORE_SIZE + 1000);
			for (const [key] of toRemove) {
				memoryStore.delete(key);
			}
		}
	}, 60_000);
}

function checkMemoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
	const now = Date.now();
	const entry = memoryStore.get(key);

	if (!entry || now - entry.windowStart >= config.windowMs) {
		memoryStore.set(key, { count: 1, windowStart: now });
		return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
	}

	if (entry.count < config.maxRequests) {
		entry.count++;
		return {
			allowed: true,
			remaining: config.maxRequests - entry.count,
			resetAt: entry.windowStart + config.windowMs,
		};
	}

	const retryAfterMs = entry.windowStart + config.windowMs - now;
	return { allowed: false, remaining: 0, resetAt: entry.windowStart + config.windowMs, retryAfterMs };
}

// ═══════════════════════════════════════════════════════════════════════════
// Circuit Breaker
// ═══════════════════════════════════════════════════════════════════════════

const CIRCUIT_BREAKER = {
	/** After this many consecutive Redis failures, open the circuit (fall back to memory) */
	failureThreshold: 3,
	/** After this many ms with circuit open, try Redis again (half-open) */
	retryAfterMs: 30_000,
};

let consecutiveFailures = 0;
let circuitOpenedAt = 0;

function isCircuitOpen(): boolean {
	if (consecutiveFailures < CIRCUIT_BREAKER.failureThreshold) return false;
	// Circuit is open — check if enough time passed to try again (half-open)
	if (Date.now() - circuitOpenedAt >= CIRCUIT_BREAKER.retryAfterMs) return false;
	return true;
}

function recordRedisSuccess() {
	consecutiveFailures = 0;
	circuitOpenedAt = 0;
}

function recordRedisFailure() {
	consecutiveFailures++;
	if (consecutiveFailures >= CIRCUIT_BREAKER.failureThreshold && circuitOpenedAt === 0) {
		circuitOpenedAt = Date.now();
		console.warn(
			`[rate-limit] Circuit breaker OPEN after ${consecutiveFailures} Redis failures. Falling back to in-memory for ${CIRCUIT_BREAKER.retryAfterMs / 1000}s`,
		);
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// Redis Client
// ═══════════════════════════════════════════════════════════════════════════

const REDIS_KEY_PREFIX = "rl:";

let redis: Redis | null = null;
let redisReady = false;

function getRedisClient(): Redis | null {
	if (redis) return redis;

	const url = process.env.REDIS_URL;
	if (!url) return null;

	try {
		redis = new Redis(url, {
			maxRetriesPerRequest: 1,
			enableReadyCheck: true,
			connectTimeout: 3000,
			lazyConnect: true,
		});

		redis.on("ready", () => {
			redisReady = true;
			console.info("[rate-limit] Redis connected");
		});

		redis.on("error", (err) => {
			redisReady = false;
			console.warn("[rate-limit] Redis error:", err.message);
		});

		redis.on("close", () => {
			redisReady = false;
		});

		redis.connect().catch(() => {
			// Connection failure handled by "error" event
		});

		return redis;
	} catch {
		console.warn("[rate-limit] Failed to create Redis client. Using in-memory fallback.");
		return null;
	}
}

// Initialize on module load
startMemoryCleanup();
getRedisClient();

// ═══════════════════════════════════════════════════════════════════════════
// Redis Rate Limit (Fixed-Window via INCR + EXPIRE)
// ═══════════════════════════════════════════════════════════════════════════

async function checkRedisRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
	const client = getRedisClient();
	if (!client || !redisReady || isCircuitOpen()) {
		return checkMemoryRateLimit(key, config);
	}

	const windowSec = Math.ceil(config.windowMs / 1000);
	const redisKey = `${REDIS_KEY_PREFIX}${key}`;

	try {
		const pipeline = client.pipeline();
		pipeline.incr(redisKey);
		pipeline.pttl(redisKey);
		const results = await pipeline.exec();

		if (!results || results.length < 2) {
			throw new Error("Unexpected pipeline result");
		}

		const [incrErr, count] = results[0] as [Error | null, number];
		const [ttlErr, pttl] = results[1] as [Error | null, number];

		if (incrErr) throw incrErr;
		if (ttlErr) throw ttlErr;

		// First request in window — set expiry
		if (count === 1 || pttl === -1) {
			await client.expire(redisKey, windowSec);
		}

		recordRedisSuccess();

		const now = Date.now();
		const resetAt = pttl > 0 ? now + pttl : now + config.windowMs;

		if (count <= config.maxRequests) {
			return {
				allowed: true,
				remaining: config.maxRequests - count,
				resetAt,
			};
		}

		return {
			allowed: false,
			remaining: 0,
			resetAt,
			retryAfterMs: pttl > 0 ? pttl : config.windowMs,
		};
	} catch {
		recordRedisFailure();
		// Fallback to in-memory on Redis error
		return checkMemoryRateLimit(key, config);
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// Public API (preserves existing signatures, now async)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check rate limit for a key
 */
export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
	return checkRedisRateLimit(key, config);
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
export async function enforceRateLimit(
	key: string,
	config: RateLimitConfig = RATE_LIMITS.WRITE,
): Promise<void> {
	const result = await checkRateLimit(key, config);
	if (!result.allowed) {
		throw new RateLimitError(result);
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// ORPC Middleware Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a rate limit checker for use in ORPC procedures
 */
export async function rateLimitChecker(
	userId: string,
	procedureName: string,
	config: RateLimitConfig = RATE_LIMITS.WRITE,
): Promise<void> {
	const key = createRateLimitKey(userId, procedureName);
	await enforceRateLimit(key, config);
}

/**
 * Rate limit for token-based endpoints (owner portal)
 */
export async function rateLimitToken(token: string, procedureName: string): Promise<void> {
	const key = `token:${token}:${procedureName}`;
	await enforceRateLimit(key, RATE_LIMITS.TOKEN);
}
