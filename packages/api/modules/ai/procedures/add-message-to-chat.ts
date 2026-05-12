import { ORPCError, streamToEventIterator } from "@orpc/client";
import {
	assistantModel,
	buildAssistantPipeline,
	convertToModelMessages,
	stepCountIs,
	streamText,
	type PageContextPayload,
	type UIMessage,
} from "@repo/ai";
// تسجيل كل أدوات المساعد — يُنفَّذ مرة واحدة عند تحميل الـ module
import "@repo/ai/tools/modules";
import {
	db,
	getAiChatById,
	orgAuditLog,
	ROLE_NAMES_AR,
	updateAiChat,
} from "@repo/database";
import z from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import {
	getUserPermissions,
	getUserRoleType,
} from "../../../lib/permissions";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

// Schema للسياق الديناميكي للصفحة — اختياري لكنه يحوّل المساعد لمساعد ذكي حقيقي
const pageContextSchema = z
	.object({
		moduleId: z.string().max(50),
		pageName: z.string().max(200),
		currentRoute: z.string().max(500),
		pageDescription: z.string().max(500),
		visibleStats: z
			.record(z.string(), z.union([z.string(), z.number()]))
			.optional(),
		activeFilters: z.record(z.string(), z.any()).optional(),
		itemCount: z.number().optional(),
		tableColumns: z.array(z.string()).optional(),
		formState: z
			.object({
				isOpen: z.boolean(),
				formType: z.string().max(50),
				entityName: z.string().max(200),
			})
			.optional(),
		dataSummary: z.string().max(2000).optional(),
	})
	.nullable()
	.optional();

export const addMessageToChat = subscriptionProcedure
	.route({
		method: "POST",
		path: "/ai/chats/{chatId}/messages",
		tags: ["AI"],
		summary: "Add message to chat",
		description:
			"Send all messages of the chat to the AI model to get a response",
	})
	.input(
		z.object({
			chatId: z.string().trim().max(100),
			messages: z.array(z.any() as z.ZodType<UIMessage>).max(200),
			pageContext: pageContextSchema,
			locale: z.string().max(10).optional(),
			projectId: z.string().max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Rate limit: 10/min — يكفي للمحادثة النشطة بدون إفراط
		const { rateLimitChecker } = await import("../../../lib/rate-limit");
		await rateLimitChecker(context.user.id, "ai.chats.messages.add", {
			windowMs: 60_000,
			maxRequests: 10,
		});

		const { chatId, messages, pageContext, locale, projectId } = input;
		const user = context.user;

		const chat = await getAiChatById(chatId);
		if (!chat) {
			throw new ORPCError("NOT_FOUND");
		}

		// التحقق من العضوية وجمع البيانات بالتوازي
		let organizationId: string | null = null;
		let organizationName = "";
		let organizationSlug = "";

		if (chat.organizationId) {
			const membership = await verifyOrganizationMembership(
				chat.organizationId,
				user.id,
			);
			if (!membership) {
				throw new ORPCError("FORBIDDEN");
			}

			const org = await db.organization.findUnique({
				where: { id: chat.organizationId },
				select: { id: true, name: true, slug: true },
			});
			if (!org) {
				throw new ORPCError("NOT_FOUND", {
					message: "المنظمة غير موجودة",
				});
			}
			organizationId = org.id;
			organizationName = org.name;
			organizationSlug = org.slug ?? "";
		} else if (chat.userId !== context.user.id) {
			throw new ORPCError("FORBIDDEN");
		}

		// محادثة بدون منظمة (account-level) — نرسلها بدون pipeline (legacy fallback)
		if (!organizationId) {
			const { textModel } = await import("@repo/ai");
			const response = streamText({
				model: textModel,
				messages: convertToModelMessages(
					messages as unknown as UIMessage[],
				),
				async onFinish({ text }) {
					await updateAiChat({
						id: chatId,
						messages: [
							...messages,
							{
								role: "assistant",
								parts: [{ type: "text", text }],
							},
						],
					});
				},
			});
			return streamToEventIterator(response.toUIMessageStream());
		}

		// pipeline كامل لمحادثة منظمة
		const [permissions, roleType, projectFromDb] = await Promise.all([
			getUserPermissions(user.id, organizationId),
			getUserRoleType(user.id, organizationId),
			projectId
				? db.project.findFirst({
						where: { id: projectId, organizationId },
						select: { name: true },
					})
				: null,
		]);

		const roleLabel = roleType
			? (ROLE_NAMES_AR[roleType] ?? roleType)
			: "عضو";

		const pipeline = buildAssistantPipeline({
			userId: user.id,
			userName: user.name || "المستخدم",
			organizationId,
			organizationSlug,
			organizationName,
			roleLabel,
			locale: locale || "ar",
			currentPage: pageContext?.currentRoute,
			currentSection: pageContext?.moduleId,
			projectId,
			projectName: projectFromDb?.name,
			pageContext: pageContext as PageContextPayload | null | undefined,
			permissions,
			roleType: roleType ?? undefined,
		});

		// audit log — fire-and-forget
		orgAuditLog({
			organizationId,
			actorId: user.id,
			action: "AI_MESSAGE_SENT",
			entityType: "ai_assistant",
			entityId: chatId,
			metadata: {
				messageCount: messages.length,
				activeModule: pipeline.activeModuleId,
				toolCount: pipeline.toolCount,
				pageRoute: pageContext?.currentRoute ?? null,
				projectId: projectId ?? null,
			},
		});

		const response = streamText({
			model: assistantModel,
			system: pipeline.systemPrompt,
			messages: convertToModelMessages(
				messages as unknown as UIMessage[],
			),
			tools: pipeline.tools,
			stopWhen: stepCountIs(8),
			maxOutputTokens: 4000,
			async onFinish({ text }) {
				await updateAiChat({
					id: chatId,
					messages: [
						...messages,
						{
							role: "assistant",
							parts: [{ type: "text", text }],
						},
					],
				});
			},
			onError: ({ error }) => {
				console.error("[Assistant Stream Error]", error);
			},
		});

		return streamToEventIterator(response.toUIMessageStream());
	});
