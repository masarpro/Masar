"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent } from "@ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Skeleton } from "@ui/components/skeleton";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

interface Props {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

function formatCurrency(value: number): string {
	return value.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

export function FinishingItemsView({
	organizationId,
	organizationSlug,
	projectId,
}: Props) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	// Fetch phase breakdown (contains all items with phase assignments)
	const { data: breakdownData, isLoading: breakdownLoading } = useQuery(
		orpc.projectQuantities.getPhaseBreakdown.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	// Fetch studies for name lookup
	const { data: studiesData, isLoading: studiesLoading } = useQuery(
		orpc.projectQuantities.listStudies.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	// Fetch milestones for phase selector
	const { data: milestonesData, isLoading: milestonesLoading } = useQuery(
		orpc.projectTimeline.listMilestones.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	// Phase assignment mutation
	const assignMutation = useMutation({
		mutationFn: async ({
			itemId,
			phaseId,
		}: {
			itemId: string;
			phaseId: string | null;
		}) => {
			return orpcClient.projectQuantities.assignItemToPhase({
				organizationId,
				projectId,
				itemId,
				itemType: "finishing",
				phaseId,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [["projectQuantities"]],
			});
			toast.success(t("projectQuantities.toast.phaseAssigned"));
		},
		onError: () => {
			toast.error(t("projectQuantities.toast.phaseAssignError"));
		},
	});

	const isLoading = breakdownLoading || studiesLoading || milestonesLoading;

	if (isLoading) {
		return <ListTableSkeleton rows={8} cols={8} />;
	}

	// Build study name map
	const studyMap = new Map<string, string>();
	for (const study of studiesData ?? []) {
		studyMap.set(study.id, study.name ?? "");
	}

	const milestones = milestonesData?.milestones ?? [];

	// Flatten finishing items from all phases + unassigned
	type FinishingItemWithPhase = {
		id: string;
		costStudyId: string;
		category: string;
		name: string;
		area: number | null;
		quantity: number | null;
		materialPrice: number | null;
		totalCost: number;
		specifications: string | null;
		projectPhaseId: string | null;
	};

	const allItems: FinishingItemWithPhase[] = [];

	// Items from phases
	for (const phase of breakdownData?.phases ?? []) {
		for (const item of phase.finishing) {
			allItems.push({
				id: item.id,
				costStudyId: item.costStudyId,
				category: item.category,
				name: item.name,
				area: item.area,
				quantity: item.quantity,
				materialPrice: item.materialPrice,
				totalCost: item.totalCost,
				specifications: item.specifications ?? null,
				projectPhaseId: item.projectPhaseId ?? phase.milestone.id,
			});
		}
	}

	// Unassigned items
	for (const item of breakdownData?.unassigned?.finishing ?? []) {
		allItems.push({
			id: item.id,
			costStudyId: item.costStudyId,
			category: item.category,
			name: item.name,
			area: item.area,
			quantity: item.quantity,
			materialPrice: item.materialPrice,
			totalCost: item.totalCost,
			specifications: item.specifications ?? null,
			projectPhaseId: null,
		});
	}

	const grandTotal = allItems.reduce((sum, item) => sum + item.totalCost, 0);

	// Empty state
	if (allItems.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<p className="text-sm text-slate-500 dark:text-slate-400">
					{t("projectQuantities.empty.noFinishingItems")}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("projectQuantities.table.study")}</TableHead>
								<TableHead>{t("projectQuantities.table.category")}</TableHead>
								<TableHead>{t("projectQuantities.table.item")}</TableHead>
								<TableHead className="text-end">
									{t("projectQuantities.table.area")}
								</TableHead>
								<TableHead className="text-end">
									{t("projectQuantities.table.unitPrice")}
								</TableHead>
								<TableHead className="text-end">
									{t("projectQuantities.table.totalCost")}
								</TableHead>
								<TableHead>{t("projectQuantities.table.specifications")}</TableHead>
								<TableHead>{t("projectQuantities.table.phase")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{allItems.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="text-slate-600 dark:text-slate-400">
										{studyMap.get(item.costStudyId) ?? "-"}
									</TableCell>
									<TableCell className="text-slate-600 dark:text-slate-400">
										{item.category}
									</TableCell>
									<TableCell className="font-medium text-slate-900 dark:text-slate-100">
										{item.name}
									</TableCell>
									<TableCell className="text-end text-slate-600 dark:text-slate-400">
										{(item.area ?? item.quantity)?.toLocaleString("en-US") ?? "-"}
									</TableCell>
									<TableCell className="text-end text-slate-600 dark:text-slate-400">
										{item.materialPrice != null
											? formatCurrency(item.materialPrice)
											: "-"}
									</TableCell>
									<TableCell className="text-end font-medium text-slate-900 dark:text-slate-100">
										{formatCurrency(item.totalCost)}
									</TableCell>
									<TableCell
										className="max-w-[200px] truncate text-slate-500 dark:text-slate-400"
										title={item.specifications ?? undefined}
									>
										{item.specifications
											? item.specifications.length > 50
												? `${item.specifications.slice(0, 50)}...`
												: item.specifications
											: "-"}
									</TableCell>
									<TableCell>
										<Select
											value={item.projectPhaseId ?? "__none__"}
											onValueChange={(value) => {
												assignMutation.mutate({
													itemId: item.id,
													phaseId: value === "__none__" ? null : value,
												});
											}}
											disabled={assignMutation.isPending}
										>
											<SelectTrigger className="h-8 w-[160px] text-xs">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="__none__">
													\u0628\u062F\u0648\u0646 \u0645\u0631\u062D\u0644\u0629
												</SelectItem>
												{milestones.map((milestone) => (
													<SelectItem key={milestone.id} value={milestone.id}>
														{milestone.title}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</TableCell>
								</TableRow>
							))}

							{/* Total row */}
							<TableRow className="bg-slate-50 font-semibold dark:bg-slate-800/50">
								<TableCell
									colSpan={5}
									className="text-slate-900 dark:text-slate-100"
								>
									{t("projectQuantities.table.grandTotal")}
								</TableCell>
								<TableCell className="text-end text-slate-900 dark:text-slate-100">
									{formatCurrency(grandTotal)}
								</TableCell>
								<TableCell />
								<TableCell />
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
