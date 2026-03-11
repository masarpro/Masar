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
	DollarSign,
	FileDown,
	Loader2,
	Search,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════

type EntryPoint =
	| "FROM_SCRATCH"
	| "HAS_QUANTITIES"
	| "HAS_SPECS"
	| "QUOTATION_ONLY"
	| "LUMP_SUM_ANALYSIS"
	| "CUSTOM_ITEMS";

type StudyGoal =
	| "full_study"
	| "cost_pricing"
	| "quick_pricing"
	| "lump_sum"
	| "contract_import";

/** Maps the user-facing goal to the API's entryPoint */
const GOAL_TO_ENTRY_POINT: Record<StudyGoal, EntryPoint> = {
	full_study: "FROM_SCRATCH",
	cost_pricing: "HAS_QUANTITIES",
	quick_pricing: "QUOTATION_ONLY",
	lump_sum: "LUMP_SUM_ANALYSIS",
	contract_import: "CUSTOM_ITEMS",
};

/** Maps the user-facing goal to the starting sub-page after creation */
const GOAL_TO_START_PAGE: Record<StudyGoal, string> = {
	full_study: "structural",
	cost_pricing: "specifications",
	quick_pricing: "quick-pricing",
	lump_sum: "costing",
	contract_import: "quantities",
};

/** Badge labels describing which stages are included/skipped */
const GOAL_STAGE_BADGE: Record<StudyGoal, string> = {
	full_study: "جميع المراحل",
	cost_pricing: "يتخطى الكميات",
	quick_pricing: "مباشر لعرض السعر",
	lump_sum: "يتخطى الكميات والمواصفات",
	contract_import: "جميع المراحل",
};

