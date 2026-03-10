"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface MarkupMethodSelectorProps {
	organizationId: string;
	studyId: string;
	currentMethod: string;
}

const METHODS = [
	{ value: "uniform", disabled: false },
	{ value: "per_section", disabled: false },
	{ value: "manual", disabled: true },
] as const;

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function MarkupMethodSelector({
	organizationId,
	studyId,
	currentMethod,
}: MarkupMethodSelectorProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const setUniformMutation = useMutation(
		orpc.pricing.studies.markup.setUniform.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "markup"]],
				});
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const handleMethodChange = (value: string) => {
		if (value === currentMethod) return;
		if (value === "uniform") {
			// When switching to uniform, set default values (which clears section markups)
			setUniformMutation.mutate({
				organizationId,
				studyId,
				overheadPercent: 5,
				profitPercent: 10,
				contingencyPercent: 3,
				vatIncluded: true,
			});
		}
		// For per_section, user will set markups in SectionMarkupForm
	};

	const labelKeys: Record<string, string> = {
		uniform: "pricing.pipeline.markupUniform",
		per_section: "pricing.pipeline.markupPerSection",
		manual: "pricing.pipeline.markupManual",
	};

	const descKeys: Record<string, string> = {
		uniform: "pricing.pipeline.markupUniformDesc",
		per_section: "pricing.pipeline.markupPerSectionDesc",
		manual: "pricing.pipeline.markupManualDesc",
	};

	return (
		<Card dir="rtl">
			<CardHeader className="pb-3">
				<CardTitle className="text-base">
					{t("pricing.pipeline.markupMethod")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{METHODS.map((method) => {
						const isActive = currentMethod === method.value;
						return (
							<button
								key={method.value}
								type="button"
								disabled={method.disabled}
								onClick={() => handleMethodChange(method.value)}
								className={cn(
									"w-full flex items-start gap-3 rounded-lg border p-3 text-right transition-colors",
									isActive
										? "border-primary bg-primary/5"
										: "border-border hover:bg-accent/50",
									method.disabled && "opacity-50 cursor-not-allowed",
								)}
							>
								<div className={cn(
									"mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center",
									isActive ? "border-primary" : "border-muted-foreground/40",
								)}>
									{isActive && (
										<div className="h-2 w-2 rounded-full bg-primary" />
									)}
								</div>
								<div>
									<p className="font-medium text-sm">{t(labelKeys[method.value] ?? "")}</p>
									<p className="text-xs text-muted-foreground">
										{t(descKeys[method.value] ?? "")}
									</p>
								</div>
							</button>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
