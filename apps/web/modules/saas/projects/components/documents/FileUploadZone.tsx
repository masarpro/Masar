"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Progress } from "@ui/components/progress";
import {
	Upload,
	File,
	Image,
	X,
	CheckCircle,
	AlertCircle,
	RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

interface FileUploadZoneProps {
	organizationId: string;
	projectId: string;
	onUploadComplete: (data: {
		storagePath: string;
		thumbnailPath?: string | null;
		fileName: string;
		fileSize: number;
		mimeType: string;
	}) => void;
	onRemove?: () => void;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ACCEPTED_TYPES = {
	"image/jpeg": [".jpg", ".jpeg"],
	"image/png": [".png"],
	"image/webp": [".webp"],
	"application/pdf": [".pdf"],
	"application/msword": [".doc"],
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
	"application/vnd.ms-excel": [".xls"],
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
	"application/vnd.ms-powerpoint": [".ppt"],
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
};

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
	if (mimeType.startsWith("image/")) {
		return <Image className="h-8 w-8 text-pink-500" />;
	}
	return <File className="h-8 w-8 text-blue-500" />;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export function FileUploadZone({
	organizationId,
	projectId,
	onUploadComplete,
	onRemove,
}: FileUploadZoneProps) {
	const t = useTranslations("projects.documents");
	const [uploadState, setUploadState] = useState<UploadState>("idle");
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadedFile, setUploadedFile] = useState<{
		name: string;
		size: number;
		mimeType: string;
	} | null>(null);
	const [errorMessage, setErrorMessage] = useState<string>("");

	const getUploadUrlMutation = useMutation(
		orpc.projectDocuments.getUploadUrl.mutationOptions({}),
	);

	const uploadFile = useCallback(
		async (file: File) => {
			setUploadState("uploading");
			setUploadProgress(0);
			setErrorMessage("");

			try {
				// Step 1: Get signed upload URL
				const uploadData = await getUploadUrlMutation.mutateAsync({
					organizationId,
					projectId,
					fileName: file.name,
					mimeType: file.type,
					fileSize: file.size,
				});

				// Step 2: Upload file to S3 via presigned URL with progress tracking
				await new Promise<void>((resolve, reject) => {
					const xhr = new XMLHttpRequest();

					xhr.upload.addEventListener("progress", (event) => {
						if (event.lengthComputable) {
							const percent = Math.round((event.loaded / event.total) * 100);
							setUploadProgress(percent);
						}
					});

					xhr.addEventListener("load", () => {
						if (xhr.status >= 200 && xhr.status < 300) {
							resolve();
						} else {
							reject(new Error(`Upload failed: ${xhr.status}`));
						}
					});

					xhr.addEventListener("error", () => reject(new Error("Network error")));
					xhr.addEventListener("timeout", () => reject(new Error("Upload timeout")));

					xhr.timeout = 60000; // 60 seconds
					xhr.open("PUT", uploadData.uploadUrl);
					xhr.setRequestHeader("Content-Type", file.type);
					xhr.send(file);
				});

				// Step 3: Upload thumbnail for images (client-side generation)
				let thumbnailPath = uploadData.thumbnailPath;
				if (
					file.type.startsWith("image/") &&
					uploadData.thumbnailUploadUrl &&
					uploadData.thumbnailPath
				) {
					try {
						const thumbnailBlob = await generateThumbnail(file, 300, 300);
						await fetch(uploadData.thumbnailUploadUrl, {
							method: "PUT",
							headers: { "Content-Type": "image/webp" },
							body: thumbnailBlob,
						});
					} catch {
						// Thumbnail failure is non-critical
						thumbnailPath = null;
					}
				}

				// Success
				setUploadState("success");
				setUploadedFile({
					name: file.name,
					size: file.size,
					mimeType: file.type,
				});

				onUploadComplete({
					storagePath: uploadData.storagePath,
					thumbnailPath,
					fileName: file.name,
					fileSize: file.size,
					mimeType: file.type,
				});
			} catch (error: any) {
				setUploadState("error");
				setErrorMessage(error?.message || t("uploadError"));
				toast.error(t("uploadError"));
			}
		},
		[organizationId, projectId, getUploadUrlMutation, onUploadComplete, t],
	);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const file = acceptedFiles[0];
			if (!file) return;

			if (file.size > MAX_FILE_SIZE) {
				toast.error(t("fileTooLarge"));
				return;
			}

			uploadFile(file);
		},
		[uploadFile, t],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: ACCEPTED_TYPES,
		maxFiles: 1,
		maxSize: MAX_FILE_SIZE,
		disabled: uploadState === "uploading",
		onDropRejected: (rejections) => {
			const error = rejections[0]?.errors[0];
			if (error?.code === "file-too-large") {
				toast.error(t("fileTooLarge"));
			} else if (error?.code === "file-invalid-type") {
				toast.error(t("invalidFileType"));
			}
		},
	});

	const handleRemove = () => {
		setUploadState("idle");
		setUploadedFile(null);
		setUploadProgress(0);
		setErrorMessage("");
		onRemove?.();
	};

	const handleRetry = () => {
		setUploadState("idle");
		setUploadProgress(0);
		setErrorMessage("");
	};

	// Success state
	if (uploadState === "success" && uploadedFile) {
		return (
			<div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-900/10">
				<div className="flex items-center gap-3">
					{getFileIcon(uploadedFile.mimeType)}
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
							{uploadedFile.name}
						</p>
						<div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
							<CheckCircle className="h-3.5 w-3.5" />
							<span>{t("uploadSuccess")}</span>
							<span className="text-slate-400">•</span>
							<span>{formatFileSize(uploadedFile.size)}</span>
						</div>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-8 w-8 shrink-0 rounded-lg text-slate-400 hover:text-red-500"
						onClick={handleRemove}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>
		);
	}

	// Error state
	if (uploadState === "error") {
		return (
			<div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/10">
				<div className="flex items-center gap-3">
					<AlertCircle className="h-8 w-8 shrink-0 text-red-500" />
					<div className="min-w-0 flex-1">
						<p className="text-sm font-medium text-red-700 dark:text-red-400">
							{t("uploadError")}
						</p>
						<p className="text-xs text-red-500">{errorMessage}</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="shrink-0 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30"
						onClick={handleRetry}
					>
						<RefreshCw className="h-4 w-4 me-1" />
						{t("retry")}
					</Button>
				</div>
			</div>
		);
	}

	// Uploading state
	if (uploadState === "uploading") {
		return (
			<div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
				<div className="space-y-3 text-center">
					<div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
					<div>
						<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
							{t("uploading")}...
						</p>
						<p className="text-xs text-slate-500">{uploadProgress}%</p>
					</div>
					<Progress value={uploadProgress} className="h-2" />
				</div>
			</div>
		);
	}

	// Idle state (dropzone)
	return (
		<div
			{...getRootProps()}
			className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
				isDragActive
					? "border-primary bg-primary/5"
					: "border-slate-300 bg-slate-50 hover:border-primary/50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-primary/50 dark:hover:bg-slate-800/50"
			}`}
		>
			<input {...getInputProps()} />
			<div className="flex flex-col items-center gap-3">
				<div className="rounded-2xl bg-slate-200 p-3 dark:bg-slate-700">
					<Upload className="h-6 w-6 text-slate-500 dark:text-slate-400" />
				</div>
				<div>
					<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
						{isDragActive ? t("dropHere") : t("dragAndDrop")}
					</p>
					<p className="mt-1 text-xs text-slate-500">
						{t("supportedFormats")} • {t("maxFileSize")}
					</p>
				</div>
			</div>
		</div>
	);
}

/**
 * Generate a thumbnail from an image file using canvas
 */
async function generateThumbnail(
	file: File,
	maxWidth: number,
	maxHeight: number,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const img = new window.Image();
		const url = URL.createObjectURL(file);

		img.onload = () => {
			URL.revokeObjectURL(url);

			let { width, height } = img;

			// Scale down maintaining aspect ratio
			if (width > maxWidth || height > maxHeight) {
				const ratio = Math.min(maxWidth / width, maxHeight / height);
				width = Math.round(width * ratio);
				height = Math.round(height * ratio);
			}

			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(new Error("Cannot get canvas context"));
				return;
			}

			ctx.drawImage(img, 0, 0, width, height);

			canvas.toBlob(
				(blob) => {
					if (blob) resolve(blob);
					else reject(new Error("Failed to create blob"));
				},
				"image/webp",
				0.8,
			);
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load image"));
		};

		img.src = url;
	});
}
