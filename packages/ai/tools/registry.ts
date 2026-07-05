import { tool } from "ai";
import type { z } from "zod";
import type { Permissions } from "@repo/database";
import {
  type PermissionRequirement,
  withPermissionGuard,
} from "../lib/tool-permissions";

export interface AIToolRegistration {
  /** اسم الأداة */
  name: string;
  /** وصف بالعربي لماذا تُستخدم */
  description: string;
  /** الـ module المرتبط */
  moduleId: string;
  /** Zod schema للمدخلات */
  parameters: z.ZodType<any>;
  /** الدالة المنفّذة */
  execute: (params: any, context: ToolContext) => Promise<any>;
  /**
   * متطلب صلاحية اختياري يتجاوز الخريطة المركزية (TOOL_PERMISSION_MAP).
   * إن لم يُحدَّد، تُستخدم الخريطة المركزية — وأداة غير موجودة فيها
   * تُرفض افتراضياً (fail-closed).
   */
  requiredPermission?: PermissionRequirement;
}

export interface ToolContext {
  organizationId: string;
  userId: string;
  organizationSlug: string;
  locale: string;
  projectId?: string;
  /** صلاحيات المستخدم — تُستخدم لفحص الصلاحيات وأداة getMyPermissions */
  permissions?: Permissions;
  /** نوع الدور (OWNER, ACCOUNTANT, etc.) */
  roleType?: string;
}

// سجل الأدوات
const toolRegistry: Map<string, AIToolRegistration> = new Map();

export function registerTool(registration: AIToolRegistration) {
  toolRegistry.set(registration.name, registration);
}

export function getToolsForModule(moduleId: string): AIToolRegistration[] {
  return Array.from(toolRegistry.values()).filter(
    (t) => t.moduleId === moduleId,
  );
}

export function getAllRegisteredTools(): AIToolRegistration[] {
  return Array.from(toolRegistry.values());
}

/** تحويل الأدوات المسجّلة لصيغة Vercel AI SDK */
export function getAISDKTools(
  context: ToolContext,
  moduleId?: string,
) {
  const registrations = moduleId
    ? getToolsForModule(moduleId)
    : getAllRegisteredTools();

  const tools: Record<string, any> = {};
  for (const reg of registrations) {
    tools[reg.name] = tool({
      description: reg.description,
      inputSchema: reg.parameters as z.ZodObject<any>,
      // الطبقة 2 (دفاع في العمق): حارس تنفيذ مركزي — غياب الصلاحيات
      // في السياق يعني رفض كل أداة غير عامة (fail-closed)
      execute: withPermissionGuard(
        reg.name,
        context.permissions,
        (params: any) => reg.execute(params, context),
        reg.requiredPermission,
      ),
    });
  }
  return tools;
}
