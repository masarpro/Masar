"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
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
import {
	AlertCircle,
	CheckCircle,
	File,
	Image,
	RefreshCw,
	Upload,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

interface LeadFileUploadZoneProps {
	organizationId: string;
	leadId: string;
	onUploadComplete: () => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
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
	"application/x-dwg": [".dwg"],
	"application/x-autocad": [".dwg"],
};

const FILE_CATEGORIES = ["BLUEPRINT", "STRUCTURE", "SITE_PHOTO", "SCOPE", "OTHER"] as const;

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

export function LeadFileUploadZone({
	organizationId,
	leadId,
	onUploadComplete,
}: LeadFileUploadZoneProps) {
	const t = useTranslations();
	const [uploadState, setUploadState] = useState<UploadState>("idle");
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; mimeType: string } | null>(null);
	const [errorMessage, setErrorMessage] = useState("");
	const [category, setCategory] = useState<string>("OTHER");

	const getUploadUrlMutation = useMutation(
		orpc.pricing.leads.files.getUploadUrl.mutationOptions({}),
	);

	const saveFileMutation = useMutation(
		orpc.pricing.leads.files.saveFile.mutationOptions({}),
	);

	const uploadFile = useCallback(
		async (file: File) => {
			setUploadState("uploading");
			setUploadProgress(0);
			setErrorMessage("");

			try {
				const uploadData = await getUploadUrlMutation.mutateAsync({
					organizationId,
					leadId,
					fileName: file.name,
					mimeType: file.type,
					fileSize: file.size,
				});

				await new Promise<void>((resolve, reject) => {
					const xhr = new XMLHttpRequest();
					xhr.upload.addEventListener("progress", (event) => {
						if (event.lengthComputable) {
							setUploadProgress(Math.round((event.loaded / event.total) * 100));
						}
					});
					xhr.addEventListener("load", () => {
						if (xhr.status >= 200 && xhr.status < 300) resolve();
						else reject(new Error(`Upload failed: ${xhr.status}`));
					});
					xhr.addEventListener("error", () => reject(new Error("Network error")));
					xhr.timeout = 120000;
					xhr.open("PUT", uploadData.uploadUrl);
					xhr.setRequestHeader("Content-Type", file.type);
					xhr.send(file);
				});

				await saveFileMutation.mutateAsync({
					organizationId,
					leadId,
					name: file.name,
					storagePath: uploadData.storagePath,
					fileSize: file.size,
					mimeType: file.type,
					category: category as any,
				});

				setUploadState("success");
				setUploadedFile({ name: file.name, size: file.size, mimeType: file.type });
				onUploadComplete();
			} catch (error: any) {
				setUploadState("error");
				setErrorMessage(error?.message || t("pricing.leads.detail.uploadError"));
				toast.error(t("pricing.leads.detail.uploadError"));
			}
		},
		[organizationId, leadId, category, getUploadUrlMutation, saveFileMutation, onUploadComplete, t],
	);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const file = acceptedFiles[0];
			if (!file) return;
			if (file.size > MAX_FILE_SIZE) {
				toast.error(t("pricing.leads.detail.fileTooLarge"));
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
			if (error?.code === "file-too-large") toast.error(t("pricing.leads.detail.fileTooLarge"));
			else if (error?.code === "file-invalid-type") toast.error(t("pricing.leads.detail.invalidFileType"));
		},
	});

	const handleReset = () => {
		setUploadState("idle");
		setUploadedFile(null);
		setUploadProgress(0);
		setErrorMessage("");
	};

	if (uploadState === "success" && uploadedFile) {
		return (
			<div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-900/10">
				<div className="flex items-center gap-3">
					{getFileIcon(uploadedFile.mimeType)}
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium text-foreground">{uploadedFile.name}</p>
						<div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
							<CheckCircle className="h-3.5 w-3.5" />
							<span>{t("pricing.leads.detail.uploadSuccess")}</span>
							<span className="text-muted-foreground">•</span>
							<span>{formatFileSize(uploadedFile.size)}</span>
						</div>
					</div>
					<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg" onClick={handleReset}>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>
		);
	}

	if (uploadState === "error") {
		return (
			<div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/10">
				<div className="flex items-center gap-3">
					<AlertCircle className="h-8 w-8 shrink-0 text-red-500" />
					<div className="min-w-0 flex-1">
						<p className="text-sm font-medium text-red-700 dark:text-red-400">{t("pricing.leads.detail.uploadError")}</p>
						<p className="text-xs text-red-500">{errorMessage}</p>
					</div>
					<Button variant="ghost" size="sm" className="shrink-0 rounded-lg text-red-600" onClick={handleReset}>
						<RefreshCw className="h-4 w-4 me-1" />
						{t("pricing.leads.detail.retry")}
					</Button>
				</div>
			</div>
		);
	}

	if (uploadState === "uploading") {
		return (
			<div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
				<div className="space-y-3 text-center">
					<div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
					<p className="text-sm font-medium text-foreground">{t("pricing.leads.detail.uploading")}... {uploadProgress}%</p>
					<Progress value={uploadProgress} className="h-2" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div>
				<Label>{t("pricing.leads.detail.fileCategory")}</Label>
				<Select value={category} onValueChange={setCategory}>
					<SelectTrigger className="mt-1.5 rounded-xl">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="rounded-xl">
						{FILE_CATEGORIES.map((c) => (
							<SelectItem key={c} value={c}>
								{t(`pricing.leads.detail.categories.${c}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div
				{...getRootProps()}
				className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
					isDragActive
						? "border-primary bg-primary/5"
						: "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
				}`}
			>
				<input {...getInputProps()} />
				<div className="flex flex-col items-center gap-3">
					<div className="rounded-2xl bg-muted p-3">
						<Upload className="h-6 w-6 text-muted-foreground" />
					</div>
					<div>
						<p className="text-sm font-medium text-foreground">
							{isDragActive ? t("pricing.leads.detail.dropHere") : t("pricing.leads.detail.dragAndDrop")}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{t("pricing.leads.detail.supportedFormats")}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
