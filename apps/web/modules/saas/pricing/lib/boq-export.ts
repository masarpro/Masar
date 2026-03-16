// ═══════════════════════════════════════════════════════════════
// BOQ Export - تصدير جدول الكميات (Excel)
// ═══════════════════════════════════════════════════════════════

import type { BOQSummary, FactoryOrderEntry } from "./boq-aggregator";
import type { CuttingDetailRow } from "./boq-recalculator";

// ─────────────────────────────────────────────────────────────
// Shared style definitions
// ─────────────────────────────────────────────────────────────

const BORDER_THIN = {
	top: { style: "thin", color: { rgb: "D1D5DB" } },
	bottom: { style: "thin", color: { rgb: "D1D5DB" } },
	left: { style: "thin", color: { rgb: "D1D5DB" } },
	right: { style: "thin", color: { rgb: "D1D5DB" } },
} as const;

const BORDER_MEDIUM = {
	top: { style: "medium", color: { rgb: "9CA3AF" } },
	bottom: { style: "medium", color: { rgb: "9CA3AF" } },
	left: { style: "thin", color: { rgb: "D1D5DB" } },
	right: { style: "thin", color: { rgb: "D1D5DB" } },
} as const;

const STYLES = {
	title: {
		font: { bold: true, sz: 16, color: { rgb: "1E3A5F" } },
		alignment: { horizontal: "center", vertical: "center" } as const,
		fill: { fgColor: { rgb: "EFF6FF" } },
	},
	sectionHeader: {
		font: { bold: true, sz: 12, color: { rgb: "1E3A5F" } },
		fill: { fgColor: { rgb: "F0F4FF" } },
		alignment: { horizontal: "right", vertical: "center" } as const,
		border: BORDER_THIN,
	},
	subHeader: {
		font: { bold: true, sz: 10, color: { rgb: "4B5563" } },
		fill: { fgColor: { rgb: "F9FAFB" } },
		alignment: { horizontal: "right", vertical: "center" } as const,
		border: BORDER_THIN,
	},
	colHeader: {
		font: { bold: true, sz: 10, color: { rgb: "374151" } },
		fill: { fgColor: { rgb: "F1F5F9" } },
		alignment: { horizontal: "center", vertical: "center" } as const,
		border: BORDER_THIN,
	},
	cell: {
		font: { sz: 10 },
		alignment: { horizontal: "right", vertical: "center" } as const,
		border: BORDER_THIN,
	},
	cellNumber: {
		font: { sz: 10 },
		alignment: { horizontal: "left", vertical: "center" } as const,
		border: BORDER_THIN,
		numFmt: "#,##0.00",
	},
	cellInt: {
		font: { sz: 10 },
		alignment: { horizontal: "left", vertical: "center" } as const,
		border: BORDER_THIN,
		numFmt: "#,##0",
	},
	sectionTotal: {
		font: { bold: true, sz: 10, color: { rgb: "1E3A5F" } },
		fill: { fgColor: { rgb: "E0E7FF" } },
		alignment: { horizontal: "right", vertical: "center" } as const,
		border: BORDER_THIN,
	},
	sectionTotalNumber: {
		font: { bold: true, sz: 10, color: { rgb: "1E3A5F" } },
		fill: { fgColor: { rgb: "E0E7FF" } },
		alignment: { horizontal: "left", vertical: "center" } as const,
		border: BORDER_THIN,
		numFmt: "#,##0.00",
	},
	grandTotal: {
		font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
		fill: { fgColor: { rgb: "1E40AF" } },
		alignment: { horizontal: "right", vertical: "center" } as const,
		border: BORDER_MEDIUM,
	},
	grandTotalNumber: {
		font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
		fill: { fgColor: { rgb: "1E40AF" } },
		alignment: { horizontal: "left", vertical: "center" } as const,
		border: BORDER_MEDIUM,
		numFmt: "#,##0.00",
	},
	diameterHeader: {
		font: { bold: true, sz: 11, color: { rgb: "92400E" } },
		fill: { fgColor: { rgb: "FEF3C7" } },
		alignment: { horizontal: "right", vertical: "center" } as const,
		border: BORDER_THIN,
	},
};

