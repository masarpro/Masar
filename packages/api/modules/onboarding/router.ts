import { getProgress } from "./procedures/get-progress";
import { setupCompanyInfo } from "./procedures/setup-company-info";
import { setDefaultTemplate } from "./procedures/set-default-template";
import { setupFirstProject } from "./procedures/setup-first-project";
import { inviteTeamMembers } from "./procedures/invite-team-members";
import { completeWizard } from "./procedures/complete-wizard";
import { dismissChecklist } from "./procedures/dismiss-checklist";

export const onboardingRouter = {
	getProgress,
	setupCompanyInfo,
	setDefaultTemplate,
	setupFirstProject,
	inviteTeamMembers,
	completeWizard,
	dismissChecklist,
};
