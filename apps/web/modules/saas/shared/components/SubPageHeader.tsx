"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";

export interface NavSection {
	id: string;
	path: string;
	labelKey: string;
	icon: LucideIcon;
}

export interface SubPageHeaderProps {
	organizationSlug: string;
	sectionKey: string;
	pageTitle?: string;
	actions?: ReactNode;
	navSections: NavSection[];
	getHomeHref: (slug: string) => string;
	getSectionHref: (slug: string, sectionKey: string) => string;
	rootLabelKey: string;
	backLabelKey: string;
}

export function SubPageHeader({
	organizationSlug,
	sectionKey,
	pageTitle,
	actions,
	navSections,
	getHomeHref,
	getSectionHref,
	rootLabelKey,
	backLabelKey,
}: SubPageHeaderProps) {
	const t = useTranslations();

	const section = navSections.find((s) => s.id === sectionKey);
	const sectionLabel = section ? t(section.labelKey) : sectionKey;
	const SectionIcon = section?.icon;
	const sectionHref = getSectionHref(organizationSlug, sectionKey);
	const homeHref = getHomeHref(organizationSlug);

	const backHref = pageTitle ? sectionHref : homeHref;

	return (
		<div
			className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50"
			dir="rtl"
		>
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					asChild
					className="h-9 w-9 shrink-0 hover:bg-primary/10"
				>
					<Link href={backHref}>
						<ArrowRight className="h-5 w-5" />
						<span className="sr-only">{t(backLabelKey)}</span>
					</Link>
				</Button>

				{SectionIcon && (
					<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
						<SectionIcon className="h-5 w-5 text-primary" />
					</div>
				)}

				<nav className="flex items-center gap-2 text-sm">
					<Link
						href={homeHref}
						className="text-muted-foreground hover:text-foreground transition-colors"
					>
						{t(rootLabelKey)}
					</Link>

					<ChevronLeft className="h-4 w-4 text-muted-foreground" />

					{pageTitle ? (
						<>
							<Link
								href={sectionHref}
								className="text-muted-foreground hover:text-foreground transition-colors"
							>
								{sectionLabel}
							</Link>
							<ChevronLeft className="h-4 w-4 text-muted-foreground" />
							<span className="font-medium text-foreground">{pageTitle}</span>
						</>
					) : (
						<span className="font-medium text-foreground">{sectionLabel}</span>
					)}
				</nav>
			</div>

			{actions && (
				<div className="flex items-center gap-2">
					{actions}
				</div>
			)}
		</div>
	);
}
