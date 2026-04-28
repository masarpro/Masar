"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";

/**
 * Reads CostStudy fields needed by the unified workspace
 * (globalMarkupPercent, vatPercent, vatIncludedInPrices, cached totals).
 *
 * Reuses the existing pricing.studies.getById endpoint instead of
 * adding a unified-quantities-specific one.
 */
export function useCostStudy(studyId: string, organizationId: string) {
	const query = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: { id: studyId, organizationId },
			enabled: Boolean(studyId && organizationId),
		}),
	);

	const study = (query.data as Record<string, unknown> | undefined) ?? null;

	return {
		study,
		globalMarkupPercent: Number(study?.globalMarkupPercent ?? 30),
		vatPercent: Number(study?.vatPercent ?? 15),
		vatIncludedInPrices: Boolean(study?.vatIncludedInPrices ?? false),
		isLoading: query.isLoading,
	};
}
