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
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface CreateDocumentFormProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

const FOLDER_OPTIONS = [
	{ value: "CONTRACT", label: "العقد" },
	{ value: "DRAWINGS", label: "المخططات" },
	{ value: "CLAIMS", label: "المستخلصات" },
	{ value: "LETTERS", label: "الخطابات" },
	{ value: "PHOTOS", label: "الصور" },
	{ value: "OTHER", label: "أخرى" },
];

export function CreateDocumentForm({
	organizationId,
	organizationSlug,
	projectId,
}: CreateDocumentFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;

	const [formData, setFormData] = useState({
		folder: "",
		title: "",
		description: "",
		fileUrl: "",
	});

	const createMutation = useMutation(
		orpc.projectDocuments.create.mutationOptions({
			onSuccess: (data) => {
				toast.success(t("projects.documents.createSuccess"));
				queryClient.invalidateQueries({
					queryKey: [["projectDocuments", "list"]],
				});
				router.push(`${basePath}/documents/${data.id}`);
			},
			onError: (error) => {
				toast.error(error.message || t("projects.documents.createError"));
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.folder || !formData.title || !formData.fileUrl) {
			toast.error(t("projects.documents.requiredFields"));
			return;
		}

		createMutation.mutate({
			organizationId,
			projectId,
			folder: formData.folder as any,
			title: formData.title,
			description: formData.description || undefined,
			fileUrl: formData.fileUrl,
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
					className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
				>
					<Link href={`${basePath}/documents`}>
						<ChevronLeft className="h-5 w-5 text-slate-500" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
						{t("projects.documents.addDocument")}
					</h1>
					<p className="text-sm text-slate-500">
						{t("projects.documents.addDocumentDescription")}
					</p>
				</div>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
					<div className="grid gap-6 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="folder">{t("projects.documents.folder")} *</Label>
							<Select
								value={formData.folder}
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, folder: value }))
								}
							>
								<SelectTrigger className="rounded-xl">
									<SelectValue placeholder={t("projects.documents.selectFolder")} />
								</SelectTrigger>
								<SelectContent>
									{FOLDER_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="title">{t("projects.documents.documentTitle")} *</Label>
							<Input
								id="title"
								value={formData.title}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, title: e.target.value }))
								}
								placeholder={t("projects.documents.titlePlaceholder")}
								className="rounded-xl"
							/>
						</div>

						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="fileUrl">{t("projects.documents.fileUrl")} *</Label>
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
								{t("projects.documents.fileUrlHint")}
							</p>
						</div>

						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="description">{t("projects.documents.description")}</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, description: e.target.value }))
								}
								placeholder={t("projects.documents.descriptionPlaceholder")}
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
						<Link href={`${basePath}/documents`}>{t("common.cancel")}</Link>
					</Button>
					<Button
						type="submit"
						className="rounded-xl"
						disabled={createMutation.isPending}
					>
						{createMutation.isPending
							? t("common.saving")
							: t("projects.documents.addDocument")}
					</Button>
				</div>
			</form>
		</div>
	);
}
