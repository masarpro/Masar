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
// 1. تفاصيل مشروع واحد شاملة
// ──────────────────────────────────────────
registerTool({
  name: "getProjectDetails",
  description:
    "تفاصيل مشروع كاملة — العقد، الفريق، التقدم، المالية، المشاكل الميدانية. استخدمها لما المستخدم يسأل عن مشروع محدد",
  moduleId: "projects",
  parameters: z.object({
    projectId: z.string().describe("معرّف المشروع"),
  }),
  execute: async (params, context) => {
    try {
      const project = await db.project.findFirst({
        where: {
          id: params.projectId,
          organizationId: context.organizationId,
        },
        include: {
          contract: {
            select: {
              contractNo: true,
              value: true,
              startDate: true,
              endDate: true,
              retentionPercent: true,
              vatPercent: true,
              status: true,
            },
          },
          members: {
            select: {
              role: true,
              user: { select: { name: true, email: true } },
            },
          },
          _count: {
            select: {
              expenses: true,
              claims: true,
              documents: true,
              activities: true,
              milestones: true,
              issues: true,
              photos: true,
              dailyReports: true,
              subcontractContracts: true,
            },
          },
        },
      });

      if (!project) return { error: "المشروع غير موجود" };

      // Cast to any because include adds relations not in the base type
      const p = project as any;

      const latestProgress = await db.projectProgressUpdate.findFirst({
        where: { projectId: params.projectId },
        orderBy: { createdAt: "desc" },
        select: { progress: true, note: true, createdAt: true },
      });

      const openIssues = await db.projectIssue.findMany({
        where: {
          projectId: params.projectId,
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
        select: { title: true, severity: true, status: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      });

      return {
        project: {
          name: p.name,
          type: p.type,
          status: p.status,
          location: p.location,
          progress: toNum(p.progress) + "%",
          contractValue: toNum(p.contractValue).toFixed(2),
          clientName: p.clientName,
          startDate: p.startDate,
          endDate: p.endDate,
        },
        contract: p.contract
          ? {
              ...p.contract,
              value: p.contract.value?.toString(),
              retentionPercent: p.contract.retentionPercent?.toString(),
            }
          : null,
        team: (p.members ?? []).map((m: any) => ({
          name: m.user?.name,
          role: m.role,
        })),
        counts: p._count,
        latestProgress: latestProgress
          ? {
              progress: toNum(latestProgress.progress) + "%",
              note: latestProgress.note,
              date: latestProgress.createdAt,
            }
          : null,
        openIssues,
      };
    } catch (e) {
      return { error: `فشل جلب تفاصيل المشروع: ${(e as Error).message}` };
    }
  },
});

// ──────────────────────────────────────────
// 2. ملخص مالي للمشروع
// ──────────────────────────────────────────
registerTool({
  name: "getProjectFinanceSummary",
  description:
    'ملخص مالي لمشروع — إجمالي المصروفات، المستخلصات، المدفوعات. يجيب على "كم صرفنا على المشروع" أو "كم ربحنا"',
  moduleId: "projects",
  parameters: z.object({
    projectId: z.string().describe("معرّف المشروع"),
  }),
  execute: async (params, context) => {
    try {
      const [expenses, claims, payments, contract] = await Promise.all([
        db.projectExpense.aggregate({
          where: {
            projectId: params.projectId,
            project: { organizationId: context.organizationId },
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
        db.projectClaim.aggregate({
          where: {
            projectId: params.projectId,
            project: { organizationId: context.organizationId },
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
        db.projectPayment.aggregate({
          where: {
            projectId: params.projectId,
            project: { organizationId: context.organizationId },
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
        db.projectContract.findFirst({
          where: {
            projectId: params.projectId,
            project: { organizationId: context.organizationId },
          },
          select: { value: true },
        }),
      ]);

      const contractValue = toNum(contract?.value);
      const totalExpenses = toNum(expenses._sum.amount);
      const totalClaims = toNum(claims._sum.amount);
      const totalPayments = toNum(payments._sum.amount);

      return {
        contractValue: contractValue.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        totalClaims: totalClaims.toFixed(2),
        totalPayments: totalPayments.toFixed(2),
        profit: (totalPayments - totalExpenses).toFixed(2),
        profitMargin:
          contractValue > 0
            ? (
                ((totalPayments - totalExpenses) / contractValue) *
                100
              ).toFixed(1) + "%"
            : "N/A",
        expensesCount: expenses._count.id,
        claimsCount: claims._count.id,
        paymentsCount: payments._count.id,
      };
    } catch (e) {
      return { error: `فشل جلب الملخص المالي: ${(e as Error).message}` };
    }
  },
});
