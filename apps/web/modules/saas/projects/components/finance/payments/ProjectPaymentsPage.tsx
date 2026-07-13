"use client";

import { useState } from "react";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Plus, Info, Hammer } from "lucide-react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { PaymentsSummaryCards } from "./PaymentsSummaryCards";
import { PaymentProgressBar } from "./PaymentProgressBar";
import { PaymentTermsSection } from "./PaymentTermsSection";
import { FreePaymentsSection } from "./FreePaymentsSection";
import { CreatePaymentDialog } from "./CreatePaymentDialog";
import { CopyTermsFromExecutionDialog } from "./CopyTermsFromExecutionDialog";
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
	const [copyOpen, setCopyOpen] = useState(false);

	const { data, isLoading } = useQuery(
		orpc.projectPayments.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	const hasContract = data?.hasContract ?? false;
	const hasTerms = data?.hasTerms ?? false;
	const hasPayments = (data?.allPayments?.length ?? 0) > 0;

	return (
		<div className="w-full max-w-full space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-xl font-semibold text-foreground">
						{t("projectPayments.title")}
					</h2>
					<p className="text-sm text-muted-foreground">
						{t("projectPayments.subtitle")}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						variant="outline"
						className="rounded-xl"
						onClick={() => setCopyOpen(true)}
					>
						<Hammer className="me-1.5 h-4 w-4" />
						{t("projectPayments.copyFromExecution")}
					</Button>
					<Button
						size="sm"
						className="rounded-xl"
						onClick={() => setCreateOpen(true)}
					>
						<Plus className="me-1.5 h-4 w-4" />
						{t("projectPayments.newPayment")}
					</Button>
				</div>
			</div>

			{/* Scenario 1: No contract */}
			{!hasContract && (
				<>
					<div className="flex items-start gap-3 rounded-xl border-2 border-chart-4/20 bg-chart-4/10 p-4">
						<Info className="mt-0.5 h-5 w-5 shrink-0 text-chart-4" />
						<p className="text-sm text-chart-4">
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
					<div className="flex items-start gap-3 rounded-xl border-2 border-chart-1/20 bg-chart-1/10 p-4">
						<Info className="mt-0.5 h-5 w-5 shrink-0 text-chart-1" />
						<p className="text-sm text-chart-1">
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
						contractValue={data?.contractValue ?? 0}
						terms={data?.terms ?? []}
					/>
					{(data?.freePayments?.length ?? 0) > 0 && (
						<FreePaymentsSection
							organizationId={organizationId}
							projectId={projectId}
							payments={data?.freePayments ?? []}
							totalCollected={data?.freePayments?.reduce(
								(s: any, p: any) => s + p.amount,
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

			{/* Copy Payment Terms from Execution Milestones */}
			<CopyTermsFromExecutionDialog
				open={copyOpen}
				onOpenChange={setCopyOpen}
				organizationId={organizationId}
				projectId={projectId}
				hasContract={hasContract}
			/>
		</div>
	);
}
