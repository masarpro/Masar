import { FaqSection } from "@marketing/home/components/FaqSection";
import { Features } from "@marketing/home/components/Features";
import { FinalCTA } from "@marketing/home/components/FinalCTA";
import { Hero } from "@marketing/home/components/Hero";
import { HowItWorks } from "@marketing/home/components/HowItWorks";
import { PainPoints } from "@marketing/home/components/PainPoints";
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
		<div className="bg-[#050508] text-white overflow-x-hidden -mt-[72px]">
			<Hero />
			<PainPoints />
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
