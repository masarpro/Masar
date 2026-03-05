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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
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
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!lead) {
		return (
			<div className="py-20 text-center">
				<p className="text-muted-foreground">{t("pricing.leads.detail.notFound")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<LeadHeader
				lead={lead}
				organizationSlug={organizationSlug}
				onChangeStatus={() => setShowStatusDialog(true)}
				onDelete={() => setShowDeleteDialog(true)}
			/>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="rounded-xl">
					<TabsTrigger value="info" className="rounded-lg">
						<FileText className="me-2 h-4 w-4" />
						{t("pricing.leads.detail.tabs.info")}
					</TabsTrigger>
					<TabsTrigger value="files" className="rounded-lg">
						<FolderOpen className="me-2 h-4 w-4" />
						{t("pricing.leads.detail.tabs.files")}
						{lead.files.length > 0 && (
							<span className="ms-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium">
								{lead.files.length}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger value="activity" className="rounded-lg">
						<MessageSquare className="me-2 h-4 w-4" />
						{t("pricing.leads.detail.tabs.activity")}
						{lead.activities.length > 0 && (
							<span className="ms-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium">
								{lead.activities.length}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger value="linked" className="rounded-lg">
						<Link2 className="me-2 h-4 w-4" />
						{t("pricing.leads.detail.tabs.linked")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="info" className="mt-4">
					<LeadInfoTab lead={lead} />
				</TabsContent>

				<TabsContent value="files" className="mt-4">
					<LeadFilesTab
						leadId={leadId}
						organizationId={organizationId}
						files={lead.files}
					/>
				</TabsContent>

				<TabsContent value="activity" className="mt-4">
					<LeadActivityTab
						leadId={leadId}
						organizationId={organizationId}
						activities={lead.activities}
					/>
				</TabsContent>

				<TabsContent value="linked" className="mt-4">
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
