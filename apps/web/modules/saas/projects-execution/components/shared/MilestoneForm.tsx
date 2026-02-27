"use client";

import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { Textarea } from "@ui/components/textarea";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface MilestoneFormData {
	title: string;
	description?: string;
	plannedStart?: string;
	plannedEnd?: string;
	isCritical: boolean;
}

interface MilestoneFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: MilestoneFormData) => void;
	isLoading?: boolean;
	initialData?: {
		title: string;
		description?: string | null;
		plannedStart?: Date | string | null;
		plannedEnd?: Date | string | null;
		isCritical: boolean;
	};
	mode?: "create" | "edit";
}

function formatDateForInput(date: Date | string | null | undefined): string {
	if (!date) return "";
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toISOString().split("T")[0];
}

export function MilestoneForm({
	open,
	onOpenChange,
	onSubmit,
	isLoading,
	initialData,
	mode = "create",
}: MilestoneFormProps) {
	const t = useTranslations();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [plannedStart, setPlannedStart] = useState("");
	const [plannedEnd, setPlannedEnd] = useState("");
	const [isCritical, setIsCritical] = useState(false);

	useEffect(() => {
		if (initialData) {
			setTitle(initialData.title);
			setDescription(initialData.description ?? "");
			setPlannedStart(formatDateForInput(initialData.plannedStart));
			setPlannedEnd(formatDateForInput(initialData.plannedEnd));
			setIsCritical(initialData.isCritical);
		} else {
			setTitle("");
			setDescription("");
			setPlannedStart("");
			setPlannedEnd("");
			setIsCritical(false);
		}
	}, [initialData, open]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit({
			title,
			description: description || undefined,
			plannedStart: plannedStart
				? new Date(plannedStart).toISOString()
				: undefined,
			plannedEnd: plannedEnd
				? new Date(plannedEnd).toISOString()
				: undefined,
			isCritical,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{mode === "create"
							? t("timeline.createMilestone")
							: t("timeline.editMilestone")}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? t("timeline.createMilestoneDescription")
							: t("timeline.editMilestoneDescription")}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label>{t("timeline.form.title")}</Label>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t("timeline.form.titlePlaceholder")}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("timeline.form.description")}</Label>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t("timeline.form.descriptionPlaceholder")}
							rows={3}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>{t("timeline.form.plannedStart")}</Label>
							<Input
								type="date"
								value={plannedStart}
								onChange={(e) => setPlannedStart(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("timeline.form.plannedEnd")}</Label>
							<Input
								type="date"
								value={plannedEnd}
								onChange={(e) => setPlannedEnd(e.target.value)}
							/>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Switch
							checked={isCritical}
							onCheckedChange={setIsCritical}
						/>
						<div>
							<Label>{t("timeline.form.isCritical")}</Label>
							<p className="text-xs text-muted-foreground">
								{t("timeline.form.isCriticalDescription")}
							</p>
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("common.cancel")}
						</Button>
						<Button type="submit" disabled={isLoading || !title.trim()}>
							{mode === "create"
								? t("timeline.form.create")
								: t("common.save")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