// ─────────────────────────────────────────────────────────────
// Utility helpers (no external dependency)
// ─────────────────────────────────────────────────────────────

/** Convert 0-based (row, col) to "A1"-style address */
function cellAddr(r: number, c: number): string {
	let col = "";
	let n = c;
	do {
		col = String.fromCharCode(65 + (n % 26)) + col;
		n = Math.floor(n / 26) - 1;
	} while (n >= 0);
	return col + (r + 1);
}

function setCell(ws: any, r: number, c: number, value: any, style: any) {
	const addr = cellAddr(r, c);
	ws[addr] = { v: value, t: typeof value === "number" ? "n" : "s", s: style };
}

function mergeRange(ws: any, r1: number, c1: number, r2: number, c2: number) {
	if (!ws["!merges"]) ws["!merges"] = [];
	ws["!merges"].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}

function setSheetRange(ws: any, maxRow: number, maxCol: number) {
	ws["!ref"] = `A1:${cellAddr(maxRow, maxCol)}`;
}

function setRTL(ws: any) {
	ws["!views"] = [{ RTL: true }];
}

function fmt(n: number, decimals = 2): number {
	return Number(n.toFixed(decimals));
}

// ─────────────────────────────────────────────────────────────
// Main BOQ Excel Export (3 sheets)
// ─────────────────────────────────────────────────────────────

export async function exportBOQToExcel(summary: BOQSummary, studyName?: string) {
	const XLSX = await import("xlsx-js-style");

	const wb = XLSX.utils.book_new();

	buildSummarySheet(XLSX, wb, summary);
	buildFactorySheet(XLSX, wb, summary.factoryOrder);
	buildCuttingSheet(XLSX, wb, summary.allCuttingDetails);

	const fileName = studyName
		? `جدول_كميات_${studyName}_${new Date().toISOString().slice(0, 10)}.xlsx`
		: `جدول_كميات_${new Date().toISOString().slice(0, 10)}.xlsx`;

	XLSX.writeFile(wb, fileName);
}

// ─────────────────────────────────────────────────────────────
// Sheet 1: BOQ Summary
// ─────────────────────────────────────────────────────────────

