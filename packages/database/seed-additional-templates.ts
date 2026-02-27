/**
 * Script: Seed additional invoice templates for all existing organizations.
 *
 * Usage:
 *   cd packages/database
 *   pnpm dotenv -c -e ../../.env -- npx tsx seed-additional-templates.ts
 */
import { seedAdditionalInvoiceTemplatesForAll } from "./prisma/queries/seed-templates";

async function main() {
	console.log("Seeding additional invoice templates for all organizations...");
	const result = await seedAdditionalInvoiceTemplatesForAll();
	console.log(`Done! Seeded: ${result.seeded} orgs, Skipped: ${result.skipped}, Templates created: ${result.totalCreated}`);
	process.exit(0);
}

main().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
