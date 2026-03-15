// ═══════════════════════════════════════════════════════════════
// BOQ Export - تصدير جدول الكميات (Excel + PDF)
// ═══════════════════════════════════════════════════════════════

import type { BOQSummary, FactoryOrderEntry } from "./boq-aggregator";
import type { CuttingDetailRow } from "./boq-recalculator";

// ─────────────────────────────────────────────────────────────
// Excel Export
// ─────────────────────────────────────────────────────────────

export async function exportBOQToExcel(summary: BOQSummary, studyName?: string) {
	const XLSX = await import("xlsx");

	const wb = XLSX.utils.book_new();

	// Sheet 1: BOQ Summary
	const summaryRows: any[][] = [
		["جدول الكميات الإجمالي - ملخص"],
		[],
		["القسم", "العنصر", "الكمية", "الخرسانة (م³)", "الحديد (كجم)", "البلوك"],
	];

	for (const section of summary.sections) {
		summaryRows.push([]);
		summaryRows.push([section.label, "", "", "", "", ""]);

		for (const group of section.subGroups) {
			if (section.subGroups.length > 1) {
				summaryRows.push(["  " + group.label, "", "", "", "", ""]);
			}
			for (const detail of group.items) {
				summaryRows.push([
					"",
					detail.item.name,
					detail.item.quantity,
					Number(detail.item.concreteVolume.toFixed(2)),
					Number(detail.item.steelWeight.toFixed(2)),
					section.category === "blocks" ? detail.item.quantity : "",
				]);
			}
			if (section.subGroups.length > 1) {
				summaryRows.push([
					"",
					"إجمالي " + group.label,
					"",
					Number(group.concrete.toFixed(2)),
					Number(group.rebar.toFixed(2)),
					group.blocks || "",
				]);
			}
		}

		summaryRows.push([
			"",
			"إجمالي " + section.label,
			"",
			Number(section.totalConcrete.toFixed(2)),
			Number(section.totalRebar.toFixed(2)),
			section.totalBlocks || "",
		]);
	}

	summaryRows.push([]);
	summaryRows.push([
		"",
		"الإجمالي العام",
		"",
		summary.grandTotals.concrete,
		summary.grandTotals.rebar,
		summary.grandTotals.blocks,
	]);

	const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
	ws1["!cols"] = [
		{ wch: 25 },
		{ wch: 30 },
		{ wch: 10 },
		{ wch: 15 },
		{ wch: 15 },
		{ wch: 12 },
	];
	XLSX.utils.book_append_sheet(wb, ws1, "ملخص الكميات");

	// Sheet 2: Factory Order
	const factoryRows: any[][] = [
		["طلبية المصنع - حديد التسليح"],
		[],
		["القطر (مم)", "طول السيخ (م)", "عدد الأسياخ", "الوزن (كجم)", "الوزن (طن)"],
	];

	for (const entry of summary.factoryOrder) {
		factoryRows.push([
			entry.diameter,
			entry.stockLength,
			entry.count,
			Number(entry.weight.toFixed(2)),
			Number((entry.weight / 1000).toFixed(3)),
		]);
	}

	const totalFactoryWeight = summary.factoryOrder.reduce((s, e) => s + e.weight, 0);
	factoryRows.push([]);
	factoryRows.push([
		"الإجمالي",
		"",
		summary.factoryOrder.reduce((s, e) => s + e.count, 0),
		Number(totalFactoryWeight.toFixed(2)),
		Number((totalFactoryWeight / 1000).toFixed(3)),
	]);

	const ws2 = XLSX.utils.aoa_to_sheet(factoryRows);
	ws2["!cols"] = [
		{ wch: 15 },
		{ wch: 15 },
		{ wch: 15 },
		{ wch: 15 },
		{ wch: 15 },
	];
	XLSX.utils.book_append_sheet(wb, ws2, "طلبية المصنع");

	// Sheet 3: Cutting Workshop
	const cuttingRows: any[][] = [
		["تفاصيل التفصيل - ورشة القص"],
		[],
		["العنصر", "الوصف", "القطر (مم)", "طول القطعة (م)", "العدد", "أسياخ المصنع", "طول السيخ (م)", "الهالك %", "الوزن الصافي (كجم)", "الوزن الإجمالي (كجم)"],
	];

	for (const detail of summary.allCuttingDetails) {
		cuttingRows.push([
			detail.element,
			detail.description,
			detail.diameter,
			detail.barLength,
			detail.barCount,
			detail.stocksNeeded,
			detail.stockLength,
			detail.wastePercentage,
			detail.netWeight,
			detail.grossWeight,
		]);
	}

	const ws3 = XLSX.utils.aoa_to_sheet(cuttingRows);
	ws3["!cols"] = [
		{ wch: 20 },
		{ wch: 25 },
		{ wch: 12 },
		{ wch: 15 },
		{ wch: 10 },
		{ wch: 15 },
		{ wch: 15 },
		{ wch: 10 },
		{ wch: 18 },
		{ wch: 18 },
	];
	XLSX.utils.book_append_sheet(wb, ws3, "تفاصيل القص");

	// Download
	const fileName = studyName
		? `جدول_كميات_${studyName}_${new Date().toISOString().slice(0, 10)}.xlsx`
		: `جدول_كميات_${new Date().toISOString().slice(0, 10)}.xlsx`;

	XLSX.writeFile(wb, fileName);
}

