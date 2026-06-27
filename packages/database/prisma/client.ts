import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/client";

const prismaClientSingleton = () => {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not set");
	}

	const pool = new Pool({
		connectionString: process.env.DATABASE_URL,
		max: 5,
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
	return new PrismaClient({ adapter });
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
