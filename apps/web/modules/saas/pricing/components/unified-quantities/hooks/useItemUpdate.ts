"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import type { QuantityItem } from "../types";

/**
 * For non-pricing fields (dimensions, wastage, specs, links) we POST the
 * full upsert payload. Debounced 400ms; broad invalidation on settle.
 */
export function useItemUpdate(item: QuantityItem) {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		orpc.unifiedQuantities.upsertItem.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.unifiedQuantities.getItems.key(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.unifiedQuantities.pricing.getStudyTotals.key(),
				});
			},
			onError: (err: Error) => toast.error("فشل التحديث: " + err.message),
		}),
	);

	const buildPayload = (override: Record<string, unknown>) => ({
		id: item.id,
		costStudyId: item.costStudyId,
		organizationId: item.organizationId,
		domain: item.domain,
		categoryKey: item.categoryKey,
		catalogItemKey: item.catalogItemKey,
		displayName: item.displayName,
		sortOrder: item.sortOrder,
		isEnabled: item.isEnabled,
		primaryValue: item.primaryValue,
		secondaryValue: item.secondaryValue,
		tertiaryValue: item.tertiaryValue,
		calculationMethod: item.calculationMethod,
		unit: item.unit,
		wastagePercent: Number(item.wastagePercent ?? 0),
		contextSpaceId: item.contextSpaceId,
		contextScope: item.contextScope,
		deductOpenings: item.deductOpenings,
		linkedFromItemId: item.linkedFromItemId,
		linkQuantityFormula: item.linkQuantityFormula,
		linkPercentValue: item.linkPercentValue,
		specMaterialName: item.specMaterialName,
		specMaterialBrand: item.specMaterialBrand,
		specMaterialGrade: item.specMaterialGrade,
		specColor: item.specColor,
		specSource: item.specSource,
		specNotes: item.specNotes,
		materialUnitPrice: item.materialUnitPrice,
		laborUnitPrice: item.laborUnitPrice,
		markupMethod: item.markupMethod,
		markupPercent: item.markupPercent,
		markupFixedAmount: item.markupFixedAmount,
		manualUnitPrice: item.manualUnitPrice,
		hasCustomMarkup: item.hasCustomMarkup,
		notes: item.notes,
		...override,
	});

	const debouncedSave = useDebouncedCallback(
		(override: Record<string, unknown>) => {
			mutation.mutate(buildPayload(override) as never);
		},
		400,
	);

	const saveImmediate = (override: Record<string, unknown>) => {
		mutation.mutate(buildPayload(override) as never);
	};

	return {
		debouncedSave,
		saveImmediate,
		isLoading: mutation.isPending,
	};
}
