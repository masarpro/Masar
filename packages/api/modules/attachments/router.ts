/**
 * Attachments Router
 * Phase 6: Production Hardening
 */

import { createUploadUrlProcedure } from "./procedures/create-upload-url";
import { finalizeUploadProcedure } from "./procedures/finalize-upload";
import { listAttachmentsProcedure } from "./procedures/list-attachments";
import { getDownloadUrlProcedure } from "./procedures/get-download-url";
import { deleteAttachmentProcedure } from "./procedures/delete-attachment";

export const attachmentsRouter = {
	createUploadUrl: createUploadUrlProcedure,
	finalizeUpload: finalizeUploadProcedure,
	list: listAttachmentsProcedure,
	getDownloadUrl: getDownloadUrlProcedure,
	delete: deleteAttachmentProcedure,
};
