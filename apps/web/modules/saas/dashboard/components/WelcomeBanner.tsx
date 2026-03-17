"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Rocket, ChevronLeft, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

const WELCOME_SKIPPED_KEY = "masar-welcome-skipped";

interface OnboardingStep {
	key: string;
	labelKey: string;
	done: boolean;
	href: string;
}

export function WelcomeBanner() {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const organizationSlug = activeOrganization?.slug ?? "";

	const [skipped, setSkipped] = useState(() => {
		if (typeof window === "undefined") return false;
		return localStorage.getItem(`${WELCOME_SKIPPED_KEY}-${organizationId}`) === "true";
	});

	const { data: progress, isLoading } = useQuery({
		...orpc.onboarding.getProgress.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
	});

	const dismissMutation = useMutation(
		orpc.onboarding.dismissChecklist.mutationOptions(),
	);

	if (isLoading || !progress || skipped) return null;

	const steps: OnboardingStep[] = [
		{
			key: "companyInfo",
			labelKey: "dashboard.welcome.steps.companyInfo",
			done: progress.companyInfoDone,
			href: `/app/${organizationSlug}/settings/general`,
		},
		{
			key: "firstProject",
			labelKey: "dashboard.welcome.steps.firstProject",
			done: progress.firstProjectDone,
			href: `/app/${organizationSlug}/projects/new`,
		},
		{
			key: "firstInvoice",
			labelKey: "dashboard.welcome.steps.firstInvoice",
			done: progress.firstInvoiceCreated,
			href: `/app/${organizationSlug}/finance/invoices/new`,
		},
		{
			key: "firstExpense",
			labelKey: "dashboard.welcome.steps.firstExpense",
			done: progress.firstExpenseRecorded,
			href: `/app/${organizationSlug}/finance/expenses/new`,
		},
		{
			key: "zatcaInfo",
			labelKey: "dashboard.welcome.steps.zatcaInfo",
			done: progress.zatcaInfoComplete,
			href: `/app/${organizationSlug}/settings/general`,
		},
		{
			key: "firstQuantity",
			labelKey: "dashboard.welcome.steps.firstQuantity",
			done: progress.firstQuantityAdded,
			href: `/app/${organizationSlug}/quantities`,
		},
	];

	const completedCount = steps.filter((s) => s.done).length;
	const totalCount = steps.length;
	const progressPercent = Math.round((completedCount / totalCount) * 100);

	// All completed or checklist dismissed — don't show
	if (completedCount === totalCount || progress.checklistDismissed) return null;

	// Find next uncompleted step
	const nextStep = steps.find((s) => !s.done);

	const handleSkip = () => {
		if (typeof window !== "undefined") {
			localStorage.setItem(`${WELCOME_SKIPPED_KEY}-${organizationId}`, "true");
		}
		setSkipped(true);
	};

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
		<div className="rounded-xl border border-blue-100 bg-gradient-to-l from-blue-50 to-sky-50 p-4 dark:border-blue-900/30 dark:from-blue-950/20 dark:to-sky-950/20 animate-in fade-in slide-in-from-top-3 duration-500">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
						<Rocket className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<h3 className="text-sm font-bold text-foreground">
							{t("dashboard.welcome.title")}
						</h3>
						<p className="text-xs text-muted-foreground">
							{t("dashboard.welcome.progress", {
								completed: completedCount,
								total: totalCount,
							})}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={handleSkip}
						className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
						type="button"
					>
						{t("dashboard.welcome.skip")}
					</button>
					<button
						onClick={handleDismiss}
						className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-200/50 hover:text-gray-600 transition-colors"
						type="button"
						aria-label={t("dashboard.welcome.hide")}
					>
						<X className="h-3.5 w-3.5" />
					</button>
				</div>
			</div>

			{/* Progress bar */}
			<div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/30">
				<div
					className="h-full rounded-full bg-blue-500 transition-all duration-1000 ease-out"
					style={{ width: `${progressPercent}%` }}
				/>
			</div>

			{/* Next step CTA */}
			{nextStep && (
				<div className="mt-3 flex items-center justify-between">
					<span className="text-xs text-muted-foreground">
						{t("dashboard.welcome.nextStep")}:
					</span>
					<Link
						href={nextStep.href}
						className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
					>
						{t(nextStep.labelKey)}
						<ChevronLeft className="h-3 w-3" />
					</Link>
				</div>
			)}
		</div>
	);
}
