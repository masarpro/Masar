"use client";

import { useTranslations } from "next-intl";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useAccountingMode } from "@saas/finance/hooks/use-accounting-mode";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Calculator } from "lucide-react";
import { cn } from "@ui/lib";

export function AccountingModeToggle() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const { isEnabled, toggle, enable } = useAccountingMode(organizationId);
	const queryClient = useQueryClient();

	const { data: accounts } = useQuery({
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

	const handleToggle = async () => {
		if (!isEnabled) {
			// Enabling — check if chart of accounts exists
			if (!accounts || accounts.length === 0) {
				// Seed first, then enable
				seedMutation.mutate(
					{ organizationId },
					{
						onSuccess: () => {
							enable();
						},
					},
				);
				return;
			}
		}
		toggle();
	};

	if (!organizationId) return null;

	return (
		<button
			type="button"
			onClick={handleToggle}
			disabled={seedMutation.isPending}
			className={cn(
				"flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
				isEnabled
					? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
					: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700",
			)}
		>
			<Calculator className="h-3.5 w-3.5" />
			<span>{t("finance.accounting.accountingMode")}</span>
			<div
				className={cn(
					"relative w-7 h-4 rounded-full transition-colors",
					isEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600",
				)}
			>
				<div
					className={cn(
						"absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all",
						isEnabled ? "start-0.5" : "end-0.5",
					)}
				/>
			</div>
		</button>
	);
}
