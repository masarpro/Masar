// ══════════════════════════════════════════════════════════════════════════
// Categories Seeder — Masar Category Management
// ══════════════════════════════════════════════════════════════════════════
//
// Seeds default categories into OrgCategory + OrgSubcategory on first access
// for an organization. Idempotent and cached (5-min TTL) so it can be called
// safely at the top of every read procedure with negligible overhead.
//
// Pattern mirrors `ensureChartExists` in lib/accounting/auto-journal.ts:85-103.
//
// NOTE: Silent Failure Pattern does NOT apply here — categories are not part
// of the accounting transaction. Errors are thrown so the caller can react.
// ══════════════════════════════════════════════════════════════════════════

import { db } from "@repo/database";
import type { CategoryGroup } from "@repo/database";
import { EXPENSE_CATEGORIES } from "@repo/utils";

// ────────────────────────────────────────────────
// In-memory cache (5-min TTL per organization × group)
// ────────────────────────────────────────────────
const seedCache = new Map<string, { timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheKey(organizationId: string, group: CategoryGroup): string {
	return `${organizationId}:${group}`;
}

/**
 * Invalidates the seed cache for an organization. Call after operations that
 * may have changed the seeded state (e.g. admin reset or bulk delete).
 *
 * If `group` is omitted, invalidates all groups for the organization.
 */
export function invalidateCategoriesCache(
	organizationId: string,
	group?: CategoryGroup,
): void {
	if (group) {
		seedCache.delete(cacheKey(organizationId, group));
		return;
	}
	for (const key of seedCache.keys()) {
		if (key.startsWith(`${organizationId}:`)) {
			seedCache.delete(key);
		}
	}
}

/**
 * Ensures the given organization has the default categories for the given
 * group. Idempotent — safe to call multiple times.
 *
 * Behaviour:
 *   1. Cache hit (5-min TTL) → return immediately
 *   2. Count check: if all defaults already present → cache and return
 *   3. Otherwise: seed any missing system categories (gap-fill, per-systemId)
 *
 * Each main category is created with its subcategories in a single nested
 * Prisma `create` call (atomic at the per-category level — no orphan
 * subcategories if a single create fails midway).
 */
export async function ensureCategoriesSeeded(
	organizationId: string,
	group: CategoryGroup = "EXPENSE",
): Promise<void> {
	const key = cacheKey(organizationId, group);

	// 1. Cache check
	const cached = seedCache.get(key);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return;
	}

	// 2. Existence check — fast path for already-seeded organizations
	const expectedSystemCount =
		group === "EXPENSE" ? EXPENSE_CATEGORIES.length : 0;

	if (expectedSystemCount === 0) {
		// Unknown group — nothing to seed. Cache to avoid repeated checks.
		seedCache.set(key, { timestamp: Date.now() });
		return;
	}

	const existingSystemCount = await db.orgCategory.count({
		where: {
			organizationId,
			group,
			isSystem: true,
		},
	});

	if (existingSystemCount >= expectedSystemCount) {
		// Fully seeded — cache and return
		seedCache.set(key, { timestamp: Date.now() });
		return;
	}

	// 3. Seed missing categories (gap-fill via per-systemId check)
	if (group === "EXPENSE") {
		await seedExpenseCategories(organizationId);
	}

	seedCache.set(key, { timestamp: Date.now() });
}

// ────────────────────────────────────────────────
// EXPENSE group seeder
// ────────────────────────────────────────────────
async function seedExpenseCategories(organizationId: string): Promise<void> {
	// Build a Set of already-seeded systemIds so we can skip them
	const existing = await db.orgCategory.findMany({
		where: {
			organizationId,
			group: "EXPENSE",
			systemId: { not: null },
		},
		select: { systemId: true },
	});
	const existingSystemIds = new Set(
		existing.map((c) => c.systemId).filter((id): id is string => id !== null),
	);

	for (const [catIdx, cat] of EXPENSE_CATEGORIES.entries()) {
		if (existingSystemIds.has(cat.id)) continue;

		// Atomic per-category: nested write creates the main category and
		// all its subcategories in one implicit transaction. If this single
		// create fails, no orphan subcategories are left behind.
		await db.orgCategory.create({
			data: {
				organizationId,
				group: "EXPENSE",
				systemId: cat.id,
				nameAr: cat.nameAr,
				nameEn: cat.nameEn,
				accountCode: cat.accountCode,
				isVatExempt: cat.isVatExempt,
				isSystem: true,
				isActive: true,
				sortOrder: catIdx * 10,
				subcategories: {
					create: cat.subcategories.map((sub, subIdx) => ({
						organizationId,
						systemId: sub.id,
						nameAr: sub.nameAr,
						nameEn: sub.nameEn,
						isLabor: sub.isLabor,
						isSystem: true,
						isActive: true,
						sortOrder: subIdx * 10,
					})),
				},
			},
		});
	}
}
