import { tool } from "ai";
import type { z } from "zod";
import type { Permissions } from "@repo/database";

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
      execute: async (params: any) => {
        // Defense-in-depth: فحص الصلاحية داخل execute كطبقة حماية ثانية
        if (context.permissions) {
          const { isToolAllowed } = await import("../lib/tool-permissions");
          if (!isToolAllowed(reg.name, context.permissions)) {
            return {
              error:
                "ليس لديك صلاحية للوصول لهذه البيانات. تواصل مع مالك المنظمة لطلب الصلاحية المطلوبة.",
            };
          }
        }
        return reg.execute(params, context);
      },
    });
  }
  return tools;
}
