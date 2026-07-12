"use client";

import { useCallback, useMemo, useState } from "react";
import type { QuantityItem } from "../types";

/**
 * State + helpers for the domain filter chips. selectedDomains is a Set —
 * empty means "show all". Hook computes per-domain counts from the items
 * array so the chips can show counts and hide empty domains. Counts are
 * keyed by whatever domain strings actually exist on the items, so an item
 * never disappears from the chips even if its domain is outside the four
 * canonical ones.
 */
export function useDomainFilter(items: QuantityItem[]) {
	const [selectedDomains, setSelectedDomains] = useState<Set<string>>(
		new Set(),
	);

	const toggleDomain = useCallback((d: string) => {
		setSelectedDomains((prev) => {
			const next = new Set(prev);
			if (next.has(d)) next.delete(d);
			else next.add(d);
			return next;
		});
	}, []);

	const clearDomains = useCallback(() => {
		setSelectedDomains(new Set());
	}, []);

	const domainCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const item of items) {
			counts[item.domain] = (counts[item.domain] ?? 0) + 1;
		}
		return counts;
	}, [items]);

	const filteredItems = useMemo(() => {
		if (selectedDomains.size === 0) return items;
		return items.filter((it) => selectedDomains.has(it.domain));
	}, [items, selectedDomains]);

	return {
		selectedDomains,
		toggleDomain,
		clearDomains,
		domainCounts,
		filteredItems,
	};
}
