/**
 * Data Migration Script: Create StudyStage records for existing CostStudies
 *
 * This script ensures every CostStudy has 6 StudyStage records
 * with statuses migrated from the old flat fields.
 *
 * Run with: pnpm tsx packages/database/prisma/scripts/seed-study-stages.ts
 */

import { db } from "../client";

const STAGE_ORDER = [
	{ stage: "QUANTITIES" as const, sortOrder: 1, statusField: "quantitiesStatus", assigneeField: "quantitiesAssigneeId" },
	{ stage: "SPECIFICATIONS" as const, sortOrder: 2, statusField: "specsStatus", assigneeField: "specsAssigneeId" },
	{ stage: "COSTING" as const, sortOrder: 3, statusField: "costingStatus", assigneeField: "costingAssigneeId" },
	{ stage: "PRICING" as const, sortOrder: 4, statusField: "pricingStatus", assigneeField: "pricingAssigneeId" },
	{ stage: "QUOTATION" as const, sortOrder: 5, statusField: "quotationStatus", assigneeField: null },
	{ stage: "CONVERSION" as const, sortOrder: 6, statusField: null, assigneeField: null },
] as const;

async function migrate() {
	console.log("🔄 Starting StudyStage migration...\n");

	// Get all cost studies
	const studies = await db.costStudy.findMany({
		select: {
			id: true,
			quantitiesStatus: true,
			specsStatus: true,
			costingStatus: true,
			pricingStatus: true,
			quotationStatus: true,
			quantitiesAssigneeId: true,
			specsAssigneeId: true,
			costingAssigneeId: true,
			pricingAssigneeId: true,
			_count: { select: { stages: true } },
		},
	});

	console.log(`Found ${studies.length} cost study(ies)\n`);

	let created = 0;
	let skipped = 0;
	let errors = 0;

	for (const study of studies) {
		// Skip if stages already exist
		if (study._count.stages > 0) {
			console.log(`  ⏭️  Study ${study.id} already has ${study._count.stages} stages — skipping`);
			skipped++;
			continue;
		}

		try {
			const studyRecord = study as Record<string, unknown>;

			await db.studyStage.createMany({
				data: STAGE_ORDER.map((def) => ({
					costStudyId: study.id,
					stage: def.stage,
					status: def.statusField
						? (studyRecord[def.statusField] as "NOT_STARTED" | "DRAFT" | "IN_REVIEW" | "APPROVED") ?? "NOT_STARTED"
						: "NOT_STARTED",
					assigneeId: def.assigneeField
						? (studyRecord[def.assigneeField] as string | null) ?? null
						: null,
					sortOrder: def.sortOrder,
				})),
			});

			console.log(`  ✅ Study ${study.id} — created 6 stages`);
			created++;
		} catch (err) {
			console.error(`  ❌ Study ${study.id} — error:`, err);
			errors++;
		}
	}

	console.log(`\n✅ Migration complete: ${created} migrated, ${skipped} skipped, ${errors} errors`);
}

migrate()
	.catch((err) => {
		console.error("Fatal error:", err);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});
