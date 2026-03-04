"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Progress } from "@ui/components/progress";
import {
	Building2,
	CheckCircle2,
	Circle,
	FileText,
	FolderPlus,
	Receipt,
	Wallet,
	X,
	Shield,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function DashboardChecklist() {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const organizationSlug = activeOrganization?.slug ?? "";

	const { data: progress, isLoading } = useQuery({
		...orpc.onboarding.getProgress.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
	});

	const dismissMutation = useMutation(
		orpc.onboarding.dismissChecklist.mutationOptions(),
	);

	// Don't show if loading, no progress data, not wizard-completed, or already dismissed
	if (
		isLoading ||
		!progress ||
		!progress.wizardCompleted ||
		progress.checklistDismissed
	) {
		return null;
	}

	const items = [
		{
			key: "companyInfo",
			label: t("onboarding.checklist.companyInfo"),
			done: progress.companyInfoDone,
			icon: Building2,
			href: `/${organizationSlug}/settings/general` as string | null,
		},
		{
			key: "firstProject",
			label: t("onboarding.checklist.firstProject"),
			done: progress.firstProjectDone,
			icon: FolderPlus,
			href: `/${organizationSlug}/projects` as string | null,
		},
		{
			key: "firstQuantity",
			label: t("onboarding.checklist.firstQuantity"),
			done: progress.firstQuantityAdded,
			icon: FileText,
			href: null,
		},
		{
			key: "firstInvoice",
			label: t("onboarding.checklist.firstInvoice"),
			done: progress.firstInvoiceCreated,
			icon: Receipt,
			href: `/${organizationSlug}/finance/invoices` as string | null,
		},
		{
			key: "firstExpense",
			label: t("onboarding.checklist.firstExpense"),
			done: progress.firstExpenseRecorded,
			icon: Wallet,
			href: `/${organizationSlug}/finance/expenses` as string | null,
		},
		{
			key: "zatcaInfo",
			label: t("onboarding.checklist.zatcaInfo"),
			done: progress.zatcaInfoComplete,
			icon: Shield,
			href: `/${organizationSlug}/settings/general` as string | null,
		},
	];

	const completedCount = items.filter((item) => item.done).length;
	const totalCount = items.length;
	const progressPercent = Math.round((completedCount / totalCount) * 100);

	// All done — hide checklist
	if (completedCount === totalCount) return null;

	const handleDismiss = async () => {
		try {
			await dismissMutation.mutateAsync({ organizationId });
			queryClient.invalidateQueries({
				queryKey: orpc.onboarding.getProgress.queryOptions({
					input: { organizationId },
				}).queryKey,
			});
		} catch {
			// silently fail
		}
	};

	return (
		<Card className="mb-6">
			<CardHeader className="flex flex-row items-center justify-between pb-3">
				<CardTitle className="text-base font-semibold">
					{t("onboarding.checklist.title")}
				</CardTitle>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={handleDismiss}
				>
					<X className="h-4 w-4" />
				</Button>
			</CardHeader>
			<CardContent>
				<div className="mb-4 flex items-center gap-3">
					<Progress value={progressPercent} className="h-2 flex-1" />
					<span className="text-sm text-muted-foreground">
						{progressPercent}%
					</span>
				</div>

				<div className="space-y-2">
					{items.map((item) => {
						const content = (
							<div
								key={item.key}
								className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
									item.done
										? "opacity-60"
										: item.href
											? "hover:bg-muted/50 cursor-pointer"
											: ""
								}`}
							>
								{item.done ? (
									<CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
								) : (
									<Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
								)}
								<item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
								<span
									className={`flex-1 text-sm ${item.done ? "line-through" : "font-medium"}`}
								>
									{item.label}
								</span>
							</div>
						);

						if (!item.done && item.href) {
							return (
								<Link
									key={item.key}
									href={`/app${item.href}`}
									className="block"
								>
									{content}
								</Link>
							);
						}

						return <div key={item.key}>{content}</div>;
					})}
				</div>
			</CardContent>
		</Card>
	);
}
