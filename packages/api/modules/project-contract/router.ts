import { getContract } from "./procedures/get-contract";
import { upsertContract } from "./procedures/upsert-contract";
import { setPaymentTerms } from "./procedures/set-payment-terms";
import { updatePaymentTerm } from "./procedures/update-payment-term";
import { getContractSummaryProcedure } from "./procedures/get-contract-summary";
import { getNextContractNo } from "./procedures/get-next-contract-no";
import { getPaymentTermsProgressProcedure } from "./procedures/get-payment-terms-progress";

export const projectContractRouter = {
	get: getContract,
	upsert: upsertContract,
	setPaymentTerms,
	updatePaymentTerm,
	getSummary: getContractSummaryProcedure,
	getNextNo: getNextContractNo,
	getPaymentTermsProgress: getPaymentTermsProgressProcedure,
};
