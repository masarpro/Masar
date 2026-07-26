"use client";

import { Card } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { AlertCircle, Coins, Receipt, Tags, Wallet } from "lucide-react";
import { formatNumber } from "../../lib/utils";
import type {
	CostReport,
	CostReportGroup,
	CostReportSection,
} from "../../lib/cost-report";

// ═══════════════════════════════════════════════════════════════
// Cost & Pricing Report — تقرير التكلفة والتسعير
// ═══════════════════════════════════════════════════════════════

interface CostReportViewProps {
	report: CostReport;
}

const money = (n: number) => formatNumber(n, 2);

export function CostReportView({ report }: CostReportViewProps) {
	const {
		materialSections,
		unitPriceRows,
		materialTotalComputed,
		laborSection,
		storageSection,
		indirectSection,
		summaryRows,
		grandTotal,
		pricing,
		materialDrift,
	} = report;

	const hasDrift = Math.abs(materialDrift) > 1;

	return (
		<div className="space-y-4">
			{/* تنبيه عدم التزامن مع الملخص المعتمد */}
			{hasDrift && (
				<div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400 print:hidden">
					<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
					<span>
						التفاصيل أدناه محسوبة من الأسعار المحفوظة ({money(materialTotalComputed)}{" "}
						ر.س) بينما الملخص المعتمد يقرأ بنود التكلفة على الخادم. احفظ تبويب
						«المواد» في تسعير التكلفة لمزامنة الرقمين (الفارق{" "}
						{money(Math.abs(materialDrift))} ر.س).
					</span>
				</div>
			)}

			{/* ─── جداول المواد ─── */}
			{materialSections.map((section) => (
				<MaterialSectionCard key={section.key} section={section} />
			))}

			{/* إجمالي المواد المحسوب */}
			{materialSections.length > 0 && (
				<div className="rounded-xl border-2 border-chart-4/30 bg-chart-4/5 p-4 flex items-center justify-between">
					<span className="font-semibold flex items-center gap-2">
						<Coins className="h-4 w-4 text-chart-4" />
						إجمالي المواد
					</span>
					<span className="text-lg font-bold text-chart-4" dir="ltr">
						{money(materialTotalComputed)} ر.س
					</span>
				</div>
			)}

			{/* ─── الأسعار المعتمدة ─── */}
			{unitPriceRows.length > 0 && (
				<Card className="overflow-hidden">
					<div className="px-4 py-3 bg-muted/30 border-b flex items-center gap-2">
						<Tags className="h-4 w-4 text-primary" />
						<h4 className="font-semibold">أسعار الوحدات المعتمدة</h4>
					</div>
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/20">
								<TableHead className="text-start text-xs">المادة</TableHead>
								<TableHead className="text-start text-xs">الوحدة</TableHead>
								<TableHead className="text-start text-xs">السعر (ر.س)</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{unitPriceRows.map((row) => (
								<TableRow key={row.key}>
									<TableCell className="text-sm font-medium">{row.label}</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{row.unit}
									</TableCell>
									<TableCell className="text-sm font-medium" dir="ltr">
										{money(row.unitPrice)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Card>
			)}

			{/* ─── المصنعيات ─── */}
			<CostSectionCard section={laborSection} accent="text-chart-1" />

			{/* ─── التشوين والمصاريف الأخرى ─── */}
			<CostSectionCard section={storageSection} accent="text-chart-2" />

			{/* ─── المصاريف غير المباشرة ─── */}
			<CostSectionCard section={indirectSection} accent="text-chart-3" />

			{/* ─── الملخص النهائي ─── */}
			<Card className="overflow-hidden border-2 border-primary/30">
				<div className="px-4 py-3 bg-primary/10 border-b flex items-center gap-2">
					<Wallet className="h-4 w-4 text-primary" />
					<h4 className="font-semibold">ملخص التكلفة النهائي</h4>
				</div>
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/20">
							<TableHead className="text-start text-xs">البند</TableHead>
							<TableHead className="text-start text-xs">الإجمالي (ر.س)</TableHead>
							<TableHead className="text-start text-xs">النسبة</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{summaryRows.map((row) => (
							<TableRow key={row.key}>
								<TableCell className="text-sm font-medium">{row.label}</TableCell>
								<TableCell className="text-sm font-medium" dir="ltr">
									{money(row.total)}
								</TableCell>
								<TableCell className="text-sm text-muted-foreground" dir="ltr">
									{formatNumber(row.percent, 1)}%
								</TableCell>
							</TableRow>
						))}
						<TableRow className="bg-primary/10 font-bold border-t-2 border-primary/20">
							<TableCell className="text-base">إجمالي التكلفة</TableCell>
							<TableCell className="text-base text-primary" dir="ltr">
								{money(grandTotal)}
							</TableCell>
							<TableCell className="text-base" dir="ltr">
								100%
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</Card>

			{/* ─── التسعير والأرباح ─── */}
			{pricing && (
				<Card className="overflow-hidden">
					<div className="px-4 py-3 bg-muted/30 border-b flex items-center gap-2">
						<Receipt className="h-4 w-4 text-success" />
						<h4 className="font-semibold">التسعير والأرباح</h4>
					</div>
					<Table>
						<TableBody>
							<PricingRow label="إجمالي التكلفة" value={pricing.totalCost} />
							{pricing.overheadAmount > 0 && (
								<PricingRow label="المصاريف الإدارية" value={pricing.overheadAmount} />
							)}
							{pricing.profitAmount !== 0 && (
								<PricingRow label="هامش الربح" value={pricing.profitAmount} />
							)}
							{pricing.contingencyAmount > 0 && (
								<PricingRow label="احتياطي الطوارئ" value={pricing.contingencyAmount} />
							)}
							<PricingRow
								label="سعر البيع قبل الضريبة"
								value={pricing.sellingPriceBeforeVat}
								emphasis
							/>
							{pricing.vatAmount > 0 && (
								<PricingRow label="ضريبة القيمة المضافة" value={pricing.vatAmount} />
							)}
							<TableRow className="bg-success/10 font-bold border-t-2">
								<TableCell className="text-base">الإجمالي شامل الضريبة</TableCell>
								<TableCell className="text-base text-success" dir="ltr">
									{money(pricing.grandTotal)} ر.س
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>

					{pricing.buildingArea > 0 && (
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-t bg-muted/10">
							<Metric
								label="مساحة البناء"
								value={`${formatNumber(pricing.buildingArea)} م²`}
							/>
							<Metric
								label="تكلفة المتر المربع"
								value={`${money(pricing.costPerSqm)} ر.س/م²`}
							/>
							<Metric
								label="سعر بيع المتر المربع"
								value={`${money(pricing.pricePerSqm)} ر.س/م²`}
							/>
						</div>
					)}

					<div className="px-4 py-3 border-t text-sm text-muted-foreground">
						نسبة الربح على التكلفة:{" "}
						<span className="font-medium text-foreground" dir="ltr">
							{formatNumber(pricing.profitPercent, 1)}%
						</span>
					</div>
				</Card>
			)}
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// Material section card — كل صف: البند | الدور | الكمية | السعر | الإجمالي
// ─────────────────────────────────────────────────────────────

function MaterialSectionCard({ section }: { section: CostReportSection }) {
	return (
		<Card className="overflow-hidden">
			<div className="px-4 py-3 bg-muted/30 border-b flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-lg">{section.icon}</span>
					<h4 className="font-semibold">{section.label}</h4>
				</div>
				<span className="text-sm font-bold text-primary" dir="ltr">
					{money(section.total)} ر.س
				</span>
			</div>

			{section.groups.map((group) => (
				<GroupTable key={group.key} group={group} showGroupTitle={section.groups.length > 1} />
			))}
		</Card>
	);
}

function GroupTable({
	group,
	showGroupTitle,
}: {
	group: CostReportGroup;
	showGroupTitle: boolean;
}) {
	return (
		<div>
			{showGroupTitle && (
				<div className="px-4 py-2 bg-muted/10 border-b">
					<span className="text-sm font-medium text-muted-foreground">
						{group.label}
					</span>
				</div>
			)}
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/20">
							<TableHead className="text-start text-xs">البند</TableHead>
							<TableHead className="text-start text-xs">الدور</TableHead>
							<TableHead className="text-start text-xs">الكمية</TableHead>
							<TableHead className="text-start text-xs">الوحدة</TableHead>
							<TableHead className="text-start text-xs">متوسط السعر</TableHead>
							<TableHead className="text-start text-xs">الإجمالي (ر.س)</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{group.rows.map((row) => (
							<TableRow key={row.key}>
								<TableCell className="text-sm font-medium">{row.label}</TableCell>
								<TableCell className="text-sm">
									{row.detail ? (
										<Badge variant="secondary" className="text-xs font-normal">
											{row.detail}
										</Badge>
									) : (
										"—"
									)}
								</TableCell>
								<TableCell className="text-sm" dir="ltr">
									{formatNumber(row.quantity, row.unit === "طن" ? 3 : 2)}
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{row.unit}
								</TableCell>
								<TableCell className="text-sm" dir="ltr">
									{row.unitPrice > 0 ? money(row.unitPrice) : "—"}
								</TableCell>
								<TableCell className="text-sm font-medium" dir="ltr">
									{row.total > 0 ? money(row.total) : "—"}
								</TableCell>
							</TableRow>
						))}
						<TableRow className="bg-muted/40 font-bold border-t-2">
							<TableCell colSpan={2}>إجمالي {group.label}</TableCell>
							<TableCell dir="ltr">
								{formatNumber(group.totalQuantity, group.unit === "طن" ? 3 : 2)}
							</TableCell>
							<TableCell className="text-muted-foreground">{group.unit}</TableCell>
							<TableCell>—</TableCell>
							<TableCell dir="ltr">{money(group.total)}</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────
// Generic cost section (labor / storage / indirect)
// ─────────────────────────────────────────────────────────────

function CostSectionCard({
	section,
	accent,
}: {
	section: CostReportSection;
	accent: string;
}) {
	if (section.groups.length === 0 && section.total <= 0) return null;

	return (
		<Card className="overflow-hidden">
			<div className="px-4 py-3 bg-muted/30 border-b flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-lg">{section.icon}</span>
					<h4 className="font-semibold">{section.label}</h4>
				</div>
				<span className={`text-sm font-bold ${accent}`} dir="ltr">
					{money(section.total)} ر.س
				</span>
			</div>

			{section.groups.length === 0 ? (
				<div className="px-4 py-3 text-sm text-muted-foreground">
					لا توجد تفاصيل محفوظة — الإجمالي أعلاه من ملخص التكلفة.
				</div>
			) : (
				section.groups.map((group) => (
					<div key={group.key}>
						{section.groups.length > 1 && (
							<div className="px-4 py-2 bg-muted/10 border-b">
								<span className="text-sm font-medium text-muted-foreground">
									{group.label}
								</span>
							</div>
						)}
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/20">
										<TableHead className="text-start text-xs">البند</TableHead>
										<TableHead className="text-start text-xs">التفاصيل</TableHead>
										<TableHead className="text-start text-xs">الكمية</TableHead>
										<TableHead className="text-start text-xs">الوحدة</TableHead>
										<TableHead className="text-start text-xs">السعر</TableHead>
										<TableHead className="text-start text-xs">الإجمالي (ر.س)</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{group.rows.map((row) => (
										<TableRow key={row.key}>
											<TableCell className="text-sm font-medium">{row.label}</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{row.detail ?? "—"}
											</TableCell>
											<TableCell className="text-sm" dir="ltr">
												{formatNumber(row.quantity, 2)}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{row.unit}
											</TableCell>
											<TableCell className="text-sm" dir="ltr">
												{row.unitPrice > 0 ? money(row.unitPrice) : "—"}
											</TableCell>
											<TableCell className="text-sm font-medium" dir="ltr">
												{money(row.total)}
											</TableCell>
										</TableRow>
									))}
									<TableRow className="bg-muted/40 font-bold border-t-2">
										<TableCell colSpan={5}>إجمالي {group.label}</TableCell>
										<TableCell dir="ltr">{money(group.total)}</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
					</div>
				))
			)}
		</Card>
	);
}

// ─────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────

function PricingRow({
	label,
	value,
	emphasis,
}: {
	label: string;
	value: number;
	emphasis?: boolean;
}) {
	return (
		<TableRow className={emphasis ? "bg-muted/30 font-semibold" : undefined}>
			<TableCell className="text-sm">{label}</TableCell>
			<TableCell className="text-sm font-medium" dir="ltr">
				{money(value)} ر.س
			</TableCell>
		</TableRow>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border bg-card p-3">
			<p className="text-xs text-muted-foreground mb-1">{label}</p>
			<p className="text-sm font-bold" dir="ltr">
				{value}
			</p>
		</div>
	);
}