function buildSummarySheet(XLSX: any, wb: any, summary: BOQSummary) {
	const ws: any = {};
	const colCount = 6;
	const cols = ["القسم", "العنصر", "الكمية", "الخرسانة (م³)", "الحديد (كجم)", "البلوك"];
	let row = 0;

	// Title
	setCell(ws, row, 0, "جدول الكميات الإجمالي — ملخص", STYLES.title);
	for (let c = 1; c < colCount; c++) setCell(ws, row, c, "", STYLES.title);
	mergeRange(ws, row, 0, row, colCount - 1);
	row += 2;

	// Column headers
	for (let c = 0; c < colCount; c++) {
		setCell(ws, row, c, cols[c], STYLES.colHeader);
	}
	row++;

	for (const section of summary.sections) {
		// Section header
		setCell(ws, row, 0, section.icon + " " + section.label, STYLES.sectionHeader);
		for (let c = 1; c < colCount; c++) setCell(ws, row, c, "", STYLES.sectionHeader);
		mergeRange(ws, row, 0, row, colCount - 1);
		row++;

		for (const group of section.subGroups) {
			if (section.subGroups.length > 1) {
				setCell(ws, row, 0, "  " + group.label, STYLES.subHeader);
				for (let c = 1; c < colCount; c++) setCell(ws, row, c, "", STYLES.subHeader);
				mergeRange(ws, row, 0, row, colCount - 1);
				row++;
			}

			for (const detail of group.items) {
				setCell(ws, row, 0, "", STYLES.cell);
				setCell(ws, row, 1, detail.item.name, STYLES.cell);
				setCell(ws, row, 2, detail.item.quantity, STYLES.cellInt);
				setCell(ws, row, 3, fmt(detail.item.concreteVolume), STYLES.cellNumber);
				setCell(ws, row, 4, fmt(detail.item.steelWeight), STYLES.cellNumber);
				setCell(ws, row, 5, section.category === "blocks" ? detail.item.quantity : "", STYLES.cellInt);
				row++;
			}

			if (section.subGroups.length > 1) {
				setCell(ws, row, 0, "", STYLES.sectionTotal);
				setCell(ws, row, 1, "إجمالي " + group.label, STYLES.sectionTotal);
				setCell(ws, row, 2, "", STYLES.sectionTotal);
				setCell(ws, row, 3, fmt(group.concrete), STYLES.sectionTotalNumber);
				setCell(ws, row, 4, fmt(group.rebar), STYLES.sectionTotalNumber);
				setCell(ws, row, 5, group.blocks || "", STYLES.sectionTotal);
				row++;
			}
		}

		// Section total
		setCell(ws, row, 0, "", STYLES.sectionTotal);
		setCell(ws, row, 1, "إجمالي " + section.label, STYLES.sectionTotal);
		setCell(ws, row, 2, "", STYLES.sectionTotal);
		setCell(ws, row, 3, fmt(section.totalConcrete), STYLES.sectionTotalNumber);
		setCell(ws, row, 4, fmt(section.totalRebar), STYLES.sectionTotalNumber);
		setCell(ws, row, 5, section.totalBlocks || "", STYLES.sectionTotal);
		row++;
	}

	// Grand total
	row++;
	setCell(ws, row, 0, "", STYLES.grandTotal);
	setCell(ws, row, 1, "الإجمالي العام", STYLES.grandTotal);
	setCell(ws, row, 2, "", STYLES.grandTotal);
	setCell(ws, row, 3, summary.grandTotals.concrete, STYLES.grandTotalNumber);
	setCell(ws, row, 4, summary.grandTotals.rebar, STYLES.grandTotalNumber);
	setCell(ws, row, 5, summary.grandTotals.blocks || "", STYLES.grandTotal);

	setSheetRange(ws, row, colCount - 1);
	ws["!cols"] = [
		{ wch: 28 },
		{ wch: 32 },
		{ wch: 12 },
		{ wch: 16 },
		{ wch: 16 },
		{ wch: 14 },
	];
	ws["!rows"] = [{ hpt: 30 }];
	setRTL(ws);
	XLSX.utils.book_append_sheet(wb, ws, "ملخص الكميات");
}

// ─────────────────────────────────────────────────────────────
// Sheet 2: Factory Order
// ─────────────────────────────────────────────────────────────

