import { listDocumentsProcedure } from "./procedures/list-documents";
import { createDocumentProcedure } from "./procedures/create-document";
import { getDocumentProcedure } from "./procedures/get-document";
import { createApprovalRequestProcedure } from "./procedures/create-approval-request";
import { actOnApprovalProcedure } from "./procedures/act-on-approval";
import { getApprovalProcedure } from "./procedures/get-approval";
import { getUploadUrlProcedure } from "./procedures/get-upload-url";
import { getDownloadUrlProcedure } from "./procedures/get-download-url";
import { deleteDocumentProcedure } from "./procedures/delete-document";
import { listVersionsProcedure } from "./procedures/list-versions";
import { uploadVersionProcedure } from "./procedures/upload-version";
import { getVersionDownloadUrlProcedure } from "./procedures/get-version-download-url";
import { revertToVersionProcedure } from "./procedures/revert-to-version";
import { listFoldersProcedure } from "./procedures/list-folders";
import { createFolderProcedure } from "./procedures/create-folder";
import { renameFolderProcedure } from "./procedures/rename-folder";
import { deleteFolderProcedure } from "./procedures/delete-folder";

export const projectDocumentsRouter = {
	list: listDocumentsProcedure,
	create: createDocumentProcedure,
	get: getDocumentProcedure,
	getUploadUrl: getUploadUrlProcedure,
	getDownloadUrl: getDownloadUrlProcedure,
	delete: deleteDocumentProcedure,
	// المجلدات الديناميكية
	listFolders: listFoldersProcedure,
	createFolder: createFolderProcedure,
	renameFolder: renameFolderProcedure,
	deleteFolder: deleteFolderProcedure,
	createApprovalRequest: createApprovalRequestProcedure,
	actOnApproval: actOnApprovalProcedure,
	getApproval: getApprovalProcedure,
	listVersions: listVersionsProcedure,
	uploadVersion: uploadVersionProcedure,
	getVersionDownloadUrl: getVersionDownloadUrlProcedure,
	revertToVersion: revertToVersionProcedure,
};
