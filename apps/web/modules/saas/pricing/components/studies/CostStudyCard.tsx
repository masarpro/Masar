"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { formatDateShort, formatSAR } from "@shared/lib/formatters";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { StatusChip } from "@ui/components/status-chip";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
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
	Copy,
	Hammer,
	MoreVertical,
	PaintBucket,
	Pencil,
	Trash2,
	Calendar,
	Boxes,
	UserSearch,
	Wrench,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import {
	SCOPE_ICONS,
	getProjectTypeColor,
} from "../../lib/study-create-config";

/** Shape of a study row returned by orpc.pricing.studies.list */
export interface CostStudyListItem {
	id: string;
	name: string | null;
	customerName: string | null;
	projectType: string;
	studyType: string;
	/** Derived server-side from stage fields: draft | in_progress | completed */
	status: string;
	workScopes?: string[] | null;
	totalCost: number | string;
	createdAt: Date | string;
	quantitiesStatus?: string | null;
	specsStatus?: string | null;
	costingStatus?: string | null;
	pricingStatus?: string | null;
	quotationStatus?: string | null;
	lead?: { id: string; name: string; status: string } | null;
	_count: {
		structuralItems: number;
		finishingItems: number;
		mepItems: number;
		laborItems: number;
		quotes: number;
	};
}

interface CostStudyCardProps {
	study: CostStudyListItem;
	basePath: string;
	onDelete?: () => void;
	onDuplicate?: () => void;
}

/**
 * Stage scalar fields that count towards progress, per study type
 * (mirrors useStudyConfig enabledStages — pipeline is 4 stages).
 */
function getEnabledStageStatuses(
	study: CostStudyListItem,
): Array<string | null | undefined> {
	switch (study.studyType) {
		case "QUICK_PRICING":
		case "CUSTOM_ITEMS":
			return [study.pricingStatus];
		case "LUMP_SUM_ANALYSIS":
			return [study.costingStatus, study.pricingStatus];
		default:
			return [
				study.quantitiesStatus,
				study.specsStatus,
				study.costingStatus,
				study.pricingStatus,
			];
	}
}

