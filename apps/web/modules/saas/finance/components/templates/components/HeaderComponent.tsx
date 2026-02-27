"use client";

import { useTranslations, useLocale } from "next-intl";

interface HeaderComponentProps {
	settings: {
		showLogo?: boolean;
		showCompanyName?: boolean;
		showAddress?: boolean;
		showBilingualName?: boolean;
		showTaxNumber?: boolean;
		showCrNumber?: boolean;
		showPhone?: boolean;
		showEmail?: boolean;
		layout?: "modern" | "classic" | "minimal" | "dark-block";
		// Classic layout extras
		accentStyle?: "gradient-line" | "sidebar" | "bottom-bar" | "none";
		titleSize?: "normal" | "large" | "xlarge";
		subtitleText?: string;
		subtitleStyle?: "gold-caps" | "normal";
		subtitleColor?: string;
		// Modern layout extras
		showTypeBadge?: boolean;
		typeBadgeBackground?: string;
		typeBadgeColor?: string;
		sidebarWidth?: string;
		sidebarGradient?: string;
		// Dark-block layout extras
		blockBackground?: string;
		blockTextColor?: string;
		showInvoiceNumberBadge?: boolean;
		badgeBackground?: string;
		badgeColor?: string;
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
		commercialReg?: string;
	};
	documentType?: "quotation" | "invoice" | "letter";
	primaryColor?: string;
	secondaryColor?: string;
	documentInfo?: {
		number?: string;
		date?: string;
		validUntil?: string;
		invoiceType?: string;
	};
}

