"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	AlertTriangle,
	ArrowRight,
	Calendar,
	Clock,
	Edit,
	Hammer,
	Mail,
	Phone,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { STATUS_STYLES, formatCurrency } from "./subcontract-shared";

interface ContractData {
	name: string;
	status: string;
	contractNo?: string | null;
	companyName?: string | null;
	contractorType: string;
	crNumber?: string | null;
	taxNumber?: string | null;
	phone?: string | null;
	email?: string | null;
	startDate?: Date | string | null;
	endDate?: Date | string | null;
	scopeOfWork?: string | null;
	value: number;
}

export interface SubcontractHeaderProps {
	contract: ContractData;
	basePath: string;
	isOverBudget: boolean;
	isEndDatePast: boolean | "" | null;
	isNearingDeadline: boolean;
	daysUntilEnd: number | null;
	totalPaid: number;
	adjustedValue: number;
	onEdit: () => void;
	onDelete: () => void;
	children?: React.ReactNode;
}

export const SubcontractHeader = React.memo(function SubcontractHeader({
	contract,
	basePath,
	isOverBudget,
	isEndDatePast,
	isNearingDeadline,
	daysUntilEnd,
	totalPaid,
	adjustedValue,
	onEdit,
	onDelete,
	children,
}: SubcontractHeaderProps) {
	const t = useTranslations();
	const statusStyle = STATUS_STYLES[contract.status] ?? STATUS_STYLES.DRAFT;

	return (
		<>
			{/* Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<Link href={basePath}>
						<Button variant="ghost" size="sm" className="rounded-xl">
							<ArrowRight className="h-4 w-4" />
						</Button>
					</Link>
					<div>
						<div className="flex min-w-0 items-center gap-2">
							<h1 className="truncate text-xl font-bold text-muted-foreground dark:text-muted-foreground">
								{contract.name}
							</h1>
							<Badge className={`border-0 text-xs ${statusStyle.bg} ${statusStyle.text}`}>
								{t(`subcontracts.status.${contract.status}`)}
							</Badge>
						</div>
						{contract.contractNo && (
							<p className="text-sm text-muted-foreground">{contract.contractNo}</p>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						className="rounded-xl"
						onClick={onEdit}
					>
						<Edit className="me-1.5 h-4 w-4" />
						{t("subcontracts.detail.editContract")}
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="rounded-xl border-destructive text-destructive hover:bg-destructive/15 hover:text-destructive dark:border-destructive dark:text-destructive"
						onClick={onDelete}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Alerts */}
			{isOverBudget && (
				<div className="flex items-center gap-3 rounded-xl border border-destructive bg-destructive/15 p-4 dark:border-destructive dark:bg-destructive/20">
					<AlertTriangle className="h-5 w-5 shrink-0 text-destructive dark:text-destructive" />
					<div>
						<p className="text-sm font-semibold text-destructive dark:text-destructive">
							{t("subcontracts.detail.alerts.overBudget")}
						</p>
						<p className="text-xs text-destructive dark:text-destructive">
							{t("subcontracts.detail.alerts.overBudgetDesc", { amount: formatCurrency(totalPaid - adjustedValue) })}
						</p>
					</div>
				</div>
			)}
			{isEndDatePast && (
				<div className="flex items-center gap-3 rounded-xl border border-chart-1 bg-chart-1/20 p-4 dark:border-chart-1 dark:bg-chart-1/25">
					<Clock className="h-5 w-5 shrink-0 text-chart-1 dark:text-chart-1" />
					<div>
						<p className="text-sm font-semibold text-chart-1 dark:text-chart-1">
							{t("subcontracts.detail.alerts.overdue")}
						</p>
						<p className="text-xs text-chart-1 dark:text-chart-1">
							{t("subcontracts.detail.alerts.overdueDesc", { date: format(new Date(contract.endDate!), "dd/MM/yyyy", { locale: ar }) })}
						</p>
					</div>
				</div>
			)}
			{isNearingDeadline && !isEndDatePast && (
				<div className="flex items-center gap-3 rounded-xl border border-chart-1 bg-chart-1/20 p-4 dark:border-chart-1 dark:bg-chart-1/25">
					<Clock className="h-5 w-5 shrink-0 text-chart-1 dark:text-chart-1" />
					<div>
						<p className="text-sm font-semibold text-chart-1 dark:text-chart-1">
							{t("subcontracts.detail.alerts.nearingDeadline")}
						</p>
						<p className="text-xs text-chart-1 dark:text-chart-1">
							{t("subcontracts.detail.alerts.nearingDeadlineDesc", { days: daysUntilEnd! })}
						</p>
					</div>
				</div>
			)}

			{/* Contractor Info */}
			<div className="overflow-hidden rounded-2xl border border-border bg-white dark:border-border dark:bg-muted">
				<div className="border-b border-border p-5 dark:border-border">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="flex items-start gap-3">
							<div className="shrink-0 rounded-xl bg-chart-1/20 p-2.5 dark:bg-chart-1/25">
								<Hammer className="h-5 w-5 text-chart-1 dark:text-chart-1" />
							</div>
							<div>
								<h3 className="font-semibold text-muted-foreground dark:text-muted-foreground">
									{contract.companyName || contract.name}
								</h3>
								<p className="text-xs text-muted-foreground">
									{contract.contractorType === "COMPANY" ? t("subcontracts.form.company") : t("subcontracts.form.individual")}
									{contract.crNumber && ` • ${t("subcontracts.form.crNumber")}: ${contract.crNumber}`}
									{contract.taxNumber && ` • ${t("subcontracts.form.taxNumber")}: ${contract.taxNumber}`}
								</p>
								<div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
									{contract.phone && (
										<span className="flex items-center gap-1" dir="ltr">
											<Phone className="h-3 w-3" /> {contract.phone}
										</span>
									)}
									{contract.email && (
										<span className="flex items-center gap-1" dir="ltr">
											<Mail className="h-3 w-3" /> {contract.email}
										</span>
									)}
								</div>
							</div>
						</div>

						{/* Dates */}
						<div className="flex items-center gap-4 text-xs">
							{contract.startDate && (
								<div className="flex items-center gap-1.5 text-muted-foreground">
									<Calendar className="h-3.5 w-3.5" />
									<span>{format(new Date(contract.startDate), "dd/MM/yyyy", { locale: ar })}</span>
								</div>
							)}
							{contract.startDate && contract.endDate && (
								<span className="text-muted-foreground dark:text-muted-foreground">&larr;</span>
							)}
							{contract.endDate && (
								<div className={`flex items-center gap-1.5 ${isEndDatePast ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
									<Calendar className="h-3.5 w-3.5" />
									<span>{format(new Date(contract.endDate), "dd/MM/yyyy", { locale: ar })}</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Financial summary slot */}
				{children}
			</div>
		</>
	);
});
