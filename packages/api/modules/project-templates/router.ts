import { addTemplateItemProcedure } from "./procedures/add-template-item";
import { applyTemplateProcedure } from "./procedures/apply-template";
import { createTemplateProcedure } from "./procedures/create-template";
import { deleteTemplateProcedure } from "./procedures/delete-template";
import { getTemplateProcedure } from "./procedures/get-template";
import { listTemplates } from "./procedures/list-templates";
import { removeTemplateItemProcedure } from "./procedures/remove-template-item";
import { updateTemplateProcedure } from "./procedures/update-template";

export const projectTemplatesRouter = {
	list: listTemplates,
	getById: getTemplateProcedure,
	create: createTemplateProcedure,
	update: updateTemplateProcedure,
	delete: deleteTemplateProcedure,
	apply: applyTemplateProcedure,
	addItem: addTemplateItemProcedure,
	removeItem: removeTemplateItemProcedure,
};
