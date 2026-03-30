export type ProjectRole = "MANAGER" | "ENGINEER" | "SUPERVISOR" | "ACCOUNTANT" | "VIEWER";

/**
 * Map of which sections each role can see
 */
export const ROLE_SECTION_VISIBILITY: Record<ProjectRole, string[]> = {
	MANAGER: [
		"overview",
		"execution",
		"finance",
		"finance/expenses",
		"finance/payments",
		"finance/claims",
		"finance/contract",
		"finance/subcontracts",
		"quantities",
		"changes",
		"documents",
		"chat",
		"updates",
		"owner",
		"insights",
		"team",
		"handover",
	],
	ENGINEER: [
		"overview",
		"execution",
		"finance",
		"finance/subcontracts",
		"quantities",
		"changes",
		"documents",
		"chat",
		"updates",
		"handover",
	],
	SUPERVISOR: [
		"overview",
		"execution",
		"quantities",
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
		"documents",
	],
	VIEWER: ["overview", "documents", "updates"],
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
