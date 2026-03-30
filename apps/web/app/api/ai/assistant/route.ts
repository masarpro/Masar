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
  // Permission filtering
  filterToolsByPermission,
  getPermissionSummaryForPrompt,
  // Sanitization
  sanitizeUserContext,
} from "@repo/ai";
import { db, ROLE_NAMES_AR, orgAuditLog } from "@repo/database";
import {
  getUserPermissions,
  getUserRoleType,
} from "@repo/api/lib/permissions";

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

    // جلب صلاحيات المستخدم ونوع الدور + بيانات المشروع بالتوازي
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

    // 1. تحديد الوحدة المعرفية من page context
    const activeModule = pageContext?.moduleId
      ? getModuleById(pageContext.moduleId)
      : null;

    // 2. بناء system prompt — يدمج النظام القديم مع الجديد
    const roleLabel = roleType
      ? (ROLE_NAMES_AR[roleType] ?? roleType)
      : "عضو";
    const assistantContext: AssistantContext = {
      userName: session.user.name || "المستخدم",
      userRole: roleLabel,
      locale: context.locale || "ar",
      organizationName: organization.name,
      organizationSlug: context.organizationSlug,
      organizationId: organization.id,
      currentPage: context.currentPage,
      currentSection: context.currentSection,
      projectId: context.projectId,
      projectName,
    };

    // بناء system prompt محسّن مع module registry + page context + permissions
    const systemPrompt = buildEnhancedSystemPrompt(
      assistantContext,
      activeModule,
      pageContext,
      permissions,
    );

    // 3. جمع الأدوات — القديمة + الجديدة (مع صلاحيات)
    const toolContext = {
      organizationId: organization.id,
      userId: session.user.id,
      organizationSlug: context.organizationSlug,
      locale: context.locale || "ar",
      projectId: context.projectId,
      permissions,
      roleType: roleType ?? undefined,
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
      // أداة صلاحياتي — متاحة دائماً
      ...getAISDKTools(toolContext, "system"),
    };

    // دمج الأدوات — القديمة لها الأولوية (لتجنب تكرار الأسماء)
    const allTools = { ...newTools, ...legacyTools };

    // فلترة الأدوات حسب صلاحيات المستخدم
    const tools = filterToolsByPermission(allTools, permissions);

    // Convert UIMessages from useChat to ModelMessages for streamText
    const modelMessages = convertToModelMessages(messages);

    // Audit log — fire-and-forget
    orgAuditLog({
      organizationId: organization.id,
      actorId: session.user.id,
      action: "AI_MESSAGE_SENT",
      entityType: "ai_assistant",
      entityId: context.organizationSlug,
      metadata: {
        messageCount: messages.length,
        activeModule: activeModule?.id ?? null,
        toolCount: Object.keys(tools).length,
      },
    });

    // TODO: Add dedicated AI analytics dashboard

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
 * بناء system prompt محسّن يدمج Module Registry + Page Context + Permissions
 */
function buildEnhancedSystemPrompt(
  assistantContext: AssistantContext,
  activeModule: AIModuleDefinition | null | undefined,
  pageContext?: PageContextPayload,
  permissions?: import("@repo/database").Permissions,
): string {
  // نبدأ من system prompt القديم كأساس
  const basePrompt = buildSystemPrompt(assistantContext);

  const parts: string[] = [basePrompt];

  // إضافة سياق صلاحيات المستخدم
  if (permissions) {
    const permSummary = getPermissionSummaryForPrompt(permissions);
    parts.push(`## صلاحيات المستخدم
- **الدور:** ${assistantContext.userRole}
- ${permSummary}
- إذا طلب المستخدم بيانات ليس لديه صلاحية الوصول لها، أخبره بلطف: "ليس لديك صلاحية الوصول لهذه البيانات. يمكنك طلب الصلاحية من مالك المنظمة."
- لا تذكر أسماء الصلاحيات التقنية — استخدم وصفاً بالعربي.
- إذا سأل "وش صلاحياتي" أو "ما هي صلاحياتي" — استخدم أداة getMyPermissions.`);
  }

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
      contextSection += `\n- **إحصائيات معروضة:** ${sanitizeUserContext(JSON.stringify(pageContext.visibleStats))}`;
    }

    if (
      pageContext.activeFilters &&
      Object.keys(pageContext.activeFilters).length > 0
    ) {
      contextSection += `\n- **فلاتر مطبقة:** ${sanitizeUserContext(JSON.stringify(pageContext.activeFilters))}`;
    }

    if (pageContext.itemCount !== undefined) {
      contextSection += `\n- **عدد العناصر المعروضة:** ${pageContext.itemCount}`;
    }

    if (pageContext.dataSummary) {
      contextSection += `\n- **ملخص البيانات:** ${sanitizeUserContext(pageContext.dataSummary)}`;
    }

    if (pageContext.formState?.isOpen) {
      contextSection += `\n- **نموذج مفتوح:** ${sanitizeUserContext(pageContext.formState.entityName)} (${sanitizeUserContext(pageContext.formState.formType)})`;
    }

    contextSection += `\nاستخدم هذا السياق لتقديم إجابات دقيقة ومرتبطة بما يراه المستخدم. إذا سأل "كم عندي" أو "وش هالأرقام" — ارجع للإحصائيات المعروضة.`;

    parts.push(contextSection);
  }

  return parts.join("\n\n");
}
