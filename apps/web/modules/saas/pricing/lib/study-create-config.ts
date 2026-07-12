import { Building2, ClipboardList, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// Study creation config — single source of truth
// Consumed by: CreateCostStudyForm, EditStudyConfigDialog,
// CostStudyCard (project type colors / scope icons).
// All labels are i18n KEYS (translated at render time).
// ═══════════════════════════════════════════════════════════════

export type StudyGoal = "full_study" | "cost_pricing" | "quick_pricing";

export type NewStudyType = "FULL_STUDY" | "COST_PRICING" | "QUICK_PRICING";

export type WorkScope = "STRUCTURAL" | "FINISHING" | "MEP" | "CUSTOM";

export const GOAL_TO_STUDY_TYPE: Record<StudyGoal, NewStudyType> = {
	full_study: "FULL_STUDY",
	cost_pricing: "COST_PRICING",
	quick_pricing: "QUICK_PRICING",
};

/** Maps the user-facing goal to the starting sub-page after creation */
export const GOAL_TO_START_PAGE: Record<StudyGoal, string> = {
	full_study: "quantities",
	cost_pricing: "quantities",
	quick_pricing: "pricing",
};

export interface GoalConfig {
	/** Lower-case goal value used by the creation wizard */
	goal: StudyGoal;
	/** Matching StudyType enum value (used by EditStudyConfigDialog) */
	studyType: NewStudyType;
	icon: LucideIcon;
	/** i18n key segment: pricing.studies.create.goals.{goalKey}.title/description */
	goalKey: StudyGoal;
	showScope: boolean;
}

export const GOALS: readonly GoalConfig[] = [
	{
		goal: "full_study",
		studyType: "FULL_STUDY",
		icon: Building2,
		goalKey: "full_study",
		showScope: true,
	},
	{
		goal: "cost_pricing",
		studyType: "COST_PRICING",
		icon: ClipboardList,
		goalKey: "cost_pricing",
		showScope: true,
	},
	{
		goal: "quick_pricing",
		studyType: "QUICK_PRICING",
		icon: Zap,
		goalKey: "quick_pricing",
		showScope: false,
	},
] as const;

export interface ScopeItemConfig {
	key: WorkScope;
	/** Local state key used by the creation wizard checkboxes */
	stateKey: "structural" | "finishing" | "mep" | "custom";
	icon: string;
	/** i18n key: pricing.studies.create.scopes.{key} */
	labelKey: string;
}

export const SCOPE_ITEMS: readonly ScopeItemConfig[] = [
	{
		key: "STRUCTURAL",
		stateKey: "structural",
		icon: "🏗️",
		labelKey: "pricing.studies.create.scopes.STRUCTURAL",
	},
	{
		key: "FINISHING",
		stateKey: "finishing",
		icon: "🎨",
		labelKey: "pricing.studies.create.scopes.FINISHING",
	},
	{
		key: "MEP",
		stateKey: "mep",
		icon: "⚡",
		labelKey: "pricing.studies.create.scopes.MEP",
	},
	{
		key: "CUSTOM",
		stateKey: "custom",
		icon: "📝",
		labelKey: "pricing.studies.create.scopes.CUSTOM",
	},
] as const;

/** Quick lookup: scope → emoji icon */
export const SCOPE_ICONS: Record<string, string> = Object.fromEntries(
	SCOPE_ITEMS.map((s) => [s.key, s.icon]),
);

export interface ProjectTypeConfig {
	value: string;
	/** i18n key: pricing.studies.projectTypes.{value} */
	labelKey: string;
	/** Tailwind bg-* class used for the select dot and card accent line */
	color: string;
}

export const PROJECT_TYPES: readonly ProjectTypeConfig[] = [
	{
		value: "residential",
		labelKey: "pricing.studies.projectTypes.residential",
		color: "bg-sky-500",
	},
	{
		value: "commercial",
		labelKey: "pricing.studies.projectTypes.commercial",
		color: "bg-violet-500",
	},
	{
		value: "industrial",
		labelKey: "pricing.studies.projectTypes.industrial",
		color: "bg-orange-500",
	},
	{
		value: "warehouse",
		labelKey: "pricing.studies.projectTypes.warehouse",
		color: "bg-slate-500",
	},
	{
		value: "mixed",
		labelKey: "pricing.studies.projectTypes.mixed",
		color: "bg-teal-500",
	},
] as const;

/** Accent color for a project type (falls back to residential) */
export function getProjectTypeColor(value: string): string {
	return (
		PROJECT_TYPES.find((p) => p.value === value)?.color ?? "bg-sky-500"
	);
}
