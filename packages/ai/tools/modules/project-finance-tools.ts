import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

// Tool: queryClaims
registerTool({
  name: "queryClaims",
  description:
    "قائمة المستخلصات/المطالبات في مشروع — مع المبلغ والحالة وفترة الاستحقاق. يحتاج projectId.",
  moduleId: "projects",
  parameters: z.object({
    projectId: z.string(),
    status: z
      .enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PAID"])
      .optional(),
    limit: z.number().min(1).max(20).default(10),
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
      if (params.status) whereClause.status = params.status;

      const claims = await db.projectClaim.findMany({
        where: whereClause,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          claimNo: true,
          amount: true,
          status: true,
          periodStart: true,
          periodEnd: true,
          dueDate: true,
          note: true,
        },
      });

      const totalAmount = claims.reduce(
        (sum, c) => sum + Number(c.amount),
        0,
      );

      return {
        claims: claims.map((c) => ({
          ...c,
          amount: c.amount?.toString() ?? "0",
        })),
        summary: {
          total: claims.length,
          totalAmount: totalAmount.toString(),
        },
      };
    } catch (e) {
      return {
        error: `فشل استعلام المستخلصات: ${(e as Error).message}`,
      };
    }
  },
});

// Tool: queryChangeOrders
registerTool({
  name: "queryChangeOrders",
  description:
    "قائمة أوامر التغيير في مشروع — مع التأثير المالي والزمني. يحتاج projectId.",
  moduleId: "projects",
  parameters: z.object({
    projectId: z.string(),
    status: z
      .enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "IMPLEMENTED"])
      .optional(),
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
        organizationId: context.organizationId,
      };
      if (params.status) whereClause.status = params.status;

      const changeOrders = await db.projectChangeOrder.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          coNo: true,
          title: true,
          category: true,
          status: true,
          costImpact: true,
          timeImpactDays: true,
          createdAt: true,
        },
      });

      const totalCostImpact = changeOrders.reduce(
        (sum, co) => sum + Number(co.costImpact ?? 0),
        0,
      );
      const totalTimeDays = changeOrders.reduce(
        (sum, co) => sum + (co.timeImpactDays ?? 0),
        0,
      );

      return {
        changeOrders: changeOrders.map((co) => ({
          ...co,
          costImpact: co.costImpact?.toString() ?? "0",
        })),
        summary: {
          total: changeOrders.length,
          totalCostImpact: totalCostImpact.toString(),
          totalTimeDays,
        },
      };
    } catch (e) {
      return {
        error: `فشل استعلام أوامر التغيير: ${(e as Error).message}`,
      };
    }
  },
});
