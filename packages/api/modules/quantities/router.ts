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
import { finishingItemUpdate } from "./procedures/finishing-item-update";
import { finishingItemDelete } from "./procedures/finishing-item-delete";
import { finishingItemReorder } from "./procedures/finishing-item-reorder";
import { buildingConfigUpdate } from "./procedures/building-config-update";
import { mepItemCreate, mepItemCreateBatch } from "./procedures/mep-item-create";
import { quoteCreate, quoteGetById, quoteUpdate, quoteDelete, quoteList } from "./procedures/quote-create";
import { specTemplateList } from "./procedures/spec-template-list";
import { specTemplateCreate } from "./procedures/spec-template-create";
import { specTemplateUpdate } from "./procedures/spec-template-update";
import { specTemplateDelete } from "./procedures/spec-template-delete";
import { specTemplateSetDefault } from "./procedures/spec-template-set-default";
import { finishingItemBatchSpecUpdate } from "./procedures/finishing-item-batch-spec-update";

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
		update: finishingItemUpdate,
		delete: finishingItemDelete,
		reorder: finishingItemReorder,
		batchSpecUpdate: finishingItemBatchSpecUpdate,
	},
	buildingConfig: {
		update: buildingConfigUpdate,
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
	specTemplate: {
		list: specTemplateList,
		create: specTemplateCreate,
		update: specTemplateUpdate,
		delete: specTemplateDelete,
		setDefault: specTemplateSetDefault,
	},
};
