"use client";

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

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
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
				<div className="h-6 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
				<div className="flex gap-3 overflow-x-auto pb-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="h-36 w-64 shrink-0 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
						/>
					))}
				</div>
			</div>
		);
	}

	if (!data || data.terms.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center dark:border-slate-700">
				<Banknote className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
				<p className="mt-3 text-sm text-slate-500">
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
			<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
				{t("paymentsHub.milestones")}
			</h3>

			{/* Horizontal scrollable on desktop, stack on mobile */}
			<div className="flex flex-col gap-3 sm:flex-row sm:overflow-x-auto sm:pb-2">
				{data.terms.map((term) => (
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
		? "border-emerald-200/50 bg-emerald-50/80 dark:border-emerald-800/30 dark:bg-emerald-950/20"
		: isNext
			? "border-blue-200/50 bg-blue-50/80 dark:border-blue-800/30 dark:bg-blue-950/20"
			: "border-slate-200/50 bg-slate-50/80 dark:border-slate-700/30 dark:bg-slate-900/20";

	const progressColor = term.isComplete
		? "[&>div]:bg-emerald-500"
		: isNext
			? "[&>div]:bg-blue-500"
			: "[&>div]:bg-slate-400";

	const progressBg = term.isComplete
		? "bg-emerald-100 dark:bg-emerald-900/40"
		: isNext
			? "bg-blue-100 dark:bg-blue-900/40"
			: "bg-slate-200 dark:bg-slate-700/40";

	const StatusIcon = term.isComplete
		? CheckCircle2
		: isNext
			? Clock
			: Circle;

	const statusIconColor = term.isComplete
		? "text-emerald-500"
		: isNext
			? "text-blue-500"
			: "text-slate-400";

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
								? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
								: isNext
									? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
									: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
						}`}
					>
						{t(
							`projects.createProject.termTypes.${term.type}`,
						)}
					</Badge>
					{isNext && !term.isComplete && (
						<Badge className="rounded-lg bg-blue-100 text-[10px] text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
							{t("projectPayments.currentPhase")}
						</Badge>
					)}
				</div>

				{/* Label */}
				{term.label && (
					<p className="mb-2 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
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
					<span className="font-mono text-slate-600 dark:text-slate-400">
						{formatCurrency(term.paidAmount)}
					</span>
					<span className="font-mono text-slate-500">
						/ {formatCurrency(term.amount)} ر.س
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
									className="h-7 rounded-lg px-2 text-[11px] text-slate-500 hover:text-slate-700"
								>
									<FileText className="ml-1 h-3 w-3" />
									{t("projectPayments.paymentsCount", {
										count: term.payments.length,
									})}
									<ChevronDown
										className={`mr-1 h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
									/>
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent className="mt-2">
								<div className="space-y-1.5 rounded-xl border border-slate-100 bg-white/60 p-2 dark:border-slate-700/30 dark:bg-slate-900/30">
									{term.payments.map((payment) => (
										<div
											key={payment.id}
											className="flex items-center justify-between rounded-lg bg-slate-50/50 p-2 text-xs dark:bg-slate-800/30"
										>
											<span className="font-mono text-slate-400">
												{payment.paymentNo}
											</span>
											<span className="font-mono font-medium text-emerald-700 dark:text-emerald-300">
												{formatCurrency(
													payment.amount,
												)}{" "}
												ر.س
											</span>
										</div>
									))}
								</div>
							</CollapsibleContent>
						</Collapsible>
					) : (
						<span className="text-[11px] text-slate-400">
							{t("projectPayments.noPaymentsYet")}
						</span>
					)}

					{!term.isComplete && (
						<Button
							asChild
							size="sm"
							className={`h-7 rounded-lg px-2 text-[11px] ${
								isNext
									? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
									: "bg-slate-600 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
							}`}
						>
							<Link
								href={`${basePath}/finance/payments/new?termId=${term.id}`}
							>
								<Plus className="ml-0.5 h-3 w-3" />
								+
							</Link>
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
