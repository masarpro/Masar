/**
 * Shared Assistant Pipeline
 *
 * يجمع كل ما يحتاجه streamText (system prompt + tools + sanitization)
 * في مكان واحد لاستخدامه من قِبل:
 *   - apps/web/app/api/ai/assistant/route.ts (الزر العائم)
 *   - packages/api/modules/ai/procedures/add-message-to-chat.ts (صفحة /chatbot)
 *
 * هذا يضمن أن المساعد له نفس القدرة على كل الواجهات.
 */

import type { Permissions } from "@repo/database";
import {
	type AssistantContext,
	buildSystemPrompt,
} from "../prompts/assistant-system";
import { type AIModuleDefinition, getAllModules, getModuleById } from "../modules/registry";
import { getAISDKTools, type ToolContext } from "../tools/registry";
import { getAssistantTools } from "../tools/assistant-tools";
import {
	filterToolsByPermission,
	getPermissionSummaryForPrompt,
} from "./tool-permissions";
import { sanitizeUserContext } from "./sanitize-context";

// ─── الأنواع العامة ─────────────────────────────────────────────────

export interface PageContextPayload {
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

export interface BuildPipelineInput {
	/** هوية المستخدم والمنظمة */
	userId: string;
	userName: string;
	organizationId: string;
	organizationSlug: string;
	organizationName: string;
	roleLabel: string;

	/** اللغة وسياق الصفحة */
	locale: string;
	currentPage?: string;
	currentSection?: string;

	/** سياق المشروع (اختياري) */
	projectId?: string;
	projectName?: string;

	/** سياق الصفحة الديناميكي من Zustand */
	pageContext?: PageContextPayload | null;

