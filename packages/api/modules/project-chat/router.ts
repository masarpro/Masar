import { publicProcedure } from "../../orpc/procedures";
import { listMessagesProcedure } from "./procedures/list-messages";
import { sendMessageProcedure } from "./procedures/send-message";
import { getUnreadCountProcedure } from "./procedures/get-unread-count";
import { markAsReadProcedure } from "./procedures/mark-as-read";

export const projectChatRouter = publicProcedure.router({
	listMessages: listMessagesProcedure,
	sendMessage: sendMessageProcedure,
	getUnreadCount: getUnreadCountProcedure,
	markAsRead: markAsReadProcedure,
});
