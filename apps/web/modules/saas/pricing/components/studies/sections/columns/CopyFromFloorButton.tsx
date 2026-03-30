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
}: CopyFromFloorButtonProps) {
	const [selectedSource, setSelectedSource] = useState<string>("");
	const [isCopying, setIsCopying] = useState(false);
	const createMutation = useMutation(
		orpc.pricing.studies.structuralItem.create.mutationOptions({
			onSuccess: () => {},
			onError: () => toast.error("خطأ في النسخ"),
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
		for (const item of sourceItems) {
			const newName =
				item.name.replace(sourceLabel, currentFloorLabel) ||
				`عمود الدور ال${currentFloorLabel}`;
			await (createMutation.mutateAsync as (data: StructuralItemCreateInput) => Promise<unknown>)({
				costStudyId: studyId,
				organizationId,
				category: "columns",
				subCategory: currentFloorId,
				name: newName,
				quantity: item.quantity,
				unit: "m3",
				dimensions: { ...item.dimensions },
				concreteVolume: item.concreteVolume,
				concreteType: specs?.concreteType || "C35",
				steelWeight: item.steelWeight,
				steelRatio:
					item.concreteVolume > 0
						? item.steelWeight / item.concreteVolume
						: 0,
				materialCost: 0,
				laborCost: 0,
				totalCost: item.totalCost,
			});
		}
		setIsCopying(false);
		setSelectedSource("");
		toast.success(
			`تم نسخ ${sourceItems.length} عنصر من ${sourceLabel} إلى ${currentFloorLabel}`,
		);
		onCopied();
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
					<Copy className="h-3 w-3 ml-1" />
					نسخ
				</Button>
			)}
		</div>
	);
}
