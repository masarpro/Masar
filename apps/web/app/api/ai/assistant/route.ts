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
  // Module & Tool Registry
  getAllModules,
  getModuleById,
  getAISDKTools,
  type AIModuleDefinition,
} from "@repo/ai";
import { db } from "@repo/database";

// تسجيل كل الأدوات الجديدة
import "@repo/ai/tools/modules";

interface PageContextPayload {
  moduleId: string;
  pageName: string;
  currentRoute: string;
  pageDescription: string;
  visibleStats?: Record<string, string | number>;
  activeFilters?: Record<string, any>;
  itemCount?: number;
  tableColumns?: string[];
  formState?: {
    isOpen: boolean;
    formType: string;
    entityName: string;
  };
  dataSummary?: string;
}

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

    const { messages, context, pageContext } = (await request.json()) as {
      messages: UIMessage[];
      context: ContextPayload;
      pageContext?: PageContextPayload;
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

    // Secure: get organizationId from DB, not from frontend
    const organization = await db.organization.findUnique({
      where: { slug: context.organizationSlug },
      select: { id: true, name: true },
    });

    if (!organization) {
      return Response.json({ error: "المنظمة غير موجودة" }, { status: 404 });
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

    // 1. تحديد الوحدة المعرفية من page context
    const activeModule = pageContext?.moduleId
      ? getModuleById(pageContext.moduleId)
      : null;

    // 2. بناء system prompt — يدمج النظام القديم مع الجديد
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

    // بناء system prompt محسّن مع module registry + page context
    const systemPrompt = buildEnhancedSystemPrompt(
      assistantContext,
      activeModule,
      pageContext,
    );

    // 3. جمع الأدوات — القديمة + الجديدة
    const toolContext = {
      organizationId: organization.id,
      userId: session.user.id,
      organizationSlug: context.organizationSlug,
      locale: context.locale || "ar",
      projectId: context.projectId,
    };

    // الأدوات القديمة (6 أدوات أساسية)
    const legacyTools = getAssistantTools(toolContext);

    // الأدوات الجديدة من Registry
    const newTools = {
      // أدوات القسم الحالي (لو موجود)
      ...(activeModule ? getAISDKTools(toolContext, activeModule.id) : {}),
      // أدوات أساسية دائماً متاحة
      ...getAISDKTools(toolContext, "projects"),
      ...getAISDKTools(toolContext, "execution"),
      ...getAISDKTools(toolContext, "quantities"),
      ...getAISDKTools(toolContext, "finance"),
      ...getAISDKTools(toolContext, "leads"),
      ...getAISDKTools(toolContext, "accounting"),
      ...getAISDKTools(toolContext, "subcontracts"),
      ...getAISDKTools(toolContext, "dashboard"),
    };

    // دمج الأدوات — القديمة لها الأولوية (لتجنب تكرار الأسماء)
    const tools = { ...newTools, ...legacyTools };

    // Convert UIMessages from useChat to ModelMessages for streamText
    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
      model: assistantModel,
      system: systemPrompt,
      messages: modelMessages,
      tools,
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

/**
 * بناء system prompt محسّن يدمج Module Registry + Page Context
 */
function buildEnhancedSystemPrompt(
  assistantContext: AssistantContext,
  activeModule: AIModuleDefinition | null | undefined,
  pageContext?: PageContextPayload,
): string {
  // نبدأ من system prompt القديم كأساس
  const basePrompt = buildSystemPrompt(assistantContext);

  const parts: string[] = [basePrompt];

  // إضافة قائمة كل أقسام المنصة من Module Registry
  const allModules = getAllModules();
  parts.push(`
## كل أقسام المنصة المتاحة:
${allModules.map((m) => `- **${m.nameAr}** (${m.nameEn}): ${m.description}`).join("\n")}`);

  // إضافة سياق الوحدة الحالية (لو موجودة ولم يكن القسم القديم يغطيها)
  if (activeModule) {
    parts.push(`
## القسم الحالي: ${activeModule.nameAr}
${activeModule.systemPrompt}

### أمثلة أسئلة يمكنك مساعدة المستخدم فيها:
${activeModule.exampleQuestions.map((q) => `- ${q}`).join("\n")}`);
  }

  // إضافة سياق الصفحة
  if (pageContext) {
    let contextSection = `
## ما يراه المستخدم حالياً:
- **الصفحة:** ${pageContext.pageName}
- **الوصف:** ${pageContext.pageDescription}
- **المسار:** ${pageContext.currentRoute}`;

    if (
      pageContext.visibleStats &&
      Object.keys(pageContext.visibleStats).length > 0
    ) {
      contextSection += `\n- **إحصائيات معروضة:** ${JSON.stringify(pageContext.visibleStats)}`;
    }

    if (
      pageContext.activeFilters &&
      Object.keys(pageContext.activeFilters).length > 0
    ) {
      contextSection += `\n- **فلاتر مطبقة:** ${JSON.stringify(pageContext.activeFilters)}`;
    }

    if (pageContext.itemCount !== undefined) {
      contextSection += `\n- **عدد العناصر المعروضة:** ${pageContext.itemCount}`;
    }

    if (pageContext.dataSummary) {
      contextSection += `\n- **ملخص البيانات:** ${pageContext.dataSummary}`;
    }

    if (pageContext.formState?.isOpen) {
      contextSection += `\n- **نموذج مفتوح:** ${pageContext.formState.entityName} (${pageContext.formState.formType})`;
    }

    contextSection += `\nاستخدم هذا السياق لتقديم إجابات دقيقة ومرتبطة بما يراه المستخدم. إذا سأل "كم عندي" أو "وش هالأرقام" — ارجع للإحصائيات المعروضة.`;

    parts.push(contextSection);
  }

  return parts.join("\n\n");
}
