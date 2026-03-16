"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@ui/components/button";
import { EmptyState } from "@ui/components/empty-state";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Edit, Eye, MoreHorizontal, Plus, Trash2, UserSearch } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatDate } from "@saas/finance/lib/utils";
import { LeadPriorityIndicator } from "./LeadPriorityIndicator";
import { LeadStatusBadge } from "./LeadStatusBadge";

interface LeadsTableProps {
	leads: Array<{
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
		createdAt: string | Date;
		assignedTo?: { id: string; name: string; image?: string | null } | null;
		_count?: { files: number; activities: number };
	}>;
	organizationId: string;
	organizationSlug: string;
}

export function LeadsTable({ leads, organizationId, organizationSlug }: LeadsTableProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const basePath = `/app/${organizationSlug}/pricing/leads`;

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
				setDeleteId(null);
			},
			onError: () => {
				toast.error(t("pricing.leads.messages.deleteError"));
			},
		}),
	);

	const handleDelete = () => {
		if (!deleteId) return;
		(deleteMutation as any).mutate({ organizationId, leadId: deleteId });
	};

	if (leads.length === 0) {
		return (
			<EmptyState
				icon={<UserSearch className="h-12 w-12" />}
				title={t("pricing.leads.empty")}
				description={t("pricing.leads.emptyDescription")}
			>
				<Button asChild className="rounded-xl">
					<Link href={`${basePath}/new`}>
						<Plus className="me-2 h-4 w-4" />
						{t("pricing.leads.create")}
					</Link>
				</Button>
			</EmptyState>
		);
	}

	return (
		<>
			<div className="overflow-x-auto rounded-2xl border border-border">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/30">
							<TableHead className="font-medium">{t("pricing.leads.columns.client")}</TableHead>
							<TableHead className="hidden sm:table-cell font-medium">{t("pricing.leads.columns.project")}</TableHead>
							<TableHead className="font-medium">{t("pricing.leads.columns.value")}</TableHead>
							<TableHead className="font-medium">{t("pricing.leads.columns.status")}</TableHead>
							<TableHead className="font-medium">{t("pricing.leads.columns.priority")}</TableHead>
							<TableHead className="hidden sm:table-cell font-medium">{t("pricing.leads.columns.assignedTo")}</TableHead>
							<TableHead className="hidden sm:table-cell font-medium">{t("pricing.leads.columns.date")}</TableHead>
							<TableHead className="w-[50px]" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{leads.map((lead) => (
							<TableRow
								key={lead.id}
								className="cursor-pointer hover:bg-muted/20"
								onClick={() => router.push(`${basePath}/${lead.id}`)}
							>
								<TableCell>
									<div>
										<p className="font-medium text-foreground">{lead.name}</p>
										{lead.company && (
											<p className="text-sm text-muted-foreground truncate max-w-[200px]">
												{lead.company}
											</p>
										)}
										{lead.phone && (
											<p className="text-xs text-muted-foreground" dir="ltr">
												{lead.phone}
											</p>
										)}
									</div>
								</TableCell>
								<TableCell className="hidden sm:table-cell">
									{lead.projectType ? (
										<div>
											<span className="inline-flex items-center rounded-md bg-muted/50 px-2 py-0.5 text-xs font-medium">
												{t(`pricing.leads.projectType.${lead.projectType}`)}
											</span>
											{lead.projectLocation && (
												<p className="mt-0.5 text-xs text-muted-foreground truncate max-w-[150px]">
													{lead.projectLocation}
												</p>
											)}
										</div>
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</TableCell>
								<TableCell>
									{lead.estimatedValue ? (
										<div>
											<p className="font-medium text-foreground">
												{new Intl.NumberFormat("en-US").format(lead.estimatedValue)}
											</p>
											{lead.estimatedArea && (
												<p className="text-xs text-muted-foreground">
													{new Intl.NumberFormat("en-US").format(lead.estimatedArea)} {t("pricing.leads.area")}
												</p>
											)}
										</div>
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</TableCell>
								<TableCell>
									<LeadStatusBadge status={lead.status} size="sm" />
								</TableCell>
								<TableCell>
									<LeadPriorityIndicator priority={lead.priority} />
								</TableCell>
								<TableCell className="hidden sm:table-cell">
									{lead.assignedTo ? (
										<span className="text-sm text-foreground">
											{lead.assignedTo.name}
										</span>
									) : (
										<span className="text-sm text-muted-foreground">
											{t("pricing.leads.unassigned")}
										</span>
									)}
								</TableCell>
								<TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
									{formatDate(lead.createdAt)}
								</TableCell>
								<TableCell>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 rounded-lg"
												onClick={(e: any) => e.stopPropagation()}
											>
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="rounded-xl">
											<DropdownMenuItem asChild>
												<Link href={`${basePath}/${lead.id}`}>
													<Eye className="me-2 h-4 w-4" />
													{t("pricing.leads.actions.view")}
												</Link>
											</DropdownMenuItem>
											<DropdownMenuItem asChild>
												<Link href={`${basePath}/${lead.id}/edit`}>
													<Edit className="me-2 h-4 w-4" />
													{t("pricing.leads.actions.edit")}
												</Link>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className="text-destructive"
												onClick={(e: any) => {
													e.stopPropagation();
													setDeleteId(lead.id);
												}}
											>
												<Trash2 className="me-2 h-4 w-4" />
												{t("pricing.leads.actions.delete")}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<AlertDialog open={!!deleteId} onOpenChange={(open: any) => !open && setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("pricing.leads.messages.deleteConfirm")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("pricing.leads.messages.deleteConfirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("pricing.leads.form.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("pricing.leads.actions.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
