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
	CheckSquare,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Filter,
	ImageIcon,
	Pencil,
	Play,
	Plus,
	Square,
	Star,
	StarOff,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PhotoGridSkeleton } from "@saas/shared/components/skeletons";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { useProjectRole } from "../../hooks/use-project-role";
import { MultiPhotoUploadForm } from "./MultiPhotoUploadForm";

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
	mediaType?: "PHOTO" | "VIDEO";
	mimeType?: string | null;
	createdAt: string | Date;
	takenAt: string | Date;
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
			return "bg-chart-4/15 text-chart-4 dark:bg-chart-4/20 dark:text-chart-4 border-chart-4 dark:border-chart-4";
		case "ISSUE":
			return "bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-destructive border-destructive dark:border-destructive";
		case "EQUIPMENT":
			return "bg-chart-4/15 text-chart-4 dark:bg-chart-4/20 dark:text-chart-4 border-chart-4 dark:border-chart-4";
		case "MATERIAL":
			return "bg-chart-1/15 text-chart-1 dark:bg-chart-1/20 dark:text-chart-1 border-chart-1 dark:border-chart-1";
		case "SAFETY":
			return "bg-chart-2/15 text-chart-2 dark:bg-chart-2/20 dark:text-chart-2 border-chart-2 dark:border-chart-2";
		default:
			return "bg-muted text-muted-foreground border-border";
	}
}

function formatPhotoDate(date: Date | string): string {
	return new Intl.DateTimeFormat("ar-SA", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(date));
}

/** Format a date as a local YYYY-MM-DD string for <input type="date">. */
function toDateInputValue(date: Date | string): string {
	const d = new Date(date);
	const offsetMs = d.getTimezoneOffset() * 60 * 1000;
	return new Date(d.getTime() - offsetMs).toISOString().split("T")[0];
}

