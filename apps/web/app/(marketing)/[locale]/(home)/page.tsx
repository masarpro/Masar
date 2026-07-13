import { AiFeatureSection } from "@marketing/home/components/AiFeatureSection";
import { FaqSection } from "@marketing/home/components/FaqSection";
import { Features } from "@marketing/home/components/Features";
import { FinalCTA } from "@marketing/home/components/FinalCTA";
import { Hero } from "@marketing/home/components/Hero";
import { HowItWorks } from "@marketing/home/components/HowItWorks";
import { LandingFx } from "@marketing/home/components/LandingFx";
import { PricingSection } from "@marketing/home/components/PricingSection";
import { RolesStrip } from "@marketing/home/components/RolesStrip";
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
		<div className="-mt-[72px] overflow-x-hidden bg-background text-foreground">
			<Hero />
			<AiFeatureSection />
			<Features />
			<RolesStrip />
			<HowItWorks />
			<PricingSection />
			<ZatcaBadge />
			<FaqSection />
			<FinalCTA />
			<LandingFx />
		</div>
	);
}
