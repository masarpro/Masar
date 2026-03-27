import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

// Tool: querySubcontracts
registerTool({
  name: "querySubcontracts",
  description:
    "قائمة عقود مقاولي الباطن في مشروع — مع قيمة العقد والحالة وعدد المطالبات والدفعات. يحتاج projectId.",
  moduleId: "subcontracts",
  parameters: z.object({
    projectId: z.string(),
    status: z
      .enum(["DRAFT", "ACTIVE", "COMPLETED", "TERMINATED", "SUSPENDED"])
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
        organizationId: context.organizationId,
      };
      if (params.status) whereClause.status = params.status;

      const contracts = await db.subcontractContract.findMany({
        where: whereClause,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          contractNo: true,
          name: true,
          companyName: true,
          value: true,
          status: true,
          startDate: true,
          endDate: true,
          _count: {
            select: { claims: true, payments: true, changeOrders: true },
          },
        },
      });

      return {
        contracts: contracts.map((c) => ({
          ...c,
          value: c.value?.toString() ?? "0",
        })),
        total: contracts.length,
      };
    } catch (e) {
      return {
        error: `فشل استعلام عقود الباطن: ${(e as Error).message}`,
      };
    }
  },
});

// Tool: getSubcontractDetails
registerTool({
  name: "getSubcontractDetails",
  description:
    "تفاصيل عقد مقاول باطن — البنود، المطالبات، الدفعات، أوامر التغيير. يحتاج contractId.",
  moduleId: "subcontracts",
  parameters: z.object({
    contractId: z.string(),
  }),
  execute: async (params, context) => {
    try {
      const contract = await db.subcontractContract.findFirst({
        where: {
          id: params.contractId,
          organizationId: context.organizationId,
        },
        select: {
          id: true,
          contractNo: true,
          name: true,
          companyName: true,
          value: true,
          status: true,
          startDate: true,
          endDate: true,
          scopeOfWork: true,
          items: {
            select: {
              id: true,
              description: true,
              contractQty: true,
              unitPrice: true,
              totalAmount: true,
            },
          },
          claims: {
            select: {
              id: true,
              claimNo: true,
              grossAmount: true,
              netAmount: true,
              status: true,
              periodStart: true,
              periodEnd: true,
            },
            orderBy: { createdAt: "desc" as const },
            take: 10,
          },
          payments: {
            select: {
              id: true,
              paymentNo: true,
              amount: true,
              date: true,
              paymentMethod: true,
            },
            orderBy: { date: "desc" as const },
            take: 10,
          },
          changeOrders: {
            select: {
              id: true,
              description: true,
              status: true,
              amount: true,
            },
            orderBy: { createdAt: "desc" as const },
          },
        },
      });

      if (!contract)
        return { error: "العقد غير موجود أو لا تملك صلاحية الوصول" };

      const totalPaid = contract.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const totalClaimed = contract.claims
        .filter((c) => c.status === "APPROVED" || c.status === "PAID")
        .reduce((sum, c) => sum + Number(c.netAmount), 0);

      return {
        contract: {
          ...contract,
          value: contract.value?.toString() ?? "0",
          items: contract.items.map((i) => ({
            ...i,
            contractQty: i.contractQty?.toString(),
            unitPrice: i.unitPrice?.toString(),
            totalAmount: i.totalAmount?.toString(),
          })),
          claims: contract.claims.map((c) => ({
            ...c,
            grossAmount: c.grossAmount?.toString(),
            netAmount: c.netAmount?.toString(),
          })),
          payments: contract.payments.map((p) => ({
            ...p,
            amount: p.amount?.toString(),
          })),
          changeOrders: contract.changeOrders.map((co) => ({
            ...co,
            amount: co.amount?.toString(),
          })),
        },
        totals: {
          totalPaid: totalPaid.toString(),
          totalClaimed: totalClaimed.toString(),
          remaining: (Number(contract.value) - totalPaid).toString(),
        },
      };
    } catch (e) {
      return {
        error: `فشل جلب تفاصيل العقد: ${(e as Error).message}`,
      };
    }
  },
});
