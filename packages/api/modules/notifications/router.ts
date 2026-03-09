import { listNotificationsProcedure } from "./procedures/list-notifications";
import { markReadProcedure } from "./procedures/mark-read";
import { getUnreadCountProcedure } from "./procedures/get-unread-count";
import { getNotificationPreferencesProcedure } from "./procedures/get-preferences";
import { updateNotificationPreferencesProcedure } from "./procedures/update-preferences";

export const notificationsRouter = {
	list: listNotificationsProcedure,
	markRead: markReadProcedure,
	unreadCount: getUnreadCountProcedure,
	preferences: {
		get: getNotificationPreferencesProcedure,
		update: updateNotificationPreferencesProcedure,
	},
};
