import { acknowledgeAlertProcedure } from "./procedures/acknowledge-alert";
import { getInsights } from "./procedures/get-insights";

export const projectInsightsRouter = {
	get: getInsights,
	acknowledge: acknowledgeAlertProcedure,
};
