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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Download, File, FolderOpen, Image, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { formatDate } from "@saas/finance/lib/utils";
import { LeadFileUploadZone } from "./LeadFileUploadZone";

interface LeadFile {
	id: string;
	name: string;
	fileUrl: string;
	category?: string | null;
	fileSize?: number | null;
	mimeType?: string | null;
	description?: string | null;
	createdAt: string | Date;
	createdBy: { id: string; name: string };
}

interface LeadFilesTabProps {
	leadId: string;
	organizationId: string;
	files: LeadFile[];
}

function formatFileSize(bytes: number | null | undefined): string {
	if (!bytes) return "—";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType?: string | null) {
	if (mimeType?.startsWith("image/")) {
		return <Image className="h-4 w-4 text-pink-500" />;
	}
	return <File className="h-4 w-4 text-blue-500" />;
}

export function LeadFilesTab({ leadId, organizationId, files }: LeadFilesTabProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const deleteMutation = useMutation(
		orpc.pricing.leads.files.deleteFile.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.leads.detail.fileDeleted"));
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.getById.queryOptions({ input: { organizationId, leadId } }).queryKey,
				});
				setDeleteId(null);
			},
			onError: () => {
				toast.error(t("pricing.leads.detail.fileDeleteError"));
			},
		}),
	);

	const handleRefresh = () => {
		queryClient.invalidateQueries({
			queryKey: orpc.pricing.leads.getById.queryOptions({ input: { organizationId, leadId } }).queryKey,
		});
	};

	return (
		<div className="space-y-4">
			{/* Upload Zone */}
			<div className="rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
				<div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
					<div className="h-[30px] w-[30px] rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
						<Upload className="h-4 w-4 text-green-600 dark:text-green-400" />
					</div>
					<h3 className="text-sm font-semibold text-foreground">
						{t("pricing.leads.detail.uploadFile")}
					</h3>
				</div>
				<div className="p-5">
					<LeadFileUploadZone
						organizationId={organizationId}
						leadId={leadId}
						onUploadComplete={handleRefresh}
					/>
				</div>
			</div>

			{/* File List */}
			<div className="rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
				<div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
					<div className="h-[30px] w-[30px] rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
						<FolderOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
					</div>
					<h3 className="text-sm font-semibold text-foreground">
						{t("pricing.leads.detail.files")} ({files.length})
					</h3>
				</div>
				<div className="p-5">
					{files.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							{t("pricing.leads.detail.noFiles")}
						</p>
					) : (
						<div className="overflow-hidden rounded-xl border border-border">
							<Table>
								<TableHeader>
									<TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
										<TableHead className="font-medium">{t("pricing.leads.detail.fileName")}</TableHead>
										<TableHead className="font-medium">{t("pricing.leads.detail.fileCategory")}</TableHead>
										<TableHead className="font-medium">{t("pricing.leads.detail.fileSize")}</TableHead>
										<TableHead className="font-medium">{t("pricing.leads.detail.fileUploader")}</TableHead>
										<TableHead className="font-medium">{t("pricing.leads.detail.fileDate")}</TableHead>
										<TableHead className="w-[80px]" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{files.map((file) => (
										<TableRow key={file.id}>
											<TableCell>
												<div className="flex items-center gap-2">
													{getFileIcon(file.mimeType)}
													<span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
												</div>
											</TableCell>
											<TableCell>
												{file.category ? (
													<span className="inline-flex rounded-md bg-muted/50 px-2 py-0.5 text-xs font-medium">
														{t(`pricing.leads.detail.categories.${file.category}`)}
													</span>
												) : "—"}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{formatFileSize(file.fileSize)}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{file.createdBy.name}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{formatDate(file.createdAt)}
											</TableCell>
											<TableCell>
												<div className="flex gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 rounded-lg text-destructive"
														onClick={() => setDeleteId(file.id)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</div>
			</div>

			<AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("pricing.leads.detail.deleteFileConfirm")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("pricing.leads.detail.deleteFileDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("pricing.leads.form.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (deleteId) {
									deleteMutation.mutate({ organizationId, leadId, fileId: deleteId });
								}
							}}
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
