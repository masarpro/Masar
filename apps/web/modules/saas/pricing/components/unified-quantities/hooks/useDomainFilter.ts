"use client";

import { useCallback, useMemo, useState } from "react";
import type { Domain, QuantityItem } from "../types";

const DOMAIN_LIST: Domain[] = ["FINISHING", "MEP", "EXTERIOR", "SPECIAL"];

/**
 * State + helpers for the domain filter chips. selectedDomains is a Set —
 * empty means "show all". Hook computes per-domain counts from the items
 * array so the chips can show counts and hide empty domains.
 */
export function useDomainFilter(items: QuantityItem[]) {
	const [selectedDomains, setSelectedDomains] = useState<Set<Domain>>(
		new Set(),
	);

	const toggleDomain = useCallback((d: Domain) => {
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
		const counts: Record<Domain, number> = {
			FINISHING: 0,
			MEP: 0,
			EXTERIOR: 0,
			SPECIAL: 0,
		};
		for (const item of items) {
			const d = item.domain as Domain;
			if (DOMAIN_LIST.includes(d)) counts[d]++;
		}
		return counts;
	}, [items]);

	const filteredItems = useMemo(() => {
		if (selectedDomains.size === 0) return items;
		return items.filter((it) => selectedDomains.has(it.domain as Domain));
	}, [items, selectedDomains]);

	return {
		selectedDomains,
		toggleDomain,
		clearDomains,
		domainCounts,
		filteredItems,
	};
}
