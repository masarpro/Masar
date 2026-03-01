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
		showAddress?: boolean;
		showWebsite?: boolean;
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
		showCompanyInfo = false,
		showPageNumber = false,
		showPhone = false,
		showEmail = false,
		showAddress = false,
		showWebsite = false,
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
					{showAddress && organization?.address && ` — ${organization.address}`}
					{showPhone && organization?.phone && ` | ${organization.phone}`}
					{showEmail && organization?.email && ` | ${organization.email}`}
					{showWebsite && organization?.website && ` | ${organization.website}`}
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

	// ─── Default Layout ───────────────────────────────────────────────────
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
				{/* Company name row */}
				<div
					className="flex items-center justify-between text-[10px]"
					style={{ color: textColor || "#a1a1aa" }}
				>
					<span>
						{showCompanyInfo && companyName}
						{!showCompanyInfo && companyName}
					</span>
					{showPageNumber && (
						<span>
							{t("finance.templates.preview.page")} 1{" "}
							{t("finance.templates.preview.of")} 1
						</span>
					)}
				</div>

				{/* Contact info row */}
				{(showAddress || showPhone || showEmail || showWebsite) &&
					(organization?.address || organization?.phone || organization?.email || organization?.website) && (
						<div
							className="flex items-center justify-center gap-4 text-xs"
							style={{ color: textColor || "#a1a1aa" }}
						>
							{showAddress && organization?.address && (
								<span>{organization.address}</span>
							)}
							{showPhone && organization?.phone && (
								<span>{organization.phone}</span>
							)}
							{showEmail && organization?.email && (
								<span>{organization.email}</span>
							)}
							{showWebsite && organization?.website && (
								<span>{organization.website}</span>
							)}
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
