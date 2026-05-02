import { useMemo } from "react";
import { isUnifiedStudy } from "../lib/unified-flag";

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
	// When the unified workspace is active for this study, the 4 downstream
	// stages (specifications/costing/pricing/quotation) collapse into the
	// single Quantities page.
	const useUnifiedWorkspace = isUnifiedStudy({ workScopes: study.workScopes });

	const enabledStages = useMemo(() => {
		if (useUnifiedWorkspace) return ["quantities"] as const;
		switch (study.studyType) {
			case "FULL_STUDY":
			case "FULL_PROJECT": // backward compat
				return [
					"quantities",
					"specifications",
					"costing",
					"pricing",
				] as const;
			case "COST_PRICING":
				return [
					"quantities",
					"specifications",
					"costing",
					"pricing",
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
				] as const;
		}
	}, [study.studyType, useUnifiedWorkspace]);

	/** Uppercase stage types for filtering PIPELINE_STAGES by key */
	const enabledStageTypes = useMemo(() => {
		if (useUnifiedWorkspace) return ["QUANTITIES"] as const;
		switch (study.studyType) {
			case "FULL_STUDY":
			case "FULL_PROJECT":
				return [
					"QUANTITIES",
					"SPECIFICATIONS",
					"COSTING",
					"PRICING",
				] as const;
			case "COST_PRICING":
				return [
					"QUANTITIES",
					"SPECIFICATIONS",
					"COSTING",
					"PRICING",
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
				] as const;
		}
	}, [study.studyType, useUnifiedWorkspace]);

	const enabledTabs = useMemo(() => {
		const scopes = study.workScopes;
		if (!scopes || scopes.length === 0) {
			// fallback for old studies — unified replaces finishing+mep when active
			if (useUnifiedWorkspace) return ["structural", "unified", "manual"];
			return ["structural", "finishing", "mep", "manual"] as const;
		}
		const tabs: string[] = [];
		if (scopes.includes("STRUCTURAL")) tabs.push("structural");
		if (useUnifiedWorkspace) {
			tabs.push("unified");
		} else {
			if (scopes.includes("FINISHING")) tabs.push("finishing");
			if (scopes.includes("MEP")) tabs.push("mep");
		}
		if (scopes.includes("CUSTOM")) tabs.push("manual");
		return tabs;
	}, [study.workScopes, useUnifiedWorkspace]);

	const isEmptyTableMode = study.studyType === "COST_PRICING";
	const isCostPricingMode = study.studyType === "COST_PRICING";
	const skipCalculationEngines = study.studyType === "COST_PRICING";
	const isQuickPricing =
		study.studyType === "QUICK_PRICING" ||
		study.studyType === "CUSTOM_ITEMS";

	return {
		enabledStages,
		enabledStageTypes,
		enabledTabs,
		isEmptyTableMode,
		isCostPricingMode,
		skipCalculationEngines,
		isQuickPricing,
		useUnifiedWorkspace,
	};
}
