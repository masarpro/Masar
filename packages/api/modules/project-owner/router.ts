import { publicProcedure } from "../../orpc/procedures";

// Internal procedures (authenticated)
import { createOwnerAccessProcedure } from "./procedures/create-owner-access";
import { listOwnerAccessProcedure } from "./procedures/list-owner-access";
import { revokeOwnerAccessProcedure } from "./procedures/revoke-owner-access";
import { sendOfficialUpdateProcedure } from "./procedures/send-official-update";

// Portal procedures (token-based, public)
import { getOwnerSummaryProcedure } from "./procedures/get-owner-summary";
import { getOwnerScheduleProcedure } from "./procedures/get-owner-schedule";
import { getOwnerPaymentsProcedure } from "./procedures/get-owner-payments";
import { listOwnerMessagesProcedure } from "./procedures/list-owner-messages";
import { sendOwnerMessageProcedure } from "./procedures/send-owner-message";
import { listOfficialUpdatesProcedure } from "./procedures/list-official-updates";

export const projectOwnerRouter = publicProcedure.router({
	// Internal (authenticated) endpoints
	createAccess: createOwnerAccessProcedure,
	listAccess: listOwnerAccessProcedure,
	revokeAccess: revokeOwnerAccessProcedure,
	sendOfficialUpdate: sendOfficialUpdateProcedure,

	// Portal (token-based) endpoints
	portal: publicProcedure.router({
		getSummary: getOwnerSummaryProcedure,
		getSchedule: getOwnerScheduleProcedure,
		getPayments: getOwnerPaymentsProcedure,
		listMessages: listOwnerMessagesProcedure,
		sendMessage: sendOwnerMessageProcedure,
		listUpdates: listOfficialUpdatesProcedure,
	}),
});
