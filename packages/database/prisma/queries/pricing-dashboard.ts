import { db } from "../client";

// ═══════════════════════════════════════════════════════════════════════════
// PRICING DASHBOARD - لوحة التسعير
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get pricing dashboard stats for an organization
 */
export async function getPricingDashboardStats(organizationId: string) {
	const now = new Date();
	const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

	const [
		// Study counts
		totalStudies,
		draftStudies,
		inProgressStudies,
		approvedStudies,
		studiesTotalValue,
		recentStudies,
		convertedStudies,

		// Quotation counts
		totalQuotations,
		draftQuotations,
		sentQuotations,
		viewedQuotations,
		acceptedQuotations,
		rejectedQuotations,
		expiredQuotations,
		convertedQuotations,
		quotationsTotalValue,
		activeQuotationsValue,
		expiringQuotations,
		recentQuotations,

		// Lead counts
		totalLeads,
		leadsByStatus,
		leadsOpenValue,

		// Clients
		totalClients,
	] = await Promise.all([
		// ── Studies ──
		db.costStudy.count({ where: { organizationId } }),
		db.costStudy.count({ where: { organizationId, status: "draft" } }),
		db.costStudy.count({ where: { organizationId, status: "in_review" } }),
		db.costStudy.count({ where: { organizationId, status: "approved" } }),
		db.costStudy.aggregate({
			where: { organizationId },
			_sum: { totalCost: true },
		}),
		db.costStudy.findMany({
			where: { organizationId },
			select: {
				id: true,
				name: true,
				customerName: true,
				totalCost: true,
				status: true,
				updatedAt: true,
			},
			orderBy: { updatedAt: "desc" },
			take: 5,
		}),
		db.costStudy.count({
			where: { organizationId, convertedProjectId: { not: null } },
		}),

		// ── Quotations ──
		db.quotation.count({ where: { organizationId } }),
		db.quotation.count({ where: { organizationId, status: "DRAFT" } }),
		db.quotation.count({ where: { organizationId, status: "SENT" } }),
		db.quotation.count({ where: { organizationId, status: "VIEWED" } }),
		db.quotation.count({ where: { organizationId, status: "ACCEPTED" } }),
		db.quotation.count({ where: { organizationId, status: "REJECTED" } }),
		db.quotation.count({ where: { organizationId, status: "EXPIRED" } }),
		db.quotation.count({ where: { organizationId, status: "CONVERTED" } }),
		db.quotation.aggregate({
			where: { organizationId },
			_sum: { totalAmount: true },
		}),
		db.quotation.aggregate({
			where: {
				organizationId,
				status: { in: ["SENT", "VIEWED"] },
			},
			_sum: { totalAmount: true },
		}),
		db.quotation.findMany({
			where: {
				organizationId,
				status: { in: ["SENT", "VIEWED"] },
				validUntil: { lte: sevenDaysFromNow, gte: now },
			},
			select: {
				id: true,
				quotationNo: true,
				clientName: true,
				validUntil: true,
				totalAmount: true,
			},
			orderBy: { validUntil: "asc" },
			take: 5,
		}),
		db.quotation.findMany({
			where: { organizationId },
			select: {
				id: true,
				quotationNo: true,
				clientName: true,
				clientCompany: true,
				status: true,
				totalAmount: true,
				createdAt: true,
			},
			orderBy: { createdAt: "desc" },
			take: 5,
		}),

		// ── Leads ──
		db.lead.count({ where: { organizationId } }),
		db.lead.groupBy({
			by: ["status"],
			where: { organizationId },
			_count: { id: true },
		}),
		db.lead.aggregate({
			where: {
				organizationId,
				status: { in: ["NEW", "STUDYING", "QUOTED", "NEGOTIATING"] },
			},
			_sum: { estimatedValue: true },
		}),

		// ── Clients ──
		db.client.count({ where: { organizationId, isActive: true } }),
	]);

	// Process lead status counts
	const leadStatusMap: Record<string, number> = {};
	for (const item of leadsByStatus) {
		leadStatusMap[item.status] = item._count.id;
	}

	// Calculate quotation conversion rate
	const conversionRate =
		totalQuotations > 0
			? ((acceptedQuotations + convertedQuotations) / totalQuotations) * 100
			: 0;

	// Merge recent documents (studies + quotations)
	const recentDocuments = [
		...recentStudies.map((s) => ({
			id: s.id,
			type: "study" as const,
			title: s.name ?? "دراسة بدون عنوان",
			clientName: s.customerName ?? "",
			amount: Number(s.totalCost),
			status: s.status,
			createdAt: s.updatedAt,
		})),
		...recentQuotations.map((q) => ({
			id: q.id,
			type: "quotation" as const,
			title: q.quotationNo,
			clientName: q.clientName,
			amount: Number(q.totalAmount),
			status: q.status,
			createdAt: q.createdAt,
		})),
	]
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, 10);

	// Count leads won
	const leadsWon = leadStatusMap.WON ?? 0;

	return {
		studies: {
			total: totalStudies,
			draft: draftStudies,
			inProgress: inProgressStudies,
			approved: approvedStudies,
			totalValue: Number(studiesTotalValue._sum.totalCost ?? 0),
		},
		quotations: {
			total: totalQuotations,
			draft: draftQuotations,
			sent: sentQuotations,
			viewed: viewedQuotations,
			accepted: acceptedQuotations,
			rejected: rejectedQuotations,
			expired: expiredQuotations,
			converted: convertedQuotations,
			totalValue: Number(quotationsTotalValue._sum.totalAmount ?? 0),
			activeValue: Number(activeQuotationsValue._sum.totalAmount ?? 0),
			conversionRate: Math.round(conversionRate * 10) / 10,
			expiringCount: expiringQuotations.length,
		},
		leads: {
			total: totalLeads,
			byStatus: leadStatusMap,
			openEstimatedValue: Number(leadsOpenValue._sum.estimatedValue ?? 0),
		},
		clients: {
			total: totalClients,
		},
		pipeline: {
			studies: totalStudies,
			quotationsSent: sentQuotations + viewedQuotations,
			leadsWon,
			contracted: convertedStudies,
		},
		recentDocuments,
		expiringQuotations: expiringQuotations.map((q) => ({
			id: q.id,
			quotationNo: q.quotationNo,
			clientName: q.clientName,
			validUntil: q.validUntil,
			totalAmount: Number(q.totalAmount),
		})),
	};
}
