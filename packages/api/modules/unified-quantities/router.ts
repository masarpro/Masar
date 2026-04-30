// ════════════════════════════════════════════════════════════════
// Unified Quantities — oRPC Router
// 20 procedure: catalog (3) + items (6) + context (6) + pricing (4)
//             + settings (1)
// ════════════════════════════════════════════════════════════════

// Catalog
import { getCatalog } from "./procedures/catalog/get-catalog";
import { getPresets } from "./procedures/catalog/get-presets";
import { applyPreset } from "./procedures/catalog/apply-preset";

// Items
import { getItems } from "./procedures/items/get-items";
import { upsertItem } from "./procedures/items/upsert-item";
import { deleteItem } from "./procedures/items/delete-item";
import { reorderItems } from "./procedures/items/reorder-items";
import { duplicateItem } from "./procedures/items/duplicate-item";
import { linkItems } from "./procedures/items/link-items";

// Context
import { getContext } from "./procedures/context/get-context";
import { updateContext } from "./procedures/context/update-context";
import { upsertSpace } from "./procedures/context/upsert-space";
import { deleteSpace } from "./procedures/context/delete-space";
import { upsertOpening } from "./procedures/context/upsert-opening";
import { deleteOpening } from "./procedures/context/delete-opening";

// Pricing
import { updatePricing } from "./procedures/pricing/update-pricing";
import { updateGlobalMarkup } from "./procedures/pricing/update-global-markup";
import { getStudyTotals } from "./procedures/pricing/get-study-totals";
import { bulkUpdatePricing } from "./procedures/pricing/bulk-update-pricing";

// Settings
import { updateStudySettings } from "./procedures/settings/update-study-settings";

export const unifiedQuantitiesRouter = {
	// Catalog (3)
	getCatalog,
	getPresets,
	applyPreset,

	// Items (6)
	getItems,
	upsertItem,
	deleteItem,
	reorderItems,
	duplicateItem,
	linkItems,

	// Context (6)
	context: {
		get: getContext,
		update: updateContext,
		upsertSpace,
		deleteSpace,
		upsertOpening,
		deleteOpening,
	},

	// Pricing (4)
	pricing: {
		updatePricing,
		updateGlobalMarkup,
		getStudyTotals,
		bulkUpdatePricing,
	},

	// Settings (1)
	updateStudySettings,
};
