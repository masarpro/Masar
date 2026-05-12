import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

registerTool({
  name: "queryAssets",
  description:
    'قائمة الأصول الثابتة (معدات، مركبات، أدوات). action=list: قائمة. action=summary: ملخص حسب الحالة والفئة.',
  moduleId: "company",
  parameters: z.object({
    action: z.enum(["list", "summary"]).default("list"),
    status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "RETIRED"]).optional(),
    category: z.string().optional(),
    projectId: z.string().optional(),
    search: z.string().optional(),
    limit: z.number().min(1).max(50).default(20),
  }),
  execute: async (params, context) => {
    try {
      const where: any = { organizationId: context.organizationId };
      if (params.status) where.status = params.status;
      if (params.category) where.category = params.category as any;
      if (params.projectId) where.currentProjectId = params.projectId;
      if (params.search) {
        where.OR = [
          {
            name: {
              contains: params.search,
              mode: "insensitive" as const,
            },
          },
          {
            assetNo: {
              contains: params.search,
              mode: "insensitive" as const,
            },
          },
        ];
      }

      if (params.action === "summary") {
        const [byCategory, byStatus, totals] = await Promise.all([
          db.companyAsset.groupBy({
            by: ["category"],
            where: { organizationId: context.organizationId },
            _count: { id: true },
            _sum: { currentValue: true, purchasePrice: true },
          }),
          db.companyAsset.groupBy({
            by: ["status"],
            where: { organizationId: context.organizationId },
            _count: { id: true },
          }),
          db.companyAsset.aggregate({
            where: { organizationId: context.organizationId },
            _count: { id: true },
            _sum: { currentValue: true, purchasePrice: true },
          }),
        ]);
        return {
          byCategory: byCategory.map((c) => ({
            category: c.category,
            count: c._count.id,
            totalValue: c._sum.currentValue == null ? 0 : Number(c._sum.currentValue),
            totalCost: c._sum.purchasePrice == null ? 0 : Number(c._sum.purchasePrice),
          })),
          byStatus: byStatus.map((s) => ({
            status: s.status,
            count: s._count.id,
          })),
          totals: {
            count: totals._count.id,
            currentValue: totals._sum.currentValue == null ? 0 : Number(totals._sum.currentValue),
            purchasePrice: totals._sum.purchasePrice == null ? 0 : Number(totals._sum.purchasePrice),
          },
        };
      }

      const assets = await db.companyAsset.findMany({
        where,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          assetNo: true,
          category: true,
          type: true,
          status: true,
          brand: true,
          model: true,
          purchasePrice: true,
          currentValue: true,
          purchaseDate: true,
          currentProject: { select: { id: true, name: true } },
        },
      });
      return {
        assets: assets.map((a) => ({
          ...a,
          purchasePrice: a.purchasePrice == null ? null : Number(a.purchasePrice),
          currentValue: a.currentValue == null ? null : Number(a.currentValue),
        })),
        total: assets.length,
      };
    } catch (e) {
      return { error: `فشل استعلام الأصول: ${(e as Error).message}` };
    }
  },
});
