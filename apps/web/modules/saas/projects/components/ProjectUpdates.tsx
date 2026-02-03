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
				toast.success("تم نشر التحديث الرسمي بنجاح");
				setIsEditing(false);
				// Reset form
				setHeadline("");
				setWorkDoneSummary("");
				setNextSteps("");
				setBlockers("");
				// Invalidate queries
				queryClient.invalidateQueries({ queryKey: ["projectUpdates"] });
			},
			onError: () => {
				toast.error("حدث خطأ أثناء نشر التحديث");
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
			toast.error("العنوان مطلوب");
			return;
		}

		publishMutation.mutate({
			organizationId,
			projectId,
			headline,
			progress: draftData?.draft.progress || 0,
			phaseLabel: draftData?.draft.phaseLabel,
			workDoneSummary: workDoneSummary || undefined,
			blockers: blockers || undefined,
			nextSteps: nextSteps || undefined,
			nextPayment: draftData?.draft.nextPayment || undefined,
			photoIds: draftData?.draft.photoIds,
		});
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Draft Preview or Editor */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				{!isEditing ? (
					<>
						<div className="mb-6 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
								إنشاء تحديث تلقائي
							</h2>
							<Button onClick={handleGenerateDraft} className="gap-2">
								<Sparkles className="h-4 w-4" />
								إنشاء مسودة
							</Button>
						</div>

						{/* Auto-generated Preview */}
						{draftData?.draft && (
							<div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
								<div className="flex items-center gap-2">
									<Megaphone className="h-5 w-5 text-sky-500" />
									<span className="font-medium text-slate-900 dark:text-slate-100">
										معاينة التحديث التلقائي
									</span>
								</div>

								<div className="space-y-3">
									<div>
										<span className="text-sm text-slate-500">العنوان:</span>
										<p className="font-medium text-slate-900 dark:text-slate-100">
											{draftData.draft.headline}
										</p>
									</div>

									<div className="flex items-center gap-4">
										<div>
											<span className="text-sm text-slate-500">التقدم:</span>
											<div className="flex items-center gap-2">
												<Progress
													value={draftData.draft.progress}
													className="h-2 w-24"
												/>
												<span className="font-medium text-teal-600">
													{draftData.draft.progress}%
												</span>
											</div>
										</div>
										{draftData.draft.phaseLabel && (
											<div>
												<span className="text-sm text-slate-500">المرحلة:</span>
												<Badge variant="outline" className="ms-1">
													{draftData.draft.phaseLabel}
												</Badge>
											</div>
										)}
									</div>

									{draftData.draft.workDoneSummary && (
										<div>
											<span className="text-sm text-slate-500">
												ما تم إنجازه:
											</span>
											<p className="text-slate-700 dark:text-slate-300">
												{draftData.draft.workDoneSummary}
											</p>
										</div>
									)}

									{draftData.draft.nextPayment && (
										<div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950/30">
											<span className="text-sm text-indigo-600 dark:text-indigo-400">
												الدفعة القادمة:
											</span>
											<p className="font-medium text-indigo-700 dark:text-indigo-300">
												المستخلص رقم {draftData.draft.nextPayment.claimNo} -{" "}
												{draftData.draft.nextPayment.amount.toLocaleString()}{" "}
												ر.س
											</p>
										</div>
									)}

									{draftData.draft.photos &&
										draftData.draft.photos.length > 0 && (
											<div>
												<span className="text-sm text-slate-500">
													<ImageIcon className="mb-0.5 inline h-4 w-4" /> صور
													مرفقة ({draftData.draft.photos.length})
												</span>
												<div className="mt-2 flex gap-2">
													{draftData.draft.photos.slice(0, 4).map((photo) => (
														<div
															key={photo.id}
															className="h-16 w-16 rounded-lg bg-slate-200 dark:bg-slate-700"
														/>
													))}
												</div>
											</div>
										)}
								</div>

								<p className="mt-4 text-xs text-slate-400">
									آخر تقرير:{" "}
									{draftData.lastReportDate
										? new Date(draftData.lastReportDate).toLocaleDateString(
												"ar-SA",
											)
										: "لا يوجد"}
								</p>
							</div>
						)}
					</>
				) : (
					<>
						<div className="mb-6 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
								تحرير التحديث
							</h2>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsEditing(false)}
							>
								إلغاء
							</Button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
									العنوان
								</label>
								<input
									type="text"
									value={headline}
									onChange={(e) => setHeadline(e.target.value)}
									className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
									placeholder="عنوان التحديث..."
								/>
							</div>

							<div>
								<label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
									ما تم إنجازه
								</label>
								<Textarea
									value={workDoneSummary}
									onChange={(e) => setWorkDoneSummary(e.target.value)}
									className="min-h-[100px]"
									placeholder="وصف الأعمال المنجزة..."
								/>
							</div>

							<div>
								<label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
									العوائق (اختياري)
								</label>
								<Textarea
									value={blockers}
									onChange={(e) => setBlockers(e.target.value)}
									className="min-h-[80px]"
									placeholder="أي عوائق أو مشاكل..."
								/>
							</div>

							<div>
								<label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
									الخطوات القادمة
								</label>
								<Textarea
									value={nextSteps}
									onChange={(e) => setNextSteps(e.target.value)}
									className="min-h-[80px]"
									placeholder="الخطوات المقبلة..."
								/>
							</div>

							{/* Progress display */}
							<div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
								<div className="flex items-center gap-4">
									<div className="flex-1">
										<span className="text-sm text-slate-500">
											نسبة الإنجاز:
										</span>
										<div className="mt-1 flex items-center gap-3">
											<Progress
												value={draftData?.draft.progress || 0}
												className="h-3"
											/>
											<span className="font-bold text-teal-600">
												{draftData?.draft.progress || 0}%
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
									إلغاء
								</Button>
								<Button
									onClick={handlePublish}
									disabled={publishMutation.isPending}
									className="gap-2"
								>
									<Send className="h-4 w-4" />
									{publishMutation.isPending ? "جاري النشر..." : "نشر للمالك"}
								</Button>
							</div>
						</div>
					</>
				)}
			</div>

			{/* Info Card */}
			<div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950/30">
				<div className="flex items-start gap-3">
					<Megaphone className="mt-0.5 h-5 w-5 text-sky-600 dark:text-sky-400" />
					<div>
						<p className="font-medium text-sky-800 dark:text-sky-200">
							ما هو التحديث الرسمي؟
						</p>
						<p className="text-sm text-sky-700 dark:text-sky-300">
							التحديث الرسمي هو رسالة مُهيكلة تُرسل لمالك المشروع عبر بوابته
							الخاصة. تتضمن نسبة الإنجاز، الأعمال المنجزة، الدفعات القادمة،
							وأي ملاحظات مهمة.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
