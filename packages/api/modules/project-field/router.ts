import { addProgressUpdateProcedure } from "./procedures/add-progress-update";
import { bulkDeletePhotosProcedure } from "./procedures/bulk-delete-photos";
import { bulkUpdatePhotosProcedure } from "./procedures/bulk-update-photos";
import { createDailyReportProcedure } from "./procedures/create-daily-report";
import { createIssueProcedure } from "./procedures/create-issue";
import { createPhotoProcedure } from "./procedures/create-photo";
import { deletePhotoProcedure } from "./procedures/delete-photo";
import { getFieldTimelineProcedure } from "./procedures/get-field-timeline";
import { listDailyReportsProcedure } from "./procedures/list-daily-reports";
import { listIssuesProcedure } from "./procedures/list-issues";
import { listPhotosProcedure } from "./procedures/list-photos";
import { listProgressUpdatesProcedure } from "./procedures/list-progress-updates";
import {
	setCoverPhotoProcedure,
	unsetCoverPhotoProcedure,
} from "./procedures/set-cover-photo";
import { updateIssueProcedure } from "./procedures/update-issue";
import { updatePhotoProcedure } from "./procedures/update-photo";

export const projectFieldRouter = {
	// Daily Reports
	createDailyReport: createDailyReportProcedure,
	listDailyReports: listDailyReportsProcedure,

	// Photos
	createPhoto: createPhotoProcedure,
	listPhotos: listPhotosProcedure,
	updatePhoto: updatePhotoProcedure,
	deletePhoto: deletePhotoProcedure,
	bulkUpdatePhotos: bulkUpdatePhotosProcedure,
	bulkDeletePhotos: bulkDeletePhotosProcedure,
	setCoverPhoto: setCoverPhotoProcedure,
	unsetCoverPhoto: unsetCoverPhotoProcedure,

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
