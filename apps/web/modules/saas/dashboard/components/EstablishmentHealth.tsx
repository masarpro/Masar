"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

const HEALTH_DISMISSED_KEY = "masar-health-dismissed";

interface HealthCategory {
	labelKey: string;
	percent: number;
	ctaKey: string | null;
	href: string | null;
}

function getBarColor(percent: number) {
	if (percent >= 100) return "bg-green-500";
	if (percent >= 50) return "bg-blue-500";
	if (percent > 0) return "bg-amber-500";
	return "bg-gray-200 dark:bg-gray-700";
}

export function EstablishmentHealth() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const organizationSlug = activeOrganization?.slug ?? "";

	const [dismissed, setDismissed] = useState(() => {
		if (typeof window === "undefined") return false;
		return localStorage.getItem(`${HEALTH_DISMISSED_KEY}-${organizationId}`) === "true";
	});

	const { data: progress } = useQuery({
		...orpc.onboarding.getProgress.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
	});

	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId, status: "ACTIVE" as const },
		}),
	);

	const { data: orgFinance } = useQuery(
		orpc.finance.orgDashboard.queryOptions({
			input: { organizationId },
		}),
	);

	if (!progress || dismissed) return null;

	// Calculate profile completion
	const hasName = !!activeOrganization?.name;
	const profileScore = hasName ? 100 : 0;

	// Calculate finance completion
	const hasBankBalance = (orgFinance?.balances?.totalBankBalance ?? 0) > 0;
	const hasInvoice = progress.firstInvoiceCreated;
	const financeItems = [hasBankBalance, hasInvoice, progress.zatcaInfoComplete];
	const financeScore = Math.round(
		(financeItems.filter(Boolean).length / financeItems.length) * 100,
	);

	// Calculate projects completion
	const projects = projectsData?.projects ?? [];
	const hasProject = projects.length > 0;
	const hasContractValue = projects.some((p) => (p.contractValue ?? 0) > 0);
	const projectItems = [hasProject, hasContractValue];
	const projectsScore = Math.round(
		(projectItems.filter(Boolean).length / projectItems.length) * 100,
	);

	// Calculate team completion
	const memberCount = activeOrganization?.members?.length ?? 0;
	const teamScore = memberCount >= 3 ? 100 : memberCount >= 2 ? 50 : 0;

	// Overall score
	const overallScore = Math.round(
		(profileScore + financeScore + projectsScore + teamScore) / 4,
	);

	// If 100% and already seen — hide
	if (overallScore >= 100) return null;

	const categories: HealthCategory[] = [
		{
			labelKey: "dashboard.health.profile",
			percent: profileScore,
			ctaKey: profileScore < 100 ? "dashboard.health.completeProfile" : null,
			href: profileScore < 100 ? `/app/${organizationSlug}/settings/general` : null,
		},
		{
			labelKey: "dashboard.health.finance",
			percent: financeScore,
			ctaKey: financeScore < 100 ? "dashboard.health.addBank" : null,
			href: financeScore < 100 ? `/app/${organizationSlug}/finance` : null,
		},
		{
			labelKey: "dashboard.health.projects",
			percent: projectsScore,
			ctaKey: projectsScore < 100 ? "dashboard.health.addContract" : null,
			href: projectsScore < 100 ? `/app/${organizationSlug}/projects` : null,
		},
		{
			labelKey: "dashboard.health.team",
			percent: teamScore,
			ctaKey: teamScore < 100 ? "dashboard.health.inviteMember" : null,
			href: teamScore < 100 ? `/app/${organizationSlug}/settings/members` : null,
		},
	];

	const handleDismiss = () => {
		if (typeof window !== "undefined") {
			localStorage.setItem(`${HEALTH_DISMISSED_KEY}-${organizationId}`, "true");
		}
		setDismissed(true);
	};

	return (
		<div className="rounded-xl border bg-card shadow-sm p-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-sm font-semibold text-foreground">
					{t("dashboard.health.title")}
				</h3>
				<div className="flex items-center gap-3">
					<span className="text-xs text-muted-foreground">
						{t("dashboard.health.completion")}: {overallScore}%
					</span>
					<button
						onClick={handleDismiss}
						className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-200/50 hover:text-gray-600 transition-colors"
						type="button"
					>
						<X className="h-3.5 w-3.5" />
					</button>
				</div>
			</div>

			{/* Categories */}
			<div className="space-y-3">
				{categories.map((cat) => (
					<div key={cat.labelKey} className="flex items-center gap-3">
						<span className="w-20 shrink-0 text-xs font-medium text-foreground/80">
							{t(cat.labelKey)}
						</span>
						<div className="flex-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
							<div
								className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor(cat.percent)}`}
								style={{ width: `${cat.percent}%` }}
							/>
						</div>
						<span className="w-10 shrink-0 text-xs tabular-nums text-muted-foreground text-end">
							{cat.percent}%
						</span>
						{cat.percent >= 100 ? (
							<span className="w-24 shrink-0 text-xs text-green-500 text-end">
								&#10003;
							</span>
						) : cat.ctaKey && cat.href ? (
							<Link
								href={cat.href}
								className="flex w-24 shrink-0 items-center justify-end gap-0.5 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
							>
								<span>{t(cat.ctaKey)}</span>
								<ChevronLeft className="h-3 w-3" />
							</Link>
						) : (
							<span className="w-24 shrink-0" />
						)}
					</div>
				))}
			</div>
		</div>
	);
}
