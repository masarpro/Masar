import { FaqPageContent } from "@marketing/faq/components/FaqPageContent";
import { FAQ_ITEMS } from "@marketing/faq/faq-data";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("faqPage.title"),
		description: t("faqPage.description"),
	};
}

export default async function FaqPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations();

	// FAQPage structured data لتحسين الظهور في نتائج البحث
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: FAQ_ITEMS.map((item) => ({
			"@type": "Question",
			name: t(`faqPage.items.${item.id}.question`),
			acceptedAnswer: {
				"@type": "Answer",
				text: t(`faqPage.items.${item.id}.answer`),
			},
		})),
	};

	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<FaqPageContent />
		</>
	);
}