export function HeaderComponent({
	settings,
	companyInfo,
	documentType = "quotation",
	primaryColor = "#3b82f6",
	secondaryColor,
	documentInfo,
}: HeaderComponentProps) {
	const t = useTranslations();
	const locale = useLocale();
	const {
		showLogo = true,
		showCompanyName = true,
		showAddress = true,
		showBilingualName = false,
		showTaxNumber = false,
		showPhone = false,
		showEmail = false,
		showCrNumber = false,
		layout = "modern",
		accentStyle,
		titleSize = "normal",
		subtitleText,
		subtitleStyle,
		subtitleColor,
		showTypeBadge,
		typeBadgeBackground,
		typeBadgeColor,
		sidebarWidth,
		sidebarGradient,
		blockBackground,
		blockTextColor,
		showInvoiceNumberBadge,
		badgeBackground,
		badgeColor,
	} = settings;

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

	const titleSizeClass =
		titleSize === "xlarge"
			? "text-3xl"
			: titleSize === "large"
				? "text-2xl"
				: "text-xl";

	// ─── Dark Block Layout ───────────────────────────────────────────────
	if (layout === "dark-block") {
		const bgStyle = blockBackground || "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";
		const txtColor = blockTextColor || "#ffffff";
		const accent = secondaryColor || primaryColor;

		return (
			<div>
				<div
					className="px-8 pt-6 pb-5"
					style={{
						background: bgStyle,
						color: txtColor,
					}}
				>
					<div className="flex items-start justify-between">
						{/* Company info (right side in RTL) */}
						<div className="text-end">
							<div className="flex items-center gap-3 justify-end">
								<div>
									{showCompanyName && (
										<>
											<h1 className={`${titleSizeClass} font-extrabold`}>
												{displayName.primary}
											</h1>
											{displayName.secondary && (
												<p
													className="text-xs mt-0.5 opacity-60"
													style={{ letterSpacing: "2px" }}
													dir={locale === "ar" ? "ltr" : "rtl"}
												>
													{displayName.secondary}
												</p>
											)}
										</>
									)}
								</div>
								{showLogo && (
									<div
										className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl"
										style={{
											background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
											color: txtColor,
										}}
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
							</div>
							{(showAddress || showPhone || showTaxNumber) && (
								<div className="text-xs mt-2 opacity-50 space-y-0.5">
									{showAddress && companyInfo?.address && (
										<p>{companyInfo.address}</p>
									)}
									<p>
										{[
											showPhone && companyInfo?.phone,
											showTaxNumber &&
												companyInfo?.taxNumber &&
												`${t("finance.templates.preview.taxNumber")}: ${companyInfo.taxNumber}`,
										]
											.filter(Boolean)
											.join(" | ")}
									</p>
								</div>
							)}
						</div>

						{/* Title + badge (left side in RTL) */}
						<div className="text-start">
							<h2 className={`${titleSizeClass} font-black leading-none`}>
								{getDocumentTypeLabel()}
							</h2>
							{subtitleText && (
								<p
									className="text-xs font-bold mt-1"
									style={{
										color: subtitleColor || accent,
										letterSpacing: "2px",
									}}
								>
									{subtitleText}
								</p>
							)}
							{showInvoiceNumberBadge && documentInfo?.number && (
								<div
									className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold"
									style={{
										background: badgeBackground || `${accent}26`,
										color: badgeColor || accent,
									}}
								>
									{documentInfo.number}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}

	// ─── Classic Layout (enhanced) ───────────────────────────────────────
	if (layout === "classic") {
		const accent = secondaryColor || primaryColor;

		return (
			<div>
				{/* Top gradient line */}
				{accentStyle === "gradient-line" && (
					<div
						className="h-1"
						style={{
							background: `linear-gradient(90deg, ${primaryColor}, ${accent})`,
						}}
					/>
				)}

				<div className="flex items-start justify-between py-5 px-2">
					{/* Company info (right) */}
					<div className="text-end">
						{showLogo && (
							<div
								className="w-14 h-14 rounded-lg flex items-center justify-center font-extrabold text-lg ms-auto"
								style={{
									background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
									color: accent,
								}}
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
							<>
								<h1
									className="text-lg font-extrabold mt-1.5"
									style={{ color: primaryColor }}
								>
									{displayName.primary}
								</h1>
								{displayName.secondary && (
									<p
										className="text-[10px] text-slate-500"
										style={{ letterSpacing: "1px" }}
										dir={locale === "ar" ? "ltr" : "rtl"}
									>
										{displayName.secondary}
									</p>
								)}
							</>
						)}
						{(showCrNumber || showTaxNumber) && (
							<p className="text-[10px] text-slate-400 mt-0.5">
								{[
									showCrNumber &&
										companyInfo?.commercialReg &&
										`س.ت: ${companyInfo.commercialReg}`,
									showTaxNumber &&
										companyInfo?.taxNumber &&
										`ض: ${companyInfo.taxNumber}`,
								]
									.filter(Boolean)
									.join(" | ")}
							</p>
						)}
						{(showAddress || showPhone) && (
							<p className="text-[10px] text-slate-400">
								{[
									showAddress && companyInfo?.address,
									showPhone && companyInfo?.phone,
								]
									.filter(Boolean)
									.join(" | ")}
							</p>
						)}
					</div>

					{/* Title + invoice info (left) */}
					<div className="text-start">
						<h2
							className={`${titleSizeClass} font-extrabold`}
							style={{ color: primaryColor }}
						>
							{getDocumentTypeLabel()}
						</h2>
						{subtitleText && (
							<p
								className="text-[9px] font-bold"
								style={{
									color: accent,
									letterSpacing: subtitleStyle === "gold-caps" ? "2px" : "0",
									textTransform:
										subtitleStyle === "gold-caps" ? "uppercase" : "none",
								}}
							>
								{subtitleText}
							</p>
						)}
					</div>
				</div>

				<div className="h-px bg-slate-200 mx-2" />
			</div>
		);
	}

	// ─── Minimal Layout ─────────────────────────────────────────────────
	if (layout === "minimal") {
		return (
			<div
				className="flex items-center justify-between pb-4 border-b"
				style={{ borderColor: `${primaryColor}40` }}
			>
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
								<p
									className="text-xs text-slate-500"
									dir={locale === "ar" ? "ltr" : "rtl"}
								>
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

	// ─── Modern Layout (default, enhanced with sidebar/badge) ────────────
	return (
		<div className="relative">
			{/* Optional sidebar accent */}
			{accentStyle === "sidebar" && (
				<div
					className="absolute start-0 top-0 bottom-0"
					style={{
						width: sidebarWidth || "6px",
						background:
							sidebarGradient ||
							`linear-gradient(180deg, ${primaryColor}, ${primaryColor}cc)`,
						borderRadius: "0 4px 4px 0",
					}}
				/>
			)}

			<div
				className="flex items-start justify-between pb-6 border-b-2"
				style={{
					borderColor: primaryColor,
					paddingInlineStart: accentStyle === "sidebar" ? "16px" : undefined,
				}}
			>
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
								<h1
									className="text-xl font-bold text-slate-900"
									style={{ color: primaryColor }}
								>
									{displayName.primary}
								</h1>
								{displayName.secondary && (
									<p
										className="text-sm text-slate-500 mt-0.5"
										dir={locale === "ar" ? "ltr" : "rtl"}
									>
										{displayName.secondary}
									</p>
								)}
							</>
						)}
						{showAddress && companyInfo?.address && (
							<p className="text-sm text-slate-600 mt-1">
								{companyInfo.address}
							</p>
						)}
						{showPhone && companyInfo?.phone && (
							<p className="text-sm text-slate-500">{companyInfo.phone}</p>
						)}
						{showTaxNumber && companyInfo?.taxNumber && (
							<p className="text-xs text-slate-400 mt-0.5">
								{t("finance.templates.preview.taxNumber")}:{" "}
								{companyInfo.taxNumber}
							</p>
						)}
					</div>
				</div>

				<div className="text-end">
					{/* Type badge (pill) */}
					{showTypeBadge && (
						<div
							className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2"
							style={{
								background: typeBadgeBackground || `${primaryColor}15`,
								color: typeBadgeColor || primaryColor,
							}}
						>
							{documentInfo?.invoiceType || getDocumentTypeLabel()}
						</div>
					)}

					{/* Title */}
					<div
						className={`${titleSize === "xlarge" ? "text-3xl" : "text-xl"} font-black`}
						style={{
							color: secondaryColor || primaryColor,
						}}
					>
						{!showTypeBadge && (
							<div
								className="inline-block px-4 py-2 rounded-xl text-white font-semibold shadow-md"
								style={{ backgroundColor: primaryColor }}
							>
								{getDocumentTypeLabel()}
							</div>
						)}
						{showTypeBadge && getDocumentTypeLabel()}
					</div>

					{!showTypeBadge && companyInfo?.taxNumber && (
						<p className="mt-2 text-xs text-slate-500">
							{t("finance.templates.preview.taxNumber")}:{" "}
							{companyInfo.taxNumber}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
