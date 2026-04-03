"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
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
import {
	ArrowLeft,
	Building2,
	ClipboardList,
	Loader2,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════

type StudyGoal = "full_study" | "cost_pricing" | "quick_pricing";

type NewStudyType = "FULL_STUDY" | "COST_PRICING" | "QUICK_PRICING";

const GOAL_TO_STUDY_TYPE: Record<StudyGoal, NewStudyType> = {
	full_study: "FULL_STUDY",
	cost_pricing: "COST_PRICING",
	quick_pricing: "QUICK_PRICING",
};

/** Maps the user-facing goal to the starting sub-page after creation */
const GOAL_TO_START_PAGE: Record<StudyGoal, string> = {
	full_study: "quantities",
	cost_pricing: "quantities",
	quick_pricing: "pricing",
};

const GOALS = [
	{ value: "full_study" as const, icon: Building2, goalKey: "full_study", showScope: true },
	{ value: "cost_pricing" as const, icon: ClipboardList, goalKey: "cost_pricing", showScope: true },
	{ value: "quick_pricing" as const, icon: Zap, goalKey: "quick_pricing", showScope: false },
] as const;

const SCOPE_ITEMS = [
	{ key: "STRUCTURAL" as const, stateKey: "structural" as const, icon: "🏗️" },
	{ key: "FINISHING" as const, stateKey: "finishing" as const, icon: "🎨" },
	{ key: "MEP" as const, stateKey: "mep" as const, icon: "⚡" },
	{ key: "CUSTOM" as const, stateKey: "custom" as const, icon: "📝" },
] as const;

const PROJECT_TYPES = [
	{ value: "residential", label: "سكني", color: "bg-sky-500" },
	{ value: "commercial", label: "تجاري", color: "bg-violet-500" },
	{ value: "industrial", label: "صناعي", color: "bg-orange-500" },
	{ value: "warehouse", label: "مستودع", color: "bg-slate-500" },
	{ value: "mixed", label: "مختلط", color: "bg-teal-500" },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

interface CreateStudyPageProps {
	organizationId: string;
	organizationSlug: string;
}

export function CreateStudyPage({
	organizationId,
	organizationSlug,
}: CreateStudyPageProps) {
	const t = useTranslations();
	const router = useRouter();

	// Goal + scope selection
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
		contractValue: "",
	});

	const selectedGoalConfig = GOALS.find((g) => g.value === selectedGoal);
	const showScope = selectedGoalConfig?.showScope ?? false;

	const createMutation = useMutation(
		orpc.pricing.studies.create.mutationOptions({
			onSuccess: (data: any) => {
				toast.success(t("pricing.studies.createSuccess"));
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
		if (!selectedGoal || !formData.name.trim()) return;

		const studyType = GOAL_TO_STUDY_TYPE[selectedGoal];

		const workScopes: string[] = [];
		if (showScope) {
			if (scope.structural) workScopes.push("STRUCTURAL");
			if (scope.finishing) workScopes.push("FINISHING");
			if (scope.mep) workScopes.push("MEP");
			if (scope.custom) workScopes.push("CUSTOM");
		}

		(createMutation as any).mutate({
			organizationId,
			name: formData.name.trim(),
			customerName: formData.customerName || undefined,
			projectType: formData.projectType,
			studyType,
			workScopes,
			landArea: 1,
			buildingArea: 1,
			numberOfFloors: 1,
			hasBasement: false,
			finishingLevel: "medium",
			...(formData.contractValue ? { contractValue: Number(formData.contractValue) } : {}),
		});
	};

	return (
		<div className="mx-auto max-w-2xl space-y-6 py-6" dir="rtl">
			{/* Page Header */}
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => router.back()}
					className="h-9 w-9 shrink-0"
				>
					<ArrowLeft className="h-5 w-5 rotate-180" />
				</Button>
				<div>
					<h1 className="text-2xl font-bold">{t("pricing.studies.newStudy")}</h1>
					<p className="text-muted-foreground text-sm mt-0.5">
						{t("pricing.studies.create.selectGoalDescription")}
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} onKeyDown={(e) => {
					if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "BUTTON") {
						e.preventDefault();
					}
				}} className="space-y-6">
				{/* ── Section 1: Goal + Scope (same layout as EditStudyConfigDialog) ── */}
				<div className="rounded-xl border border-border bg-card p-6 space-y-5">
					<div>
						<h2 className="text-lg font-semibold">{t("pricing.studies.create.selectGoal")}</h2>
						<p className="text-sm text-muted-foreground mt-1">
							{t("pricing.studies.create.selectGoalDescription")}
						</p>
					</div>

					{/* Study type - vertical list */}
					<div className="space-y-3">
						{GOALS.map((goal) => {
							const Icon = goal.icon;
							const isSelected = selectedGoal === goal.value;

							return (
								<button
									key={goal.value}
									type="button"
									onClick={() => setSelectedGoal(goal.value)}
									className={cn(
										"w-full flex items-center gap-3 rounded-xl border-2 p-3 text-right transition-all",
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

					{/* Scopes - shown inline below goals */}
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
											{t(`pricing.studies.create.scopes.${item.key}`)}
										</span>
									</label>
								))}
							</div>
						</div>
					)}
				</div>

				{/* ── Section 2: Basic details (shown after goal selection) ── */}
				{selectedGoal && (
					<div className="rounded-xl border border-border bg-card p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
						<h2 className="text-lg font-semibold">{t("pricing.studies.form.basicInfo")}</h2>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
									placeholder="مثال: فيلا الرياض - حي النرجس"
									className="rounded-xl"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="customerName">
									{t("pricing.studies.form.customerName")}{" "}
									<span className="text-muted-foreground text-xs">(اختياري)</span>
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
													{type.label}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				)}

				{/* ── Submit ── */}
				{selectedGoal && (
					<div className="flex justify-end gap-3 animate-in fade-in duration-300">
						<Button
							type="button"
							variant="outline"
							size="lg"
							onClick={() => router.back()}
							className="rounded-xl px-6"
						>
							{t("common.cancel")}
						</Button>
						<Button
							type="submit"
							size="lg"
							disabled={createMutation.isPending || !formData.name.trim()}
							className="rounded-xl px-10 gap-2 text-base"
						>
							{createMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									جاري الإنشاء...
								</>
							) : (
								<>
									إنشاء الدراسة
									<ArrowLeft className="h-4 w-4" />
								</>
							)}
						</Button>
					</div>
				)}
			</form>
		</div>
	);
}
