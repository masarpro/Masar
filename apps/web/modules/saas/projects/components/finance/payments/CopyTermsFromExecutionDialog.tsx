"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDateNumeric } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import { Input } from "@ui/components/input";
import { Switch } from "@ui/components/switch";
import { Skeleton } from "@ui/components/skeleton";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import {
	CalendarDays,
	ClipboardList,
	Copy,
	Flag,
	Info,
	Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface CopyTermsFromExecutionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	projectId: string;
	hasContract: boolean;
}

interface Milestone {
	id: string;
	title: string;
	plannedStart: string | Date | null;
	plannedEnd: string | Date | null;
	status: string;
}

const VAT_RATE = 0.15;

export function CopyTermsFromExecutionDialog({
	open,
	onOpenChange,
	organizationId,
	projectId,
	hasContract,
}: CopyTermsFromExecutionDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const params = useParams();
	const organizationSlug = params?.organizationSlug as string | undefined;

	const { data, isLoading } = useQuery({
		...orpc.projectPayments.getExecutionMilestones.queryOptions({
			input: { organizationId, projectId },
		}),
		enabled: open && hasContract,
	});

	const milestones = useMemo<Milestone[]>(
		() => (Array.isArray(data) ? (data as Milestone[]) : []),
		[data],
	);

	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [amounts, setAmounts] = useState<Record<string, string>>({});
	const [taxInclusive, setTaxInclusive] = useState(false);

	// Reset transient state whenever the dialog opens
	useEffect(() => {
		if (open) {
			setSelected(new Set());
			setAmounts({});
			setTaxInclusive(false);
		}
	}, [open]);

	const toggleOne = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const setAmount = (id: string, value: string) => {
		setAmounts((prev) => ({ ...prev, [id]: value }));
		// Auto-select a row once the user starts typing an amount in it
		if (value && !selected.has(id)) {
			setSelected((prev) => new Set(prev).add(id));
		}
	};

	const selectedRows = useMemo(
		() =>
			milestones
				.filter((m) => selected.has(m.id))
				.map((m) => ({ milestone: m, amount: Number(amounts[m.id]) || 0 }))
				.filter((r) => r.amount > 0),
		[milestones, selected, amounts],
	);

	const baseTotal = selectedRows.reduce((sum, r) => sum + r.amount, 0);
	const grandTotal = taxInclusive ? baseTotal : baseTotal * (1 + VAT_RATE);

	const copyMutation = useMutation({
		...orpc.projectPayments.copyTermsFromExecution.mutationOptions(),
		onSuccess: (result: { createdCount: number }) => {
			toast.success(
				t("projectPayments.copyExecution.savedCount", {
					count: result.createdCount,
				}),
			);
			queryClient.invalidateQueries({ queryKey: orpc.projectPayments.key() });
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("projectPayments.createError"));
		},
	});

	const handleCopy = () => {
		if (selectedRows.length === 0) return;
		copyMutation.mutate({
			organizationId,
			projectId,
			taxInclusive,
			items: selectedRows.map((r) => ({
				milestoneId: r.milestone.id,
				label: r.milestone.title,
				dueDate: r.milestone.plannedEnd
					? new Date(r.milestone.plannedEnd)
					: r.milestone.plannedStart
						? new Date(r.milestone.plannedStart)
						: undefined,
				amount: r.amount,
			})),
		});
	};

	// Preserve the original null fallback: callers rely on null for
	// `startStr ?? "—"` and the `(startStr || endStr)` visibility guard.
	const formatDate = (d: string | Date | null) =>
		d ? formatDateNumeric(d) : null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden flex flex-col max-h-[90dvh]">
				<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
					<DialogTitle className="text-base font-semibold">
						{t("projectPayments.copyExecution.title")}
					</DialogTitle>
				</DialogHeader>

				{/* No contract → guide the user to create one first */}
				{!hasContract ? (
					<div className="p-5">
						<div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
							<Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
							<div className="space-y-2">
								<p className="text-sm text-amber-700 dark:text-amber-300">
									{t("projectPayments.copyExecution.noContract")}
								</p>
								{organizationSlug && (
									<Button
										asChild
										size="sm"
										variant="outline"
										className="rounded-xl"
									>
										<Link
											href={`/app/${organizationSlug}/projects/${projectId}/finance/contract`}
										>
											{t("projectPayments.copyExecution.goToContract")}
										</Link>
									</Button>
								)}
							</div>
						</div>
					</div>
				) : (
					<>
						<div className="p-5 space-y-4 overflow-y-auto min-h-0 flex-1">
							{/* Tax-inclusive toggle */}
							<div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3">
								<label
									htmlFor="tax-inclusive"
									className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
								>
									{t("projectPayments.copyExecution.taxInclusive")}
								</label>
								<Switch
									id="tax-inclusive"
									checked={taxInclusive}
									onCheckedChange={setTaxInclusive}
								/>
							</div>

							{/* Milestones list */}
							<div className="max-h-[400px] overflow-y-auto space-y-3 pe-1">
								{isLoading ? (
									<>
										{[1, 2, 3].map((i) => (
											<div
												key={i}
												className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3"
											>
												<Skeleton className="h-5 w-48" />
												<Skeleton className="h-9 w-full" />
											</div>
										))}
									</>
								) : milestones.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-12 text-center">
										<div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
											<ClipboardList className="h-7 w-7 text-slate-400" />
										</div>
										<p className="text-sm font-medium text-slate-600 dark:text-slate-300">
											{t("projectPayments.copyExecution.noMilestones")}
										</p>
									</div>
								) : (
									milestones.map((milestone) => {
										const startStr = formatDate(milestone.plannedStart);
										const endStr = formatDate(milestone.plannedEnd);
										const isSelected = selected.has(milestone.id);
										return (
											<div
												key={milestone.id}
												className={`rounded-xl border bg-white dark:bg-slate-900 p-4 transition-colors ${
													isSelected
														? "border-chart-4 dark:border-chart-4"
														: "border-slate-200 dark:border-slate-700"
												}`}
											>
												<div className="flex items-start gap-3">
													<Checkbox
														className="mt-1"
														checked={isSelected}
														onCheckedChange={() =>
															toggleOne(milestone.id)
														}
													/>
													<div className="min-w-0 flex-1 space-y-2">
														<div className="flex items-center gap-2">
															<Flag className="h-4 w-4 text-chart-4 shrink-0" />
															<h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
																{milestone.title}
															</h4>
														</div>
														{(startStr || endStr) && (
															<div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
																<CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
																{startStr ?? "—"} / {endStr ?? "—"}
															</div>
														)}
														<Input
															type="number"
															inputMode="decimal"
															min="0"
															step="0.01"
															value={amounts[milestone.id] ?? ""}
															onChange={(e: any) =>
																setAmount(
																	milestone.id,
																	e.target.value,
																)
															}
															placeholder={t(
																"projectPayments.copyExecution.amount",
															)}
															className="h-9"
														/>
													</div>
												</div>
											</div>
										);
									})
								)}
							</div>
						</div>

						{/* Footer */}
						<div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between gap-3">
							<div className="text-sm">
								<span className="text-slate-500">
									{t("projectPayments.copyExecution.totalPreview")}:{" "}
								</span>
								<span className="font-semibold text-chart-4 dark:text-chart-4">
									{formatCurrency(grandTotal, "SAR", "en-US")}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									className="rounded-xl h-10"
									onClick={() => onOpenChange(false)}
								>
									{t("common.cancel")}
								</Button>
								<Button
									type="button"
									className="rounded-xl h-10 bg-chart-4 text-white hover:bg-chart-4"
									disabled={
										selectedRows.length === 0 ||
										copyMutation.isPending
									}
									onClick={handleCopy}
								>
									{copyMutation.isPending ? (
										<Loader2 className="h-4 w-4 me-1.5 animate-spin" />
									) : (
										<Copy className="h-4 w-4 me-1.5" />
									)}
									{t("projectPayments.copyExecution.copy", {
										count: selectedRows.length,
									})}
								</Button>
							</div>
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
