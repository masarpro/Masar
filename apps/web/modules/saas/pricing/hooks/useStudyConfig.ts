import { useMemo } from "react";
import { usePermission } from "@saas/permissions/hooks/use-permission";
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
	const useUnifiedWorkspace = isUnifiedStudy({
		workScopes: study.workScopes,
		studyType: study.studyType,
	});

	// مراحل الأموال (التكلفة/التسعير/العرض) تُخفى لمن لا يملك صلاحية تسعير
	// فعلية — الـ API يحجب بياناتها أيضاً؛ هذا الإخفاء يمنع صفحات 403 فارغة
	const { can } = usePermission();
	const canSeeCosting =
		can("pricing", "editCosting") ||
		can("pricing", "approveCosting") ||
		can("pricing", "editSellingPrice") ||
		can("pricing", "pricing") ||
		can("quantities", "pricing");
	const canSeeQuotation =
		can("pricing", "quotations") || can("pricing", "pricing");
	const stageAllowed = (stage: string) => {
		if (stage === "costing" || stage === "pricing") return canSeeCosting;
		if (stage === "COSTING" || stage === "PRICING") return canSeeCosting;
		if (stage === "quotation" || stage === "convert") return canSeeQuotation;
		if (stage === "QUOTATION" || stage === "CONVERSION") return canSeeQuotation;
		return true;
	};

	const enabledStages = useMemo(() => {
		const base: readonly string[] = (() => {
			if (useUnifiedWorkspace) return ["quantities"] as const;
			switch (study.studyType) {
				case "FULL_STUDY":
				case "FULL_PROJECT": // backward compat
					return [
						"quantities",
						"specifications",
						"costing",
						"pricing",
						"quotation",
					] as const;
				case "COST_PRICING":
					return [
						"quantities",
						"specifications",
						"costing",
						"pricing",
						"quotation",
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
		})();
		return base.filter(stageAllowed);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [study.studyType, useUnifiedWorkspace, canSeeCosting, canSeeQuotation]);

	/** Uppercase stage types for filtering PIPELINE_STAGES by key */
	const enabledStageTypes = useMemo(() => {
		const base: readonly string[] = (() => {
			if (useUnifiedWorkspace) return ["QUANTITIES"] as const;
			switch (study.studyType) {
				case "FULL_STUDY":
				case "FULL_PROJECT":
					return [
						"QUANTITIES",
						"SPECIFICATIONS",
						"COSTING",
						"PRICING",
						"QUOTATION",
					] as const;
				case "COST_PRICING":
					return [
						"QUANTITIES",
						"SPECIFICATIONS",
						"COSTING",
						"PRICING",
						"QUOTATION",
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
		})();
		return base.filter(stageAllowed);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [study.studyType, useUnifiedWorkspace, canSeeCosting, canSeeQuotation]);

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
