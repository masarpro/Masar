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
import { Loader2, Save, Settings2 } from "lucide-react";
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

interface ElementSpec {
	concreteType: string;
	steelGrade: string;
}

interface SpecValues {
	elements: Record<string, ElementSpec>;
}

// ═══════════════════════════════════════════════════════════════
// خيارات الخرسانة والحديد
// ═══════════════════════════════════════════════════════════════

const CONCRETE_OPTIONS = ["C15", "C20", "C25", "C30", "C35", "C40"];

const STEEL_GRADE_OPTIONS = [
	{ value: "40", label: "Grade 40 (280 MPa)" },
	{ value: "60", label: "Grade 60 (420 MPa)" },
	{ value: "80", label: "Grade 80 (520 MPa)" },
];

// ═══════════════════════════════════════════════════════════════
// تعريف العناصر الإنشائية مع الاختيارات التلقائية
// ═══════════════════════════════════════════════════════════════

interface ElementRow {
	id: string;
	label: string;
	icon: string;
	defaultConcrete: string;
	defaultSteel: string;
	hasConcrete: boolean;
	hasSteel: boolean;
}

const ELEMENT_ROWS: ElementRow[] = [
	{ id: "plainConcrete", label: "صبة النظافة / خرسانة عادية", icon: "🧱", defaultConcrete: "C15", defaultSteel: "", hasConcrete: true, hasSteel: false },
	{ id: "foundations", label: "القواعد والأساسات", icon: "🏗️", defaultConcrete: "C30", defaultSteel: "60", hasConcrete: true, hasSteel: true },
	{ id: "columns", label: "الأعمدة", icon: "🏛️", defaultConcrete: "C35", defaultSteel: "60", hasConcrete: true, hasSteel: true },
	{ id: "beams", label: "الكمرات", icon: "📏", defaultConcrete: "C30", defaultSteel: "60", hasConcrete: true, hasSteel: true },
	{ id: "slabs", label: "البلاطات", icon: "⬛", defaultConcrete: "C30", defaultSteel: "60", hasConcrete: true, hasSteel: true },
	{ id: "stairs", label: "السلالم", icon: "🪜", defaultConcrete: "C30", defaultSteel: "60", hasConcrete: true, hasSteel: true },
	{ id: "blocks", label: "البلك", icon: "🧱", defaultConcrete: "", defaultSteel: "", hasConcrete: false, hasSteel: false },
];

function getDefaultElements(): Record<string, ElementSpec> {
	const elements: Record<string, ElementSpec> = {};
	for (const row of ELEMENT_ROWS) {
		elements[row.id] = {
			concreteType: row.defaultConcrete,
			steelGrade: row.defaultSteel,
		};
	}
	return elements;
}

const DEFAULT_SPECS: SpecValues = {
	elements: getDefaultElements(),
};

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
			const d = data as Record<string, any>;
			setSpecs({
				elements: d.elements ?? getDefaultElements(),
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

	const handleElementChange = useCallback(
		(elementId: string, field: "concreteType" | "steelGrade", value: string) => {
			setSpecs((prev) => ({
				...prev,
				elements: {
					...prev.elements,
					[elementId]: {
						...prev.elements[elementId],
						[field]: value,
					},
				},
			}));
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
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Settings2 className="h-5 w-5 text-amber-600" />
						<CardTitle className="text-base">مواصفات الخرسانة والحديد</CardTitle>
					</div>
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
				<p className="text-sm text-muted-foreground">
					اختيارات تلقائية بحسب نوع العنصر — يمكنك تعديلها
				</p>
			</CardHeader>
			<CardContent>
				<div className="border rounded-lg overflow-hidden">
					<table className="w-full">
						<thead>
							<tr className="bg-muted/50 text-sm">
								<th className="text-right py-2.5 px-4 font-medium">العنصر الإنشائي</th>
								<th className="text-center py-2.5 px-4 font-medium">نوع الخرسانة</th>
								<th className="text-center py-2.5 px-4 font-medium">رتبة الحديد</th>
							</tr>
						</thead>
						<tbody>
							{ELEMENT_ROWS.map((row, idx) => (
								<tr
									key={row.id}
									className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
								>
									<td className="py-2.5 px-4">
										<div className="flex items-center gap-2">
											<span className="text-lg">{row.icon}</span>
											<span className="font-medium text-sm">{row.label}</span>
										</div>
									</td>
									<td className="py-2 px-4">
										{row.hasConcrete ? (
											<div className="flex justify-center">
												<Select
													value={specs.elements[row.id]?.concreteType || row.defaultConcrete}
													onValueChange={(val) => handleElementChange(row.id, "concreteType", val)}
												>
													<SelectTrigger className="w-28 h-8 text-center text-sm">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{CONCRETE_OPTIONS.map((c) => (
															<SelectItem key={c} value={c}>{c}</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										) : (
											<p className="text-center text-xs text-muted-foreground">—</p>
										)}
									</td>
									<td className="py-2 px-4">
										{row.hasSteel ? (
											<div className="flex justify-center">
												<Select
													value={specs.elements[row.id]?.steelGrade || row.defaultSteel}
													onValueChange={(val) => handleElementChange(row.id, "steelGrade", val)}
												>
													<SelectTrigger className="w-44 h-8 text-center text-sm">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{STEEL_GRADE_OPTIONS.map((s) => (
															<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										) : (
											<p className="text-center text-xs text-muted-foreground">—</p>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}
