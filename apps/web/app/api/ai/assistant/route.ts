import { auth } from "@repo/auth";
import {
  assistantModel,
  buildSystemPrompt,
  convertToModelMessages,
  getAssistantTools,
  stepCountIs,
  streamText,
  type AssistantContext,
  type UIMessage,
} from "@repo/ai";
import { db } from "@repo/database";

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
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, context } = (await request.json()) as {
      messages: UIMessage[];
      context: ContextPayload;
    };

    // Validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "الرسائل مطلوبة" },
        { status: 400 },
      );
    }
    if (messages.length > 50) {
      return Response.json(
        { error: "تم تجاوز الحد الأقصى للرسائل (50 رسالة). ابدأ محادثة جديدة" },
        { status: 400 },
      );
    }

    // Secure: get organizationId from DB, not from frontend
    const organization = await db.organization.findUnique({
      where: { slug: context.organizationSlug },
      select: { id: true, name: true },
    });

    if (!organization) {
      return Response.json(
        { error: "المنظمة غير موجودة" },
        { status: 404 },
      );
    }

    // Verify user is a member of this organization
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

    // If projectId provided, fetch project details from DB
    let projectName = context.projectName;
    if (context.projectId) {
      const project = await db.project.findFirst({
        where: { id: context.projectId, organizationId: organization.id },
        select: { name: true },
      });
      if (project) {
        projectName = project.name;
      }
    }

    const assistantContext: AssistantContext = {
      userName: session.user.name || "المستخدم",
      userRole: membership.role || "MANAGER",
      locale: context.locale || "ar",
      organizationName: organization.name,
      organizationSlug: context.organizationSlug,
      organizationId: organization.id,
      currentPage: context.currentPage,
      currentSection: context.currentSection,
      projectId: context.projectId,
      projectName,
    };

    const systemPrompt = buildSystemPrompt(assistantContext);

    const tools = getAssistantTools({
      organizationId: organization.id,
      userId: session.user.id,
      organizationSlug: context.organizationSlug,
      locale: context.locale || "ar",
    });

    // Convert UIMessages from useChat to ModelMessages for streamText
    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
      model: assistantModel,
      system: systemPrompt,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(5),
      maxOutputTokens: 2000,
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
