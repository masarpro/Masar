"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";

export interface Preset {
	key: string;
	nameAr: string;
	nameEn: string;
	descriptionAr?: string;
	descriptionEn?: string;
	icon: string;
	itemKeys: string[];
}

/**
 * يجلب الـ 8 presets من الكتالوج (presets.ts على الخلفية).
 */
export function usePresets(organizationId: string) {
	const query = useQuery(
		orpc.unifiedQuantities.getPresets.queryOptions({
			input: { organizationId },
			enabled: Boolean(organizationId),
			staleTime: 1000 * 60 * 60,
		}),
	);

	return {
		presets: ((query.data as any)?.presets as Preset[]) ?? [],
		isLoading: query.isLoading,
	};
}
