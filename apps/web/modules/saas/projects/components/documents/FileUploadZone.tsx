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

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB — يدعم ملفات Revit/Max/CAD الكبيرة
// allowlist بالامتداد (ملفات CAD/3D ترسل MIME فارغ، فالاعتماد على الامتداد أوثق)
const ACCEPTED_TYPES = {
	"image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff", ".svg", ".heic"],
	"application/pdf": [".pdf"],
	"application/msword": [".doc"],
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
	"application/vnd.ms-excel": [".xls"],
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
	"application/vnd.ms-powerpoint": [".ppt"],
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
	"text/plain": [".txt", ".csv", ".rtf"],
	"application/zip": [".zip", ".rar", ".7z"],
	"video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
	// تصميم هندسي/معماري وثلاثي الأبعاد
	"application/octet-stream": [
		".dwg", ".dxf", ".dwf", ".rvt", ".rfa", ".rte", ".skp", ".max", ".3ds",
		".obj", ".fbx", ".stl", ".dae", ".blend", ".ls", ".lsproj", ".ifc",
		".nwd", ".nwc", ".pln", ".pla", ".ai", ".psd", ".indd", ".eps",
	],
};

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
	if (mimeType.startsWith("image/")) {
		return <Image className="h-8 w-8 text-chart-2" />;
	}
	return <File className="h-8 w-8 text-chart-4" />;
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

			// ملفات CAD/3D قد ترسل MIME فارغ — استخدم بديلاً
			const mimeType = file.type || "application/octet-stream";

			try {
				// Step 1: Get signed upload URL
				const uploadData = await getUploadUrlMutation.mutateAsync({
					organizationId,
					projectId,
					fileName: file.name,
					mimeType,
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

					xhr.timeout = 10 * 60 * 1000; // 10 دقائق للملفات الكبيرة
					xhr.open("PUT", uploadData.uploadUrl);
					if (file.type) xhr.setRequestHeader("Content-Type", file.type);
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
					mimeType,
				});

				onUploadComplete({
					storagePath: uploadData.storagePath,
					thumbnailPath,
					fileName: file.name,
					fileSize: file.size,
					mimeType,
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
			<div className="rounded-xl border-2 border-success/40 bg-card p-4">
				<div className="flex items-center gap-3">
					{getFileIcon(uploadedFile.mimeType)}
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium text-card-foreground">
							{uploadedFile.name}
						</p>
						<div className="flex items-center gap-2 text-xs text-success">
							<CheckCircle className="h-3.5 w-3.5" />
							<span>{t("uploadSuccess")}</span>
							<span className="text-muted-foreground">•</span>
							<span>{formatFileSize(uploadedFile.size)}</span>
						</div>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
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
			<div className="rounded-xl border-2 border-destructive/40 bg-card p-4">
				<div className="flex items-center gap-3">
					<AlertCircle className="h-8 w-8 shrink-0 text-destructive" />
					<div className="min-w-0 flex-1">
						<p className="text-sm font-medium text-destructive">
							{t("uploadError")}
						</p>
						<p className="text-xs text-destructive">{errorMessage}</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="shrink-0 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
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
						<p className="text-sm font-medium text-card-foreground">
							{t("uploading")}...
						</p>
						<p className="text-xs text-muted-foreground">{uploadProgress}%</p>
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
					: "border-input bg-card hover:border-primary/50 hover:bg-accent"
			}`}
		>
			<input {...getInputProps()} />
			<div className="flex flex-col items-center gap-3">
				<div className="rounded-2xl bg-muted p-3">
					<Upload className="h-6 w-6 text-muted-foreground" />
				</div>
				<div>
					<p className="text-sm font-medium text-card-foreground">
						{isDragActive ? t("dropHere") : t("dragAndDrop")}
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
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
