import { list } from "./list";
import { getById } from "./get-by-id";
import { create } from "./create";
import { update } from "./update";
import { deleteLead } from "./delete";
import { updateStatus } from "./update-status";
import { addActivity } from "./add-activity";
import { linkCostStudy } from "./link-cost-study";
import { unlinkCostStudy } from "./unlink-cost-study";
import { linkQuotation } from "./link-quotation";
import { unlinkQuotation } from "./unlink-quotation";
import { getStats } from "./get-stats";
import { getUploadUrl } from "./files/get-upload-url";
import { saveFile } from "./files/save-file";
import { deleteFile } from "./files/delete-file";

export const leadsRouter = {
	list,
	getById,
	create,
	update,
	delete: deleteLead,
	updateStatus,
	addActivity,
	linkCostStudy,
	unlinkCostStudy,
	linkQuotation,
	unlinkQuotation,
	getStats,
	files: {
		getUploadUrl,
		saveFile,
		deleteFile,
	},
};
