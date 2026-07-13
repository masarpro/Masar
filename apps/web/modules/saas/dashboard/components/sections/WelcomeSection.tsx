"use client";

import { usePermission } from "@saas/permissions/hooks/use-permission";
import { Building2, Calculator, FolderKanban, ReceiptIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Fallback home widget for members whose permissions hide the finance and
 * projects panels — quick links to the sections they CAN access, so the
 * home page is never visually empty.
 */
export function WelcomeSection({
	organizationSlug,
}: {
	organizationSlug: string;
}) {
	const t = useTranslations();
	const { can, canAny, isOwner } = usePermission();

	const sections = [
		{
			id: "projects",
			label: t("app.menu.projects"),
			href: `/app/${organizationSlug}/projects`,
			icon: FolderKanban,
			visible: isOwner || canAny("projects"),
		},
		{
			id: "pricing",
			label: t("app.menu.pricing"),
			href: `/app/${organizationSlug}/pricing`,
			icon: Calculator,
			visible: isOwner || canAny("pricing"),
		},
		{
			id: "finance",
			label: t("app.menu.finance"),
			href: `/app/${organizationSlug}/finance`,
			icon: ReceiptIcon,
			visible: isOwner || canAny("finance"),
		},
		{
			id: "company",
			label: t("app.menu.company"),
			href: `/app/${organizationSlug}/company`,
			icon: Building2,
			visible: isOwner || canAny("company") || can("employees", "view"),
		},
	].filter((section) => section.visible);

	return (
		<div className="bg-card border-2 rounded-2xl p-4 sm:p-6">
			<h2 className="font-semibold text-base sm:text-lg">
				{t("dashboard.welcome.title")}
			</h2>
			<p className="mt-1 text-muted-foreground text-sm">
				{t("dashboard.welcome.sectionsIntro")}
			</p>
			{sections.length > 0 && (
				<div className="mt-4 sm:mt-5 grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-4">
					{sections.map((section) => {
						const Icon = section.icon;
						return (
							<Link
								key={section.id}
								href={section.href}
								className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/60 p-3 sm:p-4 transition-colors hover:bg-muted/60"
							>
								<Icon className="size-5 sm:size-6 text-primary" />
								<span className="text-center font-medium text-xs sm:text-sm">
									{section.label}
								</span>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
