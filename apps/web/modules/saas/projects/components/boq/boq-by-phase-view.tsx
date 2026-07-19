"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@ui/components/accordion";
import {
	Flag,
	Plus,
	Copy as CopyIcon,
	Layers,
	Pencil,
	Trash2,
	Inbox,
} from "lucide-react";
import { toast } from "sonner";
import {
	useBOQGroupedByPhase,
	useDeleteBOQItem,
} from "@saas/projects/hooks/use-project-boq";
import { usePermission } from "@saas/permissions/hooks/use-permission";
import { formatSAR } from "@shared/lib/formatters";

interface BOQByPhaseViewProps {
	organizationId: string;
	projectId: string;
	onAddFromStudy: (phaseId: string | null, phaseTitle: string) => void;
	onAddManual: (phaseId: string | null, phaseTitle: string) => void;
	onEditItem: (item: any) => void;
}

function formatNumber(v: number | null | undefined) {
	if (v == null) return "—";
	return new Intl.NumberFormat("en-US").format(v);
}

export function BOQByPhaseView({
	organizationId,
	projectId,
	onAddFromStudy,
	onAddManual,
	onEditItem,
}: BOQByPhaseViewProps) {
	const t = useTranslations("projectBoq");
	const { can } = usePermission();
	// الأسعار بيانات مالية — الخادم يحجبها لمن لا يملك الصلاحية، والأعمدة تُخفى
	const showPrices =
		can("projects", "viewFinance") || can("quantities", "pricing");
	const { data, isLoading } = useBOQGroupedByPhase(organizationId, projectId);
	const deleteMutation = useDeleteBOQItem();
	const [pendingDelete, setPendingDelete] = useState<string | null>(null);

	const handleDelete = async () => {
		if (!pendingDelete) return;
		try {
			await deleteMutation.mutateAsync({
				organizationId,
				projectId,
				itemId: pendingDelete,
			});
			toast.success(t("toast.itemDeleted"));
		} catch {
			/* mutation handles error */
		}
		setPendingDelete(null);
	};

	if (isLoading) {
		return (
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-20 rounded-2xl" />
				))}
			</div>
		);
	}

	if (!data) return null;

	const phases = data.phases ?? [];
	const unassigned = data.unassigned;
	const hasPhases = phases.length > 0;
	const hasUnassigned = (unassigned?.count ?? 0) > 0;

	if (!hasPhases && !hasUnassigned) {
		return (
			<Card className="rounded-2xl border-2 p-10 text-center">
				<div className="flex justify-center mb-4">
					<div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
						<Inbox className="h-7 w-7 text-muted-foreground" />
					</div>
				</div>
				<p className="text-sm font-medium text-muted-foreground">
					{t("phaseView.noPhases")}
				</p>
			</Card>
		);
	}

	const defaultOpen = [
		...phases.slice(0, 2).map((p: any) => p.milestone.id),
		...(hasUnassigned ? ["__unassigned__"] : []),
	];

	return (
		<>
			<Accordion type="multiple" defaultValue={defaultOpen} className="space-y-3">
				{phases.map((p: any) => (
					<PhaseCard
						key={p.milestone.id}
						phase={p}
						showPrices={showPrices}
						onAddFromStudy={() =>
							onAddFromStudy(p.milestone.id, p.milestone.title)
						}
						onAddManual={() =>
							onAddManual(p.milestone.id, p.milestone.title)
						}
						onEditItem={onEditItem}
						onDeleteItem={(id) => setPendingDelete(id)}
						t={t}
					/>
				))}

				{hasUnassigned && (
					<PhaseCard
						key="__unassigned__"
						phase={{
							milestone: {
								id: "__unassigned__",
								title: t("phaseView.unassigned"),
							},
							items: unassigned.items,
							total: unassigned.total,
							count: unassigned.count,
							pricedCount: unassigned.pricedCount,
							unpricedCount: unassigned.unpricedCount,
						}}
						showPrices={showPrices}
						isUnassigned
						onAddFromStudy={() =>
							onAddFromStudy(null, t("phaseView.unassigned"))
						}
						onAddManual={() => onAddManual(null, t("phaseView.unassigned"))}
						onEditItem={onEditItem}
						onDeleteItem={(id) => setPendingDelete(id)}
						t={t}
					/>
				)}
			</Accordion>

			<AlertDialog
				open={pendingDelete !== null}
				onOpenChange={(open: any) => !open && setPendingDelete(null)}
			>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("confirm.deleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("confirm.deleteItem")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("actions.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={handleDelete}
						>
							{t("actions.deleteSelected")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

function PhaseCard({
	phase,
	showPrices,
	isUnassigned,
	onAddFromStudy,
	onAddManual,
	onEditItem,
	onDeleteItem,
	t,
}: {
	phase: any;
	showPrices: boolean;
	isUnassigned?: boolean;
	onAddFromStudy: () => void;
	onAddManual: () => void;
	onEditItem: (it: any) => void;
	onDeleteItem: (id: string) => void;
	t: any;
}) {
	const m = phase.milestone;
	const count = phase.count ?? 0;
	const total = phase.total ?? 0;

	return (
		<AccordionItem
			value={m.id}
			className="rounded-2xl border-2 bg-card overflow-hidden"
		>
			<AccordionTrigger className="px-4 py-3 hover:no-underline">
				<div className="flex flex-1 items-center justify-between gap-3">
					<div className="flex items-center gap-2 min-w-0">
						{isUnassigned ? (
							<Inbox className="h-4 w-4 text-muted-foreground shrink-0" />
						) : (
							<Flag className="h-4 w-4 text-chart-4 shrink-0" />
						)}
						<span className="text-sm font-semibold text-card-foreground truncate">
							{m.title}
						</span>
					</div>
					<div className="flex items-center gap-2 flex-wrap text-xs">
						<span className="rounded-lg bg-muted px-2 py-0.5 text-muted-foreground">
							<Layers className="inline h-3 w-3 me-1" />
							{t("phaseView.itemsCount", { count })}
						</span>
						{showPrices && total > 0 && (
							<span className="rounded-lg bg-success/15 px-2 py-0.5 text-success">
								{formatSAR(total)}
							</span>
						)}
					</div>
				</div>
			</AccordionTrigger>
			<AccordionContent>
				<div className="px-4 pb-4 space-y-3">
					<div className="flex flex-wrap items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							className="rounded-xl"
							onClick={(e) => {
								e.stopPropagation();
								onAddFromStudy();
							}}
						>
							<CopyIcon className="h-4 w-4 me-1.5" />
							{t("phaseView.addFromStudy")}
						</Button>
						<Button
							size="sm"
							variant="outline"
							className="rounded-xl"
							onClick={(e) => {
								e.stopPropagation();
								onAddManual();
							}}
						>
							<Plus className="h-4 w-4 me-1.5" />
							{t("phaseView.addManual")}
						</Button>
					</div>

					{count === 0 ? (
						<div className="rounded-xl border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
							{t("phaseView.emptyPhase")}
						</div>
					) : (
						<div className="overflow-x-auto rounded-xl border-2">
							<table className="w-full text-sm">
								<thead>
									<tr className="text-xs text-muted-foreground">
										<th className="text-start py-2 px-3 font-medium">
											{t("table.code")}
										</th>
										<th className="text-start py-2 px-3 font-medium">
											{t("table.description")}
										</th>
										<th className="text-start py-2 px-3 font-medium">
											{t("table.unit")}
										</th>
										<th className="text-end py-2 px-3 font-medium">
											{t("table.quantity")}
										</th>
										{showPrices && (
											<th className="text-end py-2 px-3 font-medium">
												{t("table.unitPrice")}
											</th>
										)}
										{showPrices && (
											<th className="text-end py-2 px-3 font-medium">
												{t("table.totalPrice")}
											</th>
										)}
										<th className="py-2 px-3"></th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{phase.items.map((item: any) => (
										<tr
											key={item.id}
											className="hover:bg-muted/50"
										>
											<td className="py-2 px-3 text-xs text-muted-foreground">
												{item.code ?? "—"}
											</td>
											<td className="py-2 px-3">
												<div className="font-medium text-card-foreground">
													{item.description}
												</div>
												{item.category && (
													<div className="text-xs text-muted-foreground mt-0.5">
														{item.category}
													</div>
												)}
											</td>
											<td className="py-2 px-3 text-xs text-muted-foreground">
												{item.unit}
											</td>
											<td className="py-2 px-3 text-end font-mono text-xs">
												{formatNumber(item.quantity)}
											</td>
											{showPrices && (
												<td className="py-2 px-3 text-end font-mono text-xs">
													{item.unitPrice != null
														? formatNumber(item.unitPrice)
														: <span className="text-chart-1">{t("table.noPrice")}</span>}
												</td>
											)}
											{showPrices && (
												<td className="py-2 px-3 text-end font-mono text-xs font-semibold">
													{item.totalPrice != null
														? formatSAR(item.totalPrice)
														: "—"}
												</td>
											)}
											<td className="py-2 px-3">
												<div className="flex items-center justify-end gap-1">
													<Button
														size="sm"
														variant="ghost"
														className="h-7 w-7 p-0 rounded-lg"
														onClick={(e) => {
															e.stopPropagation();
															onEditItem(item);
														}}
													>
														<Pencil className="h-3.5 w-3.5" />
													</Button>
													<Button
														size="sm"
														variant="ghost"
														className="h-7 w-7 p-0 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
														onClick={(e) => {
															e.stopPropagation();
															onDeleteItem(item.id);
														}}
													>
														<Trash2 className="h-3.5 w-3.5" />
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}
