"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
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
	Building2,
	Copy,
	MoreVertical,
	Pencil,
	Trash2,
	Layers,
	Calendar,
	Boxes,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatCurrency } from "../lib/utils";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

interface CostStudyCardProps {
	study: {
		id: string;
		name: string | null;
		customerName: string | null;
		projectType: string;
		buildingArea: number;
		numberOfFloors: number;
		finishingLevel: string;
		status: string;
		totalCost: number;
		createdAt: Date;
		_count: {
			structuralItems: number;
			finishingItems: number;
			mepItems: number;
			laborItems: number;
			quotes: number;
		};
	};
	basePath: string;
	onDelete?: () => void;
	onDuplicate?: () => void;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
	draft: {
		bg: "bg-slate-100 dark:bg-slate-800",
		text: "text-slate-600 dark:text-slate-400",
		dot: "bg-slate-400",
	},
	in_progress: {
		bg: "bg-amber-50 dark:bg-amber-950/50",
		text: "text-amber-700 dark:text-amber-400",
		dot: "bg-amber-500",
	},
	completed: {
		bg: "bg-teal-50 dark:bg-teal-950/50",
		text: "text-teal-700 dark:text-teal-400",
		dot: "bg-teal-500",
	},
	approved: {
		bg: "bg-indigo-50 dark:bg-indigo-950/50",
		text: "text-indigo-700 dark:text-indigo-400",
		dot: "bg-indigo-500",
	},
};

const PROJECT_TYPE_COLORS: Record<string, { accent: string; bg: string }> = {
	residential: { accent: "bg-sky-500", bg: "bg-sky-50 dark:bg-sky-950/30" },
	commercial: { accent: "bg-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
	industrial: { accent: "bg-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
	mixed: { accent: "bg-teal-500", bg: "bg-teal-50 dark:bg-teal-950/30" },
};

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
		orpc.quantities.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("quantities.deleteSuccess"));
				onDelete?.();
			},
			onError: () => {
				toast.error(t("quantities.deleteError"));
			},
		}),
	);

	const duplicateMutation = useMutation(
		orpc.quantities.duplicate.mutationOptions({
			onSuccess: () => {
				toast.success(t("quantities.duplicateSuccess"));
				onDuplicate?.();
			},
			onError: () => {
				toast.error(t("quantities.duplicateError"));
			},
		}),
	);

	const handleDelete = () => {
		if (!activeOrganization) return;
		deleteMutation.mutate({
			id: study.id,
			organizationId: activeOrganization.id,
		});
		setShowDeleteDialog(false);
	};

	const handleDuplicate = () => {
		if (!activeOrganization) return;
		duplicateMutation.mutate({
			id: study.id,
			organizationId: activeOrganization.id,
		});
	};

	const totalItems =
		study._count.structuralItems +
		study._count.finishingItems +
		study._count.mepItems +
		study._count.laborItems;

	const statusConfig = STATUS_CONFIG[study.status] || STATUS_CONFIG.draft;
	const projectColors = PROJECT_TYPE_COLORS[study.projectType] || PROJECT_TYPE_COLORS.residential;

	const createdDate = new Date(study.createdAt).toLocaleDateString("ar-SA", {
		month: "short",
		day: "numeric",
	});

	return (
		<>
			<div className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm">
				{/* Top accent line */}
				<div className={`h-1 w-full ${projectColors.accent}`} />

				{/* Card Header */}
				<div className="p-4 pb-3">
					<div className="flex items-start justify-between gap-3">
						<div className="flex-1 min-w-0">
							<Link
								href={`${basePath}/${study.id}`}
								className="group/link inline-block"
							>
								<h3 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1 group-hover/link:text-slate-600 dark:group-hover/link:text-slate-300 transition-colors">
									{study.name || t("quantities.unnamed")}
								</h3>
							</Link>
							{study.customerName && (
								<p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
									{study.customerName}
								</p>
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
										<Pencil className="ml-2 h-4 w-4" />
										{t("common.edit")}
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleDuplicate} className="rounded-lg">
									<Copy className="ml-2 h-4 w-4" />
									{t("common.duplicate")}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-red-600 dark:text-red-400 rounded-lg focus:text-red-600 dark:focus:text-red-400"
									onClick={() => setShowDeleteDialog(true)}
								>
									<Trash2 className="ml-2 h-4 w-4" />
									{t("common.delete")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Status Badge */}
					<div className="mt-3">
						<span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
							<span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
							{t(`quantities.status.${study.status}`)}
						</span>
					</div>
				</div>

				{/* Card Details */}
				<div className="px-4 pb-3">
					<div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
						<div className="flex items-center gap-1.5">
							<Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
							<span>{study.buildingArea} م²</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Layers className="h-4 w-4 text-slate-400 dark:text-slate-500" />
							<span>{study.numberOfFloors} {t("quantities.floors")}</span>
						</div>
					</div>
				</div>

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
								<span>{createdDate}</span>
							</div>
						</div>
						<span className="text-base font-semibold text-slate-900 dark:text-slate-100">
							{formatCurrency(study.totalCost)}
						</span>
					</div>
				</div>
			</div>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("quantities.deleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("quantities.deleteDescription")}
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
