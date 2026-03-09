// ══════════════════════════════════════════════════════════════
// Unified Pricing Calculations
// ══════════════════════════════════════════════════════════════

/**
 * Calculate costs for an item with material price, labor price, and wastage
 */
export function calculateItemCosts(
	quantity: number,
	materialPrice: number,
	laborPrice: number,
	wastagePercent: number,
): { materialCost: number; laborCost: number; totalCost: number } {
	const wastageMultiplier = 1 + wastagePercent / 100;
	const materialCost = quantity * materialPrice * wastageMultiplier;
	const laborCost = quantity * laborPrice;
	const totalCost = materialCost + laborCost;
	return { materialCost, laborCost, totalCost };
}

/**
 * Calculate section total from items array
 */
export function calculateSectionTotal(
	items: Array<{ totalCost: number; isEnabled?: boolean }>,
): number {
	return items
		.filter((i) => i.isEnabled !== false)
		.reduce((sum, item) => sum + item.totalCost, 0);
}

/**
 * Calculate grand total with overhead, profit, contingency, and VAT
 */
export function calculateGrandTotal(
	directCost: number,
	overheadPercent: number,
	profitPercent: number,
	contingencyPercent: number,
	vatIncluded: boolean,
): {
	overhead: number;
	profit: number;
	contingency: number;
	subtotal: number;
	vat: number;
	grandTotal: number;
} {
	const overhead = directCost * (overheadPercent / 100);
	const profit = directCost * (profitPercent / 100);
	const contingency = directCost * (contingencyPercent / 100);
	const subtotal = directCost + overhead + profit + contingency;
	const vat = vatIncluded ? subtotal * 0.15 : 0;
	const grandTotal = subtotal + vat;
	return { overhead, profit, contingency, subtotal, vat, grandTotal };
}
