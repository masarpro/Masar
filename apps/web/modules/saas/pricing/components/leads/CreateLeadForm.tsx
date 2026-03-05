"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
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
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface CreateLeadFormProps {
	organizationId: string;
	organizationSlug: string;
	members: Array<{ id: string; name: string; image?: string | null }>;
}

const PROJECT_TYPES = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "INFRASTRUCTURE", "MIXED"] as const;
const SOURCES = ["REFERRAL", "SOCIAL_MEDIA", "WEBSITE", "DIRECT", "EXHIBITION", "OTHER"] as const;
const PRIORITIES = ["NORMAL", "HIGH", "URGENT"] as const;

export function CreateLeadForm({ organizationId, organizationSlug, members }: CreateLeadFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState({
		name: "",
		phone: "",
		email: "",
		company: "",
		clientType: "INDIVIDUAL" as "INDIVIDUAL" | "COMMERCIAL",
		projectType: "" as string,
		projectLocation: "",
		estimatedArea: "",
		estimatedValue: "",
		source: "DIRECT" as string,
		priority: "NORMAL" as string,
		assignedToId: "" as string,
		notes: "",
	});

	const createMutation = useMutation(
		orpc.pricing.leads.create.mutationOptions({
			onSuccess: (data) => {
				toast.success(t("pricing.leads.messages.createSuccess"));
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.list.queryOptions({ input: { organizationId } }).queryKey,
				});
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.getStats.queryOptions({ input: { organizationId } }).queryKey,
				});
				router.push(`/app/${organizationSlug}/pricing/leads/${data.id}`);
			},
			onError: () => {
				toast.error(t("pricing.leads.messages.createError"));
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			toast.error(t("pricing.leads.form.name") + " — مطلوب");
			return;
		}

		createMutation.mutate({
			organizationId,
			name: formData.name.trim(),
			phone: formData.phone || undefined,
			email: formData.email || undefined,
			company: formData.company || undefined,
			clientType: formData.clientType,
			projectType: (formData.projectType || undefined) as any,
			projectLocation: formData.projectLocation || undefined,
			estimatedArea: formData.estimatedArea ? Number(formData.estimatedArea) : undefined,
			estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : undefined,
			source: formData.source as any,
			priority: formData.priority as any,
			assignedToId: formData.assignedToId || undefined,
			notes: formData.notes || undefined,
		});
	};

	const update = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Client Information */}
			<Card className="rounded-2xl">
				<CardContent className="p-6 space-y-4">
					<h3 className="text-base font-semibold text-foreground">
						{t("pricing.leads.form.clientInfo")}
					</h3>

					<div>
						<Label htmlFor="name">{t("pricing.leads.form.name")} *</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) => update("name", e.target.value)}
							placeholder={t("pricing.leads.form.namePlaceholder")}
							className="mt-1.5 rounded-xl"
							required
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<Label htmlFor="phone">{t("pricing.leads.form.phone")}</Label>
							<Input
								id="phone"
								value={formData.phone}
								onChange={(e) => update("phone", e.target.value)}
								placeholder={t("pricing.leads.form.phonePlaceholder")}
								className="mt-1.5 rounded-xl"
								dir="ltr"
							/>
						</div>
						<div>
							<Label htmlFor="email">{t("pricing.leads.form.email")}</Label>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e) => update("email", e.target.value)}
								placeholder={t("pricing.leads.form.emailPlaceholder")}
								className="mt-1.5 rounded-xl"
								dir="ltr"
							/>
						</div>
					</div>

					<div>
						<Label htmlFor="company">{t("pricing.leads.form.company")}</Label>
						<Input
							id="company"
							value={formData.company}
							onChange={(e) => update("company", e.target.value)}
							placeholder={t("pricing.leads.form.companyPlaceholder")}
							className="mt-1.5 rounded-xl"
						/>
					</div>

					<div>
						<Label>{t("pricing.leads.form.clientType")}</Label>
						<div className="mt-1.5 flex gap-4">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name="clientType"
									value="INDIVIDUAL"
									checked={formData.clientType === "INDIVIDUAL"}
									onChange={(e) => update("clientType", e.target.value)}
									className="accent-primary"
								/>
								<span className="text-sm">{t("pricing.leads.clientType.INDIVIDUAL")}</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name="clientType"
									value="COMMERCIAL"
									checked={formData.clientType === "COMMERCIAL"}
									onChange={(e) => update("clientType", e.target.value)}
									className="accent-primary"
								/>
								<span className="text-sm">{t("pricing.leads.clientType.COMMERCIAL")}</span>
							</label>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Project Details */}
			<Card className="rounded-2xl">
				<CardContent className="p-6 space-y-4">
					<h3 className="text-base font-semibold text-foreground">
						{t("pricing.leads.form.projectInfo")}
					</h3>

					<div>
						<Label>{t("pricing.leads.form.projectType")}</Label>
						<Select
							value={formData.projectType || "none"}
							onValueChange={(v) => update("projectType", v === "none" ? "" : v)}
						>
							<SelectTrigger className="mt-1.5 rounded-xl">
								<SelectValue placeholder={t("pricing.leads.form.selectProjectType")} />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="none">{t("pricing.leads.form.selectProjectType")}</SelectItem>
								{PROJECT_TYPES.map((pt) => (
									<SelectItem key={pt} value={pt}>
										{t(`pricing.leads.projectType.${pt}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label htmlFor="projectLocation">{t("pricing.leads.form.projectLocation")}</Label>
						<Input
							id="projectLocation"
							value={formData.projectLocation}
							onChange={(e) => update("projectLocation", e.target.value)}
							placeholder={t("pricing.leads.form.projectLocationPlaceholder")}
							className="mt-1.5 rounded-xl"
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<Label htmlFor="estimatedArea">{t("pricing.leads.form.estimatedArea")}</Label>
							<Input
								id="estimatedArea"
								type="number"
								min="0"
								step="any"
								value={formData.estimatedArea}
								onChange={(e) => update("estimatedArea", e.target.value)}
								className="mt-1.5 rounded-xl"
								dir="ltr"
							/>
						</div>
						<div>
							<Label htmlFor="estimatedValue">{t("pricing.leads.form.estimatedValue")}</Label>
							<Input
								id="estimatedValue"
								type="number"
								min="0"
								step="any"
								value={formData.estimatedValue}
								onChange={(e) => update("estimatedValue", e.target.value)}
								className="mt-1.5 rounded-xl"
								dir="ltr"
							/>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-3">
						<div>
							<Label>{t("pricing.leads.form.source")}</Label>
							<Select value={formData.source} onValueChange={(v) => update("source", v)}>
								<SelectTrigger className="mt-1.5 rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{SOURCES.map((s) => (
										<SelectItem key={s} value={s}>
											{t(`pricing.leads.source.${s}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("pricing.leads.form.priority")}</Label>
							<Select value={formData.priority} onValueChange={(v) => update("priority", v)}>
								<SelectTrigger className="mt-1.5 rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{PRIORITIES.map((p) => (
										<SelectItem key={p} value={p}>
											{t(`pricing.leads.priority.${p}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("pricing.leads.form.assignedTo")}</Label>
							<Select
								value={formData.assignedToId || "none"}
								onValueChange={(v) => update("assignedToId", v === "none" ? "" : v)}
							>
								<SelectTrigger className="mt-1.5 rounded-xl">
									<SelectValue placeholder={t("pricing.leads.form.selectAssignee")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="none">{t("pricing.leads.form.noAssignee")}</SelectItem>
									{members.map((m) => (
										<SelectItem key={m.id} value={m.id}>
											{m.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div>
						<Label htmlFor="notes">{t("pricing.leads.form.notes")}</Label>
						<Textarea
							id="notes"
							value={formData.notes}
							onChange={(e) => update("notes", e.target.value)}
							placeholder={t("pricing.leads.form.notesPlaceholder")}
							className="mt-1.5 rounded-xl"
							rows={3}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Actions */}
			<div className="flex items-center justify-end gap-3">
				<Button
					type="button"
					variant="outline"
					className="rounded-xl"
					onClick={() => router.back()}
				>
					{t("pricing.leads.form.cancel")}
				</Button>
				<Button
					type="submit"
					className="rounded-xl"
					disabled={createMutation.isPending}
				>
					{createMutation.isPending && (
						<Loader2 className="me-2 h-4 w-4 animate-spin" />
					)}
					{t("pricing.leads.form.submit")}
				</Button>
			</div>
		</form>
	);
}
