/**
 * API test setup — redirects the `db` singleton to the test database.
 *
 * This file runs BEFORE any test module is imported (vitest setupFiles).
 * Setting process.env.DATABASE_URL here ensures the PrismaClient singleton
 * in @repo/database connects to masar_test instead of production.
 *
 * If DATABASE_URL_TEST is not set, pure unit tests still run;
 * integration tests that need the DB should check `process.env.DATABASE_URL_TEST`
 * and skip themselves.
 */

const testUrl = process.env.DATABASE_URL_TEST;

if (testUrl) {
	// Safety: refuse to run against production
	if (testUrl.includes("pooler.supabase.com") || testUrl.includes("supabase.co")) {
		throw new Error(
			"DATABASE_URL_TEST appears to point at Supabase (production). " +
				"Use a local masar_test database for tests.",
		);
	}

	// Override BEFORE any @repo/database module loads its singleton
	process.env.DATABASE_URL = testUrl;
} else {
	console.warn(
		"[test-setup] DATABASE_URL_TEST not set — integration tests will be skipped.\n" +
			"Pure unit tests will still run.",
	);
}
