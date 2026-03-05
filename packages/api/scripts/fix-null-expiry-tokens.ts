/**
 * One-time migration script: set expiresAt for owner tokens that have null expiry.
 *
 * Run with: npx tsx packages/api/scripts/fix-null-expiry-tokens.ts
 */
import { db } from "@repo/database";

async function fixNullExpiryTokens() {
	const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

	const result = await db.projectOwnerAccess.updateMany({
		where: {
			expiresAt: null,
			isRevoked: false,
		},
		data: {
			expiresAt: defaultExpiry,
		},
	});

	console.log(`Updated ${result.count} tokens with null expiresAt (set to ${defaultExpiry.toISOString()})`);
}

fixNullExpiryTokens()
	.catch(console.error)
	.finally(() => db.$disconnect());
