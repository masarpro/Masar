"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Fragment, useState } from "react";

const JOURNEY_DISMISSED_KEY = "masar-journey-dismissed";

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

	const steps = [
		{ key: "companyInfo", labelKey: "dashboard.journey.step1", done: progress.companyInfoDone, href: `/app/${organizationSlug}/settings/general` },
		{ key: "firstProject", labelKey: "dashboard.journey.step2", done: progress.firstProjectDone, href: `/app/${organizationSlug}/projects/new` },
		{ key: "firstInvoice", labelKey: "dashboard.journey.step3", done: progress.firstInvoiceCreated, href: `/app/${organizationSlug}/finance/invoices/new` },
		{ key: "inviteTeam", labelKey: "dashboard.journey.step4", done: progress.teamInviteDone, href: `/app/${organizationSlug}/settings/members` },
		{ key: "aiAssistant", labelKey: "dashboard.journey.step5", done: false, href: "/app/chatbot" },
		{ key: "firstQuantity", labelKey: "dashboard.journey.step6", done: progress.firstQuantityAdded, href: `/app/${organizationSlug}/quantities` },
	];

	const completedCount = steps.filter((s) => s.done).length;
	const totalCount = steps.length;

	if (completedCount === totalCount || progress.checklistDismissed) return null;

	const nextStepIdx = steps.findIndex((s) => !s.done);

	// ── Compact: small dots only, text under active step only ──
	if (compact) {
		return (
			<div className="flex items-center gap-0" style={{ direction: "ltr" }}>
				{steps.map((step, idx) => {
					const isActive = idx === nextStepIdx;
					const isPast = step.done;

					return (
						<Fragment key={step.key}>
							{/* Dot */}
							{isPast ? (
								<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500">
									<Check className="h-3 w-3 text-white" strokeWidth={3} />
								</div>
							) : isActive ? (
								<Link href={step.href} className="group flex items-center gap-1.5 shrink-0">
									<div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 ring-2 ring-blue-200 dark:ring-blue-800 text-[10px] font-bold text-white transition-transform group-hover:scale-110">
										{idx + 1}
									</div>
									<span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
										{t(step.labelKey)}
									</span>
								</Link>
							) : (
								<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] font-bold text-gray-400">
									{idx + 1}
								</div>
							)}

							{/* Connector */}
							{idx < steps.length - 1 && !isActive && (
								<div className={`h-0.5 w-6 shrink-0 mx-0.5 ${isPast ? "bg-emerald-400" : "bg-gray-200 dark:bg-gray-700"}`} />
							)}
						</Fragment>
					);
				})}
			</div>
		);
	}

	// ── Full: card wrapper ──
	return (
		<div className="rounded-xl border bg-card shadow-sm p-3 animate-in fade-in slide-in-from-top-3 duration-500">
			<div className="flex items-center justify-between mb-3">
				<span className="text-xs font-medium text-muted-foreground">
					{t("dashboard.journey.counter", { completed: completedCount, total: totalCount })}
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
			<div className="flex items-center gap-0" style={{ direction: "ltr" }}>
				{steps.map((step, idx) => {
					const isActive = idx === nextStepIdx;
					const isPast = step.done;
					return (
						<Fragment key={step.key}>
							{isPast ? (
								<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500">
									<Check className="h-3 w-3 text-white" strokeWidth={3} />
								</div>
							) : isActive ? (
								<Link href={step.href} className="group flex items-center gap-1.5 shrink-0">
									<div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 ring-2 ring-blue-200 dark:ring-blue-800 text-[10px] font-bold text-white transition-transform group-hover:scale-110">
										{idx + 1}
									</div>
									<span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
										{t(step.labelKey)}
									</span>
								</Link>
							) : (
								<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] font-bold text-gray-400">
									{idx + 1}
								</div>
							)}
							{idx < steps.length - 1 && !isActive && (
								<div className={`h-0.5 w-6 shrink-0 mx-0.5 ${isPast ? "bg-emerald-400" : "bg-gray-200 dark:bg-gray-700"}`} />
							)}
						</Fragment>
					);
				})}
			</div>
		</div>
	);
}

export function useJourneySteps() {
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
		{ key: "companyInfo", labelKey: "dashboard.journey.step1", done: progress.companyInfoDone, href: `/app/${organizationSlug}/settings/general` },
		{ key: "firstProject", labelKey: "dashboard.journey.step2", done: progress.firstProjectDone, href: `/app/${organizationSlug}/projects/new` },
		{ key: "firstInvoice", labelKey: "dashboard.journey.step3", done: progress.firstInvoiceCreated, href: `/app/${organizationSlug}/finance/invoices/new` },
		{ key: "inviteTeam", labelKey: "dashboard.journey.step4", done: progress.teamInviteDone, href: `/app/${organizationSlug}/settings/members` },
		{ key: "aiAssistant", labelKey: "dashboard.journey.step5", done: false, href: "/app/chatbot" },
		{ key: "firstQuantity", labelKey: "dashboard.journey.step6", done: progress.firstQuantityAdded, href: `/app/${organizationSlug}/quantities` },
	];

	const completedCount = steps.filter((s) => s.done).length;
	const incompleteSteps = steps.filter((s) => !s.done).slice(0, 2);

	return { completedCount, totalCount: steps.length, incompleteSteps, progress };
}
