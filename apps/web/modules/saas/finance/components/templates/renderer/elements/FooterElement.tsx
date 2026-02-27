"use client";

import { useTranslations } from "next-intl";
import type { OrganizationData } from "../TemplateRenderer";

interface FooterElementProps {
	settings: {
		showYear?: boolean;
		showThankYouMessage?: boolean;
		thankYouText?: string;
		showCompanyInfo?: boolean;
		showPageNumber?: boolean;
		showPhone?: boolean;
		showEmail?: boolean;
		// Layout & accent
		layout?: "default" | "dark-bar";
		accentStyle?: "none" | "gradient-line" | "bottom-bar";
		// Colors
		background?: string;
		textColor?: string;
		pageNumberColor?: string;
		barColor?: string;
		barHeight?: string;
		textAlign?: "center" | "start" | "end";
	};
	organization?: OrganizationData;
	primaryColor?: string;
	secondaryColor?: string;
}

export function FooterElement({
	settings,
	organization,
	primaryColor = "#3b82f6",
	secondaryColor,
}: FooterElementProps) {
	const t = useTranslations();
	const {
		showYear = true,
		showThankYouMessage = true,
		thankYouText,
		showCompanyInfo = false,
		showPageNumber = false,
		showPhone = false,
		showEmail = false,
		layout = "default",
		accentStyle = "none",
		background,
		textColor,
		pageNumberColor,
		barColor,
		barHeight = "3px",
		textAlign = "center",
	} = settings;

	const companyName =
		organization?.nameAr ||
		organization?.name ||
		t("finance.templates.preview.companyName");
	const currentYear = new Date().getFullYear();
	const footerText = organization?.footerText;
	const accent = secondaryColor || primaryColor;

	// ─── Dark Bar Layout ─────────────────────────────────────────────────
	if (layout === "dark-bar") {
		return (
			<div
				className="mt-8 px-7 py-2 flex items-center justify-between"
				style={{
					background: background || "#0f172a",
				}}
			>
				<span
					className="text-[10px]"
					style={{ color: textColor || "#64748b" }}
				>
					{showCompanyInfo && companyName}
					{showPhone && organization?.phone && ` | ${organization.phone}`}
					{showEmail && organization?.email && ` | ${organization.email}`}
				</span>
				{showPageNumber && (
					<span
						className="text-[10px]"
						style={{ color: pageNumberColor || primaryColor }}
					>
						{t("finance.templates.preview.page")} 1{" "}
						{t("finance.templates.preview.of")} 1
					</span>
				)}
			</div>
		);
	}

	// ─── Default Layout (enhanced) ───────────────────────────────────────
	return (
		<div className="mt-8">
			{/* Gradient line accent (top) */}
			{accentStyle === "gradient-line" && (
				<div
					className="h-px mb-3"
					style={{
						background: `linear-gradient(90deg, ${accent}, ${primaryColor})`,
					}}
				/>
			)}

			{accentStyle !== "gradient-line" && (
				<div className="h-px mb-3 bg-slate-200" />
			)}

			<div
				className="space-y-1.5"
				style={{
					textAlign,
					color: textColor || undefined,
				}}
			>
				{/* Custom footer text */}
				{footerText && (
					<p className="text-sm text-slate-600">{footerText}</p>
				)}

				{/* Thank you message */}
				{showThankYouMessage && (
					<p
						className="text-sm"
						style={{ color: textColor || "#64748b" }}
					>
						{thankYouText ||
							organization?.thankYouMessage ||
							t("finance.templates.preview.thankYouMessage")}
					</p>
				)}

				{/* Company, contact, year */}
				<div
					className="flex items-center justify-between text-[10px]"
					style={{ color: textColor || "#a1a1aa" }}
				>
					<span>
						{showCompanyInfo && companyName}
						{showCompanyInfo &&
							organization?.address &&
							` — ${organization.address}`}
						{!showCompanyInfo && companyName}
						{showYear && ` - ${currentYear}`}
					</span>
					{showPageNumber && (
						<span>
							{t("finance.templates.preview.page")} 1{" "}
							{t("finance.templates.preview.of")} 1
						</span>
					)}
				</div>

				{/* Contact info row */}
				{(showPhone || showEmail) &&
					(organization?.phone || organization?.email || organization?.website) && (
						<div
							className="flex items-center justify-center gap-4 text-xs"
							style={{ color: textColor || "#a1a1aa" }}
						>
							{showPhone && organization?.phone && (
								<span>{organization.phone}</span>
							)}
							{showEmail && organization?.email && (
								<span>{organization.email}</span>
							)}
							{organization?.website && <span>{organization.website}</span>}
						</div>
					)}
			</div>

			{/* Bottom bar accent */}
			{accentStyle === "bottom-bar" && (
				<div
					className="mt-3"
					style={{
						height: barHeight,
						background: barColor || primaryColor,
					}}
				/>
			)}
		</div>
	);
}
