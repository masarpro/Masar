"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Progress } from "@ui/components/progress";
import { cn } from "@ui/lib";
import { AlertCircle, CheckCircle, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { formatFileSize, getFileTypeStyle } from "./file-icons";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

type ItemStatus = "pending" | "uploading" | "done" | "error";

interface UploadItem {
	id: string;
	file: File;
	progress: number;
	status: ItemStatus;
	error?: string;
}

interface UploadDocumentDialogProps {
	organizationId: string;
	projectId: string;
	/** المجلد الهدف — null = غير مصنّف */
	folderId: string | null;
	folderName?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function stripExt(name: string): string {
	const i = name.lastIndexOf(".");
	return i > 0 ? name.slice(0, i) : name;
}

export function UploadDocumentDialog({
	organizationId,
	projectId,
	folderId,
	folderName,
	open,
	onOpenChange,
}: UploadDocumentDialogProps) {
	const t = useTranslations("projects.documents");
	const tCommon = useTranslations("common");
	const queryClient = useQueryClient();

	const [items, setItems] = useState<UploadItem[]>([]);
	const [isUploading, setIsUploading] = useState(false);

	const getUploadUrlMutation = useMutation(
		orpc.projectDocuments.getUploadUrl.mutationOptions({}),
	);
	const createMutation = useMutation(
		orpc.projectDocuments.create.mutationOptions({}),
	);

	const onDrop = useCallback((accepted: File[]) => {
		const mapped: UploadItem[] = accepted.map((file, idx) => ({
			id: `${file.name}-${file.size}-${idx}-${file.lastModified}`,
			file,
			progress: 0,
			status: "pending",
		}));
		setItems((prev) => [...prev, ...mapped]);
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		maxSize: MAX_FILE_SIZE,
		disabled: isUploading,
		onDropRejected: (rejections) => {
			const error = rejections[0]?.errors[0];
			if (error?.code === "file-too-large") toast.error(t("fileTooLarge"));
			else toast.error(t("invalidFileType"));
		},
	});

	const setItem = (id: string, patch: Partial<UploadItem>) =>
		setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

	const removeItem = (id: string) =>
		setItems((prev) => prev.filter((it) => it.id !== id));

	const uploadOne = async (item: UploadItem) => {
		const file = item.file;
		setItem(item.id, { status: "uploading", progress: 0 });

		// 1) الحصول على رابط رفع موقّع
		const uploadData = await getUploadUrlMutation.mutateAsync({
			organizationId,
			projectId,
			fileName: file.name,
			mimeType: file.type || "application/octet-stream",
			fileSize: file.size,
		});

		// 2) رفع الملف إلى S3 مع تتبّع التقدّم
		await new Promise<void>((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.upload.addEventListener("progress", (event) => {
				if (event.lengthComputable) {
					setItem(item.id, {
						progress: Math.round((event.loaded / event.total) * 100),
					});
				}
			});
			xhr.addEventListener("load", () =>
				xhr.status >= 200 && xhr.status < 300
					? resolve()
					: reject(new Error(`Upload failed: ${xhr.status}`)),
			);
			xhr.addEventListener("error", () => reject(new Error("Network error")));
			xhr.addEventListener("timeout", () => reject(new Error("Upload timeout")));
			xhr.timeout = 10 * 60 * 1000; // 10 دقائق للملفات الكبيرة
			xhr.open("PUT", uploadData.uploadUrl);
			if (file.type) xhr.setRequestHeader("Content-Type", file.type);
			xhr.send(file);
		});

		// 3) إنشاء سجل المستند
		await createMutation.mutateAsync({
			organizationId,
			projectId,
			folderId: folderId ?? undefined,
			title: stripExt(file.name),
			uploadType: "FILE",
			storagePath: uploadData.storagePath,
			thumbnailPath: uploadData.thumbnailPath ?? undefined,
			fileName: file.name,
			fileSize: file.size,
			mimeType: file.type || "application/octet-stream",
		});

		setItem(item.id, { status: "done", progress: 100 });
	};

	const handleUploadAll = async () => {
		const pending = items.filter((it) => it.status === "pending" || it.status === "error");
		if (!pending.length) return;
		setIsUploading(true);
		let anySuccess = false;
		for (const item of pending) {
			try {
				await uploadOne(item);
				anySuccess = true;
			} catch (error: any) {
				setItem(item.id, { status: "error", error: error?.message || t("uploadError") });
			}
		}
		setIsUploading(false);
		if (anySuccess) {
			queryClient.invalidateQueries({ queryKey: [["projectDocuments", "list"]] });
			queryClient.invalidateQueries({ queryKey: [["projectDocuments", "listFolders"]] });
			toast.success(t("uploadSuccess"));
		}
		// إغلاق تلقائي إذا اكتمل الكل بنجاح
		if (items.every((it) => it.status === "done")) {
			handleClose();
		}
	};

	const handleClose = () => {
		if (isUploading) return;
		setItems([]);
		onOpenChange(false);
	};

	const allDone = items.length > 0 && items.every((it) => it.status === "done");
	const pendingCount = items.filter(
		(it) => it.status === "pending" || it.status === "error",
	).length;

	return (
		<Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{folderName ? t("uploadToFolder", { name: folderName }) : t("uploadFile")}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Dropzone */}
					<div
						{...getRootProps()}
						className={cn(
							"cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors",
							isDragActive
								? "border-primary bg-primary/5"
								: "border-slate-300 bg-slate-50 hover:border-primary/50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-primary/50 dark:hover:bg-slate-800/50",
						)}
					>
						<input {...getInputProps()} />
						<div className="flex flex-col items-center gap-2">
							<div className="rounded-2xl bg-slate-200 p-3 dark:bg-slate-700">
								<Upload className="h-6 w-6 text-slate-500 dark:text-slate-400" />
							</div>
							<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{isDragActive ? t("dropHere") : t("dragAndDrop")}
							</p>
							<p className="text-xs text-slate-500">{t("maxFileSize")}</p>
						</div>
					</div>

					{/* Items list */}
					{items.length > 0 && (
						<div className="max-h-64 space-y-2 overflow-y-auto pe-1">
							{items.map((item) => {
								const { icon: Icon, bg, color } = getFileTypeStyle(item.file.name, item.file.type);
								return (
									<div
										key={item.id}
										className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900"
									>
										<span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", bg)}>
											<Icon className={cn("h-5 w-5", color)} />
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
												{item.file.name}
											</p>
											{item.status === "uploading" ? (
												<Progress value={item.progress} className="mt-1 h-1.5" />
											) : (
												<p className="text-xs text-slate-500">
													{item.status === "error" ? (
														<span className="text-red-500">{item.error}</span>
													) : (
														formatFileSize(item.file.size)
													)}
												</p>
											)}
										</div>
										{item.status === "done" ? (
											<CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
										) : item.status === "error" ? (
											<AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
										) : item.status === "pending" && !isUploading ? (
											<button
												type="button"
												onClick={() => removeItem(item.id)}
												className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-red-500"
											>
												<X className="h-4 w-4" />
											</button>
										) : (
											<span className="w-6 shrink-0 text-center text-xs text-slate-400">
												{item.progress}%
											</span>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						className="rounded-xl"
						onClick={handleClose}
						disabled={isUploading}
					>
						{allDone ? tCommon("close") : tCommon("cancel")}
					</Button>
					{!allDone && (
						<Button
							type="button"
							className="rounded-xl"
							onClick={handleUploadAll}
							disabled={isUploading || pendingCount === 0}
						>
							{isUploading
								? t("uploading")
								: t("uploadCount", { count: pendingCount })}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
