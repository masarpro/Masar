"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface PlanConfigData {
	id: string;
	plan: "FREE" | "PRO";
	name: { en: string; ar: string };
	maxUsers: number;
	maxProjects: number;
	maxStorageGB: number;
	monthlyPrice: number;
	yearlyPrice: number;
	features: { en: string[]; ar: string[] };
	isActive: boolean;
}

export function EditPlanDialog({
	open,
	onOpenChange,
	planConfig,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	planConfig: PlanConfigData;
}) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const name = planConfig.name as { en: string; ar: string };
	const features = planConfig.features as { en: string[]; ar: string[] };

	const [nameEn, setNameEn] = useState(name.en);
	const [nameAr, setNameAr] = useState(name.ar);
	const [maxUsers, setMaxUsers] = useState(planConfig.maxUsers);
	const [maxProjects, setMaxProjects] = useState(planConfig.maxProjects);
	const [maxStorageGB, setMaxStorageGB] = useState(planConfig.maxStorageGB);
	const [monthlyPrice, setMonthlyPrice] = useState(planConfig.monthlyPrice);
	const [yearlyPrice, setYearlyPrice] = useState(planConfig.yearlyPrice);
	const [featuresEn, setFeaturesEn] = useState<string[]>(features.en);
	const [featuresAr, setFeaturesAr] = useState<string[]>(features.ar);

	const mutation = useMutation({
		mutationFn: () =>
			orpc.superAdmin.plans.update.call({
				plan: planConfig.plan,
				name: { en: nameEn, ar: nameAr },
				maxUsers,
				maxProjects,
				maxStorageGB,
				monthlyPrice,
				yearlyPrice,
				features: { en: featuresEn, ar: featuresAr },
			}),
		onSuccess: () => {
			toast.success(t("admin.plans.planUpdated"));
			queryClient.invalidateQueries({
				queryKey: orpc.superAdmin.plans.list.key(),
			});
			onOpenChange(false);
		},
		onError: () => {
			toast.error(t("admin.plans.planUpdateFailed"));
		},
	});

	const addFeature = () => {
		setFeaturesEn([...featuresEn, ""]);
		setFeaturesAr([...featuresAr, ""]);
	};

	const removeFeature = (index: number) => {
		setFeaturesEn(featuresEn.filter((_, i) => i !== index));
		setFeaturesAr(featuresAr.filter((_, i) => i !== index));
	};

	const updateFeatureEn = (index: number, value: string) => {
		const updated = [...featuresEn];
		updated[index] = value;
		setFeaturesEn(updated);
	};

	const updateFeatureAr = (index: number, value: string) => {
		const updated = [...featuresAr];
		updated[index] = value;
		setFeaturesAr(updated);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{t("admin.plans.editPlan")} — {planConfig.plan}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label>{t("admin.plans.nameEn")}</Label>
							<Input
								value={nameEn}
								onChange={(e) => setNameEn(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("admin.plans.nameAr")}</Label>
							<Input
								value={nameAr}
								onChange={(e) => setNameAr(e.target.value)}
								dir="rtl"
							/>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-3">
						<div className="space-y-2">
							<Label>{t("admin.plans.maxUsers")}</Label>
							<Input
								type="number"
								min={0}
								value={maxUsers}
								onChange={(e) =>
									setMaxUsers(Number(e.target.value))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("admin.plans.maxProjects")}</Label>
							<Input
								type="number"
								min={0}
								value={maxProjects}
								onChange={(e) =>
									setMaxProjects(Number(e.target.value))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("admin.plans.maxStorage")}</Label>
							<Input
								type="number"
								min={0}
								value={maxStorageGB}
								onChange={(e) =>
									setMaxStorageGB(Number(e.target.value))
								}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label>{t("admin.plans.monthlyPrice")}</Label>
							<Input
								type="number"
								min={0}
								value={monthlyPrice}
								onChange={(e) =>
									setMonthlyPrice(Number(e.target.value))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("admin.plans.yearlyPrice")}</Label>
							<Input
								type="number"
								min={0}
								value={yearlyPrice}
								onChange={(e) =>
									setYearlyPrice(Number(e.target.value))
								}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>{t("admin.plans.features")}</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addFeature}
							>
								<PlusIcon className="me-1 size-3" />
								{t("admin.plans.addFeature")}
							</Button>
						</div>
						<div className="space-y-2">
							{featuresEn.map((_, index) => (
								<div
									key={index}
									className="flex items-center gap-2"
								>
									<Input
										placeholder={t(
											"admin.plans.featureEn",
										)}
										value={featuresEn[index]}
										onChange={(e) =>
											updateFeatureEn(
												index,
												e.target.value,
											)
										}
										className="flex-1"
									/>
									<Input
										placeholder={t(
											"admin.plans.featureAr",
										)}
										value={featuresAr[index] ?? ""}
										onChange={(e) =>
											updateFeatureAr(
												index,
												e.target.value,
											)
										}
										dir="rtl"
										className="flex-1"
									/>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => removeFeature(index)}
									>
										<TrashIcon className="size-4 text-destructive" />
									</Button>
								</div>
							))}
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						{t("common.cancel")}
					</Button>
					<Button
						onClick={() => mutation.mutate()}
						disabled={mutation.isPending}
					>
						{t("common.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
