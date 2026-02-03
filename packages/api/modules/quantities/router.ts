import { list } from "./procedures/list";
import { getById } from "./procedures/get-by-id";
import { create } from "./procedures/create";
import { update } from "./procedures/update";
import { deleteCostStudy } from "./procedures/delete";
import { duplicate } from "./procedures/duplicate";
import { recalculate } from "./procedures/recalculate";
import { structuralItemCreate } from "./procedures/structural-item-create";
import { structuralItemUpdate } from "./procedures/structural-item-update";
import { structuralItemDelete } from "./procedures/structural-item-delete";
import { finishingItemCreate, finishingItemCreateBatch } from "./procedures/finishing-item-create";
import { mepItemCreate, mepItemCreateBatch } from "./procedures/mep-item-create";
import { quoteCreate, quoteGetById, quoteUpdate, quoteDelete, quoteList } from "./procedures/quote-create";

export const quantitiesRouter = {
	list,
	getById,
	create,
	update,
	delete: deleteCostStudy,
	duplicate,
	recalculate,
	structuralItem: {
		create: structuralItemCreate,
		update: structuralItemUpdate,
		delete: structuralItemDelete,
	},
	finishingItem: {
		create: finishingItemCreate,
		createBatch: finishingItemCreateBatch,
	},
	mepItem: {
		create: mepItemCreate,
		createBatch: mepItemCreateBatch,
	},
	quote: {
		list: quoteList,
		create: quoteCreate,
		getById: quoteGetById,
		update: quoteUpdate,
		delete: quoteDelete,
	},
};
