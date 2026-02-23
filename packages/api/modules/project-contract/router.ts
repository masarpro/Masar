import { getContract } from "./procedures/get-contract";
import { upsertContract } from "./procedures/upsert-contract";
import { setPaymentTerms } from "./procedures/set-payment-terms";
import { getContractSummaryProcedure } from "./procedures/get-contract-summary";
import { getNextContractNo } from "./procedures/get-next-contract-no";

export const projectContractRouter = {
	get: getContract,
	upsert: upsertContract,
	setPaymentTerms,
	getSummary: getContractSummaryProcedure,
	getNextNo: getNextContractNo,
};
