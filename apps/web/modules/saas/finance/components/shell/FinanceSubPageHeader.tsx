"use client";

import type { ReactNode } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { FINANCE_NAV_SECTIONS, getSectionHref, getFinanceHomeHref } from "./constants";

export interface FinanceSubPageHeaderProps {
	organizationSlug: string;
	sectionKey: string;
	pageTitle?: string;
	actions?: ReactNode;
}

export function FinanceSubPageHeader({
	organizationSlug,
	sectionKey,
	pageTitle,
	actions,
}: FinanceSubPageHeaderProps) {
	const t = useTranslations();

	const section = FINANCE_NAV_SECTIONS.find((s) => s.id === sectionKey);
	const sectionLabel = section ? t(section.labelKey) : sectionKey;
	const SectionIcon = section?.icon;
	const sectionHref = getSectionHref(organizationSlug, sectionKey);
	const financeHomeHref = getFinanceHomeHref(organizationSlug);

	// Determine back link: if pageTitle exists, go to section list; otherwise go to finance home
	const backHref = pageTitle ? sectionHref : financeHomeHref;

	return (
		<div
			className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50"
			dir="rtl"
		>
			{/* Left side: Back button + Icon + Breadcrumb */}
			<div className="flex items-center gap-3">
				{/* Back button */}
				<Button
					variant="ghost"
					size="icon"
					asChild
					className="h-9 w-9 shrink-0 hover:bg-primary/10"
				>
					<Link href={backHref}>
						<ArrowRight className="h-5 w-5" />
						<span className="sr-only">{t("finance.shell.back")}</span>
					</Link>
				</Button>

				{/* Section Icon */}
				{SectionIcon && (
					<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
						<SectionIcon className="h-5 w-5 text-primary" />
					</div>
				)}

				{/* Breadcrumb */}
				<nav className="flex items-center gap-2 text-sm">
					{/* Finance home link */}
					<Link
						href={financeHomeHref}
						className="text-muted-foreground hover:text-foreground transition-colors"
					>
						{t("finance.title")}
					</Link>

					<ChevronLeft className="h-4 w-4 text-muted-foreground" />

					{/* Section link */}
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

			{/* Right side: Actions */}
			{actions && (
				<div className="flex items-center gap-2">
					{actions}
				</div>
			)}
		</div>
	);
}
