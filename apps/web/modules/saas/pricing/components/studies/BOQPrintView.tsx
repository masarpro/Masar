"use client";

import { HeaderComponent } from "@saas/company/components/templates/components/HeaderComponent";
import { FooterElement } from "@saas/company/components/templates/renderer/elements/FooterElement";
import type { OrganizationData } from "@saas/company/components/templates/renderer/TemplateRenderer";
import type { BOQSummary, FactoryOrderEntry } from "../../lib/boq-aggregator";
import type { CuttingDetailRow } from "../../lib/boq-recalculator";
import { formatNumber } from "../../lib/utils";

interface BOQPrintViewProps {
	activeTab: "summary" | "factory" | "cutting";
	summary: BOQSummary;
	studyName?: string;
	floorLabel?: string;
	templateElements: any[];
	templateSettings: any;
	organizationData: OrganizationData;
}

export function BOQPrintView({
	activeTab,
	summary,
	studyName,
	floorLabel,
	templateElements,
	templateSettings,
	organizationData,
}: BOQPrintViewProps) {
	const primaryColor = templateSettings?.primaryColor || "#3b82f6";
	const secondaryColor = templateSettings?.secondaryColor;

	const headerElement = templateElements.find((el: any) => el.type === "header");
	const footerElement = templateElements.find((el: any) => el.type === "footer");

	const companyInfo = {
		name: organizationData?.name,
		nameAr: organizationData?.nameAr,
		nameEn: organizationData?.nameEn,
		logo: organizationData?.logo,
		address: organizationData?.address,
		addressAr: organizationData?.addressAr,
		addressEn: organizationData?.addressEn,
		phone: organizationData?.phone,
		email: organizationData?.email,
		taxNumber: organizationData?.taxNumber,
		commercialReg: organizationData?.commercialReg,
	};

	// Merge header settings with showTitleInHeader: false to hide document type label ("خطاب")
	const headerSettings = {
		...(headerElement?.settings || {}),
		showTitleInHeader: false,
	};

	const tabLabels: Record<string, string> = {
		summary: "ملخص الكميات",
		factory: "طلبية المصنع",
		cutting: "تفاصيل التفصيل",
	};

	const reportDate = new Date().toLocaleDateString("ar-SA", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return (
		<div className="boq-print-container" dir="rtl">
			{/* Header */}
			{headerElement && (
				<HeaderComponent
					settings={headerSettings}
					companyInfo={companyInfo}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
				/>
			)}

			{/* Report Title */}
			<div style={{ padding: "12px 8px", textAlign: "center" }}>
				<h1 style={{ fontSize: "18px", fontWeight: 700, color: primaryColor, margin: 0 }}>
					تقرير الكميات — {tabLabels[activeTab]}
				</h1>
				<div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "6px", fontSize: "12px", color: "#4b5563" }}>
					{studyName && <span>الدراسة: {studyName}</span>}
					<span>تاريخ التقرير: {reportDate}</span>
				</div>
				{floorLabel && (
					<div style={{ marginTop: "4px", fontSize: "12px", color: "#6b7280" }}>
						تصفية الدور: {floorLabel}
					</div>
				)}
			</div>

			{/* Content */}
			{activeTab === "summary" && <PrintSummary summary={summary} />}
			{activeTab === "factory" && <PrintFactory factoryOrder={summary.factoryOrder} />}
			{activeTab === "cutting" && <PrintCutting cuttingDetails={summary.allCuttingDetails} />}

			{/* Footer */}
			{footerElement && (
				<FooterElement
					settings={footerElement.settings || {}}
					organization={organizationData}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
				/>
			)}

			{/* Masar branding */}
			<div style={{ textAlign: "center", color: "#9ca3af", fontSize: "10px", marginTop: "20px", paddingTop: "8px", borderTop: "1px solid #e5e7eb" }}>
				تم إعداد هذا التقرير بواسطة منصة مسار — app-masar.com
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// Print Summary
// ─────────────────────────────────────────────────────────────

function PrintSummary({ summary }: { summary: BOQSummary }) {
	return (
		<div style={{ padding: "0 8px" }}>
			{summary.sections.map((section) => (
				<div key={section.category} className="boq-section" style={{ marginBottom: "16px" }}>
					<h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px", padding: "4px 8px", backgroundColor: "#f8fafc", borderRadius: "4px" }}>
						{section.icon} {section.label}
					</h3>
					{section.subGroups.map((group) => (
						<div key={group.key} style={{ marginBottom: "10px" }}>
							{section.subGroups.length > 1 && (
								<h4 style={{ fontSize: "12px", fontWeight: 600, color: "#4b5563", marginBottom: "4px" }}>
									{group.label}
								</h4>
							)}
							<table>
								<thead>
									<tr>
										<th>العنصر</th>
										<th>الكمية</th>
										<th>خرسانة (م³)</th>
										<th>حديد (كجم)</th>
										{section.category === "blocks" && <th>بلوك</th>}
									</tr>
								</thead>
								<tbody>
									{group.items.map((detail) => (
										<tr key={detail.item.id}>
											<td>{detail.item.name}</td>
											<td>{detail.item.quantity}</td>
											<td>{formatNumber(detail.item.concreteVolume)}</td>
											<td>{formatNumber(detail.item.steelWeight)}</td>
											{section.category === "blocks" && (
												<td>{formatNumber(detail.item.quantity)}</td>
											)}
										</tr>
									))}
								</tbody>
							</table>
							<div style={{ textAlign: "left", fontSize: "11px", fontWeight: 700, marginTop: "4px", color: "#4b5563" }}>
								إجمالي القسم:
								{section.totalConcrete > 0 && ` خرسانة ${formatNumber(section.totalConcrete)} م³`}
								{section.totalRebar > 0 && ` | حديد ${formatNumber(section.totalRebar)} كجم`}
								{section.totalBlocks > 0 && ` | بلوك ${formatNumber(section.totalBlocks)}`}
							</div>
						</div>
					))}
				</div>
			))}

			{/* Grand Totals */}
			<div className="boq-section" style={{ borderTop: "2px solid #9ca3af", paddingTop: "12px" }}>
				<h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>الإجمالي العام</h3>
				<table>
					<thead>
						<tr>
							<th>المادة</th>
							<th>الكمية</th>
							<th>الوحدة</th>
						</tr>
					</thead>
					<tbody>
						{summary.grandTotals.concrete > 0 && (
							<tr>
								<td style={{ fontWeight: 700 }}>الخرسانة</td>
								<td>{formatNumber(summary.grandTotals.concrete)}</td>
								<td>م³</td>
							</tr>
						)}
						{summary.grandTotals.rebar > 0 && (
							<tr>
								<td style={{ fontWeight: 700 }}>حديد التسليح</td>
								<td>{formatNumber(summary.grandTotals.rebar)}</td>
								<td>كجم ({formatNumber(summary.grandTotals.rebar / 1000, 2)} طن)</td>
							</tr>
						)}
						{summary.grandTotals.blocks > 0 && (
							<tr>
								<td style={{ fontWeight: 700 }}>البلوك</td>
								<td>{formatNumber(summary.grandTotals.blocks)}</td>
								<td>بلوكة</td>
							</tr>
						)}
						{summary.grandTotals.formwork > 0 && (
							<tr>
								<td style={{ fontWeight: 700 }}>الطوبار</td>
								<td>{formatNumber(summary.grandTotals.formwork)}</td>
								<td>م²</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// Print Factory Order
// ─────────────────────────────────────────────────────────────

function PrintFactory({ factoryOrder }: { factoryOrder: FactoryOrderEntry[] }) {
	const totalBars = factoryOrder.reduce((s, e) => s + e.count, 0);
	const totalWeight = factoryOrder.reduce((s, e) => s + e.weight, 0);

	return (
		<div style={{ padding: "0 8px" }}>
			<table>
				<thead>
					<tr>
						<th>القطر (مم)</th>
						<th>طول السيخ (م)</th>
						<th>عدد الأسياخ</th>
						<th>الوزن (كجم)</th>
						<th>الوزن (طن)</th>
					</tr>
				</thead>
				<tbody>
					{factoryOrder.map((entry, i) => (
						<tr key={i}>
							<td>Ø{entry.diameter}</td>
							<td>{entry.stockLength}</td>
							<td>{entry.count}</td>
							<td>{formatNumber(entry.weight)}</td>
							<td>{formatNumber(entry.weight / 1000, 3)}</td>
						</tr>
					))}
					<tr style={{ fontWeight: 700, borderTop: "2px solid #000" }}>
						<td>الإجمالي</td>
						<td></td>
						<td>{totalBars}</td>
						<td>{formatNumber(totalWeight)}</td>
						<td>{formatNumber(totalWeight / 1000, 3)} طن</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// Print Cutting Details
// ─────────────────────────────────────────────────────────────

function PrintCutting({ cuttingDetails }: { cuttingDetails: CuttingDetailRow[] }) {
	const diameterGroups = new Map<number, CuttingDetailRow[]>();
	cuttingDetails.forEach((d) => {
		const list = diameterGroups.get(d.diameter) || [];
		list.push(d);
		diameterGroups.set(d.diameter, list);
	});

	const sortedDiameters = Array.from(diameterGroups.keys()).sort((a, b) => a - b);

	return (
		<div style={{ padding: "0 8px" }}>
			{sortedDiameters.map((diameter) => {
				const group = diameterGroups.get(diameter)!;
				const groupWeight = group.reduce((s, d) => s + d.grossWeight, 0);
				const groupStocks = group.reduce((s, d) => s + d.stocksNeeded, 0);

				return (
					<div key={diameter} className="boq-section" style={{ marginBottom: "16px" }}>
						<h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px", padding: "4px 8px", backgroundColor: "#f8fafc", borderRadius: "4px" }}>
							Ø{diameter} مم — {group.length} عملية قص — {groupStocks} سيخ مصنع — {formatNumber(groupWeight)} كجم
						</h3>
						<table>
							<thead>
								<tr>
									<th>العنصر</th>
									<th>الوصف</th>
									<th>طول القطعة (م)</th>
									<th>العدد</th>
									<th>أسياخ المصنع</th>
									<th>الهالك %</th>
									<th>الوزن (كجم)</th>
								</tr>
							</thead>
							<tbody>
								{group.map((d, i) => (
									<tr key={i}>
										<td>{d.element}</td>
										<td>{d.description}</td>
										<td>{d.barLength}</td>
										<td>{d.barCount}</td>
										<td>{d.stocksNeeded}</td>
										<td>{d.wastePercentage}%</td>
										<td>{formatNumber(d.grossWeight)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				);
			})}
		</div>
	);
}
