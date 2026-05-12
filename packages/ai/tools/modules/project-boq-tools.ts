import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

registerTool({
  name: "queryProjectBOQ",
  description:
    'جدول كميات المشروع (BOQ) — البنود مع الوحدات والكميات والأسعار. يحتاج projectId. action=list: قائمة البنود. action=summary: ملخص بالأقسام والإجمالي.',
  moduleId: "projects",
  parameters: z.object({
    projectId: z.string(),
    action: z.enum(["list", "summary"]).default("list"),
    section: z
      .enum([
        "GENERAL",
        "STRUCTURAL",
        "FINISHING",
        "MEP",
        "EARTHWORK",
        "EXTERNAL",
      ])
      .optional(),
    search: z.string().optional(),
    limit: z.number().min(1).max(100).default(50),
  }),
  execute: async (params, context) => {
    try {
      // تحقق ملكية المشروع
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
      if (params.section) where.section = params.section;
      if (params.search) {
        where.OR = [
          {
            description: {
              contains: params.search,
              mode: "insensitive" as const,
            },
          },
          {
            code: {
              contains: params.search,
              mode: "insensitive" as const,
            },
          },
        ];
      }

      if (params.action === "summary") {
        const [bySection, totals] = await Promise.all([
          db.projectBOQItem.groupBy({
            by: ["section"],
            where: {
              projectId: params.projectId,
              organizationId: context.organizationId,
            },
            _count: { id: true },
            _sum: { totalPrice: true },
          }),
          db.projectBOQItem.aggregate({
            where: {
              projectId: params.projectId,
              organizationId: context.organizationId,
            },
            _count: { id: true },
            _sum: { totalPrice: true },
          }),
        ]);
        return {
          project: { id: project.id, name: project.name },
          bySection: bySection.map((s) => ({
            section: s.section,
            count: s._count.id,
            totalPrice: s._sum.totalPrice == null ? 0 : Number(s._sum.totalPrice),
          })),
          totals: {
            count: totals._count.id,
            totalPrice: totals._sum.totalPrice == null ? 0 : Number(totals._sum.totalPrice),
          },
        };
      }

      const items = await db.projectBOQItem.findMany({
        where,
        take: params.limit,
        orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          section: true,
          category: true,
          code: true,
          description: true,
          unit: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          sourceType: true,
        },
      });
      return {
        project: { id: project.id, name: project.name },
        items: items.map((i) => ({
          ...i,
          quantity: Number(i.quantity),
          unitPrice: i.unitPrice == null ? null : Number(i.unitPrice),
          totalPrice: i.totalPrice == null ? null : Number(i.totalPrice),
        })),
        total: items.length,
      };
    } catch (e) {
      return { error: `فشل استعلام جدول كميات المشروع: ${(e as Error).message}` };
    }
  },
});
