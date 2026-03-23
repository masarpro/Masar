// ═══════════════════════════════════════════════════════════════
// Accounting Excel Export — تصدير التقارير المحاسبية
// ═══════════════════════════════════════════════════════════════

const BORDER_THIN = {
	top: { style: "thin", color: { rgb: "D1D5DB" } },
	bottom: { style: "thin", color: { rgb: "D1D5DB" } },
	left: { style: "thin", color: { rgb: "D1D5DB" } },
	right: { style: "thin", color: { rgb: "D1D5DB" } },
} as const;

const STYLES = {
	title: {
		font: { bold: true, sz: 14, color: { rgb: "1E3A5F" } },
		alignment: { horizontal: "center", vertical: "center" } as const,
		fill: { fgColor: { rgb: "EFF6FF" } },
	},
	header: {
		font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
		fill: { fgColor: { rgb: "374151" } },
		alignment: { horizontal: "center", vertical: "center" } as const,
		border: BORDER_THIN,
	},
	cell: {
		font: { sz: 10 },
		border: BORDER_THIN,
		alignment: { vertical: "center" } as const,
	},
	number: {
		font: { sz: 10 },
		border: BORDER_THIN,
		alignment: { horizontal: "right", vertical: "center" } as const,
		numFmt: "#,##0.00",
	},
	totalRow: {
		font: { bold: true, sz: 10 },
		fill: { fgColor: { rgb: "F3F4F6" } },
		border: BORDER_THIN,
		alignment: { horizontal: "right", vertical: "center" } as const,
		numFmt: "#,##0.00",
	},
};

function cellAddr(r: number, c: number): string {
	const col = String.fromCharCode(65 + c);
	return `${col}${r + 1}`;
}

function setCell(ws: any, r: number, c: number, value: any, style?: any) {
	const addr = cellAddr(r, c);
	ws[addr] = { v: value, t: typeof value === "number" ? "n" : "s", s: style ?? STYLES.cell };
}

function mergeRange(ws: any, r1: number, c1: number, r2: number, c2: number) {
	if (!ws["!merges"]) ws["!merges"] = [];
	ws["!merges"].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}

function setRTL(ws: any) {
	ws["!SheetView"] = [{ rightToLeft: true }];
}

// ════════════════════════════════════════════════════
// Trial Balance Export
// ════════════════════════════════════════════════════

export async function exportTrialBalanceToExcel(
	data: {
		rows: Array<{ accountCode: string; accountName: string; periodDebit: number; periodCredit: number; balanceDebit: number; balanceCredit: number }>;
		totals: { periodDebit: number; periodCredit: number; balanceDebit: number; balanceCredit: number };
	},
	orgName?: string,
) {
	const XLSX = await import("xlsx-js-style");
	const ws: any = {};
	let row = 0;

	// Title
	setCell(ws, row, 0, orgName ?? "ميزان المراجعة", STYLES.title);
	mergeRange(ws, 0, 0, 0, 5);
	row += 2;

	// Headers
	const headers = ["رمز الحساب", "اسم الحساب", "مدين (حركة)", "دائن (حركة)", "رصيد مدين", "رصيد دائن"];
	headers.forEach((h, c) => setCell(ws, row, c, h, STYLES.header));
	row++;

	// Data rows
	for (const r of data.rows) {
		setCell(ws, row, 0, r.accountCode, STYLES.cell);
		setCell(ws, row, 1, r.accountName, STYLES.cell);
		setCell(ws, row, 2, r.periodDebit, STYLES.number);
		setCell(ws, row, 3, r.periodCredit, STYLES.number);
		setCell(ws, row, 4, r.balanceDebit, STYLES.number);
		setCell(ws, row, 5, r.balanceCredit, STYLES.number);
		row++;
	}

	// Totals
	setCell(ws, row, 0, "الإجمالي", STYLES.totalRow);
	setCell(ws, row, 1, "", STYLES.totalRow);
	setCell(ws, row, 2, data.totals.periodDebit, STYLES.totalRow);
	setCell(ws, row, 3, data.totals.periodCredit, STYLES.totalRow);
	setCell(ws, row, 4, data.totals.balanceDebit, STYLES.totalRow);
	setCell(ws, row, 5, data.totals.balanceCredit, STYLES.totalRow);

	ws["!ref"] = `A1:${cellAddr(row, 5)}`;
	ws["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
	setRTL(ws);

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "ميزان المراجعة");
	XLSX.writeFile(wb, `trial-balance-${new Date().toISOString().split("T")[0]}.xlsx`);
}

