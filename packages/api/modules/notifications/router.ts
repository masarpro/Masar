import { listNotificationsProcedure } from "./procedures/list-notifications";
import { markReadProcedure } from "./procedures/mark-read";
import { getUnreadCountProcedure } from "./procedures/get-unread-count";

export const notificationsRouter = {
	list: listNotificationsProcedure,
	markRead: markReadProcedure,
	unreadCount: getUnreadCountProcedure,
};
