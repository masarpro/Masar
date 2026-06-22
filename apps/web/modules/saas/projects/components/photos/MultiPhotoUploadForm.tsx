"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
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
	Camera,
	CheckCircle,
	ChevronRight,
	Loader2,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useId, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

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

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = {
	"image/jpeg": [".jpg", ".jpeg"],
	"image/png": [".png"],
	"image/webp": [".webp"],
};

const ATTACHMENTS_BUCKET =
	process.env.NEXT_PUBLIC_S3_ATTACHMENTS_BUCKET || "attachments";

type ItemStatus = "idle" | "uploading" | "uploaded" | "saved" | "error";

interface QueueItem {
	id: string;
	file: File;
	previewUrl: string;
	caption: string;
	progress: number;
	status: ItemStatus;
	uploadedUrl?: string;
	errorMessage?: string;
}

interface MultiPhotoUploadFormProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	/** Optional return path after successful submit (defaults to photos page). */
	returnTo?: string;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MultiPhotoUploadForm({
	organizationId,
	organizationSlug,
	projectId,
	returnTo,
}: MultiPhotoUploadFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const reactId = useId();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const defaultReturnTo = `${basePath}/photos`;

	const [items, setItems] = useState<QueueItem[]>([]);
	const [category, setCategory] = useState<PhotoCategory>("PROGRESS");
	const [milestoneId, setMilestoneId] = useState<string>("none");
	const [submitting, setSubmitting] = useState(false);

	const getUploadUrlMutation = useMutation({
		...orpc.attachments.createUploadUrl.mutationOptions(),
	});
	const createPhotoMutation = useMutation({
		...orpc.projectField.createPhoto.mutationOptions(),
	});

	const milestonesQuery = useQuery(
		orpc.projectTimeline.listMilestones.queryOptions({
			input: { organizationId, projectId, limit: 200 },
		}),
	);

	const updateItem = useCallback((id: string, patch: Partial<QueueItem>) => {
		setItems((prev) =>
			prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
		);
	}, []);

	const uploadFile = useCallback(
		async (item: QueueItem) => {
			updateItem(item.id, { status: "uploading", progress: 0, errorMessage: undefined });
			try {
				const { uploadUrl, storagePath } =
					await getUploadUrlMutation.mutateAsync({
						organizationId,
						projectId,
						ownerType: "PHOTO" as const,
						fileName: item.file.name,
						fileSize: item.file.size,
						mimeType: item.file.type,
					});

				updateItem(item.id, { progress: 15 });

				await new Promise<void>((resolve, reject) => {
					const xhr = new XMLHttpRequest();
					xhr.upload.addEventListener("progress", (event) => {
						if (event.lengthComputable) {
							const percent =
								15 + Math.round((event.loaded / event.total) * 80);
							updateItem(item.id, { progress: percent });
						}
					});
					xhr.addEventListener("load", () => {
						if (xhr.status >= 200 && xhr.status < 300) resolve();
						else reject(new Error(`Upload failed: ${xhr.status}`));
					});
					xhr.addEventListener("error", () =>
						reject(new Error(t("projects.field.photoUploadError"))),
					);
					xhr.addEventListener("timeout", () =>
						reject(new Error("Upload timeout")),
					);
					xhr.timeout = 120000;
					xhr.open("PUT", uploadUrl);
					xhr.setRequestHeader("Content-Type", item.file.type);
					xhr.send(item.file);
				});

				const origin =
					typeof window !== "undefined" ? window.location.origin : "";
				const uploadedUrl = `${origin}/image-proxy/${ATTACHMENTS_BUCKET}/${storagePath}`;
				updateItem(item.id, {
					status: "uploaded",
					uploadedUrl,
					progress: 100,
				});
			} catch (err) {
				const msg = err instanceof Error ? err.message : "Upload failed";
				updateItem(item.id, { status: "error", errorMessage: msg });
			}
		},
		[
			organizationId,
			projectId,
			getUploadUrlMutation,
			updateItem,
			t,
		],
	);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			for (const file of acceptedFiles) {
				if (file.size > MAX_FILE_SIZE) {
					toast.error(`${file.name}: ${t("projects.documents.fileTooLarge")}`);
					continue;
				}
				const id = `${reactId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
				const previewUrl = URL.createObjectURL(file);
				const item: QueueItem = {
					id,
					file,
					previewUrl,
					caption: "",
					progress: 0,
					status: "idle",
				};
				setItems((prev) => [...prev, item]);
				// Kick off upload immediately
				void uploadFile(item);
			}
		},
		[reactId, t, uploadFile],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: ACCEPTED_IMAGE_TYPES,
		multiple: true,
		maxSize: MAX_FILE_SIZE,
		disabled: submitting,
		onDropRejected: (rejections) => {
			const error = rejections[0]?.errors[0];
			if (error?.code === "file-too-large") {
				toast.error(t("projects.documents.fileTooLarge"));
			} else if (error?.code === "file-invalid-type") {
				toast.error(t("projects.documents.invalidFileType"));
			}
		},
	});

	const removeItem = (id: string) => {
		setItems((prev) => {
			const target = prev.find((it) => it.id === id);
			if (target) URL.revokeObjectURL(target.previewUrl);
			return prev.filter((it) => it.id !== id);
		});
	};

	const retryItem = (id: string) => {
		const target = items.find((it) => it.id === id);
		if (target) void uploadFile(target);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const ready = items.filter(
			(it) => it.status === "uploaded" && it.uploadedUrl,
		);
		if (ready.length === 0) {
			toast.error(t("projects.photos.noPhotosToSave"));
			return;
		}
		if (items.some((it) => it.status === "uploading")) {
			toast.error(t("projects.photos.waitForUploads"));
			return;
		}

		setSubmitting(true);
		let savedCount = 0;
		let failedCount = 0;

		for (const item of ready) {
			try {
				await createPhotoMutation.mutateAsync({
					organizationId,
					projectId,
					url: item.uploadedUrl!,
					caption: item.caption.trim() || undefined,
					category,
					milestoneId: milestoneId === "none" ? undefined : milestoneId,
				});
				updateItem(item.id, { status: "saved" });
				savedCount++;
			} catch {
				updateItem(item.id, {
					status: "error",
					errorMessage: t("projects.field.photoUploadError"),
				});
				failedCount++;
			}
		}

		setSubmitting(false);
		queryClient.invalidateQueries({ queryKey: ["projectField"] });

		if (savedCount > 0) {
			toast.success(
				t("projects.photos.savedCount", { count: savedCount }),
			);
		}
		if (failedCount === 0) {
			router.push(returnTo ?? defaultReturnTo);
		} else {
			toast.error(t("projects.photos.someFailed", { count: failedCount }));
		}
	};

	const uploadedReady = items.filter((it) => it.status === "uploaded").length;
	const milestones = milestonesQuery.data?.milestones ?? [];

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
					<Link href={returnTo ?? defaultReturnTo}>
						<ChevronRight className="h-5 w-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
						{t("projects.photos.uploadButton")}
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{t("projects.photos.uploadHint")}
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Batch settings: category + milestone */}
				<div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
					<div className="space-y-2">
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
					<div className="space-y-2">
						<Label>{t("projects.photos.milestone")}</Label>
						<Select value={milestoneId} onValueChange={setMilestoneId}>
							<SelectTrigger className="rounded-xl">
								<SelectValue
									placeholder={t("projects.photos.selectMilestone")}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">
									{t("projects.photos.noMilestone")}
								</SelectItem>
								{milestones.map((m: { id: string; title: string }) => (
									<SelectItem key={m.id} value={m.id}>
										{m.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Drop zone */}
				<div
					{...getRootProps()}
					className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
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
									: t("projects.photos.dragDropMany")}
							</p>
							<p className="mt-1 text-xs text-slate-500">
								JPG, PNG, WebP — {t("projects.field.maxSize25MB")}
							</p>
						</div>
					</div>
				</div>

				{/* Queue */}
				{items.length > 0 && (
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
								{t("projects.photos.queueTitle", { count: items.length })}
							</h3>
							<span className="text-xs text-slate-500">
								{t("projects.photos.readyCount", {
									ready: uploadedReady,
									total: items.length,
								})}
							</span>
						</div>
						<div className="space-y-3">
							{items.map((item) => (
								<div
									key={item.id}
									className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
								>
									<div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
										<img
											src={item.previewUrl}
											alt=""
											className="size-full object-cover"
										/>
										{item.status === "saved" && (
											<div className="absolute inset-0 flex items-center justify-center bg-green-500/70">
												<CheckCircle className="size-8 text-white" />
											</div>
										)}
									</div>
									<div className="flex min-w-0 flex-1 flex-col gap-2">
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0 flex-1">
												<p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
													{item.file.name}
												</p>
												<p className="text-[11px] text-slate-400">
													{formatFileSize(item.file.size)}
												</p>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="size-7 shrink-0 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
												onClick={() => removeItem(item.id)}
												disabled={submitting}
											>
												<Trash2 className="size-3.5" />
											</Button>
										</div>

										{/* Per-file caption */}
										<Input
											type="text"
											value={item.caption}
											onChange={(e) =>
												updateItem(item.id, { caption: e.target.value })
											}
											placeholder={t("projects.photos.captionPlaceholder")}
											maxLength={200}
											className="h-8 rounded-lg text-xs"
											disabled={
												submitting ||
												item.status === "uploading" ||
												item.status === "saved"
											}
										/>

										{/* Status row */}
										<div className="flex items-center gap-2 text-[11px]">
											{item.status === "uploading" && (
												<>
													<Loader2 className="size-3 animate-spin text-primary" />
													<Progress
														value={item.progress}
														className="h-1.5 flex-1"
													/>
													<span className="text-slate-500">
														{item.progress}%
													</span>
												</>
											)}
											{item.status === "uploaded" && (
												<>
													<CheckCircle className="size-3 text-green-600" />
													<span className="text-green-600">
														{t("projects.photos.uploadedReady")}
													</span>
												</>
											)}
											{item.status === "saved" && (
												<>
													<CheckCircle className="size-3 text-green-600" />
													<span className="text-green-600">
														{t("projects.photos.saved")}
													</span>
												</>
											)}
											{item.status === "error" && (
												<>
													<AlertCircle className="size-3 text-red-500" />
													<span className="flex-1 truncate text-red-500">
														{item.errorMessage}
													</span>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="h-6 rounded text-xs"
														onClick={() => retryItem(item.id)}
														disabled={submitting}
													>
														{t("projects.documents.retry")}
													</Button>
												</>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Submit */}
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push(returnTo ?? defaultReturnTo)}
						className="rounded-xl"
						disabled={submitting}
					>
						{t("common.cancel")}
					</Button>
					<Button
						type="submit"
						disabled={
							submitting ||
							uploadedReady === 0 ||
							items.some((it) => it.status === "uploading")
						}
						className="min-w-[160px] rounded-xl"
					>
						<Camera className="me-2 h-4 w-4" />
						{submitting
							? t("common.saving")
							: t("projects.photos.saveCount", { count: uploadedReady })}
					</Button>
				</div>
			</form>
		</div>
	);
}
