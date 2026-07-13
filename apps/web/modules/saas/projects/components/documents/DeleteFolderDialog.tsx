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
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface DeleteFolderDialogProps {
	organizationId: string;
	projectId: string;
	folder: { id: string; name: string; documentCount: number } | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDeleted?: () => void;
}

export function DeleteFolderDialog({
	organizationId,
	projectId,
	folder,
	open,
	onOpenChange,
	onDeleted,
}: DeleteFolderDialogProps) {
	const t = useTranslations("projects.documents");
	const tCommon = useTranslations("common");
	const queryClient = useQueryClient();

	const hasDocuments = (folder?.documentCount ?? 0) > 0;

	const deleteMutation = useMutation(
		orpc.projectDocuments.deleteFolder.mutationOptions({
			onSuccess: () => {
				toast.success(t("folderDeleted"));
				queryClient.invalidateQueries({ queryKey: [["projectDocuments", "listFolders"]] });
				queryClient.invalidateQueries({ queryKey: [["projectDocuments", "list"]] });
				onOpenChange(false);
				onDeleted?.();
			},
			onError: (error: any) => toast.error(error.message || t("folderDeleteError")),
		}),
	);

	const handleConfirm = () => {
		if (!folder) return;
		deleteMutation.mutate({
			organizationId,
			projectId,
			folderId: folder.id,
			confirmWithDocuments: true,
		});
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2">
						{hasDocuments && (
							<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/15">
								<AlertTriangle className="h-5 w-5 text-destructive" />
							</span>
						)}
						{t("deleteFolderTitle")}
					</AlertDialogTitle>
					<AlertDialogDescription className="space-y-2 text-start">
						<span className="block">
							{t.rich("deleteFolderConfirm", {
								name: folder?.name ?? "",
								b: (chunks) => <strong className="text-foreground">{chunks}</strong>,
							})}
						</span>
						{hasDocuments && (
							<span className="block rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
								{t("deleteFolderWithDocsWarning", { count: folder?.documentCount ?? 0 })}
							</span>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="rounded-xl">{tCommon("cancel")}</AlertDialogCancel>
					<AlertDialogAction
						className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
						onClick={(e) => {
							e.preventDefault();
							handleConfirm();
						}}
						disabled={deleteMutation.isPending}
					>
						{deleteMutation.isPending ? tCommon("deleting") : t("delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
