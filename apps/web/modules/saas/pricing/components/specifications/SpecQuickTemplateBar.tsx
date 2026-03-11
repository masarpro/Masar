"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { cn } from "@ui/lib";
import { Check, Crown, Loader2, Sparkles, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
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

type ScopeValue = "all" | `floor:${string}`;

export function SpecQuickTemplateBar({
	organizationId,
	studyId,
}: SpecQuickTemplateBarProps) {
	const queryClient = useQueryClient();
	const [applied, setApplied] = useState<string | null>(null);
	const [scope, setScope] = useState<ScopeValue>("all");

	// Fetch finishing items to get distinct floors
	const { data: finishingItemsRaw = [] } = useQuery(
		orpc.pricing.studies.getFinishingItems.queryOptions({
			input: { costStudyId: studyId, organizationId },
		}),
	);
	const finishingItems = finishingItemsRaw as any[];

	const floors = useMemo(() => {
		const map = new Map<string, string>();
		for (const item of finishingItems) {
			if (item.floorId && item.floorName) {
				map.set(item.floorId, item.floorName);
			}
		}
		return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
	}, [finishingItems]);

	const applyMutation = useMutation(
		orpc.pricing.studies.specifications.applyTemplate.mutationOptions({
			onSuccess: (data: any, variables: any) => {
				setApplied(variables.templateLevel);
				const scopeLabel = scope === "all"
					? ""
					: ` — ${floors.find((f) => `floor:${f.id}` === scope)?.name ?? ""}`;
				toast.success(`تم تطبيق قالب المواصفات — ${data.updated} بند${scopeLabel}`);
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

	const handleApply = (templateLevel: "economic" | "medium" | "luxury") => {
		const mutationInput: Record<string, unknown> = {
			organizationId,
			studyId,
			templateLevel,
		};

		if (scope === "all") {
			mutationInput.scope = "all";
		} else if (scope.startsWith("floor:")) {
			mutationInput.scope = "floor";
			mutationInput.floorId = scope.replace("floor:", "");
		}

		(applyMutation as any).mutate(mutationInput);
	};

	return (
		<div className="flex items-center gap-3 flex-wrap" dir="rtl">
			<span className="text-sm text-muted-foreground font-medium">
				قالب سريع:
			</span>

			{/* Scope selector */}
			{floors.length > 1 && (
				<Select value={scope} onValueChange={(v: any) => setScope(v as ScopeValue)}>
					<SelectTrigger className="h-8 w-[160px] text-xs rounded-lg">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">المشروع كامل</SelectItem>
						{floors.map((floor) => (
							<SelectItem key={floor.id} value={`floor:${floor.id}`}>
								{floor.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}

			{/* Template buttons */}
			{TEMPLATES.map((tpl) => {
				const Icon = tpl.icon;
				const isApplied = applied === tpl.value;
				const isLoading =
					applyMutation.isPending &&
					(applyMutation as any).variables?.templateLevel === tpl.value;

				return (
					<Button
						key={tpl.value}
						variant="outline"
						size="sm"
						disabled={applyMutation.isPending}
						onClick={() => handleApply(tpl.value)}
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
