// ════════════════════════════════════════════════════════════════
// Unified Quantities Engine — Compute (barrel)
// ════════════════════════════════════════════════════════════════

export { compute } from "./item-computer";

export type {
	CalculationMethod,
	LinkFormula,
	DecimalLike,
	ComputeInput,
	ComputeOutput,
	ComputeBreakdown,
	ComputeItemInput,
	ComputeContext,
	ComputeContextSpace,
	ComputeContextOpening,
	ComputeLinkedItem,
} from "./types";

// Methods (للاستخدام المباشر إذا لزم)
export { computeDirectArea } from "./methods/direct-area";
export { computeLengthXHeight } from "./methods/length-x-height";
export { computeLengthOnly } from "./methods/length-only";
export { computePerUnit } from "./methods/per-unit";
export { computePerRoom } from "./methods/per-room";
export { computePolygon } from "./methods/polygon";
export { computeManual } from "./methods/manual";
export { computeLumpSum } from "./methods/lump-sum";

// Helpers (للـ UI تحتاج Shoelace مباشرة)
export {
	shoelaceArea,
	polygonPerimeter,
	validatePolygon,
} from "./helpers/polygon-helper";
export {
	calculateOpeningsArea,
	calculateExteriorOpeningsArea,
} from "./helpers/openings-deductor";
export { applyWastage } from "./helpers/wastage-applier";
export { resolveLinkedQuantity } from "./helpers/link-resolver";
