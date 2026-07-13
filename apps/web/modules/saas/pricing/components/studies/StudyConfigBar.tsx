"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { SCOPE_ICONS } from "../../lib/study-create-config";

const STUDY_TYPE_COLORS: Record<string, string> = {
	FULL_STUDY: "bg-chart-4/15 text-chart-4",
	COST_PRICING: "bg-chart-1/15 text-chart-1",
	QUICK_PRICING: "bg-success/15 text-success",
	FULL_PROJECT: "bg-chart-4/15 text-chart-4",
	CUSTOM_ITEMS: "bg-success/15 text-success",
	LUMP_SUM_ANALYSIS: "bg-chart-4/15 text-chart-4",
};

const STUDY_TYPE_LABEL_KEY: Record<string, string> = {
	FULL_STUDY: "pricing.studies.create.goals.full_study.title",
	COST_PRICING: "pricing.studies.create.goals.cost_pricing.title",
	QUICK_PRICING: "pricing.studies.create.goals.quick_pricing.title",
	FULL_PROJECT: "pricing.studies.studyTypes.fullProject",
	CUSTOM_ITEMS: "pricing.studies.studyTypes.customItems",
	LUMP_SUM_ANALYSIS: "pricing.studies.studyTypes.lumpSumAnalysis",
};


interface StudyConfigBarProps {
	studyType: string;
	workScopes: string[];
	onEdit?: () => void;
	canEdit?: boolean;
}

export function StudyConfigBar({
	studyType,
	workScopes,
	onEdit,
	canEdit = true,
}: StudyConfigBarProps) {
	const t = useTranslations();

	const typeLabel = STUDY_TYPE_LABEL_KEY[studyType]
		? t(STUDY_TYPE_LABEL_KEY[studyType])
		: studyType;

	const typeColor = STUDY_TYPE_COLORS[studyType] ?? "bg-muted text-muted-foreground";

	return (
		<div
			className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-2.5 flex-wrap"
			dir="rtl"
		>
			{/* Study type badge */}
			<Badge className={cn("rounded-lg px-3 py-1 text-xs font-medium", typeColor)}>
				{typeLabel}
			</Badge>

			{/* Work scopes chips */}
			{workScopes.length > 0 && (
				<>
					<span className="text-muted-foreground/50">•</span>
					<div className="flex items-center gap-1.5 flex-wrap">
						{workScopes.map((scope) => (
							<Badge
								key={scope}
								variant="outline"
								className="rounded-lg px-2 py-0.5 text-xs gap-1"
							>
								<span>{SCOPE_ICONS[scope] ?? ""}</span>
								{t(`pricing.studies.create.scopes.${scope}`)}
							</Badge>
						))}
					</div>
				</>
			)}

			{/* Edit button */}
			{canEdit && onEdit && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onEdit}
					className="ms-auto h-7 w-7 p-0"
				>
					<Pencil className="h-3.5 w-3.5" />
				</Button>
			)}
		</div>
	);
}
