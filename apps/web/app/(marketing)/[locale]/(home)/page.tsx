import { FaqSection } from "@marketing/home/components/FaqSection";
import { Features } from "@marketing/home/components/Features";
import { FinalCTA } from "@marketing/home/components/FinalCTA";
import { Hero } from "@marketing/home/components/Hero";
import { HowItWorks } from "@marketing/home/components/HowItWorks";
import { PainPoints } from "@marketing/home/components/PainPoints";
import { PricingSection } from "@marketing/home/components/PricingSection";
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
		<>
			<Hero />
			<PainPoints />
			<Features />
			<HowItWorks />
			<PricingSection />
			<ZatcaBadge />
			<FaqSection />
			<FinalCTA />
		</>
	);
}
