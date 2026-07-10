import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/client";

// ─────────────────────────────────────────────────────────────────────────────
// Transient connection-error retry
// ─────────────────────────────────────────────────────────────────────────────
// Behind Supabase's pgbouncer + the Dubai↔Mumbai network, an idle pooled socket
// can be dropped server-side. When the pool then hands that dead socket to a
// request, the query fails with "Connection terminated unexpectedly" (and
// friends). These errors surface at connection checkout / send time — BEFORE the
// query reaches Postgres — so retrying with a fresh connection is safe and
// idempotent. The `pool.on("error")` handler below stops such drops from crashing
// the instance; this retry stops the single unlucky request from 500-ing (the
// user-visible "fails then recovers" symptom).
const TRANSIENT_CONNECTION_ERROR =
	/Connection terminated unexpectedly|Connection ended unexpectedly|Client has encountered a connection error|server closed the connection unexpectedly|Can't reach database server|Timed out fetching a new connection|ECONNRESET|EPIPE|the database system is (starting up|shutting down)/i;

// Prisma error codes for connection-level failures (never constraint/query bugs).
const TRANSIENT_PRISMA_CODES = new Set(["P1001", "P1002", "P1008", "P1017"]);

function isTransientConnectionError(err: unknown): boolean {
	if (!err) return false;
	const code = (err as { code?: unknown }).code;
	if (typeof code === "string" && TRANSIENT_PRISMA_CODES.has(code)) return true;
	const message = (err as { message?: unknown }).message;
	return TRANSIENT_CONNECTION_ERROR.test(
		typeof message === "string" ? message : String(err),
	);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const prismaClientSingleton = () => {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not set");
	}

	const pool = new Pool({
		connectionString: process.env.DATABASE_URL,
		// The org homepage alone fans out ~15 queries in one render (dashboard.getAll
		// runs 10 in parallel, plus finance.orgDashboard, projects.list, and the
		// layout chain). At max:5 those queued in 3 waves, each wave paying the full
		// Dubai↔Mumbai round-trip (~20-30ms) — a self-inflicted serialization.
		// Supabase's transaction pooler (port 6543) multiplexes these onto a small
		// set of real Postgres connections, so a higher per-instance client-socket
		// cap is cheap and cuts the wave count. 10 keeps a single warm instance's
		// fan-out largely un-queued without risking the pooler's client budget.
		max: 10,
		// Keep idle connections short-lived: behind Supabase's pgbouncer (and the
		// Dubai↔Mumbai network) idle TCP connections get dropped server-side. A long
		// idle timeout means we reuse a connection the server already killed →
		// "Connection terminated unexpectedly" errors. Recycle quickly instead.
		idleTimeoutMillis: 10000,
		connectionTimeoutMillis: 10000,
		// Enable TCP keepalive so dead/half-open connections are detected proactively
		// instead of surfacing as a failed query mid-request.
		keepAlive: true,
		keepAliveInitialDelayMillis: 5000,
		// Recycle each physical connection after a bounded number of uses so a single
		// long-lived (and possibly stale) socket can't poison the pool indefinitely.
		maxUses: 7500,
	});

	// CRITICAL: pg emits an 'error' event on behalf of *idle* clients when the
	// backend or network drops them. With NO listener, Node treats it as an
	// uncaughtException and crashes/poisons the serverless instance — making EVERY
	// subsequent request (notifications, projects, dashboard, finance, …) return
	// 500 until Vercel recycles the instance. Swallowing it here keeps the pool
	// alive: the bad client is discarded and the next query gets a fresh one.
	pool.on("error", (err) => {
		console.error("[db pool] idle client error (recovered):", err.message);
	});

	const adapter = new PrismaPg(pool as any);
	const client = new PrismaClient({ adapter }).$extends({
		query: {
			// Retry every operation once or twice on a transient connection drop,
			// each attempt getting a fresh connection from the pool. Non-connection
			// errors (validation, constraints, business logic) are rethrown
			// immediately — we only shield against dead idle sockets.
			async $allOperations({ args, query }) {
				const MAX_ATTEMPTS = 3;
				for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
					try {
						return await query(args);
					} catch (err) {
						if (
							attempt === MAX_ATTEMPTS ||
							!isTransientConnectionError(err)
						) {
							throw err;
						}
						console.error(
							`[db] transient connection error (retry ${attempt}/${
								MAX_ATTEMPTS - 1
							}):`,
							(err as { message?: string }).message,
						);
						// Small linear backoff so a fresh socket can be established.
						await sleep(50 * attempt);
					}
				}
				// Unreachable — the loop either returns or throws.
				throw new Error("[db] retry loop exited unexpectedly");
			},
		},
	});

	// The retry extension only wraps runtime behavior; expose the base
	// PrismaClient type so query-layer helpers typed against `TransactionClient`
	// (and every existing consumer of `db`) keep their unchanged signatures.
	return client as unknown as PrismaClient;
};

declare global {
	var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// biome-ignore lint/suspicious/noRedeclare: This is a singleton
const prisma = globalThis.prisma ?? prismaClientSingleton();

// Cache on globalThis in ALL environments. On serverless this ensures a single
// pool per warm instance even if this module is evaluated more than once, which
// prevents silently leaking extra pools (and exceeding the pooler's connection
// budget → "max clients reached" → 500s).
globalThis.prisma = prisma;

export { prisma as db };
