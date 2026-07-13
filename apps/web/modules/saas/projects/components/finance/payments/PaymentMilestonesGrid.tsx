"use client";

import { formatNumber } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Progress } from "@ui/components/progress";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import {
	CheckCircle2,
	Circle,
	Clock,
	ChevronDown,
	FileText,
	Plus,
	Banknote,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface PaymentMilestonesGridProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function PaymentMilestonesGrid({
	organizationId,
	organizationSlug,
	projectId,
}: PaymentMilestonesGridProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;

	const { data, isLoading } = useQuery(
		orpc.projectContract.getPaymentTermsProgress.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	if (isLoading) {
		return (
			<div className="space-y-3">
				<div className="h-6 w-32 animate-pulse rounded bg-muted dark:bg-muted" />
				<div className="flex gap-3 overflow-x-auto pb-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="h-36 w-64 shrink-0 animate-pulse rounded-2xl bg-muted dark:bg-muted"
						/>
					))}
				</div>
			</div>
		);
	}

	if (!data || data.terms.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-border py-10 text-center dark:border-border">
				<Banknote className="mx-auto h-10 w-10 text-muted-foreground dark:text-muted-foreground" />
				<p className="mt-3 text-sm text-muted-foreground">
					{t("projectPayments.noTerms")}
				</p>
				<Button
					asChild
					variant="outline"
					className="mt-3 rounded-xl"
					size="sm"
				>
					<Link href={`${basePath}/finance/contract`}>
						{t("projectPayments.goToContract")}
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<h3 className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground">
				{t("paymentsHub.milestones")}
			</h3>

			{/* Horizontal scrollable on desktop, stack on mobile */}
			<div className="flex flex-col gap-3 sm:flex-row sm:overflow-x-auto sm:pb-2">
				{data.terms.map((term: any) => (
					<MilestoneCard
						key={term.id}
						term={term}
						isNext={term.id === data.nextIncompleteTermId}
						basePath={basePath}
						t={t}
					/>
				))}
			</div>
		</div>
	);
}