// ════════════════════════════════════════════════════
// Journal Entries Export
// ════════════════════════════════════════════════════

export async function exportJournalEntriesToExcel(
	entries: Array<{
		entryNo: string;
		date: string | Date;
		description: string;
		referenceType: string | null;
		totalAmount: number;
		status: string;
	}>,
	orgName?: string,
) {
	const XLSX = await import("xlsx-js-style");
	const ws: any = {};
	let row = 0;

	setCell(ws, row, 0, orgName ?? "القيود اليومية", STYLES.title);
	mergeRange(ws, 0, 0, 0, 5);
	row += 2;

	const headers = ["رقم القيد", "التاريخ", "الوصف", "النوع", "المبلغ", "الحالة"];
	headers.forEach((h, c) => setCell(ws, row, c, h, STYLES.header));
	row++;

	for (const e of entries) {
		setCell(ws, row, 0, e.entryNo, STYLES.cell);
		setCell(ws, row, 1, new Date(e.date).toLocaleDateString("en-SA"), STYLES.cell);
		setCell(ws, row, 2, e.description, STYLES.cell);
		setCell(ws, row, 3, e.referenceType ?? "يدوي", STYLES.cell);
		setCell(ws, row, 4, e.totalAmount, STYLES.number);
		setCell(ws, row, 5, e.status === "POSTED" ? "مرحّل" : e.status === "DRAFT" ? "مسودة" : "معكوس", STYLES.cell);
		row++;
	}

	ws["!ref"] = `A1:${cellAddr(row - 1, 5)}`;
	ws["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];
	setRTL(ws);

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "القيود اليومية");
	XLSX.writeFile(wb, `journal-entries-${new Date().toISOString().split("T")[0]}.xlsx`);
}

// ════════════════════════════════════════════════════
// Account Ledger Export
// ════════════════════════════════════════════════════

export async function exportAccountLedgerToExcel(
	accountName: string,
	openingBalance: number,
	entries: Array<{
		date: string | Date;
		entryNo: string;
		description: string;
		debit: number;
		credit: number;
		runningBalance: number;
	}>,
	totals: { totalDebit: number; totalCredit: number; closingBalance: number },
	orgName?: string,
) {
	const XLSX = await import("xlsx-js-style");
	const ws: any = {};
	let row = 0;

	setCell(ws, row, 0, `${orgName ? orgName + " — " : ""}دفتر الأستاذ: ${accountName}`, STYLES.title);
	mergeRange(ws, 0, 0, 0, 5);
	row += 2;

	const headers = ["التاريخ", "رقم القيد", "الوصف", "مدين", "دائن", "الرصيد"];
	headers.forEach((h, c) => setCell(ws, row, c, h, STYLES.header));
	row++;

	// Opening balance
	setCell(ws, row, 0, "الرصيد الافتتاحي", STYLES.totalRow);
	setCell(ws, row, 1, "", STYLES.totalRow);
	setCell(ws, row, 2, "", STYLES.totalRow);
	setCell(ws, row, 3, 0, STYLES.totalRow);
	setCell(ws, row, 4, 0, STYLES.totalRow);
	setCell(ws, row, 5, openingBalance, STYLES.totalRow);
	row++;

	for (const e of entries) {
		setCell(ws, row, 0, new Date(e.date).toLocaleDateString("en-SA"), STYLES.cell);
		setCell(ws, row, 1, e.entryNo, STYLES.cell);
		setCell(ws, row, 2, e.description, STYLES.cell);
		setCell(ws, row, 3, e.debit, STYLES.number);
		setCell(ws, row, 4, e.credit, STYLES.number);
		setCell(ws, row, 5, e.runningBalance, STYLES.number);
		row++;
	}

	// Closing balance
	setCell(ws, row, 0, "الرصيد الختامي", STYLES.totalRow);
	setCell(ws, row, 1, "", STYLES.totalRow);
	setCell(ws, row, 2, "", STYLES.totalRow);
	setCell(ws, row, 3, totals.totalDebit, STYLES.totalRow);
	setCell(ws, row, 4, totals.totalCredit, STYLES.totalRow);
	setCell(ws, row, 5, totals.closingBalance, STYLES.totalRow);

	ws["!ref"] = `A1:${cellAddr(row, 5)}`;
	ws["!cols"] = [{ wch: 12 }, { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
	setRTL(ws);

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "دفتر الأستاذ");
	XLSX.writeFile(wb, `ledger-${accountName}-${new Date().toISOString().split("T")[0]}.xlsx`);
}