export function CostStudyCard({
	study,
	basePath,
	onDelete,
	onDuplicate,
}: CostStudyCardProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const deleteMutation = useMutation(
		orpc.pricing.studies.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.studies.deleteSuccess"));
				onDelete?.();
			},
			onError: () => {
				toast.error(t("pricing.studies.deleteError"));
			},
		}),
	);

	const duplicateMutation = useMutation(
		orpc.pricing.studies.duplicate.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.studies.duplicateSuccess"));
				onDuplicate?.();
			},
			onError: () => {
				toast.error(t("pricing.studies.duplicateError"));
			},
		}),
	);

	const handleDelete = () => {
		if (!activeOrganization) return;
		(deleteMutation as any).mutate({
			id: study.id,
			organizationId: activeOrganization.id,
		});
		setShowDeleteDialog(false);
	};

	const handleDuplicate = () => {
		if (!activeOrganization) return;
		(duplicateMutation as any).mutate({
			id: study.id,
			organizationId: activeOrganization.id,
		});
	};

	const totalItems =
		study._count.structuralItems +
		study._count.finishingItems +
		study._count.mepItems +
		study._count.laborItems;

	const accentColor = getProjectTypeColor(study.projectType);
	const workScopes = study.workScopes ?? [];

	// Stage progress: approved stages out of the stages enabled for this
	// study type — only when the list payload includes the stage scalars.
	const hasStageFields = study.pricingStatus !== undefined;
	const enabledStageStatuses = hasStageFields
		? getEnabledStageStatuses(study)
		: [];
	const approvedStages = enabledStageStatuses.filter(
		(s) => s === "APPROVED",
	).length;
	const totalStages = enabledStageStatuses.length;

	const leadHref = activeOrganization
		? `/app/${activeOrganization.slug}/pricing/leads/${study.lead?.id}`
		: null;

	return (
		<>
			<div className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm">
				{/* Top accent line */}
				<div className={`h-1 w-full ${accentColor}`} />

				{/* Card Header */}
				<div className="p-4 pb-3">
					<div className="flex items-start justify-between gap-3">
						<div className="flex-1 min-w-0">
							<Link
								href={`${basePath}/${study.id}`}
								className="group/link inline-block"
							>
								<h3 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1 group-hover/link:text-slate-600 dark:group-hover/link:text-slate-300 transition-colors">
									{study.name || t("pricing.studies.unnamed")}
								</h3>
							</Link>
							{study.customerName && (
								<p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
									{study.customerName}
								</p>
							)}
							{study.lead && leadHref && (
								<Link
									href={leadHref}
									className="mt-1 inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
									onClick={(e) => e.stopPropagation()}
								>
									<UserSearch className="h-3 w-3" />
									{study.lead.name}
								</Link>
							)}
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
								>
									<MoreVertical className="h-4 w-4 text-slate-500" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="rounded-xl w-40">
								<DropdownMenuItem asChild className="rounded-lg">
									<Link href={`${basePath}/${study.id}`}>
										<Pencil className="me-2 h-4 w-4" />
										{t("common.edit")}
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleDuplicate} className="rounded-lg">
									<Copy className="me-2 h-4 w-4" />
									{t("common.duplicate")}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-red-600 dark:text-red-400 rounded-lg focus:text-red-600 dark:focus:text-red-400"
									onClick={() => setShowDeleteDialog(true)}
								>
									<Trash2 className="me-2 h-4 w-4" />
									{t("common.delete")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Status + work scope chips */}
					<div className="mt-3 flex items-center gap-1.5 flex-wrap">
						<StatusChip status={study.status.toUpperCase()}>
							{t(`pricing.studies.status.${study.status}`)}
						</StatusChip>
						{workScopes.map((scope) => (
							<span
								key={scope}
								className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400"
							>
								<span>{SCOPE_ICONS[scope] ?? ""}</span>
								{t(`pricing.studies.create.scopes.${scope}`)}
							</span>
						))}
					</div>

					{/* Stage progress */}
					{hasStageFields && totalStages > 0 && (
						<div className="mt-3">
							<div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
								<span>
									{t("pricing.studies.stagesProgress", {
										approved: approvedStages,
										total: totalStages,
									})}
								</span>
							</div>
							<div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
								<div
									className="h-full rounded-full bg-primary transition-all"
									style={{
										width: `${totalStages > 0 ? (approvedStages / totalStages) * 100 : 0}%`,
									}}
								/>
							</div>
						</div>
					)}
				</div>

				{/* Per-section item counts */}
				{totalItems > 0 && (
					<div className="px-4 pb-3">
						<div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
							<div className="flex items-center gap-1" title={t("pricing.studies.structural.title")}>
								<Hammer className="h-3 w-3 text-orange-500" />
								<span>{study._count.structuralItems}</span>
							</div>
							<div className="flex items-center gap-1" title={t("pricing.studies.finishing.title")}>
								<PaintBucket className="h-3 w-3 text-violet-500" />
								<span>{study._count.finishingItems}</span>
							</div>
							<div className="flex items-center gap-1" title={t("pricing.studies.mep.title")}>
								<Wrench className="h-3 w-3 text-chart-4" />
								<span>{study._count.mepItems}</span>
							</div>
						</div>
					</div>
				)}

				{/* Card Footer */}
				<div className="px-4 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
							<div className="flex items-center gap-1">
								<Boxes className="h-3.5 w-3.5" />
								<span>{totalItems}</span>
							</div>
							<span>·</span>
							<div className="flex items-center gap-1">
								<Calendar className="h-3.5 w-3.5" />
								<span>{formatDateShort(study.createdAt)}</span>
							</div>
						</div>
						<span className="text-base font-semibold text-slate-900 dark:text-slate-100">
							{formatSAR(study.totalCost)}
						</span>
					</div>
				</div>
			</div>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("pricing.studies.deleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("pricing.studies.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="rounded-xl bg-red-600 text-white hover:bg-red-700"
						>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
