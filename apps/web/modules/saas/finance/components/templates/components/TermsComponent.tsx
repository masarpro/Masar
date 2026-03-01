"use client";

import { useTranslations } from "next-intl";

interface TermsComponentProps {
	settings: {
		title?: string;
		content?: string;
	};
	terms?: {
		paymentTerms?: string;
		deliveryTerms?: string;
		warrantyTerms?: string;
	};
	primaryColor?: string;
}

export function TermsComponent({
	settings,
	terms,
	primaryColor = "#3b82f6",
}: TermsComponentProps) {
	const t = useTranslations();

	const title = settings.title || t("finance.templates.preview.termsAndConditions");
	const content = settings.content || terms?.paymentTerms || "";

	if (!content) return null;

	return (
		<div className="py-6 border-t border-slate-200">
			<h3
				className="text-sm font-semibold uppercase tracking-wide mb-4"
				style={{ color: primaryColor }}
			>
				{title}
			</h3>
			<div className="text-sm text-slate-600 whitespace-pre-line">
				{content}
			</div>
		</div>
	);
}
