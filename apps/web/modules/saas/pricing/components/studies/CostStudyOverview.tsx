"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	ArrowRight,
	Building2,
	Calculator,
	ChevronLeft,
	Hammer,
	Layers,
	MapPin,
	PaintBucket,
	Receipt,
	Sparkles,
	Wrench,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatCurrency } from "../../lib/utils";

interface CostStudyOverviewProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
	draft: {
		bg: "bg-slate-100 dark:bg-slate-800",
		text: "text-slate-600 dark:text-slate-400",
		dot: "bg-slate-400",
	},
	in_progress: {
		bg: "bg-amber-50 dark:bg-amber-950/50",
		text: "text-amber-700 dark:text-amber-400",
		dot: "bg-amber-500",
	},
	completed: {
		bg: "bg-teal-50 dark:bg-teal-950/50",
		text: "text-teal-700 dark:text-teal-400",
		dot: "bg-teal-500",
	},
	approved: {
		bg: "bg-indigo-50 dark:bg-indigo-950/50",
		text: "text-indigo-700 dark:text-indigo-400",
		dot: "bg-indigo-500",
	},
};

export function CostStudyOverview({
	organizationId,
	organizationSlug,
	studyId,
}: CostStudyOverviewProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/pricing/studies/${studyId}`;

	const { data: study, isLoading } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: {
				id: studyId,
				organizationId,
			},
		}),
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	if (!study) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div className="relative mb-6">
					<div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full blur-2xl" />
					<div className="relative p-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-muted-foreground/10">
						<Calculator className="h-16 w-16 text-muted-foreground" />
					</div>
				</div>
				<p className="text-muted-foreground text-lg">{t("pricing.studies.notFound")}</p>
			</div>
		);
	}

	const statusConfig = STATUS_CONFIG[study.status] || STATUS_CONFIG.draft;

	const sections = [
		{
			title: t("pricing.studies.structural.title"),
			icon: Hammer,
			href: `${basePath}/structural`,
			count: study.structuralItems.length,
			cost: study.structuralCost,
			accent: "bg-orange-500",
			bg: "bg-orange-50 dark:bg-orange-950/30",
			iconBg: "bg-orange-100 dark:bg-orange-900/50",
			iconColor: "text-orange-600 dark:text-orange-400",
		},
		{
			title: t("pricing.studies.finishing.title"),
			icon: PaintBucket,
			href: `${basePath}/finishing`,
			count: study.finishingItems.length,
			cost: study.finishingCost,
			accent: "bg-violet-500",
			bg: "bg-violet-50 dark:bg-violet-950/30",
			iconBg: "bg-violet-100 dark:bg-violet-900/50",
			iconColor: "text-violet-600 dark:text-violet-400",
		},
		{
			title: t("pricing.studies.mep.title"),
			icon: Wrench,
			href: `${basePath}/mep`,
			count: study.mepItems.length,
			cost: study.mepCost,
			accent: "bg-sky-500",
			bg: "bg-sky-50 dark:bg-sky-950/30",
			iconBg: "bg-sky-100 dark:bg-sky-900/50",
			iconColor: "text-sky-600 dark:text-sky-400",
		},
		{
			title: t("pricing.studies.pricing.title"),
			icon: Receipt,
			href: `${basePath}/pricing`,
			count: study.quotes.length,
			cost: study.totalCost,
			accent: "bg-teal-500",
			bg: "bg-teal-50 dark:bg-teal-950/30",
			iconBg: "bg-teal-100 dark:bg-teal-900/50",
			iconColor: "text-teal-600 dark:text-teal-400",
		},
	];

	const directCosts = study.structuralCost + study.finishingCost + study.mepCost + study.laborCost;
	const overheadAmount = directCosts * (study.overheadPercent / 100);
	const profitAmount = directCosts * (study.profitPercent / 100);
	const vatAmount = study.vatIncluded ? study.totalCost * 0.15 / 1.15 : 0;

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
				<div className="flex items-start gap-4">
					<Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 mt-1">
						<Link href={`/app/${organizationSlug}/pricing/studies`}>
							<ChevronLeft className="h-5 w-5 text-slate-500" />
						</Link>
					</Button>
					<div className="space-y-2">
						<div className="flex items-center gap-3 flex-wrap">
							<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
								{study.name || t("pricing.studies.unnamed")}
							</h1>
							<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
								<span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
								{t(`pricing.studies.status.${study.status}`)}
							</span>
						</div>
						{study.customerName && (
							<p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
								<MapPin className="h-4 w-4" />
								{study.customerName}
							</p>
						)}
					</div>
				</div>

				{/* Quick Stats */}
				<div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4">
					<div className="text-center">
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("pricing.studies.form.buildingArea")}</p>
						<p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{study.buildingArea} م²</p>
					</div>
					<div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
					<div className="text-center">
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("pricing.studies.form.numberOfFloors")}</p>
						<p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{study.numberOfFloors}</p>
					</div>
					<div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
					<div className="text-center">
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("pricing.studies.totalCost")}</p>
						<p className="text-lg font-semibold text-teal-600 dark:text-teal-400">
							{formatCurrency(study.totalCost)}
						</p>
					</div>
				</div>
			</div>

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

			{/* Sections Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{sections.map((section) => (
					<Link key={section.href} href={section.href}>
						<div className={`group rounded-2xl ${section.bg} p-5 transition-all duration-200 hover:shadow-sm`}>
							<div className={`h-1 w-12 ${section.accent} rounded-full mb-4`} />

							<div className="flex items-start justify-between mb-4">
								<div className={`p-2.5 rounded-xl ${section.iconBg}`}>
									<section.icon className={`h-5 w-5 ${section.iconColor}`} />
								</div>
								<ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
							</div>

							<h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">{section.title}</h3>

							<div className="flex items-end justify-between">
								<div>
									<p className="text-xs text-slate-500 dark:text-slate-400">{t("pricing.studies.items")}</p>
									<p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{section.count}</p>
								</div>
								<p className="text-base font-semibold text-slate-700 dark:text-slate-300">
									{formatCurrency(section.cost)}
								</p>
							</div>
						</div>
					</Link>
				))}
			</div>

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

								<div className="flex items-center justify-between p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30">
									<div className="flex items-center gap-3">
										<Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
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
