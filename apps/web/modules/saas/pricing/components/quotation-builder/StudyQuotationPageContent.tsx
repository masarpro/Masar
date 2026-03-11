"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Badge } from "@ui/components/badge";
import { FileText, Loader2, Lock, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
	QuotationFormatSelector,
	type QuotationFormatType,
} from "./QuotationFormatSelector";
import { QuotationCustomizer, type DisplayConfig } from "./QuotationCustomizer";
import { QuotationDataForm } from "./QuotationDataForm";

interface StudyQuotationPageContentProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

type Step = "format" | "customize" | "data";

export function StudyQuotationPageContent({
	organizationId,
	organizationSlug,
	studyId,
}: StudyQuotationPageContentProps) {
	const [step, setStep] = useState<Step>("format");
	const [format, setFormat] = useState<QuotationFormatType>("DETAILED_BOQ");
	const [displayConfig, setDisplayConfig] = useState<DisplayConfig>(getDefaultConfig("DETAILED_BOQ"));
	const [perSqmPrice, setPerSqmPrice] = useState("");
	const [lumpSumDesc, setLumpSumDesc] = useState("");

	// Check that PRICING stage is APPROVED
	const { data: stagesData, isLoading: stagesLoading } = useQuery(
		orpc.pricing.studies.studyStages.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// Fetch study details
	const { data: study } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: { id: studyId, organizationId },
		}),
	);

	// Fetch profit analysis for summary
	const { data: profitData } = useQuery(
		orpc.pricing.studies.markup.getProfitAnalysis.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// Fetch existing quotations for this study
	const { data: existingQuotes } = useQuery(
		orpc.pricing.studies.getQuotes.queryOptions({
			input: { organizationId, costStudyId: studyId },
		}),
	);

	const stages = stagesData?.stages ?? [];
	const pricingStage = stages.find((s) => s.stage === "PRICING");
	const isPricingApproved = pricingStage?.status === "APPROVED";

	const fmt = (n: number) =>
		Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 });

	if (stagesLoading) return null;

	if (!isPricingApproved) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center" dir="rtl">
				<div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 mb-4">
					<Lock className="h-10 w-10 text-amber-500" />
				</div>
				<h3 className="text-lg font-semibold mb-2">مرحلة عرض السعر مقفلة</h3>
				<p className="text-muted-foreground mb-4 max-w-md">
					يجب اعتماد مرحلة التسعير أولاً قبل إنشاء عرض السعر
				</p>
				<Button asChild variant="outline" className="rounded-xl">
					<Link href={`/app/${organizationSlug}/pricing/studies/${studyId}/pricing`}>
						الرجوع للتسعير
					</Link>
				</Button>
			</div>
		);
	}

	const buildingArea = Number(study?.buildingArea ?? 0);
	const totalCost = profitData?.totalCost ?? 0;
	const grandTotal = profitData?.grandTotal ?? 0;
	const profitPercent = profitData?.profitPercent ?? 0;

	const handleFormatChange = (f: QuotationFormatType) => {
		setFormat(f);
		setDisplayConfig(getDefaultConfig(f));
	};

	const handleNext = () => {
		if (format === "CUSTOM") {
			setStep("customize");
		} else {
			setStep("data");
		}
	};

	return (
		<div className="space-y-6" dir="rtl">
			{/* Study summary bar */}
			<div className="rounded-xl border border-border bg-card p-4">
				<div className="flex flex-wrap gap-6 text-sm">
					<div>
						<span className="text-muted-foreground">الدراسة:</span>{" "}
						<span className="font-medium">{study?.name ?? "—"}</span>
					</div>
					<div>
						<span className="text-muted-foreground">التكلفة:</span>{" "}
						<span className="font-medium" dir="ltr">{fmt(totalCost)} ر.س</span>
					</div>
					<div>
						<span className="text-muted-foreground">سعر البيع:</span>{" "}
						<span className="font-medium" dir="ltr">{fmt(grandTotal)} ر.س</span>
					</div>
					<div>
						<span className="text-muted-foreground">الهامش:</span>{" "}
						<span className="font-medium">{fmt(profitPercent)}%</span>
					</div>
				</div>
			</div>

			{/* Existing quotes from this study */}
			{(existingQuotes ?? []).length > 0 && (
				<div className="rounded-xl border border-border bg-card p-4 space-y-3">
					<h4 className="font-medium text-sm">عروض أسعار سابقة من هذه الدراسة</h4>
					<div className="space-y-2">
						{(existingQuotes ?? []).map((q) => (
							<div
								key={q.id}
								className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50"
							>
								<div className="flex items-center gap-3">
									<FileText className="h-4 w-4 text-muted-foreground" />
									<div>
										<span className="text-sm font-medium">{q.quoteNumber}</span>
										<span className="text-xs text-muted-foreground mr-2">
											— {q.clientName}
										</span>
									</div>
								</div>
								<Badge variant="outline" className="text-xs">
									{q.status}
								</Badge>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Step: Format selection */}
			{step === "format" && (
				<div className="rounded-xl border border-border bg-card p-5 space-y-5">
					<QuotationFormatSelector value={format} onChange={handleFormatChange} />

					{/* Per-SQM extra fields */}
					{format === "PER_SQM" && (
						<div className="rounded-lg border border-border p-4 space-y-3">
							<div className="grid grid-cols-3 gap-4">
								<div className="space-y-1">
									<Label className="text-xs">المساحة الإجمالية (م²)</Label>
									<div className="h-10 flex items-center px-3 bg-muted rounded-lg text-sm" dir="ltr">
										{buildingArea.toLocaleString("ar-SA")} م²
									</div>
								</div>
								<div className="space-y-1">
									<Label className="text-xs">سعر المتر المربع</Label>
									<div className="h-10 flex items-center px-3 bg-muted rounded-lg text-sm font-medium" dir="ltr">
										{buildingArea > 0 ? fmt(grandTotal / buildingArea) : "—"} ر.س/م²
									</div>
								</div>
								<div className="space-y-1">
									<Label className="text-xs">الإجمالي</Label>
									<div className="h-10 flex items-center px-3 bg-muted rounded-lg text-sm font-medium" dir="ltr">
										{fmt(grandTotal)} ر.س
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Lump sum extra fields */}
					{format === "LUMP_SUM" && (
						<div className="rounded-lg border border-border p-4 space-y-3">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label className="text-xs">المبلغ الإجمالي</Label>
									<div className="h-10 flex items-center px-3 bg-muted rounded-lg text-sm font-medium" dir="ltr">
										{fmt(grandTotal)} ر.س
									</div>
								</div>
								<div className="space-y-1">
									<Label className="text-xs">وصف العرض</Label>
									<Input
										placeholder="بناء وتشطيب فيلا سكنية حسب المواصفات المرفقة"
										value={lumpSumDesc}
										onChange={(e) => setLumpSumDesc(e.target.value)}
										className="rounded-lg"
									/>
								</div>
							</div>
						</div>
					)}

					<div className="flex justify-end">
						<Button onClick={handleNext} className="gap-2 rounded-xl">
							{format === "CUSTOM" ? "تخصيص →" : "بيانات العرض →"}
						</Button>
					</div>
				</div>
			)}

			{/* Step: Customizer */}
			{step === "customize" && (
				<QuotationCustomizer
					config={displayConfig}
					onChange={setDisplayConfig}
					studyId={studyId}
					organizationId={organizationId}
					onBack={() => setStep("format")}
					onNext={() => setStep("data")}
				/>
			)}

			{/* Step: Data form */}
			{step === "data" && (
				<QuotationDataForm
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					studyId={studyId}
					format={format}
					displayConfig={displayConfig}
					grandTotal={grandTotal}
					buildingArea={buildingArea}
					lumpSumDescription={lumpSumDesc}
					onBack={() => (format === "CUSTOM" ? setStep("customize") : setStep("format"))}
				/>
			)}
		</div>
	);
}

function getDefaultConfig(format: QuotationFormatType): DisplayConfig {
	const base = {
		grouping: "BY_SECTION" as const,
		showItemNumber: true,
		showDescription: true,
		showSpecifications: true,
		showQuantity: true,
		showUnit: true,
		showUnitPrice: true,
		showItemTotal: true,
		showStructural: true,
		showFinishing: true,
		showMEP: true,
		showManualItems: true,
		showMaterialDetails: false,
		showSectionSubtotal: true,
		showSubtotal: true,
		showDiscount: true,
		showVAT: true,
		showGrandTotal: true,
		showPricePerSqm: false,
	};

	switch (format) {
		case "DETAILED_BOQ":
			return base;
		case "PER_SQM":
			return {
				...base,
				showItemNumber: false,
				showQuantity: false,
				showUnit: false,
				showUnitPrice: false,
				showItemTotal: false,
				showPricePerSqm: true,
			};
		case "LUMP_SUM":
			return {
				...base,
				showItemNumber: false,
				showQuantity: false,
				showUnit: false,
				showUnitPrice: false,
				showItemTotal: false,
			};
		case "CUSTOM":
			return base;
	}
}
