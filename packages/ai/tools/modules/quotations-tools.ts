import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

function toNum(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "object" && "toNumber" in (val as object)) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val);
}

// ──────────────────────────────────────────
// 1. قائمة عروض الأسعار
// ──────────────────────────────────────────
registerTool({
  name: "queryQuotations",
  description:
    'البحث في عروض الأسعار — بالعميل أو الحالة أو الرقم. يجيب على "هل يوجد عرض سعر لشركة x" أو "كم عرض سعر أرسلنا هالشهر"',
  moduleId: "finance",
  parameters: z.object({
    search: z
      .string()
      .optional()
      .describe("بحث باسم العميل أو رقم العرض"),
    status: z
      .enum([
        "DRAFT",
        "SENT",
        "VIEWED",
        "ACCEPTED",
        "REJECTED",
        "EXPIRED",
        "CONVERTED",
      ])
      .optional(),
    clientId: z.string().optional(),
    limit: z.number().default(10),
  }),
  execute: async (params, context) => {
    try {
      const quotations = await db.quotation.findMany({
        where: {
          organizationId: context.organizationId,
          ...(params.status && { status: params.status }),
          ...(params.clientId && { clientId: params.clientId }),
          ...(params.search && {
            OR: [
              {
                quotationNo: {
                  contains: params.search,
                  mode: "insensitive" as const,
                },
              },
              {
                clientName: {
                  contains: params.search,
                  mode: "insensitive" as const,
                },
              },
              {
                clientCompany: {
                  contains: params.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }),
        },
        take: params.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          quotationNo: true,
          status: true,
          validUntil: true,
          subtotal: true,
          vatAmount: true,
          totalAmount: true,
          createdAt: true,
          clientName: true,
          clientCompany: true,
          client: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      });

      return {
        quotations: quotations.map((q) => ({
          ...q,
          subtotal: q.subtotal?.toString(),
          vatAmount: q.vatAmount?.toString(),
          totalAmount: q.totalAmount?.toString(),
        })),
        total: quotations.length,
      };
    } catch (e) {
      return { error: `فشل استعلام عروض الأسعار: ${(e as Error).message}` };
    }
  },
});

// ──────────────────────────────────────────
// 2. تفاصيل عرض سعر واحد مع البنود
// ──────────────────────────────────────────
registerTool({
  name: "getQuotationDetails",
  description:
    'تفاصيل عرض سعر كاملة مع كل البنود والأسعار والإجمالي — يجيب على "كم إجمالي عرض سعر رقم X" أو "وش بنود العرض"',
  moduleId: "finance",
  parameters: z.object({
    quotationId: z.string().optional().describe("معرّف عرض السعر"),
    quotationNo: z
      .string()
      .optional()
      .describe("رقم عرض السعر — مثل QT-0001"),
  }),
  execute: async (params, context) => {
    try {
      const quotation = await db.quotation.findFirst({
        where: {
          organizationId: context.organizationId,
          ...(params.quotationId && { id: params.quotationId }),
          ...(params.quotationNo && { quotationNo: params.quotationNo }),
        },
        include: {
          client: {
            select: { name: true, phone: true, email: true },
          },
          items: {
            select: {
              id: true,
              description: true,
              quantity: true,
              unit: true,
              unitPrice: true,
              totalPrice: true,
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (!quotation) return { error: "عرض السعر غير موجود" };

      return {
        quotation: {
          quotationNo: quotation.quotationNo,
          status: quotation.status,
          validUntil: quotation.validUntil,
          paymentTerms: quotation.paymentTerms,
          createdAt: quotation.createdAt,
          clientName: quotation.clientName,
          clientCompany: quotation.clientCompany,
        },
        client: quotation.client,
        items: quotation.items.map((i) => ({
          ...i,
          quantity: i.quantity?.toString(),
          unitPrice: i.unitPrice?.toString(),
          totalPrice: i.totalPrice?.toString(),
        })),
        totals: {
          subtotal: quotation.subtotal?.toString(),
          vatAmount: quotation.vatAmount?.toString(),
          totalAmount: quotation.totalAmount?.toString(),
          itemsCount: quotation.items.length,
        },
      };
    } catch (e) {
      return {
        error: `فشل جلب تفاصيل عرض السعر: ${(e as Error).message}`,
      };
    }
  },
});

// ──────────────────────────────────────────
// 3. ملخص عروض الأسعار
// ──────────────────────────────────────────
registerTool({
  name: "getQuotationsSummary",
  description:
    "إحصائيات عروض الأسعار — عدد كل حالة، إجمالي القيم، معدل القبول",
  moduleId: "finance",
  parameters: z.object({
    period: z
      .enum(["week", "month", "quarter", "year", "all"])
      .default("month"),
  }),
  execute: async (params, context) => {
    try {
      const now = new Date();
      let dateFilter: any = {};

      if (params.period !== "all") {
        const start = new Date(now);
        if (params.period === "week") start.setDate(start.getDate() - 7);
        else if (params.period === "month")
          start.setMonth(start.getMonth() - 1);
        else if (params.period === "quarter")
          start.setMonth(start.getMonth() - 3);
        else if (params.period === "year")
          start.setFullYear(start.getFullYear() - 1);
        dateFilter = { createdAt: { gte: start } };
      }

      const [statusCounts, totalValues, acceptedCount, totalCount] =
        await Promise.all([
          db.quotation.groupBy({
            by: ["status"],
            where: {
              organizationId: context.organizationId,
              ...dateFilter,
            },
            _count: { id: true },
            _sum: { totalAmount: true },
          }),
          db.quotation.aggregate({
            where: {
              organizationId: context.organizationId,
              ...dateFilter,
            },
            _sum: { totalAmount: true },
            _count: { id: true },
          }),
          db.quotation.count({
            where: {
              organizationId: context.organizationId,
              status: "ACCEPTED",
              ...dateFilter,
            },
          }),
          db.quotation.count({
            where: {
              organizationId: context.organizationId,
              ...dateFilter,
            },
          }),
        ]);

      return {
        period: params.period,
        byStatus: statusCounts.reduce(
          (acc, s) => ({
            ...acc,
            [s.status]: {
              count: s._count.id,
              total: s._sum.totalAmount?.toString() ?? "0",
            },
          }),
          {},
        ),
        totalValue: totalValues._sum.totalAmount?.toString() ?? "0",
        totalCount,
        acceptanceRate:
          totalCount > 0
            ? ((acceptedCount / totalCount) * 100).toFixed(1) + "%"
            : "0%",
      };
    } catch (e) {
      return {
        error: `فشل جلب إحصائيات عروض الأسعار: ${(e as Error).message}`,
      };
    }
  },
});
