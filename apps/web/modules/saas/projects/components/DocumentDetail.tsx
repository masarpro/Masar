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
	CONTRACT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	DRAWINGS: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	CLAIMS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	LETTERS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	PHOTOS: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
	OTHER: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

function getApprovalStatusBadge(status: string, t: ReturnType<typeof useTranslations>) {
	switch (status) {
		case "PENDING":
			return (
				<Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
					<Clock className="h-3 w-3 me-1" />
					{t("approvalPending")}
				</Badge>
			);
		case "APPROVED":
			return (
				<Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
					<CheckCircle className="h-3 w-3 me-1" />
					{t("approvalApproved")}
				</Badge>
			);
		case "REJECTED":
			return (
				<Badge className="border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
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
				<div className="mb-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
					<FileText className="h-12 w-12 text-slate-400" />
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
						className="mt-1 shrink-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
					>
						<Link href={`${basePath}/documents`}>
							<ChevronLeft className="h-5 w-5 text-slate-500" />
						</Link>
					</Button>
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-3">
							<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
								{document.title}
							</h1>
							<Badge className={`border-0 ${FOLDER_COLORS[document.folder]}`}>
								{t(`folders.${document.folder}`)}
							</Badge>
						</div>
						{document.description && (
							<p className="text-slate-500">{document.description}</p>
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
						className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
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
					<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
						<h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
							{t("fileInfo")}
						</h2>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
									<User className="h-4 w-4 text-slate-500" />
								</div>
								<div>
									<p className="text-xs text-slate-500">{t("createdBy")}</p>
									<p className="font-medium text-slate-900 dark:text-slate-100">
										{document.createdBy.name}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
									<Calendar className="h-4 w-4 text-slate-500" />
								</div>
								<div>
									<p className="text-xs text-slate-500">{t("createdAt")}</p>
									<p className="font-medium text-slate-900 dark:text-slate-100">
										{new Date(document.createdAt).toLocaleDateString("ar-SA")}
									</p>
								</div>
							</div>
							{document.fileName && (
								<div className="flex items-center gap-3">
									<div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
										{isImage ? (
											<Image className="h-4 w-4 text-pink-500" />
										) : (
											<File className="h-4 w-4 text-blue-500" />
										)}
									</div>
									<div>
										<p className="text-xs text-slate-500">{t("fileName")}</p>
										<p className="font-medium text-slate-900 dark:text-slate-100">
											{document.fileName}
										</p>
									</div>
								</div>
							)}
							{document.fileSize && (
								<div className="flex items-center gap-3">
									<div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
										<FileText className="h-4 w-4 text-slate-500" />
									</div>
									<div>
										<p className="text-xs text-slate-500">{t("fileSize")}</p>
										<p className="font-medium text-slate-900 dark:text-slate-100">
											{formatFileSize(document.fileSize)}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Approvals Section */}
					<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
								<Shield className="inline h-5 w-5 me-2 text-slate-400" />
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
										<p className="text-sm text-slate-500">
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
										className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
									>
										<div className="flex items-center justify-between mb-3">
											{getApprovalStatusBadge(approval.status, t)}
											<span className="text-xs text-slate-500">
												{new Date(approval.requestedAt).toLocaleDateString("ar-SA")}
											</span>
										</div>
										<div className="mb-3">
											<p className="text-xs text-slate-500 mb-1">{t("requestedBy")}</p>
											<p className="text-sm font-medium">{approval.requestedBy.name}</p>
										</div>
										{approval.approvers && approval.approvers.length > 0 && (
											<div>
												<p className="text-xs text-slate-500 mb-2">{t("approvers")}</p>
												<div className="flex flex-wrap gap-2">
													{approval.approvers.map((approver: any) => (
														<div
															key={approver.id}
															className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-800"
														>
															<span className="text-sm">{approver.user.name}</span>
															{approver.status === "APPROVED" && (
																<CheckCircle className="h-4 w-4 text-green-500" />
															)}
															{approver.status === "REJECTED" && (
																<XCircle className="h-4 w-4 text-red-500" />
															)}
															{approver.status === "PENDING" && (
																<Clock className="h-4 w-4 text-amber-500" />
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
													className="rounded-lg bg-green-600 hover:bg-green-700"
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
							<p className="text-center text-sm text-slate-500 py-8">
								{t("noApprovals")}
							</p>
						)}
					</div>

						{/* Versions Section */}
					<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
								<Layers className="inline h-5 w-5 me-2 text-slate-400" />
								{t("versions.title")}
								{document.version > 1 && (
									<Badge className="ms-2 border-0 bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
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
												? "border-sky-200 bg-sky-50/50 dark:border-sky-800/30 dark:bg-sky-950/20"
												: "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30"
										}`}
									>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
													v{version.versionNumber}
												</span>
												{version.versionNumber === versionsData.currentVersion && (
													<Badge className="border-0 bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 text-[10px]">
														{t("versions.current")}
													</Badge>
												)}
											</div>
											<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
												{version.fileName} • {formatFileSize(version.fileSize)} • {new Date(version.createdAt).toLocaleDateString("ar-SA")}
											</p>
											{version.changeNotes && (
												<p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
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
							<p className="text-center text-sm text-slate-500 py-4">
								{t("versions.noVersions")}
							</p>
						)}
					</div>
				</div>

			{/* Audit Log Sidebar */}
				<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
					<h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
						<History className="inline h-5 w-5 me-2 text-slate-400" />
						{t("auditLog")}
					</h2>
					{document.auditLogs && document.auditLogs.length > 0 ? (
						<div className="space-y-3">
							{document.auditLogs.map((log: any) => (
								<div
									key={log.id}
									className="border-s-2 border-slate-200 ps-3 dark:border-slate-700"
								>
									<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
										{getActionLabel(log.action, t)}
									</p>
									<p className="text-xs text-slate-500">
										{log.actor.name} •{" "}
										{new Date(log.createdAt).toLocaleDateString("ar-SA")}
									</p>
								</div>
							))}
						</div>
					) : (
						<p className="text-center text-sm text-slate-500 py-4">
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
