import {
	assistantModel,
	buildPublicAssistantPrompt,
	convertToModelMessages,
	streamText,
	type UIMessage,
} from "@repo/ai";
import { rateLimitChecker } from "@repo/api/lib/rate-limit";

/**
 * مساعد مسار العام — للزوار قبل التسجيل (الموقع التسويقي)
 *
 * endpoint عام بدون مصادقة — محمي بحدود معدل صارمة لكل IP،
 * بدون أي أدوات ولا وصول لقاعدة البيانات (قاعدة معرفة ثابتة فقط).
 */

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 1000;

function getClientIp(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0]?.trim() || "unknown";
	}
	return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
	try {
		const ip = getClientIp(request);

		// حدّان لكل IP: قصير للاندفاعات وطويل ضد الاستنزاف
		try {
			await rateLimitChecker(`ip:${ip}`, "ai.public-assistant", {
				windowMs: 60_000,
				maxRequests: 8,
			});
			await rateLimitChecker(`ip:${ip}`, "ai.public-assistant.hourly", {
				windowMs: 60 * 60_000,
				maxRequests: 40,
			});
		} catch {
			return Response.json(
				{ error: "تم تجاوز الحد المسموح. حاول بعد قليل." },
				{ status: 429 },
			);
		}

		const { messages, locale } = (await request.json()) as {
			messages: UIMessage[];
			locale?: string;
		};

		if (!Array.isArray(messages) || messages.length === 0) {
			return Response.json({ error: "الرسائل مطلوبة" }, { status: 400 });
		}
		if (messages.length > MAX_MESSAGES) {
			return Response.json(
				{ error: "تم تجاوز الحد الأقصى للرسائل. ابدأ محادثة جديدة" },
				{ status: 400 },
			);
		}

		// التحقق من أطوال الرسائل قبل أي معالجة
		for (const message of messages) {
			const textLength = (message.parts ?? [])
				.filter(
					(p): p is { type: "text"; text: string } =>
						p.type === "text",
				)
				.reduce((sum, p) => sum + p.text.length, 0);
			if (textLength > MAX_MESSAGE_CHARS) {
				return Response.json(
					{ error: "الرسالة طويلة جداً (الحد 1000 حرف)" },
					{ status: 400 },
				);
			}
		}

		const result = streamText({
			model: assistantModel,
			system: buildPublicAssistantPrompt(locale ?? "ar"),
			messages: convertToModelMessages(messages),
			maxOutputTokens: 800,
			onError: ({ error }) => {
				console.error("[Public Assistant Stream Error]", error);
			},
		});

		return result.toUIMessageStreamResponse();
	} catch (e) {
		console.error("[Public Assistant API Error]", e);
		return Response.json(
			{ error: "حدث خطأ في المساعد. حاول مرة أخرى" },
			{ status: 500 },
		);
	}
}
