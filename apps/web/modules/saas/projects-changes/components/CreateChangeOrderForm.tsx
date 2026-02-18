"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useQuery } from "@tanstack/react-query";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

type ChangeOrderCategory =
	| "SCOPE_CHANGE"
	| "CLIENT_REQUEST"
	| "SITE_CONDITION"
	| "DESIGN_CHANGE"
	| "MATERIAL_CHANGE"
	| "REGULATORY"
	| "OTHER";

interface CreateChangeOrderFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projectId: string;
	onSubmit: (data: {
		title: string;
		description?: string;
		category?: ChangeOrderCategory;
		costImpact?: number;
		timeImpactDays?: number;
		milestoneId?: string;
	}) => void;
	isLoading?: boolean;
	editData?: {
		id: string;
		title: string;
		description?: string | null;
		category: ChangeOrderCategory;
		costImpact?: string | null;
		timeImpactDays?: number | null;
		milestoneId?: string | null;
	} | null;
}

export function CreateChangeOrderForm({
	open,
	onOpenChange,
	projectId,
	onSubmit,
	isLoading,
	editData,
}: CreateChangeOrderFormProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const isEditing = !!editData;

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState<ChangeOrderCategory>("OTHER");
	const [costImpact, setCostImpact] = useState("");
	const [timeImpactDays, setTimeImpactDays] = useState("");
	const [milestoneId, setMilestoneId] = useState<string>("none");

	// Reset form when dialog opens/closes or edit data changes
	useEffect(() => {
		if (open && editData) {
			setTitle(editData.title);
			setDescription(editData.description ?? "");
			setCategory(editData.category);
			setCostImpact(editData.costImpact ?? "");
			setTimeImpactDays(
				editData.timeImpactDays !== null && editData.timeImpactDays !== undefined
					? String(editData.timeImpactDays)
					: "",
			);
			setMilestoneId(editData.milestoneId ?? "none");
		} else if (open && !editData) {
			setTitle("");
			setDescription("");
			setCategory("OTHER");
			setCostImpact("");
			setTimeImpactDays("");
			setMilestoneId("");
		}
	}, [open, editData]);

	// Fetch milestones for linking
	const { data: milestonesData } = useQuery({
		queryKey: ["project-timeline", activeOrganization?.id, projectId],
		queryFn: async () => {
			if (!activeOrganization?.id) return null;
			return apiClient.projectTimeline.listMilestones({
				organizationId: activeOrganization.id,
				projectId,
			});
		},
		enabled: !!activeOrganization?.id && open,
	});

	const milestones = milestonesData?.milestones ?? [];

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!title.trim()) return;

		onSubmit({
			title: title.trim(),
			description: description.trim() || undefined,
			category,
			costImpact: costImpact ? Number.parseFloat(costImpact) : undefined,
			timeImpactDays: timeImpactDays
				? Number.parseInt(timeImpactDays, 10)
				: undefined,
			milestoneId: milestoneId === "none" ? undefined : milestoneId,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{isEditing
							? t("changeOrders.form.editTitle")
							: t("changeOrders.form.createTitle")}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? t("changeOrders.form.editDescription")
							: t("changeOrders.form.createDescription")}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="title">{t("changeOrders.fields.title")} *</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t("changeOrders.form.titlePlaceholder")}
							maxLength={200}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="category">{t("changeOrders.fields.category")}</Label>
						<Select
							value={category}
							onValueChange={(value) => setCategory(value as ChangeOrderCategory)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="SCOPE_CHANGE">
									{t("changeOrders.category.SCOPE_CHANGE")}
								</SelectItem>
								<SelectItem value="CLIENT_REQUEST">
									{t("changeOrders.category.CLIENT_REQUEST")}
								</SelectItem>
								<SelectItem value="SITE_CONDITION">
									{t("changeOrders.category.SITE_CONDITION")}
								</SelectItem>
								<SelectItem value="DESIGN_CHANGE">
									{t("changeOrders.category.DESIGN_CHANGE")}
								</SelectItem>
								<SelectItem value="MATERIAL_CHANGE">
									{t("changeOrders.category.MATERIAL_CHANGE")}
								</SelectItem>
								<SelectItem value="REGULATORY">
									{t("changeOrders.category.REGULATORY")}
								</SelectItem>
								<SelectItem value="OTHER">
									{t("changeOrders.category.OTHER")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">{t("changeOrders.fields.description")}</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t("changeOrders.form.descriptionPlaceholder")}
							rows={3}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="costImpact">
								{t("changeOrders.fields.costImpact")} (SAR)
							</Label>
							<Input
								id="costImpact"
								type="number"
								value={costImpact}
								onChange={(e) => setCostImpact(e.target.value)}
								placeholder="0"
								step="any"
							/>
							<p className="text-xs text-slate-500">
								{t("changeOrders.form.costImpactHint")}
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="timeImpactDays">
								{t("changeOrders.fields.timeImpact")}
							</Label>
							<Input
								id="timeImpactDays"
								type="number"
								value={timeImpactDays}
								onChange={(e) => setTimeImpactDays(e.target.value)}
								placeholder="0"
								min={-365}
								max={365}
							/>
							<p className="text-xs text-slate-500">
								{t("changeOrders.form.timeImpactHint")}
							</p>
						</div>
					</div>

					{milestones.length > 0 && (
						<div className="space-y-2">
							<Label htmlFor="milestone">
								{t("changeOrders.fields.linkedMilestone")}
							</Label>
							<Select value={milestoneId} onValueChange={setMilestoneId}>
								<SelectTrigger>
									<SelectValue placeholder={t("changeOrders.form.selectMilestone")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">
										{t("changeOrders.form.noMilestone")}
									</SelectItem>
									{milestones.map((m: { id: string; title: string }) => (
										<SelectItem key={m.id} value={m.id}>
											{m.title}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("common.cancel")}
						</Button>
						<Button type="submit" disabled={isLoading || !title.trim()}>
							{isLoading
								? t("common.saving")
								: isEditing
									? t("common.save")
									: t("changeOrders.form.submit")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