function buildFactorySheet(XLSX: any, wb: any, factoryOrder: FactoryOrderEntry[]) {
	const ws: any = {};
	const colCount = 5;
	const cols = ["القطر (مم)", "طول السيخ (م)", "عدد الأسياخ", "الوزن (كجم)", "الوزن (طن)"];
	let row = 0;

	// Title
	setCell(ws, row, 0, "طلبية المصنع — حديد التسليح", STYLES.title);
	for (let c = 1; c < colCount; c++) setCell(ws, row, c, "", STYLES.title);
	mergeRange(ws, row, 0, row, colCount - 1);
	row += 2;

	// Column headers
	for (let c = 0; c < colCount; c++) {
		setCell(ws, row, c, cols[c], STYLES.colHeader);
	}
	row++;

	// Data rows
	for (const entry of factoryOrder) {
		setCell(ws, row, 0, "Ø" + entry.diameter, STYLES.cell);
		setCell(ws, row, 1, entry.stockLength, STYLES.cellInt);
		setCell(ws, row, 2, entry.count, STYLES.cellInt);
		setCell(ws, row, 3, fmt(entry.weight), STYLES.cellNumber);
		setCell(ws, row, 4, fmt(entry.weight / 1000, 3), STYLES.cellNumber);
		row++;
	}

	// Total row
	const totalBars = factoryOrder.reduce((s, e) => s + e.count, 0);
	const totalWeight = factoryOrder.reduce((s, e) => s + e.weight, 0);
	row++;
	setCell(ws, row, 0, "الإجمالي", STYLES.grandTotal);
	setCell(ws, row, 1, "", STYLES.grandTotal);
	setCell(ws, row, 2, totalBars, STYLES.grandTotalNumber);
	setCell(ws, row, 3, fmt(totalWeight), STYLES.grandTotalNumber);
	setCell(ws, row, 4, fmt(totalWeight / 1000, 3), STYLES.grandTotalNumber);

	setSheetRange(ws, row, colCount - 1);
	ws["!cols"] = [
		{ wch: 16 },
		{ wch: 16 },
		{ wch: 16 },
		{ wch: 18 },
		{ wch: 18 },
	];
	ws["!rows"] = [{ hpt: 30 }];
	setRTL(ws);
	XLSX.utils.book_append_sheet(wb, ws, "طلبية المصنع");
}

// ─────────────────────────────────────────────────────────────
// Sheet 3: Cutting Details (grouped by diameter)
// ─────────────────────────────────────────────────────────────

