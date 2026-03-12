import { useMemo } from "react";

interface StudyConfigInput {
	studyType: string;
	workScopes: string[];
	entryPoint?: string;
}

/** Stage keys matching PIPELINE_STAGES and sidebar items */
const ALL_STAGE_KEYS = [
	"quantities",
	"specifications",
	"costing",
	"pricing",
	"quotation",
	"convert",
] as const;

/** Stage keys as uppercase matching StageType enum */
const ALL_STAGE_TYPES = [
	"QUANTITIES",
	"SPECIFICATIONS",
	"COSTING",
	"PRICING",
	"QUOTATION",
	"CONVERSION",
] as const;

export function useStudyConfig(study: StudyConfigInput) {
	const enabledStages = useMemo(() => {
		switch (study.studyType) {
			case "FULL_STUDY":
			case "FULL_PROJECT": // backward compat
			case "COST_PRICING":
				return [
					"quantities",
					"specifications",
					"costing",
					"pricing",
					"quotation",
					"convert",
				] as const;
			case "QUICK_PRICING":
			case "CUSTOM_ITEMS": // backward compat
				return ["pricing", "quotation"] as const;
			case "LUMP_SUM_ANALYSIS":
				return ["costing", "pricing"] as const;
			default:
				return [
					"quantities",
					"specifications",
					"costing",
					"pricing",
					"quotation",
					"convert",
				] as const;
		}
	}, [study.studyType]);

	/** Uppercase stage types for filtering PIPELINE_STAGES by key */
	const enabledStageTypes = useMemo(() => {
		switch (study.studyType) {
			case "FULL_STUDY":
			case "FULL_PROJECT":
			case "COST_PRICING":
				return [
					"QUANTITIES",
					"SPECIFICATIONS",
					"COSTING",
					"PRICING",
					"QUOTATION",
					"CONVERSION",
				] as const;
			case "QUICK_PRICING":
			case "CUSTOM_ITEMS":
				return ["PRICING", "QUOTATION"] as const;
			case "LUMP_SUM_ANALYSIS":
				return ["COSTING", "PRICING"] as const;
			default:
				return [
					"QUANTITIES",
					"SPECIFICATIONS",
					"COSTING",
					"PRICING",
					"QUOTATION",
					"CONVERSION",
				] as const;
		}
	}, [study.studyType]);

	const enabledTabs = useMemo(() => {
		const scopes = study.workScopes;
		if (!scopes || scopes.length === 0) {
			// fallback: all tabs (for old studies)
			return ["structural", "finishing", "mep", "manual"] as const;
		}
		const tabs: string[] = [];
		if (scopes.includes("STRUCTURAL")) tabs.push("structural");
		if (scopes.includes("FINISHING")) tabs.push("finishing");
		if (scopes.includes("MEP")) tabs.push("mep");
		if (scopes.includes("CUSTOM")) tabs.push("manual");
		return tabs;
	}, [study.workScopes]);

	const isEmptyTableMode = study.studyType === "COST_PRICING";
	const isQuickPricing =
		study.studyType === "QUICK_PRICING" ||
		study.studyType === "CUSTOM_ITEMS";

	return {
		enabledStages,
		enabledStageTypes,
		enabledTabs,
		isEmptyTableMode,
		isQuickPricing,
	};
}
