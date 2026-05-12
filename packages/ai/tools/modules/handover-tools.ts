import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

registerTool({
  name: "queryHandover",
  description:
    'محاضر الاستلام (ابتدائي/نهائي/استلام بند/تسليم). يحتاج projectId. يظهر الحالة وفترة الضمان وقيم المحتجزات المُفرَج عنها.',
  moduleId: "projects",
  parameters: z.object({
    projectId: z.string(),
    type: z
      .enum(["ITEM_ACCEPTANCE", "PRELIMINARY", "FINAL", "DELIVERY"])
      .optional(),
    status: z
      .enum([
        "DRAFT",
        "PENDING_SIGNATURES",
        "PARTIALLY_SIGNED",
        "COMPLETED",
        "ARCHIVED",
        "CANCELLED",
      ])
      .optional(),
    limit: z.number().min(1).max(30).default(15),
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

      const where: any = {
        projectId: params.projectId,
        organizationId: context.organizationId,
      };
      if (params.type) where.type = params.type;
      if (params.status) where.status = params.status;

      const protocols = await db.handoverProtocol.findMany({
        where,
        take: params.limit,
        orderBy: { date: "desc" },
        select: {
          id: true,
          protocolNo: true,
          type: true,
          title: true,
          date: true,
          location: true,
          status: true,
          warrantyStartDate: true,
          warrantyEndDate: true,
          warrantyMonths: true,
          retentionReleaseAmount: true,
          retentionReleaseDate: true,
          completedAt: true,
        },
      });
      return {
        project: { id: project.id, name: project.name },
        protocols: protocols.map((p) => ({
          ...p,
          retentionReleaseAmount:
            p.retentionReleaseAmount == null
              ? null
              : Number(p.retentionReleaseAmount),
        })),
        total: protocols.length,
      };
    } catch (e) {
      return {
        error: `فشل استعلام محاضر الاستلام: ${(e as Error).message}`,
      };
    }
  },
});
