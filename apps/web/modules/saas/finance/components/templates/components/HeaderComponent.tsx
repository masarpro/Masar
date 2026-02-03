"use client";

import { useTranslations, useLocale } from "next-intl";

interface HeaderComponentProps {
	settings: {
		showLogo?: boolean;
		showCompanyName?: boolean;
		showAddress?: boolean;
		showBilingualName?: boolean;
		layout?: "modern" | "classic" | "minimal";
	};
	companyInfo?: {
		name?: string;
		nameAr?: string;
		nameEn?: string;
		logo?: string;
		address?: string;
		addressAr?: string;
		addressEn?: string;
		phone?: string;
		email?: string;
		taxNumber?: string;
	};
	documentType?: "quotation" | "invoice" | "letter";
	primaryColor?: string;
}

export function HeaderComponent({
	settings,
	companyInfo,
	documentType = "quotation",
	primaryColor = "#3b82f6",
}: HeaderComponentProps) {
	const t = useTranslations();
	const locale = useLocale();
	const {
		showLogo = true,
		showCompanyName = true,
		showAddress = true,
		showBilingualName = false,
		layout = "modern",
	} = settings;

	// Get display name based on locale and bilingual setting
	const getDisplayName = () => {
		if (showBilingualName && companyInfo?.nameAr && companyInfo?.nameEn) {
			return locale === "ar"
				? { primary: companyInfo.nameAr, secondary: companyInfo.nameEn }
				: { primary: companyInfo.nameEn, secondary: companyInfo.nameAr };
		}
		return {
			primary: companyInfo?.name || t("finance.templates.preview.companyName"),
			secondary: null,
		};
	};

	const displayName = getDisplayName();

	// Get document type label
	const getDocumentTypeLabel = () => {
		switch (documentType) {
			case "invoice":
				return t("finance.templates.preview.invoice");
			case "letter":
				return t("finance.templates.types.letter");
			default:
				return t("finance.templates.preview.quotation");
		}
	};

	// Classic layout
	if (layout === "classic") {
		return (
			<div className="pb-6 border-b-2" style={{ borderColor: primaryColor }}>
				<div className="text-center mb-4">
					{showLogo && (
						<div
							className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center text-white font-bold text-3xl"
							style={{ backgroundColor: primaryColor }}
						>
							{companyInfo?.logo ? (
								<img
									src={companyInfo.logo}
									alt={displayName.primary}
									className="w-full h-full object-contain rounded-full"
								/>
							) : (
								displayName.primary.charAt(0)
							)}
						</div>
					)}
					{showCompanyName && (
						<>
							<h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
								{displayName.primary}
							</h1>
							{displayName.secondary && (
								<p className="text-sm text-slate-500 mt-1" dir={locale === "ar" ? "ltr" : "rtl"}>
									{displayName.secondary}
								</p>
							)}
						</>
					)}
					{showAddress && companyInfo?.address && (
						<p className="text-sm text-slate-600 mt-2">{companyInfo.address}</p>
					)}
					{companyInfo?.phone && (
						<p className="text-sm text-slate-500">{companyInfo.phone}</p>
					)}
				</div>
				<div className="text-center">
					<div
						className="inline-block px-6 py-2 rounded-lg text-white font-semibold text-lg"
						style={{ backgroundColor: primaryColor }}
					>
						{getDocumentTypeLabel()}
					</div>
				</div>
			</div>
		);
	}

	// Minimal layout
	if (layout === "minimal") {
		return (
			<div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: `${primaryColor}40` }}>
				<div className="flex items-center gap-3">
					{showLogo && (
						<div
							className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
							style={{ backgroundColor: primaryColor }}
						>
							{companyInfo?.logo ? (
								<img
									src={companyInfo.logo}
									alt={displayName.primary}
									className="w-full h-full object-contain rounded-lg"
								/>
							) : (
								displayName.primary.charAt(0)
							)}
						</div>
					)}
					{showCompanyName && (
						<div>
							<h1 className="text-lg font-semibold text-slate-900">
								{displayName.primary}
							</h1>
							{displayName.secondary && (
								<p className="text-xs text-slate-500" dir={locale === "ar" ? "ltr" : "rtl"}>
									{displayName.secondary}
								</p>
							)}
						</div>
					)}
				</div>
				<div
					className="px-4 py-1.5 rounded-full text-white text-sm font-medium"
					style={{ backgroundColor: primaryColor }}
				>
					{getDocumentTypeLabel()}
				</div>
			</div>
		);
	}

	// Modern layout (default)
	return (
		<div className="flex items-start justify-between pb-6 border-b-2" style={{ borderColor: primaryColor }}>
			<div className="flex items-center gap-4">
				{showLogo && (
					<div
						className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
						style={{ backgroundColor: primaryColor }}
					>
						{companyInfo?.logo ? (
							<img
								src={companyInfo.logo}
								alt={displayName.primary}
								className="w-full h-full object-contain rounded-xl"
							/>
						) : (
							displayName.primary.charAt(0)
						)}
					</div>
				)}
				<div>
					{showCompanyName && (
						<>
							<h1 className="text-xl font-bold text-slate-900" style={{ color: primaryColor }}>
								{displayName.primary}
							</h1>
							{displayName.secondary && (
								<p className="text-sm text-slate-500 mt-0.5" dir={locale === "ar" ? "ltr" : "rtl"}>
									{displayName.secondary}
								</p>
							)}
						</>
					)}
					{showAddress && companyInfo?.address && (
						<p className="text-sm text-slate-600 mt-1">{companyInfo.address}</p>
					)}
					{companyInfo?.phone && (
						<p className="text-sm text-slate-500">{companyInfo.phone}</p>
					)}
				</div>
			</div>

			<div className="text-end">
				<div
					className="inline-block px-4 py-2 rounded-xl text-white font-semibold shadow-md"
					style={{ backgroundColor: primaryColor }}
				>
					{getDocumentTypeLabel()}
				</div>
				{companyInfo?.taxNumber && (
					<p className="mt-2 text-xs text-slate-500">
						{t("finance.templates.preview.taxNumber")}: {companyInfo.taxNumber}
					</p>
				)}
			</div>
		</div>
	);
}
