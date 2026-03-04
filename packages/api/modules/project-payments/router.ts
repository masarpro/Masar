import { getProjectPaymentsSummaryProcedure } from "./procedures/get-summary";
import { listProjectPaymentsProcedure } from "./procedures/list";
import { createProjectPaymentProcedure } from "./procedures/create";
import { updateProjectPaymentProcedure } from "./procedures/update";
import { deleteProjectPaymentProcedure } from "./procedures/delete";

export const projectPaymentsRouter = {
	getSummary: getProjectPaymentsSummaryProcedure,
	list: listProjectPaymentsProcedure,
	create: createProjectPaymentProcedure,
	update: updateProjectPaymentProcedure,
	delete: deleteProjectPaymentProcedure,
};
