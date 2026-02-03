import { publicProcedure } from "../../orpc/procedures";
import { listDocumentsProcedure } from "./procedures/list-documents";
import { createDocumentProcedure } from "./procedures/create-document";
import { getDocumentProcedure } from "./procedures/get-document";
import { createApprovalRequestProcedure } from "./procedures/create-approval-request";
import { actOnApprovalProcedure } from "./procedures/act-on-approval";
import { getApprovalProcedure } from "./procedures/get-approval";

export const projectDocumentsRouter = publicProcedure.router({
	list: listDocumentsProcedure,
	create: createDocumentProcedure,
	get: getDocumentProcedure,
	createApprovalRequest: createApprovalRequestProcedure,
	actOnApproval: actOnApprovalProcedure,
	getApproval: getApprovalProcedure,
});