	/** صلاحيات المستخدم */
	permissions: Permissions;
	roleType?: string;
}

export interface BuildPipelineOutput {
	systemPrompt: string;
	tools: Record<string, any>;
	activeModuleId: string | null;
	toolCount: number;
}

// ─── Module Registry Cache ──────────────────────────────────────────
// Registry ساكن في runtime — لا داعي لإعادة بنائه على كل request

let _cachedAllModules: AIModuleDefinition[] | null = null;
function getAllModulesCached(): AIModuleDefinition[] {
	if (!_cachedAllModules) {
		_cachedAllModules = getAllModules();
	}
	return _cachedAllModules;
}

let _cachedModulesPromptSection: string | null = null;
function getModulesPromptSection(): string {
	if (_cachedModulesPromptSection !== null) return _cachedModulesPromptSection;
	const all = getAllModulesCached();
	_cachedModulesPromptSection = `
## كل أقسام المنصة المتاحة:
${all.map((m) => `- **${m.nameAr}** (${m.nameEn}): ${m.description}`).join("\n")}`;
	return _cachedModulesPromptSection;
}

// ─── البناء الأساسي ─────────────────────────────────────────────────

/**
 * بناء system prompt + tools + كل ما يحتاجه streamText.
 * هذه الدالة pure — لا تلمس DB، فقط تركّب نصوصاً وأدوات.
 */
export function buildAssistantPipeline(
	input: BuildPipelineInput,
): BuildPipelineOutput {
	const activeModule = input.pageContext?.moduleId
		? getModuleById(input.pageContext.moduleId)
		: null;

	// 1. السياق الأساسي (نفس AssistantContext القديم)
	const assistantContext: AssistantContext = {
		userName: input.userName,
		userRole: input.roleLabel,
		locale: input.locale,
		organizationName: input.organizationName,
		organizationSlug: input.organizationSlug,
		organizationId: input.organizationId,
		currentPage: input.currentPage ?? input.pageContext?.currentRoute ?? "",
		currentSection: input.currentSection ?? input.pageContext?.moduleId ?? "",
		projectId: input.projectId,
		projectName: input.projectName,
	};

	// 2. system prompt الموسّع
	const systemPrompt = buildEnhancedSystemPrompt(
		assistantContext,
		activeModule,
		input.pageContext ?? undefined,
		input.permissions,
	);

	// 3. جمع الأدوات
	const toolContext: ToolContext = {
		organizationId: input.organizationId,
		userId: input.userId,
		organizationSlug: input.organizationSlug,
		locale: input.locale,
		projectId: input.projectId,
		permissions: input.permissions,
		roleType: input.roleType,
	};

	const legacyTools = getAssistantTools({
		organizationId: input.organizationId,
		userId: input.userId,
		organizationSlug: input.organizationSlug,
		locale: input.locale,
	});

	// الأدوات الأساسية متاحة دائماً + أدوات القسم النشط
	const newTools = {
		...(activeModule ? getAISDKTools(toolContext, activeModule.id) : {}),
		...getAISDKTools(toolContext, "projects"),
		...getAISDKTools(toolContext, "execution"),
		...getAISDKTools(toolContext, "quantities"),
		...getAISDKTools(toolContext, "finance"),
		...getAISDKTools(toolContext, "leads"),
		...getAISDKTools(toolContext, "accounting"),
		...getAISDKTools(toolContext, "subcontracts"),
		...getAISDKTools(toolContext, "dashboard"),
		...getAISDKTools(toolContext, "company"),
		...getAISDKTools(toolContext, "documents"),
		...getAISDKTools(toolContext, "field"),
		...getAISDKTools(toolContext, "system"),
	};

	// الدمج: legacy يفوز عند تكرار الاسم لتجنّب الكسر
	const allTools = { ...newTools, ...legacyTools };
	const filteredTools = filterToolsByPermission(allTools, input.permissions);

	return {
		systemPrompt,
		tools: filteredTools,
		activeModuleId: activeModule?.id ?? null,
		toolCount: Object.keys(filteredTools).length,
	};
}

// ─── system prompt الموسّع ──────────────────────────────────────────

function buildEnhancedSystemPrompt(
	assistantContext: AssistantContext,
	activeModule: AIModuleDefinition | null | undefined,
	pageContext: PageContextPayload | undefined,
	permissions: Permissions,
): string {
	const parts: string[] = [buildSystemPrompt(assistantContext)];

	// صلاحيات المستخدم
	const permSummary = getPermissionSummaryForPrompt(permissions);
	parts.push(`## صلاحيات المستخدم
- **الدور:** ${assistantContext.userRole}
- ${permSummary}
- إذا طلب المستخدم بيانات ليس لديه صلاحية الوصول لها، أخبره بلطف: "ليس لديك صلاحية الوصول لهذه البيانات. يمكنك طلب الصلاحية من مالك المنظمة."
- لا تذكر أسماء الصلاحيات التقنية — استخدم وصفاً بالعربي.
- إذا سأل "وش صلاحياتي" أو "ما هي صلاحياتي" — استخدم أداة getMyPermissions.`);

	// كل أقسام المنصة (مع cache)
	parts.push(getModulesPromptSection());

	// القسم النشط
	if (activeModule) {
		parts.push(`
## القسم الحالي: ${activeModule.nameAr}
${activeModule.systemPrompt}

### أمثلة أسئلة يمكنك مساعدة المستخدم فيها:
${activeModule.exampleQuestions.map((q) => `- ${q}`).join("\n")}

### الأدوات الموصى بها لهذا القسم:
${activeModule.relatedTools.map((t) => `- ${t}`).join("\n")}
استخدم هذه الأدوات أولاً للإجابة على أسئلة هذا القسم.`);
	}

	// سياق الصفحة الديناميكي
	if (pageContext) {
		let contextSection = `
## ما يراه المستخدم حالياً:
- **الصفحة:** ${sanitizeUserContext(pageContext.pageName)}
- **الوصف:** ${sanitizeUserContext(pageContext.pageDescription)}
- **المسار:** ${sanitizeUserContext(pageContext.currentRoute)}`;

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

		contextSection += `\nاستخدم هذا السياق لتقديم إجابات دقيقة ومرتبطة بما يراه المستخدم. إذا سأل "كم عندي" أو "وش هالأرقام" — ارجع للإحصائيات المعروضة. إذا السياق فيه moduleId، استخدم أدوات ذلك القسم أولاً.`;

		parts.push(contextSection);
	}

	return parts.join("\n\n");
}

// ─── أنواع مُعاد تصديرها للراحة ─────────────────────────────────────
export type { AssistantContext };