function todayLocalDate(): string {
	return toDateInputValue(new Date());
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
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [selectMode, setSelectMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [bulkEditOpen, setBulkEditOpen] = useState(false);
	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

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
			queryClient.invalidateQueries({ queryKey: orpc.projectField.key() });
		},
		onError: () => {
			toast.error(t("projects.field.photoDeleteError"));
		},
	});

	const setCoverMutation = useMutation({
		...orpc.projectField.setCoverPhoto.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projects.photos.coverSet"));
			queryClient.invalidateQueries({ queryKey: orpc.projectField.key() });
			queryClient.invalidateQueries({ queryKey: orpc.projects.key() });
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const unsetCoverMutation = useMutation({
		...orpc.projectField.unsetCoverPhoto.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projects.photos.coverRemoved"));
			queryClient.invalidateQueries({ queryKey: orpc.projectField.key() });
			queryClient.invalidateQueries({ queryKey: orpc.projects.key() });
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const bulkDeleteMutation = useMutation({
		...orpc.projectField.bulkDeletePhotos.mutationOptions(),
		onSuccess: (res) => {
			toast.success(t("projects.photos.bulkDeleted", { count: res.count }));
			setBulkDeleteOpen(false);
			setSelectedIds(new Set());
			setSelectMode(false);
			queryClient.invalidateQueries({ queryKey: orpc.projectField.key() });
			queryClient.invalidateQueries({ queryKey: orpc.projects.key() });
		},
		onError: () => {
			toast.error(t("projects.field.photoDeleteError"));
		},
	});

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const exitSelectMode = () => {
		setSelectMode(false);
		setSelectedIds(new Set());
	};

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

		// أحدث صورة (تاريخاً ووقتاً) أولاً داخل كل مجموعة.
		const sortByRecency = (a: PhotoItem, b: PhotoItem) => {
			const ta = new Date(a.takenAt).getTime();
			const tb = new Date(b.takenAt).getTime();
			if (tb !== ta) return tb - ta;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		};
		// أحدث تاريخ صورة في المجموعة — لترتيب المجموعات (الأحدث بالأعلى).
		const groupRecency = (items: PhotoItem[]) =>
			items.reduce((max, p) => Math.max(max, new Date(p.takenAt).getTime()), 0);

		if (groupBy === "milestone") {
			const byMilestone: Record<string, PhotoItem[]> = {};
			const titleByKey: Record<string, string> = {};

			for (const photo of filteredPhotos) {
				const key = photo.milestone?.id ?? "__none__";
				if (!byMilestone[key]) {
					byMilestone[key] = [];
					titleByKey[key] =
						photo.milestone?.title ?? t("projects.photos.noMilestone");
				}
				byMilestone[key].push(photo);
			}

			// مجموعة "بدون مرحلة" تنزل دائماً للأسفل، وباقي المراحل تُرتّب حسب
			// أحدث صورة فيها → المراحل الأخيرة بالأعلى والأولى بالأسفل.
			const keys = Object.keys(byMilestone).sort((a, b) => {
				if (a === "__none__") return 1;
				if (b === "__none__") return -1;
				return groupRecency(byMilestone[b]) - groupRecency(byMilestone[a]);
			});
			for (const key of keys) {
				groups.push({
					key,
					label: titleByKey[key],
					items: byMilestone[key].sort(sortByRecency),
				});
			}
		} else if (groupBy === "date") {
			const byDate: Record<string, PhotoItem[]> = {};
			for (const photo of filteredPhotos) {
				const dateKey = new Date(photo.takenAt).toISOString().split("T")[0];
				if (!byDate[dateKey]) byDate[dateKey] = [];
				byDate[dateKey].push(photo);
			}
			for (const key of Object.keys(byDate).sort((a, b) => b.localeCompare(a))) {
				groups.push({
					key,
					label: formatPhotoDate(key),
					items: byDate[key].sort(sortByRecency),
				});
			}
		} else {
			const byCategory: Record<string, PhotoItem[]> = {};
			for (const photo of filteredPhotos) {
				if (!byCategory[photo.category]) byCategory[photo.category] = [];
				byCategory[photo.category].push(photo);
			}
			for (const key of Object.keys(byCategory).sort(
				(a, b) => groupRecency(byCategory[b]) - groupRecency(byCategory[a]),
			)) {
				groups.push({
					key,
					label: t(`projects.field.photoCategory.${key}`),
					items: byCategory[key].sort(sortByRecency),
				});
			}
		}

		return groups;
	}, [filteredPhotos, groupBy, t]);

	const lightboxSlides = useMemo(
		() =>
			filteredPhotos.map((photo) => {
				const description = `${t(`projects.field.photoCategory.${photo.category}`)} — ${formatPhotoDate(photo.takenAt)}${
					photo.milestone ? ` — ${photo.milestone.title}` : ""
				}`;
				if (photo.mediaType === "VIDEO") {
					return {
						type: "video" as const,
						sources: [
							{
								src: photo.url,
								type: photo.mimeType || "video/mp4",
							},
						],
						title: photo.caption || undefined,
						description,
					};
				}
				return {
					src: photo.url,
					title: photo.caption || undefined,
					description,
				};
			}),
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
					<h1 className="text-2xl font-semibold text-foreground">
						{t("projects.photos.title")}
					</h1>
					<p className="text-sm text-muted-foreground">
						{t("projects.photos.subtitle", { count: totalCount })}
					</p>
				</div>
				{canEdit && (
					<div className="flex items-center gap-2">
						{totalCount > 0 && (
							<Button
								type="button"
								variant={selectMode ? "secondary" : "outline"}
								onClick={() =>
									selectMode ? exitSelectMode() : setSelectMode(true)
								}
								className="rounded-xl"
							>
								<CheckSquare className="me-1.5 h-4 w-4" />
								{selectMode
									? t("common.cancel")
									: t("projects.photos.selectMode")}
							</Button>
						)}
						<Button
							type="button"
							onClick={() => setIsUploadOpen((v) => !v)}
							className="rounded-xl"
						>
							{isUploadOpen ? (
								<ChevronUp className="me-1.5 h-4 w-4" />
							) : (
								<Plus className="me-1.5 h-4 w-4" />
							)}
							{isUploadOpen
								? t("projects.photos.closeUpload")
								: t("projects.photos.uploadButton")}
						</Button>
					</div>
				)}
			</div>

			{/* Inline upload (collapsible) */}
			{canEdit && isUploadOpen && (
				<div className="rounded-2xl border-2 bg-card p-4">
					<MultiPhotoUploadForm
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						projectId={projectId}
						embedded
						onSaved={() => {
							setIsUploadOpen(false);
							queryClient.invalidateQueries({ queryKey: orpc.projectField.key() });
						}}
					/>
				</div>
			)}

			{/* Filters bar */}
			{totalCount > 0 && (
				<div className="space-y-3 rounded-2xl border-2 bg-card p-4">
					{/* Category filter pills */}
					<div className="flex flex-wrap gap-1.5">
						<button
							type="button"
							onClick={() => setActiveCategory("ALL")}
							className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
								activeCategory === "ALL"
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:bg-accent"
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
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground hover:bg-accent"
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
							<Filter className="h-3.5 w-3.5 text-muted-foreground" />
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
						<div className="flex overflow-hidden rounded-lg border border-border">
							{(["milestone", "date", "category"] as GroupBy[]).map((g) => (
								<button
									key={g}
									type="button"
									onClick={() => setGroupBy(g)}
									className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
										groupBy === g
											? "bg-primary text-primary-foreground"
											: "bg-card text-muted-foreground hover:bg-accent"
									}`}
								>
									{t(`projects.photos.groupBy.${g}`)}
								</button>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Selection toolbar */}
			{canEdit && selectMode && totalCount > 0 && (
				<div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 bg-card px-4 py-2.5">
					<div className="flex items-center gap-3">
						<span className="text-sm font-semibold text-foreground">
							{t("projects.photos.selectedCount", {
								count: selectedIds.size,
							})}
						</span>
						<button
							type="button"
							onClick={() => {
								const allSelected =
									filteredPhotos.length > 0 &&
									filteredPhotos.every((p) => selectedIds.has(p.id));
								setSelectedIds(
									allSelected
										? new Set()
										: new Set(filteredPhotos.map((p) => p.id)),
								);
							}}
							className="text-xs font-medium text-primary hover:underline"
						>
							{filteredPhotos.length > 0 &&
							filteredPhotos.every((p) => selectedIds.has(p.id))
								? t("projects.photos.deselectAll")
								: t("projects.photos.selectAll")}
						</button>
					</div>
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="rounded-lg"
							disabled={selectedIds.size === 0}
							onClick={() => setBulkEditOpen(true)}
						>
							<Pencil className="me-1.5 h-3.5 w-3.5" />
							{t("projects.photos.bulkEdit")}
						</Button>
						<Button
							type="button"
							variant="error"
							size="sm"
							className="rounded-lg"
							disabled={selectedIds.size === 0}
							onClick={() => setBulkDeleteOpen(true)}
						>
							<Trash2 className="me-1.5 h-3.5 w-3.5" />
							{t("projects.photos.deleteSelected")}
						</Button>
					</div>
				</div>
			)}

			{/* Content */}
			{isLoading ? (
				<PhotoGridSkeleton withHeader={false} />
			) : totalCount === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card py-16">
					<div className="mb-4 rounded-2xl bg-muted p-5">
						<ImageIcon className="h-10 w-10 text-muted-foreground" />
					</div>
					<p className="text-sm font-medium text-foreground">
						{t("projects.photos.empty")}
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
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
								<h3 className="shrink-0 text-sm font-semibold text-foreground">
									{group.label}
								</h3>
								<span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
									{group.items.length}
								</span>
								<div className="h-px flex-1 bg-border" />
							</div>
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
								{group.items.map((photo) => (
									<PhotoCard
										key={photo.id}
										photo={photo}
										isCover={photo.id === coverPhotoId}
										canEdit={canEdit}
										selectMode={selectMode}
										selected={selectedIds.has(photo.id)}
										onToggleSelect={() => toggleSelect(photo.id)}
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

			{/* Bulk edit dialog */}
			<BulkEditDialog
				open={bulkEditOpen}
				count={selectedIds.size}
				milestones={milestones}
				organizationId={organizationId}
				projectId={projectId}
				photoIds={[...selectedIds]}
				onClose={() => setBulkEditOpen(false)}
				onSaved={() => {
					setBulkEditOpen(false);
					exitSelectMode();
				}}
			/>

			{/* Bulk delete dialog */}
			<AlertDialog
				open={bulkDeleteOpen}
				onOpenChange={(open) => !open && setBulkDeleteOpen(false)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("projects.photos.deleteSelected")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("projects.photos.deleteSelectedConfirm", {
								count: selectedIds.size,
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<Button
							variant="error"
							onClick={() =>
								bulkDeleteMutation.mutate({
									organizationId,
									projectId,
									photoIds: [...selectedIds],
								})
							}
							disabled={bulkDeleteMutation.isPending}
						>
							{bulkDeleteMutation.isPending
								? t("common.saving")
								: t("projects.photos.deleteSelected")}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Lightbox */}
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

// ─── Photo Card ────────────────────────────────────────────

interface PhotoCardProps {
	photo: PhotoItem;
	isCover: boolean;
	canEdit: boolean;
	selectMode: boolean;
	selected: boolean;
	onToggleSelect: () => void;
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
	selectMode,
	selected,
	onToggleSelect,
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
			className={`group relative aspect-square overflow-hidden rounded-xl border bg-muted transition-all ${
				selected
					? "border-primary ring-2 ring-primary/60"
					: isCover
						? "border-chart-1 ring-2 ring-chart-1/50"
						: "border-border hover:border-primary/40"
			}`}
		>
			<button
				type="button"
				onClick={selectMode ? onToggleSelect : onOpen}
				className="absolute inset-0 size-full"
			>
				{photo.mediaType === "VIDEO" ? (
					<>
						<video
							src={imageSrc}
							className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
							muted
							playsInline
							preload="metadata"
						/>
						<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
							<div className="rounded-full bg-white/90 p-2 transition-transform group-hover:scale-110">
								<Play className="size-5 fill-current text-black" />
							</div>
						</div>
					</>
				) : !imgError ? (
					<img
						src={imageSrc}
						alt={photo.caption || ""}
						className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
						onError={() => setImgError(true)}
					/>
				) : (
					<div className="flex size-full items-center justify-center bg-muted">
						<ImageIcon className="h-8 w-8 text-muted-foreground" />
					</div>
				)}
			</button>

			{/* Selection checkbox */}
			{selectMode && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onToggleSelect();
					}}
					className="absolute end-1.5 top-1.5 z-10 flex size-7 items-center justify-center rounded-lg bg-black/60 text-white"
					aria-label={t("projects.photos.selectMode")}
				>
					{selected ? (
						<CheckSquare className="size-5 text-primary" />
					) : (
						<Square className="size-5" />
					)}
				</button>
			)}

			{/* Cover badge */}
			{isCover && (
				<div className="pointer-events-none absolute start-1.5 top-1.5">
					<Badge className="border-chart-1 bg-chart-1/15 text-chart-1">
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
							className="border bg-chart-4/15 text-[9px] text-chart-4"
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
			{canEdit && !selectMode && (
				<div className="absolute end-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							isCover ? onUnsetCover() : onSetCover();
						}}
						className={`flex size-7 items-center justify-center rounded-lg text-white transition-colors ${
							isCover
								? "bg-chart-1 hover:bg-chart-1/90"
								: "bg-black/70 hover:bg-chart-1"
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
						className="flex size-7 items-center justify-center rounded-lg bg-black/70 text-white transition-colors hover:bg-primary"
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
						className="flex size-7 items-center justify-center rounded-lg bg-destructive/90 text-white transition-colors hover:bg-destructive"
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
	const [takenAt, setTakenAt] = useState<string>("");

	useEffect(() => {
		if (photo) {
			setCaption(photo.caption ?? "");
			setCategory(photo.category);
			setMilestoneId(photo.milestone?.id ?? "none");
			setTakenAt(toDateInputValue(photo.takenAt));
		}
	}, [photo]);

	const updateMutation = useMutation({
		...orpc.projectField.updatePhoto.mutationOptions(),
		onSuccess: () => {
			toast.success(t("common.saved"));
			queryClient.invalidateQueries({ queryKey: orpc.projectField.key() });
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
			takenAt: takenAt ? new Date(takenAt) : undefined,
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
						<div className="overflow-hidden rounded-xl border border-border">
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
						<Label>{t("projects.photos.photoDate")}</Label>
						<Input
							type="date"
							value={takenAt}
							max={todayLocalDate()}
							onChange={(e) => setTakenAt(e.target.value)}
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

// ─── Bulk Edit Dialog ──────────────────────────────────────

interface BulkEditDialogProps {
	open: boolean;
	count: number;
	milestones: Array<{ id: string; title: string }>;
	organizationId: string;
	projectId: string;
	photoIds: string[];
	onClose: () => void;
	onSaved: () => void;
}

const KEEP = "__keep__";

function BulkEditDialog({
	open,
	count,
	milestones,
	organizationId,
	projectId,
	photoIds,
	onClose,
	onSaved,
}: BulkEditDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [takenAt, setTakenAt] = useState<string>("");
	const [category, setCategory] = useState<string>(KEEP);
	const [milestoneId, setMilestoneId] = useState<string>(KEEP);

	useEffect(() => {
		if (open) {
			setTakenAt("");
			setCategory(KEEP);
			setMilestoneId(KEEP);
		}
	}, [open]);

	const bulkUpdateMutation = useMutation({
		...orpc.projectField.bulkUpdatePhotos.mutationOptions(),
		onSuccess: (res) => {
			toast.success(t("projects.photos.bulkUpdated", { count: res.count }));
			queryClient.invalidateQueries({ queryKey: orpc.projectField.key() });
			onSaved();
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const hasChange =
		!!takenAt || category !== KEEP || milestoneId !== KEEP;

	const handleSave = () => {
		if (photoIds.length === 0 || !hasChange) return;
		bulkUpdateMutation.mutate({
			organizationId,
			projectId,
			photoIds,
			category:
				category === KEEP ? undefined : (category as PhotoCategory),
			milestoneId: milestoneId === KEEP ? undefined : milestoneId,
			takenAt: takenAt ? new Date(takenAt) : undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{t("projects.photos.bulkEditTitle", { count })}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<p className="text-xs text-muted-foreground">
						{t("projects.photos.bulkEditHint")}
					</p>
					<div className="space-y-2">
						<Label>{t("projects.photos.photoDate")}</Label>
						<Input
							type="date"
							value={takenAt}
							max={todayLocalDate()}
							onChange={(e) => setTakenAt(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("projects.field.categoryLabel")}</Label>
						<Select value={category} onValueChange={setCategory}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={KEEP}>
									{t("projects.photos.keepUnchanged")}
								</SelectItem>
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
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={KEEP}>
									{t("projects.photos.keepUnchanged")}
								</SelectItem>
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
					<Button
						onClick={handleSave}
						disabled={bulkUpdateMutation.isPending || !hasChange}
					>
						{bulkUpdateMutation.isPending
							? t("common.saving")
							: t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
