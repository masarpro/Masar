"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Checkbox } from "@ui/components/checkbox";
import { Skeleton } from "@ui/components/skeleton";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import {
	Search,
	Loader2,
	HardHat,
	PaintBucket,
	Zap,
	Hammer,
	ArrowRight,
	PackageOpen,
	Plus,
	Flag,
} from "lucide-react";
import { toast } from "sonner";
import {
	useAvailableCostStudies,
	useStudyItemsDetail,
	useAddStudyItemsToPhase,
} from "@saas/projects/hooks/use-project-boq";

interface AddStudyItemsToPhaseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	projectId: string;
	targetPhaseId: string | null;
	targetPhaseTitle: string;
}

type Kind = "STRUCTURAL" | "FINISHING" | "MEP" | "LABOR";

const KIND_ICONS: Record<Kind, any> = {
	STRUCTURAL: HardHat,
	FINISHING: PaintBucket,
	MEP: Zap,
	LABOR: Hammer,
};

const KIND_COLORS: Record<Kind, string> = {
	STRUCTURAL: "text-chart-4",
	FINISHING: "text-amber-500",
	MEP: "text-emerald-500",
	LABOR: "text-orange-500",
};

function formatNumber(v: number | null | undefined) {
	if (v == null) return "—";
	return new Intl.NumberFormat("en-US").format(v);
}

