import { AiFeatureSection } from "@marketing/home/components/AiFeatureSection";
import { FaqSection } from "@marketing/home/components/FaqSection";
import { Features } from "@marketing/home/components/Features";
import { FinalCTA } from "@marketing/home/components/FinalCTA";
import { Hero } from "@marketing/home/components/Hero";
import { HowItWorks } from "@marketing/home/components/HowItWorks";
import { PricingSection } from "@marketing/home/components/PricingSection";
import { StatsSection } from "@marketing/home/components/StatsSection";
import { ZatcaBadge } from "@marketing/home/components/ZatcaBadge";
import { setRequestLocale } from "next-intl/server";

export default async function Home({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<div
			className="overflow-x-hidden -mt-[72px]"
			style={{ background: "var(--lp-bg)", color: "var(--lp-text)" }}
		>
			<Hero />
			<AiFeatureSection />
			<Features />
			<StatsSection />
			<HowItWorks />
			<PricingSection />
			<ZatcaBadge />
			<FaqSection />
			<FinalCTA />
		</div>
	);
}
