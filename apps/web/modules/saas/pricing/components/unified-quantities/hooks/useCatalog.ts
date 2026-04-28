"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ItemCatalogEntry } from "../types";

/**
 * يجلب الكتالوج (102 بند) ويُجمّعه حسب domain → category للعرض.
 * مدة البقاء: 1 ساعة (الكتالوج ثابت).
 */
export function useCatalog(organizationId: string) {
	const query = useQuery(
		orpc.unifiedQuantities.getCatalog.queryOptions({
			input: { organizationId },
			enabled: Boolean(organizationId),
			staleTime: 1000 * 60 * 60, // 1h
			gcTime: 1000 * 60 * 60 * 24, // 24h
		}),
	);

	const entries = ((query.data as any)?.entries as ItemCatalogEntry[]) ?? [];

	const groupedByCategory = useMemo(() => {
		if (entries.length === 0) return null;
		const result: Record<string, Record<string, ItemCatalogEntry[]>> = {};

		for (const entry of entries) {
			if (!result[entry.domain]) result[entry.domain] = {};
			if (!result[entry.domain][entry.categoryKey]) {
				result[entry.domain][entry.categoryKey] = [];
			}
			result[entry.domain][entry.categoryKey].push(entry);
		}

		for (const dom of Object.keys(result)) {
			for (const cat of Object.keys(result[dom])) {
				result[dom][cat].sort((a, b) => a.displayOrder - b.displayOrder);
			}
		}

		return result;
	}, [entries]);

	return {
		entries,
		groupedByCategory,
		isLoading: query.isLoading,
		error: query.error as Error | null,
	};
}
