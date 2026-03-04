"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { ChevronLeft, Upload, Link2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { FileUploadZone } from "./documents/FileUploadZone";

interface CreateDocumentFormProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

const FOLDER_OPTIONS = [
	{ value: "CONTRACT", labelKey: "folders.CONTRACT" },
	{ value: "DRAWINGS", labelKey: "folders.DRAWINGS" },
	{ value: "CLAIMS", labelKey: "folders.CLAIMS" },
	{ value: "LETTERS", labelKey: "folders.LETTERS" },
	{ value: "PHOTOS", labelKey: "folders.PHOTOS" },
	{ value: "OTHER", labelKey: "folders.OTHER" },
];

type UploadTab = "file" | "url";

export function CreateDocumentForm({
	organizationId,
	organizationSlug,
	projectId,
}: CreateDocumentFormProps) {
	const t = useTranslations("projects.documents");
	const tCommon = useTranslations("common");
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;

	const [activeTab, setActiveTab] = useState<UploadTab>("file");
	const [formData, setFormData] = useState({
		folder: "",
		title: "",
		description: "",
		fileUrl: "",
	});

	// File upload state
	const [fileData, setFileData] = useState<{
		storagePath: string;
		thumbnailPath?: string | null;
		fileName: string;
		fileSize: number;
		mimeType: string;
	} | null>(null);

	const createMutation = useMutation(
		orpc.projectDocuments.create.mutationOptions({
			onSuccess: (data) => {
				toast.success(t("createSuccess"));
				queryClient.invalidateQueries({
					queryKey: [["projectDocuments", "list"]],
				});
				router.push(`${basePath}/documents/${data.id}`);
			},
			onError: (error) => {
				toast.error(error.message || t("createError"));
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.folder || !formData.title) {
			toast.error(t("requiredFields"));
			return;
		}

		if (activeTab === "url" && !formData.fileUrl) {
			toast.error(t("requiredFields"));
			return;
		}

		if (activeTab === "file" && !fileData) {
			toast.error(t("requiredFields"));
			return;
		}

		if (activeTab === "file" && fileData) {
			createMutation.mutate({
				organizationId,
				projectId,
				folder: formData.folder as any,
				title: formData.title,
				description: formData.description || undefined,
				uploadType: "FILE",
				storagePath: fileData.storagePath,
				thumbnailPath: fileData.thumbnailPath ?? undefined,
				fileName: fileData.fileName,
				fileSize: fileData.fileSize,
				mimeType: fileData.mimeType,
			});
		} else {
			createMutation.mutate({
				organizationId,
				projectId,
				folder: formData.folder as any,
				title: formData.title,
				description: formData.description || undefined,
				uploadType: "URL",
				fileUrl: formData.fileUrl,
			});
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
					className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
				>
					<Link href={`${basePath}/documents`}>
						<ChevronLeft className="h-5 w-5 text-slate-500" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
						{t("addDocument")}
					</h1>
					<p className="text-sm text-slate-500">
						{t("addDocumentDescription")}
					</p>
				</div>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
					<div className="grid gap-6 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="folder">{t("folder")} *</Label>
							<Select
								value={formData.folder}
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, folder: value }))
								}
							>
								<SelectTrigger className="rounded-xl">
									<SelectValue placeholder={t("selectFolder")} />
								</SelectTrigger>
								<SelectContent>
									{FOLDER_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{t(option.labelKey)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="title">{t("documentTitle")} *</Label>
							<Input
								id="title"
								value={formData.title}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, title: e.target.value }))
								}
								placeholder={t("titlePlaceholder")}
								className="rounded-xl"
							/>
						</div>

						{/* Upload Tab Switcher */}
						<div className="space-y-3 sm:col-span-2">
							<Label>{t("fileSource")}</Label>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setActiveTab("file")}
									className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
										activeTab === "file"
											? "bg-primary text-primary-foreground"
											: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
									}`}
								>
									<Upload className="h-4 w-4" />
									{t("uploadFile")}
								</button>
								<button
									type="button"
									onClick={() => setActiveTab("url")}
									className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
										activeTab === "url"
											? "bg-primary text-primary-foreground"
											: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
									}`}
								>
									<Link2 className="h-4 w-4" />
									{t("externalLink")}
								</button>
							</div>

							{/* File Upload Zone */}
							{activeTab === "file" && (
								<FileUploadZone
									organizationId={organizationId}
									projectId={projectId}
									onUploadComplete={(data) => setFileData(data)}
									onRemove={() => setFileData(null)}
								/>
							)}

							{/* URL Input */}
							{activeTab === "url" && (
								<div className="space-y-2">
									<Input
										id="fileUrl"
										type="url"
										value={formData.fileUrl}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, fileUrl: e.target.value }))
										}
										placeholder="https://..."
										className="rounded-xl"
										dir="ltr"
									/>
									<p className="text-xs text-slate-500">
										{t("fileUrlHint")}
									</p>
								</div>
							)}
						</div>

						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="description">{t("description")}</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, description: e.target.value }))
								}
								placeholder={t("descriptionPlaceholder")}
								className="min-h-24 rounded-xl"
							/>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						asChild
						className="rounded-xl"
					>
						<Link href={`${basePath}/documents`}>{tCommon("cancel")}</Link>
					</Button>
					<Button
						type="submit"
						className="rounded-xl"
						disabled={createMutation.isPending}
					>
						{createMutation.isPending
							? tCommon("saving")
							: t("addDocument")}
					</Button>
				</div>
			</form>
		</div>
	);
}
