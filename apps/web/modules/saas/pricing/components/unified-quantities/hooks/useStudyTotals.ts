"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";

interface Options {
	costStudyId: string;
	organizationId: string;
}

export function useStudyTotals({ costStudyId, organizationId }: Options) {
	const query = useQuery(
		orpc.unifiedQuantities.pricing.getStudyTotals.queryOptions({
			input: { costStudyId, organizationId },
			enabled: Boolean(costStudyId && organizationId),
			staleTime: 0,
		}),
	);

	const totals = (query.data as any)?.studyTotals ?? null;

	return {
		totals,
		isLoading: query.isLoading,
	};
}
