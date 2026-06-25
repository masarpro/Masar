"use client";

import { useOwnerSession } from "@saas/projects-owner/hooks/use-owner-session";
import { OWNER_QUERY_FRESHNESS } from "@saas/projects-owner/lib/query-freshness";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Skeleton } from "@ui/components/skeleton";
import {
	ChevronLeft,
	ChevronRight,
	ImageIcon,
	Play,
	X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
	ssr: false,
});

interface OwnerPhoto {
	id: string;
	url: string;
	caption: string | null;
	category: string;
	mediaType?: "PHOTO" | "VIDEO";
	mimeType?: string | null;
	takenAt: string | Date;
	createdAt: string | Date;
	milestone: { id: string; title: string; orderIndex: number } | null;
}

function getCategoryColor(category: string) {
	switch (category) {
		case "PROGRESS":
			return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800";
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

export default function OwnerPortalPhotos() {
	const params = useParams();
	const token = params.token as string;
	const t = useTranslations();
	const sessionToken = useOwnerSession();
	const [lightboxIndex, setLightboxIndex] = useState(-1);

	const authInput = sessionToken ? { sessionToken } : { token };

	const { data, isLoading } = useQuery(
		orpc.projectOwner.portal.listPhotos.queryOptions({
			input: authInput,
			...OWNER_QUERY_FRESHNESS,
		}),
	) as { data: { photos: OwnerPhoto[]; coverPhotoId: string | null } | undefined; isLoading: boolean };

	const allPhotos = data?.photos ?? [];
	const coverPhotoId = data?.coverPhotoId ?? null;

	// Group by milestone, sorted by orderIndex (no milestone last)
	const grouped = useMemo(() => {
		const byKey: Record<string, OwnerPhoto[]> = {};
		const titleByKey: Record<string, string> = {};
		const orderByKey: Record<string, number> = {};

		for (const photo of allPhotos) {
			const key = photo.milestone?.id ?? "__none__";
			if (!byKey[key]) {
				byKey[key] = [];
				titleByKey[key] = photo.milestone?.title ?? t("projects.photos.noMilestone");
				orderByKey[key] = photo.milestone?.orderIndex ?? 9999;
			}
			byKey[key].push(photo);
		}

		return Object.keys(byKey)
			.sort((a, b) => orderByKey[a] - orderByKey[b])
			.map((key) => ({ key, title: titleByKey[key], items: byKey[key] }));
	}, [allPhotos, t]);

	const lightboxSlides = useMemo(
		() =>
			allPhotos.map((p) => {
				const description = `${t(`projects.field.photoCategory.${p.category}`)} — ${formatPhotoDate(p.createdAt)}${
					p.milestone ? ` — ${p.milestone.title}` : ""
				}`;
				if (p.mediaType === "VIDEO") {
					return {
						type: "video" as const,
						sources: [
							{ src: p.url, type: p.mimeType || "video/mp4" },
						],
						title: p.caption || undefined,
						description,
					};
				}
				return {
					src: p.url,
					title: p.caption || undefined,
					description,
				};
			}),
		[allPhotos, t],
	);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape" && lightboxIndex >= 0) setLightboxIndex(-1);
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [lightboxIndex]);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48 rounded-xl" />
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<Skeleton key={i} className="aspect-square rounded-xl" />
					))}
				</div>
			</div>
		);
	}

	if (allPhotos.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
					<ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
				</div>
				<p className="text-sm font-medium text-slate-600 dark:text-slate-300">
					{t("projects.photos.empty")}
				</p>
				<p className="mt-1 text-xs text-slate-400">
					{t("ownerPortal.photos.emptyHint")}
				</p>
			</div>
		);
	}

	const openLightbox = (photoId: string) => {
		const idx = allPhotos.findIndex((p) => p.id === photoId);
		if (idx >= 0) setLightboxIndex(idx);
	};

	return (
		<div className="space-y-4 sm:space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
					{t("ownerPortal.photos.title")}
				</h2>
				<p className="text-sm text-slate-500 dark:text-slate-400">
					{t("ownerPortal.photos.subtitle", { count: allPhotos.length })}
				</p>
			</div>

			{grouped.map((group) => (
				<section key={group.key}>
					<div className="mb-2.5 flex items-center gap-2">
						<h3 className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300">
							{group.title}
						</h3>
						<span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
							{group.items.length}
						</span>
						<div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
					</div>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
						{group.items.map((photo) => (
							<button
								key={photo.id}
								type="button"
								onClick={() => openLightbox(photo.id)}
								className={`group relative aspect-square overflow-hidden rounded-xl border bg-slate-50 transition-all hover:shadow-lg dark:bg-slate-800/50 ${
									photo.id === coverPhotoId
										? "border-amber-400 ring-2 ring-amber-300"
										: "border-slate-200 hover:border-primary/40 dark:border-slate-800"
								}`}
							>
								{photo.mediaType === "VIDEO" ? (
									<>
										<video
											src={photo.url}
											className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
											muted
											playsInline
											preload="metadata"
										/>
										<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
											<div className="rounded-full bg-white/90 p-2 shadow-lg transition-transform group-hover:scale-110">
												<Play className="size-5 fill-current text-slate-800" />
											</div>
										</div>
									</>
								) : (
									<img
										src={photo.url}
										alt={photo.caption || ""}
										className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								)}
								<div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
								<div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
									<Badge
										variant="secondary"
										className={`${getCategoryColor(photo.category)} border text-[9px]`}
									>
										{t(`projects.field.photoCategory.${photo.category}`)}
									</Badge>
									{photo.caption && (
										<p className="line-clamp-2 text-[10px] font-medium text-white">
											{photo.caption}
										</p>
									)}
								</div>
							</button>
						))}
					</div>
				</section>
			))}

			<Lightbox
				open={lightboxIndex >= 0}
				close={() => setLightboxIndex(-1)}
				index={lightboxIndex}
				slides={lightboxSlides as never}
				plugins={[Zoom, Thumbnails, Captions, Counter, Video]}
				captions={{ descriptionTextAlign: "center" }}
				zoom={{ maxZoomPixelRatio: 5 }}
				thumbnails={{ position: "bottom", width: 80, height: 60 }}
				counter={{ container: { style: { top: 0, bottom: "unset" } } }}
				video={{ controls: true, playsInline: true, autoPlay: false }}
				styles={{ container: { backgroundColor: "rgba(0,0,0,0.92)" } }}
				carousel={{ finite: false }}
				animation={{ fade: 300 }}
				controller={{ closeOnBackdropClick: true }}
				render={{
					iconPrev: () => <ChevronRight className="h-8 w-8 text-white/80" />,
					iconNext: () => <ChevronLeft className="h-8 w-8 text-white/80" />,
					iconClose: () => <X className="h-6 w-6 text-white/80" />,
				}}
			/>
		</div>
	);
}
