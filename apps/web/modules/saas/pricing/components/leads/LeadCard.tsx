"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
	Calendar,
	Eye,
	MapPin,
	MoreVertical,
	Pencil,
	Phone,
	Trash2,
	User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { LeadPriorityIndicator } from "./LeadPriorityIndicator";

interface LeadCardProps {
	lead: {
		id: string;
		name: string;
		phone?: string | null;
		email?: string | null;
		company?: string | null;
		projectType?: string | null;
		projectLocation?: string | null;
		estimatedArea?: number | null;
		estimatedValue?: number | null;
		status: string;
		priority: string;
		source?: string | null;
		createdAt: string | Date;
		assignedTo?: { id: string; name: string; image?: string | null } | null;
		_count?: { files: number; activities: number };
	};
	basePath: string;
	organizationId: string;
	onDelete?: () => void;
}

const STATUS_ACCENT: Record<string, string> = {
	NEW: "bg-blue-500",
	STUDYING: "bg-amber-500",
	QUOTED: "bg-violet-500",
	NEGOTIATING: "bg-orange-500",
	WON: "bg-teal-500",
	LOST: "bg-red-400",
};

export function LeadCard({ lead, basePath, organizationId, onDelete }: LeadCardProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const deleteMutation = useMutation(
		orpc.pricing.leads.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.leads.messages.deleteSuccess"));
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.list.queryOptions({ input: { organizationId } }).queryKey,
				});
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.getStats.queryOptions({ input: { organizationId } }).queryKey,
				});
				onDelete?.();
				setShowDeleteDialog(false);
			},
			onError: () => {
				toast.error(t("pricing.leads.messages.deleteError"));
			},
		}),
	);

	const handleDelete = () => {
		deleteMutation.mutate({ organizationId, leadId: lead.id });
	};

	const accent = STATUS_ACCENT[lead.status] ?? "bg-slate-400";

	const createdDate = new Date(lead.createdAt).toLocaleDateString("ar-SA", {
		month: "short",
		day: "numeric",
	});

	const estimatedValue = lead.estimatedValue
		? new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(lead.estimatedValue)
		: null;

	return (
		<>
			<div className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm">
				{/* Top accent line */}
				<div className={`h-1 w-full ${accent}`} />

				{/* Card Header */}
				<div className="p-4 pb-3">
					<div className="flex items-start justify-between gap-3">
						<div className="flex-1 min-w-0">
							<Link
								href={`${basePath}/${lead.id}`}
								className="group/link inline-block"
							>
								<h3 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1 group-hover/link:text-slate-600 dark:group-hover/link:text-slate-300 transition-colors">
									{lead.name}
								</h3>
							</Link>
							{lead.company && (
								<div className="flex items-center gap-1.5 mt-0.5">
									<Building2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
									<p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
										{lead.company}
									</p>
								</div>
							)}
							{lead.phone && (
								<div className="flex items-center gap-1.5 mt-0.5">
									<Phone className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
									<p className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">
										{lead.phone}
									</p>
								</div>
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
									<Link href={`${basePath}/${lead.id}`}>
										<Eye className="me-2 h-4 w-4" />
										{t("pricing.leads.actions.view")}
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild className="rounded-lg">
									<Link href={`${basePath}/${lead.id}/edit`}>
										<Pencil className="me-2 h-4 w-4" />
										{t("pricing.leads.actions.edit")}
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-red-600 dark:text-red-400 rounded-lg focus:text-red-600 dark:focus:text-red-400"
									onClick={() => setShowDeleteDialog(true)}
								>
									<Trash2 className="me-2 h-4 w-4" />
									{t("pricing.leads.actions.delete")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Status + Priority */}
					<div className="mt-3 flex items-center gap-2 flex-wrap">
						<LeadStatusBadge status={lead.status} size="sm" />
						<LeadPriorityIndicator priority={lead.priority} />
					</div>
				</div>

				{/* Card Details */}
				<div className="px-4 pb-3">
					<div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
						{lead.projectType && (
							<span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
								{t(`pricing.leads.projectType.${lead.projectType}`)}
							</span>
						)}
						{lead.projectLocation && (
							<div className="flex items-center gap-1">
								<MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
								<span className="text-xs truncate max-w-[120px]">{lead.projectLocation}</span>
							</div>
						)}
					</div>
				</div>

				{/* Card Footer */}
				<div className="px-4 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
							{lead.assignedTo ? (
								<div className="flex items-center gap-1">
									<User className="h-3.5 w-3.5" />
									<span className="truncate max-w-[80px]">{lead.assignedTo.name}</span>
								</div>
							) : null}
							{lead.assignedTo && <span>·</span>}
							<div className="flex items-center gap-1">
								<Calendar className="h-3.5 w-3.5" />
								<span>{createdDate}</span>
							</div>
						</div>
						{estimatedValue && (
							<span className="text-base font-semibold text-slate-900 dark:text-slate-100">
								{estimatedValue} <span className="text-xs font-normal text-slate-500">ر.س</span>
							</span>
						)}
					</div>
				</div>
			</div>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("pricing.leads.messages.deleteConfirm")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("pricing.leads.messages.deleteConfirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("pricing.leads.form.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="rounded-xl bg-red-600 text-white hover:bg-red-700"
						>
							{t("pricing.leads.actions.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
