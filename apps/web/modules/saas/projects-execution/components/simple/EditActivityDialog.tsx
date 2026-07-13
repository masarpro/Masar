"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/api-client";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditActivityDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projectId: string;
	milestoneId: string;
	activity: {
		id: string;
		title: string;
		description: string | null;
		plannedStart: string | Date | null;
		plannedEnd: string | Date | null;
		duration: number | null;
		status: string;
		progress: number | string;
		notes: string | null;
	};
}

function toDateInput(value: string | Date | null): string {
	if (!value) return "";
	try {
		const d = new Date(value);
		if (isNaN(d.getTime())) return "";
		return d.toISOString().slice(0, 10);
	} catch {
		return "";
	}
}

function toIsoDate(value: string): string | null {
	if (!value) return null;
	return new Date(`${value}T00:00:00.000Z`).toISOString();
}

const STATUSES = [
	"NOT_STARTED",
	"IN_PROGRESS",
	"COMPLETED",
	"DELAYED",
	"ON_HOLD",
	"CANCELLED",
] as const;

export function EditActivityDialog({
	open,
	onOpenChange,
	projectId,
	milestoneId,
	activity,
}: EditActivityDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const [form, setForm] = useState({
		title: activity.title,
		description: activity.description ?? "",
		plannedStart: toDateInput(activity.plannedStart),
		plannedEnd: toDateInput(activity.plannedEnd),
		duration: activity.duration?.toString() ?? "",
		status: activity.status,
		progress: Number(activity.progress) || 0,
		notes: activity.notes ?? "",
	});

	useEffect(() => {
		if (open) {
			setForm({
				title: activity.title,
				description: activity.description ?? "",
				plannedStart: toDateInput(activity.plannedStart),
				plannedEnd: toDateInput(activity.plannedEnd),
				duration: activity.duration?.toString() ?? "",
				status: activity.status,
				progress: Number(activity.progress) || 0,
				notes: activity.notes ?? "",
			});
		}
	}, [open, activity]);

	const invalidate = () => {
		queryClient.invalidateQueries({
			queryKey: [
				"project-execution-activities",
				organizationId,
				projectId,
				milestoneId,
			],
		});
		queryClient.invalidateQueries({
			queryKey: ["project-timeline", organizationId, projectId],
		});
		queryClient.invalidateQueries({
			queryKey: ["project-execution-dashboard", organizationId, projectId],
		});
	};

	const updateMutation = useMutation({
		mutationFn: async () => {
			if (!organizationId) throw new Error("No organization");
			return apiClient.projectExecution.updateActivity({
				organizationId,
				projectId,
				activityId: activity.id,
				title: form.title.trim(),
				description: form.description.trim() || null,
				plannedStart: toIsoDate(form.plannedStart),
				plannedEnd: toIsoDate(form.plannedEnd),
				duration: form.duration ? Number(form.duration) : null,
				status: form.status as any,
				progress: form.progress,
				notes: form.notes.trim() || null,
			});
		},
		onSuccess: () => {
			toast.success(t("execution.notifications.activityUpdated"));
			invalidate();
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.title.trim()) return;
		updateMutation.mutate();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl p-0 gap-0 rounded-2xl overflow-hidden flex flex-col max-h-[90dvh]">
				<DialogHeader className="bg-card border-b px-5 py-4">
					<DialogTitle>{t("execution.activity.edit")}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
					<div className="p-5 space-y-4 overflow-y-auto min-h-0 flex-1">
						<div className="space-y-1.5">
							<Label>{t("execution.activity.titleField")}</Label>
							<Input
								value={form.title}
								onChange={(e: any) =>
									setForm((f) => ({ ...f, title: e.target.value }))
								}
								className="rounded-xl h-10"
								required
							/>
						</div>

						<div className="space-y-1.5">
							<Label>{t("execution.activity.description")}</Label>
							<Textarea
								value={form.description}
								onChange={(e: any) =>
									setForm((f) => ({ ...f, description: e.target.value }))
								}
								className="rounded-xl min-h-[80px]"
								rows={3}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label>{t("execution.activity.plannedStart")}</Label>
								<Input
									type="date"
									value={form.plannedStart}
									onChange={(e: any) =>
										setForm((f) => ({ ...f, plannedStart: e.target.value }))
									}
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1.5">
								<Label>{t("execution.activity.plannedEnd")}</Label>
								<Input
									type="date"
									value={form.plannedEnd}
									onChange={(e: any) =>
										setForm((f) => ({ ...f, plannedEnd: e.target.value }))
									}
									className="rounded-xl h-10"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label>{t("execution.activity.duration")}</Label>
								<Input
									type="number"
									min={0}
									value={form.duration}
									onChange={(e: any) =>
										setForm((f) => ({ ...f, duration: e.target.value }))
									}
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1.5">
								<Label>{t("execution.activity.statusLabel")}</Label>
								<Select
									value={form.status}
									onValueChange={(v: any) =>
										setForm((f) => ({ ...f, status: v }))
									}
								>
									<SelectTrigger className="rounded-xl h-10">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{STATUSES.map((s) => (
											<SelectItem key={s} value={s}>
												{t(`execution.activity.status.${s}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label>
								{t("execution.activity.progress")} ({form.progress}%)
							</Label>
							<Input
								type="range"
								min={0}
								max={100}
								step={1}
								value={form.progress}
								onChange={(e: any) =>
									setForm((f) => ({ ...f, progress: Number(e.target.value) }))
								}
								className="rounded-xl"
							/>
						</div>

						<div className="space-y-1.5">
							<Label>{t("execution.activity.notes")}</Label>
							<Textarea
								value={form.notes}
								onChange={(e: any) =>
									setForm((f) => ({ ...f, notes: e.target.value }))
								}
								className="rounded-xl min-h-[60px]"
								rows={2}
							/>
						</div>
					</div>

					<div className="bg-muted/50 border-t px-5 py-3 flex justify-between gap-3">
						<Button
							type="button"
							variant="outline"
							className="rounded-xl h-10"
							onClick={() => onOpenChange(false)}
						>
							{t("common.cancel")}
						</Button>
						<Button
							type="submit"
							className="rounded-xl h-10"
							disabled={!form.title.trim() || updateMutation.isPending}
						>
							{updateMutation.isPending && (
								<Loader2 className="h-4 w-4 me-1.5 animate-spin" />
							)}
							{t("common.saveChanges")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
