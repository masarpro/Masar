"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
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
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface CreateCostStudyDialogProps {
	organizationId: string;
	organizationSlug: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const PROJECT_TYPES = [
	{ value: "residential", labelKey: "pricing.studies.projectTypes.residential", color: "bg-sky-500" },
	{ value: "commercial", labelKey: "pricing.studies.projectTypes.commercial", color: "bg-violet-500" },
	{ value: "industrial", labelKey: "pricing.studies.projectTypes.industrial", color: "bg-orange-500" },
	{ value: "warehouse", labelKey: "pricing.studies.projectTypes.warehouse", color: "bg-slate-500" },
	{ value: "mixed", labelKey: "pricing.studies.projectTypes.mixed", color: "bg-sky-500" },
];

export function CreateCostStudyDialog({
	organizationId,
	organizationSlug,
	open,
	onOpenChange,
}: CreateCostStudyDialogProps) {
	const t = useTranslations();
	const router = useRouter();

	const [formData, setFormData] = useState({
		name: "",
		customerName: "",
		projectType: "residential",
		studyType: "FULL_PROJECT" as "FULL_PROJECT" | "CUSTOM_ITEMS" | "LUMP_SUM_ANALYSIS",
		contractValue: "",
	});

	const createMutation = useMutation(
		orpc.pricing.studies.create.mutationOptions({
			onSuccess: (data) => {
				toast.success(t("pricing.studies.createSuccess"));
				onOpenChange(false);
				router.push(`/app/${organizationSlug}/pricing/studies/${data.id}`);
			},
			onError: () => {
				toast.error(t("pricing.studies.createError"));
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		createMutation.mutate({
			organizationId,
			name: formData.name || undefined,
			customerName: formData.customerName || undefined,
			projectType: formData.projectType,
			studyType: formData.studyType,
			...(formData.contractValue ? { contractValue: Number(formData.contractValue) } : {}),
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="rounded-2xl sm:max-w-md">
				<DialogHeader className="text-right">
					<DialogTitle>{t("pricing.studies.newStudy")}</DialogTitle>
					<DialogDescription>{t("pricing.studies.subtitle")}</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-5">
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
						<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
							{t("pricing.studies.form.studyType")}
						</Label>
						<Select
							value={formData.studyType}
							onValueChange={(value) =>
								setFormData({ ...formData, studyType: value as typeof formData.studyType })
							}
						>
							<SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="FULL_PROJECT" className="rounded-lg">{t("pricing.studies.studyTypes.fullProject")}</SelectItem>
								<SelectItem value="CUSTOM_ITEMS" className="rounded-lg">{t("pricing.studies.studyTypes.customItems")}</SelectItem>
								<SelectItem value="LUMP_SUM_ANALYSIS" className="rounded-lg">{t("pricing.studies.studyTypes.lumpSumAnalysis")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{formData.studyType === "LUMP_SUM_ANALYSIS" && (
						<div className="space-y-2">
							<Label htmlFor="contractValue" className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("pricing.studies.form.contractValue")}
							</Label>
							<Input
								id="contractValue"
								type="number"
								value={formData.contractValue}
								onChange={(e) =>
									setFormData({ ...formData, contractValue: e.target.value })
								}
								placeholder={t("pricing.studies.form.contractValuePlaceholder")}
								className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
								dir="ltr"
							/>
						</div>
					)}

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

					<DialogFooter className="gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
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
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Keep backward-compatible export name
export const CreateCostStudyForm = CreateCostStudyDialog;
