"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import type { MarkupMethod, PricingField, QuantityItem } from "../types";

interface LocalState {
	materialUnitPrice: number;
	laborUnitPrice: number;
	markupMethod: MarkupMethod;
	markupPercent: number;
	markupFixedAmount: number;
	manualUnitPrice: number;
	sellUnitPrice: number;
	sellTotalAmount: number;
	profitAmount: number;
	profitPercent: number;
	hasCustomMarkup: boolean;
}

const toState = (item: QuantityItem): LocalState => ({
	materialUnitPrice: Number(item.materialUnitPrice ?? 0),
	laborUnitPrice: Number(item.laborUnitPrice ?? 0),
	markupMethod: (item.markupMethod as MarkupMethod) || "percentage",
	markupPercent: Number(item.markupPercent ?? 30),
	markupFixedAmount: Number(item.markupFixedAmount ?? 0),
	manualUnitPrice: Number(item.manualUnitPrice ?? 0),
	sellUnitPrice: Number(item.sellUnitPrice ?? 0),
	sellTotalAmount: Number(item.sellTotalAmount ?? 0),
	profitAmount: Number(item.profitAmount ?? 0),
	profitPercent: Number(item.profitPercent ?? 0),
	hasCustomMarkup: item.hasCustomMarkup,
});

/**
 * Bi-directional pricing controller.
 *
 * Local state mirrors the canonical source rule from the backend solver:
 * - sell_unit_price / sell_total_amount edits → manual_price method
 *   (with implied markupPercent for display only).
 * - material/labor edits → keep current method, recompute sell.
 * - markup edits → switch method, set hasCustomMarkup=true.
 *
 * The mutation runs debounced (400ms). On success the server's authoritative
 * values overwrite local state. On error, useEffect re-syncs from props.
 */
