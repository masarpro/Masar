import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

registerTool({
  name: "queryInvoices",
  description:
    'البحث في الفواتير الصادرة. action=list: قائمة. action=summary: ملخص حسب الحالة (مسودة/مرسلة/مدفوعة/متأخرة). يجيب "كم فاتورة معلقة" أو "إجمالي الفواتير المتأخرة".',
  moduleId: "finance",
  parameters: z.object({
    action: z.enum(["list", "summary"]).default("list"),
    status: z
      .enum([
        "DRAFT",
        "PENDING_APPROVAL",
        "ISSUED",
        "PARTIALLY_PAID",
        "PAID",
        "OVERDUE",
        "CANCELLED",
      ])
      .optional(),
    clientName: z.string().optional(),
    projectId: z.string().optional(),
    limit: z.number().min(1).max(50).default(20),
  }),
  execute: async (params, context) => {
    try {
      const where: any = { organizationId: context.organizationId };
      if (params.status) where.status = params.status;
      if (params.projectId) where.projectId = params.projectId;
      if (params.clientName) {
        where.clientName = {
          contains: params.clientName,
          mode: "insensitive" as const,
        };
      }

      if (params.action === "summary") {
        const [byStatus, totals] = await Promise.all([
          db.financeInvoice.groupBy({
            by: ["status"],
            where: { organizationId: context.organizationId },
            _count: { id: true },
            _sum: { totalAmount: true, paidAmount: true },
          }),
          db.financeInvoice.aggregate({
            where: { organizationId: context.organizationId },
            _sum: { totalAmount: true, paidAmount: true },
            _count: { id: true },
          }),
        ]);
        return {
          byStatus: byStatus.map((s) => ({
            status: s.status,
            count: s._count.id,
            totalAmount: s._sum.totalAmount == null ? 0 : Number(s._sum.totalAmount),
            paidAmount: s._sum.paidAmount == null ? 0 : Number(s._sum.paidAmount),
          })),
          totals: {
            count: totals._count.id,
            totalAmount: totals._sum.totalAmount == null ? 0 : Number(totals._sum.totalAmount),
            paidAmount: totals._sum.paidAmount == null ? 0 : Number(totals._sum.paidAmount),
            outstanding:
              Number(totals._sum.totalAmount ?? 0) -
              Number(totals._sum.paidAmount ?? 0),
          },
        };
      }

      const invoices = await db.financeInvoice.findMany({
        where,
        take: params.limit,
        orderBy: { issueDate: "desc" },
        select: {
          id: true,
          invoiceNo: true,
          clientName: true,
          issueDate: true,
          dueDate: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
          vatAmount: true,
          zatcaSubmissionStatus: true,
        },
      });
      return {
        invoices: invoices.map((i) => ({
          ...i,
          totalAmount: Number(i.totalAmount),
          paidAmount: Number(i.paidAmount),
          vatAmount: Number(i.vatAmount),
          outstanding: Number(i.totalAmount) - Number(i.paidAmount),
        })),
        total: invoices.length,
      };
    } catch (e) {
      return { error: `فشل استعلام الفواتير: ${(e as Error).message}` };
    }
  },
});
