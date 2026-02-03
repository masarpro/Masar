import { getSettings, getDeliveryLogs } from "./procedures/get-settings";
import { updateSettings } from "./procedures/update-settings";
import {
	sendMessageProcedure,
	sendBulkMessages,
} from "./procedures/send-message";

export const integrationsRouter = {
	getSettings,
	updateSettings,
	getDeliveryLogs,
	sendMessage: sendMessageProcedure,
	sendBulkMessages,
};
