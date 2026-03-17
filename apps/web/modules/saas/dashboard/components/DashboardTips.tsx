"use client";

import {
	BarChart3,
	Bot,
	FileText,
	Lightbulb,
	UserPlus,
	Users,
	ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

interface Tip {
	icon: typeof Lightbulb;
	textKey: string;
	ctaKey: string;
	getHref: (orgSlug: string) => string;
}

const ALL_TIPS: Tip[] = [
	{
		icon: Lightbulb,
		textKey: "dashboard.tips.quantityStudy",
		ctaKey: "dashboard.tips.tryNow",
		getHref: (s) => `/app/${s}/pricing/studies`,
	},
	{
		icon: Users,
		textKey: "dashboard.tips.ownerPortal",
		ctaKey: "dashboard.tips.activate",
		getHref: (s) => `/app/${s}/projects`,
	},
	{
		icon: FileText,
		textKey: "dashboard.tips.template",
		ctaKey: "dashboard.tips.customize",
		getHref: (s) => `/app/${s}/finance/templates`,
	},
	{
		icon: Bot,
		textKey: "dashboard.tips.ai",
		ctaKey: "dashboard.tips.try",
		getHref: () => "/app/chatbot",
	},
	{
		icon: BarChart3,
		textKey: "dashboard.tips.reports",
		ctaKey: "dashboard.tips.viewReports",
		getHref: (s) => `/app/${s}/finance/reports`,
	},
	{
		icon: UserPlus,
		textKey: "dashboard.tips.team",
		ctaKey: "dashboard.tips.invite",
		getHref: (s) => `/app/${s}/settings/members`,
	},
];

export function DashboardTips({ organizationSlug }: { organizationSlug: string }) {
	const t = useTranslations();

	// Pick 2 tips based on the day of the year so they rotate daily
	const selectedTips = useMemo(() => {
		const dayOfYear = Math.floor(
			(Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
				(1000 * 60 * 60 * 24),
		);
		const idx1 = dayOfYear % ALL_TIPS.length;
		const idx2 = (dayOfYear + 1) % ALL_TIPS.length;
		return [ALL_TIPS[idx1]!, ALL_TIPS[idx2]!];
	}, []);

	return (
		<div className="space-y-2">
			{selectedTips.map((tip) => {
				const Icon = tip.icon;
				return (
					<Link
						key={tip.textKey}
						href={tip.getHref(organizationSlug)}
						className="flex items-center gap-3 rounded-xl border border-blue-100/50 bg-blue-50/50 p-3 transition-all hover:bg-blue-100/50 dark:border-blue-900/20 dark:bg-blue-950/10 dark:hover:bg-blue-950/20"
					>
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
							<Icon className="h-4 w-4 text-blue-500" />
						</div>
						<span className="flex-1 text-sm text-gray-600 dark:text-gray-400">
							{t(tip.textKey)}
						</span>
						<span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
							{t(tip.ctaKey)}
							<ChevronLeft className="h-3 w-3" />
						</span>
					</Link>
				);
			})}
		</div>
	);
}
