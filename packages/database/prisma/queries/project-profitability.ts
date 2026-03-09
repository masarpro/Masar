import { db } from "../client";

// ═══════════════════════════════════════════════════════════════════════════
// Project Profitability Report Queries - تقرير ربحية المشروع
// ═══════════════════════════════════════════════════════════════════════════

export async function getProjectProfitabilityReport(
	organizationId: string,
	projectId: string,
	dateFrom?: Date,
	dateTo?: Date,
) {
	// Build date filter for time-bounded queries
	const dateFilter: { gte?: Date; lte?: Date } | undefined =
		dateFrom || dateTo
			? {
					...(dateFrom && { gte: dateFrom }),
					...(dateTo && { lte: dateTo }),
				}
			: undefined;

	const [
		project,
		projectContract,
		approvedChangeOrders,
		invoicesTotal,
		paymentsTotal,
		directExpenses,
		expensesByCategory,
		subcontracts,
		subcontractPaymentsTotal,
		companyAllocations,
	] = await Promise.all([
		// 1. Project basic info
		db.project.findFirst({
			where: { id: projectId, organizationId },
			select: {
				id: true,
				name: true,
				contractValue: true,
				status: true,
			},
		}),

		// 2. Project contract with retention info
		db.projectContract.findUnique({
			where: { projectId },
			select: {
				value: true,
				retentionPercent: true,
				retentionCap: true,
				retentionReleaseDays: true,
			},
		}),

		// 3. Approved change orders
		db.projectChangeOrder.findMany({
			where: {
				organizationId,
				projectId,
				status: { in: ["APPROVED", "IMPLEMENTED"] },
				costImpact: { not: null },
				...(dateFilter && { createdAt: dateFilter }),
			},
			select: {
				id: true,
				coNo: true,
				title: true,
				costImpact: true,
				status: true,
				createdAt: true,
			},
		}),

		// 4. Issued invoices total
		db.financeInvoice.aggregate({
			where: {
				organizationId,
				projectId,
				status: { notIn: ["DRAFT", "CANCELLED"] },
				...(dateFilter && { issueDate: dateFilter }),
			},
			_sum: { totalAmount: true, paidAmount: true },
			_count: true,
		}),

		// 5. Collected payments (ProjectPayment)
		db.projectPayment.aggregate({
			where: {
				organizationId,
				projectId,
				...(dateFilter && { date: dateFilter }),
			},
			_sum: { amount: true },
			_count: true,
		}),

		// 6. Direct project expenses (FinanceExpense)
		db.financeExpense.aggregate({
			where: {
				organizationId,
				projectId,
				status: "COMPLETED",
				...(dateFilter && { date: dateFilter }),
			},
			_sum: { amount: true },
			_count: true,
		}),

		// 7. Direct expenses by category
		db.financeExpense.groupBy({
			by: ["category"],
			where: {
				organizationId,
				projectId,
				status: "COMPLETED",
				...(dateFilter && { date: dateFilter }),
			},
			_sum: { amount: true },
			_count: true,
		}),

		// 8. Subcontract contracts for this project
		db.subcontractContract.findMany({
			where: { organizationId, projectId },
			select: {
				id: true,
				name: true,
				contractNo: true,
				value: true,
				status: true,
				_count: { select: { payments: true } },
			},
		}),

		// 9. Total subcontract payments
		db.subcontractPayment.aggregate({
			where: {
				organizationId,
				contract: { projectId },
				status: "COMPLETED",
				...(dateFilter && { date: dateFilter }),
			},
			_sum: { amount: true },
			_count: true,
		}),

		// 10. All company expense allocations to this project
		db.companyExpenseAllocation.findMany({
			where: {
				projectId,
				expense: {
					organizationId,
				},
			},
			include: {
				expense: {
					select: { amount: true, name: true, category: true },
				},
			},
		}),
	]);

	if (!project) {
		throw new Error("Project not found");
	}

	// === REVENUE CALCULATIONS ===
	const baseContractValue = projectContract
		? Number(projectContract.value)
		: Number(project.contractValue ?? 0);

	const changeOrdersTotal = approvedChangeOrders.reduce(
		(sum, co) => sum + Number(co.costImpact ?? 0),
		0,
	);
	const totalContractValue = baseContractValue + changeOrdersTotal;

	const invoicedTotal = invoicesTotal._sum.totalAmount
		? Number(invoicesTotal._sum.totalAmount)
		: 0;
	const invoicePaidTotal = invoicesTotal._sum.paidAmount
		? Number(invoicesTotal._sum.paidAmount)
		: 0;

	const collectedTotal = paymentsTotal._sum.amount
		? Number(paymentsTotal._sum.amount)
		: 0;

	const outstandingAmount = invoicedTotal - invoicePaidTotal;
	const collectionRate =
		invoicedTotal > 0 ? (collectedTotal / invoicedTotal) * 100 : 0;

	// === COST CALCULATIONS ===
	const directExpensesTotal = directExpenses._sum.amount
		? Number(directExpenses._sum.amount)
		: 0;

	const categoryBreakdown = expensesByCategory.map((group) => ({
		category: group.category,
		total: group._sum.amount ? Number(group._sum.amount) : 0,
		count: group._count,
	}));

	const subcontractContractValues = subcontracts.reduce(
		(sum, sc) => sum + Number(sc.value ?? 0),
		0,
	);
	const subcontractPaidTotal = subcontractPaymentsTotal._sum.amount
		? Number(subcontractPaymentsTotal._sum.amount)
		: 0;
	const subcontractRemaining = subcontractContractValues - subcontractPaidTotal;

	// Company expenses allocated to this project
	const distributedExpenses = companyAllocations.reduce((sum, alloc) => {
		const expenseAmount = Number(alloc.expense.amount ?? 0);
		const percentage = Number(alloc.percentage ?? 0);
		return sum + (expenseAmount * percentage) / 100;
	}, 0);

	// Labor costs are not separately tracked (no SALARY category in CompanyExpenseCategory)
	const laborCosts = 0;

	const totalCosts =
		directExpensesTotal +
		subcontractPaidTotal +
		laborCosts +
		distributedExpenses;

	// === PROFITABILITY ===
	const grossProfit = totalContractValue - totalCosts;
	const profitMargin =
		totalContractValue > 0 ? (grossProfit / totalContractValue) * 100 : 0;
	const realizedProfit = collectedTotal - totalCosts;

	// === RETENTION ===
	const retentionPercent = projectContract
		? Number(projectContract.retentionPercent ?? 0)
		: 0;
	const retentionAmount = totalContractValue * (retentionPercent / 100);
	// Retention released is approximated by payments above the non-retained portion
	const retentionCap = projectContract
		? Number(projectContract.retentionCap ?? 0)
		: 0;

	return {
		project: {
			id: project.id,
			name: project.name,
			status: project.status,
		},
		revenue: {
			baseContractValue,
			changeOrders: approvedChangeOrders.map((co) => ({
				id: co.id,
				coNo: co.coNo,
				title: co.title,
				amount: Number(co.costImpact ?? 0),
				status: co.status,
			})),
			changeOrdersTotal,
			totalContractValue,
			invoicedTotal,
			invoiceCount: invoicesTotal._count,
			collectedTotal,
			paymentCount: paymentsTotal._count,
			outstandingAmount,
			collectionRate: Math.round(collectionRate * 100) / 100,
		},
		costs: {
			directExpenses: {
				total: directExpensesTotal,
				count: directExpenses._count,
				byCategory: categoryBreakdown,
			},
			subcontracts: {
				contracts: subcontracts.map((sc) => ({
					id: sc.id,
					name: sc.name,
					contractNo: sc.contractNo,
					value: Number(sc.value ?? 0),
					paymentCount: sc._count.payments,
				})),
				totalContractValues: subcontractContractValues,
				totalPaid: subcontractPaidTotal,
				remaining: subcontractRemaining,
			},
			laborCosts,
			distributedExpenses,
			totalCosts,
		},
		profitability: {
			grossProfit,
			profitMargin: Math.round(profitMargin * 100) / 100,
			realizedProfit,
			expectedMargin:
				totalContractValue > 0
					? Math.round(
							((totalContractValue - totalCosts) / totalContractValue) *
								100 *
								100,
						) / 100
					: 0,
		},
		retention: {
			retentionPercent,
			retentionAmount,
			retentionCap,
		},
	};
}
