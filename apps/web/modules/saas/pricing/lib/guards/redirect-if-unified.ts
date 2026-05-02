// ════════════════════════════════════════════════════════════════
// Server-side guard for legacy stage routes.
//
// The Unified Quantities workspace replaces the 4-stage pipeline
// (Specifications → Costing → Pricing → Quotation) with a single
// page at /quantities. When a study is in unified mode and a user
// (or a stale link, or an old sidebar item) hits one of those legacy
// routes, this helper redirects them back to /quantities so the old
// pages never render.
//
// This runs at request time inside Server Components, so we hit the
// DB directly rather than going through oRPC.
// ════════════════════════════════════════════════════════════════

import "server-only";
import { db } from "@repo/database";
import { redirect } from "next/navigation";
import { isUnifiedStudy } from "../unified-flag";

export async function redirectIfUnified(
	organizationSlug: string,
	studyId: string,
	organizationId: string,
) {
	const study = await db.costStudy.findFirst({
		where: { id: studyId, organizationId },
		select: { workScopes: true },
	});

	if (study && isUnifiedStudy({ workScopes: study.workScopes })) {
		redirect(
			`/app/${organizationSlug}/pricing/studies/${studyId}/quantities`,
		);
	}
}
