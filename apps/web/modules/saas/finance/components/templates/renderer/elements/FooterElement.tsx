"use client";

import { useTranslations } from "next-intl";
import type { OrganizationData } from "../TemplateRenderer";

interface FooterElementProps {
	settings: {
		showYear?: boolean;
		showThankYouMessage?: boolean;
	};
	organization?: OrganizationData;
	primaryColor?: string;
}

export function FooterElement({
	settings,
	organization,
	primaryColor = "#3b82f6",
}: FooterElementProps) {
	const t = useTranslations();
	const { showYear = true, showThankYouMessage = true } = settings;

	const companyName = organization?.nameAr || organization?.name || t("finance.templates.preview.companyName");
	const currentYear = new Date().getFullYear();
	const footerText = organization?.footerText;

	return (
		<div
			className="py-4 mt-8 border-t text-center space-y-2"
			style={{ borderColor: `${primaryColor}30` }}
		>
			{/* Custom footer text */}
			{footerText && (
				<p className="text-sm text-slate-600">{footerText}</p>
			)}

			{/* Thank you message */}
			{showThankYouMessage && (
				<p className="text-sm text-slate-600">
					{organization?.thankYouMessage || t("finance.templates.preview.thankYouMessage")}
				</p>
			)}

			{/* Company and year */}
			<p className="text-xs text-slate-500">
				{companyName}
				{showYear && ` - ${currentYear}`}
			</p>

			{/* Contact info */}
			{(organization?.phone || organization?.email || organization?.website) && (
				<div className="flex items-center justify-center gap-4 text-xs text-slate-400">
					{organization?.phone && <span>{organization.phone}</span>}
					{organization?.email && <span>{organization.email}</span>}
					{organization?.website && <span>{organization.website}</span>}
				</div>
			)}
		</div>
	);
}
