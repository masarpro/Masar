import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

registerTool({
  name: "queryDocuments",
  description:
    "قائمة مستندات المشروع — مع التصنيف والإصدار. يحتاج projectId.",
  moduleId: "documents",
  parameters: z.object({
    projectId: z.string(),
    search: z.string().optional(),
    limit: z.number().min(1).max(50).default(20),
  }),
  execute: async (params, context) => {
    try {
      const project = await db.project.findFirst({
        where: {
          id: params.projectId,
          organizationId: context.organizationId,
        },
        select: { id: true },
      });
      if (!project)
        return { error: "المشروع غير موجود أو لا تملك صلاحية الوصول" };

      const whereClause: Record<string, unknown> = {
        projectId: params.projectId,
      };
      if (params.search) {
        whereClause.title = {
          contains: params.search,
          mode: "insensitive" as const,
        };
      }

      const documents = await db.projectDocument.findMany({
        where: whereClause,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          folder: true,
          fileName: true,
          fileSize: true,
          version: true,
          createdAt: true,
          createdBy: { select: { name: true } },
        },
      });

      return {
        documents,
        total: documents.length,
      };
    } catch (e) {
      return {
        error: `فشل استعلام المستندات: ${(e as Error).message}`,
      };
    }
  },
});
