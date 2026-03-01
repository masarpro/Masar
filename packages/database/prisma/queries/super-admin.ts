import { db } from "../client";
import type { OrgStatus, PlanType, Prisma } from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Super Admin Queries — استعلامات المشرف العام
// ═══════════════════════════════════════════════════════════════════════════

export async function getSuperAdminDashboardStats() {
	const [
		totalOrgs,
		activeOrgs,
		trialingOrgs,
		suspendedOrgs,
		pastDueOrgs,
		totalUsers,
		planDistribution,
	] = await Promise.all([
		db.organization.count(),
		db.organization.count({ where: { status: "ACTIVE" } }),
		db.organization.count({ where: { status: "TRIALING" } }),
		db.organization.count({ where: { status: "SUSPENDED" } }),
		db.organization.count({ where: { status: "PAST_DUE" } }),
		db.user.count(),
		db.organization.groupBy({
			by: ["plan"],
			_count: { id: true },
		}),
	]);

	return {
		totalOrgs,
		activeOrgs,
		trialingOrgs,
		suspendedOrgs,
		pastDueOrgs,
		totalUsers,
		planDistribution: planDistribution.map((p) => ({
			plan: p.plan,
			count: p._count.id,
		})),
	};
}

export async function calculateMRR() {
	const result = await db.organization.aggregate({
		where: {
			subscriptionStatus: "ACTIVE",
			lastPaymentAmount: { not: null },
		},
		_sum: { lastPaymentAmount: true },
	});
	return Number(result._sum.lastPaymentAmount ?? 0);
}

export async function getMrrTrend(months: number = 6) {
	const events = await db.subscriptionEvent.findMany({
		where: {
			eventType: { in: ["invoice.paid"] },
			processedAt: {
				gte: new Date(
					new Date().setMonth(new Date().getMonth() - months),
				),
			},
		},
		select: {
			processedAt: true,
			data: true,
		},
		orderBy: { processedAt: "asc" },
	});

	const monthlyData: Record<string, number> = {};
	for (const event of events) {
		const month = event.processedAt.toISOString().slice(0, 7); // YYYY-MM
		const amount =
			typeof event.data === "object" &&
			event.data !== null &&
			"amount_paid" in event.data
				? Number(event.data.amount_paid) / 100
				: 0;
		monthlyData[month] = (monthlyData[month] ?? 0) + amount;
	}

	return Object.entries(monthlyData).map(([month, amount]) => ({
		month,
		amount,
	}));
}

export async function getChurnRate(monthsBack: number = 1) {
	const startDate = new Date();
	startDate.setMonth(startDate.getMonth() - monthsBack);
	const endDate = new Date();
	startDate.setDate(1);
	startDate.setHours(0, 0, 0, 0);

	const activeAtStart = await db.organization.count({
		where: {
			createdAt: { lt: startDate },
			status: { in: ["ACTIVE", "TRIALING"] },
		},
	});

	const cancelledInPeriod = await db.subscriptionEvent.count({
		where: {
			eventType: "customer.subscription.deleted",
			processedAt: { gte: startDate, lte: endDate },
		},
	});

	return {
		activeAtStart,
		cancelledInPeriod,
		churnRate: activeAtStart > 0 ? cancelledInPeriod / activeAtStart : 0,
	};
}

export async function getNewOrgsTrend(months: number = 6) {
	const startDate = new Date();
	startDate.setMonth(startDate.getMonth() - months);

	const orgs = await db.organization.findMany({
		where: { createdAt: { gte: startDate } },
		select: { createdAt: true },
		orderBy: { createdAt: "asc" },
	});

	const monthlyData: Record<string, number> = {};
	for (const org of orgs) {
		const month = org.createdAt.toISOString().slice(0, 7);
		monthlyData[month] = (monthlyData[month] ?? 0) + 1;
	}

	return Object.entries(monthlyData).map(([month, count]) => ({
		month,
		count,
	}));
}

export async function getSuperAdminOrganizations(params: {
	query?: string;
	limit: number;
	offset: number;
	status?: OrgStatus;
	plan?: PlanType;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}) {
	const where: Prisma.OrganizationWhereInput = {};

	if (params.query) {
		where.OR = [
			{ name: { contains: params.query, mode: "insensitive" } },
			{ slug: { contains: params.query, mode: "insensitive" } },
		];
	}
	if (params.status) where.status = params.status;
	if (params.plan) where.plan = params.plan;

	const orderBy: Prisma.OrganizationOrderByWithRelationInput =
		params.sortBy === "name"
			? { name: params.sortOrder ?? "asc" }
			: params.sortBy === "plan"
				? { plan: params.sortOrder ?? "asc" }
				: { createdAt: params.sortOrder ?? "desc" };

	return db.organization.findMany({
		where,
		take: params.limit,
		skip: params.offset,
		orderBy,
		select: {
			id: true,
			name: true,
			slug: true,
			logo: true,
			createdAt: true,
			status: true,
			plan: true,
			planName: true,
			subscriptionStatus: true,
			maxUsers: true,
			maxProjects: true,
			lastPaymentAt: true,
			lastPaymentAmount: true,
			isFreeOverride: true,
			trialEndsAt: true,
			currentPeriodEnd: true,
			owner: {
				select: { id: true, name: true, email: true },
			},
			_count: {
				select: {
					members: true,
					projects: true,
				},
			},
		},
	});
}

