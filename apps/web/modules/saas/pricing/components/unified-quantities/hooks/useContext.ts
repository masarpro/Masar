"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Options {
	costStudyId: string;
	organizationId: string;
}

interface ContextSpace {
	id: string;
	name: string;
	spaceType: string;
	floorLabel: string | null;
	length: number | string | null;
	width: number | string | null;
	height: number | string | null;
	floorArea: number | string | null;
	wallPerimeter: number | string | null;
	computedFloorArea: number | string | null;
	computedWallArea: number | string | null;
	isWetArea: boolean;
	isExterior: boolean;
	sortOrder: number;
}

interface ContextOpening {
	id: string;
	name: string;
	openingType: string;
	width: number | string;
	height: number | string;
	computedArea: number | string;
	count: number;
	isExterior: boolean;
	deductFromInteriorFinishes: boolean;
	spaceId: string | null;
}

interface ContextRecord {
	id: string;
	totalFloorArea: number | string | null;
	totalWallArea: number | string | null;
	totalExteriorWallArea: number | string | null;
	totalRoofArea: number | string | null;
	totalPerimeter: number | string | null;
	averageFloorHeight: number | string | null;
	hasBasement: boolean;
	hasRoof: boolean;
	hasYard: boolean;
	yardArea: number | string | null;
	fenceLength: number | string | null;
	generalNotes: string | null;
	spaces: ContextSpace[];
	openings: ContextOpening[];
}

export function useUnifiedContext({ costStudyId, organizationId }: Options) {
	const queryClient = useQueryClient();

	const query = useQuery(
		orpc.unifiedQuantities.context.get.queryOptions({
			input: { costStudyId, organizationId },
			enabled: Boolean(costStudyId && organizationId),
		}),
	);

	const context = ((query.data as any)?.context as ContextRecord | null) ?? null;

	const invalidate = () => {
		queryClient.invalidateQueries({
			queryKey: orpc.unifiedQuantities.context.get.key(),
		});
		queryClient.invalidateQueries({
			queryKey: orpc.unifiedQuantities.pricing.getStudyTotals.key(),
		});
	};

	const updateContext = useMutation(
		orpc.unifiedQuantities.context.update.mutationOptions({
			onSuccess: () => {
				invalidate();
			},
			onError: (err: Error) =>
				toast.error("فشل تحديث السياق: " + err.message),
		}),
	);

	const upsertSpace = useMutation(
		orpc.unifiedQuantities.context.upsertSpace.mutationOptions({
			onSuccess: () => {
				invalidate();
				toast.success("تم حفظ الغرفة");
			},
			onError: (err: Error) =>
				toast.error("فشل حفظ الغرفة: " + err.message),
		}),
	);

	const deleteSpace = useMutation(
		orpc.unifiedQuantities.context.deleteSpace.mutationOptions({
			onSuccess: () => {
				invalidate();
				toast.success("تم حذف الغرفة");
			},
			onError: (err: Error) =>
				toast.error("فشل حذف الغرفة: " + err.message),
		}),
	);

	const upsertOpening = useMutation(
		orpc.unifiedQuantities.context.upsertOpening.mutationOptions({
			onSuccess: () => {
				invalidate();
				toast.success("تم حفظ الفتحة");
			},
			onError: (err: Error) =>
				toast.error("فشل حفظ الفتحة: " + err.message),
		}),
	);

	const deleteOpening = useMutation(
		orpc.unifiedQuantities.context.deleteOpening.mutationOptions({
			onSuccess: () => {
				invalidate();
				toast.success("تم حذف الفتحة");
			},
			onError: (err: Error) =>
				toast.error("فشل حذف الفتحة: " + err.message),
		}),
	);

	return {
		context,
		isLoading: query.isLoading,
		updateContext: updateContext.mutateAsync,
		upsertSpace: upsertSpace.mutateAsync,
		deleteSpace: deleteSpace.mutateAsync,
		upsertOpening: upsertOpening.mutateAsync,
		deleteOpening: deleteOpening.mutateAsync,
	};
}

export type { ContextRecord, ContextSpace, ContextOpening };