export function AddStudyItemsToPhaseDialog({
	open,
	onOpenChange,
	organizationId,
	projectId,
	targetPhaseId,
	targetPhaseTitle,
}: AddStudyItemsToPhaseDialogProps) {
	const t = useTranslations("projectBoq");

	const [step, setStep] = useState<"pickStudy" | "pickItems">("pickStudy");
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);
	const [selectedStudyName, setSelectedStudyName] = useState<string>("");
	const [selected, setSelected] = useState<Set<string>>(new Set());

	// Reset on close
	useEffect(() => {
		if (!open) {
			setStep("pickStudy");
			setSearch("");
			setDebouncedSearch("");
			setSelectedStudyId(null);
			setSelectedStudyName("");
			setSelected(new Set());
		}
	}, [open]);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	const { data: studies, isLoading: studiesLoading } = useAvailableCostStudies(
		organizationId,
		projectId,
		debouncedSearch || undefined,
	);
	const studyList = Array.isArray(studies) ? studies : [];

	const { data: detail, isLoading: detailLoading } = useStudyItemsDetail(
		organizationId,
		projectId,
		step === "pickItems" ? selectedStudyId : null,
	);

	const addMutation = useAddStudyItemsToPhase();

	const allItems = useMemo(() => {
		if (!detail) return [] as Array<{ id: string; kind: Kind }>;
		return [
			...detail.structural.map((it: any) => ({ id: it.id, kind: "STRUCTURAL" as Kind })),
			...detail.finishing.map((it: any) => ({ id: it.id, kind: "FINISHING" as Kind })),
			...detail.mep.map((it: any) => ({ id: it.id, kind: "MEP" as Kind })),
			...detail.labor.map((it: any) => ({ id: it.id, kind: "LABOR" as Kind })),
		];
	}, [detail]);

	const totalAvailable = allItems.length;
	const totalSelected = selected.size;

	const toggleOne = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const toggleSection = (kind: Kind, items: Array<{ id: string }>) => {
		const allSelected = items.every((it) => selected.has(it.id));
		setSelected((prev) => {
			const next = new Set(prev);
			if (allSelected) {
				for (const it of items) next.delete(it.id);
			} else {
				for (const it of items) next.add(it.id);
			}
			return next;
		});
	};

	const handlePickStudy = (id: string, name: string) => {
		setSelectedStudyId(id);
		setSelectedStudyName(name);
		setStep("pickItems");
	};

	const handleSubmit = async () => {
		if (!selectedStudyId || selected.size === 0) return;

		const selectedItems = allItems.filter((it) => selected.has(it.id));

		try {
			const result = await addMutation.mutateAsync({
				organizationId,
				projectId,
				studyId: selectedStudyId,
				targetPhaseId,
				items: selectedItems,
				includeUnpriced: true,
			});
			toast.success(
				t("toast.addedToPhase", {
					count: result.copiedCount,
					phase: targetPhaseTitle,
				}),
			);
			onOpenChange(false);
		} catch {
			/* mutation handles error */
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-3xl p-0 gap-0 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
				<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-4 shrink-0">
					<DialogTitle className="text-base font-semibold">
						{t("addStudyToPhase.title")}
					</DialogTitle>
					<div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
						<Flag className="h-3.5 w-3.5 text-chart-4" />
						<span>{targetPhaseTitle}</span>
						{step === "pickItems" && selectedStudyName && (
							<>
								<ArrowRight className="h-3 w-3" />
								<span>{selectedStudyName}</span>
							</>
						)}
					</div>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto p-5">
					{step === "pickStudy" ? (
						<div className="space-y-4">
							<div className="relative">
								<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
								<Input
									value={search}
									onChange={(e: any) => setSearch(e.target.value)}
									placeholder={t("addStudyToPhase.selectStudyHint")}
									className="ps-9 rounded-xl h-10"
								/>
							</div>

							<div className="space-y-3">
								{studiesLoading ? (
									[1, 2, 3].map((i) => (
										<Skeleton key={i} className="h-20 rounded-xl" />
									))
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
										<button
											key={study.id}
											type="button"
											onClick={() => handlePickStudy(study.id, study.name)}
											className="w-full text-start rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
										>
											<div className="flex items-start justify-between gap-3">
												<div className="min-w-0 flex-1">
													<h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
														{study.name}
													</h4>
													<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
														{study.itemCounts?.structuralItems > 0 && (
															<span className="flex items-center gap-1">
																<HardHat className="h-3.5 w-3.5 text-chart-4" />
																{study.itemCounts.structuralItems}
															</span>
														)}
														{study.itemCounts?.finishingItems > 0 && (
															<span className="flex items-center gap-1">
																<PaintBucket className="h-3.5 w-3.5 text-amber-500" />
																{study.itemCounts.finishingItems}
															</span>
														)}
														{study.itemCounts?.mepItems > 0 && (
															<span className="flex items-center gap-1">
																<Zap className="h-3.5 w-3.5 text-emerald-500" />
																{study.itemCounts.mepItems}
															</span>
														)}
														{study.itemCounts?.laborItems > 0 && (
															<span className="flex items-center gap-1">
																<Hammer className="h-3.5 w-3.5 text-orange-500" />
																{study.itemCounts.laborItems}
															</span>
														)}
													</div>
												</div>
												<ArrowRight className="h-4 w-4 text-slate-400 shrink-0 mt-1 rtl:rotate-180" />
											</div>
										</button>
									))
								)}
							</div>
						</div>
					) : (
						<div className="space-y-4">
							{detailLoading ? (
								<div className="space-y-3">
									{[1, 2, 3].map((i) => (
										<Skeleton key={i} className="h-16 rounded-xl" />
									))}
								</div>
							) : !detail || totalAvailable === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
										<PackageOpen className="h-7 w-7 text-slate-400" />
									</div>
									<p className="text-sm font-medium text-slate-600 dark:text-slate-300">
										{t("addStudyToPhase.noItemsInStudy")}
									</p>
								</div>
							) : (
								<>
									<div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 flex items-center justify-between">
										<span className="text-xs text-slate-600 dark:text-slate-300">
											{t("addStudyToPhase.selectedCount", { count: totalSelected })}
										</span>
										<button
											type="button"
											className="text-xs text-slate-600 hover:text-slate-900 underline"
											onClick={() => {
												setStep("pickStudy");
												setSelected(new Set());
											}}
										>
											{t("addStudyToPhase.backToStudies")}
										</button>
									</div>

									{(["STRUCTURAL", "FINISHING", "MEP", "LABOR"] as Kind[]).map(
										(kind) => {
											const items: any[] =
												kind === "STRUCTURAL"
													? detail.structural
													: kind === "FINISHING"
														? detail.finishing
														: kind === "MEP"
															? detail.mep
															: detail.labor;
											if (items.length === 0) return null;
											const Icon = KIND_ICONS[kind];
											const colorCls = KIND_COLORS[kind];
											const allInKindSelected = items.every((it) =>
												selected.has(it.id),
											);

											return (
												<KindSection
													key={kind}
													kind={kind}
													items={items}
													icon={Icon}
													iconColor={colorCls}
													allSelected={allInKindSelected}
													selected={selected}
													onToggleOne={toggleOne}
													onToggleAll={() => toggleSection(kind, items)}
													t={t}
												/>
											);
										},
									)}
								</>
							)}
						</div>
					)}
				</div>

				<div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex justify-between items-center gap-3 shrink-0">
					<Button
						type="button"
						variant="outline"
						className="rounded-xl h-10"
						onClick={() => onOpenChange(false)}
					>
						{t("actions.cancel")}
					</Button>
					{step === "pickItems" && (
						<Button
							type="button"
							className="rounded-xl h-10"
							disabled={totalSelected === 0 || addMutation.isPending}
							onClick={handleSubmit}
						>
							{addMutation.isPending ? (
								<Loader2 className="h-4 w-4 me-1.5 animate-spin" />
							) : (
								<Plus className="h-4 w-4 me-1.5" />
							)}
							{t("addStudyToPhase.addToPhase", {
								phase: targetPhaseTitle,
							})}{" "}
							{totalSelected > 0 ? `(${totalSelected})` : ""}
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

function KindSection({
	kind,
	items,
	icon: Icon,
	iconColor,
	allSelected,
	selected,
	onToggleOne,
	onToggleAll,
	t,
}: {
	kind: Kind;
	items: any[];
	icon: any;
	iconColor: string;
	allSelected: boolean;
	selected: Set<string>;
	onToggleOne: (id: string) => void;
	onToggleAll: () => void;
	t: any;
}) {
	return (
		<div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
			<div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
				<div className="flex items-center gap-2">
					<Icon className={`h-4 w-4 ${iconColor}`} />
					<span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
						{t(`addStudyToPhase.kind.${kind}`)}
					</span>
					<span className="text-xs text-slate-500">({items.length})</span>
				</div>
				<button
					type="button"
					className="text-xs text-slate-600 hover:text-slate-900 underline"
					onClick={onToggleAll}
				>
					{allSelected
						? t("addStudyToPhase.unselectAllInSection")
						: t("addStudyToPhase.selectAllInSection")}
				</button>
			</div>
			<div className="divide-y divide-slate-100 dark:divide-slate-800">
				{items.map((item) => (
					<div
						key={item.id}
						role="button"
						tabIndex={0}
						onClick={() => onToggleOne(item.id)}
						onKeyDown={(e) => {
							if (e.key === " " || e.key === "Enter") {
								e.preventDefault();
								onToggleOne(item.id);
							}
						}}
						className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 cursor-pointer"
					>
						<Checkbox
							className="pointer-events-none"
							checked={selected.has(item.id)}
							tabIndex={-1}
						/>
						<div className="min-w-0 flex-1">
							<div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
								{item.name}
							</div>
							<div className="text-xs text-slate-500 mt-0.5 truncate">
								{item.category}
								{item.subCategory && ` / ${item.subCategory}`}
								{item.floorName && ` • ${item.floorName}`}
							</div>
						</div>
						<div className="text-end text-xs font-mono text-slate-600 dark:text-slate-300 shrink-0">
							<div>
								{kind === "LABOR"
									? `${formatNumber(item.quantity * item.durationDays)} ${t("addStudyToPhase.workDays")}`
									: `${formatNumber(item.quantity ?? item.area)} ${item.unit ?? ""}`}
							</div>
							{item.totalCost > 0 && (
								<div className="text-emerald-600 dark:text-emerald-400 mt-0.5">
									{new Intl.NumberFormat("en-SA", {
										style: "currency",
										currency: "SAR",
										maximumFractionDigits: 0,
									}).format(item.totalCost)}
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
