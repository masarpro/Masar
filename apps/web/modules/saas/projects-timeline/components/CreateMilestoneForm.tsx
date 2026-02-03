"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Switch } from "@ui/components/switch";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	title: z.string().min(1).max(200),
	description: z.string().max(2000).optional(),
	plannedStart: z.string().optional(),
	plannedEnd: z.string().optional(),
	isCritical: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateMilestoneFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: FormData) => void;
	isLoading?: boolean;
	editData?: {
		id: string;
		title: string;
		description?: string | null;
		plannedStart?: Date | string | null;
		plannedEnd?: Date | string | null;
		isCritical: boolean;
	};
}

export function CreateMilestoneForm({
	open,
	onOpenChange,
	onSubmit,
	isLoading,
	editData,
}: CreateMilestoneFormProps) {
	const t = useTranslations();

	const formatDateForInput = (date: Date | string | null | undefined) => {
		if (!date) return "";
		const d = typeof date === "string" ? new Date(date) : date;
		return d.toISOString().split("T")[0];
	};

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: editData
			? {
					title: editData.title,
					description: editData.description || "",
					plannedStart: formatDateForInput(editData.plannedStart),
					plannedEnd: formatDateForInput(editData.plannedEnd),
					isCritical: editData.isCritical,
				}
			: {
					title: "",
					description: "",
					plannedStart: "",
					plannedEnd: "",
					isCritical: false,
				},
	});

	const handleSubmit = form.handleSubmit((data) => {
		onSubmit(data);
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{editData
							? t("timeline.editMilestone")
							: t("timeline.createMilestone")}
					</DialogTitle>
					<DialogDescription>
						{editData
							? t("timeline.editMilestoneDescription")
							: t("timeline.createMilestoneDescription")}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="title">{t("timeline.form.title")}</Label>
						<Input
							id="title"
							{...form.register("title")}
							placeholder={t("timeline.form.titlePlaceholder")}
						/>
						{form.formState.errors.title && (
							<p className="text-sm text-destructive">
								{form.formState.errors.title.message}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">{t("timeline.form.description")}</Label>
						<Textarea
							id="description"
							{...form.register("description")}
							placeholder={t("timeline.form.descriptionPlaceholder")}
							rows={3}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="plannedStart">
								{t("timeline.form.plannedStart")}
							</Label>
							<Input
								id="plannedStart"
								type="date"
								{...form.register("plannedStart")}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="plannedEnd">{t("timeline.form.plannedEnd")}</Label>
							<Input
								id="plannedEnd"
								type="date"
								{...form.register("plannedEnd")}
							/>
						</div>
					</div>

					<div className="flex items-center justify-between">
						<Label htmlFor="isCritical" className="flex flex-col">
							<span>{t("timeline.form.isCritical")}</span>
							<span className="text-xs text-muted-foreground font-normal">
								{t("timeline.form.isCriticalDescription")}
							</span>
						</Label>
						<Switch
							id="isCritical"
							checked={form.watch("isCritical")}
							onCheckedChange={(checked) =>
								form.setValue("isCritical", checked)
							}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("common.cancel")}
						</Button>
						<Button type="submit" loading={isLoading}>
							{editData ? t("common.save") : t("timeline.form.create")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