function buildCuttingSheet(XLSX: any, wb: any, allCuttingDetails: CuttingDetailRow[]) {
	const ws: any = {};
	const colCount = 8;
	const cols = ["العنصر", "الوصف", "طول القطعة (م)", "العدد", "أسياخ المصنع", "طول السيخ (م)", "الهالك %", "الوزن (كجم)"];
	let row = 0;

	// Title
	setCell(ws, row, 0, "تفاصيل التفصيل — ورشة القص", STYLES.title);
	for (let c = 1; c < colCount; c++) setCell(ws, row, c, "", STYLES.title);
	mergeRange(ws, row, 0, row, colCount - 1);
	row += 2;

	// Group by diameter
	const diameterGroups = new Map<number, CuttingDetailRow[]>();
	for (const d of allCuttingDetails) {
		const list = diameterGroups.get(d.diameter) || [];
		list.push(d);
		diameterGroups.set(d.diameter, list);
	}
	const sortedDiameters = Array.from(diameterGroups.keys()).sort((a, b) => a - b);

	for (const diameter of sortedDiameters) {
		const group = diameterGroups.get(diameter)!;
		const groupWeight = group.reduce((s, d) => s + d.grossWeight, 0);
		const groupStocks = group.reduce((s, d) => s + d.stocksNeeded, 0);

		// Diameter header
		const headerText = `Ø${diameter} مم — ${group.length} عملية قص — ${groupStocks} سيخ مصنع — ${fmt(groupWeight)} كجم`;
		setCell(ws, row, 0, headerText, STYLES.diameterHeader);
		for (let c = 1; c < colCount; c++) setCell(ws, row, c, "", STYLES.diameterHeader);
		mergeRange(ws, row, 0, row, colCount - 1);
		row++;

		// Column headers
		for (let c = 0; c < colCount; c++) {
			setCell(ws, row, c, cols[c], STYLES.colHeader);
		}
		row++;

		// Detail rows
		for (const d of group) {
			const wasteStyle = d.wastePercentage > 15
				? { ...STYLES.cellNumber, font: { sz: 10, color: { rgb: "DC2626" }, bold: true } }
				: d.wastePercentage > 8
					? { ...STYLES.cellNumber, font: { sz: 10, color: { rgb: "D97706" } } }
					: { ...STYLES.cellNumber, font: { sz: 10, color: { rgb: "16A34A" } } };

			setCell(ws, row, 0, d.element, STYLES.cell);
			setCell(ws, row, 1, d.description, STYLES.cell);
			setCell(ws, row, 2, d.barLength, STYLES.cellNumber);
			setCell(ws, row, 3, d.barCount, STYLES.cellInt);
			setCell(ws, row, 4, d.stocksNeeded, STYLES.cellInt);
			setCell(ws, row, 5, d.stockLength, STYLES.cellInt);
			setCell(ws, row, 6, d.wastePercentage + "%", wasteStyle);
			setCell(ws, row, 7, fmt(d.grossWeight), STYLES.cellNumber);
			row++;
		}

		// Group total
		setCell(ws, row, 0, "", STYLES.sectionTotal);
		setCell(ws, row, 1, "إجمالي Ø" + diameter, STYLES.sectionTotal);
		setCell(ws, row, 2, "", STYLES.sectionTotal);
		setCell(ws, row, 3, "", STYLES.sectionTotal);
		setCell(ws, row, 4, groupStocks, STYLES.sectionTotalNumber);
		setCell(ws, row, 5, "", STYLES.sectionTotal);
		setCell(ws, row, 6, "", STYLES.sectionTotal);
		setCell(ws, row, 7, fmt(groupWeight), STYLES.sectionTotalNumber);
		row += 2;
	}

	// Grand total
	const grandWeight = allCuttingDetails.reduce((s, d) => s + d.grossWeight, 0);
	const grandStocks = allCuttingDetails.reduce((s, d) => s + d.stocksNeeded, 0);
	setCell(ws, row, 0, "الإجمالي العام", STYLES.grandTotal);
	for (let c = 1; c < 4; c++) setCell(ws, row, c, "", STYLES.grandTotal);
	mergeRange(ws, row, 0, row, 3);
	setCell(ws, row, 4, grandStocks, STYLES.grandTotalNumber);
	setCell(ws, row, 5, "", STYLES.grandTotal);
	setCell(ws, row, 6, "", STYLES.grandTotal);
	setCell(ws, row, 7, fmt(grandWeight), STYLES.grandTotalNumber);

	setSheetRange(ws, row, colCount - 1);
	ws["!cols"] = [
		{ wch: 22 },
		{ wch: 26 },
		{ wch: 16 },
		{ wch: 10 },
		{ wch: 14 },
		{ wch: 14 },
		{ wch: 12 },
		{ wch: 16 },
	];
	ws["!rows"] = [{ hpt: 30 }];
	setRTL(ws);
	XLSX.utils.book_append_sheet(wb, ws, "تفاصيل القص");
}

// ─────────────────────────────────────────────────────────────
// Standalone Factory Order Export
// ─────────────────────────────────────────────────────────────

export async function exportFactoryOrder(factoryOrder: FactoryOrderEntry[], studyName?: string) {
	const XLSX = await import("xlsx-js-style");

	const wb = XLSX.utils.book_new();
	buildFactorySheet(XLSX, wb, factoryOrder);

	const fileName = studyName
		? `طلبية_مصنع_${studyName}_${new Date().toISOString().slice(0, 10)}.xlsx`
		: `طلبية_مصنع_${new Date().toISOString().slice(0, 10)}.xlsx`;

	XLSX.writeFile(wb, fileName);
}

// ─────────────────────────────────────────────────────────────
// Standalone Cutting Details Export
// ─────────────────────────────────────────────────────────────

export async function exportCuttingDetails(cuttingDetails: CuttingDetailRow[], studyName?: string) {
	const XLSX = await import("xlsx-js-style");

	const wb = XLSX.utils.book_new();
	buildCuttingSheet(XLSX, wb, cuttingDetails);

	const fileName = studyName
		? `تفاصيل_قص_${studyName}_${new Date().toISOString().slice(0, 10)}.xlsx`
		: `تفاصيل_قص_${new Date().toISOString().slice(0, 10)}.xlsx`;

	XLSX.writeFile(wb, fileName);
}
