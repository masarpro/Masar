"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import {
	ArrowLeft,
	Box,
	Building2,
	Columns3,
	ExternalLink,
	Layers,
	MapPin,
	Sparkles,
	UserSearch,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LeadStatusBadge } from "../leads/LeadStatusBadge";
import { StudyPipelineStepper } from "./StudyPipelineStepper";

interface CostStudyOverviewProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

const STAGE_PATH_MAP: Record<string, string> = {
	QUANTITIES: "quantities",
	SPECIFICATIONS: "specifications",
	COSTING: "costing",
	PRICING: "pricing",
	QUOTATION: "quotation",
	CONVERSION: "convert",
};

const STAGE_LABELS: Record<string, string> = {
	QUANTITIES: "الكميات",
	SPECIFICATIONS: "المواصفات",
	COSTING: "تسعير التكلفة",
	PRICING: "التسعير",
	QUOTATION: "عرض السعر",
	CONVERSION: "مشروع",
};

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

	const { data: stagesData } = useQuery(
		orpc.pricing.studies.studyStages.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	if (!study) {
		return null;
	}

	const activeStage = (activeStageData as any)?.activeStage;
	const activeStagePath = activeStage
		? STAGE_PATH_MAP[activeStage.stage] ?? ""
		: null;
	const activeStageLabel = activeStage
		? STAGE_LABELS[activeStage.stage] ?? ""
		: "";

	const stagesArray = (stagesData as any)?.stages ?? [];
	const entryPoint = (stagesData as any)?.entryPoint ?? "FROM_SCRATCH";

	return (
		<div className="space-y-6">
			{/* Project Info Cards */}
			<Card>
				<CardContent className="p-6">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						<div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-slate-200/50 dark:bg-slate-700/50">
									<Building2 className="h-5 w-5 text-slate-600 dark:text-slate-300" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">
										{t("pricing.studies.form.projectType")}
									</p>
									<p className="font-semibold text-sm">
										{t(
											`pricing.studies.projectTypes.${(study as any).projectType}`,
										)}
									</p>
								</div>
							</div>
						</div>
						<div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-slate-200/50 dark:bg-slate-700/50">
									<Layers className="h-5 w-5 text-slate-600 dark:text-slate-300" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">
										{t("pricing.studies.form.numberOfFloors")}
									</p>
									<p className="font-semibold text-sm">
										{(study as any).numberOfFloors}{" "}
										{t("pricing.studies.floors")}
									</p>
								</div>
							</div>
						</div>
						<div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-slate-200/50 dark:bg-slate-700/50">
									<MapPin className="h-5 w-5 text-slate-600 dark:text-slate-300" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">
										{t("pricing.studies.form.buildingArea")}
									</p>
									<p className="font-semibold text-sm">
										{(study as any).buildingArea} م²
									</p>
								</div>
							</div>
						</div>
						<div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-slate-200/50 dark:bg-slate-700/50">
									<Sparkles className="h-5 w-5 text-slate-600 dark:text-slate-300" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">
										{t("pricing.studies.form.finishingLevel")}
									</p>
									<p className="font-semibold text-sm">
										{t(
											`pricing.studies.finishingLevels.${(study as any).finishingLevel}`,
										)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Pipeline Stepper */}
			<StudyPipelineStepper
				studyId={studyId}
				organizationSlug={organizationSlug}
				stages={stagesArray}
				entryPoint={entryPoint}
			/>

			{/* Open Active Stage Button */}
			{activeStagePath && (
				<div className="flex justify-center">
					<Button
						asChild
						size="lg"
						className="rounded-xl px-8 gap-3 text-base"
					>
						<Link
							href={`/app/${organizationSlug}/pricing/studies/${studyId}/${activeStagePath}`}
						>
							فتح المرحلة النشطة [{activeStageLabel}]
							<ArrowLeft className="h-5 w-5" />
						</Link>
					</Button>
				</div>
			)}

			{/* Quick Summary */}
			<Card>
				<CardContent className="p-6">
					<h3 className="text-sm font-semibold text-muted-foreground mb-4">
						ملخص سريع
					</h3>
					<div className="grid grid-cols-2 gap-4">
						<div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
							<div className="flex items-start justify-between">
								<div>
									<p className="text-sm text-muted-foreground">
										إجمالي الخرسانة
									</p>
									<p className="text-2xl font-bold text-blue-600 mt-1">
										—
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										لم يتم إدخال بيانات بعد
									</p>
								</div>
								<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
									<Box className="h-5 w-5 text-blue-600" />
								</div>
							</div>
						</div>
						<div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
							<div className="flex items-start justify-between">
								<div>
									<p className="text-sm text-muted-foreground">
										إجمالي الحديد
									</p>
									<p className="text-2xl font-bold text-orange-600 mt-1">
										—
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										لم يتم إدخال بيانات بعد
									</p>
								</div>
								<div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
									<Columns3 className="h-5 w-5 text-orange-600" />
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Linked Lead Card */}
			{(study as any).lead && (
				<Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
									<UserSearch className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">
										{t("pricing.leads.title")}
									</p>
									<p className="font-medium text-foreground">
										{(study as any).lead.name}
									</p>
									{(study as any).lead.phone && (
										<p
											className="text-xs text-muted-foreground"
											dir="ltr"
										>
											{(study as any).lead.phone}
										</p>
									)}
								</div>
							</div>
							<div className="flex items-center gap-3">
								<LeadStatusBadge
									status={(study as any).lead.status}
									size="sm"
								/>
								<Link
									href={`/app/${organizationSlug}/pricing/leads/${(study as any).lead.id}`}
									className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
								>
									{t("pricing.leads.actions.view")}
									<ExternalLink className="h-3 w-3" />
								</Link>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
