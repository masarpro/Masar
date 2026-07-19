export type ProjectRole = "MANAGER" | "ENGINEER" | "SUPERVISOR" | "ACCOUNTANT" | "VIEWER";

/**
 * Map of which sections each role can see
 */
export const ROLE_SECTION_VISIBILITY: Record<ProjectRole, string[]> = {
	MANAGER: [
		"overview",
		"execution",
		"reports",
		"finance",
		"finance/expenses",
		"finance/payments",
		"finance/claims",
		"finance/contract",
		"finance/subcontracts",
		"quantities",
		"photos",
		"changes",
		"documents",
		"chat",
		"updates",
		"owner",
		"insights",
		"team",
		"handover",
	],
	// المهندس لا يرى أي قسم مالي — قرار سياسة 2026-07-18 (تدقيق الصلاحيات):
	// الأقسام المالية تُمنح من إعدادات الأعضاء (viewFinance) وليس من هذا الدور
	ENGINEER: [
		"overview",
		"execution",
		"reports",
		"quantities",
		"photos",
		"changes",
		"documents",
		"chat",
		"updates",
		"handover",
	],
	SUPERVISOR: [
		"overview",
		"execution",
		"reports",
		"quantities",
		"photos",
		"documents",
		"chat",
		"updates",
		"handover",
	],
	ACCOUNTANT: [
		"overview",
		"finance",
		"finance/expenses",
		"finance/payments",
		"finance/claims",
		"finance/contract",
		"finance/subcontracts",
		"quantities",
		"photos",
		"documents",
	],
	VIEWER: ["overview", "photos", "documents", "updates"],
};

/**
 * Check if a role can view a specific section
 */
export function canRoleViewSection(
	role: ProjectRole,
	section: string,
): boolean {
	const visibleSections = ROLE_SECTION_VISIBILITY[role];
	if (!visibleSections) return false;
	return visibleSections.includes(section);
}

/**
 * Get all visible sections for a role
 */
export function getVisibleSections(role: ProjectRole): string[] {
	return ROLE_SECTION_VISIBILITY[role] ?? [];
}
