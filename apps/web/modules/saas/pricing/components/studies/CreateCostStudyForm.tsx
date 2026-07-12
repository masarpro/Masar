"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
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
import { cn } from "@ui/lib";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
	GOALS,
	GOAL_TO_START_PAGE,
	GOAL_TO_STUDY_TYPE,
	PROJECT_TYPES,
	SCOPE_ITEMS,
	type StudyGoal,
} from "../../lib/study-create-config";

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

interface CreateCostStudyDialogProps {
	organizationId: string;
	organizationSlug: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateCostStudyDialog({
	organizationId,
	organizationSlug,
	open,
	onOpenChange,
}: CreateCostStudyDialogProps) {
	const t = useTranslations();
	const router = useRouter();

	// 2-step wizard: step 1 = goal+scope, step 2 = details
	const [step, setStep] = useState<1 | 2>(1);
	const [selectedGoal, setSelectedGoal] = useState<StudyGoal | null>(null);
	const [scope, setScope] = useState({
		structural: true,
		finishing: true,
		mep: true,
		custom: false,
	});
	const [formData, setFormData] = useState({
		name: "",
		customerName: "",
		projectType: "residential",
	});

	const selectedGoalConfig = GOALS.find((g) => g.goal === selectedGoal);
	const showScope = selectedGoalConfig?.showScope ?? false;

	const resetWizard = useCallback(() => {
		setStep(1);
		setSelectedGoal(null);
		setScope({ structural: true, finishing: true, mep: true, custom: false });
		setFormData({ name: "", customerName: "", projectType: "residential" });
	}, []);

	const handleOpenChange = useCallback((isOpen: boolean) => {
		if (!isOpen) {
			resetWizard();
		}
		onOpenChange(isOpen);
	}, [onOpenChange, resetWizard]);

	const createMutation = useMutation(
		orpc.pricing.studies.create.mutationOptions({
			onSuccess: (data: any) => {
				toast.success(t("pricing.studies.createSuccess"));
				handleOpenChange(false);
				const startPage = selectedGoal
					? GOAL_TO_START_PAGE[selectedGoal]
					: "";
				router.push(
					`/app/${organizationSlug}/pricing/studies/${data.id}${startPage ? `/${startPage}` : ""}`,
				);
			},
			onError: () => {
				toast.error(t("pricing.studies.createError"));
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedGoal || step !== 2 || !formData.name.trim()) return;

		const studyType = GOAL_TO_STUDY_TYPE[selectedGoal];

		const workScopes: string[] = [];
		if (showScope) {
			for (const item of SCOPE_ITEMS) {
				if (scope[item.stateKey]) workScopes.push(item.key);
			}
		}

		(createMutation as any).mutate({
			organizationId,
			name: formData.name.trim(),
			customerName: formData.customerName || undefined,
			projectType: formData.projectType,
			studyType,
			workScopes,
		});
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="rounded-2xl sm:max-w-lg" dir="rtl">
				<DialogHeader className="text-start">
					<DialogTitle className="text-xl font-bold">
						{step === 1
							? t("pricing.studies.create.selectGoal")
							: t("pricing.studies.form.basicInfo")}
					</DialogTitle>
					<DialogDescription>
						{step === 1
							? t("pricing.studies.create.selectGoalDescription")
							: t("pricing.studies.form.basicInfo")}
					</DialogDescription>
				</DialogHeader>

				{/* Step Indicator */}
				<div className="flex items-center justify-center gap-2 py-1">
					{[1, 2].map((s) => (
						<div
							key={s}
							className={cn(
								"h-1.5 rounded-full transition-all duration-300",
								s <= step ? "bg-primary w-8" : "bg-muted w-4",
							)}
						/>
					))}
				</div>

				<form onSubmit={handleSubmit} onKeyDown={(e) => {
					if (e.key === "Enter" && step !== 2) {
						e.preventDefault();
					}
				}}>
					{/* ── Step 1: Goal + Scope (same layout as EditStudyConfigDialog) ── */}
					{step === 1 && (
						<div className="space-y-4 py-2">
							{/* Study type selection - vertical list */}
							<div className="space-y-3">
								{GOALS.map((goal) => {
									const Icon = goal.icon;
									const isSelected = selectedGoal === goal.goal;

									return (
										<button
											key={goal.goal}
											type="button"
											onClick={() => setSelectedGoal(goal.goal)}
											className={cn(
												"w-full flex items-center gap-3 rounded-xl border-2 p-3 text-start transition-all",
												isSelected
													? "border-primary bg-primary/5"
													: "border-border hover:border-primary/30",
											)}
										>
											<div
												className={cn(
													"flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
													isSelected
														? "bg-primary text-primary-foreground"
														: "bg-muted text-muted-foreground",
												)}
											>
												<Icon className="h-4 w-4" />
											</div>
											<div className="flex-1 min-w-0">
												<div className={cn("font-semibold text-sm", isSelected ? "text-primary" : "text-foreground")}>
													{t(`pricing.studies.create.goals.${goal.goalKey}.title`)}
												</div>
												<div className="text-xs text-muted-foreground">
													{t(`pricing.studies.create.goals.${goal.goalKey}.description`)}
												</div>
											</div>
										</button>
									);
								})}
							</div>

							{/* Scopes selection - shown inline when goal has scope */}
							{selectedGoal && showScope && (
								<div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
									<p className="text-sm font-medium">{t("pricing.studies.create.selectScope")}</p>
									<div className="grid grid-cols-2 gap-2">
										{SCOPE_ITEMS.map((item) => (
											<label
												key={item.key}
												className={cn(
													"flex items-center gap-2 rounded-xl border-2 p-3 cursor-pointer transition-all",
													scope[item.stateKey]
														? "border-primary bg-primary/5"
														: "border-border hover:border-primary/30",
												)}
											>
												<Checkbox
													checked={scope[item.stateKey]}
													onCheckedChange={(checked: any) =>
														setScope({ ...scope, [item.stateKey]: !!checked })
													}
												/>
												<span className="text-sm">{item.icon}</span>
												<span className="text-sm font-medium">
													{t(item.labelKey)}
												</span>
											</label>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					{/* ── Step 2: Study Details ── */}
					{step === 2 && (
						<div className="space-y-4 py-2">
							<div className="space-y-2">
								<Label htmlFor="name">
									{t("pricing.studies.form.name")} <span className="text-destructive">*</span>
								</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e: any) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder={t("pricing.studies.form.nameExamplePlaceholder")}
									className="rounded-xl"
									autoFocus
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="customerName">
									{t("pricing.studies.form.customerName")}{" "}
									<span className="text-muted-foreground text-xs">({t("common.optional")})</span>
								</Label>
								<Input
									id="customerName"
									value={formData.customerName}
									onChange={(e: any) =>
										setFormData({ ...formData, customerName: e.target.value })
									}
									placeholder={t("pricing.studies.form.customerNamePlaceholder")}
									className="rounded-xl"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="projectType">{t("pricing.studies.form.projectType")}</Label>
								<Select
									value={formData.projectType}
									onValueChange={(value: any) =>
										setFormData({ ...formData, projectType: value })
									}
								>
									<SelectTrigger className="rounded-xl">
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
						</div>
					)}

					{/* ── Footer ── */}
					<DialogFooter className="gap-2 pt-4 flex-row-reverse sm:flex-row-reverse">
						{step === 2 ? (
							<Button
								type="submit"
								disabled={createMutation.isPending || !formData.name.trim()}
								className="rounded-xl px-8 gap-2"
							>
								{createMutation.isPending ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										{t("common.creating")}
									</>
								) : (
									t("pricing.studies.form.submit")
								)}
							</Button>
						) : (
							<Button
								type="button"
								onClick={() => setStep(2)}
								disabled={!selectedGoal}
								className="rounded-xl px-8 gap-2"
							>
								{t("common.next")}
								<ArrowLeft className="h-4 w-4" />
							</Button>
						)}

						{step === 2 ? (
							<Button
								type="button"
								variant="outline"
								onClick={() => setStep(1)}
								className="rounded-xl px-6 gap-2"
							>
								<ArrowRight className="h-4 w-4" />
								{t("common.previous")}
							</Button>
						) : (
							<Button
								type="button"
								variant="outline"
								onClick={() => handleOpenChange(false)}
								className="rounded-xl px-6"
							>
								{t("common.cancel")}
							</Button>
						)}
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Keep backward-compatible export name
export const CreateCostStudyForm = CreateCostStudyDialog;
