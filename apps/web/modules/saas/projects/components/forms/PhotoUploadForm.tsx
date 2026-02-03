"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { Camera, ChevronLeft, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
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

export function PhotoUploadForm({
	organizationId,
	organizationSlug,
	projectId,
}: PhotoUploadFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;

	const [url, setUrl] = useState("");
	const [caption, setCaption] = useState("");
	const [category, setCategory] = useState<PhotoCategory>("PROGRESS");

	const createMutation = useMutation(
		orpc.projectField.createPhoto.mutationOptions(),
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			await createMutation.mutateAsync({
				organizationId,
				projectId,
				url,
				caption: caption || undefined,
				category,
			});

			toast.success(t("projects.field.photoUploaded"));
			queryClient.invalidateQueries({ queryKey: ["projectField"] });
			router.push(`${basePath}/field`);
		} catch {
			toast.error(t("projects.field.photoUploadError"));
		}
	};

	// Simple URL validation
	const isValidUrl = (urlString: string) => {
		try {
			new URL(urlString);
			return true;
		} catch {
			return false;
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
					<Link href={`${basePath}/field`}>
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
					{/* URL Input */}
					<div className="space-y-2">
						<Label htmlFor="url">{t("projects.field.photoUrl")} *</Label>
						<div className="relative">
							<LinkIcon className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<Input
								id="url"
								type="url"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder={t("projects.field.photoUrlPlaceholder")}
								required
								className="rounded-xl ps-9"
							/>
						</div>
						<p className="text-xs text-slate-500">
							{t("projects.field.photoUrlHint")}
						</p>
					</div>

					{/* Preview */}
					{url && isValidUrl(url) && (
						<div className="mt-4">
							<Label>{t("projects.field.preview")}</Label>
							<div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
								<img
									src={url}
									alt={t("projects.field.preview")}
									className="max-h-64 w-full object-contain"
									onError={(e) => {
										(e.target as HTMLImageElement).style.display = "none";
									}}
								/>
							</div>
						</div>
					)}

					{/* Category */}
					<div className="mt-6 space-y-2">
						<Label>{t("projects.field.categoryLabel")}</Label>
						<Select
							value={category}
							onValueChange={(v) => setCategory(v as PhotoCategory)}
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
							onChange={(e) => setCaption(e.target.value)}
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
						onClick={() => router.push(`${basePath}/field`)}
						className="rounded-xl"
					>
						{t("common.cancel")}
					</Button>
					<Button
						type="submit"
						disabled={createMutation.isPending || !url.trim() || !isValidUrl(url)}
						className="min-w-[120px] rounded-xl"
					>
						<Camera className="me-2 h-4 w-4" />
						{createMutation.isPending
							? t("common.saving")
							: t("projects.field.addPhoto")}
					</Button>
				</div>
			</form>
		</div>
	);
}
