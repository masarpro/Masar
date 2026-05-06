/**
 * READ-ONLY: print env vars visible to this script.
 * Note: this reflects LOCAL .env.local on this machine, NOT Vercel runtime.
 *
 * Run: pnpm tsx scripts/zatca/check-env-runtime.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

console.log("════════════════════════════════════════════════════════════");
console.log("  RUNTIME ENV — LOCAL MACHINE ONLY");
console.log("  ⚠️  This is .env.local — NOT what Vercel uses at runtime");
console.log("════════════════════════════════════════════════════════════\n");

const interesting = [
	"ZATCA_ENVIRONMENT",
	"ZATCA_EC_CURVE",
	"NODE_ENV",
	"VERCEL_ENV",
	"VERCEL_GIT_COMMIT_SHA",
	"VERCEL_REGION",
];
for (const k of interesting) {
	console.log(`  ${k.padEnd(26)} ${process.env[k] ?? "(unset)"}`);
}

console.log("\n--- Computed ZATCA URLs at this runtime ---");
const env = (process.env.ZATCA_ENVIRONMENT || "simulation");
const URLS: Record<string, string> = {
	sandbox: "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal",
	simulation: "https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation",
	production: "https://gw-fatoora.zatca.gov.sa/e-invoicing/core",
};
const base = URLS[env];
console.log(`  resolved env  : ${env}`);
console.log(`  base URL      : ${base}`);
console.log(`  clearance URL : ${base}/invoices/clearance/single`);
console.log(`  reporting URL : ${base}/invoices/reporting/single`);
