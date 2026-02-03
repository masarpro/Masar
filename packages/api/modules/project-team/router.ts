import { addMember } from "./procedures/add-member";
import { listMembers } from "./procedures/list-members";
import { removeMember } from "./procedures/remove-member";
import { updateMemberRole } from "./procedures/update-member-role";

export const projectTeamRouter = {
	list: listMembers,
	add: addMember,
	updateRole: updateMemberRole,
	remove: removeMember,
};
