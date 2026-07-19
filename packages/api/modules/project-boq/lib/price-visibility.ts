import type { Permissions } from "@repo/database/prisma/permissions";

/**
 * BOQ quantities are visible to anyone with quantities.view, but prices
 * (unit/total/grand totals) are financial data. Only members with project
 * finance visibility or quantities-pricing rights may see them — everyone
 * else gets the quantities with the money fields stripped server-side.
 */
export function canViewBoqPrices(permissions: Permissions): boolean {
	return (
		(permissions.projects?.viewFinance ?? false) ||
		(permissions.quantities?.pricing ?? false)
	);
}
