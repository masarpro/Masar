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
import { cn } from "@ui/lib";
import {
	Building2,
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

function getStatusProgress(status: string): string {
	const map: Record<string, string> = {
		NEW: "16%",
		STUDYING: "33%",
		QUOTED: "50%",
		NEGOTIATING: "75%",
		WON: "100%",
	};
	return map[status] ?? "0%";
}

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
		(deleteMutation as any).mutate({ organizationId, leadId: lead.id });
	};

	const createdDate = new Date(lead.createdAt).toLocaleDateString("ar-SA", {
		month: "short",
		day: "numeric",
	});

	const estimatedValue = lead.estimatedValue
		? new Intl.NumberFormat("en-SA", { maximumFractionDigits: 0 }).format(lead.estimatedValue)
		: null;

	return (
		<>
			<div className="group relative rounded-2xl border-2 bg-card overflow-hidden transition-colors">
				{/* Card Header */}
				<div className="border-b-2 px-4 py-3">
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-center gap-2 flex-1 min-w-0">
							{/* Avatar */}
							<div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
								{lead.name.charAt(0).toUpperCase()}
							</div>
							<div className="min-w-0">
								<Link
									href={`${basePath}/${lead.id}`}
									className="group/link inline-block"
								>
									<h3 className="font-medium text-card-foreground line-clamp-1 group-hover/link:text-muted-foreground transition-colors">
										{lead.name}
									</h3>
								</Link>
								{lead.company && (
									<div className="flex items-center gap-1 mt-0.5">
										<Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
										<p className="text-xs text-muted-foreground line-clamp-1">
											{lead.company}
										</p>
									</div>
								)}
							</div>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent rounded-lg"
								>
									<MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
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
									className="text-destructive rounded-lg focus:text-destructive"
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
					<div className="space-y-1.5">
						{lead.phone && (
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<Phone className="h-3 w-3 shrink-0" />
								<span dir="ltr">{lead.phone}</span>
							</div>
						)}
						{lead.projectLocation && (
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<MapPin className="h-3 w-3 shrink-0" />
								<span className="truncate">{lead.projectLocation}</span>
							</div>
						)}
						{lead.projectType && (
							<div className="flex items-center gap-1.5 text-xs">
								<Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
								<span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
									{t(`pricing.leads.projectType.${lead.projectType}`)}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Card Footer */}
				<div className="px-4 pb-3 pt-3 border-t-2">
					<div className="flex items-center justify-between">
						{/* Estimated Value */}
						<div>
							{estimatedValue ? (
								<p className="text-sm font-semibold text-primary">
									{estimatedValue} <span className="text-xs font-normal text-muted-foreground">ر.س</span>
								</p>
							) : (
								<p className="text-xs text-muted-foreground">{t("pricing.leads.noValue")}</p>
							)}
						</div>

						{/* Assignee + Date */}
						<div className="flex items-center gap-2">
							{lead.assignedTo && (
								<div
									className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium"
									title={lead.assignedTo.name}
								>
									{lead.assignedTo.name?.charAt(0)}
								</div>
							)}
							<span className="text-[10px] text-muted-foreground">{createdDate}</span>
						</div>
					</div>
				</div>

				{/* Status Progress Bar */}
				{lead.status !== "LOST" && (
					<div className="px-4 pb-3">
						<div className="h-0.5 bg-muted rounded-full overflow-hidden">
							<div
								className={cn(
									"h-full rounded-full transition-all",
									lead.status === "WON" ? "bg-success" : "bg-primary",
								)}
								style={{ width: getStatusProgress(lead.status) }}
							/>
						</div>
					</div>
				)}
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
							className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("pricing.leads.actions.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
