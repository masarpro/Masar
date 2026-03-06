"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
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
	Paperclip,
	Settings2,
	User,
	UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { type PendingFile, PendingFilesUpload } from "./PendingFilesUpload";

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
		expectedCloseDate: "",
	});

	const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
	const [isUploadingFiles, setIsUploadingFiles] = useState(false);

	const getUploadUrlMutation = useMutation(
		orpc.pricing.leads.files.getUploadUrl.mutationOptions({}),
	);

	const saveFileMutation = useMutation(
		orpc.pricing.leads.files.saveFile.mutationOptions({}),
	);

	const createMutation = useMutation(
		orpc.pricing.leads.create.mutationOptions({
			onSuccess: async (data) => {
				// Upload pending files after lead creation
				if (pendingFiles.length > 0) {
					setIsUploadingFiles(true);
					let uploadedCount = 0;
					for (const pf of pendingFiles) {
						try {
							const uploadData = await getUploadUrlMutation.mutateAsync({
								organizationId,
								leadId: data.id,
								fileName: pf.name,
								mimeType: pf.mimeType,
								fileSize: pf.size,
							});

							await fetch(uploadData.uploadUrl, {
								method: "PUT",
								body: pf.file,
								headers: { "Content-Type": pf.mimeType },
							});

							await saveFileMutation.mutateAsync({
								organizationId,
								leadId: data.id,
								name: pf.name,
								storagePath: uploadData.storagePath,
								fileSize: pf.size,
								mimeType: pf.mimeType,
								category: pf.category as any,
							});
							uploadedCount++;
						} catch (e) {
							console.error("Failed to upload file:", pf.name, e);
						}
					}
					setIsUploadingFiles(false);

					if (uploadedCount > 0) {
						toast.success(
							t("pricing.leads.messages.createSuccess") + ` (${uploadedCount} ${t("pricing.leads.detail.files")})`,
						);
					} else {
						toast.success(t("pricing.leads.messages.createSuccess"));
					}
				} else {
					toast.success(t("pricing.leads.messages.createSuccess"));
				}

				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.list.queryOptions({ input: { organizationId } }).queryKey,
				});
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.getStats.queryOptions({ input: { organizationId } }).queryKey,
				});
				router.push(`/app/${organizationSlug}/pricing/leads/${data.id}`);
			},
			onError: (error: any) => {
				const msg = error?.message || error?.data?.message;
				if (msg === "subscription_required" || msg?.includes("الخطة الاحترافية")) {
					toast.error("هذه الميزة متاحة في الخطة الاحترافية فقط");
				} else {
					toast.error(msg || t("pricing.leads.messages.createError"));
				}
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
			expectedCloseDate: formData.expectedCloseDate || undefined,
		});
	};

	const update = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const isSubmitting = createMutation.isPending || isUploadingFiles;

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
							onChange={(e) => update("name", e.target.value)}
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
								onChange={(e) => update("phone", e.target.value)}
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
								onChange={(e) => update("email", e.target.value)}
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
							onChange={(e) => update("company", e.target.value)}
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
							onValueChange={(v) => update("projectType", v === "none" ? "" : v)}
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
							onChange={(e) => update("projectLocation", e.target.value)}
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
									onChange={(e) => update("estimatedArea", e.target.value)}
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
									onChange={(e) => update("estimatedValue", e.target.value)}
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
							<Select value={formData.source} onValueChange={(v) => update("source", v)}>
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
							<Select value={formData.priority} onValueChange={(v) => update("priority", v)}>
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
								onValueChange={(v) => update("assignedToId", v === "none" ? "" : v)}
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
							onChange={(e) => update("expectedCloseDate", e.target.value)}
							className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
							dir="ltr"
						/>
					</div>

					<div>
						<Label htmlFor="notes" className="text-slate-700 dark:text-slate-300">{t("pricing.leads.form.notes")}</Label>
						<Textarea
							id="notes"
							value={formData.notes}
							onChange={(e) => update("notes", e.target.value)}
							placeholder={t("pricing.leads.form.notesPlaceholder")}
							className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 min-h-[80px]"
							rows={3}
						/>
					</div>
				</div>
			</div>

			{/* Section 4: Project Files (Optional) */}
			<div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
				<div className="h-1 w-full bg-amber-500" />
				<div className="p-6 space-y-4">
					<div className="flex items-center gap-3">
						<div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30">
							<Paperclip className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						</div>
						<div className="flex items-center gap-2">
							<div>
								<h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
									{t("pricing.leads.form.projectFiles")}
								</h3>
								<p className="text-xs text-slate-500 dark:text-slate-400">
									{t("pricing.leads.form.projectFilesDescription")}
								</p>
							</div>
							<Badge variant="secondary" className="text-[10px] h-5 shrink-0">
								{t("pricing.leads.form.optional")}
							</Badge>
						</div>
					</div>

					<PendingFilesUpload
						files={pendingFiles}
						onFilesChange={setPendingFiles}
					/>
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
					disabled={isSubmitting}
				>
					{isSubmitting && (
						<Loader2 className="me-2 h-4 w-4 animate-spin" />
					)}
					{isUploadingFiles
						? t("pricing.leads.form.uploadingFiles")
						: t("pricing.leads.form.submit")}
				</Button>
			</div>
		</form>
	);
}
