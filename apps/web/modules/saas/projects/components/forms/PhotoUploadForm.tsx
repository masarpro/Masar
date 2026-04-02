"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Label } from "@ui/components/label";
import { Progress } from "@ui/components/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import {
	Camera,
	ChevronLeft,
	Upload,
	X,
	CheckCircle,
	AlertCircle,
	RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

interface PhotoUploadFormProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

type PhotoCategory =
	| "PROGRESS"
	| "ISSUE"
	| "EQUIPMENT"
	| "MATERIAL"
	| "SAFETY"
	| "OTHER";

const CATEGORY_OPTIONS: PhotoCategory[] = [
	"PROGRESS",
	"ISSUE",
	"EQUIPMENT",
	"MATERIAL",
	"SAFETY",
	"OTHER",
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ACCEPTED_IMAGE_TYPES = {
	"image/jpeg": [".jpg", ".jpeg"],
	"image/png": [".png"],
	"image/webp": [".webp"],
};

const ATTACHMENTS_BUCKET =
	process.env.NEXT_PUBLIC_S3_ATTACHMENTS_BUCKET || "attachments";

type UploadState = "idle" | "uploading" | "uploaded" | "error";

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PhotoUploadForm({
	organizationId,
	organizationSlug,
	projectId,
}: PhotoUploadFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;

	const [caption, setCaption] = useState("");
	const [category, setCategory] = useState<PhotoCategory>("PROGRESS");
	const [uploadState, setUploadState] = useState<UploadState>("idle");
	const [uploadProgress, setUploadProgress] = useState(0);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
	const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
	const [uploadedFileSize, setUploadedFileSize] = useState<number>(0);
	const [errorMessage, setErrorMessage] = useState("");

	const getUploadUrlMutation = useMutation({
		...orpc.attachments.createUploadUrl.mutationOptions(),
	});

	const createPhotoMutation = useMutation({
		...orpc.projectField.createPhoto.mutationOptions(),
	});

	const uploadFile = useCallback(
		async (file: File) => {
			setUploadState("uploading");
			setUploadProgress(0);
			setErrorMessage("");
			setUploadedFileName(file.name);
			setUploadedFileSize(file.size);

			// Create preview
			const objectUrl = URL.createObjectURL(file);
			setPreviewUrl(objectUrl);

			try {
				// Step 1: Get signed upload URL
				const { uploadUrl, storagePath } =
					await getUploadUrlMutation.mutateAsync({
						organizationId,
						projectId,
						ownerType: "PHOTO" as const,
						fileName: file.name,
						fileSize: file.size,
						mimeType: file.type,
					});

				setUploadProgress(20);

				// Step 2: Upload file to S3 via presigned URL with progress tracking
				await new Promise<void>((resolve, reject) => {
					const xhr = new XMLHttpRequest();

					xhr.upload.addEventListener("progress", (event) => {
						if (event.lengthComputable) {
							const percent =
								20 + Math.round((event.loaded / event.total) * 70);
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

					xhr.addEventListener("error", () =>
						reject(new Error("Network error")),
					);
					xhr.addEventListener("timeout", () =>
						reject(new Error("Upload timeout")),
					);

					xhr.timeout = 120000; // 2 minutes for large images
					xhr.open("PUT", uploadUrl);
					xhr.setRequestHeader("Content-Type", file.type);
					xhr.send(file);
				});

				setUploadProgress(95);

				// Step 3: Construct the photo URL using image-proxy (absolute URL for backend validation)
				const origin = typeof window !== "undefined" ? window.location.origin : "";
				const photoUrl = `${origin}/image-proxy/${ATTACHMENTS_BUCKET}/${storagePath}`;
				setUploadedPhotoUrl(photoUrl);
				setUploadProgress(100);
				setUploadState("uploaded");
			} catch (error: unknown) {
				setUploadState("error");
				const msg =
					error instanceof Error ? error.message : t("projects.field.photoUploadError");
				setErrorMessage(msg);
			}
		},
		[organizationId, projectId, getUploadUrlMutation, t],
	);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const file = acceptedFiles[0];
			if (!file) return;

			if (file.size > MAX_FILE_SIZE) {
				toast.error(t("projects.documents.fileTooLarge"));
				return;
			}

			uploadFile(file);
		},
		[uploadFile, t],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: ACCEPTED_IMAGE_TYPES,
		maxFiles: 1,
		maxSize: MAX_FILE_SIZE,
		disabled: uploadState === "uploading",
		onDropRejected: (rejections) => {
			const error = rejections[0]?.errors[0];
			if (error?.code === "file-too-large") {
				toast.error(t("projects.documents.fileTooLarge"));
			} else if (error?.code === "file-invalid-type") {
				toast.error(t("projects.documents.invalidFileType"));
			}
		},
	});

	const handleReset = () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setUploadState("idle");
		setUploadProgress(0);
		setPreviewUrl(null);
		setUploadedPhotoUrl(null);
		setUploadedFileName(null);
		setUploadedFileSize(0);
		setErrorMessage("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!uploadedPhotoUrl) return;

		try {
			await createPhotoMutation.mutateAsync({
				organizationId,
				projectId,
				url: uploadedPhotoUrl,
				caption: caption || undefined,
				category,
			});

			toast.success(t("projects.field.photoUploaded"));
			queryClient.invalidateQueries({ queryKey: ["projectField"] });
			router.push(`${basePath}/execution`);
		} catch {
			toast.error(t("projects.field.photoUploadError"));
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					asChild
					className="shrink-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
				>
					<Link href={`${basePath}/execution`}>
						<ChevronLeft className="h-5 w-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
						{t("projects.field.uploadPhoto")}
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{t("projects.field.uploadPhotoSubtitle")}
					</p>
				</div>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
					{/* Upload Zone */}
					{uploadState === "idle" && (
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
										{isDragActive
											? t("projects.documents.dropHere")
											: t("projects.field.dragDropPhoto")}
									</p>
									<p className="mt-1 text-xs text-slate-500">
										JPG, PNG, WebP — {t("projects.field.maxSize25MB")}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Uploading state */}
					{uploadState === "uploading" && (
						<div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
							{previewUrl && (
								<div className="mb-4 overflow-hidden rounded-lg">
									<img
										src={previewUrl}
										alt=""
										className="max-h-48 w-full object-contain"
									/>
								</div>
							)}
							<div className="space-y-3 text-center">
								<div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
								<div>
									<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
										{t("projects.field.uploadingPhoto")}...
									</p>
									<p className="text-xs text-slate-500">{uploadProgress}%</p>
								</div>
								<Progress value={uploadProgress} className="h-2" />
							</div>
						</div>
					)}

					{/* Uploaded (success) state */}
					{uploadState === "uploaded" && previewUrl && (
						<div className="space-y-3">
							<div className="relative overflow-hidden rounded-xl border border-green-200 dark:border-green-900/50">
								<img
									src={previewUrl}
									alt=""
									className="max-h-64 w-full object-contain"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute end-2 top-2 h-8 w-8 rounded-lg bg-white/80 text-slate-500 hover:bg-white hover:text-red-500 dark:bg-slate-900/80 dark:hover:bg-slate-900"
									onClick={handleReset}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							<div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/10">
								<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
								<span className="text-sm font-medium text-green-700 dark:text-green-400">
									{t("projects.field.photoReady")}
								</span>
								{uploadedFileName && (
									<>
										<span className="text-slate-400">•</span>
										<span className="truncate text-xs text-slate-500">
											{uploadedFileName}
										</span>
										<span className="text-xs text-slate-400">
											({formatFileSize(uploadedFileSize)})
										</span>
									</>
								)}
							</div>
						</div>
					)}

					{/* Error state */}
					{uploadState === "error" && (
						<div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/10">
							<div className="flex items-center gap-3">
								<AlertCircle className="h-8 w-8 shrink-0 text-red-500" />
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-red-700 dark:text-red-400">
										{t("projects.field.photoUploadError")}
									</p>
									<p className="text-xs text-red-500">{errorMessage}</p>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="shrink-0 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30"
									onClick={handleReset}
								>
									<RefreshCw className="me-1 h-4 w-4" />
									{t("projects.documents.retry")}
								</Button>
							</div>
						</div>
					)}

					{/* Category */}
					<div className="mt-6 space-y-2">
						<Label>{t("projects.field.categoryLabel")}</Label>
						<Select
							value={category}
							onValueChange={(v: string) => setCategory(v as PhotoCategory)}
						>
							<SelectTrigger className="rounded-xl">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{CATEGORY_OPTIONS.map((cat) => (
									<SelectItem key={cat} value={cat}>
										{t(`projects.field.photoCategory.${cat}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Caption */}
					<div className="mt-6 space-y-2">
						<Label htmlFor="caption">{t("projects.field.caption")}</Label>
						<Textarea
							id="caption"
							value={caption}
							onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCaption(e.target.value)}
							placeholder={t("projects.field.captionPlaceholder")}
							rows={2}
							className="rounded-xl"
						/>
					</div>
				</div>

				{/* Submit */}
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push(`${basePath}/execution`)}
						className="rounded-xl"
					>
						{t("common.cancel")}
					</Button>
					<Button
						type="submit"
						disabled={
							createPhotoMutation.isPending || uploadState !== "uploaded"
						}
						className="min-w-[120px] rounded-xl"
					>
						<Camera className="me-2 h-4 w-4" />
						{createPhotoMutation.isPending
							? t("common.saving")
							: t("projects.field.addPhoto")}
					</Button>
				</div>
			</form>
		</div>
	);
}
