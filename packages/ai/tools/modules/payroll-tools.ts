import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

registerTool({
  name: "queryPayroll",
  description:
    'دورات الرواتب — يعرض الشهر/السنة، الإجماليات، الحالة. يجيب "كم دفعنا رواتب الشهر الفلاني" أو "حالة آخر دورة رواتب".',
  moduleId: "company",
  parameters: z.object({
    status: z
      .enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "PAID", "CANCELLED"])
      .optional(),
    year: z.number().optional(),
    month: z.number().min(1).max(12).optional(),
    limit: z.number().min(1).max(24).default(12),
  }),
  execute: async (params, context) => {
    try {
      const where: any = { organizationId: context.organizationId };
      if (params.status) where.status = params.status;
      if (params.year) where.year = params.year;
      if (params.month) where.month = params.month;

      const runs = await db.payrollRun.findMany({
        where,
        take: params.limit,
        orderBy: [{ year: "desc" }, { month: "desc" }],
        select: {
          id: true,
          runNo: true,
          month: true,
          year: true,
          status: true,
          totalBaseSalary: true,
          totalAllowances: true,
          totalDeductions: true,
          totalNetSalary: true,
          employeeCount: true,
          approvedAt: true,
        },
      });
      return {
        runs: runs.map((r) => ({
          ...r,
          totalBaseSalary: Number(r.totalBaseSalary),
          totalAllowances: Number(r.totalAllowances),
          totalDeductions: Number(r.totalDeductions),
          totalNetSalary: Number(r.totalNetSalary),
        })),
        total: runs.length,
      };
    } catch (e) {
      return { error: `فشل استعلام دورات الرواتب: ${(e as Error).message}` };
    }
  },
});
