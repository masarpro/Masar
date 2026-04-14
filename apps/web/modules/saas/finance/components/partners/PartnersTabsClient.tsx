"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@ui/components/tabs";
import { usePartnerAccess } from "@saas/organizations/hooks/use-partner-access";
import { PartnersOverviewTab } from "./PartnersOverviewTab";
import { OwnerDrawingsList } from "../owner-drawings/OwnerDrawingsList";
import { CapitalContributionsList } from "../capital-contributions/CapitalContributionsList";

const VALID_TABS = [
	"overview",
	"partners",
	"drawings",
	"contributions",
] as const;
type TabValue = (typeof VALID_TABS)[number];

interface PartnersTabsClientProps {
	organizationId: string;
	organizationSlug: string;
}

export function PartnersTabsClient({
	organizationId,
	organizationSlug,
}: PartnersTabsClientProps) {
	const t = useTranslations();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { canViewProfits } = usePartnerAccess();

	const raw = searchParams.get("tab") as TabValue | null;
	const current: TabValue =
		raw && VALID_TABS.includes(raw) ? raw : "overview";

	// Restricted accountant: can't view drawings/contributions detail tabs.
	// Redirect silently to overview if they land on one directly.
	useEffect(() => {
		if (
			!canViewProfits &&
			(current === "drawings" || current === "contributions")
		) {
			const params = new URLSearchParams(searchParams.toString());
			params.set("tab", "overview");
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		}
	}, [canViewProfits, current, pathname, router, searchParams]);

	const onChange = (value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("tab", value);
		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
	};

	return (
		<Tabs value={current} onValueChange={onChange} className="w-full space-y-4">
			<TabsList className="rounded-xl">
				<TabsTrigger value="overview" className="rounded-lg">
					{t("finance.partners.tabs.overview")}
				</TabsTrigger>
				<TabsTrigger value="partners" className="rounded-lg">
					{t("finance.partners.tabs.partnersList")}
				</TabsTrigger>
				{canViewProfits && (
					<TabsTrigger value="drawings" className="rounded-lg">
						{t("finance.partners.tabs.drawings")}
					</TabsTrigger>
				)}
				{canViewProfits && (
					<TabsTrigger value="contributions" className="rounded-lg">
						{t("finance.partners.tabs.contributions")}
					</TabsTrigger>
				)}
			</TabsList>

			<TabsContent value="overview" className="mt-0">
				{current === "overview" && (
					<PartnersOverviewTab
						organizationId={organizationId}
						organizationSlug={organizationSlug}
					/>
				)}
			</TabsContent>

			<TabsContent value="partners" className="mt-0">
				{current === "partners" && (
					<PartnersOverviewTab
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						showSummaryCards={false}
						showReportsButton={false}
					/>
				)}
			</TabsContent>

			{canViewProfits && (
				<TabsContent value="drawings" className="mt-0">
					{current === "drawings" && (
						<OwnerDrawingsList
							organizationId={organizationId}
							organizationSlug={organizationSlug}
						/>
					)}
				</TabsContent>
			)}

			{canViewProfits && (
				<TabsContent value="contributions" className="mt-0">
					{current === "contributions" && (
						<CapitalContributionsList
							organizationId={organizationId}
							organizationSlug={organizationSlug}
						/>
					)}
				</TabsContent>
			)}
		</Tabs>
	);
}
