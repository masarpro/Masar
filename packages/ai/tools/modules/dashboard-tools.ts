import { z } from "zod";
import { registerTool } from "../registry";
import {
  getDashboardStats,
  getFinanceDashboardStats,
  getOrganizationBalancesSummary,
} from "@repo/database";
import {
  createEmptyPermissions,
  hasPermission,
} from "@repo/database/prisma/permissions";
import { permissionDeniedResult } from "../../lib/tool-permissions";

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
      // تركيب مصفّى بالصلاحيات: المشاريع مع projects.view،
      // الجزء المالي (قيمة العقود/المصروفات) مع finance.view فقط
      const perms = context.permissions ?? createEmptyPermissions();
      const canProjects = hasPermission(perms, "projects", "view");
      const canFinance = hasPermission(perms, "finance", "view");
      if (!canProjects && !canFinance) {
        return permissionDeniedResult();
      }

      const stats = await getDashboardStats(context.organizationId);
      const result: Record<string, unknown> = {};
      if (canProjects) {
        result.projects = stats.projects;
        result.milestones = stats.milestones;
      }
      if (canFinance) {
        result.financials = {
          totalContractValue: toNum(stats.financials.totalContractValue),
          totalExpenses: toNum(stats.financials.totalExpenses),
        };
      }
      return result;
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
