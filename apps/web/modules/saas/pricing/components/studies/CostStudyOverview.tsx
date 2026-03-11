"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	ArrowLeft,
	Building2,
	Calculator,
	ExternalLink,
	Hammer,
	Layers,
	MapPin,
	PaintBucket,
	Sparkles,
	UserSearch,
	Wrench,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatCurrency } from "../../lib/utils";
import { LeadStatusBadge } from "../leads/LeadStatusBadge";
import { QuantitiesSubTabs } from "./QuantitiesSubTabs";

interface CostStudyOverviewProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

export function CostStudyOverview({
	organizationId,
	organizationSlug,
	studyId,
}: CostStudyOverviewProps) {
	const t = useTranslations();

	const { data: study } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: {
				id: studyId,
				organizationId,
			},
		}),
	);

	const { data: activeStageData } = useQuery(
		orpc.pricing.studies.studyStages.getActive.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	if (!study) {
		return null;
	}

	// Map stage type to path
	const STAGE_PATH_MAP: Record<string, string> = {
		QUANTITIES: "quantities",
		SPECIFICATIONS: "specifications",
		COSTING: "costing",
		PRICING: "pricing",
		QUOTATION: "quotation",
		CONVERSION: "convert",
	};

	const activeStage = activeStageData?.activeStage;
	const activeStagePath = activeStage
		? STAGE_PATH_MAP[activeStage.stage] ?? ""
		: null;

	const directCosts = study.structuralCost + study.finishingCost + study.mepCost + study.laborCost;
	const overheadAmount = directCosts * (study.overheadPercent / 100);
	const profitAmount = directCosts * (study.profitPercent / 100);
	const vatAmount = study.vatIncluded ? study.totalCost * 0.15 / 1.15 : 0;

	return (
		<div className="space-y-6">
			{/* Project Info Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
					<div className="flex items-center gap-3">
						<div className="p-2.5 rounded-xl bg-slate-200/50 dark:bg-slate-700/50">
							<Building2 className="h-5 w-5 text-slate-600 dark:text-slate-300" />
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("pricing.studies.form.projectType")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{t(`pricing.studies.projectTypes.${study.projectType}`)}</p>
						</div>
					</div>
				</div>
				<div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
					<div className="flex items-center gap-3">
						<div className="p-2.5 rounded-xl bg-slate-200/50 dark:bg-slate-700/50">
							<Layers className="h-5 w-5 text-slate-600 dark:text-slate-300" />
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("pricing.studies.form.numberOfFloors")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{study.numberOfFloors} {t("pricing.studies.floors")}</p>
						</div>
					</div>
				</div>
				<div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
					<div className="flex items-center gap-3">
						<div className="p-2.5 rounded-xl bg-slate-200/50 dark:bg-slate-700/50">
							<MapPin className="h-5 w-5 text-slate-600 dark:text-slate-300" />
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("pricing.studies.form.buildingArea")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{study.buildingArea} م²</p>
						</div>
					</div>
				</div>
				<div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
					<div className="flex items-center gap-3">
						<div className="p-2.5 rounded-xl bg-slate-200/50 dark:bg-slate-700/50">
							<Sparkles className="h-5 w-5 text-slate-600 dark:text-slate-300" />
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("pricing.studies.form.finishingLevel")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{t(`pricing.studies.finishingLevels.${study.finishingLevel}`)}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Open Active Stage Button */}
			{activeStagePath && (
				<div className="flex justify-center">
					<Button asChild className="rounded-xl px-6 gap-2">
						<Link href={`/app/${organizationSlug}/pricing/studies/${studyId}/${activeStagePath}`}>
							فتح المرحلة النشطة
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
				</div>
			)}

			{/* Linked Lead Card */}
			{study.lead && (
				<div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
								<UserSearch className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{t("pricing.leads.title")}</p>
								<p className="font-medium text-foreground">{study.lead.name}</p>
								{study.lead.phone && (
									<p className="text-xs text-muted-foreground" dir="ltr">{study.lead.phone}</p>
								)}
							</div>
						</div>
						<div className="flex items-center gap-3">
							<LeadStatusBadge status={study.lead.status} size="sm" />
							<Link
								href={`/app/${organizationSlug}/pricing/leads/${study.lead.id}`}
								className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
							>
								{t("pricing.leads.actions.view")}
								<ExternalLink className="h-3 w-3" />
							</Link>
						</div>
					</div>
				</div>
			)}

			{/* Quantities Sub-Tabs (editors inline) */}
			<QuantitiesSubTabs
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				studyId={studyId}
			/>

			{/* Cost Summary */}
			<div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
				{/* Header */}
				<div className="p-5 border-b border-slate-100 dark:border-slate-800">
					<div className="flex items-center gap-3">
						<div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
							<Calculator className="h-5 w-5 text-slate-600 dark:text-slate-300" />
						</div>
						<div>
							<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("pricing.studies.costSummary")}</h2>
							<p className="text-sm text-slate-500 dark:text-slate-400">{t("pricing.studies.costBreakdown")}</p>
						</div>
					</div>
				</div>

				<div className="p-5">
					<div className="grid lg:grid-cols-2 gap-8">
						{/* Left Column - Cost Items */}
						<div className="space-y-4">
							{/* Direct Costs */}
							<div className="space-y-2">
								<h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t("pricing.studies.directCost")}</h3>

								<div className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30">
									<div className="flex items-center gap-3">
										<Hammer className="h-4 w-4 text-orange-600 dark:text-orange-400" />
										<span className="text-slate-700 dark:text-slate-300">{t("pricing.studies.structural.title")}</span>
									</div>
									<span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(study.structuralCost)}</span>
								</div>

								<div className="flex items-center justify-between p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30">
									<div className="flex items-center gap-3">
										<PaintBucket className="h-4 w-4 text-violet-600 dark:text-violet-400" />
										<span className="text-slate-700 dark:text-slate-300">{t("pricing.studies.finishing.title")}</span>
									</div>
									<span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(study.finishingCost)}</span>
								</div>

								<div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30">
									<div className="flex items-center gap-3">
										<Wrench className="h-4 w-4 text-sky-600 dark:text-sky-400" />
										<span className="text-slate-700 dark:text-slate-300">{t("pricing.studies.mep.title")}</span>
									</div>
									<span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(study.mepCost)}</span>
								</div>

								<div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30">
									<div className="flex items-center gap-3">
										<Building2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
										<span className="text-slate-700 dark:text-slate-300">{t("pricing.studies.labor")}</span>
									</div>
									<span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(study.laborCost)}</span>
								</div>
							</div>

							{/* Overhead & Profit */}
							<div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
								<h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t("pricing.studies.overhead")} & {t("pricing.studies.profit")}</h3>

								<div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
									<span className="text-slate-600 dark:text-slate-400">{t("pricing.studies.overhead")} ({study.overheadPercent}%)</span>
									<span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(overheadAmount)}</span>
								</div>

								<div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
									<span className="text-slate-600 dark:text-slate-400">{t("pricing.studies.profit")} ({study.profitPercent}%)</span>
									<span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(profitAmount)}</span>
								</div>

								{study.vatIncluded && (
									<div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
										<span className="text-slate-600 dark:text-slate-400">{t("pricing.studies.vat")} (15%)</span>
										<span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(vatAmount)}</span>
									</div>
								)}
							</div>
						</div>

						{/* Right Column - Total */}
						<div className="flex flex-col justify-center">
							<div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
								<p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t("pricing.studies.total")}</p>
								<p className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100">
									{formatCurrency(study.totalCost)}
								</p>
								<p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
									{t("pricing.studies.includeVat")}: {study.vatIncluded ? t("common.yes") || "Yes" : t("common.no") || "No"}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
