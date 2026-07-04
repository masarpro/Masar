"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Shown instead of a page the member has no permission to view.
 * Replaces the old behaviour of rendering an empty/broken page.
 */
export function AccessDenied() {
	const t = useTranslations("permissions.accessDenied");
	const { activeOrganization } = useActiveOrganization();

	const homeHref = activeOrganization
		? `/app/${activeOrganization.slug}`
		: "/app";

	return (
		<div className="flex min-h-[60vh] items-center justify-center p-6">
			<div className="flex max-w-md flex-col items-center gap-4 text-center">
				<div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
					<ShieldAlert className="size-7 text-destructive" />
				</div>
				<h2 className="font-semibold text-lg">{t("title")}</h2>
				<p className="text-muted-foreground text-sm">
					{t("description")}
				</p>
				<Button asChild variant="outline" className="mt-2">
					<Link href={homeHref}>{t("backHome")}</Link>
				</Button>
			</div>
		</div>
	);
}
