"use client";

import { useState } from "react";
import { Button } from "@ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Copy } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import { calculateColumnRebar } from "../../../../lib/structural-calculations";
import type { StructuralItemCreateInput } from "../../../../types/structural-mutation";
import type { CopyFromFloorButtonProps } from "./types";

export function CopyFromFloorButton({
	currentFloorId,
	currentFloorLabel,
	floors,
	getFloorItems,
	studyId,
	organizationId,
	specs,
	onCopied,
	targetHeight,
	targetRepeatCount,
}: CopyFromFloorButtonProps) {
	const [selectedSource, setSelectedSource] = useState<string>("");
	const [isCopying, setIsCopying] = useState(false);
	const createMutation = useMutation(
		orpc.pricing.studies.structuralItem.create.mutationOptions({
			onSuccess: () => {},
			onError: () => {},
		}),
	);

	const sourcesWithItems = floors.filter(
		(f) => f.id !== currentFloorId && getFloorItems(f.id).length > 0,
	);

	if (sourcesWithItems.length === 0) return null;

	const handleCopy = async () => {
		if (!selectedSource) return;
		setIsCopying(true);
		const sourceFloor = floors.find((f) => f.id === selectedSource);
		const sourceLabel = sourceFloor?.label || selectedSource;
		const sourceItems = getFloorItems(selectedSource);
		const repeat = Math.max(1, targetRepeatCount ?? 1);
		let copiedCount = 0;
		try {
			for (const item of sourceItems) {
				const newName =
					item.name.replace(sourceLabel, currentFloorLabel) ||
					`عمود الدور ال${currentFloorLabel}`;
				// كمية الدور الواحد — الكمية المخزنة قد تكون شاملة لتكرارات الدور المصدر
				const perFloorQuantity = Math.max(
					1,
					Math.round(
						item.dimensions?.perFloorQuantity ||
							item.quantity / (item.dimensions?.repeatCount || 1),
					),
				);
				// ارتفاع الدور الهدف من اشتقاق المناسيب — لا ننسخ ارتفاع الدور المصدر
				const height =
					targetHeight != null && targetHeight > 0
						? targetHeight
						: item.dimensions?.height || 3;
				// إعادة حساب الخرسانة والحديد والتكاليف للدور الهدف بدل نسخ أرقام المصدر
				const calc = calculateColumnRebar({
					quantity: perFloorQuantity,
					width: item.dimensions?.width || 30,
					depth: item.dimensions?.depth || 30,
					height,
					mainBarsCount: item.dimensions?.mainBarsCount || 8,
					mainBarDiameter: item.dimensions?.mainBarDiameter || 16,
					stirrupDiameter: item.dimensions?.stirrupDiameter || 8,
					stirrupSpacing: item.dimensions?.stirrupSpacing || 150,
					concreteType: specs?.concreteType || "C35",
					shape: item.dimensions?.shape ? "circular" : "rectangular",
					diameter: item.dimensions?.diameter || 40,
				});
				await (createMutation.mutateAsync as (data: StructuralItemCreateInput) => Promise<unknown>)({
					costStudyId: studyId,
					organizationId,
					category: "columns",
					subCategory: currentFloorId,
					name: newName,
					quantity: perFloorQuantity * repeat,
					unit: "m3",
					dimensions: {
						...item.dimensions,
						height,
						perFloorQuantity,
						repeatCount: repeat,
					},
					concreteVolume: calc.concreteVolume * repeat,
					concreteType: specs?.concreteType || "C35",
					steelWeight: calc.totals.grossWeight * repeat,
					steelRatio:
						calc.concreteVolume > 0
							? calc.totals.grossWeight / calc.concreteVolume
							: 0,
					materialCost: (calc.concreteCost + calc.rebarCost) * repeat,
					laborCost: calc.laborCost * repeat,
					totalCost: calc.totalCost * repeat,
				});
				copiedCount++;
			}
			setSelectedSource("");
			toast.success(
				`تم نسخ ${sourceItems.length} عنصر من ${sourceLabel} إلى ${currentFloorLabel}`,
			);
		} catch {
			toast.error(
				`فشل النسخ — تم نسخ ${copiedCount} من ${sourceItems.length} عنصر`,
			);
		} finally {
			setIsCopying(false);
			// تحديث القائمة حتى يظهر ما نُسخ فعلاً (حتى عند النسخ الجزئي)
			onCopied();
		}
	};

	return (
		<div className="flex items-center gap-2">
			<Select value={selectedSource} onValueChange={setSelectedSource}>
				<SelectTrigger className="w-48 h-8 text-xs">
					<SelectValue placeholder="نسخ من دور آخر..." />
				</SelectTrigger>
				<SelectContent>
					{sourcesWithItems.map((f) => (
						<SelectItem key={f.id} value={f.id}>
							{f.icon} {f.label} ({getFloorItems(f.id).length} عنصر)
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{selectedSource && (
				<Button
					size="sm"
					variant="outline"
					onClick={handleCopy}
					disabled={isCopying}
					className="h-8 text-xs"
				>
					<Copy className="h-3 w-3 me-1" />
					نسخ
				</Button>
			)}
		</div>
	);
}
