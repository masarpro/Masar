import {
	listChangeOrdersProcedure,
	getChangeOrderStatsProcedure,
} from "./procedures/list-change-orders";
import { getChangeOrderProcedure } from "./procedures/get-change-order";
import { createChangeOrderProcedure } from "./procedures/create-change-order";
import {
	updateChangeOrderProcedure,
	deleteChangeOrderProcedure,
} from "./procedures/update-change-order";
import {
	submitChangeOrderProcedure,
	approveChangeOrderProcedure,
	rejectChangeOrderProcedure,
	markImplementedProcedure,
} from "./procedures/workflow";
import {
	listChangeOrdersForOwnerProcedure,
	getChangeOrderForOwnerProcedure,
} from "./procedures/owner-portal";

export const projectChangeOrdersRouter = {
	// List and stats
	list: listChangeOrdersProcedure,
	getStats: getChangeOrderStatsProcedure,

	// CRUD
	get: getChangeOrderProcedure,
	create: createChangeOrderProcedure,
	update: updateChangeOrderProcedure,
	delete: deleteChangeOrderProcedure,

	// Workflow actions
	submit: submitChangeOrderProcedure,
	approve: approveChangeOrderProcedure,
	reject: rejectChangeOrderProcedure,
	implement: markImplementedProcedure,

	// Owner portal
	ownerList: listChangeOrdersForOwnerProcedure,
	ownerGet: getChangeOrderForOwnerProcedure,
};
