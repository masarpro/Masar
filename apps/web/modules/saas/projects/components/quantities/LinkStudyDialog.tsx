"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Skeleton } from "@ui/components/skeleton";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { toast } from "sonner";
import {
	Search,
	Link2,
	Loader2,
	Building2,
	Layers,
	Calculator,
	PackageOpen,
} from "lucide-react";

interface LinkStudyDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	projectId: string;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function LinkStudyDialog({
	open,
	onOpenChange,
	organizationId,
	projectId,
}: LinkStudyDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	// Debounce search input
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	const { data: studies, isLoading } = useQuery(
		orpc.projectQuantities.getAvailableStudies.queryOptions({
			input: {
				organizationId,
				projectId,
				search: debouncedSearch || undefined,
			},
		}),
	);

	const linkMutation = useMutation({
		mutationFn: async (studyId: string) => {
			return orpcClient.projectQuantities.linkStudy({
				organizationId,
				projectId,
				studyId,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [["projectQuantities"]],
			});
			toast.success(t("projectQuantities.linkDialog.toast.studyLinked"));
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(
				error.message ||
					t("projectQuantities.linkDialog.toast.linkError"),
			);
		},
	});

	const studyList = Array.isArray(studies) ? studies : [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden">
				{/* Header */}
				<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
					<DialogTitle className="text-base font-semibold">
						{t("projectQuantities.linkDialog.title")}
					</DialogTitle>
				</DialogHeader>

				<div className="p-5 space-y-4">
					{/* Search Input */}
					<div className="relative">
						<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t(
								"projectQuantities.linkDialog.searchPlaceholder",
							)}
							className="ps-9 rounded-xl h-10"
						/>
					</div>

					{/* Studies List */}
					<div className="max-h-[400px] overflow-y-auto space-y-3">
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
											<Skeleton className="h-4 w-32" />
										</div>
										<Skeleton className="h-9 w-24" />
									</div>
								))}
							</>
						) : studyList.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
									<PackageOpen className="h-7 w-7 text-slate-400" />
								</div>
								<p className="text-sm font-medium text-slate-600 dark:text-slate-300">
									{t(
										"projectQuantities.linkDialog.emptyState.title",
									)}
								</p>
								<p className="text-xs text-slate-400 mt-1 max-w-xs">
									{t(
										"projectQuantities.linkDialog.emptyState.description",
									)}
								</p>
							</div>
						) : (
							studyList.map((study: any) => (
								<div
									key={study.id}
									className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
								>
									{/* Study Name */}
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
												{study.name}
											</h4>
										</div>
									</div>

									{/* Study Details */}
									<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
										{study.projectType && (
											<span className="flex items-center gap-1">
												<Building2 className="h-3.5 w-3.5" />
												{study.projectType}
											</span>
										)}
										{study.buildingArea != null && (
											<span className="flex items-center gap-1">
												<Layers className="h-3.5 w-3.5" />
												{t(
													"projectQuantities.linkDialog.buildingArea",
												)}
												:{" "}
												{Number(
													study.buildingArea,
												).toLocaleString("en-US")}{" "}
												{t(
													"projectQuantities.linkDialog.sqm",
												)}
											</span>
										)}
										{study.numberOfFloors != null && (
											<span className="flex items-center gap-1">
												{t(
													"projectQuantities.linkDialog.floors",
												)}
												: {study.numberOfFloors}
											</span>
										)}
										{study.totalCost != null && (
											<span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
												<Calculator className="h-3.5 w-3.5" />
												{formatCurrency(
													Number(study.totalCost),
												)}
											</span>
										)}
										{study.itemCounts != null && (
											<span>
												{t(
													"projectQuantities.linkDialog.items",
												)}
												: {study.itemCounts}
											</span>
										)}
									</div>

									{/* Link Button */}
									<div className="mt-3 flex justify-end">
										<Button
											size="sm"
											variant="outline"
											className="rounded-xl h-9"
											disabled={
												linkMutation.isPending
											}
											onClick={() =>
												linkMutation.mutate(study.id)
											}
										>
											{linkMutation.isPending &&
											linkMutation.variables ===
												study.id ? (
												<Loader2 className="h-4 w-4 me-1.5 animate-spin" />
											) : (
												<Link2 className="h-4 w-4 me-1.5" />
											)}
											{t(
												"projectQuantities.linkDialog.linkButton",
											)}
										</Button>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex justify-end">
					<Button
						type="button"
						variant="outline"
						className="rounded-xl h-10"
						onClick={() => onOpenChange(false)}
					>
						{t("common.cancel")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
