"use client";

import { useState } from "react";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Plus, Info } from "lucide-react";
import { PaymentsSummaryCards } from "./PaymentsSummaryCards";
import { PaymentProgressBar } from "./PaymentProgressBar";
import { PaymentTermsSection } from "./PaymentTermsSection";
import { FreePaymentsSection } from "./FreePaymentsSection";
import { CreatePaymentDialog } from "./CreatePaymentDialog";
import { EmptyPaymentsState } from "./EmptyPaymentsState";

interface ProjectPaymentsPageProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function ProjectPaymentsPage({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectPaymentsPageProps) {
	const t = useTranslations();
	const [createOpen, setCreateOpen] = useState(false);

	const { data, isLoading } = useQuery(
		orpc.projectPayments.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	if (isLoading) {
		return (
			<div className="w-full max-w-full space-y-6">
				<div className="h-10 w-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
						/>
					))}
				</div>
			</div>
		);
	}

	const hasContract = data?.hasContract ?? false;
	const hasTerms = data?.hasTerms ?? false;
	const hasPayments = (data?.allPayments?.length ?? 0) > 0;

	return (
		<div className="w-full max-w-full space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
						{t("projectPayments.title")}
					</h2>
					<p className="text-sm text-slate-500">
						{t("projectPayments.subtitle")}
					</p>
				</div>
				<Button
					size="sm"
					className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
					onClick={() => setCreateOpen(true)}
				>
					<Plus className="ml-1.5 h-4 w-4" />
					{t("projectPayments.newPayment")}
				</Button>
			</div>

			{/* Scenario 1: No contract */}
			{!hasContract && (
				<>
					<div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
						<Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
						<p className="text-sm text-blue-700 dark:text-blue-300">
							{t("projectPayments.noContractHint")}
						</p>
					</div>
					{hasPayments ? (
						<FreePaymentsSection
							organizationId={organizationId}
							projectId={projectId}
							payments={data?.freePayments ?? []}
							totalCollected={data?.totalCollected ?? 0}
						/>
					) : (
						<EmptyPaymentsState
							organizationSlug={organizationSlug}
							projectId={projectId}
							showContractLink
						/>
					)}
				</>
			)}

			{/* Scenario 2: Contract without terms */}
			{hasContract && !hasTerms && (
				<>
					<PaymentsSummaryCards
						contractValue={data?.contractValue ?? 0}
						totalCollected={data?.totalCollected ?? 0}
						remaining={data?.remaining ?? 0}
						retentionAmount={data?.retentionAmount ?? 0}
					/>
					<PaymentProgressBar
						collectionPercent={data?.collectionPercent ?? 0}
						totalCollected={data?.totalCollected ?? 0}
						remaining={data?.remaining ?? 0}
					/>
					<div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
						<Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
						<p className="text-sm text-amber-700 dark:text-amber-300">
							{t("projectPayments.noTermsHint")}
						</p>
					</div>
					<FreePaymentsSection
						organizationId={organizationId}
						projectId={projectId}
						payments={data?.freePayments ?? []}
						totalCollected={data?.totalCollected ?? 0}
					/>
				</>
			)}

			{/* Scenario 3: Contract with terms */}
			{hasContract && hasTerms && (
				<>
					<PaymentsSummaryCards
						contractValue={data?.contractValue ?? 0}
						totalCollected={data?.totalCollected ?? 0}
						remaining={data?.remaining ?? 0}
						retentionAmount={data?.retentionAmount ?? 0}
					/>
					<PaymentProgressBar
						collectionPercent={data?.collectionPercent ?? 0}
						totalCollected={data?.totalCollected ?? 0}
						remaining={data?.remaining ?? 0}
					/>
					<PaymentTermsSection
						organizationId={organizationId}
						projectId={projectId}
						terms={data?.terms ?? []}
					/>
					{(data?.freePayments?.length ?? 0) > 0 && (
						<FreePaymentsSection
							organizationId={organizationId}
							projectId={projectId}
							payments={data?.freePayments ?? []}
							totalCollected={data?.freePayments?.reduce(
								(s, p) => s + p.amount,
								0,
							) ?? 0}
						/>
					)}
				</>
			)}

			{/* Create Payment Dialog */}
			<CreatePaymentDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				organizationId={organizationId}
				projectId={projectId}
				terms={data?.terms ?? []}
				hasContract={hasContract}
			/>
		</div>
	);
}
