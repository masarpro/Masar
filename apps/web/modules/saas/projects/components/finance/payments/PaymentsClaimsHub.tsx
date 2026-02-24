"use client";

import { Button } from "@ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PaymentMilestonesGrid } from "./PaymentMilestonesGrid";
import { PaymentsClaimsTable } from "./PaymentsClaimsTable";
import { PaymentsSummaryDashboard } from "./PaymentsSummaryDashboard";

interface PaymentsClaimsHubProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function PaymentsClaimsHub({
	organizationId,
	organizationSlug,
	projectId,
}: PaymentsClaimsHubProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;

	return (
		<div className="w-full max-w-full space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
						{t("paymentsHub.title")}
					</h2>
					<p className="text-sm text-slate-500">
						{t("paymentsHub.subtitle")}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						asChild
						size="sm"
						className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
					>
						<Link href={`${basePath}/finance/payments/new`}>
							<Plus className="ml-1.5 h-4 w-4" />
							{t("paymentsHub.newPayment")}
						</Link>
					</Button>
					<Button
						asChild
						size="sm"
						variant="outline"
						className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/20"
					>
						<Link href={`${basePath}/finance/claims/new`}>
							<Plus className="ml-1.5 h-4 w-4" />
							{t("paymentsHub.newClaim")}
						</Link>
					</Button>
				</div>
			</div>

			{/* Section 1: Summary Dashboard */}
			<PaymentsSummaryDashboard
				organizationId={organizationId}
				projectId={projectId}
			/>

			{/* Section 2: Milestones Grid */}
			<PaymentMilestonesGrid
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>

			{/* Section 3: Unified Table */}
			<PaymentsClaimsTable
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</div>
	);
}
