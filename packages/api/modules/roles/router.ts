import { createRole } from "./procedures/create-role";
import { deleteRole } from "./procedures/delete-role";
import { listRoles } from "./procedures/list-roles";
import { updateRole } from "./procedures/update-role";

export const rolesRouter = {
	list: listRoles,
	create: createRole,
	update: updateRole,
	delete: deleteRole,
};
