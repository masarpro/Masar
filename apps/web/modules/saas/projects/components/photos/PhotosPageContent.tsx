"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Camera,
	ChevronLeft,
	ChevronRight,
	Filter,
	ImageIcon,
	Loader2,
	Pencil,
	Plus,
	Star,
	StarOff,
	Trash2,
	X,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { useProjectRole } from "../../hooks/use-project-role";

const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
	ssr: false,
});

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

type GroupBy = "milestone" | "date" | "category";

interface PhotoItem {
	id: string;
	url: string;
	caption: string | null;
	category: PhotoCategory;
	createdAt: string | Date;
	milestone: { id: string; title: string; status: string; orderIndex: number } | null;
}

interface PhotosPageContentProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
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

export function PhotosPageContent({
	organizationId,
	organizationSlug,
	projectId,
}: PhotosPageContentProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { isManager, canViewSection } = useProjectRole();
	const canEdit = isManager;
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;

	const [activeCategory, setActiveCategory] = useState<PhotoCategory | "ALL">("ALL");
	const [activeMilestoneId, setActiveMilestoneId] = useState<string>("ALL");
	const [groupBy, setGroupBy] = useState<GroupBy>("milestone");
	const [lightboxIndex, setLightboxIndex] = useState(-1);
	const [photoToDelete, setPhotoToDelete] = useState<PhotoItem | null>(null);
	const [photoToEdit, setPhotoToEdit] = useState<PhotoItem | null>(null);

	const photosQuery = useQuery(
		orpc.projectField.listPhotos.queryOptions({
			input: {
				organizationId,
				projectId,
				limit: 500,
			},
		}),
	);

	const milestonesQuery = useQuery(
		orpc.projectTimeline.listMilestones.queryOptions({
			input: { organizationId, projectId, limit: 200 },
		}),
	);

	const deleteMutation = useMutation({
		...orpc.projectField.deletePhoto.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projects.field.photoDeleted"));
			setPhotoToDelete(null);
			queryClient.invalidateQueries({ queryKey: ["projectField"] });
		},
		onError: () => {
			toast.error(t("projects.field.photoDeleteError"));
		},
	});

	const setCoverMutation = useMutation({
		...orpc.projectField.setCoverPhoto.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projects.photos.coverSet"));
			queryClient.invalidateQueries({ queryKey: ["projectField"] });
			queryClient.invalidateQueries({ queryKey: ["projects"] });
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const unsetCoverMutation = useMutation({
		...orpc.projectField.unsetCoverPhoto.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projects.photos.coverRemoved"));
			queryClient.invalidateQueries({ queryKey: ["projectField"] });
			queryClient.invalidateQueries({ queryKey: ["projects"] });
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const allPhotos = (photosQuery.data?.photos ?? []) as unknown as PhotoItem[];
	const coverPhotoId = photosQuery.data?.coverPhotoId ?? null;
	const milestones = milestonesQuery.data?.milestones ?? [];

	// Filter photos
	const filteredPhotos = useMemo(() => {
		return allPhotos.filter((p) => {
			if (activeCategory !== "ALL" && p.category !== activeCategory) return false;
			if (activeMilestoneId === "ALL") return true;
			if (activeMilestoneId === "none") return p.milestone === null;
			return p.milestone?.id === activeMilestoneId;
		});
	}, [allPhotos, activeCategory, activeMilestoneId]);

	// Group photos
	const groupedPhotos = useMemo(() => {
		const groups: Array<{ key: string; label: string; items: PhotoItem[] }> = [];

		if (groupBy === "milestone") {
			const byMilestone: Record<string, PhotoItem[]> = {};
			const orderByKey: Record<string, number> = {};
			const titleByKey: Record<string, string> = {};

			for (const photo of filteredPhotos) {
				const key = photo.milestone?.id ?? "__none__";
				if (!byMilestone[key]) {
					byMilestone[key] = [];
					orderByKey[key] = photo.milestone?.orderIndex ?? 9999;
					titleByKey[key] =
						photo.milestone?.title ?? t("projects.photos.noMilestone");
				}
				byMilestone[key].push(photo);
			}

			const keys = Object.keys(byMilestone).sort(
				(a, b) => orderByKey[a] - orderByKey[b],
			);
			for (const key of keys) {
				groups.push({ key, label: titleByKey[key], items: byMilestone[key] });
			}
		} else if (groupBy === "date") {
			const byDate: Record<string, PhotoItem[]> = {};
			for (const photo of filteredPhotos) {
				const dateKey = new Date(photo.createdAt).toISOString().split("T")[0];
				if (!byDate[dateKey]) byDate[dateKey] = [];
				byDate[dateKey].push(photo);
			}
			for (const key of Object.keys(byDate).sort((a, b) => b.localeCompare(a))) {
				groups.push({ key, label: formatPhotoDate(key), items: byDate[key] });
			}
		} else {
			const byCategory: Record<string, PhotoItem[]> = {};
			for (const photo of filteredPhotos) {
				if (!byCategory[photo.category]) byCategory[photo.category] = [];
				byCategory[photo.category].push(photo);
			}
			for (const key of Object.keys(byCategory).sort(
				(a, b) => byCategory[b].length - byCategory[a].length,
			)) {
				groups.push({
					key,
					label: t(`projects.field.photoCategory.${key}`),
					items: byCategory[key],
				});
			}
		}

		return groups;
	}, [filteredPhotos, groupBy, t]);

	const lightboxSlides = useMemo(
		() =>
			filteredPhotos.map((photo) => ({
				src: photo.url,
				title: photo.caption || undefined,
				description: `${t(`projects.field.photoCategory.${photo.category}`)} — ${formatPhotoDate(photo.createdAt)}${
					photo.milestone ? ` — ${photo.milestone.title}` : ""
				}`,
			})),
		[filteredPhotos, t],
	);

	const openLightbox = (photoId: string) => {
		const idx = filteredPhotos.findIndex((p) => p.id === photoId);
		if (idx >= 0) setLightboxIndex(idx);
	};

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape" && lightboxIndex >= 0) setLightboxIndex(-1);
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [lightboxIndex]);

	const totalCount = allPhotos.length;
	const isLoading = photosQuery.isLoading;

	return (
		<div className="space-y-5">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
						{t("projects.photos.title")}
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{t("projects.photos.subtitle", { count: totalCount })}
					</p>
				</div>
				{canEdit && (
					<Button asChild className="rounded-xl">
						<Link href={`${basePath}/photos/upload`}>
							<Plus className="me-1.5 h-4 w-4" />
							{t("projects.photos.uploadButton")}
						</Link>
					</Button>
				)}
			</div>

			{/* Filters bar */}
			{totalCount > 0 && (
				<div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
					{/* Category filter pills */}
					<div className="flex flex-wrap gap-1.5">
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
						{ALL_CATEGORIES.map((cat) => {
							const count = allPhotos.filter((p) => p.category === cat).length;
							if (!count) return null;
							return (
								<button
									key={cat}
									type="button"
									onClick={() =>
										setActiveCategory(activeCategory === cat ? "ALL" : cat)
									}
									className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
										activeCategory === cat
											? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
											: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
									}`}
								>
									{t(`projects.field.photoCategory.${cat}`)} ({count})
								</button>
							);
						})}
					</div>

					{/* Milestone + group toggle */}
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex items-center gap-2">
							<Filter className="h-3.5 w-3.5 text-slate-400" />
							<Select
								value={activeMilestoneId}
								onValueChange={setActiveMilestoneId}
							>
								<SelectTrigger className="h-8 w-[200px] rounded-lg text-xs">
									<SelectValue
										placeholder={t("projects.photos.filterByMilestone")}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">
										{t("projects.photos.allMilestones")}
									</SelectItem>
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
						<div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
							{(["milestone", "date", "category"] as GroupBy[]).map((g) => (
								<button
									key={g}
									type="button"
									onClick={() => setGroupBy(g)}
									className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
										groupBy === g
											? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
											: "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
									}`}
								>
									{t(`projects.photos.groupBy.${g}`)}
								</button>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Content */}
			{isLoading ? (
				<div className="flex items-center justify-center py-16">
					<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
				</div>
			) : totalCount === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 dark:border-slate-700 dark:bg-slate-900/50">
					<div className="mb-4 rounded-2xl bg-slate-100 p-5 dark:bg-slate-800">
						<ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
					</div>
					<p className="text-sm font-medium text-slate-600 dark:text-slate-300">
						{t("projects.photos.empty")}
					</p>
					<p className="mt-1 text-xs text-slate-400">
						{t("projects.photos.emptyHint")}
					</p>
					{canEdit && (
						<Button asChild className="mt-4 rounded-xl">
							<Link href={`${basePath}/photos/upload`}>
								<Camera className="me-1.5 h-4 w-4" />
								{t("projects.field.uploadFirstPhoto")}
							</Link>
						</Button>
					)}
				</div>
			) : (
				<div className="space-y-6">
					{groupedPhotos.map((group) => (
						<section key={group.key}>
							<div className="mb-2.5 flex items-center gap-2">
								<h3 className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300">
									{group.label}
								</h3>
								<span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
									{group.items.length}
								</span>
								<div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
							</div>
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
								{group.items.map((photo) => (
									<PhotoCard
										key={photo.id}
										photo={photo}
										isCover={photo.id === coverPhotoId}
										canEdit={canEdit}
										onOpen={() => openLightbox(photo.id)}
										onSetCover={() =>
											setCoverMutation.mutate({
												organizationId,
												projectId,
												photoId: photo.id,
											})
										}
										onUnsetCover={() =>
											unsetCoverMutation.mutate({ organizationId, projectId })
										}
										onEdit={() => setPhotoToEdit(photo)}
										onDelete={() => setPhotoToDelete(photo)}
										t={t}
									/>
								))}
							</div>
						</section>
					))}
				</div>
			)}

			{/* Delete dialog */}
			<AlertDialog
				open={!!photoToDelete}
				onOpenChange={(open) => !open && setPhotoToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("projects.field.deletePhoto")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("projects.field.deletePhotoConfirm")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<Button
							variant="error"
							onClick={() => {
								if (!photoToDelete) return;
								deleteMutation.mutate({
									organizationId,
									projectId,
									photoId: photoToDelete.id,
								});
							}}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending
								? t("common.saving")
								: t("projects.field.deletePhoto")}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Edit dialog */}
			<EditPhotoDialog
				photo={photoToEdit}
				milestones={milestones}
				organizationId={organizationId}
				projectId={projectId}
				onClose={() => setPhotoToEdit(null)}
			/>

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

// ─── Photo Card ────────────────────────────────────────────

interface PhotoCardProps {
	photo: PhotoItem;
	isCover: boolean;
	canEdit: boolean;
	onOpen: () => void;
	onSetCover: () => void;
	onUnsetCover: () => void;
	onEdit: () => void;
	onDelete: () => void;
	t: ReturnType<typeof useTranslations>;
}

function PhotoCard({
	photo,
	isCover,
	canEdit,
	onOpen,
	onSetCover,
	onUnsetCover,
	onEdit,
	onDelete,
	t,
}: PhotoCardProps) {
	const [imgError, setImgError] = useState(false);
	const imageSrc = photo.url;

	return (
		<div
			className={`group relative aspect-square overflow-hidden rounded-xl border bg-slate-50 transition-all hover:shadow-lg dark:bg-slate-800/50 ${
				isCover
					? "border-amber-400 ring-2 ring-amber-300 dark:border-amber-500"
					: "border-slate-100 hover:border-primary/40 dark:border-slate-800"
			}`}
		>
			<button
				type="button"
				onClick={onOpen}
				className="absolute inset-0 size-full"
			>
				{!imgError ? (
					<img
						src={imageSrc}
						alt={photo.caption || ""}
						className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
						onError={() => setImgError(true)}
					/>
				) : (
					<div className="flex size-full items-center justify-center bg-slate-200 dark:bg-slate-700">
						<ImageIcon className="h-8 w-8 text-slate-400" />
					</div>
				)}
			</button>

			{/* Cover badge */}
			{isCover && (
				<div className="pointer-events-none absolute start-1.5 top-1.5">
					<Badge className="border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
						<Star className="me-0.5 h-3 w-3 fill-current" />
						{t("projects.photos.currentCover")}
					</Badge>
				</div>
			)}

			{/* Hover gradient */}
			<div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

			{/* Bottom metadata */}
			<div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 p-2 opacity-0 transition-opacity group-hover:opacity-100">
				<div className="flex flex-wrap items-center gap-1">
					<Badge
						variant="secondary"
						className={`${getCategoryColor(photo.category)} border text-[9px]`}
					>
						{t(`projects.field.photoCategory.${photo.category}`)}
					</Badge>
					{photo.milestone && (
						<Badge
							variant="secondary"
							className="border bg-violet-100 text-[9px] text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
						>
							{photo.milestone.title}
						</Badge>
					)}
				</div>
				{photo.caption && (
					<p className="line-clamp-2 text-[10px] font-medium text-white">
						{photo.caption}
					</p>
				)}
			</div>

			{/* Action buttons */}
			{canEdit && (
				<div className="absolute end-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							isCover ? onUnsetCover() : onSetCover();
						}}
						className={`flex size-7 items-center justify-center rounded-lg text-white shadow-md transition-colors ${
							isCover
								? "bg-amber-500/90 hover:bg-amber-600"
								: "bg-slate-800/80 hover:bg-amber-500"
						}`}
						aria-label={
							isCover
								? t("projects.photos.removeCover")
								: t("projects.photos.setAsCover")
						}
						title={
							isCover
								? t("projects.photos.removeCover")
								: t("projects.photos.setAsCover")
						}
					>
						{isCover ? (
							<StarOff className="size-3.5" />
						) : (
							<Star className="size-3.5" />
						)}
					</button>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onEdit();
						}}
						className="flex size-7 items-center justify-center rounded-lg bg-slate-800/80 text-white shadow-md transition-colors hover:bg-primary"
						aria-label={t("projects.photos.editPhoto")}
						title={t("projects.photos.editPhoto")}
					>
						<Pencil className="size-3.5" />
					</button>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
						className="flex size-7 items-center justify-center rounded-lg bg-red-500/90 text-white shadow-md transition-colors hover:bg-red-600"
						aria-label={t("projects.field.deletePhoto")}
						title={t("projects.field.deletePhoto")}
					>
						<Trash2 className="size-3.5" />
					</button>
				</div>
			)}
		</div>
	);
}

// ─── Edit Photo Dialog ─────────────────────────────────────

interface EditPhotoDialogProps {
	photo: PhotoItem | null;
	milestones: Array<{ id: string; title: string }>;
	organizationId: string;
	projectId: string;
	onClose: () => void;
}

function EditPhotoDialog({
	photo,
	milestones,
	organizationId,
	projectId,
	onClose,
}: EditPhotoDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [caption, setCaption] = useState("");
	const [category, setCategory] = useState<PhotoCategory>("PROGRESS");
	const [milestoneId, setMilestoneId] = useState<string>("none");

	useEffect(() => {
		if (photo) {
			setCaption(photo.caption ?? "");
			setCategory(photo.category);
			setMilestoneId(photo.milestone?.id ?? "none");
		}
	}, [photo]);

	const updateMutation = useMutation({
		...orpc.projectField.updatePhoto.mutationOptions(),
		onSuccess: () => {
			toast.success(t("common.saved"));
			queryClient.invalidateQueries({ queryKey: ["projectField"] });
			onClose();
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const handleSave = () => {
		if (!photo) return;
		updateMutation.mutate({
			organizationId,
			projectId,
			photoId: photo.id,
			caption: caption.trim(),
			category,
			milestoneId: milestoneId === "none" ? "none" : milestoneId,
		});
	};

	return (
		<Dialog open={!!photo} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("projects.photos.editPhoto")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					{photo && (
						<div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
							<img
								src={photo.url}
								alt=""
								className="max-h-48 w-full object-contain"
							/>
						</div>
					)}
					<div className="space-y-2">
						<Label>{t("projects.photos.caption")}</Label>
						<Input
							type="text"
							value={caption}
							onChange={(e) => setCaption(e.target.value)}
							placeholder={t("projects.photos.captionPlaceholder")}
							maxLength={200}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("projects.field.categoryLabel")}</Label>
						<Select
							value={category}
							onValueChange={(v) => setCategory(v as PhotoCategory)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ALL_CATEGORIES.map((cat) => (
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
							<SelectTrigger>
								<SelectValue
									placeholder={t("projects.photos.selectMilestone")}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">
									{t("projects.photos.noMilestone")}
								</SelectItem>
								{milestones.map((m) => (
									<SelectItem key={m.id} value={m.id}>
										{m.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						{t("common.cancel")}
					</Button>
					<Button onClick={handleSave} disabled={updateMutation.isPending}>
						{updateMutation.isPending ? t("common.saving") : t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
