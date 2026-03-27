import { z } from "zod";
import { registerTool } from "../registry";
import {
  getDashboardStats,
  getFinanceDashboardStats,
  getOrganizationBalancesSummary,
} from "@repo/database";

function toNum(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  if (
    typeof val === "object" &&
    val !== null &&
    "toNumber" in (val as Record<string, unknown>)
  ) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val);
}

// Tool: getDashboardSummary
registerTool({
  name: "getDashboardSummary",
  description:
    "ملخص لوحة تحكم المنظمة — عدد المشاريع حسب الحالة، الملخص المالي، المعالم القادمة والمتأخرة.",
  moduleId: "dashboard",
  parameters: z.object({}),
  execute: async (_params, context) => {
    try {
      const stats = await getDashboardStats(context.organizationId);
      return {
        projects: stats.projects,
        financials: {
          totalContractValue: toNum(stats.financials.totalContractValue),
          totalExpenses: toNum(stats.financials.totalExpenses),
        },
        milestones: stats.milestones,
      };
    } catch (e) {
      return {
        error: `فشل جلب ملخص لوحة التحكم: ${(e as Error).message}`,
      };
    }
  },
});

// Tool: getFinanceDashboard
registerTool({
  name: "getFinanceDashboard",
  description:
    "لوحة تحكم مالية — إحصائيات الفواتير، أرصدة الحسابات البنكية، المصروفات والمقبوضات.",
  moduleId: "dashboard",
  parameters: z.object({}),
  execute: async (_params, context) => {
    try {
      const [financeStats, balances] = await Promise.all([
        getFinanceDashboardStats(context.organizationId),
        getOrganizationBalancesSummary(context.organizationId),
      ]);
      return {
        invoices: {
          total: financeStats.invoices.total,
          paid: financeStats.invoices.paid,
          overdue: financeStats.invoices.overdue,
          totalValue: toNum(financeStats.invoices.totalValue),
          paidValue: toNum(financeStats.invoices.paidValue),
          outstandingValue: toNum(financeStats.invoices.outstandingValue),
        },
        bankBalances: balances,
      };
    } catch (e) {
      return {
        error: `فشل جلب لوحة التحكم المالية: ${(e as Error).message}`,
      };
    }
  },
});
