import { listSubcontracts } from "./procedures/list";
import { getSubcontract } from "./procedures/get";
import { createSubcontractProcedure } from "./procedures/create";
import { updateSubcontractProcedure } from "./procedures/update";
import { deleteSubcontractProcedure } from "./procedures/delete";
import { setSubcontractPaymentTermsProcedure } from "./procedures/set-payment-terms";
import { getSubcontractPaymentTermsProgressProcedure } from "./procedures/get-payment-terms-progress";
import { getSubcontractsSummaryProcedure } from "./procedures/get-summary";
import { createSubcontractChangeOrderProcedure } from "./procedures/create-change-order";
import { updateSubcontractChangeOrderProcedure } from "./procedures/update-change-order";
import { deleteSubcontractChangeOrderProcedure } from "./procedures/delete-change-order";
import { createSubcontractPaymentProcedure } from "./procedures/create-payment";
import { generateSubcontractNoProcedure } from "./procedures/generate-contract-no";
import { getSubcontractClaimProcedure } from "./procedures/get-claim";
import { listSubcontractClaimsProcedure } from "./procedures/list-claims";
import { createSubcontractClaimProcedure } from "./procedures/create-claim";
import { updateSubcontractClaimProcedure } from "./procedures/update-claim";
import { deleteSubcontractClaimProcedure } from "./procedures/delete-claim";
import { updateSubcontractClaimStatusProcedure } from "./procedures/update-claim-status";
import { addSubcontractClaimPaymentProcedure } from "./procedures/add-claim-payment";
import { getSubcontractClaimSummaryProcedure } from "./procedures/get-claim-summary";
import { listSubcontractItemsProcedure } from "./procedures/list-items";
import { createSubcontractItemProcedure } from "./procedures/create-item";
import { updateSubcontractItemProcedure } from "./procedures/update-item";
import { deleteSubcontractItemProcedure } from "./procedures/delete-item";
import { copySubcontractItemsProcedure } from "./procedures/copy-items";
import { getSubcontractClaimPrintDataProcedure, markSubcontractClaimAsPrintedProcedure } from "./procedures/get-claim-print-data";

export const subcontractsRouter = {
	list: listSubcontracts,
	get: getSubcontract,
	create: createSubcontractProcedure,
	update: updateSubcontractProcedure,
	delete: deleteSubcontractProcedure,
	setPaymentTerms: setSubcontractPaymentTermsProcedure,
	getPaymentTermsProgress: getSubcontractPaymentTermsProgressProcedure,
	getSummary: getSubcontractsSummaryProcedure,
	createChangeOrder: createSubcontractChangeOrderProcedure,
	updateChangeOrder: updateSubcontractChangeOrderProcedure,
	deleteChangeOrder: deleteSubcontractChangeOrderProcedure,
	createPayment: createSubcontractPaymentProcedure,
	generateContractNo: generateSubcontractNoProcedure,
	// Claims
	getClaim: getSubcontractClaimProcedure,
	listClaims: listSubcontractClaimsProcedure,
	createClaim: createSubcontractClaimProcedure,
	updateClaim: updateSubcontractClaimProcedure,
	deleteClaim: deleteSubcontractClaimProcedure,
	updateClaimStatus: updateSubcontractClaimStatusProcedure,
	addClaimPayment: addSubcontractClaimPaymentProcedure,
	getClaimSummary: getSubcontractClaimSummaryProcedure,
	getClaimPrintData: getSubcontractClaimPrintDataProcedure,
	markClaimAsPrinted: markSubcontractClaimAsPrintedProcedure,
	// Items
	listItems: listSubcontractItemsProcedure,
	createItem: createSubcontractItemProcedure,
	updateItem: updateSubcontractItemProcedure,
	deleteItem: deleteSubcontractItemProcedure,
	copyItems: copySubcontractItemsProcedure,
};
