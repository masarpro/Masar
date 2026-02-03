// ═══════════════════════════════════════════════════════════════════════════
// CSV Generator (Phase 8)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert an array of objects to CSV string
 */
export function objectsToCsv<T extends Record<string, unknown>>(
	data: T[],
	columns: { key: keyof T; header: string }[],
): string {
	if (data.length === 0) {
		return columns.map((c) => `"${c.header}"`).join(",");
	}

	// Header row
	const headerRow = columns.map((c) => `"${c.header}"`).join(",");

	// Data rows
	const dataRows = data.map((row) => {
		return columns
			.map((c) => {
				const value = row[c.key];
				if (value === null || value === undefined) {
					return '""';
				}
				if (value instanceof Date) {
					return `"${value.toISOString()}"`;
				}
				if (typeof value === "object") {
					return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
				}
				return `"${String(value).replace(/"/g, '""')}"`;
			})
			.join(",");
	});

	return [headerRow, ...dataRows].join("\n");
}

/**
 * Generate expenses CSV
 */
export interface ExpenseCSVRow {
	date: Date;
	category: string;
	amount: number;
	vendor: string | null;
	note: string | null;
	createdBy: string;
}

export function generateExpensesCsv(
	expenses: ExpenseCSVRow[],
	language: "ar" | "en",
): string {
	const columns =
		language === "ar"
			? [
					{ key: "date" as const, header: "التاريخ" },
					{ key: "category" as const, header: "الفئة" },
					{ key: "amount" as const, header: "المبلغ" },
					{ key: "vendor" as const, header: "المورد" },
					{ key: "note" as const, header: "ملاحظات" },
					{ key: "createdBy" as const, header: "بواسطة" },
				]
			: [
					{ key: "date" as const, header: "Date" },
					{ key: "category" as const, header: "Category" },
					{ key: "amount" as const, header: "Amount" },
					{ key: "vendor" as const, header: "Vendor" },
					{ key: "note" as const, header: "Note" },
					{ key: "createdBy" as const, header: "Created By" },
				];

	return objectsToCsv(expenses, columns);
}

/**
 * Generate claims CSV
 */
export interface ClaimCSVRow {
	claimNumber: number;
	periodStart: Date;
	periodEnd: Date;
	amount: number;
	status: string;
	note: string | null;
	dueDate: Date | null;
}

export function generateClaimsCsv(
	claims: ClaimCSVRow[],
	language: "ar" | "en",
): string {
	const columns =
		language === "ar"
			? [
					{ key: "claimNumber" as const, header: "رقم المستخلص" },
					{ key: "periodStart" as const, header: "بداية الفترة" },
					{ key: "periodEnd" as const, header: "نهاية الفترة" },
					{ key: "amount" as const, header: "المبلغ" },
					{ key: "status" as const, header: "الحالة" },
					{ key: "dueDate" as const, header: "تاريخ الاستحقاق" },
					{ key: "note" as const, header: "ملاحظات" },
				]
			: [
					{ key: "claimNumber" as const, header: "Claim #" },
					{ key: "periodStart" as const, header: "Period Start" },
					{ key: "periodEnd" as const, header: "Period End" },
					{ key: "amount" as const, header: "Amount" },
					{ key: "status" as const, header: "Status" },
					{ key: "dueDate" as const, header: "Due Date" },
					{ key: "note" as const, header: "Note" },
				];

	return objectsToCsv(claims, columns);
}

/**
 * Generate issues CSV
 */
export interface IssueCSVRow {
	title: string;
	description: string | null;
	priority: string;
	status: string;
	category: string;
	createdAt: Date;
	resolvedAt: Date | null;
	reportedBy: string;
}

export function generateIssuesCsv(
	issues: IssueCSVRow[],
	language: "ar" | "en",
): string {
	const columns =
		language === "ar"
			? [
					{ key: "title" as const, header: "العنوان" },
					{ key: "description" as const, header: "الوصف" },
					{ key: "priority" as const, header: "الأولوية" },
					{ key: "status" as const, header: "الحالة" },
					{ key: "category" as const, header: "الفئة" },
					{ key: "createdAt" as const, header: "تاريخ الإنشاء" },
					{ key: "resolvedAt" as const, header: "تاريخ الحل" },
					{ key: "reportedBy" as const, header: "بلّغ بواسطة" },
				]
			: [
					{ key: "title" as const, header: "Title" },
					{ key: "description" as const, header: "Description" },
					{ key: "priority" as const, header: "Priority" },
					{ key: "status" as const, header: "Status" },
					{ key: "category" as const, header: "Category" },
					{ key: "createdAt" as const, header: "Created At" },
					{ key: "resolvedAt" as const, header: "Resolved At" },
					{ key: "reportedBy" as const, header: "Reported By" },
				];

	return objectsToCsv(issues, columns);
}
