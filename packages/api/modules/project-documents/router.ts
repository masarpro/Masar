import { listDocumentsProcedure } from "./procedures/list-documents";
import { createDocumentProcedure } from "./procedures/create-document";
import { getDocumentProcedure } from "./procedures/get-document";
import { createApprovalRequestProcedure } from "./procedures/create-approval-request";
import { actOnApprovalProcedure } from "./procedures/act-on-approval";
import { getApprovalProcedure } from "./procedures/get-approval";
import { getUploadUrlProcedure } from "./procedures/get-upload-url";
import { getDownloadUrlProcedure } from "./procedures/get-download-url";
import { deleteDocumentProcedure } from "./procedures/delete-document";

export const projectDocumentsRouter = {
	list: listDocumentsProcedure,
	create: createDocumentProcedure,
	get: getDocumentProcedure,
	getUploadUrl: getUploadUrlProcedure,
	getDownloadUrl: getDownloadUrlProcedure,
	delete: deleteDocumentProcedure,
	createApprovalRequest: createApprovalRequestProcedure,
	actOnApproval: actOnApprovalProcedure,
	getApproval: getApprovalProcedure,
};
