"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import {
	Camera,
	ChevronLeft,
	ChevronRight,
	ImageIcon,
	Loader2,
	Plus,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

type PhotoCategory =
	| "PROGRESS"
	| "ISSUE"
	| "EQUIPMENT"
	| "MATERIAL"
	| "SAFETY"
	| "OTHER";

const ALL_CATEGORIES: PhotoCategory[] = [
	"PROGRESS",
	"ISSUE",
	"EQUIPMENT",
	"MATERIAL",
	"SAFETY",
	"OTHER",
];

interface ProjectPhotosCardProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

function getCategoryColor(category: string) {
	switch (category) {
		case "PROGRESS":
			return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800";
		case "ISSUE":
			return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
		case "EQUIPMENT":
			return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
		case "MATERIAL":
			return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
		case "SAFETY":
			return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800";
		default:
			return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
	}
}

function formatPhotoDate(date: Date | string): string {
	return new Intl.DateTimeFormat("ar-SA", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(date));
}

export function ProjectPhotosCard({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectPhotosCardProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const [activeCategory, setActiveCategory] = useState<
		PhotoCategory | "ALL"
	>("ALL");
	const [lightboxIndex, setLightboxIndex] = useState(-1);
	const [viewMode, setViewMode] = useState<"date" | "category">("date");

	// Fetch all photos
	const { data, isLoading } = useQuery(
		orpc.projectField.listPhotos.queryOptions({
			input: {
				organizationId,
				projectId,
				limit: 200,
			},
		}),
	);

	const allPhotos = data?.photos ?? [];
	const totalCount = data?.total ?? 0;

	// Filter by active category
	const filteredPhotos = useMemo(() => {
		if (activeCategory === "ALL") return allPhotos;
		return allPhotos.filter((p) => p.category === activeCategory);
	}, [allPhotos, activeCategory]);

	// Group photos by date
	const photosByDate = useMemo(() => {
		const groups: Record<
			string,
			typeof filteredPhotos
		> = {};
		for (const photo of filteredPhotos) {
			const dateKey = new Date(photo.createdAt)
				.toISOString()
				.split("T")[0];
			if (!groups[dateKey]) groups[dateKey] = [];
			groups[dateKey].push(photo);
		}
		// Sort groups by date descending
		return Object.entries(groups).sort(
			([a], [b]) => b.localeCompare(a),
		);
	}, [filteredPhotos]);

	// Group photos by category
	const photosByCategory = useMemo(() => {
		const groups: Record<string, typeof filteredPhotos> = {};
		for (const photo of filteredPhotos) {
			const cat = photo.category;
			if (!groups[cat]) groups[cat] = [];
			groups[cat].push(photo);
		}
		return Object.entries(groups).sort(
			([, a], [, b]) => b.length - a.length,
		);
	}, [filteredPhotos]);

	// Lightbox slides
	const lightboxSlides = useMemo(
		() =>
			filteredPhotos.map((photo) => ({
				src: photo.url,
				title: photo.caption || undefined,
				description: `${t(`projects.field.photoCategory.${photo.category}`)} — ${formatPhotoDate(photo.createdAt)}`,
			})),
		[filteredPhotos, t],
	);

	// Keyboard navigation
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape" && lightboxIndex >= 0) {
				setLightboxIndex(-1);
			}
		},
		[lightboxIndex],
	);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	// Get category counts for filter badges
	const categoryCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const photo of allPhotos) {
			counts[photo.category] = (counts[photo.category] || 0) + 1;
		}
		return counts;
	}, [allPhotos]);

	// Find the index in filteredPhotos for opening lightbox
	const openLightbox = (photoId: string) => {
		const idx = filteredPhotos.findIndex((p) => p.id === photoId);
		if (idx >= 0) setLightboxIndex(idx);
	};

	return (
		<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-black/5 dark:border-slate-800 dark:bg-slate-900">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
				<div className="flex items-center gap-2.5">
					<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/40">
						<Camera className="h-[18px] w-[18px] text-violet-600 dark:text-violet-400" />
					</div>
					<div>
						<h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
							{t("projects.field.projectPhotos")}
						</h3>
						<p className="text-[11px] text-slate-400">
							{totalCount}{" "}
							{t("projects.field.photosCount")}
						</p>
					</div>
				</div>
				<Link
					href={`${basePath}/execution/upload`}
					className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600"
				>
					<Plus className="h-3.5 w-3.5" />
					{t("projects.field.uploadPhoto")}
				</Link>
			</div>

			{/* Filter Bar */}
			{totalCount > 0 && (
				<div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
					<div className="flex items-center justify-between gap-3">
						{/* Category Filters */}
						<div className="flex flex-1 flex-wrap gap-1.5">
							<button
								type="button"
								onClick={() => setActiveCategory("ALL")}
								className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
									activeCategory === "ALL"
										? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
										: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
								}`}
							>
								{t("projects.field.allPhotos")} ({totalCount})
							</button>
							{ALL_CATEGORIES.filter(
								(cat) => categoryCounts[cat],
							).map((cat) => (
								<button
									key={cat}
									type="button"
									onClick={() =>
										setActiveCategory(
											activeCategory === cat
												? "ALL"
												: cat,
										)
									}
									className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
										activeCategory === cat
											? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
											: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
									}`}
								>
									{t(
										`projects.field.photoCategory.${cat}`,
									)}{" "}
									({categoryCounts[cat]})
								</button>
							))}
						</div>

						{/* View Mode Toggle */}
						<div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
							<button
								type="button"
								onClick={() => setViewMode("date")}
								className={`px-2.5 py-1 text-[10px] font-semibold transition-colors ${
									viewMode === "date"
										? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
										: "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
								}`}
							>
								{t("projects.field.byDate")}
							</button>
							<button
								type="button"
								onClick={() => setViewMode("category")}
								className={`px-2.5 py-1 text-[10px] font-semibold transition-colors ${
									viewMode === "category"
										? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
										: "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
								}`}
							>
								{t("projects.field.byCategory")}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Content */}
			<div className="p-5">
				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
					</div>
				) : totalCount === 0 ? (
					/* Empty State */
					<div className="flex flex-col items-center justify-center py-12">
						<div className="mb-4 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/50">
							<ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
						</div>
						<p className="text-sm font-medium text-slate-500 dark:text-slate-400">
							{t("projects.field.noPhotosYet")}
						</p>
						<p className="mt-1 text-xs text-slate-400">
							{t("projects.field.noPhotosHint")}
						</p>
						<Link
							href={`${basePath}/execution/upload`}
							className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
						>
							<Camera className="h-3.5 w-3.5" />
							{t("projects.field.uploadFirstPhoto")}
						</Link>
					</div>
				) : viewMode === "date" ? (
					/* Group by Date */
					<div className="space-y-5">
						{photosByDate.map(([dateKey, photos]) => (
							<div key={dateKey}>
								<div className="mb-2.5 flex items-center gap-2">
									<div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
									<span className="shrink-0 text-[11px] font-semibold text-slate-400">
										{formatPhotoDate(dateKey)}
									</span>
									<span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
										{photos.length}
									</span>
									<div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
								</div>
								<div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
									{photos.map((photo) => (
										<PhotoThumbnail
											key={photo.id}
											photo={photo}
											onClick={() =>
												openLightbox(photo.id)
											}
											t={t}
										/>
									))}
								</div>
							</div>
						))}
					</div>
				) : (
					/* Group by Category */
					<div className="space-y-5">
						{photosByCategory.map(([category, photos]) => (
							<div key={category}>
								<div className="mb-2.5 flex items-center gap-2">
									<Badge
										variant="outline"
										className={`${getCategoryColor(category)} text-[11px] font-semibold`}
									>
										{t(
											`projects.field.photoCategory.${category}`,
										)}
									</Badge>
									<span className="text-[10px] text-slate-400">
										{photos.length}{" "}
										{t("projects.field.photosCount")}
									</span>
									<div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
								</div>
								<div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
									{photos.map((photo) => (
										<PhotoThumbnail
											key={photo.id}
											photo={photo}
											onClick={() =>
												openLightbox(photo.id)
											}
											t={t}
										/>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Lightbox */}
			<Lightbox
				open={lightboxIndex >= 0}
				close={() => setLightboxIndex(-1)}
				index={lightboxIndex}
				slides={lightboxSlides}
				plugins={[Zoom, Thumbnails, Captions, Counter]}
				captions={{ descriptionTextAlign: "center" }}
				zoom={{ maxZoomPixelRatio: 5 }}
				thumbnails={{ position: "bottom", width: 80, height: 60 }}
				counter={{ container: { style: { top: 0, bottom: "unset" } } }}
				styles={{
					container: { backgroundColor: "rgba(0,0,0,0.92)" },
				}}
				carousel={{ finite: false }}
				animation={{ fade: 300 }}
				controller={{ closeOnBackdropClick: true }}
				render={{
					iconPrev: () => (
						<ChevronRight className="h-8 w-8 text-white/80" />
					),
					iconNext: () => (
						<ChevronLeft className="h-8 w-8 text-white/80" />
					),
					iconClose: () => (
						<X className="h-6 w-6 text-white/80" />
					),
				}}
			/>
		</div>
	);
}

// ─── Thumbnail Component ───────────────────────────────────

interface PhotoThumbnailProps {
	photo: {
		id: string;
		url: string;
		caption: string | null;
		category: string;
		createdAt: Date;
	};
	onClick: () => void;
	t: ReturnType<typeof useTranslations>;
}

function PhotoThumbnail({ photo, onClick, t }: PhotoThumbnailProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="group relative aspect-square overflow-hidden rounded-xl border border-slate-100 bg-slate-50 transition-all hover:border-violet-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-violet-700"
		>
			<Image
				src={photo.url}
				alt={photo.caption || t("projects.field.photo")}
				fill
				sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
				className="object-cover transition-transform duration-300 group-hover:scale-110"
				unoptimized
			/>
			{/* Hover overlay */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
			{/* Category badge */}
			<div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
				<Badge
					variant="secondary"
					className={`${getCategoryColor(photo.category)} border text-[9px]`}
				>
					{t(`projects.field.photoCategory.${photo.category}`)}
				</Badge>
			</div>
			{/* Expand icon on hover */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
				<div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
					<ImageIcon className="h-4 w-4 text-white" />
				</div>
			</div>
		</button>
	);
}
