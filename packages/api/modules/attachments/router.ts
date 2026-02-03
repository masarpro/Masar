/**
 * Attachments Router
 * Phase 6: Production Hardening
 */

import { publicProcedure } from "../../orpc/procedures";
import { createUploadUrlProcedure } from "./procedures/create-upload-url";
import { finalizeUploadProcedure } from "./procedures/finalize-upload";
import { listAttachmentsProcedure } from "./procedures/list-attachments";
import { getDownloadUrlProcedure } from "./procedures/get-download-url";
import { deleteAttachmentProcedure } from "./procedures/delete-attachment";

export const attachmentsRouter = publicProcedure.router({
	createUploadUrl: createUploadUrlProcedure,
	finalizeUpload: finalizeUploadProcedure,
	list: listAttachmentsProcedure,
	getDownloadUrl: getDownloadUrlProcedure,
	delete: deleteAttachmentProcedure,
});
