"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useEffect, useRef } from "react";

export function AccountingSeedCheck() {
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const queryClient = useQueryClient();
	const seeded = useRef(false);

	const { data: accounts, isSuccess } = useQuery({
		...orpc.accounting.accounts.list.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
	});

	const seedMutation = useMutation({
		...orpc.accounting.accounts.seed.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounting"] });
		},
	});

	useEffect(() => {
		const accountsList = accounts as unknown as unknown[] | undefined;
		if (
			isSuccess &&
			Array.isArray(accountsList) &&
			accountsList.length === 0 &&
			!seeded.current &&
			organizationId
		) {
			seeded.current = true;
			seedMutation.mutate({ organizationId } as never);
		}
	}, [isSuccess, accounts, organizationId]);

	return null;
}
