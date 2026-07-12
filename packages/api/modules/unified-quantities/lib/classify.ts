// ════════════════════════════════════════════════════════════════
// Unified Quantities — تصنيف الدراسة (نسخة السيرفر)
// يجب أن يطابق قاعدة الواجهة في
// apps/web/modules/saas/pricing/lib/unified-flag.ts حرفياً.
// ════════════════════════════════════════════════════════════════

/** أنواع التسعير فقط — لا تمر بمرحلة الكميات فلا تُصنّف موحّدة أبداً */
const PRICING_ONLY_STUDY_TYPES = new Set([
	"QUICK_PRICING",
	"CUSTOM_ITEMS",
	"LUMP_SUM_ANALYSIS",
]);

export interface UnifiedClassifyInput {
	workScopes?: string[] | null;
	studyType?: string | null;
}

/**
 * الدراسة موحّدة عندما: العلم مفعّل، وليست نوع تسعير-فقط،
 * و(لا نطاقات محددة أو تشمل FINISHING/MEP).
 */
export function isUnifiedStudyServer(study: UnifiedClassifyInput): boolean {
	if (process.env.NEXT_PUBLIC_FEATURE_UNIFIED_QUANTITIES !== "1") return false;
	if (study.studyType && PRICING_ONLY_STUDY_TYPES.has(study.studyType)) {
		return false;
	}
	const scopes = Array.isArray(study.workScopes) ? study.workScopes : [];
	return (
		scopes.length === 0 ||
		scopes.includes("FINISHING") ||
		scopes.includes("MEP")
	);
}

/**
 * هل تحتفظ الدراسة الموحّدة بمسار المراحل القديم (مواصفات → تسعير
 * تكلفة → تسعير) لأعمالها الإنشائية/اليدوية؟ التشطيبات وMEP تُسعَّر
 * داخل مساحة العمل الموحدة، أما STRUCTURAL/CUSTOM فما زالا يعتمدان
 * على مسار المراحل.
 */
export function hasLegacyPipelineScopes(
	workScopes?: string[] | null,
): boolean {
	const scopes = Array.isArray(workScopes) ? workScopes : [];
	return scopes.includes("STRUCTURAL") || scopes.includes("CUSTOM");
}
