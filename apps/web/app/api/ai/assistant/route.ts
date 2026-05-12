import { auth } from "@repo/auth";
import {
	assistantModel,
	buildAssistantPipeline,
	convertToModelMessages,
	type PageContextPayload,
	stepCountIs,
	streamText,
	type UIMessage,
} from "@repo/ai";
// تسجيل كل أدوات المساعد
import "@repo/ai/tools/modules";
import { db, orgAuditLog, ROLE_NAMES_AR } from "@repo/database";
import {
	getUserPermissions,
	getUserRoleType,
} from "@repo/api/lib/permissions";
import { rateLimitChecker } from "@repo/api/lib/rate-limit";

interface ContextPayload {
	organizationSlug: string;
	organizationName: string;
	currentPage: string;
	currentSection: string;
	projectId?: string;
	projectName?: string;
	locale?: string;
}

export async function POST(request: Request) {
	const startedAt = Date.now();
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}

		// rate limit: 15/min — أعلى قليلاً من oRPC لأن الزر العائم أكثر استخداماً
		try {
			await rateLimitChecker(session.user.id, "ai.assistant.panel", {
				windowMs: 60_000,
				maxRequests: 15,
			});
		} catch (rateErr: any) {
			return Response.json(
				{
					error:
						rateErr?.message ??
						"تم تجاوز الحد المسموح من الطلبات. حاول بعد دقيقة.",
				},
				{ status: 429 },
			);
		}

		const { messages, context, pageContext } = (await request.json()) as {
			messages: UIMessage[];
			context: ContextPayload;
			pageContext?: PageContextPayload | null;
		};

		// Validation
		if (!Array.isArray(messages) || messages.length === 0) {
			return Response.json({ error: "الرسائل مطلوبة" }, { status: 400 });
		}
		if (messages.length > 50) {
			return Response.json(
				{
					error:
						"تم تجاوز الحد الأقصى للرسائل (50 رسالة). ابدأ محادثة جديدة",
				},
				{ status: 400 },
			);
		}

		// resolve organization from slug (لا نثق بـ id من الـ frontend)
		const organization = await db.organization.findUnique({
			where: { slug: context.organizationSlug },
			select: { id: true, name: true },
		});

		if (!organization) {
			return Response.json({ error: "المنظمة غير موجودة" }, { status: 404 });
		}

		// verify membership
		const membership = await db.member.findUnique({
			where: {
				organizationId_userId: {
					organizationId: organization.id,
					userId: session.user.id,
				},
			},
			select: { role: true },
		});

		if (!membership) {
			return Response.json(
				{ error: "ليس لديك صلاحية الوصول لهذه المنظمة" },
				{ status: 403 },
			);
		}

		// جلب الصلاحيات والمشروع بالتوازي
		const [permissions, roleType, projectFromDb] = await Promise.all([
			getUserPermissions(session.user.id, organization.id),
			getUserRoleType(session.user.id, organization.id),
			context.projectId
				? db.project.findFirst({
						where: { id: context.projectId, organizationId: organization.id },
						select: { name: true },
					})
				: null,
		]);

		const projectName = projectFromDb?.name ?? context.projectName;
		const roleLabel = roleType
			? (ROLE_NAMES_AR[roleType] ?? roleType)
			: "عضو";

		// pipeline موحّد
		const pipeline = buildAssistantPipeline({
			userId: session.user.id,
			userName: session.user.name || "المستخدم",
			organizationId: organization.id,
			organizationSlug: context.organizationSlug,
			organizationName: organization.name,
			roleLabel,
			locale: context.locale || "ar",
			currentPage: context.currentPage,
			currentSection: context.currentSection,
			projectId: context.projectId,
			projectName,
			pageContext: pageContext ?? null,
			permissions,
			roleType: roleType ?? undefined,
		});

		const modelMessages = convertToModelMessages(messages);

		// audit log — fire-and-forget مع latency
		orgAuditLog({
			organizationId: organization.id,
			actorId: session.user.id,
			action: "AI_MESSAGE_SENT",
			entityType: "ai_assistant",
			entityId: context.organizationSlug,
			metadata: {
				messageCount: messages.length,
				activeModule: pipeline.activeModuleId,
				toolCount: pipeline.toolCount,
				pageRoute: pageContext?.currentRoute ?? null,
				projectId: context.projectId ?? null,
				setupLatencyMs: Date.now() - startedAt,
			},
		});

		const result = streamText({
			model: assistantModel,
			system: pipeline.systemPrompt,
			messages: modelMessages,
			tools: pipeline.tools,
			stopWhen: stepCountIs(8),
			maxOutputTokens: 4000,
			onError: ({ error }) => {
				console.error("[Assistant Stream Error]", error);
			},
		});

		return result.toUIMessageStreamResponse();
	} catch (e) {
		console.error("[Assistant API Error]", e);
		return Response.json(
			{ error: "حدث خطأ في المساعد الذكي" },
			{ status: 500 },
		);
	}
}
