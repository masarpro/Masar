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
			return "bg-chart-4/15 text-chart-4 dark:bg-chart-4/20 dark:text-chart-4";
		case "ISSUE":
			return "bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-destructive";
		case "EQUIPMENT":
			return "bg-chart-4/15 text-chart-4 dark:bg-chart-4/20 dark:text-chart-4";
		case "MATERIAL":
			return "bg-chart-1/15 text-chart-1 dark:bg-chart-1/20 dark:text-chart-1";
		case "SAFETY":
			return "bg-chart-2/15 text-chart-2 dark:bg-chart-2/20 dark:text-chart-2";
		default:
			return "bg-muted text-muted-foreground";
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
				<div className="flex size-full items-center justify-center bg-muted">
					<ImageIcon className="h-8 w-8 text-muted-foreground" />
				</div>
			)}
			<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
			<div className="absolute inset-x-0 bottom-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
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
