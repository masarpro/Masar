"use client";

import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { Textarea } from "@ui/components/textarea";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { DimensionInput } from "../inputs/DimensionInput";
import type { ContextRecord } from "../hooks/useContext";

interface Props {
	costStudyId: string;
	organizationId: string;
	context: ContextRecord | null;
	updateContext: (input: Record<string, unknown>) => Promise<unknown>;
}

const num = (v: unknown) => (v == null ? 0 : Number(v));

export function GeneralContextForm({
	costStudyId,
	organizationId,
	context,
	updateContext,
}: Props) {
	const [notes, setNotes] = useState(context?.generalNotes ?? "");

	useEffect(() => {
		setNotes(context?.generalNotes ?? "");
	}, [context?.generalNotes]);

	const debouncedSave = useDebouncedCallback(
		(override: Record<string, unknown>) => {
			updateContext({ costStudyId, organizationId, ...override });
		},
		400,
	);

	const save = (override: Record<string, unknown>) => {
		updateContext({ costStudyId, organizationId, ...override });
	};

	return (
		<div className="space-y-5">
			<div>
				<h4 className="text-sm font-semibold">المساحات الكلية</h4>
				<p className="text-xs text-muted-foreground">
					مساحات للاختصار — تستخدمها البنود التي تختار "fromContext"
				</p>
			</div>

			<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
				<DimensionInput
					id="ctx-floor"
					label="إجمالي مساحة الأرضيات"
					unit="م²"
					value={num(context?.totalFloorArea)}
					onCommit={(v) => save({ totalFloorArea: v })}
				/>
				<DimensionInput
					id="ctx-wall"
					label="إجمالي مساحة الجدران"
					unit="م²"
					value={num(context?.totalWallArea)}
					onCommit={(v) => save({ totalWallArea: v })}
				/>
				<DimensionInput
					id="ctx-ext-wall"
					label="جدران خارجية"
					unit="م²"
					value={num(context?.totalExteriorWallArea)}
					onCommit={(v) => save({ totalExteriorWallArea: v })}
				/>
				<DimensionInput
					id="ctx-roof"
					label="مساحة السطح"
					unit="م²"
					value={num(context?.totalRoofArea)}
					onCommit={(v) => save({ totalRoofArea: v })}
				/>
				<DimensionInput
					id="ctx-perim"
					label="المحيط الإجمالي"
					unit="م"
					value={num(context?.totalPerimeter)}
					onCommit={(v) => save({ totalPerimeter: v })}
				/>
				<DimensionInput
					id="ctx-fheight"
					label="متوسط ارتفاع الدور"
					unit="م"
					value={num(context?.averageFloorHeight)}
					onCommit={(v) => save({ averageFloorHeight: v })}
				/>
			</div>

			<div className="space-y-3 rounded-lg border bg-muted/30 p-3">
				<h4 className="text-sm font-medium">خصائص المبنى</h4>
				<div className="grid grid-cols-1 gap-2 md:grid-cols-3">
					<div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
						<Label htmlFor="ctx-bsmt" className="text-xs">
							يوجد بدروم
						</Label>
						<Switch
							id="ctx-bsmt"
							checked={context?.hasBasement ?? false}
							onCheckedChange={(v) => save({ hasBasement: v })}
						/>
					</div>
					<div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
						<Label htmlFor="ctx-roof-flag" className="text-xs">
							يوجد سطح
						</Label>
						<Switch
							id="ctx-roof-flag"
							checked={context?.hasRoof ?? true}
							onCheckedChange={(v) => save({ hasRoof: v })}
						/>
					</div>
					<div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
						<Label htmlFor="ctx-yard" className="text-xs">
							يوجد حوش
						</Label>
						<Switch
							id="ctx-yard"
							checked={context?.hasYard ?? false}
							onCheckedChange={(v) => save({ hasYard: v })}
						/>
					</div>
				</div>

				{context?.hasYard && (
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<DimensionInput
							id="ctx-yard-area"
							label="مساحة الحوش"
							unit="م²"
							value={num(context?.yardArea)}
							onCommit={(v) => save({ yardArea: v })}
						/>
						<DimensionInput
							id="ctx-fence-len"
							label="طول السور"
							unit="م"
							value={num(context?.fenceLength)}
							onCommit={(v) => save({ fenceLength: v })}
						/>
					</div>
				)}
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="ctx-notes" className="text-sm">
					ملاحظات عامة
				</Label>
				<Textarea
					id="ctx-notes"
					value={notes}
					onChange={(e) => {
						setNotes(e.target.value);
						debouncedSave({ generalNotes: e.target.value });
					}}
					rows={3}
					placeholder="مثال: المبنى ذو طابع حديث، يفضّل العميل ألوان فاتحة..."
				/>
			</div>
		</div>
	);
}
