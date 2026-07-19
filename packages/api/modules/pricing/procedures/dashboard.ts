import { getPricingDashboardStats } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import {
	hasCostingReadAccess,
	hasQuotationReadAccess,
} from "../../quantities/lib/pricing-access";

export const getPricingDashboard = protectedProcedure
	.route({
		method: "GET",
		path: "/pricing/dashboard",
		tags: ["Pricing", "Dashboard"],
		summary: "Get pricing dashboard stats",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		const { permissions } = await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		const stats = await getPricingDashboardStats(input.organizationId);

		// القيم المالية (تكاليف الدراسات ومبالغ العروض) تُحجب خادمياً لمن لا
		// يملك صلاحيات تسعير/عروض أسعار — تبقى الأعداد والحالات فقط.
		const showCosting = hasCostingReadAccess(permissions);
		const showQuotations = hasQuotationReadAccess(permissions);
		const showLeads = permissions.pricing?.leads ?? false;

		return {
			...stats,
			studies: {
				...stats.studies,
				totalValue: showCosting ? stats.studies.totalValue : 0,
			},
			quotations: {
				...stats.quotations,
				totalValue: showQuotations ? stats.quotations.totalValue : 0,
				activeValue: showQuotations ? stats.quotations.activeValue : 0,
			},
			leads: {
				...stats.leads,
				openEstimatedValue: showLeads ? stats.leads.openEstimatedValue : 0,
			},
			recentDocuments: stats.recentDocuments.map((d) => ({
				...d,
				amount:
					d.type === "study"
						? showCosting
							? d.amount
							: 0
						: showQuotations
							? d.amount
							: 0,
			})),
			expiringQuotations: stats.expiringQuotations.map((q) => ({
				...q,
				totalAmount: showQuotations ? q.totalAmount : 0,
			})),
		};
	});
