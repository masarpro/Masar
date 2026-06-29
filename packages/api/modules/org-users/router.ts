import { acceptInvitation } from "./procedures/accept-invitation";
import { createOrgUser } from "./procedures/create-org-user";
import { deleteOrgUser } from "./procedures/delete-org-user";
import { listOrgUsers } from "./procedures/list-org-users";
import { resendInvitation } from "./procedures/resend-invitation";
import { toggleUserActive } from "./procedures/toggle-user-active";
import { updateOrgUser } from "./procedures/update-org-user";

export const orgUsersRouter = {
	list: listOrgUsers,
	create: createOrgUser,
	update: updateOrgUser,
	toggleActive: toggleUserActive,
	delete: deleteOrgUser,
	acceptInvitation: acceptInvitation,
	resendInvitation: resendInvitation,
};
