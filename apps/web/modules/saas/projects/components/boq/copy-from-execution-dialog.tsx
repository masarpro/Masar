"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import { Skeleton } from "@ui/components/skeleton";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { toast } from "sonner";
import {
	Copy,
	Loader2,
	Hammer,
	ClipboardList,
	Flag,
	CalendarDays,
} from "lucide-react";
import {
	useExecutionMilestones,
	useCopyFromExecution,
} from "@saas/projects/hooks/use-project-boq";

interface CopyFromExecutionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	projectId: string;
}

export function CopyFromExecutionDialog({
	open,
	onOpenChange,
	organizationId,
	projectId,
}: CopyFromExecutionDialogProps) {
	const t = useTranslations("projectBoq");

	const { data: milestones, isLoading } = useExecutionMilestones(
		organizationId,
		projectId,
		open,
	);
	const copyMutation = useCopyFromExecution();

	const milestoneList = useMemo(
		() => (Array.isArray(milestones) ? milestones : []),
		[milestones],
	);

	const [selected, setSelected] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (open) {
			setSelected(new Set(milestoneList.map((m: any) => m.id)));
		}
	}, [open, milestoneList]);

	const totalRowsToCreate = useMemo(
		() =>
			milestoneList
				.filter((m: any) => selected.has(m.id))
				.reduce(
					(sum: number, m: any) => sum + Math.max(1, m.activitiesCount ?? 0),
					0,
				),
		[milestoneList, selected],
	);

	const allSelected =
		milestoneList.length > 0 &&
		milestoneList.every((m: any) => selected.has(m.id));

	const toggleAll = () => {
		if (allSelected) {
			setSelected(new Set());
		} else {
			setSelected(new Set(milestoneList.map((m: any) => m.id)));
		}
	};

	const toggleOne = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleCopy = async () => {
		if (selected.size === 0) return;
		try {
			const result = await copyMutation.mutateAsync({
				organizationId,
				projectId,
				milestoneIds: Array.from(selected),
				includeEmptyMilestones: true,
			});
			toast.success(
				t("toast.copiedFromExecution", { count: result.copiedCount }),
			);
			onOpenChange(false);
		} catch {
			// handled by mutation
		}
	};

	const formatDate = (d: string | Date | null) => {
		if (!d) return null;
		try {
			return new Date(d).toLocaleDateString("ar-SA");
		} catch {
			return null;
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden flex flex-col max-h-[90dvh]">
				<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
					<DialogTitle className="text-base font-semibold">
						{t("copyExecution.title")}
					</DialogTitle>
				</DialogHeader>

				<div className="p-5 space-y-4 overflow-y-auto min-h-0 flex-1">
					{/* Select all + summary */}
					{!isLoading && milestoneList.length > 0 && (
						<div
							role="button"
							tabIndex={0}
							onClick={toggleAll}
							onKeyDown={(e) => {
								if (e.key === " " || e.key === "Enter") {
									e.preventDefault();
									toggleAll();
								}
							}}
							className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50"
						>
							<span className="flex items-center gap-2 text-sm">
								<Checkbox
									className="pointer-events-none"
									checked={allSelected}
									tabIndex={-1}
								/>
								<span className="font-medium text-slate-700 dark:text-slate-200">
									{t("copyExecution.selectAll")}
								</span>
							</span>
							<span className="text-xs text-slate-500">
								{t("copyExecution.rowsToCreate", {
									count: totalRowsToCreate,
								})}
							</span>
						</div>
					)}

					{/* Milestones List */}
					<div className="max-h-[400px] overflow-y-auto space-y-3 pe-1">
						{isLoading ? (
							<>
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3"
									>
										<Skeleton className="h-5 w-48" />
										<div className="flex gap-4">
											<Skeleton className="h-4 w-24" />
											<Skeleton className="h-4 w-24" />
										</div>
									</div>
								))}
							</>
						) : milestoneList.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
									<ClipboardList className="h-7 w-7 text-slate-400" />
								</div>
								<p className="text-sm font-medium text-slate-600 dark:text-slate-300">
									{t("copyExecution.noMilestones")}
								</p>
							</div>
						) : (
							milestoneList.map((milestone: any) => {
								const startStr = formatDate(milestone.plannedStart);
								const endStr = formatDate(milestone.plannedEnd);
								const isEmpty = milestone.activitiesCount === 0;
								return (
									<div
										key={milestone.id}
										role="button"
										tabIndex={0}
										onClick={() => toggleOne(milestone.id)}
										onKeyDown={(e) => {
											if (e.key === " " || e.key === "Enter") {
												e.preventDefault();
												toggleOne(milestone.id);
											}
										}}
										className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 transition-colors hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer"
									>
										<div className="flex items-start gap-3">
											<Checkbox
												className="mt-0.5 pointer-events-none"
												checked={selected.has(milestone.id)}
												tabIndex={-1}
											/>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<Flag className="h-4 w-4 text-blue-500 shrink-0" />
													<h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
														{milestone.title}
													</h4>
												</div>
												{milestone.description && (
													<p className="mt-1 text-xs text-slate-500 line-clamp-2">
														{milestone.description}
													</p>
												)}
												<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
													{isEmpty ? (
														<span className="flex items-center gap-1 text-slate-400">
															<Hammer className="h-3.5 w-3.5" />
															{t("copyExecution.willCreateOne")}
														</span>
													) : (
														<span className="flex items-center gap-1">
															<Hammer className="h-3.5 w-3.5 text-amber-500" />
															{t("copyExecution.activitiesCount", {
																count: milestone.activitiesCount,
															})}
														</span>
													)}
													{(startStr || endStr) && (
														<span className="flex items-center gap-1">
															<CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
															{startStr ?? "—"} / {endStr ?? "—"}
														</span>
													)}
												</div>
											</div>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex justify-between items-center gap-3">
					<Button
						type="button"
						variant="outline"
						className="rounded-xl h-10"
						onClick={() => onOpenChange(false)}
					>
						{t("actions.cancel")}
					</Button>
					<Button
						type="button"
						className="rounded-xl h-10"
						disabled={selected.size === 0 || copyMutation.isPending}
						onClick={handleCopy}
					>
						{copyMutation.isPending ? (
							<Loader2 className="h-4 w-4 me-1.5 animate-spin" />
						) : (
							<Copy className="h-4 w-4 me-1.5" />
						)}
						{t("copyExecution.copy", { count: totalRowsToCreate })}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
