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
};
