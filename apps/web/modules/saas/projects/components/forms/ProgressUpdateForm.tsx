"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Slider } from "@ui/components/slider";
import { Textarea } from "@ui/components/textarea";
import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface ProgressUpdateFormProps {
	organizationId: string;
	projectId: string;
	currentProgress: number;
	onSuccess?: () => void;
}

export function ProgressUpdateForm({
	organizationId,
	projectId,
	currentProgress,
	onSuccess,
}: ProgressUpdateFormProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [progress, setProgress] = useState(currentProgress);
	const [phaseLabel, setPhaseLabel] = useState("");
	const [note, setNote] = useState("");

	const updateMutation = useMutation(
		orpc.projectField.addProgressUpdate.mutationOptions(),
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			await updateMutation.mutateAsync({
				organizationId,
				projectId,
				progress,
				phaseLabel: phaseLabel || undefined,
				note: note || undefined,
			});

			toast.success(t("projects.field.progressUpdated"));
			queryClient.invalidateQueries({ queryKey: ["projectField"] });
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			setNote("");
			setPhaseLabel("");
			onSuccess?.();
		} catch {
			toast.error(t("projects.field.progressUpdateError"));
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Progress Slider */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label>{t("projects.field.progressLabel")}</Label>
					<span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
						{progress}%
					</span>
				</div>
				<Slider
					value={[progress]}
					onValueChange={(v) => setProgress(v[0])}
					max={100}
					min={0}
					step={1}
					className="py-4"
				/>
				<div className="flex justify-between text-xs text-slate-500">
					<span>0%</span>
					<span>25%</span>
					<span>50%</span>
					<span>75%</span>
					<span>100%</span>
				</div>
			</div>

			{/* Phase Label */}
			<div className="space-y-2">
				<Label htmlFor="phaseLabel">{t("projects.field.phaseLabel")}</Label>
				<Input
					id="phaseLabel"
					value={phaseLabel}
					onChange={(e) => setPhaseLabel(e.target.value)}
					placeholder={t("projects.field.phaseLabelPlaceholder")}
					className="rounded-xl"
				/>
			</div>

			{/* Note */}
			<div className="space-y-2">
				<Label htmlFor="note">{t("projects.field.note")}</Label>
				<Textarea
					id="note"
					value={note}
					onChange={(e) => setNote(e.target.value)}
					placeholder={t("projects.field.notePlaceholder")}
					rows={3}
					className="rounded-xl"
				/>
			</div>

			{/* Submit */}
			<Button
				type="submit"
				disabled={updateMutation.isPending}
				className="w-full rounded-xl"
			>
				<TrendingUp className="me-2 h-4 w-4" />
				{updateMutation.isPending
					? t("common.saving")
					: t("projects.field.saveProgress")}
			</Button>
		</form>
	);
}
