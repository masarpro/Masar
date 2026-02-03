"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Progress } from "@ui/components/progress";
import { Upload, X, FileIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";

type AttachmentOwnerType =
	| "DOCUMENT"
	| "PHOTO"
	| "EXPENSE"
	| "ISSUE"
	| "MESSAGE"
	| "CLAIM";

interface UploadButtonProps {
	organizationId: string;
	projectId?: string;
	ownerType: AttachmentOwnerType;
	ownerId: string;
	onUploadComplete?: (attachment: {
		id: string;
		fileName: string;
		fileSize: number;
		mimeType: string;
		storagePath: string;
	}) => void;
	accept?: string;
	maxSize?: number; // in bytes
	disabled?: boolean;
	className?: string;
}

export function UploadButton({
	organizationId,
	projectId,
	ownerType,
	ownerId,
	onUploadComplete,
	accept,
	maxSize = 50 * 1024 * 1024, // 50MB default
	disabled = false,
	className,
}: UploadButtonProps) {
	const t = useTranslations();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const getUploadUrlMutation = useMutation({
		...orpc.attachments.createUploadUrl.mutationOptions(),
	});

	const finalizeUploadMutation = useMutation({
		...orpc.attachments.finalizeUpload.mutationOptions(),
	});

	const handleClick = () => {
		if (!disabled && !uploading) {
			fileInputRef.current?.click();
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file size
		if (file.size > maxSize) {
			const maxSizeMB = Math.round(maxSize / (1024 * 1024));
			toast.error(`حجم الملف يتجاوز الحد المسموح (${maxSizeMB} ميجابايت)`);
			return;
		}

		setSelectedFile(file);
		setUploading(true);
		setProgress(0);

		try {
			// Step 1: Get signed upload URL
			const { uploadUrl, uploadId, storagePath } = await getUploadUrlMutation.mutateAsync({
				organizationId,
				projectId,
				ownerType,
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
			});

			setProgress(20);

			// Step 2: Upload file to storage
			const uploadResponse = await fetch(uploadUrl, {
				method: "PUT",
				body: file,
				headers: {
					"Content-Type": file.type,
				},
			});

			if (!uploadResponse.ok) {
				throw new Error("فشل رفع الملف");
			}

			setProgress(70);

			// Step 3: Finalize upload and create attachment record
			const attachment = await finalizeUploadMutation.mutateAsync({
				organizationId,
				projectId,
				uploadId,
				ownerType,
				ownerId,
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				storagePath,
			});

			setProgress(100);

			toast.success("تم رفع الملف بنجاح");
			onUploadComplete?.(attachment);
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("فشل رفع الملف");
		} finally {
			setUploading(false);
			setProgress(0);
			setSelectedFile(null);
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const handleCancel = () => {
		setUploading(false);
		setProgress(0);
		setSelectedFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className={className}>
			<input
				ref={fileInputRef}
				type="file"
				accept={accept}
				onChange={handleFileChange}
				className="hidden"
				disabled={disabled || uploading}
			/>

			{uploading ? (
				<div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
					<FileIcon className="h-5 w-5 text-slate-500 shrink-0" />
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
							{selectedFile?.name}
						</p>
						<Progress value={progress} className="h-1.5 mt-1" />
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleCancel}
						className="shrink-0"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			) : (
				<Button
					variant="outline"
					onClick={handleClick}
					disabled={disabled}
					className="rounded-xl"
				>
					{getUploadUrlMutation.isPending || finalizeUploadMutation.isPending ? (
						<Loader2 className="h-4 w-4 me-2 animate-spin" />
					) : (
						<Upload className="h-4 w-4 me-2" />
					)}
					{t("upload.selectFile")}
				</Button>
			)}
		</div>
	);
}
