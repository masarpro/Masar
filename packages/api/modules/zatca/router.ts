// ZATCA Module Router — الفوترة الإلكترونية (E-Invoicing Phase 2)

import { getZatcaStatus } from "./procedures/get-status";
import { startOnboarding } from "./procedures/start-onboarding";
import { completeOnboarding } from "./procedures/complete-onboarding";
import { submitInvoice } from "./procedures/submit-invoice";
import { retrySubmission } from "./procedures/retry-submission";
import { getSubmissions, getSubmissionById } from "./procedures/get-submissions";
import { revokeDevice } from "./procedures/revoke-device";
import { renewCsid } from "./procedures/renew-csid";

export const zatcaRouter = {
	// Status
	getStatus: getZatcaStatus,

	// Onboarding
	startOnboarding: startOnboarding,
	completeOnboarding: completeOnboarding,

	// Certificate Renewal
	renewCsid: renewCsid,

	// Invoice Submission
	submitInvoice: submitInvoice,
	retrySubmission: retrySubmission,

	// Submissions List
	submissions: {
		list: getSubmissions,
		getById: getSubmissionById,
	},

	// Device Management
	revokeDevice: revokeDevice,
};
