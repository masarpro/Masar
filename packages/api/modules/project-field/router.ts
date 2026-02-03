import { addProgressUpdateProcedure } from "./procedures/add-progress-update";
import { createDailyReportProcedure } from "./procedures/create-daily-report";
import { createIssueProcedure } from "./procedures/create-issue";
import { createPhotoProcedure } from "./procedures/create-photo";
import { getFieldTimelineProcedure } from "./procedures/get-field-timeline";
import { listDailyReportsProcedure } from "./procedures/list-daily-reports";
import { listIssuesProcedure } from "./procedures/list-issues";
import { listPhotosProcedure } from "./procedures/list-photos";
import { listProgressUpdatesProcedure } from "./procedures/list-progress-updates";
import { updateIssueProcedure } from "./procedures/update-issue";

export const projectFieldRouter = {
	// Daily Reports
	createDailyReport: createDailyReportProcedure,
	listDailyReports: listDailyReportsProcedure,

	// Photos
	createPhoto: createPhotoProcedure,
	listPhotos: listPhotosProcedure,

	// Issues
	createIssue: createIssueProcedure,
	listIssues: listIssuesProcedure,
	updateIssue: updateIssueProcedure,

	// Progress Updates
	addProgressUpdate: addProgressUpdateProcedure,
	listProgressUpdates: listProgressUpdatesProcedure,

	// Timeline
	getTimeline: getFieldTimelineProcedure,
};
