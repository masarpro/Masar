/**
 * Migration script: Populate categoryId from legacy category enum values.
 * Run once after schema migration adds categoryId/subcategoryId fields.
 *
 * Usage: npx tsx packages/database/scripts/migrate-expense-categories.ts
 */

import { db } from "../prisma/client";

// Inline maps to avoid cross-package dependency issues
const LEGACY_CATEGORY_MAP: Record<string, string> = {
	MATERIALS: "CONCRETE_STRUCTURAL",
	LABOR: "INDIRECT_LABOR",
	EQUIPMENT_RENTAL: "EQUIPMENT_MACHINERY",
	EQUIPMENT_PURCHASE: "EQUIPMENT_MACHINERY",
	SUBCONTRACTOR: "MISCELLANEOUS",
	TRANSPORT: "TRANSPORT_LOGISTICS",
	SALARIES: "ADMIN_SALARIES",
	RENT: "ADMIN_SALARIES",
	UTILITIES: "ADMIN_SALARIES",
	COMMUNICATIONS: "ADMIN_SALARIES",
	INSURANCE: "INSURANCE_GUARANTEES",
	LICENSES: "GOVERNMENT_LICENSES",
	BANK_FEES: "FINANCIAL_EXPENSES",
	FUEL: "TRANSPORT_LOGISTICS",
	MAINTENANCE: "MISCELLANEOUS",
	SUPPLIES: "ADMIN_SALARIES",
	MARKETING: "MARKETING_BUSINESS",
	TRAINING: "INDIRECT_LABOR",
	TRAVEL: "TRANSPORT_LOGISTICS",
	HOSPITALITY: "MISCELLANEOUS",
	LOAN_PAYMENT: "FINANCIAL_EXPENSES",
	TAXES: "FINANCIAL_EXPENSES",
	ZAKAT: "FINANCIAL_EXPENSES",
	REFUND: "MISCELLANEOUS",
	MISC: "MISCELLANEOUS",
	CUSTOM: "MISCELLANEOUS",
};

const LEGACY_COMPANY_CATEGORY_MAP: Record<string, string> = {
	RENT: "ADMIN_SALARIES",
	UTILITIES: "ADMIN_SALARIES",
	COMMUNICATIONS: "ADMIN_SALARIES",
	INSURANCE: "INSURANCE_GUARANTEES",
	LICENSES: "GOVERNMENT_LICENSES",
	SUBSCRIPTIONS: "ADMIN_SALARIES",
	MAINTENANCE: "MISCELLANEOUS",
	BANK_FEES: "FINANCIAL_EXPENSES",
	MARKETING: "MARKETING_BUSINESS",
	TRANSPORT: "TRANSPORT_LOGISTICS",
	HOSPITALITY: "MISCELLANEOUS",
	OTHER: "MISCELLANEOUS",
};

// db is imported from prisma/client singleton

async function main() {
	console.log("Starting expense category migration...\n");

	// 1. Migrate FinanceExpense records
	console.log("=== FinanceExpense ===");
	const expenses = await db.financeExpense.findMany({
		where: { categoryId: null },
		select: { id: true, category: true },
	});

	console.log(`Found ${expenses.length} expenses without categoryId`);

	// Group by old category for batch updates
	const groupedExpenses = new Map<string, string[]>();
	for (const exp of expenses) {
		const ids = groupedExpenses.get(exp.category) ?? [];
		ids.push(exp.id);
		groupedExpenses.set(exp.category, ids);
	}

	for (const [oldCategory, ids] of groupedExpenses) {
		const newCategoryId = LEGACY_CATEGORY_MAP[oldCategory] ?? "MISCELLANEOUS";
		const result = await db.financeExpense.updateMany({
			where: { id: { in: ids } },
			data: { categoryId: newCategoryId },
		});
		console.log(`  ${oldCategory} -> ${newCategoryId}: ${result.count} records`);
	}

	// 2. Migrate CompanyExpense records
	console.log("\n=== CompanyExpense ===");
	const companyExpenses = await db.companyExpense.findMany({
		where: { categoryId: null },
		select: { id: true, category: true },
	});

	console.log(`Found ${companyExpenses.length} company expenses without categoryId`);

	const groupedCompany = new Map<string, string[]>();
	for (const exp of companyExpenses) {
		const ids = groupedCompany.get(exp.category) ?? [];
		ids.push(exp.id);
		groupedCompany.set(exp.category, ids);
	}

	for (const [oldCategory, ids] of groupedCompany) {
		const newCategoryId = LEGACY_COMPANY_CATEGORY_MAP[oldCategory] ?? "MISCELLANEOUS";
		const result = await db.companyExpense.updateMany({
			where: { id: { in: ids } },
			data: { categoryId: newCategoryId },
		});
		console.log(`  ${oldCategory} -> ${newCategoryId}: ${result.count} records`);
	}

	console.log("\nMigration complete!");
}

main()
	.catch((e) => {
		console.error("Migration failed:", e);
		process.exit(1);
	});
