"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@ui/components/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarDays, Plus, Receipt, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface SubcontractDetailSheetProps {
	contractId: string | null;
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDelete: (id: string) => void;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function SubcontractDetailSheet({
	contractId,
	organizationId,
	organizationSlug,
	projectId,
	open,
	onOpenChange,
	onDelete,
}: SubcontractDetailSheetProps) {
	const t = useTranslations();
	const financePath = `/app/${organizationSlug}/projects/${projectId}/finance`;

	const { data: contract, isLoading } = useQuery({
		...orpc.projectFinance.getSubcontract.queryOptions({
			input: {
				organizationId,
				projectId,
				contractId: contractId ?? "",
			},
		}),
		enabled: !!contractId,
	});

	const progress =
		contract && contract.value > 0
			? Math.min((contract.totalPaid / contract.value) * 100, 100)
			: 0;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="left" className="w-full overflow-y-auto sm:max-w-lg">
				{isLoading || !contract ? (
					<div className="flex items-center justify-center py-20">
						<div className="relative">
							<div className="h-12 w-12 rounded-full border-4 border-primary/20" />
							<div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					</div>
				) : (
					<div className="space-y-6">
						<SheetHeader>
							<SheetTitle className="text-start">
								{contract.name}
							</SheetTitle>
						</SheetHeader>

						{/* Contract Info */}
						<div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
							<div className="flex items-center justify-between">
								<span className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.subcontracts.value")}
								</span>
								<span className="font-semibold text-slate-900 dark:text-slate-100">
									{formatCurrency(contract.value)}
								</span>
							</div>

							{(contract.startDate || contract.endDate) && (
								<div className="flex items-center justify-between">
									<span className="text-sm text-slate-500 dark:text-slate-400">
										{t("finance.subcontracts.duration")}
									</span>
									<div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
										<CalendarDays className="h-3.5 w-3.5" />
										{contract.startDate &&
											format(new Date(contract.startDate), "dd/MM/yyyy", {
												locale: ar,
											})}
										{contract.startDate && contract.endDate && " - "}
										{contract.endDate &&
											format(new Date(contract.endDate), "dd/MM/yyyy", {
												locale: ar,
											})}
									</div>
								</div>
							)}

							{contract.notes && (
								<p className="text-sm text-slate-600 dark:text-slate-400">
									{contract.notes}
								</p>
							)}
						</div>

						{/* Progress Bar */}
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="text-slate-500 dark:text-slate-400">
									{t("finance.subcontracts.progress")}
								</span>
								<span className="font-medium text-slate-700 dark:text-slate-300">
									{progress.toFixed(0)}%
								</span>
							</div>
							<div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
								<div
									className="h-full rounded-full bg-primary transition-all"
									style={{ width: `${progress}%` }}
								/>
							</div>
							<div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
								<span>
									{t("finance.subcontracts.paid")}:{" "}
									{formatCurrency(contract.totalPaid)}
								</span>
								<span>
									{t("finance.subcontracts.remaining")}:{" "}
									{formatCurrency(contract.remaining)}
								</span>
							</div>
						</div>

						{/* Payments Section */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="font-semibold text-slate-700 dark:text-slate-300">
									{t("finance.subcontracts.payments")}
								</h4>
								<Button asChild size="sm" className="rounded-xl">
									<Link
										href={`${financePath}/new-expense?contractId=${contract.id}`}
										onClick={() => onOpenChange(false)}
									>
										<Plus className="me-1.5 h-3.5 w-3.5" />
										{t("finance.subcontracts.addPayment")}
									</Link>
								</Button>
							</div>

							{contract.expenses.length === 0 ? (
								<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-8 dark:border-slate-700">
									<Receipt className="mb-2 h-6 w-6 text-slate-400" />
									<p className="text-sm text-slate-400">
										{t("finance.subcontracts.noPayments")}
									</p>
								</div>
							) : (
								<div className="rounded-xl border border-slate-200 dark:border-slate-800">
									<Table>
										<TableHeader>
											<TableRow className="hover:bg-transparent">
												<TableHead className="text-start">
													{t("finance.expenses.date")}
												</TableHead>
												<TableHead className="text-start">
													{t("finance.expenses.amount")}
												</TableHead>
												<TableHead className="text-start">
													{t("finance.expenses.vendor")}
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{contract.expenses.map((expense) => (
												<TableRow key={expense.id}>
													<TableCell className="text-sm">
														{format(
															new Date(expense.date),
															"dd/MM/yyyy",
															{ locale: ar },
														)}
													</TableCell>
													<TableCell className="font-semibold text-red-600 dark:text-red-400">
														{formatCurrency(expense.amount)}
													</TableCell>
													<TableCell className="text-sm text-slate-600 dark:text-slate-400">
														{expense.vendorName || "-"}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</div>

						{/* Delete Button */}
						<div className="border-t border-slate-200 pt-4 dark:border-slate-700">
							<Button
								variant="outline"
								className="w-full rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
								onClick={() => {
									onOpenChange(false);
									onDelete(contract.id);
								}}
							>
								<Trash2 className="me-2 h-4 w-4" />
								{t("finance.subcontracts.deleteTitle")}
							</Button>
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
