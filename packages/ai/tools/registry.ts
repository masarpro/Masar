import { tool } from "ai";
import type { z } from "zod";

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
      execute: async (params: any) => reg.execute(params, context),
    });
  }
  return tools;
}
