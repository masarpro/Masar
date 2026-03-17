"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	BookOpen,
	Bot,
	CheckCircle2,
	ChevronLeft,
	FileText,
	HeadphonesIcon,
	Target,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface GettingStartedStep {
	key: string;
	labelKey: string;
	done: boolean;
	ctaKey: string;
	href: string;
}

export function GettingStarted() {
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

	if (!progress) return null;

	const steps: GettingStartedStep[] = [
		{
			key: "companyInfo",
			labelKey: "dashboard.gettingStarted.step1",
			done: progress.companyInfoDone,
			ctaKey: "dashboard.gettingStarted.start",
			href: `/app/${organizationSlug}/settings/general`,
		},
		{
			key: "firstProject",
			labelKey: "dashboard.gettingStarted.step2",
			done: progress.firstProjectDone,
			ctaKey: "dashboard.gettingStarted.start",
			href: `/app/${organizationSlug}/projects/new`,
		},
		{
			key: "firstInvoice",
			labelKey: "dashboard.gettingStarted.step3",
			done: progress.firstInvoiceCreated,
			ctaKey: "dashboard.gettingStarted.start",
			href: `/app/${organizationSlug}/finance/invoices/new`,
		},
		{
			key: "inviteTeam",
			labelKey: "dashboard.gettingStarted.step4",
			done: (activeOrganization?.members?.length ?? 0) >= 2,
			ctaKey: "dashboard.gettingStarted.invite",
			href: `/app/${organizationSlug}/settings/members`,
		},
		{
			key: "zatcaInfo",
			labelKey: "dashboard.gettingStarted.step5",
			done: progress.zatcaInfoComplete,
			ctaKey: "dashboard.gettingStarted.activate",
			href: `/app/${organizationSlug}/settings/general`,
		},
		{
			key: "firstExpense",
			labelKey: "dashboard.gettingStarted.step6",
			done: progress.firstExpenseRecorded,
			ctaKey: "dashboard.gettingStarted.create",
			href: `/app/${organizationSlug}/finance/expenses/new`,
		},
	];

	const guides = [
		{
			key: "pricing",
			labelKey: "dashboard.gettingStarted.guide.pricing",
			icon: BookOpen,
			href: `/app/${organizationSlug}/pricing/studies`,
		},
		{
			key: "invoices",
			labelKey: "dashboard.gettingStarted.guide.invoices",
			icon: FileText,
			href: `/app/${organizationSlug}/finance/invoices`,
		},
		{
			key: "ai",
			labelKey: "dashboard.gettingStarted.guide.ai",
			icon: Bot,
			href: "/app/chatbot",
		},
		{
			key: "support",
			labelKey: "dashboard.gettingStarted.guide.support",
			icon: HeadphonesIcon,
			href: "mailto:support@app-masar.com",
		},
	];

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
			{/* Getting Started Steps */}
			<div className="rounded-xl border bg-card shadow-sm p-4">
				<div className="flex items-center gap-2 mb-4">
					<Target className="h-4 w-4 text-blue-500" />
					<h3 className="text-sm font-semibold text-foreground">
						{t("dashboard.gettingStarted.title")}
					</h3>
				</div>

				<div className="space-y-2">
					{steps.map((step, idx) => (
						<div
							key={step.key}
							className={`flex items-center gap-3 rounded-lg p-2.5 ${
								step.done
									? "opacity-50"
									: "hover:bg-muted/50 transition-colors"
							}`}
						>
							{step.done ? (
								<CheckCircle2 className="h-5 w-5 shrink-0 text-green-500 animate-in zoom-in duration-300" />
							) : (
								<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-[10px] font-bold text-muted-foreground">
									{idx + 1}
								</span>
							)}
							<span
								className={`flex-1 text-sm ${
									step.done
										? "line-through text-gray-400"
										: "font-medium text-foreground"
								}`}
							>
								{t(step.labelKey)}
							</span>
							{!step.done && (
								<Link
									href={step.href}
									className="flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50 transition-colors"
								>
									{t(step.ctaKey)}
									<ChevronLeft className="h-3 w-3" />
								</Link>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Learn More */}
			<div className="rounded-xl border bg-card shadow-sm p-4">
				<div className="flex items-center gap-2 mb-4">
					<BookOpen className="h-4 w-4 text-blue-500" />
					<h3 className="text-sm font-semibold text-foreground">
						{t("dashboard.gettingStarted.learnMore")}
					</h3>
				</div>

				<div className="space-y-2">
					{guides.map((guide) => {
						const Icon = guide.icon;
						return (
							<Link
								key={guide.key}
								href={guide.href}
								className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors"
							>
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
									<Icon className="h-4 w-4 text-muted-foreground" />
								</div>
								<span className="flex-1 text-sm font-medium text-foreground/80">
									{t(guide.labelKey)}
								</span>
								<ChevronLeft className="h-4 w-4 text-muted-foreground" />
							</Link>
						);
					})}
				</div>
			</div>
		</div>
	);
}
