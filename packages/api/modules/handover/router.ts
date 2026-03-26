// Handover Module Router — محاضر الاستلام والتسليم

import {
	listHandoverProtocols,
	getHandoverProtocol,
	createHandoverProtocol,
	updateHandoverProtocol,
	deleteHandoverProtocol,
	addHandoverItem,
	updateHandoverItem,
	deleteHandoverItem,
	importItemsFromContract,
	importItemsFromBOQ,
	submitHandoverProtocol,
	signHandoverProtocol,
	completeHandoverProtocol,
	printHandoverProtocol,
	getWarrantyStatus,
} from "./procedures/handover-protocols";

export const handoverRouter = {
	// Protocol CRUD
	list: listHandoverProtocols,
	getById: getHandoverProtocol,
	create: createHandoverProtocol,
	update: updateHandoverProtocol,
	delete: deleteHandoverProtocol,

	// Items
	items: {
		add: addHandoverItem,
		update: updateHandoverItem,
		delete: deleteHandoverItem,
		importFromContract: importItemsFromContract,
		importFromBOQ: importItemsFromBOQ,
	},

	// Workflow
	submit: submitHandoverProtocol,
	sign: signHandoverProtocol,
	complete: completeHandoverProtocol,
	print: printHandoverProtocol,

	// Reports
	warrantyStatus: getWarrantyStatus,
};
