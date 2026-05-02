// ════════════════════════════════════════════════════════════════
// Unified Quantities feature gate.
//
// A study is "unified" (i.e. uses the new single-page workspace
// instead of the old 4-stage pipeline) when:
//   1. The build-time env flag is on (read by both client and server
//      via NEXT_PUBLIC_…), AND
//   2. The study has FINISHING or MEP work scopes (or no scopes set —
//      treated as legacy/default which we now opt-in for the unified
//      experience).
//
// When unified:
//   - Tabs in the Quantities page hide the legacy `finishing` + `mep`
//     editors and show a single "تشطيبات + كهروميكانيكا" workspace.
//   - The 4 downstream stages (Specifications / Costing / Pricing /
//     Quotation) are collapsed into the unified workspace itself, so
//     useStudyConfig returns a single "quantities" stage.
//   - The route pages for /specifications, /costing, /pricing redirect
//     server-side back to /quantities.
//
// The structural engine and the CUSTOM (manual) tab are unaffected.
// ════════════════════════════════════════════════════════════════

export const UNIFIED_QUANTITIES_FLAG_ENABLED =
	process.env.NEXT_PUBLIC_FEATURE_UNIFIED_QUANTITIES === "1";

interface StudyShape {
	workScopes?: string[] | null;
}

/**
 * Returns true when the given study should use the unified workspace.
 * Safe to call on the server (uses public env var inlined at build time).
 */
export function isUnifiedStudy(study: StudyShape | null | undefined): boolean {
	if (!UNIFIED_QUANTITIES_FLAG_ENABLED) return false;
	const scopes = study?.workScopes ?? [];
	if (scopes.length === 0) {
		// legacy / unset: opt-in to unified by default when the flag is on
		return true;
	}
	return scopes.includes("FINISHING") || scopes.includes("MEP");
}
