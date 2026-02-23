"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { Badge } from "@ui/components/badge";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { FileSignature } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useProjectRole } from "../../hooks/use-project-role";

interface ContractBarProps {
	organizationId: string;
	projectId: string;
	contractHref: string;
}

const STATUS_COLORS: Record<string, string> = {
	DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
	SUSPENDED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
	CLOSED: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

function getProgressColor(percent: number, isOverdue: boolean): string {
	if (isOverdue) return "rgb(220, 38, 38)"; // red-600
	if (percent >= 90) return "rgb(239, 68, 68)"; // red-500
	if (percent >= 70) return "rgb(245, 158, 11)"; // amber-500
	return "hsl(var(--primary))";
}

function ContractBarInner({
	organizationId,
	projectId,
	contractHref,
}: ContractBarProps) {
	const t = useTranslations();

	const [currentTime, setCurrentTime] = useState(() => new Date());

	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 60000);
		return () => clearInterval(timer);
	}, []);

	const { data: contract, isLoading: contractLoading } = useQuery({
		...orpc.projectContract.get.queryOptions({
			input: { organizationId, projectId },
		}),
		staleTime: 5 * 60 * 1000,
	});

	const { data: summary, isLoading: summaryLoading } = useQuery({
		...orpc.projectContract.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
		staleTime: 5 * 60 * 1000,
	});

	if (contractLoading || summaryLoading) {
		return <div className="h-10 animate-pulse rounded-lg bg-muted" />;
	}

	// No contract state
	if (!contract) {
		return (
			<div
				className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border/60 bg-muted/30 px-4 py-2.5"
				dir="rtl"
			>
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<FileSignature className="h-4 w-4" />
					<span>{t("projects.contractBar.noContract")}</span>
				</div>
				<Link
					href={contractHref}
					className="text-sm font-medium text-primary hover:underline"
				>
					{t("projects.contractBar.addContract")}
				</Link>
			</div>
		);
	}

	const startDate = contract.startDate ? new Date(contract.startDate) : null;
	const endDate = contract.endDate ? new Date(contract.endDate) : null;
	const hasDates = !!(startDate && endDate);

	const totalDays = hasDates ? differenceInDays(endDate, startDate) : 0;
	const elapsedDays = hasDates ? differenceInDays(currentTime, startDate) : 0;
	const remainingDays = hasDates ? differenceInDays(endDate, currentTime) : 0;
	const isOverdue = hasDates && remainingDays < 0;
	const progressPercent = hasDates && totalDays > 0
		? Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
		: 0;
	const barColor = hasDates ? getProgressColor(progressPercent, isOverdue) : "";

	const statusColor = STATUS_COLORS[contract.status] ?? STATUS_COLORS.DRAFT;

	return (
		<Link
			href={contractHref}
			className="group block rounded-lg border border-border/50 bg-card/50 px-4 py-2.5 transition-colors hover:bg-accent/50"
			dir="rtl"
		>
			{/* Desktop layout */}
			<div className="hidden sm:block space-y-2">
				{/* Row 1: Contract info */}
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<Badge variant="secondary" className={statusColor}>
							{t(`projects.contract.status.${contract.status}`)}
						</Badge>

						<div className="flex items-center gap-1.5 text-sm">
							<span className="text-muted-foreground">
								{t("projects.contractBar.contractValue")}:
							</span>
							<span className="font-semibold">
								{formatCurrency(summary?.originalValue ?? 0)}
							</span>
							{summary?.adjustedValue !== summary?.originalValue && (
								<>
									<span className="text-muted-foreground mx-1">←</span>
									<span className="text-muted-foreground">
										{t("projects.contractBar.adjustedValue")}:
									</span>
									<span className="font-semibold text-teal-600 dark:text-teal-400">
										{formatCurrency(summary?.adjustedValue ?? 0)}
									</span>
								</>
							)}
						</div>

						{(summary?.retentionPercent ?? 0) > 0 && (
							<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
								<span>{t("projects.contractBar.retention")}:</span>
								<span className="font-medium text-foreground">
									{summary?.retentionPercent}%
								</span>
							</div>
						)}
					</div>

					<span className="text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
						{t("projects.contractBar.viewContract")} ←
					</span>
				</div>

				{/* Row 2: Progress bar + countdown */}
				{hasDates && totalDays > 0 && (
					<div className="flex items-center gap-4">
						<div className="flex flex-1 items-center gap-3">
							<div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
								<div
									className="h-full rounded-full transition-all duration-500"
									style={{
										width: `${isOverdue ? 100 : progressPercent}%`,
										background: barColor,
									}}
								/>
							</div>
							<span className="text-xs font-medium text-muted-foreground tabular-nums min-w-[2.5rem] text-center">
								{isOverdue ? "100" : Math.round(progressPercent)}%
							</span>
						</div>

						<div className="flex items-center gap-1.5 text-sm shrink-0">
							{isOverdue ? (
								<span className="font-medium text-red-600 dark:text-red-400">
									{t("projects.contractBar.daysOverdue", { days: Math.abs(remainingDays) })}
								</span>
							) : (
								<>
									<span className="font-medium text-foreground">
										{t("projects.contractBar.daysRemaining", { days: remainingDays })}
									</span>
									<span className="text-muted-foreground">
										{t("projects.contractBar.of")} {totalDays}
									</span>
								</>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Mobile layout */}
			<div className="sm:hidden space-y-2">
				{/* Row 1: Badge + value + countdown */}
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						<Badge variant="secondary" className={`shrink-0 ${statusColor}`}>
							{t(`projects.contract.status.${contract.status}`)}
						</Badge>
						<span className="text-sm font-semibold truncate">
							{formatCurrency(summary?.originalValue ?? 0)}
						</span>
					</div>
					<div className="flex items-center gap-2 text-xs shrink-0">
						{hasDates && totalDays > 0 && (
							isOverdue ? (
								<span className="font-medium text-red-600 dark:text-red-400">
									{t("projects.contractBar.daysOverdue", { days: Math.abs(remainingDays) })}
								</span>
							) : (
								<span className="font-medium text-muted-foreground">
									{t("projects.contractBar.daysRemaining", { days: remainingDays })}
								</span>
							)
						)}
						<span className="text-primary">←</span>
					</div>
				</div>

				{/* Row 2: Progress bar */}
				{hasDates && totalDays > 0 && (
					<div className="flex items-center gap-2">
						<div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
							<div
								className="h-full rounded-full transition-all duration-500"
								style={{
									width: `${isOverdue ? 100 : progressPercent}%`,
									background: barColor,
								}}
							/>
						</div>
						<span className="text-[10px] font-medium text-muted-foreground tabular-nums">
							{isOverdue ? "100" : Math.round(progressPercent)}%
						</span>
					</div>
				)}
			</div>
		</Link>
	);
}

export function ContractBar(props: ContractBarProps) {
	const { canViewSection } = useProjectRole();

	if (!canViewSection("finance/contract")) {
		return null;
	}

	return <ContractBarInner {...props} />;
}
