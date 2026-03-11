"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface PricingSettingsCardProps {
	studyId: string;
	organizationId: string;
	overheadPercent: number;
	profitPercent: number;
	contingencyPercent: number;
	vatIncluded: boolean;
}

export function PricingSettingsCard({
	studyId,
	organizationId,
	overheadPercent,
	profitPercent,
	contingencyPercent,
	vatIncluded,
}: PricingSettingsCardProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [overhead, setOverhead] = useState(String(overheadPercent));
	const [profit, setProfit] = useState(String(profitPercent));
	const [contingency, setContingency] = useState(String(contingencyPercent));
	const [vat, setVat] = useState(vatIncluded);

	// Sync with external
	useEffect(() => {
		setOverhead(String(overheadPercent));
	}, [overheadPercent]);
	useEffect(() => {
		setProfit(String(profitPercent));
	}, [profitPercent]);
	useEffect(() => {
		setContingency(String(contingencyPercent));
	}, [contingencyPercent]);
	useEffect(() => {
		setVat(vatIncluded);
	}, [vatIncluded]);

	const updateMutation = useMutation(
		orpc.pricing.studies.update.mutationOptions({
			onSuccess: () => {
				(recalculateMutation as any).mutate({
					id: studyId,
					organizationId,
				});
			},
			onError: () => {
				toast.error("حدث خطأ أثناء حفظ الإعدادات");
			},
		}),
	);

	const recalculateMutation = useMutation(
		orpc.pricing.studies.recalculate.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies"]],
				});
			},
		}),
	);

	const saveSettings = useCallback(
		(o: string, p: string, c: string, v: boolean) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				const ov = parseFloat(o);
				const pv = parseFloat(p);
				const cv = parseFloat(c);
				(updateMutation as any).mutate({
					id: studyId,
					organizationId,
					overheadPercent: Number.isNaN(ov) ? 0 : ov,
					profitPercent: Number.isNaN(pv) ? 0 : pv,
					contingencyPercent: Number.isNaN(cv) ? 0 : cv,
					vatIncluded: v,
				});
			}, 500);
		},
		[updateMutation, studyId, organizationId],
	);

	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	const handleOverheadChange = (val: string) => {
		setOverhead(val);
		saveSettings(val, profit, contingency, vat);
	};

	const handleProfitChange = (val: string) => {
		setProfit(val);
		saveSettings(overhead, val, contingency, vat);
	};

	const handleContingencyChange = (val: string) => {
		setContingency(val);
		saveSettings(overhead, profit, val, vat);
	};

	const handleVatChange = (checked: boolean) => {
		setVat(checked);
		saveSettings(overhead, profit, contingency, checked);
	};

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base">
					{t("pricing.studies.pricingSettings")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("pricing.studies.overhead")} %
						</Label>
						<div className="relative">
							<Input
								type="number"
								min={0}
								max={100}
								step={0.5}
								value={overhead}
								onChange={(e: any) =>
									handleOverheadChange(e.target.value)
								}
								className="h-9 text-sm pl-7"
								dir="ltr"
							/>
							<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
								%
							</span>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("pricing.studies.profit")} %
						</Label>
						<div className="relative">
							<Input
								type="number"
								min={0}
								max={100}
								step={0.5}
								value={profit}
								onChange={(e: any) =>
									handleProfitChange(e.target.value)
								}
								className="h-9 text-sm pl-7"
								dir="ltr"
							/>
							<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
								%
							</span>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("pricing.studies.contingency")} %
						</Label>
						<div className="relative">
							<Input
								type="number"
								min={0}
								max={100}
								step={0.5}
								value={contingency}
								onChange={(e: any) =>
									handleContingencyChange(e.target.value)
								}
								className="h-9 text-sm pl-7"
								dir="ltr"
							/>
							<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
								%
							</span>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("pricing.studies.includeVat")}
						</Label>
						<div className="flex items-center gap-2 h-9">
							<Switch
								checked={vat}
								onCheckedChange={handleVatChange}
							/>
							<span className="text-sm text-muted-foreground">
								{vat ? "15%" : "لا"}
							</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
