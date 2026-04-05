/**
 * READ-ONLY AUDIT SCRIPT — Owner Drawings Damage Assessment
 *
 * Uses raw SQL via pg pool (because Prisma generated client doesn't have new models yet).
 * This script does NOT modify any data.
 *
 * Run: npx tsx scripts/audit-owner-drawings-damage.ts
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env
dotenv.config({ path: path.resolve(__dirname, "../packages/database/.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Prefer DIRECT_URL for scripts (no pgbouncer limitations)
const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error("ERROR: DATABASE_URL / DIRECT_URL not found in environment");
	process.exit(1);
}

console.log("=".repeat(70));
console.log("  OWNER DRAWINGS — READ-ONLY DAMAGE ASSESSMENT");
console.log("  Date:", new Date().toISOString());
console.log("=".repeat(70));
console.log();

async function main() {
	const pool = new pg.Pool({
		connectionString: DATABASE_URL,
		max: 2,
		idleTimeoutMillis: 10000,
		connectionTimeoutMillis: 30000,
		ssl: { rejectUnauthorized: false },
	});

	const client = await pool.connect();

	try {
		// ═══ 3.1 — Record counts in new tables ═══
		console.log("─── 3.1 Record Counts in New Tables ───");

		// Check if tables exist first
		const tablesCheck = await client.query(`
			SELECT table_name FROM information_schema.tables
			WHERE table_schema = 'public'
			AND table_name IN ('organization_owners', 'owner_drawings', 'year_end_closings')
			ORDER BY table_name
		`);
		const existingTables = tablesCheck.rows.map(r => r.table_name);
		console.log(`  Tables found: ${existingTables.join(", ") || "(none)"}`);

		let ownerCount = 0;
		let drawingCount = 0;
		let yearEndCount = 0;

		if (existingTables.includes("organization_owners")) {
			const res = await client.query("SELECT COUNT(*) as cnt FROM organization_owners");
			ownerCount = parseInt(res.rows[0].cnt, 10);
		}
		if (existingTables.includes("owner_drawings")) {
			const res = await client.query("SELECT COUNT(*) as cnt FROM owner_drawings");
			drawingCount = parseInt(res.rows[0].cnt, 10);
		}
		if (existingTables.includes("year_end_closings")) {
			const res = await client.query("SELECT COUNT(*) as cnt FROM year_end_closings");
			yearEndCount = parseInt(res.rows[0].cnt, 10);
		}

		console.log(`  OrganizationOwner: ${ownerCount}`);
		console.log(`  OwnerDrawing:      ${drawingCount}`);
		console.log(`  YearEndClosing:    ${yearEndCount}`);
		console.log();

		// ═══ 3.2 — OrganizationOwner details ═══
		console.log("─── 3.2 OrganizationOwner Details ───");

		if (!existingTables.includes("organization_owners")) {
			console.log("  (table does not exist)");
		} else if (ownerCount === 0) {
			console.log("  (no records)");
		} else {
			const ownersRes = await client.query(`
				SELECT
					oo.id, oo.organization_id, oo.name, oo.name_en,
					oo.ownership_percent, oo.drawings_account_id,
					oo.is_active, oo.created_at, oo.created_by,
					o.name as org_name, o.slug as org_slug
				FROM organization_owners oo
				LEFT JOIN organization o ON o.id = oo.organization_id
				ORDER BY oo.created_at DESC
			`);

			for (const o of ownersRes.rows) {
				const pct = parseFloat(o.ownership_percent);
				const isDefault = o.name === "المالك" && pct === 100;
				const tag = isDefault ? "[DEFAULT MIGRATION]" : "[⚠️ USER-CREATED]";
				const hasAccount = o.drawings_account_id ? "✅ has account" : "⚠️ NO account";
				console.log(`  ${tag} "${o.name}" (${pct}%)`);
				console.log(`    Org: ${o.org_slug ?? "unknown"} (${o.org_name ?? "unknown"})`);
				console.log(`    Account: ${hasAccount} | Active: ${o.is_active} | Created: ${o.created_at}`);
				console.log(`    CreatedBy: ${o.created_by ?? "system"}`);
				console.log();
			}
		}

		// ═══ 3.3 — New Chart Accounts ═══
		console.log("─── 3.3 New Chart Accounts (34xx, 3500) ───");

		const chartRes = await client.query(`
			SELECT
				ca.id, ca.organization_id, ca.code, ca.name_ar, ca.name_en,
				ca.is_postable, ca.level, ca.parent_id, ca.is_system,
				ca.created_at,
				o.name as org_name, o.slug as org_slug
			FROM chart_accounts ca
			LEFT JOIN organization o ON o.id = ca.organization_id
			WHERE ca.code LIKE '34%' OR ca.code = '3500'
			ORDER BY ca.organization_id, ca.code
		`);

		if (chartRes.rows.length === 0) {
			console.log("  (no accounts with codes 34xx or 3500)");
		} else {
			// Group by org
			const byOrg = new Map<string, typeof chartRes.rows>();
			for (const acc of chartRes.rows) {
				const key = acc.organization_id;
				if (!byOrg.has(key)) byOrg.set(key, []);
				byOrg.get(key)!.push(acc);
			}

			console.log(`  Total: ${chartRes.rows.length} accounts across ${byOrg.size} organizations`);
			console.log();

			for (const [, accounts] of byOrg) {
				console.log(`  Org: ${accounts[0].org_slug} (${accounts[0].org_name})`);
				for (const acc of accounts) {
					console.log(`    ${acc.code} — ${acc.name_ar} (${acc.name_en ?? "no EN"}) | postable: ${acc.is_postable} | system: ${acc.is_system} | level: ${acc.level}`);
				}
				console.log();
			}

			// Consistency check
			const orgsWithChild = new Set(
				chartRes.rows.filter(a => a.code !== "3400" && a.code !== "3500" && a.code.startsWith("34"))
					.map(a => a.organization_id)
			);
			const orgsWithParent = new Set(
				chartRes.rows.filter(a => a.code === "3400").map(a => a.organization_id)
			);
			const inconsistent = [...orgsWithChild].filter(id => !orgsWithParent.has(id));
			if (inconsistent.length > 0) {
				console.log(`  ⚠️ INCONSISTENCY: ${inconsistent.length} orgs have 34xx child accounts without 3400 parent!`);
			} else if (orgsWithChild.size > 0) {
				console.log(`  ✅ All orgs with 34xx child accounts have 3400 parent`);
			}
		}
		console.log();

		// ═══ 3.4 — OwnerDrawing records ═══
		console.log("─── 3.4 OwnerDrawing Records ───");

		if (!existingTables.includes("owner_drawings") || drawingCount === 0) {
			console.log("  ✅ Zero records — no drawings were created");
		} else {
			const drawingsRes = await client.query(`
				SELECT
					id, organization_id, drawing_no, amount, status,
					journal_entry_id, project_id, has_overdraw_warning, created_at
				FROM owner_drawings
				ORDER BY created_at DESC
			`);
			console.log(`  🔴 ${drawingsRes.rows.length} DRAWINGS FOUND — THIS IS A PROBLEM:`);
			for (const d of drawingsRes.rows) {
				console.log(`    ${d.drawing_no} | Amount: ${d.amount} | Status: ${d.status} | JE: ${d.journal_entry_id ?? "none"} | Created: ${d.created_at}`);
			}
		}
		console.log();

		// ═══ 3.5 — YearEndClosing records ═══
		console.log("─── 3.5 YearEndClosing Records ───");

		if (!existingTables.includes("year_end_closings") || yearEndCount === 0) {
			console.log("  ✅ Zero records — no year-end closings were executed");
		} else {
			const closingsRes = await client.query(`
				SELECT
					id, organization_id, fiscal_year, status, net_profit,
					total_drawings, closing_journal_entry_id, drawings_closing_entry_id, created_at
				FROM year_end_closings
				ORDER BY created_at DESC
			`);
			console.log(`  🔴 ${closingsRes.rows.length} CLOSINGS FOUND — THIS IS A PROBLEM:`);
			for (const c of closingsRes.rows) {
				console.log(`    FY${c.fiscal_year} | Status: ${c.status} | Profit: ${c.net_profit} | Drawings: ${c.total_drawings}`);
			}
		}
		console.log();

		// ═══ 3.6 — Journal Entries with new reference types ═══
		console.log("─── 3.6 Journal Entries with New Reference Types ───");

		const jeRes = await client.query(`
			SELECT
				id, organization_id, entry_no, reference_type, reference_id,
				status, is_reversed, total_amount, created_at
			FROM journal_entries
			WHERE reference_type IN (
				'OWNER_DRAWING', 'YEAR_END_CLOSING', 'OWNER_DRAWINGS_CLOSING',
				'DIVIDEND_DISTRIBUTION', 'YEAR_END_RETAINED'
			)
			ORDER BY created_at DESC
		`);

		if (jeRes.rows.length === 0) {
			console.log("  ✅ Zero journal entries — no accounting impact");
		} else {
			console.log(`  🔴 ${jeRes.rows.length} JOURNAL ENTRIES FOUND:`);
			for (const je of jeRes.rows) {
				console.log(`    ${je.entry_no} | Type: ${je.reference_type} | Status: ${je.status} | Amount: ${je.total_amount} | Reversed: ${je.is_reversed}`);
			}
		}
		console.log();

		// ═══ 3.7 — Audit Log for new events ═══
		console.log("─── 3.7 OrgAuditLog for Owner Events ───");

		const auditRes = await client.query(`
			SELECT
				id, organization_id, action, actor_id, metadata,
				entity_type, entity_id, created_at
			FROM organization_audit_logs
			WHERE action IN (
				'OWNER_CREATED', 'OWNER_UPDATED', 'OWNER_DEACTIVATED',
				'OWNER_DRAWING_CREATED', 'OWNER_DRAWING_APPROVED',
				'OWNER_DRAWING_CANCELLED', 'OWNER_DRAWING_OVERDRAW_ACKNOWLEDGED',
				'YEAR_END_CLOSING_EXECUTED', 'YEAR_END_CLOSING_REVERSED'
			)
			ORDER BY created_at DESC
		`);

		if (auditRes.rows.length === 0) {
			console.log("  ✅ Zero audit log entries — no successful operations");
		} else {
			console.log(`  📝 ${auditRes.rows.length} audit entries found:`);
			for (const log of auditRes.rows) {
				console.log(`    ${log.action} | OrgId: ${log.organization_id} | Actor: ${log.actor_id} | Entity: ${log.entity_type}/${log.entity_id} | At: ${log.created_at}`);
				if (log.metadata) {
					console.log(`      Metadata: ${JSON.stringify(log.metadata)}`);
				}
			}
		}
		console.log();

		// ═══ 3.8 — Total organizations (context) ═══
		console.log("─── 3.8 Organization Context ───");

		const totalOrgsRes = await client.query(`SELECT COUNT(*) as cnt FROM organization`);
		const totalOrgs = parseInt(totalOrgsRes.rows[0].cnt, 10);
		console.log(`  Total organizations: ${totalOrgs}`);

		const orgsWithAccountingRes = await client.query(`
			SELECT COUNT(DISTINCT organization_id) as cnt FROM chart_accounts WHERE code = '1110'
		`);
		const orgsWithAccounting = parseInt(orgsWithAccountingRes.rows[0].cnt, 10);
		console.log(`  Orgs with accounting (have 1110): ${orgsWithAccounting}`);

		// ═══ 3.9 — Orgs with owner drawings system ═══
		console.log();
		console.log("─── 3.9 Orgs with Owner Drawings System (have 3400) ───");

		const orgsWithDrawingsRes = await client.query(`
			SELECT COUNT(DISTINCT organization_id) as cnt FROM chart_accounts WHERE code = '3400'
		`);
		const orgsWithDrawings = parseInt(orgsWithDrawingsRes.rows[0].cnt, 10);
		console.log(`  Orgs with 3400 (drawings system): ${orgsWithDrawings} out of ${totalOrgs} total`);
		console.log();

		// ═══ SUMMARY ═══
		console.log("=".repeat(70));
		console.log("  SUMMARY");
		console.log("=".repeat(70));
		console.log();

		const hasDrawings = drawingCount > 0;
		const hasYearEnd = yearEndCount > 0;
		const hasJournalEntries = jeRes.rows.length > 0;

		let hasNonDefaultOwners = false;
		let ownersWithNoAccount = 0;
		if (existingTables.includes("organization_owners") && ownerCount > 0) {
			const ownersRes = await client.query(`
				SELECT name, ownership_percent, drawings_account_id
				FROM organization_owners
			`);
			hasNonDefaultOwners = ownersRes.rows.some(
				o => o.name !== "المالك" || parseFloat(o.ownership_percent) !== 100
			);
			ownersWithNoAccount = ownersRes.rows.filter(o => !o.drawings_account_id).length;
		}

		let scenario: "A" | "B" | "C";

		if (!hasDrawings && !hasYearEnd && !hasJournalEntries) {
			if (!hasNonDefaultOwners && ownersWithNoAccount === 0) {
				scenario = "A";
				console.log("  🟢 SCENARIO A: No damage — Migration only");
				console.log("    - All OrganizationOwner records are default migrations");
				console.log("    - Zero OwnerDrawing records");
				console.log("    - Zero YearEndClosing records");
				console.log("    - Zero journal entries with new reference types");
				console.log("    - RECOMMENDATION: Fix permissions only. Existing data is correct.");
			} else {
				scenario = "B";
				console.log("  🟡 SCENARIO B: Partial data — Light cleanup needed");
				console.log(`    - Non-default owners: ${hasNonDefaultOwners}`);
				console.log(`    - Owners without drawings account: ${ownersWithNoAccount}`);
				console.log("    - Zero OwnerDrawing records (write endpoints blocked by 403)");
				console.log("    - RECOMMENDATION: Fix permissions + cleanup partial owner records.");
			}
		} else {
			scenario = "C";
			console.log("  🔴 SCENARIO C: Real data — Rollback needed");
			console.log(`    - ${drawingCount} OwnerDrawing records`);
			console.log(`    - ${yearEndCount} YearEndClosing records`);
			console.log(`    - ${jeRes.rows.length} journal entries`);
			console.log("    - RECOMMENDATION: Reverse journal entries + delete drawings + fix permissions.");
		}

		console.log();
		console.log(`  Affected organizations: ${orgsWithDrawings}`);
		console.log(`  Audit log entries: ${auditRes.rows.length}`);
		console.log(`  Scenario: ${scenario}`);
		console.log();

		client.release();
		await pool.end();
	} catch (error) {
		console.error("FATAL ERROR:", error);
		client.release();
		await pool.end();
		process.exit(1);
	}
}

main();
