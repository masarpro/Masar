import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

registerTool({
  name: "queryVouchers",
  description:
    "سندات القبض والصرف — قائمة السندات مع المبلغ والحالة. type=receipt: سندات القبض. type=payment: سندات الصرف. type=all: الكل.",
  moduleId: "finance",
  parameters: z.object({
    type: z.enum(["receipt", "payment", "all"]),
    status: z
      .enum(["DRAFT", "PENDING_APPROVAL", "ISSUED", "CANCELLED"])
      .optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    limit: z.number().min(1).max(50).default(20),
  }),
  execute: async (params, context) => {
    try {
      const dateFilter: Record<string, unknown> = {};
      if (params.dateFrom) dateFilter.gte = new Date(params.dateFrom);
      if (params.dateTo) dateFilter.lte = new Date(params.dateTo);
      const hasDateFilter = Object.keys(dateFilter).length > 0;

      const results: Array<Record<string, unknown>> = [];

      if (params.type === "receipt" || params.type === "all") {
        const receiptWhere: Record<string, unknown> = {
          organizationId: context.organizationId,
        };
        if (params.status) receiptWhere.status = params.status;
        if (hasDateFilter) receiptWhere.date = dateFilter;

        const receipts = await db.receiptVoucher.findMany({
          where: receiptWhere,
          take: params.limit,
          orderBy: { date: "desc" },
          select: {
            id: true,
            voucherNo: true,
            date: true,
            amount: true,
            receivedFrom: true,
            paymentMethod: true,
            status: true,
            description: true,
          },
        });
        results.push(
          ...receipts.map((r) => ({
            ...r,
            type: "receipt" as const,
            amount: r.amount?.toString() ?? "0",
          })),
        );
      }

      if (params.type === "payment" || params.type === "all") {
        const paymentWhere: Record<string, unknown> = {
          organizationId: context.organizationId,
        };
        if (params.status) paymentWhere.status = params.status;
        if (hasDateFilter) paymentWhere.date = dateFilter;

        const payments = await db.paymentVoucher.findMany({
          where: paymentWhere,
          take: params.limit,
          orderBy: { date: "desc" },
          select: {
            id: true,
            voucherNo: true,
            date: true,
            amount: true,
            payeeName: true,
            paymentMethod: true,
            status: true,
            description: true,
          },
        });
        results.push(
          ...payments.map((p) => ({
            ...p,
            type: "payment" as const,
            amount: p.amount?.toString() ?? "0",
          })),
        );
      }

      // Sort by date desc if both types
      if (params.type === "all") {
        results.sort(
          (a, b) =>
            new Date(b.date as string).getTime() -
            new Date(a.date as string).getTime(),
        );
      }

      return {
        vouchers: results.slice(0, params.limit),
        total: results.length,
      };
    } catch (e) {
      return { error: `فشل استعلام السندات: ${(e as Error).message}` };
    }
  },
});
