import { list } from "./procedures/list";
import { getById } from "./procedures/get-by-id";
import { getStructuralItems } from "./procedures/get-structural-items";
import { getFinishingItems } from "./procedures/get-finishing-items";
import { getMEPItems } from "./procedures/get-mep-items";
import { getLaborItems } from "./procedures/get-labor-items";
import { getQuotes } from "./procedures/get-quotes";
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
import { mepItemUpdate } from "./procedures/mep-item-update";
import { mepItemDelete } from "./procedures/mep-item-delete";
import { mepItemToggle } from "./procedures/mep-item-toggle";
import { quoteCreate, quoteGetById, quoteUpdate, quoteDelete, quoteList } from "./procedures/quote-create";
import { specTemplateList } from "./procedures/spec-template-list";
import { specTemplateCreate } from "./procedures/spec-template-create";
import { specTemplateUpdate } from "./procedures/spec-template-update";
import { specTemplateDelete } from "./procedures/spec-template-delete";
import { specTemplateSetDefault } from "./procedures/spec-template-set-default";
import { finishingItemBatchSpecUpdate } from "./procedures/finishing-item-batch-spec-update";
import { getStages, approveStage, reopenStage, assignStage } from "./procedures/stages";
import { getStudyStages, approveStudyStage, reopenStudyStage, assignStudyStage, getActiveStudyStage } from "./procedures/study-stages";
import { manualItemsList, manualItemCreate, manualItemUpdate, manualItemDelete, manualItemReorder } from "./procedures/manual-items";
import { quantitiesSummary } from "./procedures/quantities-summary";
import { getStructuralSpecs, setStructuralSpecs } from "./procedures/structural-specs";
import { costingGenerateItems, costingGetItems, costingUpdateItem, costingBulkUpdate, costingSetSectionLabor, costingGetSummary } from "./procedures/costing";
import { markupGetSettings, markupSetUniform, markupSetSectionMarkups, markupGetProfitAnalysis } from "./procedures/markup";
import { getSpecifications, updateItemSpec, applyTemplateToAll, applySpecToAllFloors, generateBOM, getBOM } from "./procedures/specifications";
import { createStudyQuotation } from "./procedures/create-study-quotation";
import { updateConfig } from "./procedures/update-config";

export const quantitiesRouter = {
	list,
	getById,
	getStructuralItems,
	getFinishingItems,
	getMEPItems,
	getLaborItems,
	getQuotes,
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
		update: mepItemUpdate,
		delete: mepItemDelete,
		toggleEnabled: mepItemToggle,
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
	stages: {
		get: getStages,
		approve: approveStage,
		reopen: reopenStage,
		assign: assignStage,
	},
	studyStages: {
		get: getStudyStages,
		approve: approveStudyStage,
		reopen: reopenStudyStage,
		assign: assignStudyStage,
		getActive: getActiveStudyStage,
	},
	manualItem: {
		list: manualItemsList,
		create: manualItemCreate,
		update: manualItemUpdate,
		delete: manualItemDelete,
		reorder: manualItemReorder,
	},
	quantitiesSummary,
	structuralSpecs: {
		get: getStructuralSpecs,
		set: setStructuralSpecs,
	},
	costing: {
		generate: costingGenerateItems,
		getItems: costingGetItems,
		updateItem: costingUpdateItem,
		bulkUpdate: costingBulkUpdate,
		setSectionLabor: costingSetSectionLabor,
		getSummary: costingGetSummary,
	},
	markup: {
		getSettings: markupGetSettings,
		setUniform: markupSetUniform,
		setSectionMarkups: markupSetSectionMarkups,
		getProfitAnalysis: markupGetProfitAnalysis,
	},
	specifications: {
		get: getSpecifications,
		updateItem: updateItemSpec,
		applyTemplate: applyTemplateToAll,
		applyToFloors: applySpecToAllFloors,
		generateBOM,
		getBOM,
	},
	createStudyQuotation,
	updateConfig,
};
