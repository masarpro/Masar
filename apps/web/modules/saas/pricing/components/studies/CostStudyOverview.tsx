"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	ArrowLeft,
	Building2,
	ExternalLink,
	Layers,
	MapPin,
	Sparkles,
	UserSearch,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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

	const activeStage = (activeStageData as any)?.activeStage;
	const activeStagePath = activeStage
		? STAGE_PATH_MAP[activeStage.stage] ?? ""
		: null;

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
							<p className="font-medium text-slate-900 dark:text-slate-100">{t(`pricing.studies.projectTypes.${(study as any).projectType}`)}</p>
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
							<p className="font-medium text-slate-900 dark:text-slate-100">{(study as any).numberOfFloors} {t("pricing.studies.floors")}</p>
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
							<p className="font-medium text-slate-900 dark:text-slate-100">{(study as any).buildingArea} م²</p>
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
							<p className="font-medium text-slate-900 dark:text-slate-100">{t(`pricing.studies.finishingLevels.${(study as any).finishingLevel}`)}</p>
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
			{(study as any).lead && (
				<div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
								<UserSearch className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{t("pricing.leads.title")}</p>
								<p className="font-medium text-foreground">{(study as any).lead.name}</p>
								{(study as any).lead.phone && (
									<p className="text-xs text-muted-foreground" dir="ltr">{(study as any).lead.phone}</p>
								)}
							</div>
						</div>
						<div className="flex items-center gap-3">
							<LeadStatusBadge status={(study as any).lead.status} size="sm" />
							<Link
								href={`/app/${organizationSlug}/pricing/leads/${(study as any).lead.id}`}
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
		</div>
	);
}
