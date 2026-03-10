"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { Skeleton } from "@ui/components/skeleton";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface UniformMarkupFormProps {
	organizationId: string;
	studyId: string;
	settings?: {
		overheadPercent: number;
		profitPercent: number;
		contingencyPercent: number;
		vatIncluded: boolean;
	};
	isLoading: boolean;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function UniformMarkupForm({
	organizationId,
	studyId,
	settings,
	isLoading,
}: UniformMarkupFormProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [overheadPercent, setOverheadPercent] = useState(5);
	const [profitPercent, setProfitPercent] = useState(10);
	const [contingencyPercent, setContingencyPercent] = useState(3);
	const [vatIncluded, setVatIncluded] = useState(true);
	const [dirty, setDirty] = useState(false);

	useEffect(() => {
		if (settings) {
			setOverheadPercent(settings.overheadPercent);
			setProfitPercent(settings.profitPercent);
			setContingencyPercent(settings.contingencyPercent);
			setVatIncluded(settings.vatIncluded);
			setDirty(false);
		}
	}, [settings]);

	const saveMutation = useMutation(
		orpc.pricing.studies.markup.setUniform.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.pipeline.markupSaved"));
				setDirty(false);
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "markup"]],
				});
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const handleSave = () => {
		saveMutation.mutate({
			organizationId,
			studyId,
			overheadPercent,
			profitPercent,
			contingencyPercent,
			vatIncluded,
		});
	};

	if (isLoading) {
		return (
			<Card>
				<CardContent className="p-4">
					<Skeleton className="h-40 w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card dir="rtl">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-base">
						{t("pricing.pipeline.markupUniform")}
					</CardTitle>
					{dirty && (
						<Button
							size="sm"
							onClick={handleSave}
							disabled={saveMutation.isPending}
							className="gap-1.5"
						>
							{saveMutation.isPending ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<Save className="h-3.5 w-3.5" />
							)}
							{t("common.save")}
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					{/* Overhead */}
					<div className="space-y-1.5">
						<Label className="text-xs">{t("pricing.pipeline.overheadPercent")}</Label>
						<div className="relative">
							<Input
								type="number"
								value={overheadPercent}
								onChange={(e) => {
									setOverheadPercent(Number(e.target.value));
									setDirty(true);
								}}
								min={0}
								max={100}
								step={0.5}
								className="text-sm pl-8"
								dir="ltr"
							/>
							<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
						</div>
					</div>

					{/* Profit */}
					<div className="space-y-1.5">
						<Label className="text-xs">{t("pricing.pipeline.profitPercent")}</Label>
						<div className="relative">
							<Input
								type="number"
								value={profitPercent}
								onChange={(e) => {
									setProfitPercent(Number(e.target.value));
									setDirty(true);
								}}
								min={0}
								max={100}
								step={0.5}
								className="text-sm pl-8"
								dir="ltr"
							/>
							<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
						</div>
					</div>

					{/* Contingency */}
					<div className="space-y-1.5">
						<Label className="text-xs">{t("pricing.pipeline.contingencyPercent")}</Label>
						<div className="relative">
							<Input
								type="number"
								value={contingencyPercent}
								onChange={(e) => {
									setContingencyPercent(Number(e.target.value));
									setDirty(true);
								}}
								min={0}
								max={100}
								step={0.5}
								className="text-sm pl-8"
								dir="ltr"
							/>
							<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
						</div>
					</div>
				</div>

				{/* VAT Toggle */}
				<div className="flex items-center gap-3 mt-4 pt-3 border-t">
					<Switch
						checked={vatIncluded}
						onCheckedChange={(checked) => {
							setVatIncluded(checked);
							setDirty(true);
						}}
					/>
					<Label className="text-sm cursor-pointer">
						{t("pricing.pipeline.vatIncluded")} (15%)
					</Label>
				</div>
			</CardContent>
		</Card>
	);
}
