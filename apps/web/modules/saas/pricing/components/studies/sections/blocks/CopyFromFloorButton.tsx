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
	currentFloor,
	floors,
	getFloorItems,
	studyId,
	organizationId,
	onSave,
}: CopyFromFloorButtonProps) {
	const [selectedSource, setSelectedSource] = useState("");
	const [isCopying, setIsCopying] = useState(false);

	const createMutation = useMutation(
		orpc.pricing.studies.structuralItem.create.mutationOptions({
			onSuccess: () => {},
			onError: () => {},
		})
	);

	const sourcesWithItems = floors.filter(
		(f) => f.label !== currentFloor && getFloorItems(f.label, floors[0]?.label === f.label).length > 0
	);

	if (sourcesWithItems.length === 0) return null;

	const handleCopy = async () => {
		if (!selectedSource) return;
		setIsCopying(true);
		const sourceItems = getFloorItems(selectedSource, floors[0]?.label === selectedSource);
		for (const item of sourceItems) {
			const newName = item.name.replace(selectedSource, currentFloor);
			await (createMutation.mutateAsync as (data: StructuralItemCreateInput) => Promise<unknown>)({
				costStudyId: studyId,
				organizationId,
				category: "blocks",
				subCategory: String(item.dimensions?.wallCategory || ""),
				name: newName,
				quantity: item.quantity,
				unit: "piece",
				dimensions: { ...item.dimensions, floor: currentFloor },
				concreteVolume: item.dimensions?.concreteVolume || 0,
				steelWeight: item.dimensions?.steelWeight || 0,
				materialCost: 0,
				laborCost: 0,
				totalCost: item.totalCost,
			});
		}
		setIsCopying(false);
		setSelectedSource("");
		toast.success(`تم نسخ ${sourceItems.length} عنصر`);
		onSave();
	};

	return (
		<div className="flex items-center gap-2">
			<Select value={selectedSource} onValueChange={setSelectedSource}>
				<SelectTrigger className="w-48 h-8 text-xs">
					<SelectValue placeholder="نسخ من دور آخر..." />
				</SelectTrigger>
				<SelectContent>
					{sourcesWithItems.map((f) => (
						<SelectItem key={f.label} value={f.label}>
							{f.icon} {f.label} ({getFloorItems(f.label, floors[0]?.label === f.label).length})
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{selectedSource && (
				<Button size="sm" variant="outline" onClick={handleCopy} disabled={isCopying} className="h-8 text-xs">
					<Copy className="h-3 w-3 ml-1" /> نسخ
				</Button>
			)}
		</div>
	);
}
