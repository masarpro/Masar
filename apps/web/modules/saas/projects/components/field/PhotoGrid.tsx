"use client";

import { Badge } from "@ui/components/badge";
import { useTranslations } from "next-intl";

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

export function PhotoGrid({ photos }: PhotoGridProps) {
	const t = useTranslations();

	if (!photos || photos.length === 0) {
		return null;
	}

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
			{photos.map((photo) => {
				const url = photo.url as string;
				const caption = photo.caption as string | undefined;
				const category = photo.category as string;
				const id = photo.id as string;

				return (
					<div key={id} className="group relative overflow-hidden rounded-xl">
						<img
							src={url}
							alt={caption || t("projects.field.photo")}
							className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
						/>
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
			})}
		</div>
	);
}
