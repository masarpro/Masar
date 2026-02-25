/**
 * Test DB setup — transaction-per-test with rollback.
 *
 * Requirements (for integration tests):
 *   1. Set DATABASE_URL_TEST pointing to the `masar_test` PostgreSQL database.
 *   2. Apply the schema once:  DATABASE_URL=$DATABASE_URL_TEST pnpm -C packages/database run push
 *   3. Run tests:  pnpm -C packages/database test
 *
 * If DATABASE_URL_TEST is not set, the test DB helpers export null/noop,
 * and integration tests should skip themselves.
 */

import { beforeAll, afterAll } from "vitest";

// ─── Env guard ──────────────────────────────────────────────────────────────
const testUrl = process.env.DATABASE_URL_TEST;

if (testUrl && (testUrl.includes("pooler.supabase.com") || testUrl.includes("supabase.co"))) {
	throw new Error(
		"DATABASE_URL_TEST appears to point at a Supabase pooler (production). " +
			"Use a local masar_test database for tests.",
	);
}

if (!testUrl) {
	console.warn(
		"[test-setup] DATABASE_URL_TEST not set — integration tests will be skipped.",
	);
	// Set a dummy DATABASE_URL so the PrismaClient singleton can be constructed
	// without throwing during module import. Pure-function tests (validation, etc.)
	// never actually connect, so this is safe.
	if (!process.env.DATABASE_URL) {
		process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy_no_connect";
	}
}

// ─── Dedicated test PrismaClient (only when DB available) ──────────────────
let testDb: any = null;

if (testUrl) {
	// Override DATABASE_URL so the db singleton from ../client also uses the test DB.
	// This must happen BEFORE any module imports ../client.
	process.env.DATABASE_URL = testUrl;

	// Dynamic import to avoid crashing when no DB is available
	const { PrismaPg } = await import("@prisma/adapter-pg");
	const { PrismaClient } = await import("../../prisma/generated/client");
	const adapter = new PrismaPg({ connectionString: testUrl });
	testDb = new PrismaClient({ adapter });
}

export { testDb };

// ─── Transaction-per-test helper ────────────────────────────────────────────

/** Sentinel used to force a rollback after the test body completes. */
class RollbackError extends Error {
	readonly __rollback = true;
	constructor() {
		super("__TEST_ROLLBACK__");
	}
}

/**
 * Transaction client type — same as PrismaClient but without top-level
 * lifecycle methods ($connect, $disconnect, $transaction …).
 */
export type TestTxClient = NonNullable<typeof testDb> extends { $transaction: (fn: (tx: infer T) => any) => any } ? T : any;

/**
 * Run `fn` inside an interactive Prisma transaction that is always rolled back.
 */
export async function withTestTx<T>(
	fn: (tx: TestTxClient) => Promise<T>,
): Promise<T> {
	if (!testDb) {
		throw new Error("withTestTx requires DATABASE_URL_TEST to be set");
	}
	let result: T;
	try {
		await testDb.$transaction(
			async (tx: any) => {
				result = await fn(tx);
				throw new RollbackError();
			},
			{ timeout: 25_000 },
		);
	} catch (e: unknown) {
		if (e instanceof RollbackError) return result!;
		throw e;
	}
	return result!;
}

// ─── Global lifecycle ───────────────────────────────────────────────────────

beforeAll(async () => {
	if (testDb) {
		await testDb.$queryRawUnsafe("SELECT 1");
	}
});

afterAll(async () => {
	if (testDb) {
		await testDb.$disconnect();
	}
});
