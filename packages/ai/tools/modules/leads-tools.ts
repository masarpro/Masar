import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

registerTool({
  name: "queryLeads",
  description:
    "البحث في العملاء المحتملين وعرض قائمتهم مع إمكانية التصفية حسب المرحلة أو المصدر أو التاريخ",
  moduleId: "leads",
  parameters: z.object({
    status: z
      .enum(["NEW", "STUDYING", "QUOTED", "NEGOTIATING", "WON", "LOST"])
      .optional(),
    source: z
      .enum([
        "REFERRAL",
        "SOCIAL_MEDIA",
        "WEBSITE",
        "DIRECT",
        "EXHIBITION",
        "OTHER",
      ])
      .optional(),
    search: z.string().optional(),
    limit: z.number().default(10),
  }),
  execute: async (params, context) => {
    try {
      const leads = await db.lead.findMany({
        where: {
          organizationId: context.organizationId,
          ...(params.status && { status: params.status }),
          ...(params.source && { source: params.source }),
          ...(params.search && {
            OR: [
              { name: { contains: params.search, mode: "insensitive" as const } },
              { email: { contains: params.search, mode: "insensitive" as const } },
              { company: { contains: params.search, mode: "insensitive" as const } },
              { phone: { contains: params.search } },
            ],
          }),
        },
        take: params.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          company: true,
          status: true,
          source: true,
          priority: true,
          estimatedValue: true,
          createdAt: true,
          _count: { select: { activities: true } },
        },
      });
      return {
        leads: leads.map((l) => ({
          ...l,
          estimatedValue: l.estimatedValue == null ? 0 : Number(l.estimatedValue),
        })),
        total: leads.length,
      };
    } catch (e) {
      return { error: `فشل استعلام العملاء المحتملين: ${(e as Error).message}` };
    }
  },
});

registerTool({
  name: "getLeadsSummary",
  description:
    "إحصائيات العملاء المحتملين — عدد كل مرحلة، القيمة المتوقعة الإجمالية، معدل التحويل",
  moduleId: "leads",
  parameters: z.object({}),
  execute: async (_params, context) => {
    try {
      const [stageCounts, totalValue, wonCount, totalCount] =
        await Promise.all([
          db.lead.groupBy({
            by: ["status"],
            where: { organizationId: context.organizationId },
            _count: { id: true },
          }),
          db.lead.aggregate({
            where: {
              organizationId: context.organizationId,
              status: { not: "LOST" },
            },
            _sum: { estimatedValue: true },
          }),
          db.lead.count({
            where: {
              organizationId: context.organizationId,
              status: "WON",
            },
          }),
          db.lead.count({
            where: { organizationId: context.organizationId },
          }),
        ]);

      return {
        byStage: stageCounts.reduce(
          (acc, s) => ({ ...acc, [s.status]: s._count.id }),
          {},
        ),
        totalExpectedValue:
          totalValue._sum.estimatedValue == null
            ? 0
            : Number(totalValue._sum.estimatedValue),
        conversionRate:
          totalCount > 0
            ? ((wonCount / totalCount) * 100).toFixed(1) + "%"
            : "0%",
        totalLeads: totalCount,
      };
    } catch (e) {
      return { error: `فشل جلب إحصائيات العملاء: ${(e as Error).message}` };
    }
  },
});

registerTool({
  name: "getLeadsPipeline",
  description:
    "عرض Pipeline العملاء المحتملين — توزيع العملاء على المراحل مع القيم المتوقعة لكل مرحلة",
  moduleId: "leads",
  parameters: z.object({}),
  execute: async (_params, context) => {
    try {
      const pipeline = await db.lead.groupBy({
        by: ["status"],
        where: { organizationId: context.organizationId },
        _count: { id: true },
        _sum: { estimatedValue: true },
      });

      const stageOrder = [
        "NEW",
        "STUDYING",
        "QUOTED",
        "NEGOTIATING",
        "WON",
        "LOST",
      ];
      return {
        stages: stageOrder.map((stage) => {
          const found = pipeline.find((p) => p.status === stage);
          return {
            stage,
            count: found?._count.id ?? 0,
            totalValue:
              found?._sum.estimatedValue == null
                ? 0
                : Number(found._sum.estimatedValue),
          };
        }),
      };
    } catch (e) {
      return { error: `فشل جلب Pipeline: ${(e as Error).message}` };
    }
  },
});
