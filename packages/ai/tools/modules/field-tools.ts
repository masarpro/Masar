import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

registerTool({
  name: "queryFieldExecution",
  description:
    "بيانات التنفيذ الميداني — التقارير اليومية، المشاكل، ملخص. يحتاج projectId.",
  moduleId: "field",
  parameters: z.object({
    projectId: z.string(),
    action: z.enum(["dailyReports", "issues", "summary"]),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
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

      if (params.action === "dailyReports") {
        const reports = await db.projectDailyReport.findMany({
          where: { projectId: params.projectId },
          take: params.limit,
          orderBy: { reportDate: "desc" },
          select: {
            id: true,
            reportDate: true,
            weather: true,
            manpower: true,
            workDone: true,
            blockers: true,
            createdAt: true,
          },
        });
        return { reports, total: reports.length };
      }

      if (params.action === "issues") {
        const whereClause: Record<string, unknown> = {
          projectId: params.projectId,
        };
        if (params.severity) whereClause.severity = params.severity;
        if (params.status) whereClause.status = params.status;

        const issues = await db.projectIssue.findMany({
          where: whereClause,
          take: params.limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            severity: true,
            status: true,
            createdAt: true,
          },
        });
        return { issues, total: issues.length };
      }

      if (params.action === "summary") {
        const [totalReports, openIssues, criticalIssues] = await Promise.all([
          db.projectDailyReport.count({
            where: { projectId: params.projectId },
          }),
          db.projectIssue.count({
            where: {
              projectId: params.projectId,
              status: { in: ["OPEN", "IN_PROGRESS"] },
            },
          }),
          db.projectIssue.count({
            where: {
              projectId: params.projectId,
              severity: "CRITICAL",
              status: { in: ["OPEN", "IN_PROGRESS"] },
            },
          }),
        ]);
        return { totalReports, openIssues, criticalIssues };
      }

      return { error: "إجراء غير معروف" };
    } catch (e) {
      return {
        error: `فشل استعلام التنفيذ الميداني: ${(e as Error).message}`,
      };
    }
  },
});