export async function countSuperAdminOrganizations(params: {
	query?: string;
	status?: OrgStatus;
	plan?: PlanType;
}) {
	const where: Prisma.OrganizationWhereInput = {};

	if (params.query) {
		where.OR = [
			{ name: { contains: params.query, mode: "insensitive" } },
			{ slug: { contains: params.query, mode: "insensitive" } },
		];
	}
	if (params.status) where.status = params.status;
	if (params.plan) where.plan = params.plan;

	return db.organization.count({ where });
}

export async function getSuperAdminOrgDetail(orgId: string) {
	return db.organization.findUnique({
		where: { id: orgId },
		include: {
			owner: {
				select: { id: true, name: true, email: true, image: true },
			},
			_count: {
				select: { members: true, projects: true },
			},
			subscriptionEvents: {
				take: 20,
				orderBy: { processedAt: "desc" },
			},
			superAdminLogs: {
				take: 20,
				orderBy: { createdAt: "desc" },
				include: {
					admin: { select: { id: true, name: true, email: true } },
				},
			},
		},
	});
}

export async function getSuperAdminLogs(params: {
	limit: number;
	offset: number;
	adminId?: string;
	action?: string;
	targetOrgId?: string;
}) {
	const where: Prisma.SuperAdminLogWhereInput = {};
	if (params.adminId) where.adminId = params.adminId;
	if (params.action) where.action = params.action;
	if (params.targetOrgId) where.targetOrgId = params.targetOrgId;

	return db.superAdminLog.findMany({
		where,
		take: params.limit,
		skip: params.offset,
		orderBy: { createdAt: "desc" },
		include: {
			admin: { select: { id: true, name: true, email: true } },
			targetOrg: { select: { id: true, name: true, slug: true } },
		},
	});
}

export async function countSuperAdminLogs(params: {
	adminId?: string;
	action?: string;
	targetOrgId?: string;
}) {
	const where: Prisma.SuperAdminLogWhereInput = {};
	if (params.adminId) where.adminId = params.adminId;
	if (params.action) where.action = params.action;
	if (params.targetOrgId) where.targetOrgId = params.targetOrgId;

	return db.superAdminLog.count({ where });
}

export function logSuperAdminAction(params: {
	adminId: string;
	action: string;
	targetType: string;
	targetId: string;
	targetOrgId?: string;
	details?: Record<string, unknown>;
	ipAddress?: string;
}): void {
	db.superAdminLog
		.create({
			data: {
				adminId: params.adminId,
				action: params.action,
				targetType: params.targetType,
				targetId: params.targetId,
				targetOrgId: params.targetOrgId ?? null,
				details: (params.details ?? undefined) as
					| Prisma.InputJsonValue
					| undefined,
				ipAddress: params.ipAddress ?? null,
			},
		})
		.catch((error) => {
			console.error("[SUPER_ADMIN_LOG] Failed to log action:", {
				action: params.action,
				targetType: params.targetType,
				targetId: params.targetId,
				error,
			});
		});
}

export async function getRevenueSummary() {
	const [totalRevenue, activeSubscriptions] = await Promise.all([
		db.subscriptionEvent.findMany({
			where: { eventType: "invoice.paid" },
			select: { data: true },
		}),
		db.organization.count({
			where: { subscriptionStatus: "ACTIVE" },
		}),
	]);

	const total = totalRevenue.reduce((sum, event) => {
		const amount =
			typeof event.data === "object" &&
			event.data !== null &&
			"amount_paid" in event.data
				? Number(event.data.amount_paid) / 100
				: 0;
		return sum + amount;
	}, 0);

	const mrr = await calculateMRR();

	return {
		totalRevenue: total,
		mrr,
		arr: mrr * 12,
		activeSubscriptions,
	};
}

export async function getRevenueByPlan() {
	const orgs = await db.organization.groupBy({
		by: ["plan"],
		where: { lastPaymentAmount: { not: null } },
		_sum: { lastPaymentAmount: true },
		_count: { id: true },
	});

	return orgs.map((o) => ({
		plan: o.plan,
		revenue: Number(o._sum.lastPaymentAmount ?? 0),
		count: o._count.id,
	}));
}

export async function getSubscriptionsByStatus() {
	const groups = await db.organization.groupBy({
		by: ["subscriptionStatus"],
		_count: { id: true },
	});

	return groups.map((g) => ({
		status: g.subscriptionStatus,
		count: g._count.id,
	}));
}

export async function getOrgPaymentHistory(orgId: string) {
	return db.subscriptionEvent.findMany({
		where: { organizationId: orgId },
		orderBy: { processedAt: "desc" },
		take: 50,
	});
}

export async function getSuperAdminOrgMembers(orgId: string) {
	return db.member.findMany({
		where: { organizationId: orgId },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					createdAt: true,
				},
			},
		},
		orderBy: { createdAt: "asc" },
	});
}

export async function getSuperAdminOrgProjects(orgId: string) {
	return db.project.findMany({
		where: { organizationId: orgId },
		select: {
			id: true,
			name: true,
			status: true,
			createdAt: true,
			_count: {
				select: { members: true },
			},
		},
		orderBy: { createdAt: "desc" },
	});
}
