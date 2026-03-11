"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { Check, Crown, Loader2, Sparkles, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SpecQuickTemplateBarProps {
	organizationId: string;
	studyId: string;
}

const TEMPLATES = [
	{
		value: "economic" as const,
		label: "اقتصادي",
		icon: Wallet,
		color: "text-emerald-600",
		bg: "bg-emerald-50 dark:bg-emerald-950/30",
		border: "border-emerald-200 dark:border-emerald-800",
	},
	{
		value: "medium" as const,
		label: "متوسط",
		icon: Sparkles,
		color: "text-blue-600",
		bg: "bg-blue-50 dark:bg-blue-950/30",
		border: "border-blue-200 dark:border-blue-800",
	},
	{
		value: "luxury" as const,
		label: "فاخر",
		icon: Crown,
		color: "text-amber-600",
		bg: "bg-amber-50 dark:bg-amber-950/30",
		border: "border-amber-200 dark:border-amber-800",
	},
];

export function SpecQuickTemplateBar({
	organizationId,
	studyId,
}: SpecQuickTemplateBarProps) {
	const queryClient = useQueryClient();
	const [applied, setApplied] = useState<string | null>(null);

	const applyMutation = useMutation(
		orpc.pricing.studies.specifications.applyTemplate.mutationOptions({
			onSuccess: (data, variables) => {
				setApplied(variables.templateLevel);
				toast.success(`تم تطبيق قالب المواصفات — ${data.updated} بند`);
				// Invalidate all relevant queries
				queryClient.invalidateQueries({
					queryKey: ["pricing", "studies", "specifications"],
				});
				queryClient.invalidateQueries({
					queryKey: ["pricing", "studies", "getFinishingItems"],
				});
				queryClient.invalidateQueries({
					queryKey: ["pricing", "studies", "finishingItem"],
				});
			},
			onError: () => {
				toast.error("حدث خطأ أثناء تطبيق القالب");
			},
		}),
	);

	return (
		<div className="flex items-center gap-2 flex-wrap" dir="rtl">
			<span className="text-sm text-muted-foreground font-medium">
				قالب سريع:
			</span>
			{TEMPLATES.map((tpl) => {
				const Icon = tpl.icon;
				const isApplied = applied === tpl.value;
				const isLoading =
					applyMutation.isPending &&
					applyMutation.variables?.templateLevel === tpl.value;

				return (
					<Button
						key={tpl.value}
						variant="outline"
						size="sm"
						disabled={applyMutation.isPending}
						onClick={() =>
							applyMutation.mutate({
								organizationId,
								studyId,
								templateLevel: tpl.value,
							})
						}
						className={cn(
							"gap-1.5 rounded-lg border",
							isApplied && tpl.border,
							isApplied && tpl.bg,
						)}
					>
						{isLoading ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : isApplied ? (
							<Check className={cn("h-3.5 w-3.5", tpl.color)} />
						) : (
							<Icon className={cn("h-3.5 w-3.5", tpl.color)} />
						)}
						{tpl.label}
					</Button>
				);
			})}
		</div>
	);
}
