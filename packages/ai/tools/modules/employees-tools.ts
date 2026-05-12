import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

registerTool({
  name: "queryEmployees",
  description:
    'قائمة الموظفين مع الحالة والراتب. action=list: قائمة الموظفين. action=summary: إجمالي عدد الموظفين والرواتب. يجيب "كم موظف عندي" أو "إجمالي الرواتب الشهرية".',
  moduleId: "company",
  parameters: z.object({
    action: z.enum(["list", "summary"]).default("list"),
    status: z
      .enum(["ACTIVE", "ON_LEAVE", "TERMINATED", "SUSPENDED"])
      .optional(),
    type: z.string().optional().describe("المسمى الوظيفي"),
    search: z.string().optional(),
    limit: z.number().min(1).max(50).default(20),
  }),
  execute: async (params, context) => {
    try {
      const where: any = { organizationId: context.organizationId };
      if (params.status) where.status = params.status;
      if (params.type) where.type = params.type as any;
      if (params.search) {
        where.OR = [
          {
            name: {
              contains: params.search,
              mode: "insensitive" as const,
            },
          },
          {
            employeeNo: {
              contains: params.search,
              mode: "insensitive" as const,
            },
          },
        ];
      }

      if (params.action === "summary") {
        const [counts, totals] = await Promise.all([
          db.employee.groupBy({
            by: ["status"],
            where: { organizationId: context.organizationId },
            _count: { id: true },
          }),
          db.employee.aggregate({
            where: {
              organizationId: context.organizationId,
              status: "ACTIVE",
            },
            _sum: {
              baseSalary: true,
              housingAllowance: true,
              transportAllowance: true,
              otherAllowances: true,
            },
            _count: { id: true },
          }),
        ]);
        const baseSum = Number(totals._sum.baseSalary ?? 0);
        const allowances =
          Number(totals._sum.housingAllowance ?? 0) +
          Number(totals._sum.transportAllowance ?? 0) +
          Number(totals._sum.otherAllowances ?? 0);
        return {
          byStatus: counts.map((c) => ({
            status: c.status,
            count: c._count.id,
          })),
          activeCount: totals._count.id,
          monthlyPayroll: {
            baseSalaries: baseSum,
            allowances,
            grossTotal: baseSum + allowances,
          },
        };
      }

      const employees = await db.employee.findMany({
        where,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          employeeNo: true,
          type: true,
          phone: true,
          baseSalary: true,
          housingAllowance: true,
          transportAllowance: true,
          otherAllowances: true,
          status: true,
          joinDate: true,
        },
      });
      return {
        employees: employees.map((e) => ({
          ...e,
          baseSalary: Number(e.baseSalary),
          housingAllowance: Number(e.housingAllowance),
          transportAllowance: Number(e.transportAllowance),
          otherAllowances: Number(e.otherAllowances),
          totalSalary:
            Number(e.baseSalary) +
            Number(e.housingAllowance) +
            Number(e.transportAllowance) +
            Number(e.otherAllowances),
        })),
        total: employees.length,
      };
    } catch (e) {
      return { error: `فشل استعلام الموظفين: ${(e as Error).message}` };
    }
  },
});
