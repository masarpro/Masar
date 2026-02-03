import { publicProcedure } from "../../orpc/procedures";
import { listMessagesProcedure } from "./procedures/list-messages";
import { sendMessageProcedure } from "./procedures/send-message";

export const projectChatRouter = publicProcedure.router({
	listMessages: listMessagesProcedure,
	sendMessage: sendMessageProcedure,
});
