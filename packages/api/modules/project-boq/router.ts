import { assignPhase } from "./procedures/assign-phase";
import { bulkCreate } from "./procedures/bulk-create";
import { bulkDelete } from "./procedures/bulk-delete";
import { bulkUpdatePrices } from "./procedures/bulk-update-prices";
import { copyFromCostStudy } from "./procedures/copy-from-cost-study";
import { copyFromQuotation } from "./procedures/copy-from-quotation";
import { create } from "./procedures/create";
import { deleteItem } from "./procedures/delete";
import { getAvailableCostStudies } from "./procedures/get-available-cost-studies";
import { getAvailableQuotations } from "./procedures/get-available-quotations";
import { getByPhase } from "./procedures/get-by-phase";
import { getSummary } from "./procedures/get-summary";
import { getUnpricedItems } from "./procedures/get-unpriced-items";
import { importFromData } from "./procedures/import-from-data";
import { list } from "./procedures/list";
import { reorder } from "./procedures/reorder";
import { update } from "./procedures/update";

export const projectBoqRouter = {
	list,
	getSummary,
	create,
	bulkCreate,
	update,
	delete: deleteItem,
	bulkDelete,
	bulkUpdatePrices,
	reorder,
	assignPhase,
	getUnpricedItems,
	getByPhase,
	copyFromCostStudy,
	copyFromQuotation,
	importFromData,
	getAvailableQuotations,
	getAvailableCostStudies,
};
