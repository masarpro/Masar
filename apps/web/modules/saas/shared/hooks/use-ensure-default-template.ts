"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcClient } from "@shared/lib/orpc-client";

/**
 * يضمن وجود قوالب افتراضية للمنظمة.
 * إذا لم يوجد قالب افتراضي، يبذر القوالب تلقائياً (مرة واحدة فقط).
 */
export function useEnsureDefaultTemplate(
	organizationId: string,
	defaultTemplate: unknown,
	isLoading: boolean,
) {
	const queryClient = useQueryClient();
	const seededRef = useRef(false);

	const seedMutation = useMutation({
		mutationFn: () =>
			orpcClient.company.templates.seed({ organizationId }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["company", "templates"],
			});
		},
	});

	useEffect(() => {
		if (
			!isLoading &&
			defaultTemplate === null &&
			!seededRef.current &&
			!seedMutation.isPending
		) {
			seededRef.current = true;
			seedMutation.mutate();
		}
	}, [defaultTemplate, isLoading, seedMutation.isPending]);
}
