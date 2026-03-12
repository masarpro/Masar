"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Settings2 } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// أنواع الخرسانة المتاحة
// ═══════════════════════════════════════════════════════════════
const CONCRETE_OPTIONS = ["C15", "C20", "C25", "C30", "C35", "C40"];

// ═══════════════════════════════════════════════════════════════
// رتب حديد التسليح المتاحة
// ═══════════════════════════════════════════════════════════════
const STEEL_GRADE_OPTIONS = [
	{ value: "40", label: "Grade 40 (280 MPa)" },
	{ value: "60", label: "Grade 60 (420 MPa)" },
	{ value: "80", label: "Grade 80 (520 MPa)" },
];

// ═══════════════════════════════════════════════════════════════
// تعريف العناصر الإنشائية مع الاختيارات التلقائية
// ═══════════════════════════════════════════════════════════════
export interface StructuralSpecs {
	[key: string]: {
		concreteType: string;
		steelGrade: string;
	};
}

interface SpecRow {
	id: string;
	label: string;
	icon: string;
	defaultConcrete: string;
	defaultSteel: string;
	hasConcrete: boolean;
	hasSteel: boolean;
}

const SPEC_ROWS: SpecRow[] = [
	{ id: "plainConcrete", label: "صبة النظافة / خرسانة عادية", icon: "🧱", defaultConcrete: "C15", defaultSteel: "", hasConcrete: true, hasSteel: false },
	{ id: "foundations", label: "القواعد والأساسات", icon: "🏗️", defaultConcrete: "C30", defaultSteel: "60", hasConcrete: true, hasSteel: true },
	{ id: "columns", label: "الأعمدة", icon: "🏛️", defaultConcrete: "C35", defaultSteel: "60", hasConcrete: true, hasSteel: true },
	{ id: "beams", label: "الكمرات", icon: "📏", defaultConcrete: "C30", defaultSteel: "60", hasConcrete: true, hasSteel: true },
	{ id: "slabs", label: "البلاطات", icon: "⬛", defaultConcrete: "C30", defaultSteel: "60", hasConcrete: true, hasSteel: true },
	{ id: "stairs", label: "السلالم", icon: "🪜", defaultConcrete: "C30", defaultSteel: "60", hasConcrete: true, hasSteel: true },
	{ id: "blocks", label: "البلك", icon: "🧱", defaultConcrete: "", defaultSteel: "", hasConcrete: false, hasSteel: false },
];

export function getDefaultSpecs(): StructuralSpecs {
	const specs: StructuralSpecs = {};
	for (const row of SPEC_ROWS) {
		specs[row.id] = {
			concreteType: row.defaultConcrete,
			steelGrade: row.defaultSteel,
		};
	}
	return specs;
}

interface StructuralSpecsSectionProps {
	specs: StructuralSpecs;
	onSpecsChange: (specs: StructuralSpecs) => void;
}

export function StructuralSpecsSection({ specs, onSpecsChange }: StructuralSpecsSectionProps) {
	const updateSpec = (id: string, field: "concreteType" | "steelGrade", value: string) => {
		onSpecsChange({
			...specs,
			[id]: {
				...specs[id],
				[field]: value,
			},
		});
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 mb-2">
				<Settings2 className="h-5 w-5 text-primary" />
				<p className="text-sm text-muted-foreground">
					اختيارات تلقائية بحسب نوع العنصر — يمكنك تعديلها
				</p>
			</div>

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
						{SPEC_ROWS.map((row, idx) => (
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
												value={specs[row.id]?.concreteType || row.defaultConcrete}
												onValueChange={(val) => updateSpec(row.id, "concreteType", val)}
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
												value={specs[row.id]?.steelGrade || row.defaultSteel}
												onValueChange={(val) => updateSpec(row.id, "steelGrade", val)}
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
		</div>
	);
}
