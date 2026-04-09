// ══════════════════════════════════════════════════════════════════════════
// Categories Router — Masar Category Management
// ══════════════════════════════════════════════════════════════════════════
//
// Extensible multi-group category system. Currently the only active group is
// EXPENSE. Future groups (LEAD_SOURCE, PROJECT_TYPE, ASSET_CATEGORY, etc.)
// will reuse the same procedures via the `group` input parameter.
//
// Read procedures (list, get) require organization membership only — they
// power both the admin settings page and the read-only category combobox in
// expense forms. Write procedures require `settings.organization` permission
// (OWNER/MANAGER), enforced by `verifyOrganizationAccess`.
// ══════════════════════════════════════════════════════════════════════════

import { listCategories } from "./procedures/list-categories";
import { getCategory } from "./procedures/get-category";
import { createCategory } from "./procedures/create-category";
import { updateCategory } from "./procedures/update-category";
import { deleteCategory } from "./procedures/delete-category";
import { resetCategory } from "./procedures/reset-category";
import { createSubcategory } from "./procedures/create-subcategory";
import { updateSubcategory } from "./procedures/update-subcategory";
import { deleteSubcategory } from "./procedures/delete-subcategory";
import { reorderCategories } from "./procedures/reorder-categories";

export const categoriesRouter = {
	list: listCategories,
	get: getCategory,
	create: createCategory,
	update: updateCategory,
	delete: deleteCategory,
	reset: resetCategory,
	createSubcategory: createSubcategory,
	updateSubcategory: updateSubcategory,
	deleteSubcategory: deleteSubcategory,
	reorder: reorderCategories,
};
