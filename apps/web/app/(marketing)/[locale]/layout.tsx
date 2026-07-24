import "../fumadocs.css";
import { Footer } from "@marketing/shared/components/Footer";
import { MarketingAssistant } from "@marketing/shared/components/MarketingAssistant";
import { NavBar } from "@marketing/shared/components/NavBar";
import { config } from "@repo/config";
import { SessionProvider } from "@saas/auth/components/SessionProvider";
import { ConsentBanner } from "@shared/components/ConsentBanner";
import { Document } from "@shared/components/Document";
import { NextProvider as FumadocsNextProvider } from "fumadocs-core/framework/next";
import { RootProvider as FumadocsRootProvider } from "fumadocs-ui/provider/next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";

const locales = Object.keys(config.i18n.locales);

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

/**
 * Top-level translation namespaces actually consumed by CLIENT components
 * rendered under the marketing layout (grep of useTranslations/t() across
 * modules/marketing + the shared components this layout mounts). Server
 * components use getTranslations() and don't need the client provider.
 *
 * Shipping only these instead of the full ~10k-line merged catalog cuts the
 * serialized messages payload embedded in every marketing page's HTML by an
 * order of magnitude. If you add a client component under (marketing) that
 * uses a NEW top-level namespace, add it here.
 */
const MARKETING_MESSAGE_NAMESPACES = [
	"common",
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
	// The landing dashboard replica reuses real app namespaces:
	"dashboard",
	"chat",
	"chatTable",
];

function pickMarketingMessages(
	messages: Record<string, unknown>,
): Record<string, unknown> {
	const picked: Record<string, unknown> = {};
	for (const ns of MARKETING_MESSAGE_NAMESPACES) {
		if (ns in messages) {
			picked[ns] = messages[ns];
		}
	}
	return picked;
}

export default async function MarketingLayout({
	children,
	params,
}: PropsWithChildren<{ params: Promise<{ locale: string }> }>) {
	const { locale } = await params;

	setRequestLocale(locale);

	if (!locales.includes(locale as any)) {
		notFound();
	}

	const messages = pickMarketingMessages(
		(await getMessages()) as unknown as Record<string, unknown>,
	) as Parameters<typeof NextIntlClientProvider>[0]["messages"];

	return (
		<Document locale={locale}>
			<FumadocsNextProvider>
				<FumadocsRootProvider
					search={{
						enabled: true,
						options: {
							api: "/api/docs-search",
						},
					}}
					i18n={{
						locale,
					}}
				>
					<NextIntlClientProvider locale={locale} messages={messages}>
						<SessionProvider>
							<NavBar />
							<main className="min-h-screen">{children}</main>
							<Footer />
							<MarketingAssistant />
							<ConsentBanner />
						</SessionProvider>
					</NextIntlClientProvider>
				</FumadocsRootProvider>
			</FumadocsNextProvider>
		</Document>
	);
}