export function useBiDirectionalPricing(item: QuantityItem) {
	const queryClient = useQueryClient();
	const [local, setLocal] = useState<LocalState>(() => toState(item));

	// Track which field is being edited so we don't overwrite mid-typing
	const isEditingRef = useRef(false);

	useEffect(() => {
		if (!isEditingRef.current) {
			setLocal(toState(item));
		}
	}, [item.id, item.updatedAt, item]);

	const mutation = useMutation(
		orpc.unifiedQuantities.pricing.updatePricing.mutationOptions({
			onSuccess: (result: any) => {
				if (result?.item) {
					setLocal(toState(result.item as QuantityItem));
				}
				queryClient.invalidateQueries({
					queryKey: orpc.unifiedQuantities.getItems.key(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.unifiedQuantities.pricing.getStudyTotals.key(),
				});
				isEditingRef.current = false;
			},
			onError: (err: Error) => {
				toast.error("فشل تحديث السعر: " + err.message);
				setLocal(toState(item));
				isEditingRef.current = false;
			},
		}),
	);

	const debouncedUpdate = useDebouncedCallback(
		(field: PricingField, value: number) => {
			mutation.mutate({
				organizationId: item.organizationId,
				id: item.id,
				changedField: field,
				newValue: value,
			} as never);
		},
		400,
	);

	// Separate path that bypasses the bi-directional solver (which always sets
	// hasCustomMarkup=true on any pricing field change). When the user toggles
	// the custom-markup switch OFF we use upsertItem to write
	// hasCustomMarkup=false explicitly; the server then re-prices the item via
	// the study's globalMarkupPercent.
	const revertMutation = useMutation(
		orpc.unifiedQuantities.upsertItem.mutationOptions({
			onSuccess: (result: any) => {
				if (result?.item) {
					setLocal(toState(result.item as QuantityItem));
				}
				queryClient.invalidateQueries({
					queryKey: orpc.unifiedQuantities.getItems.key(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.unifiedQuantities.pricing.getStudyTotals.key(),
				});
				isEditingRef.current = false;
			},
			onError: (err: Error) => {
				toast.error("فشل العودة للهامش العام: " + err.message);
				setLocal(toState(item));
				isEditingRef.current = false;
			},
		}),
	);

	const revertToGlobal = () => {
		isEditingRef.current = true;
		// Optimistic: mark local state as following global. The server response
		// (which recomputes via globalMarkupPercent) will overwrite this.
		setLocal((prev) => ({ ...prev, hasCustomMarkup: false }));
		revertMutation.mutate({
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
			markupMethod: "percentage",
			markupPercent: null,
			markupFixedAmount: null,
			manualUnitPrice: null,
			hasCustomMarkup: false,
			notes: item.notes,
		} as never);
	};

	const updateField = (field: PricingField, value: number) => {
		isEditingRef.current = true;

		setLocal((prev) => {
			const next: LocalState = { ...prev };
			const effectiveQty = Number(item.effectiveQuantity ?? 0);

			switch (field) {
				case "material_unit_price": {
					next.materialUnitPrice = Math.max(0, value);
					const cost = next.materialUnitPrice + next.laborUnitPrice;
					if (next.markupMethod === "percentage") {
						next.sellUnitPrice = cost * (1 + next.markupPercent / 100);
					} else if (next.markupMethod === "fixed_amount") {
						next.sellUnitPrice = cost + next.markupFixedAmount;
					}
					// manual_price keeps the manual price; only profit recomputes
					break;
				}
				case "labor_unit_price": {
					next.laborUnitPrice = Math.max(0, value);
					const cost = next.materialUnitPrice + next.laborUnitPrice;
					if (next.markupMethod === "percentage") {
						next.sellUnitPrice = cost * (1 + next.markupPercent / 100);
					} else if (next.markupMethod === "fixed_amount") {
						next.sellUnitPrice = cost + next.markupFixedAmount;
					}
					break;
				}
				case "markup_percent": {
					next.markupMethod = "percentage";
					next.markupPercent = value;
					next.hasCustomMarkup = true;
					next.sellUnitPrice =
						(next.materialUnitPrice + next.laborUnitPrice) *
						(1 + value / 100);
					break;
				}
				case "markup_fixed_amount": {
					next.markupMethod = "fixed_amount";
					next.markupFixedAmount = value;
					next.hasCustomMarkup = true;
					next.sellUnitPrice =
						next.materialUnitPrice + next.laborUnitPrice + value;
					break;
				}
				case "manual_unit_price": {
					next.markupMethod = "manual_price";
					next.manualUnitPrice = Math.max(0, value);
					next.sellUnitPrice = next.manualUnitPrice;
					next.hasCustomMarkup = true;
					break;
				}
				case "sell_unit_price": {
					// canonical-source rule: editing sell locks it as manual_price
					next.markupMethod = "manual_price";
					next.manualUnitPrice = Math.max(0, value);
					next.sellUnitPrice = next.manualUnitPrice;
					next.hasCustomMarkup = true;
					const cost = next.materialUnitPrice + next.laborUnitPrice;
					if (cost > 0) {
						next.markupPercent = ((value - cost) / cost) * 100;
					}
					break;
				}
				case "sell_total_amount": {
					if (effectiveQty > 0) {
						const newSellUnit = Math.max(0, value / effectiveQty);
						next.markupMethod = "manual_price";
						next.manualUnitPrice = newSellUnit;
						next.sellUnitPrice = newSellUnit;
						next.hasCustomMarkup = true;
						const cost = next.materialUnitPrice + next.laborUnitPrice;
						if (cost > 0) {
							next.markupPercent = ((newSellUnit - cost) / cost) * 100;
						}
					}
					break;
				}
			}

			next.sellTotalAmount = next.sellUnitPrice * effectiveQty;
			const totalCost =
				(next.materialUnitPrice + next.laborUnitPrice) * effectiveQty;
			next.profitAmount = next.sellTotalAmount - totalCost;
			next.profitPercent =
				next.sellTotalAmount > 0
					? (next.profitAmount / next.sellTotalAmount) * 100
					: 0;

			return next;
		});

		debouncedUpdate(field, value);
	};

	// Implied markup % when the canonical method is manual_price — useful as a
	// read-only display so the user still sees what their manual price means
	// in terms of margin on cost.
	const impliedMarkupPercent = useMemo(() => {
		const cost = local.materialUnitPrice + local.laborUnitPrice;
		if (cost <= 0 || local.sellUnitPrice <= 0) return null;
		return ((local.sellUnitPrice - cost) / cost) * 100;
	}, [local.materialUnitPrice, local.laborUnitPrice, local.sellUnitPrice]);

	return {
		...local,
		updateField,
		revertToGlobal,
		impliedMarkupPercent,
		isLoading: mutation.isPending || revertMutation.isPending,
	};
}
