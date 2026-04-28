"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Options {
	costStudyId: string;
	organizationId: string;
}

/**
 * Central hook for the Unified Quantities workspace.
 * Wraps getItems query + 5 write mutations with optimistic updates,
 * Arabic toasts, and broad invalidation across getItems +
 * pricing.getStudyTotals + context.get on every settled write.
 */
export function useUnifiedQuantities({ costStudyId, organizationId }: Options) {
	const queryClient = useQueryClient();

	// === Queries ===
	const itemsQueryOptions = orpc.unifiedQuantities.getItems.queryOptions({
		input: { costStudyId, organizationId },
		enabled: Boolean(costStudyId && organizationId),
	});
	const itemsQuery = useQuery(itemsQueryOptions);

	const itemsQueryKey = itemsQueryOptions.queryKey;

	const invalidateAll = () => {
		queryClient.invalidateQueries({ queryKey: orpc.unifiedQuantities.getItems.key() });
		queryClient.invalidateQueries({
			queryKey: orpc.unifiedQuantities.pricing.getStudyTotals.key(),
		});
		queryClient.invalidateQueries({
			queryKey: orpc.unifiedQuantities.context.get.key(),
		});
	};

	// === Mutations ===
	const upsertItem = useMutation(
		orpc.unifiedQuantities.upsertItem.mutationOptions({
			onMutate: async (newData: any) => {
				await queryClient.cancelQueries({ queryKey: itemsQueryKey });
				const previous = queryClient.getQueryData(itemsQueryKey);

				if (newData?.id && previous) {
					queryClient.setQueryData(itemsQueryKey, (old: any) => ({
						...old,
						items:
							old?.items?.map((i: any) =>
								i.id === newData.id ? { ...i, ...newData } : i,
							) ?? [],
					}));
				}
				return { previous };
			},
			onError: (err: Error, _vars, context: any) => {
				if (context?.previous) {
					queryClient.setQueryData(itemsQueryKey, context.previous);
				}
				toast.error("فشل حفظ البند: " + err.message);
			},
			onSettled: invalidateAll,
		}),
	);

	const deleteItem = useMutation(
		orpc.unifiedQuantities.deleteItem.mutationOptions({
			onSuccess: () => {
				invalidateAll();
				toast.success("تم حذف البند");
			},
			onError: (err: Error) => toast.error("فشل الحذف: " + err.message),
		}),
	);

	const duplicateItem = useMutation(
		orpc.unifiedQuantities.duplicateItem.mutationOptions({
			onSuccess: () => {
				invalidateAll();
				toast.success("تم نسخ البند");
			},
			onError: (err: Error) => toast.error("فشل النسخ: " + err.message),
		}),
	);

	const reorderItems = useMutation(
		orpc.unifiedQuantities.reorderItems.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.unifiedQuantities.getItems.key(),
				});
			},
			onError: (err: Error) => toast.error("فشل إعادة الترتيب: " + err.message),
		}),
	);

	const applyPreset = useMutation(
		orpc.unifiedQuantities.applyPreset.mutationOptions({
			onSuccess: (result: any) => {
				invalidateAll();
				const count = result?.itemsCreated ?? 0;
				toast.success(`تمت إضافة ${count} بند من الباقة`);
			},
			onError: (err: Error) => toast.error("فشل تطبيق الباقة: " + err.message),
		}),
	);

	return {
		items: (itemsQuery.data as any)?.items ?? [],
		isLoading: itemsQuery.isLoading,
		error: itemsQuery.error,

		upsertItem: upsertItem.mutateAsync,
		deleteItem: deleteItem.mutateAsync,
		duplicateItem: duplicateItem.mutateAsync,
		reorderItems: reorderItems.mutateAsync,
		applyPreset: applyPreset.mutateAsync,

		isUpserting: upsertItem.isPending,
		isDeleting: deleteItem.isPending,
	};
}
