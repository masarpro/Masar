"use client";

import { BookOpen, FileText, Bot, HeadphonesIcon, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

export function LearnMasar({ organizationSlug }: { organizationSlug: string }) {
	const t = useTranslations();

	const guides = [
		{
			key: "pricing",
			labelKey: "dashboard.learn.pricing",
			descKey: "dashboard.learn.pricing.desc",
			icon: BookOpen,
			href: `/app/${organizationSlug}/pricing/studies`,
		},
		{
			key: "invoices",
			labelKey: "dashboard.learn.invoices",
			descKey: "dashboard.learn.invoices.desc",
			icon: FileText,
			href: `/app/${organizationSlug}/finance/invoices`,
		},
		{
			key: "ai",
			labelKey: "dashboard.learn.ai",
			descKey: "dashboard.learn.ai.desc",
			icon: Bot,
			href: "/app/chatbot",
		},
		{
			key: "support",
			labelKey: "dashboard.learn.support",
			descKey: "dashboard.learn.support.desc",
			icon: HeadphonesIcon,
			href: "mailto:support@app-masar.com",
		},
	];

	return (
		<div
			className={`${glassCard} flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500`}
			style={{ animationDelay: "640ms" }}
		>
			<div className="flex items-center gap-2 px-4 pt-3 pb-2">
				<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
					<BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
				</div>
				<h3 className="text-sm font-semibold text-foreground">
					{t("dashboard.learn.title")}
				</h3>
			</div>

			<div className="flex-1 space-y-1 px-4 pb-3">
				{guides.map((guide) => {
					const Icon = guide.icon;
					return (
						<Link
							key={guide.key}
							href={guide.href}
							className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/50 transition-colors"
						>
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
								<Icon className="h-4 w-4 text-muted-foreground" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-xs font-medium text-foreground/80">
									{t(guide.labelKey)}
								</p>
								<p className="text-[10px] text-muted-foreground">
									{t(guide.descKey)}
								</p>
							</div>
							<ChevronLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
						</Link>
					);
				})}
			</div>
		</div>
	);
}
