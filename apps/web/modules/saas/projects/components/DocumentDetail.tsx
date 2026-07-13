"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	ChevronLeft,
	CheckCircle,
	Clock,
	XCircle,
	FileText,
	Shield,
	User,
	Calendar,
	History,
	Download,
	Trash2,
	Eye,
	File,
	Image,
	Upload,
	RotateCcw,
	Layers,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";
import { DocumentViewer } from "./documents/DocumentViewer";

interface DocumentDetailProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	documentId: string;
}

function formatFileSize(bytes?: number | null): string {
	if (!bytes) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FOLDER_COLORS: Record<string, string> = {
	CONTRACT: "bg-chart-4/15 text-chart-4",
	DRAWINGS: "bg-chart-4/15 text-chart-4",
	CLAIMS: "bg-success/15 text-success",
	LETTERS: "bg-chart-1/15 text-chart-1",
	PHOTOS: "bg-chart-2/15 text-chart-2",
	OTHER: "bg-muted text-muted-foreground",
};

function getApprovalStatusBadge(status: string, t: ReturnType<typeof useTranslations>) {
	switch (status) {
		case "PENDING":
			return (
				<Badge className="border-0 bg-chart-1/15 text-chart-1">
					<Clock className="h-3 w-3 me-1" />
					{t("approvalPending")}
				</Badge>
			);
		case "APPROVED":
			return (
				<Badge className="border-0 bg-success/15 text-success">
					<CheckCircle className="h-3 w-3 me-1" />
					{t("approvalApproved")}
				</Badge>
			);
		case "REJECTED":
			return (
				<Badge className="border-0 bg-destructive/15 text-destructive">
					<XCircle className="h-3 w-3 me-1" />
					{t("approvalRejected")}
				</Badge>
			);
		default:
			return null;
	}
}

function getActionLabel(action: string, t: ReturnType<typeof useTranslations>) {
	switch (action) {
		case "DOC_CREATED":
			return t("auditActions.docCreated");
		case "DOC_DELETED":
			return t("auditActions.docDeleted");
		case "APPROVAL_REQUESTED":
			return t("auditActions.approvalRequested");
		case "APPROVAL_DECIDED":
			return t("auditActions.approvalDecided");
		default:
			return action;
	}
}

export function DocumentDetail({
	organizationId,
	organizationSlug,
	projectId,
	documentId,
}: DocumentDetailProps) {
	const t = useTranslations("projects.documents");
	const queryClient = useQueryClient();
	const router = useRouter();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
	const [decisionNote, setDecisionNote] = useState("");
	const [showViewer, setShowViewer] = useState(false);
	const [isUploadVersionOpen, setIsUploadVersionOpen] = useState(false);
	const [versionChangeNotes, setVersionChangeNotes] = useState("");

	const { data: document, isLoading } = useQuery(
		orpc.projectDocuments.get.queryOptions({
			input: {
				organizationId,
				projectId,
				documentId,
			},
		}),
	);

	const actOnApprovalMutation = useMutation(
		orpc.projectDocuments.actOnApproval.mutationOptions({
			onSuccess: () => {
				toast.success(t("approvalActionSuccess"));
				queryClient.invalidateQueries({
					queryKey: [["projectDocuments", "get"]],
				});
			},
			onError: (error: any) => {
				toast.error(error.message || t("approvalActionError"));
			},
		}),
	);

	const deleteMutation = useMutation(
		orpc.projectDocuments.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("deleteSuccess"));
				router.push(`${basePath}/documents`);
			},
			onError: (error: any) => {
				toast.error(error.message || t("deleteError"));
			},
		}),
	);

	const downloadUrlMutation = useMutation(
		orpc.projectDocuments.getDownloadUrl.mutationOptions({}),
	);

	const { data: versionsData } = useQuery(
		orpc.projectDocuments.listVersions.queryOptions({
			input: { organizationId, projectId, documentId },
		}),
	);

	const uploadVersionMutation = useMutation({
		mutationFn: async (data: {
			fileName: string;
			fileSize: number;
			fileType: string;
			storagePath: string;
			changeNotes?: string;
		}) => {
			return orpcClient.projectDocuments.uploadVersion({
				organizationId,
				projectId,
				documentId,
				...data,
			});
		},
		onSuccess: () => {
			toast.success(t("versions.uploadSuccess"));
			queryClient.invalidateQueries({
				queryKey: [["projectDocuments"]],
			});
			setIsUploadVersionOpen(false);
			setVersionChangeNotes("");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const revertMutation = useMutation({
		mutationFn: async (versionNumber: number) => {
			return orpcClient.projectDocuments.revertToVersion({
				organizationId,
				projectId,
				documentId,
				versionNumber,
			});
		},
		onSuccess: () => {
			toast.success(t("versions.revertSuccess"));
			queryClient.invalidateQueries({
				queryKey: [["projectDocuments"]],
			});
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const versionDownloadMutation = useMutation({
		mutationFn: async (versionId: string) => {
			return orpcClient.projectDocuments.getVersionDownloadUrl({
				organizationId,
				projectId,
				documentId,
				versionId,
			});
		},
	});

	const handleVersionDownload = async (versionId: string) => {
		try {
			const result = await versionDownloadMutation.mutateAsync(versionId);
			const link = window.document.createElement("a");
			link.href = result.downloadUrl;
			link.download = result.fileName;
			link.click();
		} catch {
			toast.error(t("downloadError"));
		}
	};

	const handleUploadVersion = async (file: globalThis.File) => {
		try {
			// Get upload URL
			const uploadData = await orpcClient.projectDocuments.getUploadUrl({
				organizationId,
				projectId,
				fileName: file.name,
				mimeType: file.type,
				fileSize: file.size,
			});

			// Upload file to S3
			await new Promise<void>((resolve, reject) => {
				const xhr = new XMLHttpRequest();
				xhr.open("PUT", uploadData.uploadUrl);
				xhr.setRequestHeader("Content-Type", file.type);
				xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed")));
				xhr.onerror = () => reject(new Error("Upload failed"));
				xhr.send(file);
			});

			// Create version record
			uploadVersionMutation.mutate({
				fileName: file.name,
				fileSize: file.size,
				fileType: file.type,
				storagePath: uploadData.storagePath,
				changeNotes: versionChangeNotes || undefined,
			});
		} catch {
			toast.error(t("versions.uploadError"));
		}
	};

	const handleDownload = async () => {
		if (!document) return;

		try {
			const result = await downloadUrlMutation.mutateAsync({
				organizationId,
				projectId,
				documentId,
			});
			const link = window.document.createElement("a");
			link.href = result.downloadUrl;
			link.download = result.fileName || document.title;
			link.click();
		} catch {
			toast.error(t("downloadError"));
		}
	};

	const handleDelete = () => {
		if (!confirm(t("deleteConfirm"))) return;
		deleteMutation.mutate({
			organizationId,
			projectId,
			documentId,
		});
	};

	if (isLoading) {
		return <DetailPageSkeleton />;
	}

	if (!document) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div className="mb-4 rounded-2xl bg-muted p-4">
					<FileText className="h-12 w-12 text-muted-foreground" />
				</div>
				<p className="mb-4 text-lg text-muted-foreground">
					{t("notFound")}
				</p>
				<Button asChild className="rounded-xl">
					<Link href={`${basePath}/documents`}>
						{t("backToDocuments")}
					</Link>
				</Button>
			</div>
		);
	}

	const latestApproval = document.approvals?.[0];
	const hasPendingApproval = latestApproval?.status === "PENDING";
	const isImage = document.mimeType?.startsWith("image/");

	const handleApprovalAction = (decision: "APPROVED" | "REJECTED") => {
		if (!latestApproval) return;

		actOnApprovalMutation.mutate({
			organizationId,
			projectId,
			approvalId: latestApproval.id,
			decision,
			note: decisionNote || undefined,
		});
		setIsApprovalDialogOpen(false);
		setDecisionNote("");
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					<Button
						variant="ghost"
						size="icon"
						asChild
						className="mt-1 shrink-0 rounded-xl hover:bg-accent hover:text-accent-foreground"
					>
						<Link href={`${basePath}/documents`}>
							<ChevronLeft className="rtl-flip h-5 w-5 text-muted-foreground" />
						</Link>
					</Button>
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-3">
							<h1 className="text-2xl font-semibold text-foreground">
								{document.title}
							</h1>
							<Badge className="border-0 bg-muted text-muted-foreground">
								{document.folderRef?.name
									? document.folderRef.name
									: document.folder
										? t(`folders.${document.folder}`)
										: t("uncategorized")}
							</Badge>
						</div>
						{document.description && (
							<p className="text-muted-foreground">{document.description}</p>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						className="rounded-xl"
						onClick={() => setShowViewer(true)}
					>
						<Eye className="h-4 w-4 me-2" />
						{t("view")}
					</Button>
					<Button
						variant="outline"
						className="rounded-xl"
						onClick={handleDownload}
						disabled={downloadUrlMutation.isPending}
					>
						<Download className="h-4 w-4 me-2" />
						{t("download")}
					</Button>
					<Button
						variant="outline"
						className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
						onClick={handleDelete}
						disabled={deleteMutation.isPending}
					>
						<Trash2 className="h-4 w-4 me-2" />
						{t("delete")}
					</Button>
				</div>
			</div>

			{/* Document Info */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main Info */}
				<div className="lg:col-span-2 space-y-6">
					{/* File Info Card */}
					<div className="rounded-2xl border-2 bg-card p-6">
						<h2 className="mb-4 text-lg font-semibold text-card-foreground">
							{t("fileInfo")}
						</h2>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-muted p-2">
									<User className="h-4 w-4 text-muted-foreground" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{t("createdBy")}</p>
									<p className="font-medium text-card-foreground">
										{document.createdBy.name}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-muted p-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{t("createdAt")}</p>
									<p className="font-medium text-card-foreground">
										{new Date(document.createdAt).toLocaleDateString("ar-SA")}
									</p>
								</div>
							</div>
							{document.fileName && (
								<div className="flex items-center gap-3">
									<div className="rounded-lg bg-muted p-2">
										{isImage ? (
											<Image className="h-4 w-4 text-chart-2" />
										) : (
											<File className="h-4 w-4 text-chart-4" />
										)}
									</div>
									<div>
										<p className="text-xs text-muted-foreground">{t("fileName")}</p>
										<p className="font-medium text-card-foreground">
											{document.fileName}
										</p>
									</div>
								</div>
							)}
							{document.fileSize && (
								<div className="flex items-center gap-3">
									<div className="rounded-lg bg-muted p-2">
										<FileText className="h-4 w-4 text-muted-foreground" />
									</div>
									<div>
										<p className="text-xs text-muted-foreground">{t("fileSize")}</p>
										<p className="font-medium text-card-foreground">
											{formatFileSize(document.fileSize)}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Approvals Section */}
					<div className="rounded-2xl border-2 bg-card p-6">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-card-foreground">
								<Shield className="inline h-5 w-5 me-2 text-muted-foreground" />
								{t("approvals")}
							</h2>
							{!hasPendingApproval && (
								<Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
									<DialogTrigger asChild>
										<Button variant="outline" className="rounded-xl">
											{t("requestApproval")}
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>{t("requestApproval")}</DialogTitle>
										</DialogHeader>
										<p className="text-sm text-muted-foreground">
											{t("requestApprovalDescription")}
										</p>
									</DialogContent>
								</Dialog>
							)}
						</div>

						{document.approvals && document.approvals.length > 0 ? (
							<div className="space-y-4">
								{document.approvals.map((approval: any) => (
									<div
										key={approval.id}
										className="rounded-xl border-2 p-4"
									>
										<div className="flex items-center justify-between mb-3">
											{getApprovalStatusBadge(approval.status, t)}
											<span className="text-xs text-muted-foreground">
												{new Date(approval.requestedAt).toLocaleDateString("ar-SA")}
											</span>
										</div>
										<div className="mb-3">
											<p className="text-xs text-muted-foreground mb-1">{t("requestedBy")}</p>
											<p className="text-sm font-medium">{approval.requestedBy.name}</p>
										</div>
										{approval.approvers && approval.approvers.length > 0 && (
											<div>
												<p className="text-xs text-muted-foreground mb-2">{t("approvers")}</p>
												<div className="flex flex-wrap gap-2">
													{approval.approvers.map((approver: any) => (
														<div
															key={approver.id}
															className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5"
														>
															<span className="text-sm">{approver.user.name}</span>
															{approver.status === "APPROVED" && (
																<CheckCircle className="h-4 w-4 text-success" />
															)}
															{approver.status === "REJECTED" && (
																<XCircle className="h-4 w-4 text-destructive" />
															)}
															{approver.status === "PENDING" && (
																<Clock className="h-4 w-4 text-chart-1" />
															)}
														</div>
													))}
												</div>
											</div>
										)}
										{hasPendingApproval && approval.status === "PENDING" && (
											<div className="mt-4 flex gap-2">
												<Button
													size="sm"
													className="rounded-lg bg-success hover:bg-success/90"
													onClick={() => handleApprovalAction("APPROVED")}
													disabled={actOnApprovalMutation.isPending}
												>
													<CheckCircle className="h-4 w-4 me-1" />
													{t("approve")}
												</Button>
												<Button
													size="sm"
													variant="error"
													className="rounded-lg"
													onClick={() => handleApprovalAction("REJECTED")}
													disabled={actOnApprovalMutation.isPending}
												>
													<XCircle className="h-4 w-4 me-1" />
													{t("reject")}
												</Button>
											</div>
										)}
									</div>
								))}
							</div>
						) : (
							<p className="text-center text-sm text-muted-foreground py-8">
								{t("noApprovals")}
							</p>
						)}
					</div>

						{/* Versions Section */}
					<div className="rounded-2xl border-2 bg-card p-6">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-card-foreground">
								<Layers className="inline h-5 w-5 me-2 text-muted-foreground" />
								{t("versions.title")}
								{document.version > 1 && (
									<Badge className="ms-2 border-0 bg-chart-4/15 text-chart-4">
										v{document.version}
									</Badge>
								)}
							</h2>
							{document.uploadType === "FILE" && (
								<Dialog open={isUploadVersionOpen} onOpenChange={setIsUploadVersionOpen}>
									<DialogTrigger asChild>
										<Button variant="outline" size="sm" className="rounded-xl">
											<Upload className="h-4 w-4 me-1.5" />
											{t("versions.upload")}
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>{t("versions.uploadTitle")}</DialogTitle>
										</DialogHeader>
										<div className="space-y-4">
											<div>
												<Label>{t("versions.changeNotes")}</Label>
												<Textarea
													value={versionChangeNotes}
													onChange={(e: any) => setVersionChangeNotes(e.target.value)}
													placeholder={t("versions.changeNotesPlaceholder")}
													className="mt-1.5"
												/>
											</div>
											<div>
												<Label>{t("versions.selectFile")}</Label>
												<Input
													type="file"
													className="mt-1.5"
													onChange={(e: any) => {
														const file = e.target.files?.[0];
														if (file) handleUploadVersion(file);
													}}
													disabled={uploadVersionMutation.isPending}
												/>
											</div>
										</div>
									</DialogContent>
								</Dialog>
							)}
						</div>

						{versionsData && versionsData.versions.length > 0 ? (
							<div className="space-y-2">
								{versionsData.versions.map((version: any) => (
									<div
										key={version.id}
										className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
											version.versionNumber === versionsData.currentVersion
												? "border-chart-4 bg-chart-4/15"
												: "border-border hover:bg-accent"
										}`}
									>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<span className="text-sm font-semibold text-card-foreground">
													v{version.versionNumber}
												</span>
												{version.versionNumber === versionsData.currentVersion && (
													<Badge className="border-0 bg-chart-4/15 text-chart-4 text-[10px]">
														{t("versions.current")}
													</Badge>
												)}
											</div>
											<p className="text-xs text-muted-foreground mt-0.5">
												{version.fileName} • {formatFileSize(version.fileSize)} • {new Date(version.createdAt).toLocaleDateString("ar-SA")}
											</p>
											{version.changeNotes && (
												<p className="text-xs text-muted-foreground mt-1 italic">
													{version.changeNotes}
												</p>
											)}
										</div>
										<div className="flex items-center gap-1 ms-2">
											<Button
												variant="ghost"
												size="icon"
												className="rounded-lg h-8 w-8"
												onClick={() => handleVersionDownload(version.id)}
												disabled={versionDownloadMutation.isPending}
											>
												<Download className="h-3.5 w-3.5" />
											</Button>
											{version.versionNumber !== versionsData.currentVersion && (
												<Button
													variant="ghost"
													size="icon"
													className="rounded-lg h-8 w-8"
													onClick={() => {
														if (confirm(t("versions.revertConfirm"))) {
															revertMutation.mutate(version.versionNumber);
														}
													}}
													disabled={revertMutation.isPending}
												>
													<RotateCcw className="h-3.5 w-3.5" />
												</Button>
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-center text-sm text-muted-foreground py-4">
								{t("versions.noVersions")}
							</p>
						)}
					</div>
				</div>

			{/* Audit Log Sidebar */}
				<div className="rounded-2xl border-2 bg-card p-6">
					<h2 className="mb-4 text-lg font-semibold text-card-foreground">
						<History className="inline h-5 w-5 me-2 text-muted-foreground" />
						{t("auditLog")}
					</h2>
					{document.auditLogs && document.auditLogs.length > 0 ? (
						<div className="space-y-3">
							{document.auditLogs.map((log: any) => (
								<div
									key={log.id}
									className="border-s-2 border-border ps-3"
								>
									<p className="text-sm font-medium text-card-foreground">
										{getActionLabel(log.action, t)}
									</p>
									<p className="text-xs text-muted-foreground">
										{log.actor.name} •{" "}
										{new Date(log.createdAt).toLocaleDateString("ar-SA")}
									</p>
								</div>
							))}
						</div>
					) : (
						<p className="text-center text-sm text-muted-foreground py-4">
							{t("noAuditLogs")}
						</p>
					)}
				</div>
			</div>

			{/* Document Viewer Dialog */}
			{showViewer && (
				<DocumentViewer
					organizationId={organizationId}
					projectId={projectId}
					document={document}
					open={showViewer}
					onClose={() => setShowViewer(false)}
				/>
			)}
		</div>
	);
}
