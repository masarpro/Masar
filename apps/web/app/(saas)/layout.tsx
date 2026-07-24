import { config } from "@repo/config";
import { SessionProvider } from "@saas/auth/components/SessionProvider";
import { sessionQueryKey } from "@saas/auth/lib/api";
import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { ActiveOrganizationProvider } from "@saas/organizations/components/ActiveOrganizationProvider";
import { organizationListQueryKey } from "@saas/organizations/lib/api";
import { PermissionsProvider } from "@saas/permissions/components/PermissionsProvider";
import { ConfirmationAlertProvider } from "@saas/shared/components/ConfirmationAlertProvider";
import { ConsentBanner } from "@shared/components/ConsentBanner";
import { Document } from "@shared/components/Document";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { PropsWithChildren } from "react";

/**
 * Top-level translation namespaces used ONLY by the marketing site (landing
 * sections, FAQ page, marketing assistant, landing dashboard replica chrome).
 * Verified by grep: no client component under (saas)/modules references them
 * (pricing's "hero.*" hits are the scoped pricing.pricingV2.hero keys).
 * Stripping them keeps ~30KB of JSON out of every app document load.
 */
const MARKETING_ONLY_NAMESPACES = new Set([
	"hero",
	"features",
	"howItWorks",
	"landingPricing",
	"landingRoles",
	"landingVisuals",
	"landingZatca",
	"aiFeature",
	"finalCta",
	"faq",
	"faqPage",
	"footer",
	"contact",
	"marketingAssistant",
	"chat",
	"chatTable",
]);

function stripMarketingNamespaces<T extends Record<string, unknown>>(
	messages: T,
): T {
	const filtered: Record<string, unknown> = {};
	for (const [ns, value] of Object.entries(messages)) {
		if (!MARKETING_ONLY_NAMESPACES.has(ns)) {
			filtered[ns] = value;
		}
	}
	return filtered as T;
}

export default async function SaaSLayout({ children }: PropsWithChildren) {
	const layoutStart = performance.now();
	const [locale, allMessages, session] = await Promise.all([
		getLocale(),
		getMessages(),
		getSession(),
	]);
	const messages = stripMarketingNamespaces(
		allMessages as unknown as Record<string, unknown>,
	) as typeof allMessages;

	if (!session) {
		redirect("/auth/login");
	}

	const queryClient = getServerQueryClient();

	const prefetchPromises: Promise<void>[] = [
		queryClient.prefetchQuery({
			queryKey: sessionQueryKey,
			queryFn: () => session,
		}),
	];

	if (config.organizations.enable) {
		prefetchPromises.push(
			queryClient.prefetchQuery({
				queryKey: organizationListQueryKey,
				queryFn: getOrganizationList,
			}),
		);
	}

	// Purchases are prefetched org-scoped by the [organizationSlug] layout and
	// self-prefetched by the account billing page. A user-level prefetch here
	// was an extra DB round-trip on every /app page that nothing consumed.

	try {
		await Promise.all(prefetchPromises);
	} catch (error) {
		console.error("[LAYOUT] Error prefetching data:", error);
	}

	if (process.env.NODE_ENV === "development") {
		console.log(`[PERF] (saas)/layout.tsx: ${Math.round(performance.now() - layoutStart)}ms`);
	}

	return (
		<Document locale={locale}>
			<NextIntlClientProvider messages={messages}>
				<HydrationBoundary state={dehydrate(queryClient)}>
					<SessionProvider>
						<ActiveOrganizationProvider>
							<PermissionsProvider>
								<ConfirmationAlertProvider>
									{children}
								</ConfirmationAlertProvider>
							</PermissionsProvider>
						</ActiveOrganizationProvider>
					</SessionProvider>
				</HydrationBoundary>
				<ConsentBanner />
			</NextIntlClientProvider>
		</Document>
	);
}
