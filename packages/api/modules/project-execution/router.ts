// Activities
import { listActivitiesProcedure } from "./procedures/list-activities";
import { createActivityProcedure } from "./procedures/create-activity";
import { updateActivityProcedure } from "./procedures/update-activity";
import { deleteActivityProcedure } from "./procedures/delete-activity";
import { reorderActivitiesProcedure } from "./procedures/reorder-activities";
import { updateActivityProgressProcedure } from "./procedures/update-activity-progress";
import { bulkUpdateProgressProcedure } from "./procedures/bulk-update-progress";
// Dependencies
import { listDependenciesProcedure } from "./procedures/list-dependencies";
import { createDependencyProcedure } from "./procedures/create-dependency";
import { deleteDependencyProcedure } from "./procedures/delete-dependency";
import { validateDependenciesProcedure } from "./procedures/validate-dependencies";
// Baselines
import { listBaselinesProcedure } from "./procedures/list-baselines";
import { createBaselineProcedure } from "./procedures/create-baseline";
import { getBaselineProcedure } from "./procedures/get-baseline";
import { setActiveBaselineProcedure } from "./procedures/set-active-baseline";
import { deleteBaselineProcedure } from "./procedures/delete-baseline";
// Calendar
import { getCalendarProcedure } from "./procedures/get-calendar";
import { upsertCalendarProcedure } from "./procedures/upsert-calendar";
// Checklists
import { listChecklistsProcedure } from "./procedures/list-checklists";
import { createChecklistItemProcedure } from "./procedures/create-checklist-item";
import { toggleChecklistItemProcedure } from "./procedures/toggle-checklist-item";
import { deleteChecklistItemProcedure } from "./procedures/delete-checklist-item";
import { reorderChecklistProcedure } from "./procedures/reorder-checklist";
// Analytics
import { getDashboardProcedure } from "./procedures/get-dashboard";
import { getCriticalPathProcedure } from "./procedures/get-critical-path";
import { getLookaheadProcedure } from "./procedures/get-lookahead";
import { getDelayAnalysisProcedure } from "./procedures/get-delay-analysis";
import { getPlannedVsActualProcedure } from "./procedures/get-planned-vs-actual";

export const projectExecutionRouter = {
	// Activities
	listActivities: listActivitiesProcedure,
	createActivity: createActivityProcedure,
	updateActivity: updateActivityProcedure,
	deleteActivity: deleteActivityProcedure,
	reorderActivities: reorderActivitiesProcedure,
	updateActivityProgress: updateActivityProgressProcedure,
	bulkUpdateProgress: bulkUpdateProgressProcedure,
	// Dependencies
	listDependencies: listDependenciesProcedure,
	createDependency: createDependencyProcedure,
	deleteDependency: deleteDependencyProcedure,
	validateDependencies: validateDependenciesProcedure,
	// Baselines
	listBaselines: listBaselinesProcedure,
	createBaseline: createBaselineProcedure,
	getBaseline: getBaselineProcedure,
	setActiveBaseline: setActiveBaselineProcedure,
	deleteBaseline: deleteBaselineProcedure,
	// Calendar
	getCalendar: getCalendarProcedure,
	upsertCalendar: upsertCalendarProcedure,
	// Checklists
	listChecklists: listChecklistsProcedure,
	createChecklistItem: createChecklistItemProcedure,
	toggleChecklistItem: toggleChecklistItemProcedure,
	deleteChecklistItem: deleteChecklistItemProcedure,
	reorderChecklist: reorderChecklistProcedure,
	// Analytics
	getDashboard: getDashboardProcedure,
	getCriticalPath: getCriticalPathProcedure,
	getLookahead: getLookaheadProcedure,
	getDelayAnalysis: getDelayAnalysisProcedure,
	getPlannedVsActual: getPlannedVsActualProcedure,
};
