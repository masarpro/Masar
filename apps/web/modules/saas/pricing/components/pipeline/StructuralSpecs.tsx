"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// TYPES & OPTIONS
// ═══════════════════════════════════════════════════════════════

interface StructuralSpecsProps {
	organizationId: string;
	studyId: string;
}

interface SpecValues {
	concreteGrade: string;
	steelGrade: string;
	externalBlockType: string;
	internalBlockType: string;
	waterproofType: string;
	thermalInsulationType: string;
}

const DEFAULT_SPECS: SpecValues = {
	concreteGrade: "",
	steelGrade: "",
	externalBlockType: "",
	internalBlockType: "",
	waterproofType: "",
	thermalInsulationType: "",
};

const CONCRETE_GRADES = [
	{ value: "C25/30", label: "C25/30" },
	{ value: "C30/37", label: "C30/37" },
	{ value: "C35/45", label: "C35/45" },
];

const STEEL_GRADES = [
	{ value: "Grade 40", label: "Grade 40" },
	{ value: "Grade 60", label: "Grade 60" },
];

const EXTERNAL_BLOCK_TYPES = [
	{ value: "20cm-standard", label: "بلوك 20سم عادي" },
	{ value: "20cm-insulated", label: "بلوك 20سم عازل" },
	{ value: "15cm-standard", label: "بلوك 15سم عادي" },
];

const INTERNAL_BLOCK_TYPES = [
	{ value: "15cm-standard", label: "بلوك 15سم عادي" },
	{ value: "10cm-standard", label: "بلوك 10سم عادي" },
];

const WATERPROOF_TYPES = [
	{ value: "bitumen-membrane", label: "لفافات بيتومينية" },
	{ value: "liquid-membrane", label: "عزل سائل" },
	{ value: "crystalline", label: "عزل كريستالي" },
	{ value: "pvc-membrane", label: "أغشية PVC" },
];

const THERMAL_INSULATION_TYPES = [
	{ value: "xps-5cm", label: "XPS 5سم" },
	{ value: "xps-7cm", label: "XPS 7سم" },
	{ value: "eps-5cm", label: "EPS 5سم" },
	{ value: "polyurethane", label: "رغوة بولي يوريثين" },
	{ value: "rockwool", label: "صوف صخري" },
];

interface SpecRow {
	key: keyof SpecValues;
	label: string;
	options: { value: string; label: string }[];
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function StructuralSpecs({
	organizationId,
	studyId,
}: StructuralSpecsProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [specs, setSpecs] = useState<SpecValues>(DEFAULT_SPECS);
	const [isDirty, setIsDirty] = useState(false);

	const { data, isLoading } = useQuery(
		orpc.pricing.studies.structuralSpecs.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	useEffect(() => {
		if (data) {
			setSpecs({
				concreteGrade: (data as Record<string, string>).concreteGrade || "",
				steelGrade: (data as Record<string, string>).steelGrade || "",
				externalBlockType: (data as Record<string, string>).externalBlockType || "",
				internalBlockType: (data as Record<string, string>).internalBlockType || "",
				waterproofType: (data as Record<string, string>).waterproofType || "",
				thermalInsulationType: (data as Record<string, string>).thermalInsulationType || "",
			});
		}
	}, [data]);

	const saveMutation = useMutation(
		orpc.pricing.studies.structuralSpecs.set.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.pipeline.specsSaved"));
				setIsDirty(false);
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "structuralSpecs"]],
				});
			},
			onError: (e: any) => toast.error(e.message || "حدث خطأ"),
		}),
	);

	const handleChange = useCallback(
		(key: keyof SpecValues, value: string) => {
			setSpecs((prev) => ({ ...prev, [key]: value }));
			setIsDirty(true);
		},
		[],
	);

	const handleSave = () => {
		(saveMutation as any).mutate({
			organizationId,
			studyId,
			specs,
		});
	};

	const rows: SpecRow[] = [
		{
			key: "concreteGrade",
			label: t("pricing.pipeline.specsConcreteGrade"),
			options: CONCRETE_GRADES,
		},
		{
			key: "steelGrade",
			label: t("pricing.pipeline.specsSteelGrade"),
			options: STEEL_GRADES,
		},
		{
			key: "externalBlockType",
			label: t("pricing.pipeline.specsExternalBlock"),
			options: EXTERNAL_BLOCK_TYPES,
		},
		{
			key: "internalBlockType",
			label: t("pricing.pipeline.specsInternalBlock"),
			options: INTERNAL_BLOCK_TYPES,
		},
		{
			key: "waterproofType",
			label: t("pricing.pipeline.specsWaterproof"),
			options: WATERPROOF_TYPES,
		},
		{
			key: "thermalInsulationType",
			label: t("pricing.pipeline.specsThermalInsulation"),
			options: THERMAL_INSULATION_TYPES,
		},
	];

	if (isLoading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center py-12">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card dir="rtl">
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="text-base">
						{t("pricing.pipeline.specsStructuralTitle")}
					</CardTitle>
					<Button
						size="sm"
						onClick={handleSave}
						disabled={!isDirty || saveMutation.isPending}
						className="gap-1.5"
					>
						{saveMutation.isPending ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<Save className="h-3.5 w-3.5" />
						)}
						{t("pricing.pipeline.specsSave")}
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{rows.map((row) => (
						<div
							key={row.key}
							className="grid grid-cols-[180px_1fr] items-center gap-3"
						>
							<label className="text-sm font-medium text-muted-foreground">
								{row.label}
							</label>
							<Select
								value={specs[row.key] || "none"}
								onValueChange={(v: any) =>
									handleChange(row.key, v === "none" ? "" : v)
								}
							>
								<SelectTrigger className="h-9">
									<SelectValue
										placeholder={t("pricing.pipeline.specsSelect")}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">
										— {t("pricing.pipeline.specsNotSet")} —
									</SelectItem>
									{row.options.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