function MilestoneCard({
	term,
	isNext,
	basePath,
	t,
}: {
	term: {
		id: string;
		type: string;
		label: string | null;
		percent: number | null;
		amount: number;
		paidAmount: number;
		remainingAmount: number;
		progressPercent: number;
		isComplete: boolean;
		payments: Array<{
			id: string;
			paymentNo: string;
			amount: number;
			date: string | Date;
			paymentMethod: string;
			referenceNo: string | null;
			description: string | null;
			destinationAccount: { id: string; name: string } | null;
			createdBy: { id: string; name: string } | null;
		}>;
	};
	isNext: boolean;
	basePath: string;
	t: ReturnType<typeof useTranslations>;
}) {
	const [isOpen, setIsOpen] = useState(false);

	const statusColor = term.isComplete
		? "border-chart-4/50 bg-chart-4/15 dark:border-chart-4/30 dark:bg-chart-4/20"
		: isNext
			? "border-chart-4/50 bg-chart-4/15 dark:border-chart-4/30 dark:bg-chart-4/20"
			: "border-border bg-muted dark:border-border dark:bg-muted";

	const progressColor = term.isComplete
		? "[&>div]:bg-chart-4"
		: isNext
			? "[&>div]:bg-chart-4"
			: "[&>div]:bg-muted";

	const progressBg = term.isComplete
		? "bg-chart-4/15 dark:bg-chart-4/20"
		: isNext
			? "bg-chart-4/15 dark:bg-chart-4/20"
			: "bg-muted dark:bg-muted";

	const StatusIcon = term.isComplete
		? CheckCircle2
		: isNext
			? Clock
			: Circle;

	const statusIconColor = term.isComplete
		? "text-chart-4"
		: isNext
			? "text-chart-4"
			: "text-muted-foreground";

	return (
		<div
			className={`min-w-0 shrink-0 overflow-hidden rounded-2xl border sm:w-72 ${statusColor}`}
		>
			<div className="p-4">
				{/* Header */}
				<div className="mb-2 flex items-center gap-2">
					<StatusIcon
						className={`h-4 w-4 shrink-0 ${statusIconColor}`}
					/>
					<Badge
						variant="outline"
						className={`rounded-lg text-[10px] ${
							term.isComplete
								? "border-chart-4 bg-chart-4/15 text-chart-4 dark:border-chart-4 dark:bg-chart-4/20 dark:text-chart-4"
								: isNext
									? "border-chart-4 bg-chart-4/15 text-chart-4 dark:border-chart-4 dark:bg-chart-4/20 dark:text-chart-4"
									: "border-border bg-muted text-muted-foreground dark:border-border dark:bg-muted dark:text-muted-foreground"
						}`}
					>
						{t(
							`projects.createProject.termTypes.${term.type}`,
						)}
					</Badge>
					{isNext && !term.isComplete && (
						<Badge className="rounded-lg bg-chart-4/15 text-[10px] text-chart-4 dark:bg-chart-4/20 dark:text-chart-4">
							{t("projectPayments.currentPhase")}
						</Badge>
					)}
				</div>

				{/* Label */}
				{term.label && (
					<p className="mb-2 truncate text-sm font-medium text-muted-foreground dark:text-muted-foreground">
						{term.label}
					</p>
				)}

				{/* Progress */}
				<Progress
					value={term.progressPercent}
					className={`mb-2 h-1.5 ${progressBg} ${progressColor}`}
				/>

				{/* Amount */}
				<div className="mb-2 flex items-center justify-between text-xs">
					<span className="font-mono text-muted-foreground dark:text-muted-foreground">
						{formatNumber(Number(term.paidAmount))}
					</span>
					<span className="font-mono text-muted-foreground">
						/ {formatNumber(Number(term.amount))} {t("common.sar")}
					</span>
				</div>

				{/* Footer: payment count + add button */}
				<div className="flex items-center justify-between">
					{term.payments.length > 0 ? (
						<Collapsible
							open={isOpen}
							onOpenChange={setIsOpen}
						>
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 rounded-lg px-2 text-[11px] text-muted-foreground hover:text-muted-foreground"
								>
									<FileText className="me-1 h-3 w-3" />
									{t("projectPayments.paymentsCount", {
										count: term.payments.length,
									})}
									<ChevronDown
										className={`ms-1 h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
									/>
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent className="mt-2">
								<div className="space-y-1.5 rounded-xl border border-border bg-card p-2 dark:border-border dark:bg-muted">
									{term.payments.map((payment) => (
										<div
											key={payment.id}
											className="flex items-center justify-between rounded-lg bg-muted p-2 text-xs dark:bg-muted"
										>
											<span className="font-mono text-muted-foreground">
												{payment.paymentNo}
											</span>
											<span className="font-mono font-medium text-chart-4 dark:text-chart-4">
												{formatNumber(
													Number(payment.amount),
												)}{" "}
												{t("common.sar")}
											</span>
										</div>
									))}
								</div>
							</CollapsibleContent>
						</Collapsible>
					) : (
						<span className="text-[11px] text-muted-foreground">
							{t("projectPayments.noPaymentsYet")}
						</span>
					)}

					{!term.isComplete && (
						<Button
							asChild
							size="sm"
							className={`h-7 rounded-lg px-2 text-[11px] ${
								isNext
									? "bg-chart-4 text-white hover:bg-chart-4 dark:bg-chart-4 dark:hover:bg-chart-4"
									: "bg-muted text-white hover:bg-muted dark:bg-muted dark:hover:bg-muted"
							}`}
						>
							<Link
								href={`${basePath}/finance/payments/new?termId=${term.id}`}
							>
								<Plus className="me-0.5 h-3 w-3" />
								+
							</Link>
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
