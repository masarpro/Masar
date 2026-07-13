"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Progress } from "@ui/components/progress";
import { Textarea } from "@ui/components/textarea";
import {
	Image as ImageIcon,
	Megaphone,
	Send,
	Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

interface ProjectUpdatesProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function ProjectUpdates({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectUpdatesProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;

	const [isEditing, setIsEditing] = useState(false);
	const [headline, setHeadline] = useState("");
	const [workDoneSummary, setWorkDoneSummary] = useState("");
	const [nextSteps, setNextSteps] = useState("");
	const [blockers, setBlockers] = useState("");

	const {
		data: draftData,
		isLoading,
		refetch,
		isRefetching,
	} = useQuery(
		orpc.projectUpdates.generateDraft.queryOptions({
			input: {
				organizationId,
				projectId,
			},
		}),
	);

	const publishMutation = useMutation(
		orpc.projectUpdates.publish.mutationOptions({
			onSuccess: () => {
				toast.success(t("projects.updates.toastPublished"));
				setIsEditing(false);
				// Reset form
				setHeadline("");
				setWorkDoneSummary("");
				setNextSteps("");
				setBlockers("");
				// Invalidate queries
				queryClient.invalidateQueries({ queryKey: orpc.projectUpdates.key() });
			},
			onError: () => {
				toast.error(t("projects.updates.toastError"));
			},
		}),
	);

	const handleGenerateDraft = () => {
		if (draftData?.draft) {
			setHeadline(draftData.draft.headline);
			setWorkDoneSummary(draftData.draft.workDoneSummary || "");
			setNextSteps(draftData.draft.nextSteps || "");
			setBlockers(draftData.draft.blockers || "");
			setIsEditing(true);
		}
	};

	const handlePublish = () => {
		if (!headline.trim()) {
			toast.error(t("projects.updates.headlineRequired"));
			return;
		}

		publishMutation.mutate({
			organizationId,
			projectId,
			headline,
			progress: Number(draftData?.draft.progress || 0),
			phaseLabel: draftData?.draft.phaseLabel,
			workDoneSummary: workDoneSummary || undefined,
			blockers: blockers || undefined,
			nextSteps: nextSteps || undefined,
			nextPayment: draftData?.draft.nextPayment || undefined,
			photoIds: draftData?.draft.photoIds,
		});
	};

	if (isLoading) {
		return <ListTableSkeleton />;
	}

	return (
		<div className="space-y-6">
			{/* Draft Preview or Editor */}
			<div className="rounded-2xl border-2 bg-card p-6">
				{!isEditing ? (
					<>
						<div className="mb-6 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-card-foreground">
								{t("projects.updates.createAutoUpdate")}
							</h2>
							<Button onClick={handleGenerateDraft} className="gap-2">
								<Sparkles className="h-4 w-4" />
								{t("projects.updates.generateDraft")}
							</Button>
						</div>

						{/* Auto-generated Preview */}
						{draftData?.draft && (
							<div className="space-y-4 rounded-xl border-2 bg-muted/40 p-4">
								<div className="flex items-center gap-2">
									<Megaphone className="h-5 w-5 text-chart-4" />
									<span className="font-medium text-card-foreground">
										{t("projects.updates.preview")}
									</span>
								</div>

								<div className="space-y-3">
									<div>
										<span className="text-sm text-muted-foreground">{t("projects.updates.headline")}:</span>
										<p className="font-medium text-card-foreground">
											{draftData.draft.headline}
										</p>
									</div>

									<div className="flex items-center gap-4">
										<div>
											<span className="text-sm text-muted-foreground">{t("projects.updates.progress")}:</span>
											<div className="flex items-center gap-2">
												<Progress
													value={Number(draftData.draft.progress)}
													className="h-2 w-24"
												/>
												<span className="font-medium text-chart-4">
													{Number(draftData.draft.progress)}%
												</span>
											</div>
										</div>
										{draftData.draft.phaseLabel && (
											<div>
												<span className="text-sm text-muted-foreground">{t("projects.updates.phase")}:</span>
												<Badge variant="outline" className="ms-1">
													{draftData.draft.phaseLabel}
												</Badge>
											</div>
										)}
									</div>

									{draftData.draft.workDoneSummary && (
										<div>
											<span className="text-sm text-muted-foreground">
												{t("projects.updates.workDone")}:
											</span>
											<p className="text-foreground">
												{draftData.draft.workDoneSummary}
											</p>
										</div>
									)}

									{draftData.draft.nextPayment && (
										<div className="rounded-lg bg-chart-4/10 p-3">
											<span className="text-sm text-chart-4">
												{t("projects.updates.nextPayment")}:
											</span>
											<p className="font-medium text-chart-4">
												{t("projects.updates.claimNo", { no: draftData.draft.nextPayment.claimNo })} -{" "}
												{draftData.draft.nextPayment.amount.toLocaleString("en-US")}{" "}
												{t("common.sar")}
											</p>
										</div>
									)}

									{draftData.draft.photos &&
										draftData.draft.photos.length > 0 && (
											<div>
												<span className="text-sm text-muted-foreground">
													<ImageIcon className="mb-0.5 inline h-4 w-4" /> {t("projects.updates.attachedPhotos")} ({draftData.draft.photos.length})
												</span>
												<div className="mt-2 flex gap-2">
													{draftData.draft.photos.slice(0, 4).map((photo: any) => (
														<div
															key={photo.id}
															className="h-16 w-16 rounded-lg bg-muted"
														/>
													))}
												</div>
											</div>
										)}
								</div>

								<p className="mt-4 text-xs text-muted-foreground">
									{t("projects.updates.lastReport")}:{" "}
									{draftData.lastReportDate
										? new Date(draftData.lastReportDate).toLocaleDateString(
												"ar-SA",
											)
										: "-"}
								</p>
							</div>
						)}
					</>
				) : (
					<>
						<div className="mb-6 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-card-foreground">
								{t("projects.updates.editUpdate")}
							</h2>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsEditing(false)}
							>
								{t("common.cancel")}
							</Button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="mb-1.5 block text-sm font-medium text-foreground">
									{t("projects.updates.headline")}
								</label>
								<input
									type="text"
									value={headline}
									onChange={(e) => setHeadline(e.target.value)}
									className="w-full rounded-lg border border-input bg-card px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
									placeholder={t("projects.updates.headlinePlaceholder")}
								/>
							</div>

							<div>
								<label className="mb-1.5 block text-sm font-medium text-foreground">
									{t("projects.updates.workDone")}
								</label>
								<Textarea
									value={workDoneSummary}
									onChange={(e: any) => setWorkDoneSummary(e.target.value)}
									className="min-h-[100px]"
									placeholder={t("projects.updates.workDonePlaceholder")}
								/>
							</div>

							<div>
								<label className="mb-1.5 block text-sm font-medium text-foreground">
									{t("projects.updates.blockersOptional")}
								</label>
								<Textarea
									value={blockers}
									onChange={(e: any) => setBlockers(e.target.value)}
									className="min-h-[80px]"
									placeholder={t("projects.updates.blockersPlaceholder")}
								/>
							</div>

							<div>
								<label className="mb-1.5 block text-sm font-medium text-foreground">
									{t("projects.updates.nextSteps")}
								</label>
								<Textarea
									value={nextSteps}
									onChange={(e: any) => setNextSteps(e.target.value)}
									className="min-h-[80px]"
									placeholder={t("projects.updates.nextStepsPlaceholder")}
								/>
							</div>

							{/* Progress display */}
							<div className="rounded-lg bg-muted/40 p-4">
								<div className="flex items-center gap-4">
									<div className="flex-1">
										<span className="text-sm text-muted-foreground">
											{t("projects.updates.progressLabel")}:
										</span>
										<div className="mt-1 flex items-center gap-3">
											<Progress
												value={Number(draftData?.draft.progress || 0)}
												className="h-3"
											/>
											<span className="font-bold text-chart-4">
												{Number(draftData?.draft.progress || 0)}%
											</span>
										</div>
									</div>
								</div>
							</div>

							<div className="flex justify-end gap-3 pt-4">
								<Button
									variant="outline"
									onClick={() => setIsEditing(false)}
								>
									{t("common.cancel")}
								</Button>
								<Button
									onClick={handlePublish}
									disabled={publishMutation.isPending}
									className="gap-2"
								>
									<Send className="h-4 w-4" />
									{publishMutation.isPending ? t("projects.updates.publishing") : t("projects.updates.publishToOwner")}
								</Button>
							</div>
						</div>
					</>
				)}
			</div>

			{/* Info Card */}
			<div className="rounded-2xl border-2 bg-card p-4">
				<div className="flex items-start gap-3">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<Megaphone className="h-5 w-5" />
					</div>
					<div>
						<p className="font-medium text-card-foreground">
							{t("projects.updates.whatIsUpdate")}
						</p>
						<p className="text-sm text-muted-foreground">
							{t("projects.updates.updateExplanation")}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
