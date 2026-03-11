"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
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
import {
	Banknote,
	Building2,
	CalendarDays,
	FolderKanban,
	Loader2,
	MapPin,
	Phone,
	Mail,
	Settings2,
	User,
	UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface EditLeadFormProps {
	organizationId: string;
	organizationSlug: string;
	members: Array<{ id: string; name: string; image?: string | null }>;
	lead: {
		id: string;
		name: string;
		phone?: string | null;
		email?: string | null;
		company?: string | null;
		clientType: string;
		projectType?: string | null;
		projectLocation?: string | null;
		estimatedArea?: number | null;
		estimatedValue?: number | null;
		source: string;
		priority: string;
		assignedToId?: string | null;
		notes?: string | null;
		expectedCloseDate?: string | Date | null;
	};
}

const PROJECT_TYPES = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "INFRASTRUCTURE", "MIXED"] as const;
const SOURCES = ["REFERRAL", "SOCIAL_MEDIA", "WEBSITE", "DIRECT", "EXHIBITION", "OTHER"] as const;
const PRIORITIES = ["NORMAL", "HIGH", "URGENT"] as const;

export function EditLeadForm({ organizationId, organizationSlug, members, lead }: EditLeadFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState({
		name: lead.name,
		phone: lead.phone || "",
		email: lead.email || "",
		company: lead.company || "",
		clientType: lead.clientType as "INDIVIDUAL" | "COMMERCIAL",
		projectType: lead.projectType || "",
		projectLocation: lead.projectLocation || "",
		estimatedArea: lead.estimatedArea?.toString() || "",
		estimatedValue: lead.estimatedValue?.toString() || "",
		source: lead.source,
		priority: lead.priority,
		assignedToId: lead.assignedToId || "",
		notes: lead.notes || "",
		expectedCloseDate: lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toISOString().split("T")[0] : "",
	});

	const updateMutation = useMutation(
		orpc.pricing.leads.update.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.leads.detail.updateSuccess"));
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.getById.queryOptions({ input: { organizationId, leadId: lead.id } }).queryKey,
				});
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.list.queryOptions({ input: { organizationId } }).queryKey,
				});
				router.push(`/app/${organizationSlug}/pricing/leads/${lead.id}`);
			},
			onError: () => {
				toast.error(t("pricing.leads.detail.updateError"));
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) {
			toast.error(t("pricing.leads.form.name") + " — مطلوب");
			return;
		}

		(updateMutation as any).mutate({
			organizationId,
			leadId: lead.id,
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
			assignedToId: formData.assignedToId || null,
			notes: formData.notes || undefined,
			expectedCloseDate: formData.expectedCloseDate || null,
		});
	};

	const update = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
			{/* Section 1: Client Information */}
			<div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
				<div className="h-1 w-full bg-blue-500" />
				<div className="p-6 space-y-5">
					<div className="flex items-center gap-3">
						<div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30">
							<User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
								{t("pricing.leads.form.clientInfo")}
							</h3>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								{t("pricing.leads.form.clientInfoDescription")}
							</p>
						</div>
					</div>

					<div>
						<Label htmlFor="name" className="text-slate-700 dark:text-slate-300">{t("pricing.leads.form.name")} *</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e: any) => update("name", e.target.value)}
							placeholder={t("pricing.leads.form.namePlaceholder")}
							className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
							required
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">
								<span className="inline-flex items-center gap-1.5">
									<Phone className="h-3.5 w-3.5 text-slate-400" />
									{t("pricing.leads.form.phone")}
								</span>
							</Label>
							<Input
								id="phone"
								value={formData.phone}
								onChange={(e: any) => update("phone", e.target.value)}
								placeholder={t("pricing.leads.form.phonePlaceholder")}
								className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
								dir="ltr"
							/>
						</div>
						<div>
							<Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
								<span className="inline-flex items-center gap-1.5">
									<Mail className="h-3.5 w-3.5 text-slate-400" />
									{t("pricing.leads.form.email")}
								</span>
							</Label>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e: any) => update("email", e.target.value)}
								placeholder={t("pricing.leads.form.emailPlaceholder")}
								className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
								dir="ltr"
							/>
						</div>
					</div>

					<div>
						<Label htmlFor="company" className="text-slate-700 dark:text-slate-300">
							<span className="inline-flex items-center gap-1.5">
								<Building2 className="h-3.5 w-3.5 text-slate-400" />
								{t("pricing.leads.form.company")}
							</span>
						</Label>
						<Input
							id="company"
							value={formData.company}
							onChange={(e: any) => update("company", e.target.value)}
							placeholder={t("pricing.leads.form.companyPlaceholder")}
							className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
						/>
					</div>

					<div>
						<Label className="text-slate-700 dark:text-slate-300">{t("pricing.leads.form.clientType")}</Label>
						<div className="mt-2 flex gap-3">
							<button
								type="button"
								onClick={() => update("clientType", "INDIVIDUAL")}
								className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 py-3 px-4 text-sm font-medium transition-all duration-200 ${
									formData.clientType === "INDIVIDUAL"
										? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
										: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
								}`}
							>
								<User className="h-4 w-4" />
								{t("pricing.leads.clientType.INDIVIDUAL")}
							</button>
							<button
								type="button"
								onClick={() => update("clientType", "COMMERCIAL")}
								className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 py-3 px-4 text-sm font-medium transition-all duration-200 ${
									formData.clientType === "COMMERCIAL"
										? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400"
										: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
								}`}
							>
								<Building2 className="h-4 w-4" />
								{t("pricing.leads.clientType.COMMERCIAL")}
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Section 2: Project Details */}
			<div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
				<div className="h-1 w-full bg-violet-500" />
				<div className="p-6 space-y-5">
					<div className="flex items-center gap-3">
						<div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30">
							<FolderKanban className="h-5 w-5 text-violet-600 dark:text-violet-400" />
						</div>
						<div>
							<h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
								{t("pricing.leads.form.projectInfo")}
							</h3>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								{t("pricing.leads.form.projectInfoDescription")}
							</p>
						</div>
					</div>

					<div>
						<Label className="text-slate-700 dark:text-slate-300">{t("pricing.leads.form.projectType")}</Label>
						<Select
							value={formData.projectType || "none"}
							onValueChange={(v: any) => update("projectType", v === "none" ? "" : v)}
						>
							<SelectTrigger className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
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
						<Label htmlFor="projectLocation" className="text-slate-700 dark:text-slate-300">
							<span className="inline-flex items-center gap-1.5">
								<MapPin className="h-3.5 w-3.5 text-slate-400" />
								{t("pricing.leads.form.projectLocation")}
							</span>
						</Label>
						<Input
							id="projectLocation"
							value={formData.projectLocation}
							onChange={(e: any) => update("projectLocation", e.target.value)}
							placeholder={t("pricing.leads.form.projectLocationPlaceholder")}
							className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<Label htmlFor="estimatedArea" className="text-slate-700 dark:text-slate-300">
								{t("pricing.leads.form.estimatedArea")}
							</Label>
							<div className="relative mt-1.5">
								<Input
									id="estimatedArea"
									type="number"
									min="0"
									step="any"
									value={formData.estimatedArea}
									onChange={(e: any) => update("estimatedArea", e.target.value)}
									className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 pe-12"
									dir="ltr"
								/>
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">م²</span>
							</div>
						</div>
						<div>
							<Label htmlFor="estimatedValue" className="text-slate-700 dark:text-slate-300">
								<span className="inline-flex items-center gap-1.5">
									<Banknote className="h-3.5 w-3.5 text-slate-400" />
									{t("pricing.leads.form.estimatedValue")}
								</span>
							</Label>
							<div className="relative mt-1.5">
								<Input
									id="estimatedValue"
									type="number"
									min="0"
									step="any"
									value={formData.estimatedValue}
									onChange={(e: any) => update("estimatedValue", e.target.value)}
									className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 pe-12"
									dir="ltr"
								/>
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">ر.س</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Section 3: Management Settings */}
			<div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
				<div className="h-1 w-full bg-sky-500" />
				<div className="p-6 space-y-5">
					<div className="flex items-center gap-3">
						<div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30">
							<Settings2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
						</div>
						<div>
							<h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
								{t("pricing.leads.form.managementInfo")}
							</h3>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								{t("pricing.leads.form.managementInfoDescription")}
							</p>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-3">
						<div>
							<Label className="text-slate-700 dark:text-slate-300">{t("pricing.leads.form.source")}</Label>
							<Select value={formData.source} onValueChange={(v: any) => update("source", v)}>
								<SelectTrigger className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
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
							<Label className="text-slate-700 dark:text-slate-300">{t("pricing.leads.form.priority")}</Label>
							<Select value={formData.priority} onValueChange={(v: any) => update("priority", v)}>
								<SelectTrigger className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
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
							<Label className="text-slate-700 dark:text-slate-300">
								<span className="inline-flex items-center gap-1.5">
									<UserPlus className="h-3.5 w-3.5 text-slate-400" />
									{t("pricing.leads.form.assignedTo")}
								</span>
							</Label>
							<Select
								value={formData.assignedToId || "none"}
								onValueChange={(v: any) => update("assignedToId", v === "none" ? "" : v)}
							>
								<SelectTrigger className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
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
						<Label htmlFor="expectedCloseDate" className="text-slate-700 dark:text-slate-300">
							<span className="inline-flex items-center gap-1.5">
								<CalendarDays className="h-3.5 w-3.5 text-slate-400" />
								{t("pricing.leads.form.expectedCloseDate")}
							</span>
						</Label>
						<Input
							id="expectedCloseDate"
							type="date"
							value={formData.expectedCloseDate}
							onChange={(e: any) => update("expectedCloseDate", e.target.value)}
							className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
							dir="ltr"
						/>
					</div>

					<div>
						<Label htmlFor="notes" className="text-slate-700 dark:text-slate-300">{t("pricing.leads.form.notes")}</Label>
						<Textarea
							id="notes"
							value={formData.notes}
							onChange={(e: any) => update("notes", e.target.value)}
							placeholder={t("pricing.leads.form.notesPlaceholder")}
							className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 min-h-[80px]"
							rows={3}
						/>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className="flex items-center justify-end gap-3 pt-2">
				<Button
					type="button"
					variant="outline"
					className="rounded-xl border-slate-200 dark:border-slate-700"
					onClick={() => router.back()}
				>
					{t("pricing.leads.form.cancel")}
				</Button>
				<Button
					type="submit"
					className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
					disabled={updateMutation.isPending}
				>
					{updateMutation.isPending && (
						<Loader2 className="me-2 h-4 w-4 animate-spin" />
					)}
					{t("pricing.leads.detail.saveChanges")}
				</Button>
			</div>
		</form>
	);
}
