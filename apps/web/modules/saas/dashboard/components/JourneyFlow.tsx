"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	Building2,
	FolderPlus,
	Receipt,
	Users,
	Bot,
	Calculator,
	CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

const JOURNEY_DISMISSED_KEY = "masar-journey-dismissed";

interface JourneyStep {
	key: string;
	labelKey: string;
	icon: typeof Building2;
	done: boolean;
	href: string;
}

export function JourneyFlow({ compact = false }: { compact?: boolean }) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const organizationSlug = activeOrganization?.slug ?? "";

	const [dismissed, setDismissed] = useState(() => {
		if (typeof window === "undefined") return false;
		return localStorage.getItem(`${JOURNEY_DISMISSED_KEY}-${organizationId}`) === "true";
	});

	const { data: progress } = useQuery({
		...orpc.onboarding.getProgress.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
	});

	if (!progress || dismissed) return null;

	const steps: JourneyStep[] = [
		{
			key: "companyInfo",
			labelKey: "dashboard.journey.step1",
			icon: Building2,
			done: progress.companyInfoDone,
			href: `/app/${organizationSlug}/settings/general`,
		},
		{
			key: "firstProject",
			labelKey: "dashboard.journey.step2",
			icon: FolderPlus,
			done: progress.firstProjectDone,
			href: `/app/${organizationSlug}/projects/new`,
		},
		{
			key: "firstInvoice",
			labelKey: "dashboard.journey.step3",
			icon: Receipt,
			done: progress.firstInvoiceCreated,
			href: `/app/${organizationSlug}/finance/invoices/new`,
		},
		{
			key: "inviteTeam",
			labelKey: "dashboard.journey.step4",
			icon: Users,
			done: progress.teamInviteDone,
			href: `/app/${organizationSlug}/settings/members`,
		},
		{
			key: "aiAssistant",
			labelKey: "dashboard.journey.step5",
			icon: Bot,
			done: false,
			href: "/app/chatbot",
		},
		{
			key: "firstQuantity",
			labelKey: "dashboard.journey.step6",
			icon: Calculator,
			done: progress.firstQuantityAdded,
			href: `/app/${organizationSlug}/quantities`,
		},
	];

	const completedCount = steps.filter((s) => s.done).length;
	const totalCount = steps.length;

	// All done or checklist dismissed — hide
	if (completedCount === totalCount || progress.checklistDismissed) return null;

	// Find next uncompleted step
	const nextStepIdx = steps.findIndex((s) => !s.done);

	const stepsContent = (
		<div className="flex items-center gap-1 overflow-x-auto pb-1">
			{steps.map((step, idx) => {
				const Icon = step.icon;
				const isActive = idx === nextStepIdx;
				const isPast = step.done;

				return (
					<div key={step.key} className="flex items-center shrink-0">
						{isPast ? (
							<div className="flex flex-col items-center gap-1">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
									<CheckCircle2 className="h-4 w-4 text-green-500" />
								</div>
								<span className="text-[9px] text-gray-400 line-through max-w-[60px] text-center truncate">
									{t(step.labelKey)}
								</span>
							</div>
						) : isActive ? (
							<Link
								href={step.href}
								className="flex flex-col items-center gap-1 group"
							>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 ring-2 ring-blue-400 ring-offset-1 dark:bg-blue-900/30 dark:ring-blue-500 transition-transform group-hover:scale-110">
									<Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
								</div>
								<span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 max-w-[60px] text-center truncate">
									{t(step.labelKey)}
								</span>
							</Link>
						) : (
							<div className="flex flex-col items-center gap-1 opacity-40">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
									<Icon className="h-4 w-4 text-gray-400" />
								</div>
								<span className="text-[9px] text-gray-400 max-w-[60px] text-center truncate">
									{t(step.labelKey)}
								</span>
							</div>
						)}

						{idx < steps.length - 1 && (
							<div
								className={`mx-1.5 h-0.5 w-6 rounded-full shrink-0 ${
									isPast ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"
								}`}
							/>
						)}
					</div>
				);
			})}
		</div>
	);

	// Compact mode: return steps only, no card wrapper
	if (compact) {
		return stepsContent;
	}

	// Full mode: wrapped in card with header
	return (
		<div className="rounded-xl border bg-card shadow-sm p-3 animate-in fade-in slide-in-from-top-3 duration-500">
			<div className="flex items-center justify-between mb-3">
				<span className="text-xs font-medium text-muted-foreground">
					{t("dashboard.journey.counter", {
						completed: completedCount,
						total: totalCount,
					})}
				</span>
				<button
					onClick={() => {
						if (typeof window !== "undefined") {
							localStorage.setItem(`${JOURNEY_DISMISSED_KEY}-${organizationId}`, "true");
						}
						setDismissed(true);
					}}
					className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
					type="button"
				>
					{t("dashboard.welcome.skip")}
				</button>
			</div>
			{stepsContent}
		</div>
	);
}

/**
 * Hook to get journey step data for use in the smart header.
 * Returns completed/incomplete steps and the quick links to render.
 */
export function useJourneySteps() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const organizationSlug = activeOrganization?.slug ?? "";

	const { data: progress } = useQuery({
		...orpc.onboarding.getProgress.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
	});

	if (!progress) {
		return { completedCount: 0, totalCount: 6, incompleteSteps: [], progress: null };
	}

	const steps = [
		{
			key: "companyInfo",
			labelKey: "dashboard.journey.step1",
			done: progress.companyInfoDone,
			href: `/app/${organizationSlug}/settings/general`,
		},
		{
			key: "firstProject",
			labelKey: "dashboard.journey.step2",
			done: progress.firstProjectDone,
			href: `/app/${organizationSlug}/projects/new`,
		},
		{
			key: "firstInvoice",
			labelKey: "dashboard.journey.step3",
			done: progress.firstInvoiceCreated,
			href: `/app/${organizationSlug}/finance/invoices/new`,
		},
		{
			key: "inviteTeam",
			labelKey: "dashboard.journey.step4",
			done: progress.teamInviteDone,
			href: `/app/${organizationSlug}/settings/members`,
		},
		{
			key: "aiAssistant",
			labelKey: "dashboard.journey.step5",
			done: false,
			href: "/app/chatbot",
		},
		{
			key: "firstQuantity",
			labelKey: "dashboard.journey.step6",
			done: progress.firstQuantityAdded,
			href: `/app/${organizationSlug}/quantities`,
		},
	];

	const completedCount = steps.filter((s) => s.done).length;
	const incompleteSteps = steps.filter((s) => !s.done).slice(0, 2);

	return { completedCount, totalCount: steps.length, incompleteSteps, progress };
}
