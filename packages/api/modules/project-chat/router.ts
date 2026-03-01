import { protectedProcedure } from "../../orpc/procedures";
import { listMessagesProcedure } from "./procedures/list-messages";
import { sendMessageProcedure } from "./procedures/send-message";
import { getUnreadCountProcedure } from "./procedures/get-unread-count";
import { markAsReadProcedure } from "./procedures/mark-as-read";

export const projectChatRouter = protectedProcedure.router({
	listMessages: listMessagesProcedure,
	sendMessage: sendMessageProcedure,
	getUnreadCount: getUnreadCountProcedure,
	markAsRead: markAsReadProcedure,
});
