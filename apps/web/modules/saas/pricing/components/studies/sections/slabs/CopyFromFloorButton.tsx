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
		(f) =>
			f.label !== currentFloor &&
			getFloorItems(f.label, floors[0]?.label === f.label).length > 0,
	);

	if (sourcesWithItems.length === 0) return null;

	const handleCopy = async () => {
		if (!selectedSource) return;
		setIsCopying(true);
		const sourceItems = getFloorItems(
			selectedSource,
			floors[0]?.label === selectedSource,
		);
		for (const item of sourceItems) {
			const newName =
				item.name.replace(selectedSource, currentFloor) ||
				`سقف الدور ال${currentFloor}`;
			await (createMutation.mutateAsync as (data: StructuralItemCreateInput) => Promise<unknown>)({
				costStudyId: studyId,
				organizationId,
				category: "slabs",
				subCategory: item.subCategory || "solid",
				name: newName,
				quantity: item.quantity,
				unit: "m2",
				dimensions: { ...item.dimensions, floor: currentFloor },
				concreteVolume: item.concreteVolume,
				concreteType: specs?.concreteType || "C30",
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
			`تم نسخ ${sourceItems.length} عنصر من ${selectedSource} إلى ${currentFloor}`,
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
						<SelectItem key={f.label} value={f.label}>
							{f.icon} {f.label} (
							{
								getFloorItems(
									f.label,
									floors[0]?.label === f.label,
								).length
							}{" "}
							عنصر)
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
