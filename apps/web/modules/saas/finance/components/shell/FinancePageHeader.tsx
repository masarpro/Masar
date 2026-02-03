"use client";

import { ArrowRight, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import {
	getCurrentFinanceSegment,
	getFinanceBackHref,
	getFinanceHomeHref,
	isFinanceSubPage,
} from "./constants";

interface FinancePageHeaderProps {
	organizationSlug: string;
	title: string;
	subtitle?: string;
}

export function FinancePageHeader({
	organizationSlug,
	title,
	subtitle,
}: FinancePageHeaderProps) {
	const t = useTranslations();
	const pathname = usePathname();

	const segment = getCurrentFinanceSegment(pathname);
	const isSubPage = isFinanceSubPage(pathname);
	const isDashboard = !segment;

	const backHref = getFinanceBackHref(pathname, organizationSlug);
	const homeHref = getFinanceHomeHref(organizationSlug);

	// Show back button if not on dashboard
	const showBackButton = !isDashboard;
	// Show home button if on a sub-page (not dashboard and not section list)
	const showHomeButton = isSubPage;

	return (
		<div className="mb-6" dir="rtl">
			{/* Navigation buttons */}
			{(showBackButton || showHomeButton) && (
				<div className="flex items-center gap-2 mb-4">
					{showBackButton && (
						<Button
							variant="ghost"
							size="sm"
							asChild
							className="gap-2 text-muted-foreground hover:text-foreground"
						>
							<Link href={backHref}>
								<ArrowRight className="h-4 w-4" />
								<span>{t("finance.shell.back")}</span>
							</Link>
						</Button>
					)}
					{showHomeButton && (
						<Button
							variant="ghost"
							size="sm"
							asChild
							className="gap-2 text-muted-foreground hover:text-foreground"
						>
							<Link href={homeHref}>
								<Wallet className="h-4 w-4" />
								<span>{t("finance.shell.home")}</span>
							</Link>
						</Button>
					)}
				</div>
			)}

			{/* Title and subtitle */}
			<div>
				<h1 className="font-bold text-2xl lg:text-3xl">{title}</h1>
				{subtitle && (
					<p className="mt-1 text-muted-foreground">{subtitle}</p>
				)}
			</div>
		</div>
	);
}
