import { listMilestonesProcedure } from "./procedures/list-milestones";
import { createMilestoneProcedure } from "./procedures/create-milestone";
import {
	updateMilestoneProcedure,
	deleteMilestoneProcedure,
	reorderMilestonesProcedure,
} from "./procedures/update-milestone";
import {
	markActualProcedure,
	startMilestoneProcedure,
	completeMilestoneProcedure,
} from "./procedures/mark-actual";
import { getTimelineHealthProcedure } from "./procedures/get-timeline-health";

export const projectTimelineRouter = {
	listMilestones: listMilestonesProcedure,
	createMilestone: createMilestoneProcedure,
	updateMilestone: updateMilestoneProcedure,
	deleteMilestone: deleteMilestoneProcedure,
	reorderMilestones: reorderMilestonesProcedure,
	markActual: markActualProcedure,
	startMilestone: startMilestoneProcedure,
	completeMilestone: completeMilestoneProcedure,
	getHealth: getTimelineHealthProcedure,
};
