import { deleteUser } from "./procedures/delete-user";
import { findOrganization } from "./procedures/find-organization";
import { listOrganizations } from "./procedures/list-organizations";
import { listUsers } from "./procedures/list-users";

export const adminRouter = {
	users: {
		list: listUsers,
		delete: deleteUser,
	},
	organizations: {
		list: listOrganizations,
		find: findOrganization,
	},
};
