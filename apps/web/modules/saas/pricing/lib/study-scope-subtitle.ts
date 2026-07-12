// ════════════════════════════════════════════════════════════════
// Study header subtitle derived from the study's workScopes.
//
// Replaces the previously hardcoded "الأعمال الإنشائية — …" line in
// StudyHeaderCard which showed for every study regardless of scope.
// Keys live under pricing.studies.scopeSubtitle in ar.json/en.json.
// ════════════════════════════════════════════════════════════════

const KNOWN_SCOPES = ["STRUCTURAL", "FINISHING", "MEP", "CUSTOM"] as const;

type TranslateFn = (key: string) => string;

/**
 * Returns the localized one-line description for a study:
 * - single scope  → its dedicated description
 * - multi scope   → "تشطيبات + كهروميكانيكية — حصر الكميات والتسعير"
 * - no scopes     → neutral generic description (legacy studies)
 */
export function getStudyScopeSubtitle(
	t: TranslateFn,
	workScopes: string[] | null | undefined,
): string {
	const scopes = (workScopes ?? []).filter((s) =>
		(KNOWN_SCOPES as readonly string[]).includes(s),
	);

	if (scopes.length === 0) {
		return t("pricing.studies.scopeSubtitle.generic");
	}
	if (scopes.length === 1) {
		return t(`pricing.studies.scopeSubtitle.${scopes[0]}`);
	}
	const names = scopes.map((s) =>
		t(`pricing.studies.scopeSubtitle.names.${s}`),
	);
	return `${names.join(" + ")} — ${t("pricing.studies.scopeSubtitle.multiSuffix")}`;
}
