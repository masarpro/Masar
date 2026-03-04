import {
	getStats,
	getMrrTrendProcedure,
	getPlanDistribution,
	getNewOrgsTrendProcedure,
	getChurnRateProcedure,
} from "./procedures/dashboard";
import {
	list,
	getById,
	changePlan,
	suspend,
	activate,
	setFreeOverride,
	updateLimits,
	getPaymentHistory,
	getMembers,
	getProjects,
} from "./procedures/organizations";
import { getSummary, getByPeriod, getByPlan } from "./procedures/revenue";
import { listLogs } from "./procedures/logs";
import {
	listPlans,
	getPlan,
	updatePlan,
	syncPlanToStripe,
} from "./procedures/plans";
import { activationCodesRouter } from "../activation-codes/router";

export const superAdminRouter = {
	dashboard: {
		getStats,
		getMrrTrend: getMrrTrendProcedure,
		getPlanDistribution,
		getNewOrgsTrend: getNewOrgsTrendProcedure,
		getChurnRate: getChurnRateProcedure,
	},
	organizations: {
		list,
		getById,
		changePlan,
		suspend,
		activate,
		setFreeOverride,
		updateLimits,
		getPaymentHistory,
		getMembers,
		getProjects,
	},
	revenue: {
		getSummary,
		getByPeriod,
		getByPlan,
	},
	logs: {
		list: listLogs,
	},
	plans: {
		list: listPlans,
		getById: getPlan,
		update: updatePlan,
		syncToStripe: syncPlanToStripe,
	},
	activationCodes: activationCodesRouter,
};
