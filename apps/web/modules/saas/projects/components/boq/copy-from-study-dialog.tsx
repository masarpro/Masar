"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
	Copy,
	Loader2,
	PackageOpen,
	HardHat,
	PaintBucket,
	Zap,
	Hammer,
	Link2,
} from "lucide-react";
import {
	useAvailableCostStudies,
	useCopyFromCostStudy,
} from "@saas/projects/hooks/use-project-boq";

interface CopyFromStudyDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	projectId: string;
}

export function CopyFromStudyDialog({
	open,
	onOpenChange,
	organizationId,
	projectId,
}: CopyFromStudyDialogProps) {
	const t = useTranslations("projectBoq");

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	// Debounce search input
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	const { data: studies, isLoading } = useAvailableCostStudies(
		organizationId,
		projectId,
		debouncedSearch || undefined,
	);

	const copyMutation = useCopyFromCostStudy();

	const handleCopy = async (studyId: string) => {
		try {
			const result = await copyMutation.mutateAsync({
				organizationId,
				projectId,
				studyId,
				includeUnpriced: true,
			});
			toast.success(t("toast.copiedFromStudy", { count: result.copiedCount }));
			onOpenChange(false);
		} catch {
			// Error handled by mutation
		}
	};

	const studyList = Array.isArray(studies) ? studies : [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden">
				<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
					<DialogTitle className="text-base font-semibold">
						{t("copyStudy.title")}
					</DialogTitle>
				</DialogHeader>

				<div className="p-5 space-y-4">
					{/* Search Input */}
					<div className="relative">
						<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							value={search}
							onChange={(e: any) => setSearch(e.target.value)}
							placeholder={t("copyStudy.search")}
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
											<Skeleton className="h-4 w-24" />
											<Skeleton className="h-4 w-24" />
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
									{t("copyStudy.noStudies")}
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

									{/* Item Counts */}
									<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
										{study._count?.structuralItems > 0 && (
											<span className="flex items-center gap-1">
												<HardHat className="h-3.5 w-3.5 text-blue-500" />
												{t("section.STRUCTURAL")} ({study._count.structuralItems})
											</span>
										)}
										{study._count?.finishingItems > 0 && (
											<span className="flex items-center gap-1">
												<PaintBucket className="h-3.5 w-3.5 text-amber-500" />
												{t("section.FINISHING")} ({study._count.finishingItems})
											</span>
										)}
										{study._count?.mepItems > 0 && (
											<span className="flex items-center gap-1">
												<Zap className="h-3.5 w-3.5 text-emerald-500" />
												{t("section.MEP")} ({study._count.mepItems})
											</span>
										)}
										{study._count?.laborItems > 0 && (
											<span className="flex items-center gap-1">
												<Hammer className="h-3.5 w-3.5 text-orange-500" />
												{t("section.LABOR")} ({study._count.laborItems})
											</span>
										)}
									</div>

									{/* Linked to project badge */}
									{study.projectId && (
										<div className="mt-2">
											<span className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg">
												<Link2 className="h-3 w-3" />
												{t("copyStudy.linkedTo", { name: study.project?.name || "" })}
											</span>
										</div>
									)}

									{/* Copy Button */}
									<div className="mt-3 flex justify-end">
										<Button
											size="sm"
											variant="outline"
											className="rounded-xl h-9"
											disabled={copyMutation.isPending}
											onClick={() => handleCopy(study.id)}
										>
											{copyMutation.isPending &&
											copyMutation.variables?.studyId === study.id ? (
												<Loader2 className="h-4 w-4 me-1.5 animate-spin" />
											) : (
												<Copy className="h-4 w-4 me-1.5" />
											)}
											{t("copyStudy.copy")}
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
						{t("actions.cancel")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
