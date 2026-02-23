import type { RouterClient } from "@orpc/server";
import { adminRouter } from "../modules/admin/router";
import { aiRouter } from "../modules/ai/router";
import { attachmentsRouter } from "../modules/attachments/router";
import { contactRouter } from "../modules/contact/router";
import { digestsRouter } from "../modules/digests/router";
import { exportsRouter } from "../modules/exports/router";
import { integrationsRouter } from "../modules/integrations/router";
import { sharesRouter } from "../modules/shares/router";
import { newsletterRouter } from "../modules/newsletter/router";
import { notificationsRouter } from "../modules/notifications/router";
import { orgUsersRouter } from "../modules/org-users/router";
import { organizationsRouter } from "../modules/organizations/router";
import { paymentsRouter } from "../modules/payments/router";
import { projectChatRouter } from "../modules/project-chat/router";
import { projectDocumentsRouter } from "../modules/project-documents/router";
import { projectFieldRouter } from "../modules/project-field/router";
import { projectFinanceRouter } from "../modules/project-finance/router";
import { projectInsightsRouter } from "../modules/project-insights/router";
import { projectOwnerRouter } from "../modules/project-owner/router";
import { projectTemplatesRouter } from "../modules/project-templates/router";
import { projectUpdatesRouter } from "../modules/project-updates/router";
import { projectsRouter } from "../modules/projects/router";
import { projectTimelineRouter } from "../modules/project-timeline/router";
import { projectChangeOrdersRouter } from "../modules/project-change-orders/router";
import { projectContractRouter } from "../modules/project-contract/router";
import { projectTeamRouter } from "../modules/project-team/router";
import { dashboardRouter } from "../modules/dashboard/router";
import { financeRouter } from "../modules/finance/router";
import { quantitiesRouter } from "../modules/quantities/router";
import { rolesRouter } from "../modules/roles/router";
import { usersRouter } from "../modules/users/router";
import { publicProcedure } from "./procedures";

export const router = publicProcedure.router({
	admin: adminRouter,
	newsletter: newsletterRouter,
	contact: contactRouter,
	organizations: organizationsRouter,
	users: usersRouter,
	payments: paymentsRouter,
	ai: aiRouter,
	roles: rolesRouter,
	orgUsers: orgUsersRouter,
	quantities: quantitiesRouter,
	projects: projectsRouter,
	projectField: projectFieldRouter,
	projectFinance: projectFinanceRouter,
	projectDocuments: projectDocumentsRouter,
	projectChat: projectChatRouter,
	notifications: notificationsRouter,
	projectOwner: projectOwnerRouter,
	attachments: attachmentsRouter,
	// Phase 7 - Differentiation
	projectTemplates: projectTemplatesRouter,
	projectInsights: projectInsightsRouter,
	projectUpdates: projectUpdatesRouter,
	digests: digestsRouter,
	// Phase 8 - Integrations
	integrations: integrationsRouter,
	exports: exportsRouter,
	shares: sharesRouter,
	// Phase 10 - Timeline
	projectTimeline: projectTimelineRouter,
	// Phase 11 - Change Orders
	projectChangeOrders: projectChangeOrdersRouter,
	// Project Contract
	projectContract: projectContractRouter,
	// Phase 12 - Dashboard
	dashboard: dashboardRouter,
	// Project Team Management
	projectTeam: projectTeamRouter,
	// Finance Module - المالية
	finance: financeRouter,
});

export type ApiRouterClient = RouterClient<typeof router>;