const GOALS: Array<{
	value: StudyGoal;
	icon: typeof Building2;
	title: string;
	description: string;
	showScope: boolean;
}> = [
	{
		value: "full_study",
		icon: Building2,
		title: "دراسة كاملة من الصفر",
		description: "حساب الكميات والمواصفات والتسعير خطوة بخطوة",
		showScope: true,
	},
	{
		value: "cost_pricing",
		icon: ClipboardList,
		title: "تسعير تكلفة",
		description: "لديّ كميات جاهزة وأريد تحديد المواصفات والتسعير",
		showScope: true,
	},
	{
		value: "quick_pricing",
		icon: Zap,
		title: "تسعير سريع",
		description: "إدخال بنود وأسعار مباشرة بدون تفاصيل",
		showScope: false,
	},
	{
		value: "lump_sum",
		icon: Search,
		title: "تحليل مقطوعية",
		description: "لديّ عقد بمبلغ إجمالي وأريد تحليل التكلفة الفعلية",
		showScope: true,
	},
	{
		value: "contract_import",
		icon: FileDown,
		title: "استيراد عقد وتحويل لمشروع",
		description: "لديّ عقد متكامل وأريد تحويله لمشروع تنفيذي",
		showScope: false,
	},
];

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

	// Step 1: Goal selection
	const [selectedGoal, setSelectedGoal] = useState<StudyGoal | null>(null);

	// Step 2: Scope & details
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
		if (!selectedGoal) return;

		const entryPoint = GOAL_TO_ENTRY_POINT[selectedGoal];

		// Map study goal to studyType
		let studyType: "FULL_PROJECT" | "CUSTOM_ITEMS" | "LUMP_SUM_ANALYSIS" = "FULL_PROJECT";
		if (selectedGoal === "lump_sum") studyType = "LUMP_SUM_ANALYSIS";
		if (selectedGoal === "quick_pricing" || selectedGoal === "contract_import") studyType = "CUSTOM_ITEMS";

		(createMutation as any).mutate({
			organizationId,
			name: formData.name || undefined,
			customerName: formData.customerName || undefined,
			projectType: formData.projectType,
			studyType,
			entryPoint,
			...(formData.contractValue ? { contractValue: Number(formData.contractValue) } : {}),
		});
	};

	return (
		<div className="mx-auto max-w-3xl space-y-8 py-6" dir="rtl">
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
						اختر نوع الدراسة وحدد التفاصيل
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* ── Question 1: What do you want to do? ── */}
				<div className="rounded-xl border border-border bg-card p-6 space-y-5">
					<div>
						<h2 className="text-lg font-semibold">ماذا تريد أن تفعل؟</h2>
						<p className="text-sm text-muted-foreground mt-1">
							اختر نوع العمل المناسب لاحتياجك
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{GOALS.map((goal) => {
							const Icon = goal.icon;
							const isSelected = selectedGoal === goal.value;

							return (
								<button
									key={goal.value}
									type="button"
									onClick={() => setSelectedGoal(goal.value)}
									className={cn(
										"group flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-right transition-all",
										isSelected
											? "border-primary bg-primary/5 shadow-sm"
											: "border-border hover:border-primary/30 hover:bg-muted/30",
									)}
								>
									<div
										className={cn(
											"flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
											isSelected
												? "bg-primary text-primary-foreground"
												: "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
										)}
									>
										<Icon className="h-5 w-5" />
									</div>
									<div className="space-y-1">
										<div
											className={cn(
												"font-semibold text-sm",
												isSelected ? "text-primary" : "text-foreground",
											)}
										>
											{goal.title}
										</div>
										<div className="text-xs text-muted-foreground leading-relaxed">
											{goal.description}
										</div>
										<div
											className={cn(
												"mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight",
												isSelected
													? "bg-primary/10 text-primary"
													: "bg-muted text-muted-foreground",
											)}
										>
											{GOAL_STAGE_BADGE[goal.value]}
										</div>
									</div>
								</button>
							);
						})}
					</div>
				</div>

				{/* ── Question 2: Scope (only for full_study, cost_pricing, lump_sum) ── */}
				{selectedGoal && showScope && (
					<div className="rounded-xl border border-border bg-card p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
						<div>
							<h2 className="text-lg font-semibold">ما نطاق العمل؟</h2>
							<p className="text-sm text-muted-foreground mt-1">
								يمكن اختيار أكثر من خيار
							</p>
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
							{[
								{ key: "structural" as const, label: "أعمال إنشائية", icon: "🏗️" },
								{ key: "finishing" as const, label: "أعمال تشطيبات", icon: "🎨" },
								{ key: "mep" as const, label: "كهروميكانيكية", icon: "⚡" },
								{ key: "custom" as const, label: "بنود مخصصة", icon: "📝" },
							].map((item) => (
								<label
									key={item.key}
									className={cn(
										"flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all",
										scope[item.key]
											? "border-primary bg-primary/5"
											: "border-border hover:border-primary/30",
									)}
								>
									<Checkbox
										checked={scope[item.key]}
										onCheckedChange={(checked: any) =>
											setScope({ ...scope, [item.key]: !!checked })
										}
									/>
									<div className="flex flex-col">
										<span className="text-sm font-medium">{item.label}</span>
									</div>
								</label>
							))}
						</div>
					</div>
				)}

				{/* ── Section 3: Basic details (shown after goal selection) ── */}
				{selectedGoal && (
					<div className="rounded-xl border border-border bg-card p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
						<h2 className="text-lg font-semibold">بيانات الدراسة</h2>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="name">{t("pricing.studies.form.name")}</Label>
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
									{t("pricing.studies.form.customerName")} (اختياري)
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

							{/* Contract value for lump sum analysis */}
							{selectedGoal === "lump_sum" && (
								<div className="space-y-2">
									<Label htmlFor="contractValue">{t("pricing.studies.form.contractValue")}</Label>
									<Input
										id="contractValue"
										type="number"
										value={formData.contractValue}
										onChange={(e: any) =>
											setFormData({ ...formData, contractValue: e.target.value })
										}
										placeholder={t("pricing.studies.form.contractValuePlaceholder")}
										className="rounded-xl"
										dir="ltr"
									/>
								</div>
							)}
						</div>
					</div>
				)}

				{/* ── Submit ── */}
				{selectedGoal && (
					<div className="flex justify-end gap-3 animate-in fade-in duration-300">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
							className="rounded-xl px-6"
						>
							{t("common.cancel")}
						</Button>
						<Button
							type="submit"
							disabled={createMutation.isPending}
							className="rounded-xl px-8"
						>
							{createMutation.isPending ? (
								<>
									<Loader2 className="ml-2 h-4 w-4 animate-spin" />
									جاري الإنشاء...
								</>
							) : (
								<>إنشاء الدراسة</>
							)}
						</Button>
					</div>
				)}
			</form>
		</div>
	);
}
