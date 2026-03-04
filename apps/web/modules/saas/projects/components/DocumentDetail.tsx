"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	ChevronLeft,
	CheckCircle,
	Clock,
	XCircle,
	FileText,
	ExternalLink,
	Shield,
	User,
	Calendar,
	History,
	Download,
	Trash2,
	Eye,
	File,
	Image,
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
} from "@ui/components/dialog";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
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

function getApprovalStatusBadge(status: string) {
	switch (status) {
		case "PENDING":
			return (
				<Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
					<Clock className="h-3 w-3 me-1" />
					قيد الاعتماد
				</Badge>
			);
		case "APPROVED":
			return (
				<Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
					<CheckCircle className="h-3 w-3 me-1" />
					معتمد
				</Badge>
			);
		case "REJECTED":
			return (
				<Badge className="border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
					<XCircle className="h-3 w-3 me-1" />
					مرفوض
				</Badge>
			);
		default:
			return null;
	}
}

function getActionLabel(action: string) {
	switch (action) {
		case "DOC_CREATED":
			return "إنشاء الوثيقة";
		case "DOC_DELETED":
			return "حذف الوثيقة";
		case "APPROVAL_REQUESTED":
			return "طلب اعتماد";
		case "APPROVAL_DECIDED":
			return "قرار اعتماد";
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
			onError: (error) => {
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
			onError: (error) => {
				toast.error(error.message || t("deleteError"));
			},
		}),
	);

	const downloadUrlMutation = useMutation(
		orpc.projectDocuments.getDownloadUrl.mutationOptions({}),
	);

	const handleDownload = async () => {
		if (!document) return;

		if (document.uploadType === "URL" && document.fileUrl) {
			window.open(document.fileUrl, "_blank");
			return;
		}

		try {
			const result = await downloadUrlMutation.mutateAsync({
				organizationId,
				projectId,
				documentId,
			});
			const link = window.document.createElement("a");
			link.href = result.downloadUrl;
			link.download = result.fileName || document.title;
			link.target = "_blank";
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
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-12 w-12 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
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
					{document.uploadType === "URL" && document.fileUrl && (
						<Button asChild className="rounded-xl">
							<a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
								<ExternalLink className="h-4 w-4 me-2" />
								{t("openFile")}
							</a>
						</Button>
					)}
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
								{document.approvals.map((approval) => (
									<div
										key={approval.id}
										className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
									>
										<div className="flex items-center justify-between mb-3">
											{getApprovalStatusBadge(approval.status)}
											<span className="text-xs text-slate-500">
												{new Date(approval.requestedAt).toLocaleDateString("ar-SA")}
											</span>
										</div>
										<div className="mb-3">
											<p className="text-xs text-slate-500 mb-1">طالب الاعتماد</p>
											<p className="text-sm font-medium">{approval.requestedBy.name}</p>
										</div>
										{approval.approvers && approval.approvers.length > 0 && (
											<div>
												<p className="text-xs text-slate-500 mb-2">المعتمدون</p>
												<div className="flex flex-wrap gap-2">
													{approval.approvers.map((approver) => (
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
													اعتماد
												</Button>
												<Button
													size="sm"
													variant="error"
													className="rounded-lg"
													onClick={() => handleApprovalAction("REJECTED")}
													disabled={actOnApprovalMutation.isPending}
												>
													<XCircle className="h-4 w-4 me-1" />
													رفض
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
				</div>

				{/* Audit Log Sidebar */}
				<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
					<h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
						<History className="inline h-5 w-5 me-2 text-slate-400" />
						{t("auditLog")}
					</h2>
					{document.auditLogs && document.auditLogs.length > 0 ? (
						<div className="space-y-3">
							{document.auditLogs.map((log) => (
								<div
									key={log.id}
									className="border-s-2 border-slate-200 ps-3 dark:border-slate-700"
								>
									<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
										{getActionLabel(log.action)}
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
