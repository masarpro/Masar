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
// 1. أنشطة المشروع ونسب التقدم
// ──────────────────────────────────────────
registerTool({
  name: "getProjectActivities",
  description:
    'أنشطة المشروع التنفيذية مع نسب التقدم والمدة — يجيب على "في أي مرحلة المشروع" أو "وش الأنشطة المتأخرة"',
  moduleId: "execution",
  parameters: z.object({
    projectId: z.string().describe("معرّف المشروع"),
    status: z
      .enum([
        "NOT_STARTED",
        "IN_PROGRESS",
        "COMPLETED",
        "DELAYED",
        "ON_HOLD",
        "CANCELLED",
      ])
      .optional(),
    onlyCritical: z
      .boolean()
      .default(false)
      .describe("عرض أنشطة المسار الحرج فقط"),
  }),
  execute: async (params, context) => {
    try {
      const activities = await db.projectActivity.findMany({
        where: {
          projectId: params.projectId,
          project: { organizationId: context.organizationId },
          ...(params.status && { status: params.status }),
          ...(params.onlyCritical && { isCritical: true }),
        },
        select: {
          id: true,
          title: true,
          status: true,
          progress: true,
          plannedStart: true,
          plannedEnd: true,
          actualStart: true,
          actualEnd: true,
          duration: true,
          isCritical: true,
        },
        orderBy: { plannedStart: "asc" },
      });

      const now = new Date();
      const delayed = activities.filter(
        (a) =>
          a.status !== "COMPLETED" &&
          a.status !== "CANCELLED" &&
          a.plannedEnd &&
          new Date(a.plannedEnd) < now,
      );

      const completed = activities.filter((a) => a.status === "COMPLETED");
      const inProgress = activities.filter((a) => a.status === "IN_PROGRESS");
      const overallProgress =
        activities.length > 0
          ? (
              activities.reduce((sum, a) => sum + toNum(a.progress), 0) /
              activities.length
            ).toFixed(1)
          : "0";

      return {
        activities: activities.map((a) => ({
          ...a,
          progress: toNum(a.progress) + "%",
          isDelayed: delayed.some((d) => d.id === a.id),
        })),
        summary: {
          total: activities.length,
          completed: completed.length,
          inProgress: inProgress.length,
          delayed: delayed.length,
          notStarted: activities.filter((a) => a.status === "NOT_STARTED")
            .length,
          overallProgress: overallProgress + "%",
          criticalCount: activities.filter((a) => a.isCritical).length,
        },
      };
    } catch (e) {
      return { error: `فشل جلب الأنشطة: ${(e as Error).message}` };
    }
  },
});

// ──────────────────────────────────────────
// 2. معالم المشروع (Milestones)
// ──────────────────────────────────────────
registerTool({
  name: "getProjectMilestones",
  description:
    'معالم المشروع الزمنية — المخطط مقابل الفعلي، التأخيرات. يجيب على "هل المشروع متأخر" أو "متى موعد التسليم"',
  moduleId: "execution",
  parameters: z.object({
    projectId: z.string().describe("معرّف المشروع"),
    status: z
      .enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "DELAYED", "CANCELLED"])
      .optional(),
  }),
  execute: async (params, context) => {
    try {
      const milestones = await db.projectMilestone.findMany({
        where: {
          projectId: params.projectId,
          project: { organizationId: context.organizationId },
          ...(params.status && { status: params.status }),
        },
        select: {
          id: true,
          title: true,
          status: true,
          progress: true,
          plannedStart: true,
          plannedEnd: true,
          actualStart: true,
          actualEnd: true,
          orderIndex: true,
          isCritical: true,
          weight: true,
        },
        orderBy: { orderIndex: "asc" },
      });

      const now = new Date();
      return {
        milestones: milestones.map((m) => {
          const planned = m.plannedEnd ? new Date(m.plannedEnd) : null;
          const actual = m.actualEnd ? new Date(m.actualEnd) : null;
          let delayDays = 0;

          if (planned && actual) {
            delayDays = Math.ceil(
              (actual.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24),
            );
          } else if (
            planned &&
            !actual &&
            m.status !== "COMPLETED" &&
            planned < now
          ) {
            delayDays = Math.ceil(
              (now.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24),
            );
          }

          return {
            ...m,
            progress: toNum(m.progress) + "%",
            weight: toNum(m.weight) + "%",
            delayDays,
            isDelayed: delayDays > 0,
          };
        }),
        summary: {
          total: milestones.length,
          completed: milestones.filter((m) => m.status === "COMPLETED").length,
          delayed: milestones.filter((m) => m.status === "DELAYED").length,
          upcoming: milestones.filter(
            (m) =>
              m.status === "PLANNED" &&
              m.plannedEnd &&
              new Date(m.plannedEnd) > now,
          ).length,
        },
      };
    } catch (e) {
      return { error: `فشل جلب المعالم: ${(e as Error).message}` };
    }
  },
});

// ──────────────────────────────────────────
// 3. تحليل التأخير
// ──────────────────────────────────────────
registerTool({
  name: "getDelayAnalysis",
  description:
    'تحليل تأخيرات المشروع — الأنشطة المتأخرة، أيام التأخير، التأثير على المسار الحرج. يجيب على "هل يوجد تأخير" أو "كم يوم متأخرين"',
  moduleId: "execution",
  parameters: z.object({
    projectId: z.string().describe("معرّف المشروع"),
  }),
  execute: async (params, context) => {
    try {
      const now = new Date();

      const delayedActivities = await db.projectActivity.findMany({
        where: {
          projectId: params.projectId,
          project: { organizationId: context.organizationId },
          status: { in: ["NOT_STARTED", "IN_PROGRESS", "DELAYED"] },
          plannedEnd: { lt: now },
        },
        select: {
          title: true,
          status: true,
          progress: true,
          plannedStart: true,
          plannedEnd: true,
          isCritical: true,
        },
        orderBy: { plannedEnd: "asc" },
      });

      const openIssues = await db.projectIssue.findMany({
        where: {
          projectId: params.projectId,
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
        select: {
          title: true,
          severity: true,
          status: true,
          createdAt: true,
        },
        orderBy: { severity: "desc" },
        take: 10,
      });

      const allActivities = await db.projectActivity.count({
        where: { projectId: params.projectId },
      });
      const completedActivities = await db.projectActivity.count({
        where: { projectId: params.projectId, status: "COMPLETED" },
      });

      const maxDelay = delayedActivities.reduce((max, a) => {
        const days = a.plannedEnd
          ? Math.ceil(
              (now.getTime() - new Date(a.plannedEnd).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;
        return Math.max(max, days);
      }, 0);

      return {
        delayedActivities: delayedActivities.map((a) => ({
          ...a,
          progress: toNum(a.progress) + "%",
          delayDays: a.plannedEnd
            ? Math.ceil(
                (now.getTime() - new Date(a.plannedEnd).getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : 0,
        })),
        openIssues,
        summary: {
          totalActivities: allActivities,
          completedActivities,
          delayedCount: delayedActivities.length,
          criticalDelayed: delayedActivities.filter((a) => a.isCritical)
            .length,
          maxDelayDays: maxDelay,
          openIssuesCount: openIssues.length,
          criticalIssues: openIssues.filter((i) => i.severity === "CRITICAL")
            .length,
          healthStatus:
            delayedActivities.filter((a) => a.isCritical).length > 0
              ? "AT_RISK"
              : delayedActivities.length > 0
                ? "WARNING"
                : "ON_TRACK",
        },
      };
    } catch (e) {
      return { error: `فشل تحليل التأخير: ${(e as Error).message}` };
    }
  },
});
