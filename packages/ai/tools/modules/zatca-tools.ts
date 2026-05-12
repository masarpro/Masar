import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

registerTool({
  name: "queryZatcaStatus",
  description:
    'حالة فواتير زاتكا (ZATCA) — يعرض الفواتير المُرسَلة، المقبولة، المرفوضة، المعلقة. يجيب "كم فاتورة فشلت في زاتكا" أو "هل كل فواتيري مرسلة".',
  moduleId: "finance",
  parameters: z.object({
    status: z
      .enum([
        "NOT_APPLICABLE",
        "PENDING",
        "REPORTED",
        "CLEARED",
        "REJECTED",
        "FAILED",
      ])
      .optional(),
    limit: z.number().min(1).max(30).default(15),
  }),
  execute: async (params, context) => {
    try {
      // ملخص حسب الحالة
      const byStatus = await db.financeInvoice.groupBy({
        by: ["zatcaSubmissionStatus"],
        where: {
          organizationId: context.organizationId,
          zatcaSubmissionStatus: { not: "NOT_APPLICABLE" },
        },
        _count: { id: true },
      });

      // أحدث الفواتير المُرسَلة لزاتكا
      const where: any = {
        organizationId: context.organizationId,
        zatcaSubmissionStatus: { not: "NOT_APPLICABLE" },
      };
      if (params.status) where.zatcaSubmissionStatus = params.status;

      const invoices = await db.financeInvoice.findMany({
        where,
        take: params.limit,
        orderBy: { issueDate: "desc" },
        select: {
          id: true,
          invoiceNo: true,
          clientName: true,
          issueDate: true,
          totalAmount: true,
          status: true,
          zatcaSubmissionStatus: true,
          zatcaSubmittedAt: true,
          zatcaClearedAt: true,
          zatcaInvoiceType: true,
        },
      });

      // إحصائيات الإخفاقات الحديثة
      const recentFailures = await db.zatcaSubmission.count({
        where: {
          organizationId: context.organizationId,
          status: { in: ["REJECTED", "FAILED"] },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      return {
        byStatus: byStatus.map((s) => ({
          status: s.zatcaSubmissionStatus,
          count: s._count.id,
        })),
        recentFailures7d: recentFailures,
        invoices: invoices.map((i) => ({
          ...i,
          totalAmount: Number(i.totalAmount),
        })),
        total: invoices.length,
      };
    } catch (e) {
      return { error: `فشل استعلام حالة زاتكا: ${(e as Error).message}` };
    }
  },
});
