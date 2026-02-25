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
import { Switch } from "@ui/components/switch";
import {
	Building2,
	ChevronLeft,
	FileText,
	Layers,
	MapPin,
	Ruler,
	Sparkles,
	User,
	Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface CreateCostStudyFormProps {
	organizationId: string;
	organizationSlug: string;
}

const PROJECT_TYPES = [
	{ value: "residential", labelKey: "pricing.studies.projectTypes.residential", color: "bg-sky-500" },
	{ value: "commercial", labelKey: "pricing.studies.projectTypes.commercial", color: "bg-violet-500" },
	{ value: "industrial", labelKey: "pricing.studies.projectTypes.industrial", color: "bg-orange-500" },
	{ value: "warehouse", labelKey: "pricing.studies.projectTypes.warehouse", color: "bg-slate-500" },
	{ value: "mixed", labelKey: "pricing.studies.projectTypes.mixed", color: "bg-teal-500" },
];

const FINISHING_LEVELS = [
	{ value: "economic", labelKey: "pricing.studies.finishingLevels.economic" },
	{ value: "medium", labelKey: "pricing.studies.finishingLevels.medium" },
	{ value: "luxury", labelKey: "pricing.studies.finishingLevels.luxury" },
	{ value: "super_luxury", labelKey: "pricing.studies.finishingLevels.superLuxury" },
];

export function CreateCostStudyForm({
	organizationId,
	organizationSlug,
}: CreateCostStudyFormProps) {
	const t = useTranslations();
	const router = useRouter();

	const [formData, setFormData] = useState({
		name: "",
		customerName: "",
		projectType: "residential",
		landArea: "",
		buildingArea: "",
		numberOfFloors: "1",
		hasBasement: false,
		finishingLevel: "medium",
	});

	const createMutation = useMutation(
		orpc.pricing.studies.create.mutationOptions({
			onSuccess: (data) => {
				toast.success(t("pricing.studies.createSuccess"));
				router.push(`/app/${organizationSlug}/pricing/studies/${data.id}`);
			},
			onError: () => {
				toast.error(t("pricing.studies.createError"));
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const landArea = parseFloat(formData.landArea);
		const buildingArea = parseFloat(formData.buildingArea);
		const numberOfFloors = parseInt(formData.numberOfFloors, 10);

		if (isNaN(landArea) || landArea <= 0) {
			toast.error(t("pricing.studies.validation.landArea"));
			return;
		}

		if (isNaN(buildingArea) || buildingArea <= 0) {
			toast.error(t("pricing.studies.validation.buildingArea"));
			return;
		}

		if (isNaN(numberOfFloors) || numberOfFloors <= 0) {
			toast.error(t("pricing.studies.validation.numberOfFloors"));
			return;
		}

		createMutation.mutate({
			organizationId,
			name: formData.name || undefined,
			customerName: formData.customerName || undefined,
			projectType: formData.projectType,
			landArea,
			buildingArea,
			numberOfFloors,
			hasBasement: formData.hasBasement,
			finishingLevel: formData.finishingLevel,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
					<Link href={`/app/${organizationSlug}/pricing/studies`}>
						<ChevronLeft className="h-5 w-5 text-slate-500" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t("pricing.studies.newStudy")}</h1>
					<p className="text-slate-500 dark:text-slate-400">{t("pricing.studies.subtitle")}</p>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Basic Info Card */}
				<div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
					<div className="p-5 border-b border-slate-100 dark:border-slate-800">
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
								<FileText className="h-5 w-5 text-slate-600 dark:text-slate-300" />
							</div>
							<h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t("pricing.studies.form.basicInfo")}</h2>
						</div>
					</div>

					<div className="p-5 space-y-5">
						<div className="space-y-2">
							<Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("pricing.studies.form.name")}
							</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder={t("pricing.studies.form.namePlaceholder")}
								className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="customerName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("pricing.studies.form.customerName")}
							</Label>
							<Input
								id="customerName"
								value={formData.customerName}
								onChange={(e) =>
									setFormData({ ...formData, customerName: e.target.value })
								}
								placeholder={t("pricing.studies.form.customerNamePlaceholder")}
								className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="projectType" className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("pricing.studies.form.projectType")}
							</Label>
							<Select
								value={formData.projectType}
								onValueChange={(value) =>
									setFormData({ ...formData, projectType: value })
								}
							>
								<SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{PROJECT_TYPES.map((type) => (
										<SelectItem key={type.value} value={type.value} className="rounded-lg">
											<div className="flex items-center gap-2">
												<div className={`w-2 h-2 rounded-full ${type.color}`} />
												{t(type.labelKey)}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="finishingLevel" className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("pricing.studies.form.finishingLevel")}
							</Label>
							<Select
								value={formData.finishingLevel}
								onValueChange={(value) =>
									setFormData({ ...formData, finishingLevel: value })
								}
							>
								<SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{FINISHING_LEVELS.map((level) => (
										<SelectItem key={level.value} value={level.value} className="rounded-lg">
											{t(level.labelKey)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* Dimensions Card */}
				<div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
					<div className="p-5 border-b border-slate-100 dark:border-slate-800">
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
								<Ruler className="h-5 w-5 text-slate-600 dark:text-slate-300" />
							</div>
							<h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t("pricing.studies.form.dimensions")}</h2>
						</div>
					</div>

					<div className="p-5 space-y-5">
						<div className="space-y-2">
							<Label htmlFor="landArea" className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("pricing.studies.form.landArea")}
							</Label>
							<div className="relative">
								<Input
									id="landArea"
									type="number"
									step="0.01"
									min="0"
									value={formData.landArea}
									onChange={(e) =>
										setFormData({ ...formData, landArea: e.target.value })
									}
									placeholder="0.00"
									className="pl-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
									required
								/>
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">
									م²
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="buildingArea" className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("pricing.studies.form.buildingArea")}
							</Label>
							<div className="relative">
								<Input
									id="buildingArea"
									type="number"
									step="0.01"
									min="0"
									value={formData.buildingArea}
									onChange={(e) =>
										setFormData({ ...formData, buildingArea: e.target.value })
									}
									placeholder="0.00"
									className="pl-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
									required
								/>
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">
									م²
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="numberOfFloors" className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("pricing.studies.form.numberOfFloors")}
							</Label>
							<Input
								id="numberOfFloors"
								type="number"
								min="1"
								value={formData.numberOfFloors}
								onChange={(e) =>
									setFormData({ ...formData, numberOfFloors: e.target.value })
								}
								className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
								required
							/>
						</div>

						<div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
							<Label htmlFor="hasBasement" className="cursor-pointer text-slate-700 dark:text-slate-300">
								{t("pricing.studies.form.hasBasement")}
							</Label>
							<Switch
								id="hasBasement"
								checked={formData.hasBasement}
								onCheckedChange={(checked) =>
									setFormData({ ...formData, hasBasement: checked })
								}
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
					className="rounded-xl px-6 border-slate-200 dark:border-slate-700"
				>
					{t("common.cancel")}
				</Button>
				<Button
					type="submit"
					disabled={createMutation.isPending}
					className="rounded-xl px-8 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200"
				>
					{createMutation.isPending ? (
						<>
							<Loader2 className="ml-2 h-4 w-4 animate-spin" />
							{t("common.creating")}
						</>
					) : (
						t("pricing.studies.createStudy")
					)}
				</Button>
			</div>
		</form>
	);
}
