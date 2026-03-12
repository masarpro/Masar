"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

const STUDY_TYPE_COLORS: Record<string, string> = {
	FULL_STUDY: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	COST_PRICING: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
	QUICK_PRICING: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
	FULL_PROJECT: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	CUSTOM_ITEMS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
	LUMP_SUM_ANALYSIS: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

const STUDY_TYPE_LABEL_KEY: Record<string, string> = {
	FULL_STUDY: "pricing.studies.create.goals.full_study.title",
	COST_PRICING: "pricing.studies.create.goals.cost_pricing.title",
	QUICK_PRICING: "pricing.studies.create.goals.quick_pricing.title",
	FULL_PROJECT: "pricing.studies.studyTypes.fullProject",
	CUSTOM_ITEMS: "pricing.studies.studyTypes.customItems",
	LUMP_SUM_ANALYSIS: "pricing.studies.studyTypes.lumpSumAnalysis",
};

const SCOPE_ICONS: Record<string, string> = {
	STRUCTURAL: "🏗️",
	FINISHING: "🎨",
	MEP: "⚡",
	CUSTOM: "📝",
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
					className="mr-auto h-7 w-7 p-0"
				>
					<Pencil className="h-3.5 w-3.5" />
				</Button>
			)}
		</div>
	);
}
