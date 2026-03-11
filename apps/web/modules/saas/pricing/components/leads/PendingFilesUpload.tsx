"use client";

import { Button } from "@ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { File, Image, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

export interface PendingFile {
	id: string;
	file: File;
	name: string;
	size: number;
	mimeType: string;
	category: string;
	preview?: string;
}

interface PendingFilesUploadProps {
	files: PendingFile[];
	onFilesChange: (files: PendingFile[]) => void;
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
		return <Image className="h-5 w-5 text-pink-500 shrink-0" />;
	}
	return <File className="h-5 w-5 text-blue-500 shrink-0" />;
}

export function PendingFilesUpload({ files, onFilesChange }: PendingFilesUploadProps) {
	const t = useTranslations();

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const newFiles: PendingFile[] = acceptedFiles
				.filter((f) => f.size <= MAX_FILE_SIZE)
				.map((f) => ({
					id: crypto.randomUUID(),
					file: f,
					name: f.name,
					size: f.size,
					mimeType: f.type,
					category: "OTHER",
					preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
				}));

			if (newFiles.length < acceptedFiles.length) {
				toast.error(t("pricing.leads.detail.fileTooLarge"));
			}

			onFilesChange([...files, ...newFiles]);
		},
		[files, onFilesChange, t],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: ACCEPTED_TYPES,
		maxSize: MAX_FILE_SIZE,
		onDropRejected: (rejections) => {
			const error = rejections[0]?.errors[0];
			if (error?.code === "file-too-large") toast.error(t("pricing.leads.detail.fileTooLarge"));
			else if (error?.code === "file-invalid-type") toast.error(t("pricing.leads.detail.invalidFileType"));
		},
	});

	const removeFile = (id: string) => {
		const removed = files.find((f) => f.id === id);
		if (removed?.preview) URL.revokeObjectURL(removed.preview);
		onFilesChange(files.filter((f) => f.id !== id));
	};

	const updateCategory = (id: string, category: string) => {
		onFilesChange(files.map((f) => (f.id === id ? { ...f, category } : f)));
	};

	return (
		<div className="space-y-3">
			{/* Drop Zone */}
			<div
				{...getRootProps()}
				className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
					isDragActive
						? "border-primary bg-primary/5"
						: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-primary/50 hover:bg-slate-100 dark:hover:bg-slate-800"
				}`}
			>
				<input {...getInputProps()} />
				<div className="flex flex-col items-center gap-2">
					<div className="rounded-xl bg-slate-200/50 dark:bg-slate-700/50 p-2.5">
						<Upload className="h-5 w-5 text-slate-500 dark:text-slate-400" />
					</div>
					<div>
						<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
							{isDragActive ? t("pricing.leads.detail.dropHere") : t("pricing.leads.detail.dragAndDrop")}
						</p>
						<p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
							{t("pricing.leads.detail.supportedFormats")}
						</p>
					</div>
				</div>
			</div>

			{/* Staged Files List */}
			{files.length > 0 && (
				<div className="space-y-2">
					{files.map((pf) => (
						<div
							key={pf.id}
							className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3"
						>
							{/* Thumbnail or Icon */}
							{pf.preview ? (
								<img
									src={pf.preview}
									alt={pf.name}
									className="h-10 w-10 rounded-lg object-cover shrink-0"
								/>
							) : (
								getFileIcon(pf.mimeType)
							)}

							{/* File Info */}
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
									{pf.name}
								</p>
								<p className="text-xs text-slate-500 dark:text-slate-400">
									{formatFileSize(pf.size)}
								</p>
							</div>

							{/* Category Select */}
							<Select value={pf.category} onValueChange={(v: any) => updateCategory(pf.id, v)}>
								<SelectTrigger className="w-[120px] h-8 text-xs rounded-lg border-slate-200 dark:border-slate-700">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{FILE_CATEGORIES.map((c) => (
										<SelectItem key={c} value={c} className="text-xs">
											{t(`pricing.leads.detail.categories.${c}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Remove Button */}
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-7 w-7 shrink-0 rounded-lg text-slate-400 hover:text-red-500"
								onClick={() => removeFile(pf.id)}
							>
								<X className="h-3.5 w-3.5" />
							</Button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
