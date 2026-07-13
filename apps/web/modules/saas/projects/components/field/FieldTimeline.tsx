"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Progress } from "@ui/components/progress";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import { Button } from "@ui/components/button";
import {
	AlertTriangle,
	Camera,
	Clock,
	FileText,
	Trash2,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useProjectRole } from "../../hooks/use-project-role";
import { DailyReportCard } from "./DailyReportCard";
import { IssueCard } from "./IssueCard";
import { PhotoGrid } from "./PhotoGrid";
import { MinimalSkeleton } from "@saas/shared/components/skeletons";
import { ProgressUpdateForm } from "../forms/ProgressUpdateForm";

interface FieldTimelineProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

function formatDate(date: Date | string): string {
	return new Intl.DateTimeFormat("ar-SA", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date));
}

export function FieldTimeline({
	organizationId,
	organizationSlug,
	projectId,
}: FieldTimelineProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { isManager } = useProjectRole();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const [showProgressForm, setShowProgressForm] = useState(false);
	const [photoToDelete, setPhotoToDelete] = useState<{ id: string } | null>(
		null,
	);

	const deletePhotoMutation = useMutation({
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

	const handleDeletePhoto = () => {
		if (!photoToDelete) return;
		deletePhotoMutation.mutate({
			organizationId,
			projectId,
			photoId: photoToDelete.id,
		});
	};

	const { data, isLoading } = useQuery(
		orpc.projectField.getTimeline.queryOptions({
			input: {
				organizationId,
				projectId,
				limit: 50,
			},
		}),
	);

	const { data: project } = useQuery(
		orpc.projects.getById.queryOptions({
			input: {
				id: projectId,
				organizationId,
			},
		}),
	);

	if (isLoading) {
		return <MinimalSkeleton />;
	}

	const rawTimeline = data?.timeline ?? [];
	const TYPE_MAP = {
		DAILY_REPORT: "report",
		PHOTO: "photo",
		ISSUE: "issue",
		PROGRESS_UPDATE: "progress",
	} as const;
	const timeline = rawTimeline.map((item: any) => ({
		...item,
		type: (TYPE_MAP[item.type as keyof typeof TYPE_MAP] ??
			item.type.toLowerCase()) as "report" | "photo" | "issue" | "progress",
	}));
	const currentProgress = Number(project?.progress ?? 0);

	// Quick action buttons
	const quickActions = [
		{
			label: t("projects.field.newReport"),
			icon: FileText,
			href: `${basePath}/execution/new-report`,
			color: "bg-chart-4/15 text-chart-4 hover:bg-chart-4/15 dark:bg-chart-4/20 dark:text-chart-4",
		},
		{
			label: t("projects.field.uploadPhoto"),
			icon: Camera,
			href: `${basePath}/execution/upload`,
			color: "bg-success/15 text-success hover:bg-success/15 dark:bg-success/20 dark:text-success",
		},
		{
			label: t("projects.field.newIssue"),
			icon: AlertTriangle,
			href: `${basePath}/execution/new-issue`,
			color: "bg-destructive/15 text-destructive hover:bg-destructive/15 dark:bg-destructive/20 dark:text-destructive",
		},
	];

	return (
		<div className="space-y-6">
			{/* Quick Actions */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
				{quickActions.map((action) => (
					<Link key={action.label} href={action.href}>
						<div
							className={`flex items-center gap-3 rounded-xl p-4 transition-colors ${action.color}`}
						>
							<action.icon className="h-5 w-5" />
							<span className="text-sm font-medium">{action.label}</span>
						</div>
					</Link>
				))}
				<button
					type="button"
					onClick={() => setShowProgressForm(!showProgressForm)}
					className="flex items-center gap-3 rounded-xl p-4 transition-colors bg-chart-1/15 text-chart-1 hover:bg-chart-1/15 dark:bg-chart-1/20 dark:text-chart-1"
				>
					<TrendingUp className="h-5 w-5" />
					<span className="text-sm font-medium">
						{t("projects.field.updateProgress")}
					</span>
				</button>
			</div>

			{/* Progress Card */}
			<div className="rounded-2xl border-2 bg-card p-5">
				<div className="mb-3 flex items-center justify-between">
					<span className="text-sm font-medium text-muted-foreground">
						{t("projects.field.currentProgress")}
					</span>
					<span className="text-3xl font-bold text-chart-4 dark:text-chart-4">
						{Math.round(currentProgress)}%
					</span>
				</div>
				<Progress value={currentProgress} className="h-4" />
			</div>

			{/* Progress Update Form (Collapsible) */}
			{showProgressForm && (
				<div className="rounded-2xl border-2 bg-card p-5">
					<h2 className="mb-4 text-lg font-semibold text-card-foreground">
						{t("projects.field.updateProgress")}
					</h2>
					<ProgressUpdateForm
						organizationId={organizationId}
						projectId={projectId}
						currentProgress={currentProgress}
						onSuccess={() => setShowProgressForm(false)}
					/>
				</div>
			)}

			{/* Timeline */}
			<div className="space-y-4">
				<h2 className="text-lg font-semibold text-foreground">
					{t("projects.field.timeline")}
				</h2>

				{timeline.length === 0 ? (
					<div className="rounded-2xl border-2 border-dashed bg-card p-8 text-center">
						<Clock className="mx-auto h-12 w-12 text-muted-foreground" />
						<p className="mt-4 text-lg font-medium text-muted-foreground">
							{t("projects.field.noActivities")}
						</p>
						<p className="mt-2 text-sm text-muted-foreground">
							{t("projects.field.startAdding")}
						</p>
					</div>
				) : (
					<>
						<div className="space-y-4">
							{timeline.map((item: any) => (
								<TimelineItem
									key={`${item.type}-${item.data.id}`}
									item={item}
									isManager={isManager}
									onDeletePhoto={
										item.type === "photo"
											? () =>
													setPhotoToDelete({
														id: item.data.id as string,
													})
											: undefined
									}
								/>
							))}
						</div>
						{/* Delete photo confirmation */}
						<AlertDialog
							open={!!photoToDelete}
							onOpenChange={(open: any) => !open && setPhotoToDelete(null)}
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
									<AlertDialogCancel>
										{t("common.cancel")}
									</AlertDialogCancel>
									<Button
										variant="error"
										onClick={handleDeletePhoto}
										disabled={deletePhotoMutation.isPending}
									>
										{deletePhotoMutation.isPending
											? t("common.saving")
											: t("projects.field.deletePhoto")}
									</Button>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</>
				)}
			</div>
		</div>
	);
}

function TimelineItem({
	item,
	isManager,
	onDeletePhoto,
}: {
	item: {
		type: "report" | "photo" | "issue" | "progress";
		data: Record<string, unknown>;
		createdAt: Date;
	};
	isManager: boolean;
	onDeletePhoto?: () => void;
}) {
	const t = useTranslations();

	switch (item.type) {
		case "report":
			return <DailyReportCard report={item.data} />;
		case "photo":
			return (
				<div className="relative rounded-2xl border-2 bg-card p-4">
					<div className="mb-3 flex items-center justify-between gap-2">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Camera className="h-4 w-4" />
							<span>{t("projects.field.photoUploaded")}</span>
							<span className="text-muted-foreground">•</span>
							<span>{formatDate(item.createdAt)}</span>
						</div>
						{isManager && onDeletePhoto && (
							<button
								type="button"
								onClick={onDeletePhoto}
								className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
								aria-label={t("projects.field.deletePhoto")}
							>
								<Trash2 className="h-4 w-4" />
							</button>
						)}
					</div>
					<PhotoGrid photos={[item.data]} />
				</div>
			);
		case "issue":
			return <IssueCard issue={item.data} />;
		case "progress":
			return (
				<div className="rounded-2xl border-2 bg-card p-4">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-chart-4/15 p-2.5 dark:bg-chart-4/20">
							<TrendingUp className="h-5 w-5 text-chart-4 dark:text-chart-4" />
						</div>
						<div className="flex-1">
							<p className="font-medium text-card-foreground">
								{t("projects.field.progressUpdated")}
							</p>
							<p className="text-sm text-muted-foreground">
								{(item.data as { progress: number }).progress}% -{" "}
								{(item.data as { phaseLabel?: string }).phaseLabel ||
									t("projects.field.noPhase")}
							</p>
						</div>
						<div className="text-start text-sm text-muted-foreground">
							{formatDate(item.createdAt)}
						</div>
					</div>
					{(item.data as { note?: string }).note && (
						<p className="mt-3 text-sm text-muted-foreground">
							{(item.data as { note: string }).note}
						</p>
					)}
				</div>
			);
		default:
			return null;
	}
}
