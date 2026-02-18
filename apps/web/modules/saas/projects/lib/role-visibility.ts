export type ProjectRole = "MANAGER" | "ENGINEER" | "SUPERVISOR" | "ACCOUNTANT" | "VIEWER";

/**
 * Map of which sections each role can see
 */
export const ROLE_SECTION_VISIBILITY: Record<ProjectRole, string[]> = {
	MANAGER: [
		"overview",
		"field",
		"supervisor",
		"finance",
		"finance/expenses",
		"finance/payments",
		"finance/claims",
		"timeline",
		"changes",
		"documents",
		"chat",
		"updates",
		"owner",
		"insights",
		"team",
	],
	ENGINEER: [
		"overview",
		"field",
		"finance",
		"timeline",
		"changes",
		"documents",
		"chat",
		"updates",
	],
	SUPERVISOR: [
		"overview",
		"field",
		"supervisor",
		"documents",
		"chat",
		"updates",
	],
	ACCOUNTANT: [
		"overview",
		"finance",
		"finance/expenses",
		"finance/payments",
		"finance/claims",
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
