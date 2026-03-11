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
import { cn } from "@ui/lib";
import {
	Building2,
	ClipboardList,
	DollarSign,
	FileText,
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

const ENTRY_POINTS: Array<{
	value: EntryPoint;
	icon: typeof Building2;
	title: string;
	description: string;
	startsFrom: string;
}> = [
	{
		value: "FROM_SCRATCH",
		icon: Building2,
		title: "دراسة كاملة من الصفر",
		description: "حساب الكميات والمواصفات والتسعير",
		startsFrom: "تبدأ من: الكميات",
	},
	{
		value: "HAS_QUANTITIES",
		icon: ClipboardList,
		title: "لديّ كميات جاهزة",
		description: "أريد تحديد مواصفات وتسعير",
		startsFrom: "تبدأ من: المواصفات",
	},
	{
		value: "HAS_SPECS",
		icon: DollarSign,
		title: "لديّ كميات ومواصفات",
		description: "أريد التسعير فقط",
		startsFrom: "تبدأ من: التكلفة",
	},
	{
		value: "QUOTATION_ONLY",
		icon: FileText,
		title: "إصدار عرض سعر",
		description: "كل شيء جاهز أريد عرض سعر فقط",
		startsFrom: "تبدأ من: عرض السعر",
	},
	{
		value: "LUMP_SUM_ANALYSIS",
		icon: Search,
		title: "تحليل مقطوعية",
		description: "لديّ عقد بمبلغ إجمالي أريد تحليله",
		startsFrom: "مسار تحليل خاص",
	},
	{
		value: "CUSTOM_ITEMS",
		icon: Zap,
		title: "بنود مخصصة",
		description: "بند واحد أو عدة بنود فقط",
		startsFrom: "مسار مبسّط",
	},
];

const PROJECT_TYPES = [
	{ value: "residential", label: "سكني", color: "bg-sky-500" },
	{ value: "commercial", label: "تجاري", color: "bg-violet-500" },
	{ value: "industrial", label: "صناعي", color: "bg-orange-500" },
	{ value: "government", label: "حكومي", color: "bg-emerald-500" },
	{ value: "other", label: "أخرى", color: "bg-slate-500" },
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

	const [formData, setFormData] = useState({
		name: "",
		customerName: "",
		projectType: "residential",
		buildingArea: "",
		numberOfFloors: "1",
		entryPoint: "FROM_SCRATCH" as EntryPoint,
	});

	const createMutation = useMutation(
		orpc.pricing.studies.create.mutationOptions({
			onSuccess: (data) => {
				toast.success(t("pricing.studies.createSuccess"));
				router.push(
					`/app/${organizationSlug}/pricing/studies/${data.id}`,
				);
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
			buildingArea: Number(formData.buildingArea) || 1,
			numberOfFloors: Number(formData.numberOfFloors) || 1,
			entryPoint: formData.entryPoint,
		});
	};

	return (
		<div className="mx-auto max-w-4xl space-y-8 py-6" dir="rtl">
			{/* Page Header */}
			<div>
				<h1 className="text-2xl font-bold">{t("pricing.studies.newStudy")}</h1>
				<p className="text-muted-foreground mt-1">
					أنشئ دراسة تسعير جديدة واختر نقطة البداية المناسبة
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-8">
				{/* Section 1: Basic Info */}
				<div className="rounded-xl border border-border bg-card p-6 space-y-5">
					<h2 className="text-lg font-semibold">بيانات الدراسة الأساسية</h2>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">اسم الدراسة</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="مثال: فيلا الرياض - حي النرجس"
								className="rounded-xl"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="customerName">اسم العميل (اختياري)</Label>
							<Input
								id="customerName"
								value={formData.customerName}
								onChange={(e) =>
									setFormData({ ...formData, customerName: e.target.value })
								}
								placeholder="اسم العميل"
								className="rounded-xl"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="projectType">نوع المشروع</Label>
							<Select
								value={formData.projectType}
								onValueChange={(value) =>
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

						<div className="space-y-2">
							<Label htmlFor="buildingArea">المساحة (م²)</Label>
							<Input
								id="buildingArea"
								type="number"
								value={formData.buildingArea}
								onChange={(e) =>
									setFormData({ ...formData, buildingArea: e.target.value })
								}
								placeholder="0"
								className="rounded-xl"
								dir="ltr"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="numberOfFloors">عدد الأدوار</Label>
							<Input
								id="numberOfFloors"
								type="number"
								value={formData.numberOfFloors}
								onChange={(e) =>
									setFormData({ ...formData, numberOfFloors: e.target.value })
								}
								placeholder="1"
								className="rounded-xl"
								dir="ltr"
							/>
						</div>
					</div>
				</div>

				{/* Section 2: Entry Point Selection */}
				<div className="rounded-xl border border-border bg-card p-6 space-y-5">
					<h2 className="text-lg font-semibold">اختر نقطة البداية</h2>
					<p className="text-sm text-muted-foreground">
						حدد من أين تريد أن تبدأ الدراسة بناءً على البيانات المتوفرة لديك
					</p>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{ENTRY_POINTS.map((ep) => {
							const Icon = ep.icon;
							const isSelected = formData.entryPoint === ep.value;

							return (
								<button
									key={ep.value}
									type="button"
									onClick={() =>
										setFormData({ ...formData, entryPoint: ep.value })
									}
									className={cn(
										"flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-right transition-all",
										isSelected
											? "border-primary bg-primary/5 shadow-sm"
											: "border-border hover:border-muted-foreground/30 hover:bg-muted/30",
									)}
								>
									<div
										className={cn(
											"flex h-10 w-10 items-center justify-center rounded-lg",
											isSelected
												? "bg-primary/10 text-primary"
												: "bg-muted text-muted-foreground",
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
											{ep.title}
										</div>
										<div className="text-xs text-muted-foreground leading-relaxed">
											{ep.description}
										</div>
									</div>
									<div
										className={cn(
											"text-[11px] font-medium px-2 py-0.5 rounded-full",
											isSelected
												? "bg-primary/10 text-primary"
												: "bg-muted text-muted-foreground",
										)}
									>
										{ep.startsFrom}
									</div>
								</button>
							);
						})}
					</div>
				</div>

				{/* Submit */}
				<div className="flex justify-end gap-3">
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
							"إنشاء الدراسة"
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}
