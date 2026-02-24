"use client";

import { Badge } from "@ui/components/badge";
import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface PhotoGridProps {
	photos: Record<string, unknown>[];
}

function getCategoryColor(category: string) {
	switch (category) {
		case "PROGRESS":
			return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
		case "ISSUE":
			return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
		case "EQUIPMENT":
			return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
		case "MATERIAL":
			return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
		case "SAFETY":
			return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
		default:
			return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
	}
}

function PhotoGridItem({
	photo,
	t,
}: {
	photo: Record<string, unknown>;
	t: ReturnType<typeof useTranslations>;
}) {
	const [imgError, setImgError] = useState(false);
	const url = photo.url as string;
	const caption = photo.caption as string | undefined;
	const category = photo.category as string;
	const id = photo.id as string;

	const imageSrc =
		url?.startsWith("http") || url?.startsWith("//")
			? url
			: url?.startsWith("/")
				? `${typeof window !== "undefined" ? window.location.origin : ""}${url}`
				: url;

	return (
		<div className="group relative aspect-square overflow-hidden rounded-xl">
			{!imgError && imageSrc ? (
				<img
					src={imageSrc}
					alt={caption || t("projects.field.photo")}
					className="size-full object-cover transition-transform group-hover:scale-105"
					onError={() => setImgError(true)}
				/>
			) : (
				<div className="flex size-full items-center justify-center bg-slate-200 dark:bg-slate-700">
					<ImageIcon className="h-8 w-8 text-slate-400" />
				</div>
			)}
			<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
			<div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
				{caption && (
					<p className="truncate text-sm text-white">{caption}</p>
				)}
				<Badge variant="secondary" className={getCategoryColor(category)}>
					{t(`projects.field.photoCategory.${category}`)}
				</Badge>
			</div>
		</div>
	);
}

export function PhotoGrid({ photos }: PhotoGridProps) {
	const t = useTranslations();

	if (!photos || photos.length === 0) {
		return null;
	}

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
			{photos.map((photo) => (
				<PhotoGridItem key={String(photo.id)} photo={photo} t={t} />
			))}
		</div>
	);
}
