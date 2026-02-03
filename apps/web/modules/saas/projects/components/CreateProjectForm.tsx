"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
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
import {
	ChevronLeft,
	FileText,
	Calendar,
	Loader2,
	MapPin,
	User,
	Banknote,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface CreateProjectFormProps {
	organizationId: string;
	organizationSlug: string;
}

const PROJECT_TYPES = [
	{
		value: "RESIDENTIAL",
		labelKey: "projects.type.RESIDENTIAL",
		color: "bg-sky-500",
	},
	{
		value: "COMMERCIAL",
		labelKey: "projects.type.COMMERCIAL",
		color: "bg-violet-500",
	},
	{
		value: "INDUSTRIAL",
		labelKey: "projects.type.INDUSTRIAL",
		color: "bg-orange-500",
	},
	{
		value: "INFRASTRUCTURE",
		labelKey: "projects.type.INFRASTRUCTURE",
		color: "bg-slate-500",
	},
	{ value: "MIXED", labelKey: "projects.type.MIXED", color: "bg-teal-500" },
];

export function CreateProjectForm({
	organizationId,
	organizationSlug,
}: CreateProjectFormProps) {
	const t = useTranslations();
	const router = useRouter();

	const [formData, setFormData] = useState({
		name: "",
		clientName: "",
		location: "",
		contractValue: "",
		startDate: "",
		endDate: "",
		type: "",
		description: "",
	});

	const createMutation = useMutation(
		orpc.projects.create.mutationOptions({
			onSuccess: (data) => {
				toast.success(t("projects.createSuccess"));
				router.push(`/app/${organizationSlug}/projects/${data.id}`);
			},
			onError: () => {
				toast.error(t("projects.createError"));
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			toast.error(t("projects.validation.nameRequired"));
			return;
		}

		const contractValue = formData.contractValue
			? parseFloat(formData.contractValue)
			: undefined;

		createMutation.mutate({
			organizationId,
			name: formData.name,
			clientName: formData.clientName || undefined,
			location: formData.location || undefined,
			contractValue:
				contractValue && !isNaN(contractValue) ? contractValue : undefined,
			startDate: formData.startDate ? new Date(formData.startDate) : undefined,
			endDate: formData.endDate ? new Date(formData.endDate) : undefined,
			type: (formData.type as
				| "RESIDENTIAL"
				| "COMMERCIAL"
				| "INDUSTRIAL"
				| "INFRASTRUCTURE"
				| "MIXED") || undefined,
			description: formData.description || undefined,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					asChild
					className="shrink-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
				>
					<Link href={`/app/${organizationSlug}/projects`}>
						<ChevronLeft className="h-5 w-5 text-slate-500" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
						{t("projects.newProject")}
					</h1>
					<p className="text-slate-500 dark:text-slate-400">
						{t("projects.newProjectSubtitle")}
					</p>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Basic Info Card */}
				<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
					<div className="border-b border-slate-100 p-5 dark:border-slate-800">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800">
								<FileText className="h-5 w-5 text-slate-600 dark:text-slate-300" />
							</div>
							<h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
								{t("projects.form.name")}
							</h2>
						</div>
					</div>

					<div className="space-y-5 p-5">
						<div className="space-y-2">
							<Label
								htmlFor="name"
								className="text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								{t("projects.form.name")} *
							</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder={t("projects.form.namePlaceholder")}
								className="rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="clientName"
								className="text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								<User className="mb-0.5 inline h-4 w-4 me-1" />
								{t("projects.form.clientName")}
							</Label>
							<Input
								id="clientName"
								value={formData.clientName}
								onChange={(e) =>
									setFormData({ ...formData, clientName: e.target.value })
								}
								placeholder={t("projects.form.clientNamePlaceholder")}
								className="rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="location"
								className="text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								<MapPin className="mb-0.5 inline h-4 w-4 me-1" />
								{t("projects.form.location")}
							</Label>
							<Input
								id="location"
								value={formData.location}
								onChange={(e) =>
									setFormData({ ...formData, location: e.target.value })
								}
								placeholder={t("projects.form.locationPlaceholder")}
								className="rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="type"
								className="text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								{t("projects.form.type")}
							</Label>
							<Select
								value={formData.type}
								onValueChange={(value) =>
									setFormData({ ...formData, type: value })
								}
							>
								<SelectTrigger className="rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
									<SelectValue placeholder={t("projects.form.typePlaceholder")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{PROJECT_TYPES.map((type) => (
										<SelectItem
											key={type.value}
											value={type.value}
											className="rounded-lg"
										>
											<div className="flex items-center gap-2">
												<div className={`h-2 w-2 rounded-full ${type.color}`} />
												{t(type.labelKey)}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* Financial & Timeline Card */}
				<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
					<div className="border-b border-slate-100 p-5 dark:border-slate-800">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800">
								<Calendar className="h-5 w-5 text-slate-600 dark:text-slate-300" />
							</div>
							<h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
								{t("projects.overview.contractValue")}
							</h2>
						</div>
					</div>

					<div className="space-y-5 p-5">
						<div className="space-y-2">
							<Label
								htmlFor="contractValue"
								className="text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								<Banknote className="mb-0.5 inline h-4 w-4 me-1" />
								{t("projects.form.contractValue")}
							</Label>
							<div className="relative">
								<Input
									id="contractValue"
									type="number"
									step="0.01"
									min="0"
									value={formData.contractValue}
									onChange={(e) =>
										setFormData({ ...formData, contractValue: e.target.value })
									}
									placeholder="0.00"
									className="rounded-xl border-slate-200 bg-slate-50 pl-12 dark:border-slate-700 dark:bg-slate-800/50"
								/>
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
									ر.س
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="startDate"
								className="text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								{t("projects.form.startDate")}
							</Label>
							<Input
								id="startDate"
								type="date"
								value={formData.startDate}
								onChange={(e) =>
									setFormData({ ...formData, startDate: e.target.value })
								}
								className="rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="endDate"
								className="text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								{t("projects.form.endDate")}
							</Label>
							<Input
								id="endDate"
								type="date"
								value={formData.endDate}
								onChange={(e) =>
									setFormData({ ...formData, endDate: e.target.value })
								}
								className="rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="description"
								className="text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								{t("projects.form.description")}
							</Label>
							<textarea
								id="description"
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								placeholder={t("projects.form.descriptionPlaceholder")}
								rows={3}
								className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Submit Buttons */}
			<div className="flex justify-end gap-3 pt-2">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.back()}
					className="rounded-xl border-slate-200 px-6 dark:border-slate-700"
				>
					{t("projects.form.cancel")}
				</Button>
				<Button
					type="submit"
					disabled={createMutation.isPending}
					className="rounded-xl bg-slate-900 px-8 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
				>
					{createMutation.isPending ? (
						<>
							<Loader2 className="ml-2 h-4 w-4 animate-spin" />
							{t("common.creating")}
						</>
					) : (
						t("projects.form.submit")
					)}
				</Button>
			</div>
		</form>
	);
}
