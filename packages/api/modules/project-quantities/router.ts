import { assignItemToPhase } from "./procedures/assign-item-to-phase";
import { bulkAssignToPhase } from "./procedures/bulk-assign-to-phase";
import { createStudy } from "./procedures/create-study";
import { getAvailableStudies } from "./procedures/get-available-studies";
import { getMaterialsList } from "./procedures/get-materials-list";
import { getPhaseBreakdown } from "./procedures/get-phase-breakdown";
import { getSummary } from "./procedures/get-summary";
import { linkStudy } from "./procedures/link-study";
import { listStudies } from "./procedures/list-studies";
import { unlinkStudy } from "./procedures/unlink-study";

export const projectQuantitiesRouter = {
	getSummary,
	listStudies,
	linkStudy,
	unlinkStudy,
	createStudy,
	getPhaseBreakdown,
	assignItemToPhase,
	bulkAssignToPhase,
	getMaterialsList,
	getAvailableStudies,
};