// ─────────────────────────────────────────────────────────────
// Factory Order Excel Export
// ─────────────────────────────────────────────────────────────

export async function exportFactoryOrder(factoryOrder: FactoryOrderEntry[], studyName?: string) {
	const XLSX = await import("xlsx");
	const wb = XLSX.utils.book_new();

	const rows: any[][] = [
		["طلبية المصنع - حديد التسليح"],
		[],
		["القطر (مم)", "طول السيخ (م)", "عدد الأسياخ", "الوزن (كجم)", "الوزن (طن)"],
	];

	for (const entry of factoryOrder) {
		rows.push([
			entry.diameter,
			entry.stockLength,
			entry.count,
			Number(entry.weight.toFixed(2)),
			Number((entry.weight / 1000).toFixed(3)),
		]);
	}

	const totalWeight = factoryOrder.reduce((s, e) => s + e.weight, 0);
	rows.push([]);
	rows.push([
		"الإجمالي",
		"",
		factoryOrder.reduce((s, e) => s + e.count, 0),
		Number(totalWeight.toFixed(2)),
		Number((totalWeight / 1000).toFixed(3)),
	]);

	const ws = XLSX.utils.aoa_to_sheet(rows);
	ws["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
	XLSX.utils.book_append_sheet(wb, ws, "طلبية المصنع");

	const fileName = studyName
		? `طلبية_مصنع_${studyName}_${new Date().toISOString().slice(0, 10)}.xlsx`
		: `طلبية_مصنع_${new Date().toISOString().slice(0, 10)}.xlsx`;

	XLSX.writeFile(wb, fileName);
}

// ─────────────────────────────────────────────────────────────
// Cutting Details Excel Export
// ─────────────────────────────────────────────────────────────

export async function exportCuttingDetails(cuttingDetails: CuttingDetailRow[], studyName?: string) {
	const XLSX = await import("xlsx");
	const wb = XLSX.utils.book_new();

	const rows: any[][] = [
		["تفاصيل التفصيل - ورشة القص"],
		[],
		["العنصر", "الوصف", "القطر (مم)", "طول القطعة (م)", "العدد", "أسياخ المصنع", "الهالك %", "الوزن (كجم)"],
	];

	for (const detail of cuttingDetails) {
		rows.push([
			detail.element,
			detail.description,
			detail.diameter,
			detail.barLength,
			detail.barCount,
			detail.stocksNeeded,
			detail.wastePercentage,
			detail.grossWeight,
		]);
	}

	const ws = XLSX.utils.aoa_to_sheet(rows);
	ws["!cols"] = [
		{ wch: 20 },
		{ wch: 25 },
		{ wch: 12 },
		{ wch: 15 },
		{ wch: 10 },
		{ wch: 15 },
		{ wch: 10 },
		{ wch: 15 },
	];
	XLSX.utils.book_append_sheet(wb, ws, "تفاصيل القص");

	const fileName = studyName
		? `تفاصيل_قص_${studyName}_${new Date().toISOString().slice(0, 10)}.xlsx`
		: `تفاصيل_قص_${new Date().toISOString().slice(0, 10)}.xlsx`;

	XLSX.writeFile(wb, fileName);
}

