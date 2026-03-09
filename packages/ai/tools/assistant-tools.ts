import { tool } from "ai";
import { z } from "zod";
import {
  db,
  getOrganizationProjects,
  getProjectById,
  getProjectStats,
  getDashboardStats,
  getFinanceDashboardStats,
  getOverdueInvoices,
  getInvoiceStatsByStatus,
  getOrganizationExpenses,
  getOrganizationPayments,
  getOrganizationBankAccounts,
  getOrganizationBalancesSummary,
  getProjectDailyReports,
  getProjectIssues,
  getProjectProgressUpdates,
  listMilestones,
  getTimelineHealth,
  getOrganizationEmployees,
  getEmployeeSummary,
  getCompanyAssets,
  getAssetSummary,
  getCompanyExpenses,
  getCompanyExpenseSummary,
  getPayrollRuns,
  getPayrollSummary,
  getCompanyDashboardData,
} from "@repo/database";

export interface ToolContext {
  organizationId: string;
  userId: string;
  organizationSlug: string;
  locale: string;
}

function toNum(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "object" && "toNumber" in (val as object)) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val);
}

export function getAssistantTools(ctx: ToolContext) {
  return {
    // ===========================
    // Tool 1: queryProjects
    // ===========================
    queryProjects: tool({
      description:
        "استعلام المشاريع. action=list: قائمة المشاريع مع فلتر اختياري. action=details: تفاصيل مشروع محدد (يحتاج projectId). action=stats: إحصائيات عامة (عدد المشاريع حسب الحالة).",
      inputSchema: z.object({
        action: z.enum(["list", "details", "stats"]),
        projectId: z.string().optional(),
        status: z
          .enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"])
          .optional(),
        search: z.string().optional(),
      }),
      execute: async ({ action, projectId, status, search }) => {
        try {
          if (action === "list") {
            const result = await getOrganizationProjects(ctx.organizationId, {
              limit: 20,
              offset: 0,
              status: status ?? undefined,
              query: search ?? undefined,
            });
            return {
              projects: result.projects.map((p) => ({
                id: p.id,
                name: p.name,
                status: p.status,
                type: p.type,
                progress: toNum(p.progress),
                contractValue: toNum(p.contractValue),
                clientName: p.clientName,
                startDate: p.startDate,
                endDate: p.endDate,
              })),
              total: result.total,
            };
          }

          if (action === "details") {
            if (!projectId)
              return { error: "يرجى تحديد معرف المشروع (projectId)" };
            const project = await getProjectById(
              projectId,
              ctx.organizationId,
            );
            if (!project)
              return {
                error: "المشروع غير موجود أو لا تملك صلاحية الوصول",
              };
            return {
              project: {
                id: project.id,
                name: project.name,
                status: project.status,
                type: project.type,
                progress: toNum(project.progress),
                contractValue: toNum(project.contractValue),
                clientName: project.clientName,
                startDate: project.startDate,
                endDate: project.endDate,
                description: project.description,
                projectNo: project.projectNo,
              },
            };
          }

          if (action === "stats") {
            const stats = await getProjectStats(ctx.organizationId);
            return { stats };
          }

          return { error: "إجراء غير معروف" };
        } catch (e) {
          return { error: `فشل استعلام المشاريع: ${(e as Error).message}` };
        }
      },
    }),

    // ===========================
    // Tool 2: queryFinance
    // ===========================
    queryFinance: tool({
      description:
        "استعلام البيانات المالية للمنظمة. invoices: قائمة الفواتير. payments: المقبوضات. expenses: المصروفات. summary: ملخص مالي شامل (إجمالي فواتير/مقبوضات/مصروفات/أرصدة). banks: أرصدة الحسابات البنكية.",
      inputSchema: z.object({
        action: z.enum([
          "invoices",
          "payments",
          "expenses",
          "summary",
          "banks",
        ]),
        projectId: z.string().optional(),
        status: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().min(1).max(50).optional(),
      }),
      execute: async ({
        action,
        projectId,
        status,
        dateFrom,
        dateTo,
        limit,
      }) => {
        const take = limit ?? 20;
        try {
          if (action === "invoices") {
            const invoiceStats = await getInvoiceStatsByStatus(
              ctx.organizationId,
            );
            const overdueInvoices = await getOverdueInvoices(
              ctx.organizationId,
              take,
            );
            return {
              stats: invoiceStats.map((s) => ({
                status: s.status,
                count: s.count,
                totalValue: toNum(s.totalValue),
                paidValue: toNum(s.paidValue),
              })),
              overdueInvoices: overdueInvoices.map((inv) => ({
                id: inv.id,
                invoiceNo: inv.invoiceNo,
                clientName: inv.clientName,
                totalAmount: toNum(inv.totalAmount),
                paidAmount: toNum(inv.paidAmount),
                status: inv.status,
                dueDate: inv.dueDate,
              })),
            };
          }

          if (action === "payments") {
            const result = await getOrganizationPayments(
              ctx.organizationId,
              { limit: take, offset: 0 },
            );
            return {
              payments: result.payments.map((p) => ({
                id: p.id,
                paymentNo: p.paymentNo,
                amount: toNum(p.amount),
                date: p.date,
                clientName: p.clientName,
                paymentMethod: p.paymentMethod,
              })),
              total: result.total,
            };
          }

          if (action === "expenses") {
            const result = await getOrganizationExpenses(
              ctx.organizationId,
              {
                limit: take,
                offset: 0,
                status: (status as "PENDING" | "COMPLETED" | "CANCELLED") ?? undefined,
                projectId: projectId ?? undefined,
                dateFrom: dateFrom ? new Date(dateFrom) : undefined,
                dateTo: dateTo ? new Date(dateTo) : undefined,
              },
            );
            return {
              expenses: result.expenses.map((e) => ({
                id: e.id,
                expenseNo: e.expenseNo,
                amount: toNum(e.amount),
                category: e.category,
                vendorName: e.vendorName,
                status: e.status,
                date: e.date,
                description: e.description,
              })),
              total: result.total,
            };
          }

          if (action === "summary") {
            const [financeStats, balances, dashboard] = await Promise.all([
              getFinanceDashboardStats(ctx.organizationId),
              getOrganizationBalancesSummary(ctx.organizationId),
              getDashboardStats(ctx.organizationId),
            ]);
            return {
              invoices: {
                total: financeStats.invoices.total,
                draft: financeStats.invoices.draft,
                sent: financeStats.invoices.sent,
                paid: financeStats.invoices.paid,
                overdue: financeStats.invoices.overdue,
                totalValue: toNum(financeStats.invoices.totalValue),
                paidValue: toNum(financeStats.invoices.paidValue),
                outstandingValue: toNum(
                  financeStats.invoices.outstandingValue,
                ),
              },
              bankBalances: balances,
              financials: {
                totalContractValue: toNum(
                  dashboard.financials.totalContractValue,
                ),
                totalExpenses: toNum(dashboard.financials.totalExpenses),
              },
            };
          }

          if (action === "banks") {
            const result = await getOrganizationBankAccounts(
              ctx.organizationId,
              { limit: 50, offset: 0 },
            );
            return {
              banks: result.accounts.map((b) => ({
                id: b.id,
                name: b.name,
                bankName: b.bankName,
                accountType: b.accountType,
                balance: toNum(b.balance),
                currency: b.currency,
                isDefault: b.isDefault,
              })),
            };
          }

          return { error: "إجراء غير معروف" };
        } catch (e) {
          return {
            error: `فشل استعلام المالية: ${(e as Error).message}`,
          };
        }
      },
    }),

    // ===========================
    // Tool 3: queryExecution
    // ===========================
    queryExecution: tool({
      description:
        "استعلام بيانات التنفيذ الميداني لمشروع محدد. يحتاج projectId دائماً. phases: مراحل التنفيذ. dailyReports: آخر التقارير اليومية. issues: المشاكل (مع فلتر severity اختياري). progress: تحديثات التقدم. summary: ملخص شامل.",
      inputSchema: z.object({
        projectId: z.string(),
        action: z.enum([
          "phases",
          "dailyReports",
          "issues",
          "progress",
          "summary",
        ]),
        status: z.string().optional(),
        severity: z
          .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
          .optional(),
        limit: z.number().min(1).max(20).optional(),
      }),
      execute: async ({
        projectId,
        action,
        status,
        severity,
        limit,
      }) => {
        const take = limit ?? 10;
        try {
          // Verify project ownership
          const project = await db.project.findFirst({
            where: { id: projectId, organizationId: ctx.organizationId },
            select: { id: true, name: true, progress: true },
          });
          if (!project)
            return {
              error: "المشروع غير موجود أو لا تملك صلاحية الوصول",
            };

          if (action === "phases") {
            const { items: milestones } = await listMilestones(
              ctx.organizationId,
              projectId,
            );
            return {
              phases: milestones.map((m) => ({
                id: m.id,
                title: m.title,
                status: m.status,
                progress: toNum(m.progress),
                plannedStart: m.plannedStart,
                plannedEnd: m.plannedEnd,
                actualStart: m.actualStart,
                actualEnd: m.actualEnd,
              })),
            };
          }

          if (action === "dailyReports") {
            const result = await getProjectDailyReports(projectId, {
              limit: take,
              offset: 0,
            });
            return {
              reports: result.reports.map((r) => ({
                id: r.id,
                reportDate: r.reportDate,
                weather: r.weather,
                manpower: r.manpower,
                workDone: r.workDone,
                blockers: r.blockers,
              })),
              total: result.total,
            };
          }

          if (action === "issues") {
            const result = await getProjectIssues(projectId, {
              limit: take,
              offset: 0,
              status: (status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") ?? undefined,
              severity: severity ?? undefined,
            });
            return {
              issues: result.issues.map((i) => ({
                id: i.id,
                title: i.title,
                severity: i.severity,
                status: i.status,
                createdAt: i.createdAt,
              })),
              total: result.total,
            };
          }

          if (action === "progress") {
            const result = await getProjectProgressUpdates(projectId, {
              limit: take,
              offset: 0,
            });
            return {
              updates: result.updates.map((u) => ({
                id: u.id,
                progress: toNum(u.progress),
                note: u.note,
                createdAt: u.createdAt,
              })),
              total: result.total,
            };
          }

          if (action === "summary") {
            const [issues, reports, health] = await Promise.all([
              getProjectIssues(projectId, {
                limit: 1,
                offset: 0,
                status: "OPEN",
              }),
              getProjectDailyReports(projectId, {
                limit: 1,
                offset: 0,
              }),
              getTimelineHealth(ctx.organizationId, projectId),
            ]);
            return {
              projectName: project.name,
              progress: toNum(project.progress),
              openIssues: issues.total,
              totalReports: reports.total,
              timeline: health,
            };
          }

          return { error: "إجراء غير معروف" };
        } catch (e) {
          return {
            error: `فشل استعلام التنفيذ: ${(e as Error).message}`,
          };
        }
      },
    }),

    // ===========================
    // Tool 4: queryTimeline
    // ===========================
    queryTimeline: tool({
      description:
        "استعلام الجدول الزمني (Milestones) لمشروع محدد. all: كل المراحل. upcoming: القادمة. overdue: المتأخرة. completed: المكتملة.",
      inputSchema: z.object({
        projectId: z.string(),
        filter: z
          .enum(["all", "upcoming", "overdue", "completed"])
          .optional(),
      }),
      execute: async ({ projectId, filter }) => {
        try {
          const project = await db.project.findFirst({
            where: { id: projectId, organizationId: ctx.organizationId },
            select: { id: true },
          });
          if (!project)
            return {
              error: "المشروع غير موجود أو لا تملك صلاحية الوصول",
            };

          const [milestonesResult, health] = await Promise.all([
            listMilestones(ctx.organizationId, projectId),
            getTimelineHealth(ctx.organizationId, projectId),
          ]);

          const now = new Date();
          const filterFn = filter ?? "all";

          const filtered = milestonesResult.items.filter((m) => {
            if (filterFn === "all") return true;
            if (filterFn === "completed") return m.status === "COMPLETED";
            if (filterFn === "overdue") {
              return (
                m.status !== "COMPLETED" &&
                m.plannedEnd &&
                new Date(m.plannedEnd) < now
              );
            }
            if (filterFn === "upcoming") {
              return (
                m.status !== "COMPLETED" &&
                (!m.plannedEnd || new Date(m.plannedEnd) >= now)
              );
            }
            return true;
          });

          return {
            milestones: filtered.map((m) => ({
              id: m.id,
              title: m.title,
              status: m.status,
              progress: toNum(m.progress),
              plannedStart: m.plannedStart,
              plannedEnd: m.plannedEnd,
              actualStart: m.actualStart,
              actualEnd: m.actualEnd,
            })),
            total: milestonesResult.items.length,
            health,
          };
        } catch (e) {
          return {
            error: `فشل استعلام الجدول الزمني: ${(e as Error).message}`,
          };
        }
      },
    }),

    // ===========================
    // Tool 5: navigateTo
    // ===========================
    navigateTo: tool({
      description:
        "يرجع رابط URL للتنقل حسب الوصف المطلوب. مثلاً: 'إنشاء فاتورة' → '/app/{org}/finance/invoices/new'",
      inputSchema: z.object({
        destination: z.string(),
        projectId: z.string().optional(),
      }),
      execute: async ({ destination, projectId }) => {
        const base = `/app/${ctx.organizationSlug}`;
        const d = destination.toLowerCase();

        const projectPath = (sub: string) => {
          if (!projectId) return { url: null, message: "يرجى تحديد المشروع أولاً" };
          return { url: `${base}/projects/${projectId}${sub}`, label: destination };
        };

        // Finance
        if (/فاتورة.*جديد|new.*invoice|إنشاء.*فاتورة/.test(d))
          return { url: `${base}/finance/invoices/new`, label: "إنشاء فاتورة جديدة" };
        if (/فاتور|invoice/.test(d))
          return { url: `${base}/finance/invoices`, label: "الفواتير" };
        if (/مقبوض|payment|سند.*قبض/.test(d))
          return { url: `${base}/finance/payments`, label: "المقبوضات" };
        if (/مصروف.*مالي|expense/.test(d) && !/منشأة|شركة/.test(d))
          return { url: `${base}/finance/expenses`, label: "المصروفات" };
        if (/عميل|client/.test(d))
          return { url: `${base}/finance/clients`, label: "العملاء" };
        if (/بنك|bank|حساب.*بنكي/.test(d))
          return { url: `${base}/finance/banks`, label: "الحسابات البنكية" };
        if (/تقرير.*مالي|finance.*report/.test(d))
          return { url: `${base}/finance/reports`, label: "التقارير المالية" };
        if (/قالب.*فاتورة|template/.test(d))
          return { url: `${base}/finance/templates`, label: "قوالب الفواتير" };

        // Pricing
        if (/عرض.*سعر|quotation/.test(d))
          return { url: `${base}/pricing/quotations`, label: "عروض الأسعار" };
        if (/دراسة.*تكلفة|cost.*study/.test(d))
          return { url: `${base}/pricing/studies`, label: "دراسات التكلفة" };

        // Company
        if (/موظف|employee/.test(d))
          return { url: `${base}/company/employees`, label: "الموظفون" };
        if (/أصل|asset|معدات/.test(d))
          return { url: `${base}/company/assets`, label: "الأصول" };
        if (/رواتب|payroll/.test(d))
          return { url: `${base}/company/payroll`, label: "الرواتب" };
        if (/مصروف.*منشأة|مصروف.*شركة|company.*expense/.test(d))
          return { url: `${base}/company/expenses`, label: "مصروفات المنشأة" };

        // Settings
        if (/إعداد|setting/.test(d))
          return { url: `${base}/settings/general`, label: "الإعدادات" };
        if (/أعضاء|member/.test(d))
          return { url: `${base}/settings/members`, label: "الأعضاء" };
        if (/أدوار|role|صلاحي/.test(d))
          return { url: `${base}/settings/roles`, label: "الأدوار" };
        if (/اشتراك|billing|فوترة/.test(d))
          return { url: `${base}/settings/billing`, label: "الاشتراك" };
        if (/إشعار|notification/.test(d))
          return { url: `${base}/notifications`, label: "الإشعارات" };

        // Project sub-pages
        if (/تقرير.*يومي|daily.*report/.test(d)) return projectPath("/field/daily-reports");
        if (/مشكلة|issue/.test(d)) return projectPath("/field/issues");
        if (/تنفيذ|execution/.test(d)) return projectPath("/execution");
        if (/جدول.*زمني|timeline/.test(d)) return projectPath("/timeline");
        if (/مستند|document/.test(d)) return projectPath("/documents");
        if (/أمر.*تغيير|change.*order/.test(d)) return projectPath("/changes");
        if (/فريق|team/.test(d)) return projectPath("/team");
        if (/بوابة.*مالك|owner.*portal/.test(d)) return projectPath("/owner");
        if (/عقد.*باطن|subcontract/.test(d)) return projectPath("/finance/subcontracts");
        if (/محادث|chat/.test(d)) return projectPath("/chat");

        // Projects
        if (/مشروع.*جديد|new.*project|إنشاء.*مشروع/.test(d))
          return { url: `${base}/projects/new`, label: "إنشاء مشروع جديد" };
        if (/مشروع|project/.test(d))
          return { url: `${base}/projects`, label: "المشاريع" };

        // Dashboard
        if (/لوحة.*تحكم|dashboard|رئيسي/.test(d))
          return { url: base, label: "لوحة التحكم" };

        return { url: base, label: "الصفحة الرئيسية" };
      },
    }),

    // ===========================
    // Tool 6: queryCompany
    // ===========================
    queryCompany: tool({
      description:
        "استعلام بيانات إدارة المنشأة (الشركة). employees: قائمة الموظفين. assets: الأصول. expenses: مصروفات المنشأة الثابتة. payroll: آخر دورات الرواتب. summary: ملخص شامل.",
      inputSchema: z.object({
        action: z.enum([
          "employees",
          "assets",
          "expenses",
          "payroll",
          "summary",
        ]),
        status: z.string().optional(),
        limit: z.number().min(1).max(50).optional(),
      }),
      execute: async ({ action, status, limit }) => {
        const take = limit ?? 20;
        try {
          if (action === "employees") {
            const result = await getOrganizationEmployees(
              ctx.organizationId,
              {
                limit: take,
                offset: 0,
                status: (status as "ACTIVE" | "ON_LEAVE" | "TERMINATED") ?? undefined,
              },
            );
            return {
              employees: result.employees.map((e) => ({
                id: e.id,
                name: e.name,
                employeeNo: e.employeeNo,
                type: e.type,
                baseSalary: toNum(e.baseSalary),
                status: e.status,
              })),
              total: result.total,
            };
          }

          if (action === "assets") {
            const result = await getCompanyAssets(ctx.organizationId, {
              limit: take,
              offset: 0,
              status: (status as "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "RETIRED") ?? undefined,
            });
            return {
              assets: result.assets.map((a) => ({
                id: a.id,
                name: a.name,
                assetNo: a.assetNo,
                category: a.category,
                type: a.type,
                status: a.status,
                purchasePrice: toNum(a.purchasePrice),
              })),
              total: result.total,
            };
          }

          if (action === "expenses") {
            const result = await getCompanyExpenses(ctx.organizationId, {
              limit: take,
              offset: 0,
            });
            const summary = await getCompanyExpenseSummary(
              ctx.organizationId,
            );
            return {
              expenses: result.expenses.map((e) => ({
                id: e.id,
                name: e.name,
                category: e.category,
                amount: toNum(e.amount),
                recurrence: e.recurrence,
                isActive: e.isActive,
              })),
              total: result.total,
              monthlySummary: summary,
            };
          }

          if (action === "payroll") {
            const result = await getPayrollRuns(ctx.organizationId, {
              limit: 6,
              offset: 0,
            });
            return {
              runs: result.runs.map((r) => ({
                id: r.id,
                runNo: r.runNo,
                month: r.month,
                year: r.year,
                status: r.status,
                totalNetSalary: toNum(r.totalNetSalary),
                employeeCount: r.employeeCount,
              })),
              total: result.total,
            };
          }

          if (action === "summary") {
            const dashboard = await getCompanyDashboardData(
              ctx.organizationId,
            );
            return { summary: dashboard };
          }

          return { error: "إجراء غير معروف" };
        } catch (e) {
          return {
            error: `فشل استعلام المنشأة: ${(e as Error).message}`,
          };
        }
      },
    }),
  };
}
