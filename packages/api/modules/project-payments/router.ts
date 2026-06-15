import { getProjectPaymentsSummaryProcedure } from "./procedures/get-summary";
import { listProjectPaymentsProcedure } from "./procedures/list";
import { createProjectPaymentProcedure } from "./procedures/create";
import { updateProjectPaymentProcedure } from "./procedures/update";
import { deleteProjectPaymentProcedure } from "./procedures/delete";
import { getExecutionMilestonesForPaymentsProcedure } from "./procedures/get-execution-milestones";
import { copyTermsFromExecutionProcedure } from "./procedures/copy-terms-from-execution";

export const projectPaymentsRouter = {
	getSummary: getProjectPaymentsSummaryProcedure,
	list: listProjectPaymentsProcedure,
	create: createProjectPaymentProcedure,
	update: updateProjectPaymentProcedure,
	delete: deleteProjectPaymentProcedure,
	getExecutionMilestones: getExecutionMilestonesForPaymentsProcedure,
	copyTermsFromExecution: copyTermsFromExecutionProcedure,
};
