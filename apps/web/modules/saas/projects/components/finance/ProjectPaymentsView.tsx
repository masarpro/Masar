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
	Banknote,
	CheckCircle2,
	ChevronDown,
	Clock,
	FileText,
	Loader2,
	Plus,
	Circle,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ProjectPaymentsViewProps {
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

export function ProjectPaymentsView({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectPaymentsViewProps) {
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const t = useTranslations();

	const { data, isLoading, error } = useQuery(
		orpc.projectContract.getPaymentTermsProgress.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	if (error || !data || data.terms.length === 0) {
		return (
			<div className="space-y-6">
				<h2 className="text-xl font-semibold">
					{t("projectPayments.title")}
				</h2>
				<div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
					<Banknote className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
					<p className="mt-4 text-sm text-slate-500">
						{t("projectPayments.noTerms")}
					</p>
					<Button
						asChild
						variant="outline"
						className="mt-4 rounded-xl"
					>
						<Link href={`${basePath}/finance/contract`}>
							{t("projectPayments.goToContract")}
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-full space-y-6">
			{/* Header */}
			<h2 className="text-xl font-semibold">
				{t("projectPayments.title")}
			</h2>

			{/* Summary Card */}
			<div className="overflow-hidden rounded-2xl border border-emerald-200/50 bg-gradient-to-l from-emerald-50/80 to-teal-50/80 dark:border-emerald-800/30 dark:from-emerald-950/20 dark:to-teal-950/20">
				<div className="p-5">
					<div className="mb-4 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/50">
								<Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
							</div>
							<div>
								<h3 className="text-lg font-medium text-emerald-900 dark:text-emerald-100">
									{t("projectPayments.summary")}
								</h3>
								<p className="text-sm text-slate-500">
									{t("projectPayments.summaryDesc")}
								</p>
							</div>
						</div>
						<div className="text-left">
							<p className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-300">
								{data.overallProgress.toFixed(0)}%
							</p>
						</div>
					</div>

					<Progress
						value={data.overallProgress}
						className="mb-3 h-3 bg-emerald-100 dark:bg-emerald-900/40 [&>div]:bg-emerald-500"
					/>

					<div className="grid grid-cols-3 gap-4">
						<div className="rounded-xl bg-white/60 p-3 dark:bg-slate-900/30">
							<p className="text-xs text-slate-500">
								{t("projectPayments.totalRequired")}
							</p>
							<p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
								{formatCurrency(data.totalRequired)} ر.س
							</p>
						</div>
						<div className="rounded-xl bg-white/60 p-3 dark:bg-slate-900/30">
							<p className="text-xs text-slate-500">
								{t("projectPayments.totalPaid")}
							</p>
							<p className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-300">
								{formatCurrency(data.totalPaid)} ر.س
							</p>
						</div>
						<div className="rounded-xl bg-white/60 p-3 dark:bg-slate-900/30">
							<p className="text-xs text-slate-500">
								{t("projectPayments.totalRemaining")}
							</p>
							<p className="font-mono text-sm font-semibold text-amber-700 dark:text-amber-300">
								{formatCurrency(
									data.totalRequired - data.totalPaid,
								)}{" "}
								ر.س
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Term Cards */}
			<div className="space-y-4">
				{data.terms.map((term) => (
					<TermCard
						key={term.id}
						term={term}
						isNext={term.id === data.nextIncompleteTermId}
						basePath={basePath}
						projectId={projectId}
						t={t}
					/>
				))}
			</div>
		</div>
	);
}

function TermCard({
	term,
	isNext,
	basePath,
	projectId,
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
	projectId: string;
	t: ReturnType<typeof useTranslations>;
}) {
	const [isOpen, setIsOpen] = useState(false);

	const statusColor = term.isComplete
		? "border-emerald-200/50 bg-emerald-50/50 dark:border-emerald-800/30 dark:bg-emerald-950/20"
		: isNext
			? "border-blue-200/50 bg-blue-50/50 dark:border-blue-800/30 dark:bg-blue-950/20"
			: "border-slate-200/50 bg-slate-50/50 dark:border-slate-700/30 dark:bg-slate-900/20";

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
			className={`overflow-hidden rounded-2xl border ${statusColor}`}
		>
			<div className="p-5">
				<div className="mb-3 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<StatusIcon
							className={`h-5 w-5 ${statusIconColor}`}
						/>
						<Badge
							variant="outline"
							className={`rounded-lg text-xs ${
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
						{term.label && (
							<span className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{term.label}
							</span>
						)}
						{isNext && !term.isComplete && (
							<Badge className="rounded-lg bg-blue-100 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
								{t("projectPayments.currentPhase")}
							</Badge>
						)}
					</div>
					{term.isComplete && (
						<span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
							{t("projectPayments.completed")}
						</span>
					)}
				</div>

				{/* Progress */}
				<div className="mb-3">
					<div className="mb-1 flex justify-between text-xs text-slate-500">
						<span>
							{t("projectPayments.paid")}:{" "}
							{formatCurrency(term.paidAmount)} ر.س
						</span>
						<span>
							{t("projectPayments.required")}:{" "}
							{formatCurrency(term.amount)} ر.س
							{term.percent != null && ` (${term.percent}%)`}
						</span>
					</div>
					<Progress
						value={term.progressPercent}
						className={`h-2 ${progressBg} ${progressColor}`}
					/>
					{term.remainingAmount > 0 && (
						<p className="mt-1 text-xs text-slate-400">
							{t("projectPayments.remaining")}:{" "}
							{formatCurrency(term.remainingAmount)} ر.س
						</p>
					)}
				</div>

				{/* Actions */}
				<div className="flex items-center justify-between">
					{/* Expandable payments list */}
					{term.payments.length > 0 ? (
						<Collapsible
							open={isOpen}
							onOpenChange={setIsOpen}
						>
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="rounded-lg text-xs text-slate-500 hover:text-slate-700"
								>
									<FileText className="ml-1 h-3.5 w-3.5" />
									{t("projectPayments.paymentsCount", {
										count: term.payments.length,
									})}
									<ChevronDown
										className={`mr-1 h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
									/>
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent className="mt-2">
								<div className="space-y-2 rounded-xl border border-slate-100 bg-white/60 p-3 dark:border-slate-700/30 dark:bg-slate-900/30">
									{term.payments.map((payment) => (
										<div
											key={payment.id}
											className="flex items-center justify-between rounded-lg bg-slate-50/50 p-2.5 text-sm dark:bg-slate-800/30"
										>
											<div className="flex items-center gap-2">
												<span className="font-mono text-xs text-slate-400">
													{payment.paymentNo}
												</span>
												<span className="text-xs text-slate-500">
													{new Date(
														payment.date,
													).toLocaleDateString(
														"ar-SA",
													)}
												</span>
											</div>
											<span className="font-mono text-sm font-medium text-emerald-700 dark:text-emerald-300">
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
						<span className="text-xs text-slate-400">
							{t("projectPayments.noPaymentsYet")}
						</span>
					)}

					{/* Add payment button */}
					{!term.isComplete && (
						<Button
							asChild
							size="sm"
							className={`rounded-lg text-xs ${
								isNext
									? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
									: "bg-slate-600 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
							}`}
						>
							<Link
								href={`${basePath}/finance/payments/new?termId=${term.id}`}
							>
								<Plus className="ml-1 h-3.5 w-3.5" />
								{t("projectPayments.addPayment")}
							</Link>
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
