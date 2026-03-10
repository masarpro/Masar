"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ═══ Queries ═══

export function useProjectBOQList(
	organizationId: string,
	projectId: string,
	filters: {
		limit?: number;
		offset?: number;
		section?: string;
		sourceType?: string;
		phaseId?: string;
		isPriced?: boolean;
		search?: string;
		sortBy?: string;
		sortDirection?: "asc" | "desc";
	} = {},
) {
	return useQuery(
		orpc.projectBoq.list.queryOptions({
			input: {
				organizationId,
				projectId,
				...filters,
			} as any,
		}),
	);
}

export function useProjectBOQSummary(
	organizationId: string,
	projectId: string,
) {
	return useQuery(
		orpc.projectBoq.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);
}

export function useProjectBOQUnpriced(
	organizationId: string,
	projectId: string,
) {
	return useQuery(
		orpc.projectBoq.getUnpricedItems.queryOptions({
			input: { organizationId, projectId },
		}),
	);
}

export function useProjectBOQByPhase(
	organizationId: string,
	projectId: string,
) {
	return useQuery(
		orpc.projectBoq.getByPhase.queryOptions({
			input: { organizationId, projectId },
		}),
	);
}

export function useAvailableCostStudies(
	organizationId: string,
	projectId: string,
	search?: string,
) {
	return useQuery(
		orpc.projectBoq.getAvailableCostStudies.queryOptions({
			input: { organizationId, projectId, search },
		}),
	);
}

export function useAvailableQuotations(
	organizationId: string,
	projectId: string,
	search?: string,
) {
	return useQuery(
		orpc.projectBoq.getAvailableQuotations.queryOptions({
			input: { organizationId, projectId, search },
		}),
	);
}

// ═══ Mutations ═══

function useInvalidateBOQ() {
	const queryClient = useQueryClient();
	return () => {
		queryClient.invalidateQueries({ queryKey: [["projectBoq"]] });
	};
}

export function useCreateBOQItem() {
	const invalidate = useInvalidateBOQ();
	return useMutation({
		mutationFn: (data: Parameters<typeof orpcClient.projectBoq.create>[0]) =>
			orpcClient.projectBoq.create(data),
		onSuccess: invalidate,
	});
}

export function useBulkCreateBOQItems() {
	const invalidate = useInvalidateBOQ();
	return useMutation({
		mutationFn: (
			data: Parameters<typeof orpcClient.projectBoq.bulkCreate>[0],
		) => orpcClient.projectBoq.bulkCreate(data),
		onSuccess: invalidate,
	});
}

export function useUpdateBOQItem() {
	const invalidate = useInvalidateBOQ();
	return useMutation({
		mutationFn: (data: Parameters<typeof orpcClient.projectBoq.update>[0]) =>
			orpcClient.projectBoq.update(data),
		onSuccess: invalidate,
	});
}

export function useDeleteBOQItem() {
	const invalidate = useInvalidateBOQ();
	return useMutation({
		mutationFn: (
			data: Parameters<typeof orpcClient.projectBoq.delete>[0],
		) => orpcClient.projectBoq.delete(data),
		onSuccess: invalidate,
	});
}

export function useBulkDeleteBOQItems() {
	const invalidate = useInvalidateBOQ();
	return useMutation({
		mutationFn: (
			data: Parameters<typeof orpcClient.projectBoq.bulkDelete>[0],
		) => orpcClient.projectBoq.bulkDelete(data),
		onSuccess: invalidate,
	});
}

export function useBulkUpdatePrices() {
	const invalidate = useInvalidateBOQ();
	return useMutation({
		mutationFn: (
			data: Parameters<typeof orpcClient.projectBoq.bulkUpdatePrices>[0],
		) => orpcClient.projectBoq.bulkUpdatePrices(data),
		onSuccess: invalidate,
	});
}

export function useReorderBOQItems() {
	const invalidate = useInvalidateBOQ();
	return useMutation({
		mutationFn: (
			data: Parameters<typeof orpcClient.projectBoq.reorder>[0],
		) => orpcClient.projectBoq.reorder(data),
		onSuccess: invalidate,
	});
}

export function useAssignPhase() {
	const invalidate = useInvalidateBOQ();
	return useMutation({
		mutationFn: (
			data: Parameters<typeof orpcClient.projectBoq.assignPhase>[0],
		) => orpcClient.projectBoq.assignPhase(data),
		onSuccess: invalidate,
	});
}

export function useCopyFromCostStudy() {
	const invalidate = useInvalidateBOQ();
	return useMutation({
		mutationFn: (
			data: Parameters<typeof orpcClient.projectBoq.copyFromCostStudy>[0],
		) => orpcClient.projectBoq.copyFromCostStudy(data),
		onSuccess: invalidate,
	});
}

export function useCopyFromQuotation() {
	const invalidate = useInvalidateBOQ();
	return useMutation({
		mutationFn: (
			data: Parameters<typeof orpcClient.projectBoq.copyFromQuotation>[0],
		) => orpcClient.projectBoq.copyFromQuotation(data),
		onSuccess: invalidate,
	});
}

export function useImportBOQData() {
	const invalidate = useInvalidateBOQ();
	return useMutation({
		mutationFn: (
			data: Parameters<typeof orpcClient.projectBoq.importFromData>[0],
		) => orpcClient.projectBoq.importFromData(data),
		onSuccess: invalidate,
	});
}
