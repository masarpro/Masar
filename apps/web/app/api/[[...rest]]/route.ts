import { app } from "@repo/api";
import { handle } from "hono/vercel";

const handler = handle(app);

/**
 * Next.js 16 على Node 24 يسلّم الـ route طلباً ملفوفاً (Proxy/نسخة كلاس
 * مكررة عبر chunks) بينما undici الحديث يخزّن حالة Request في حقول خاصة
 * (#state). الوصول للحقول الخاصة لا يعبر الغلاف، فأي قراءة للـ body داخل
 * Hono/oRPC ترمي:
 * "TypeError: Cannot read private member #state from an object whose class
 * did not declare it" — كل POST /api/rpc تفشل بـ 500 خلال ~1-2ms.
 * (nodejs/undici#4290 و better-auth/better-auth#8194)
 *
 * الحل: إعادة بناء Request نقي من الحقول العامة فقط قبل تسليمه للمعالج،
 * فلا يصل الغلاف إلى undici إطلاقاً. يغطي هذا أيضاً مسار المصادقة لأن
 * better-auth مركّب داخل تطبيق Hono نفسه (auth.handler(c.req.raw)).
 */
function toPlainRequest(request: Request): Request {
	const init: RequestInit & { duplex?: "half" } = {
		method: request.method,
		headers: request.headers,
		signal: request.signal,
	};
	// body فقط عند وجوده (GET/HEAD بدونه) — وتمرير stream يتطلب duplex.
	if (request.body) {
		init.body = request.body;
		init.duplex = "half";
	}
	return new Request(request.url, init);
}

const wrappedHandler = (request: Request) => handler(toPlainRequest(request));

export const GET = wrappedHandler;
export const POST = wrappedHandler;
export const PUT = wrappedHandler;
export const PATCH = wrappedHandler;
export const DELETE = wrappedHandler;
export const OPTIONS = wrappedHandler;
