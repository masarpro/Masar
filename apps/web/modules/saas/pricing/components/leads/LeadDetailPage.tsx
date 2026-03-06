"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Tabs, TabsContent } from "@ui/components/tabs";
import { FileText, FolderOpen, Link2, Loader2, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { LeadActivityTab } from "./LeadActivityTab";
import { LeadFilesTab } from "./LeadFilesTab";
import { LeadHeader } from "./LeadHeader";
import { LeadInfoTab } from "./LeadInfoTab";
import { LeadLinkedTab } from "./LeadLinkedTab";
import { ConvertToProjectDialog } from "./ConvertToProjectDialog";
import { UpdateLeadStatusDialog } from "./UpdateLeadStatusDialog";

interface LeadDetailPageProps {
	leadId: string;
	organizationId: string;
	organizationSlug: string;
}

export function LeadDetailPage({ leadId, organizationId, organizationSlug }: LeadDetailPageProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState("info");
	const [showStatusDialog, setShowStatusDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showConvertDialog, setShowConvertDialog] = useState(false);

	const { data: lead, isLoading } = useQuery(
		orpc.pricing.leads.getById.queryOptions({
			input: { organizationId, leadId },
		}),
	);

	const deleteMutation = useMutation(
		orpc.pricing.leads.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.leads.messages.deleteSuccess"));
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.list.queryOptions({ input: { organizationId } }).queryKey,
				});
				router.push(`/app/${organizationSlug}/pricing/leads`);
			},
			onError: () => {
				toast.error(t("pricing.leads.messages.deleteError"));
			},
		}),
	);

	if (isLoading) {
		return null;
	}

	if (!lead) {
		return (
			<div className="py-20 text-center">
				<p className="text-muted-foreground">{t("pricing.leads.detail.notFound")}</p>
			</div>
		);
	}

	const tabs = [
		{ value: "info", icon: FileText, label: t("pricing.leads.detail.tabs.info") },
		{ value: "files", icon: FolderOpen, label: t("pricing.leads.detail.tabs.files"), count: lead.files.length },
		{ value: "activity", icon: MessageSquare, label: t("pricing.leads.detail.tabs.activity"), count: lead.activities.length },
		{ value: "linked", icon: Link2, label: t("pricing.leads.detail.tabs.linked") },
	];

	return (
		<div className="space-y-6" dir="rtl">
			<LeadHeader
				lead={{
					...lead,
					phone: lead.phone ?? undefined,
					email: lead.email ?? undefined,
					estimatedValue: lead.estimatedValue ?? undefined,
					projectLocation: lead.projectLocation ?? undefined,
					assignedTo: lead.assignedTo ?? undefined,
				}}
				organizationSlug={organizationSlug}
				onChangeStatus={() => setShowStatusDialog(true)}
				onDelete={() => setShowDeleteDialog(true)}
				onConvert={() => setShowConvertDialog(true)}
			/>

			{/* Glassmorphism Navigation */}
			<nav className="flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 shadow-lg overflow-x-auto" dir="rtl">
				{tabs.map((tab) => (
					<button
						key={tab.value}
						type="button"
						onClick={() => setActiveTab(tab.value)}
						className={
							activeTab === tab.value
								? "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm whitespace-nowrap transition-all bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium shadow-md shadow-primary/20"
								: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm whitespace-nowrap transition-all text-muted-foreground hover:text-foreground hover:bg-muted/60"
						}
					>
						<tab.icon className="h-4 w-4" />
						{tab.label}
						{tab.count != null && tab.count > 0 && (
							<span className={
								activeTab === tab.value
									? "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1 text-[10px] font-medium"
									: "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium"
							}>
								{tab.count}
							</span>
						)}
					</button>
				))}
			</nav>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsContent value="info" className="mt-0">
					<LeadInfoTab lead={lead} />
				</TabsContent>

				<TabsContent value="files" className="mt-0">
					<LeadFilesTab
						leadId={leadId}
						organizationId={organizationId}
						files={lead.files}
					/>
				</TabsContent>

				<TabsContent value="activity" className="mt-0">
					<LeadActivityTab
						leadId={leadId}
						organizationId={organizationId}
						activities={lead.activities}
					/>
				</TabsContent>

				<TabsContent value="linked" className="mt-0">
					<LeadLinkedTab
						leadId={leadId}
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						costStudy={lead.costStudy}
						quotation={lead.quotation}
					/>
				</TabsContent>
			</Tabs>

			{/* Status Dialog */}
			<UpdateLeadStatusDialog
				open={showStatusDialog}
				onOpenChange={setShowStatusDialog}
				leadId={leadId}
				organizationId={organizationId}
				currentStatus={lead.status}
			/>

			{/* Convert to Project Dialog */}
			<ConvertToProjectDialog
				open={showConvertDialog}
				onOpenChange={setShowConvertDialog}
				leadId={leadId}
				leadName={lead.name}
				organizationId={organizationId}
				organizationSlug={organizationSlug}
			/>

			{/* Delete Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
							onClick={() => deleteMutation.mutate({ organizationId, leadId })}
							disabled={deleteMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("pricing.leads.actions.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
