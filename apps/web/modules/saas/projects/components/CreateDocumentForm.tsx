"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { ChevronLeft } from "lucide-react";
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

const UNCATEGORIZED = "__uncategorized__";

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

	const foldersQuery = useQuery(
		orpc.projectDocuments.listFolders.queryOptions({
			input: { organizationId, projectId },
		}),
	);
	const folderOptions = foldersQuery.data?.folders ?? [];

	const [formData, setFormData] = useState({
		folder: UNCATEGORIZED,
		title: "",
		description: "",
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
			onSuccess: (data: any) => {
				toast.success(t("createSuccess"));
				queryClient.invalidateQueries({
					queryKey: [["projectDocuments", "list"]],
				});
				router.push(`${basePath}/documents/${data.id}`);
			},
			onError: (error: any) => {
				toast.error(error.message || t("createError"));
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.title) {
			toast.error(t("requiredFields"));
			return;
		}

		if (!fileData) {
			toast.error(t("requiredFields"));
			return;
		}

		createMutation.mutate({
			organizationId,
			projectId,
			folderId:
				formData.folder === UNCATEGORIZED ? undefined : formData.folder,
			title: formData.title,
			description: formData.description || undefined,
			uploadType: "FILE",
			storagePath: fileData.storagePath,
			thumbnailPath: fileData.thumbnailPath ?? undefined,
			fileName: fileData.fileName,
			fileSize: fileData.fileSize,
			mimeType: fileData.mimeType,
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					asChild
					className="rounded-xl hover:bg-accent hover:text-accent-foreground"
				>
					<Link href={`${basePath}/documents`}>
						<ChevronLeft className="rtl-flip h-5 w-5 text-muted-foreground" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-semibold text-foreground">
						{t("addDocument")}
					</h1>
					<p className="text-sm text-muted-foreground">
						{t("addDocumentDescription")}
					</p>
				</div>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="rounded-2xl border-2 bg-card p-6">
					<div className="grid gap-6 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="folder">{t("folder")}</Label>
							<Select
								value={formData.folder}
								onValueChange={(value: any) =>
									setFormData((prev) => ({ ...prev, folder: value }))
								}
							>
								<SelectTrigger className="rounded-xl">
									<SelectValue placeholder={t("selectFolder")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={UNCATEGORIZED}>
										{t("uncategorized")}
									</SelectItem>
									{folderOptions.map((option) => (
										<SelectItem key={option.id} value={option.id}>
											{option.name}
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
								onChange={(e: any) =>
									setFormData((prev) => ({ ...prev, title: e.target.value }))
								}
								placeholder={t("titlePlaceholder")}
								className="rounded-xl"
							/>
						</div>

						{/* File Upload Zone */}
						<div className="space-y-2 sm:col-span-2">
							<Label>{t("uploadFile")} *</Label>
							<FileUploadZone
								organizationId={organizationId}
								projectId={projectId}
								onUploadComplete={(data) => setFileData(data)}
								onRemove={() => setFileData(null)}
							/>
						</div>

						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="description">{t("description")}</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e: any) =>
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
