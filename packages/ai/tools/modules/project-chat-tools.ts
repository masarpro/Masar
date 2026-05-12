import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

registerTool({
  name: "queryProjectChat",
  description:
    'محادثات المشروع — آخر الرسائل في قناة الفريق أو قناة المالك. يحتاج projectId. action=recent: آخر الرسائل. action=summary: إحصائيات الرسائل والتحديثات.',
  moduleId: "projects",
  parameters: z.object({
    projectId: z.string(),
    action: z.enum(["recent", "summary"]).default("recent"),
    channel: z.enum(["TEAM", "OWNER"]).optional(),
    limit: z.number().min(1).max(30).default(10),
  }),
  execute: async (params, context) => {
    try {
      const project = await db.project.findFirst({
        where: {
          id: params.projectId,
          organizationId: context.organizationId,
        },
        select: { id: true, name: true },
      });
      if (!project) {
        return { error: "المشروع غير موجود أو لا تملك صلاحية الوصول" };
      }

      if (params.action === "summary") {
        const [byChannel, updateCount, lastMessage] = await Promise.all([
          db.projectMessage.groupBy({
            by: ["channel"],
            where: {
              projectId: params.projectId,
              organizationId: context.organizationId,
            },
            _count: { id: true },
          }),
          db.projectMessage.count({
            where: {
              projectId: params.projectId,
              organizationId: context.organizationId,
              isUpdate: true,
            },
          }),
          db.projectMessage.findFirst({
            where: {
              projectId: params.projectId,
              organizationId: context.organizationId,
            },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true, channel: true },
          }),
        ]);
        return {
          project: { id: project.id, name: project.name },
          byChannel: byChannel.map((c) => ({
            channel: c.channel,
            count: c._count.id,
          })),
          officialUpdates: updateCount,
          lastActivity: lastMessage
            ? {
                at: lastMessage.createdAt,
                channel: lastMessage.channel,
              }
            : null,
        };
      }

      const where: any = {
        projectId: params.projectId,
        organizationId: context.organizationId,
      };
      if (params.channel) where.channel = params.channel;

      const messages = await db.projectMessage.findMany({
        where,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          channel: true,
          isUpdate: true,
          content: true,
          createdAt: true,
          sender: { select: { name: true } },
        },
      });
      return {
        project: { id: project.id, name: project.name },
        messages: messages.map((m) => ({
          id: m.id,
          channel: m.channel,
          isUpdate: m.isUpdate,
          // اقتصاص المحتوى لتقليل تكلفة tokens
          content:
            m.content.length > 300 ? m.content.slice(0, 300) + "…" : m.content,
          createdAt: m.createdAt,
          senderName: m.sender?.name ?? null,
        })),
        total: messages.length,
      };
    } catch (e) {
      return {
        error: `فشل استعلام محادثات المشروع: ${(e as Error).message}`,
      };
    }
  },
});
