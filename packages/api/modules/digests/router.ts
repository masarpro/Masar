import { getWeeklyDigest } from "./procedures/get-weekly-digest";
import {
	subscribeDigest,
	listSubscriptions,
} from "./procedures/subscribe-digest";
import { unsubscribeDigest } from "./procedures/unsubscribe-digest";

export const digestsRouter = {
	getWeekly: getWeeklyDigest,
	subscribe: subscribeDigest,
	unsubscribe: unsubscribeDigest,
	listSubscriptions,
};
