"use client";

import { config } from "@repo/config";
import { CropImageDialog } from "@saas/settings/components/CropImageDialog";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { ImageIcon, Loader2, Trash2, Upload, Save, RefreshCw } from "lucide-react";

interface FinanceLogoUploadProps {
	organizationId: string;
	currentLogoUrl: string;
	onLogoChange: (url: string) => void;
	onLogoRemove: () => void;
}

export function FinanceLogoUpload({
	organizationId,
	currentLogoUrl,
	onLogoChange,
	onLogoRemove,
}: FinanceLogoUploadProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [uploading, setUploading] = useState(false);
	const [cropDialogOpen, setCropDialogOpen] = useState(false);
	const [image, setImage] = useState<File | null>(null);
	// Pending URL after S3 upload, before DB save
	const [pendingLogoUrl, setPendingLogoUrl] = useState<string | null>(null);
	const [uploadedAt, setUploadedAt] = useState<number | null>(null);

	const getSignedUploadUrlMutation = useMutation(
		orpc.finance.settings.createLogoUploadUrl.mutationOptions(),
	);

	// Save logo directly to DB
	const saveMutation = useMutation({
		mutationFn: async (logoUrl: string) => {
			return orpcClient.finance.settings.update({
				organizationId,
				logo: logoUrl,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.settings.logoUploadSuccess"));
			// Sync parent state and clear pending
			if (pendingLogoUrl) {
				onLogoChange(pendingLogoUrl);
			}
			setPendingLogoUrl(null);
			// Invalidate settings queries so other pages pick up the new logo
			queryClient.invalidateQueries({
				predicate: (query) => {
					const key = query.queryKey as string[];
					return key.some((k) => typeof k === "string" && k.includes("settings"));
				},
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.settings.logoUploadError"));
		},
	});

	// Remove logo from DB
	const removeMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.settings.update({
				organizationId,
				logo: "",
			});
		},
		onSuccess: () => {
			toast.success(t("finance.settings.updateSuccess"));
			onLogoRemove();
			setPendingLogoUrl(null);
			setUploadedAt(null);
			queryClient.invalidateQueries({
				predicate: (query) => {
					const key = query.queryKey as string[];
					return key.some((k) => typeof k === "string" && k.includes("settings"));
				},
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.settings.logoUploadError"));
		},
	});

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: (acceptedFiles) => {
			if (acceptedFiles[0]) {
				setImage(acceptedFiles[0]);
				setCropDialogOpen(true);
			}
		},
		accept: {
			"image/png": [".png"],
			"image/jpeg": [".jpg", ".jpeg"],
		},
		multiple: false,
		maxSize: 5 * 1024 * 1024, // 5MB
	});

	const resolveLogoSrc = (url: string) => {
		if (!url) return "";
		if (url.startsWith("http") || url.startsWith("/")) return url;
		return `/image-proxy/${config.storage.bucketNames.avatars}/${url}`;
	};

	const onCrop = async (croppedImageData: Blob | null) => {
		if (!croppedImageData) return;

		setUploading(true);
		try {
			const { signedUploadUrl, path } =
				await getSignedUploadUrlMutation.mutateAsync({
					organizationId,
				});

			const response = await fetch(signedUploadUrl, {
				method: "PUT",
				body: croppedImageData,
				headers: {
					"Content-Type": "image/png",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to upload image");
			}

			const proxyUrl = `/image-proxy/${config.storage.bucketNames.avatars}/${path}`;
			setPendingLogoUrl(proxyUrl);
			setUploadedAt(Date.now());
		} catch {
			toast.error(t("finance.settings.logoUploadError"));
		} finally {
			setUploading(false);
		}
	};

	const handleSaveLogo = () => {
		if (pendingLogoUrl) {
			saveMutation.mutate(pendingLogoUrl);
		}
	};

	const handleRemoveLogo = () => {
		removeMutation.mutate();
	};

	// Determine what to show
	const displayUrl = pendingLogoUrl || currentLogoUrl;
	const hasPending = !!pendingLogoUrl;
	const hasSavedLogo = !hasPending && !!currentLogoUrl;

	const previewSrc = displayUrl
		? `${resolveLogoSrc(displayUrl)}${uploadedAt ? `?t=${uploadedAt}` : ""}`
		: "";

	return (
		<div className="space-y-4">
			{displayUrl ? (
				// ── Logo preview (pending or saved) ──
				<div className="flex flex-col items-center gap-4 p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
					<div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
						<img
							src={previewSrc}
							alt="Logo"
							className="h-24 w-auto max-w-[240px] object-contain"
						/>
					</div>

					{hasPending ? (
						// Pending: show Save button
						<Button
							type="button"
							onClick={handleSaveLogo}
							disabled={saveMutation.isPending}
							className="rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
						>
							{saveMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 ms-2 animate-spin" />
									{t("common.saving")}
								</>
							) : (
								<>
									<Save className="h-4 w-4 ms-2" />
									{t("finance.settings.logoSave")}
								</>
							)}
						</Button>
					) : (
						// Saved: show Change + Delete buttons
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									// Open file picker via hidden dropzone
									const input = document.querySelector<HTMLInputElement>(
										"#finance-logo-dropzone-input",
									);
									input?.click();
								}}
								className="rounded-xl"
							>
								<RefreshCw className="h-4 w-4 ms-2" />
								{t("finance.settings.logoChange")}
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleRemoveLogo}
								disabled={removeMutation.isPending}
								className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
							>
								{removeMutation.isPending ? (
									<Loader2 className="h-4 w-4 ms-2 animate-spin" />
								) : (
									<Trash2 className="h-4 w-4 ms-2" />
								)}
								{t("common.delete")}
							</Button>
						</div>
					)}
				</div>
			) : (
				// ── No logo: show upload dropzone ──
				<div
					{...getRootProps()}
					className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors ${
						isDragActive
							? "border-primary bg-primary/5"
							: "border-slate-300 dark:border-slate-600 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
					} p-6`}
				>
					<input {...getInputProps()} />
					{uploading ? (
						<div className="flex flex-col items-center gap-2">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
							<p className="text-sm text-slate-500">{t("upload.uploading")}</p>
						</div>
					) : (
						<div className="flex flex-col items-center gap-2 text-center">
							{isDragActive ? (
								<Upload className="h-8 w-8 text-primary" />
							) : (
								<ImageIcon className="h-8 w-8 text-slate-400" />
							)}
							<div>
								<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
									{t("finance.settings.logoDropzoneTitle")}
								</p>
								<p className="text-xs text-slate-500 mt-1">
									{t("finance.settings.logoDropzoneHint")}
								</p>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Hidden input for "Change" button file picker */}
			<input
				id="finance-logo-dropzone-input"
				type="file"
				accept="image/png,image/jpeg"
				className="hidden"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) {
						setImage(file);
						setCropDialogOpen(true);
					}
					e.target.value = "";
				}}
			/>

			<CropImageDialog
				image={image}
				open={cropDialogOpen}
				onOpenChange={setCropDialogOpen}
				onCrop={onCrop}
				aspectRatio={NaN}
				maxWidth={512}
				maxHeight={512}
				title={t("finance.settings.logoCropTitle")}
				saveLabel={t("common.save")}
			/>
		</div>
	);
}
