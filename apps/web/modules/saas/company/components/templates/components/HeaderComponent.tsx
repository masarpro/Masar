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
		layout?: "modern" | "classic" | "minimal" | "dark-block" | "bilingual";
		// Company name settings
		companyNameSize?: "small" | "medium" | "large" | "xlarge";
		companyNameAlign?: "start" | "center" | "end";
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
		// Document type label override
		documentTypeLabel?: string;
		// Logo position in classic layout
		logoPosition?: "top" | "right" | "left" | "center";
		// QR code in header (replaces title area)
		showQrInHeader?: boolean;
		qrSize?: "small" | "medium" | "large";
		// Show document number/date in header (below title)
		showDocumentNumber?: boolean;
		showDocumentDate?: boolean;
		// Hide entire title block (document type, subtitle, number, date) in header
		showTitleInHeader?: boolean;
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
	logoSize?: number;
	logoBackground?: boolean;
	qrCode?: string | null;
}

export function HeaderComponent({
	settings,
	companyInfo,
	documentType = "quotation",
	primaryColor = "#3b82f6",
	secondaryColor,
	documentInfo,
	logoSize = 64,
	logoBackground = true,
	qrCode,
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
		companyNameSize = "large",
		companyNameAlign = "start",
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
		documentTypeLabel,
		logoPosition = "top",
		showQrInHeader,
		qrSize = "medium",
		showDocumentNumber = false,
		showDocumentDate = false,
		showTitleInHeader = true,
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
		if (documentTypeLabel) return documentTypeLabel;
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

	const companyNameSizeClass =
		companyNameSize === "xlarge"
			? "text-3xl"
			: companyNameSize === "large"
				? "text-2xl"
				: companyNameSize === "medium"
					? "text-xl"
					: "text-base";

	const companyNameAlignClass =
		companyNameAlign === "center"
			? "text-center"
			: companyNameAlign === "end"
				? "text-end"
				: "text-start";

	const logoSizePx = `${logoSize}px`;

	const renderLogo = (bgColor: string, txtColor: string, roundedClass = "rounded-xl") => {
		if (!showLogo) return null;

		const baseStyle: React.CSSProperties = {
			width: logoSizePx,
			height: logoSizePx,
			minWidth: logoSizePx,
			minHeight: logoSizePx,
		};

		if (companyInfo?.logo) {
			if (logoBackground) {
				return (
					<div
						className={`${roundedClass} flex items-center justify-center overflow-hidden`}
						style={{
							...baseStyle,
							background: bgColor,
						}}
					>
						<img
							src={companyInfo.logo}
							alt={displayName.primary}
							className={`w-full h-full object-contain ${roundedClass}`}
						/>
					</div>
				);
			}
			return (
				<img
					src={companyInfo.logo}
					alt={displayName.primary}
					className={`object-contain ${roundedClass}`}
					style={baseStyle}
				/>
			);
		}

		return (
			<div
				className={`${roundedClass} flex items-center justify-center font-black`}
				style={{
					...baseStyle,
					fontSize: `${Math.max(logoSize * 0.4, 14)}px`,
					background: bgColor,
					color: txtColor,
				}}
			>
				{displayName.primary.charAt(0)}
			</div>
		);
	};

	// QR size mapping
	const qrSizeMap = { small: 60, medium: 80, large: 100 };
	const qrSizePx = qrSizeMap[qrSize] || 80;

	const renderQrPlaceholder = () => {
		if (qrCode) {
			return (
				<div className="bg-white p-1.5 rounded-lg border border-slate-200 inline-block">
					<img
						src={qrCode}
						alt="QR Code"
						style={{ width: `${qrSizePx}px`, height: `${qrSizePx}px` }}
					/>
				</div>
			);
		}
		// Placeholder SVG
		return (
			<div
				className="border-2 rounded-lg flex items-center justify-center bg-white"
				style={{ width: `${qrSizePx}px`, height: `${qrSizePx}px`, borderColor: "#1a1a2e" }}
			>
				<svg viewBox="0 0 100 100" className="w-full h-full p-2" fill="#1a1a2e">
					<rect x="0" y="0" width="28" height="28" />
					<rect x="4" y="4" width="20" height="20" fill="white" />
					<rect x="8" y="8" width="12" height="12" />
					<rect x="72" y="0" width="28" height="28" />
					<rect x="76" y="4" width="20" height="20" fill="white" />
					<rect x="80" y="8" width="12" height="12" />
					<rect x="0" y="72" width="28" height="28" />
					<rect x="4" y="76" width="20" height="20" fill="white" />
					<rect x="8" y="80" width="12" height="12" />
					<rect x="36" y="36" width="8" height="8" />
					<rect x="48" y="36" width="4" height="4" />
					<rect x="56" y="36" width="4" height="4" />
					<rect x="36" y="48" width="4" height="4" />
					<rect x="48" y="48" width="4" height="4" />
					<rect x="80" y="36" width="4" height="4" />
					<rect x="88" y="36" width="4" height="4" />
					<rect x="36" y="80" width="4" height="4" />
					<rect x="52" y="80" width="4" height="4" />
					<rect x="76" y="76" width="4" height="4" />
					<rect x="88" y="92" width="4" height="4" />
				</svg>
			</div>
		);
	};

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
											<h1 className={`${companyNameSizeClass} font-extrabold`}>
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
								{renderLogo(`linear-gradient(135deg, ${accent}, ${accent}cc)`, txtColor)}
							</div>
							{(showAddress || showPhone || showTaxNumber || showCrNumber) && (
								<div className="text-xs mt-2 opacity-50 space-y-0.5">
									{showAddress && companyInfo?.address && (
										<p>{companyInfo.address}</p>
									)}
									<p>
										{[
											showCrNumber &&
												companyInfo?.commercialReg &&
												`${t("finance.templates.preview.crNumber")}: ${companyInfo.commercialReg}`,
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

	// ─── Bilingual Layout (Arabic right + Logo center + English left) ────
	if (layout === "bilingual") {
		const accent = secondaryColor || primaryColor;
		const logoBg = `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`;

		const infoRowAr = [
			showCrNumber && companyInfo?.commercialReg && `${t("finance.templates.preview.crNumberShort")}: ${companyInfo.commercialReg}`,
			companyInfo?.taxNumber && `${t("finance.templates.preview.taxNumber")}: ${companyInfo.taxNumber}`,
		].filter(Boolean);

		const infoRowEn = [
			showCrNumber && companyInfo?.commercialReg && `CR: ${companyInfo.commercialReg}`,
			companyInfo?.taxNumber && `VAT: ${companyInfo.taxNumber}`,
		].filter(Boolean);

		return (
			<div>
				{/* Optional top accent line */}
				<div
					className="h-1"
					style={{
						background: `linear-gradient(90deg, ${primaryColor}, ${accent})`,
					}}
				/>

				<div className="flex items-start justify-between py-5 px-2">
					{/* Arabic info (right side) */}
					<div className="flex-1 text-end" dir="rtl">
						<h1
							className={`${companyNameSizeClass} font-extrabold`}
							style={{ color: primaryColor }}
						>
							{companyInfo?.nameAr || companyInfo?.name || t("finance.templates.preview.companyName")}
						</h1>
						{showAddress && companyInfo?.addressAr && (
							<p className="text-[10px] text-slate-400 mt-0.5">
								{companyInfo.addressAr}
							</p>
						)}
						{showPhone && companyInfo?.phone && (
							<p className="text-[10px] text-slate-400">
								{companyInfo.phone}
							</p>
						)}
						{infoRowAr.length > 0 && (
							<p className="text-[10px] text-slate-400">
								{infoRowAr.join(" | ")}
							</p>
						)}
					</div>

					{/* Logo (center) */}
					<div className="flex justify-center px-6 shrink-0">
						{renderLogo(logoBg, accent, "rounded-lg")}
					</div>

					{/* English info (left side) */}
					<div className="flex-1 text-start" dir="ltr">
						<h1
							className={`${companyNameSizeClass} font-extrabold`}
							style={{ color: primaryColor }}
						>
							{companyInfo?.nameEn || companyInfo?.name || t("finance.templates.preview.companyName")}
						</h1>
						{showAddress && companyInfo?.addressEn && (
							<p className="text-[10px] text-slate-400 mt-0.5">
								{companyInfo.addressEn}
							</p>
						)}
						{showPhone && companyInfo?.phone && (
							<p className="text-[10px] text-slate-400">
								{companyInfo.phone}
							</p>
						)}
						{infoRowEn.length > 0 && (
							<p className="text-[10px] text-slate-400">
								{infoRowEn.join(" | ")}
							</p>
						)}
					</div>
				</div>

				<div className="h-px bg-slate-200 mx-2" />
			</div>
		);
	}

	// ─── Classic Layout (enhanced) ───────────────────────────────────────
	if (layout === "classic") {
		const accent = secondaryColor || primaryColor;
		const logoBg = `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`;

		// Company name block (reused across positions)
		const companyNameBlock = (
			<>
				{showCompanyName && (
					<>
						<h1
							className={`${companyNameSizeClass} font-extrabold ${companyNameAlignClass}`}
							style={{ color: primaryColor }}
						>
							{displayName.primary}
						</h1>
						{displayName.secondary && (
							<p
								className={`text-[10px] text-slate-500 ${companyNameAlignClass}`}
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
								`${t("finance.templates.preview.crNumberShort")}: ${companyInfo.commercialReg}`,
							showTaxNumber &&
								companyInfo?.taxNumber &&
								`${t("finance.templates.preview.taxNumberShort")}: ${companyInfo.taxNumber}`,
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
			</>
		);

		// Title / QR block (reused across positions) — hidden when showTitleInHeader is false
		const titleBlock =
			!showTitleInHeader ? null : (
				<div className="text-start">
					{showQrInHeader ? (
						<div className="flex flex-col items-start">
							{renderQrPlaceholder()}
						</div>
					) : (
						<>
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
							{showDocumentNumber && documentInfo?.number && (
								<p className="text-xs text-slate-600 mt-2">
									<span className="text-slate-400">{t("finance.templates.preview.documentNumber")}:</span>{" "}
									<strong>{documentInfo.number}</strong>
								</p>
							)}
							{showDocumentDate && documentInfo?.date && (
								<p className="text-xs text-slate-600 mt-0.5">
									<span className="text-slate-400">{t("finance.templates.preview.date")}:</span>{" "}
									<strong>{documentInfo.date}</strong>
								</p>
							)}
						</>
					)}
				</div>
			);

		// Logo position: center — logo in the middle of the header
		if (logoPosition === "center") {
			return (
				<div>
					{accentStyle === "gradient-line" && (
						<div
							className="h-1"
							style={{
								background: `linear-gradient(90deg, ${primaryColor}, ${accent})`,
							}}
						/>
					)}
					<div className="flex items-start justify-between py-5 px-2">
						{/* Company info (right in RTL) */}
						<div className="text-end flex-1">
							{companyNameBlock}
						</div>
						{/* Logo (center) */}
						{showLogo && (
							<div className="flex justify-center px-6">
								{renderLogo(logoBg, accent, "rounded-lg")}
							</div>
						)}
						{/* Title (left in RTL) */}
						<div className="flex-1">
							{titleBlock}
						</div>
					</div>
					<div className="h-px bg-slate-200 mx-2" />
				</div>
			);
		}

		// For top / right / left positions
		return (
			<div>
				{accentStyle === "gradient-line" && (
					<div
						className="h-1"
						style={{
							background: `linear-gradient(90deg, ${primaryColor}, ${accent})`,
						}}
					/>
				)}

				<div className="flex items-start justify-between py-5 px-2">
					{/* Company info (right in RTL) */}
					<div className="text-end">
						{logoPosition === "top" && showLogo && (
							<div className="ms-auto" style={{ width: logoSizePx }}>
								{renderLogo(logoBg, accent, "rounded-lg")}
							</div>
						)}

						{(logoPosition === "right" || logoPosition === "left") && showLogo ? (
							<div
								className={`flex items-center gap-3 justify-end ${
									logoPosition === "left" ? "flex-row-reverse" : ""
								}`}
							>
								{renderLogo(logoBg, accent, "rounded-lg")}
								<div className="text-end">
									{companyNameBlock}
								</div>
							</div>
						) : (
							<div className={logoPosition === "top" ? "mt-1.5" : ""}>
								{companyNameBlock}
							</div>
						)}
					</div>

					{/* Title or QR code (left in RTL) */}
					{titleBlock}
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
					{renderLogo(primaryColor, "#ffffff", "rounded-lg")}
					{showCompanyName && (
						<div>
							<h1 className={`${companyNameSizeClass} font-semibold text-slate-900`}>
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
							{showCrNumber && companyInfo?.commercialReg && (
								<p className="text-[10px] text-slate-400 mt-0.5">
									{t("finance.templates.preview.crNumber")}: {companyInfo.commercialReg}
								</p>
							)}
						</div>
					)}
				</div>
				<div className="text-start">
					<div
						className="px-4 py-1.5 rounded-full text-white text-sm font-medium inline-block"
						style={{ backgroundColor: primaryColor }}
					>
						{getDocumentTypeLabel()}
					</div>
					{showDocumentNumber && documentInfo?.number && (
						<p className="text-xs text-slate-600 mt-2">
							<span className="text-slate-400">{t("finance.templates.preview.documentNumber")}:</span>{" "}
							<strong>{documentInfo.number}</strong>
						</p>
					)}
					{showDocumentDate && documentInfo?.date && (
						<p className="text-xs text-slate-600 mt-0.5">
							<span className="text-slate-400">{t("finance.templates.preview.date")}:</span>{" "}
							<strong>{documentInfo.date}</strong>
						</p>
					)}
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
					{renderLogo(primaryColor, "#ffffff")}
					<div>
						{showCompanyName && (
							<>
								<h1
									className={`${companyNameSizeClass} font-bold text-slate-900 ${companyNameAlignClass}`}
									style={{ color: primaryColor }}
								>
									{displayName.primary}
								</h1>
								{displayName.secondary && (
									<p
										className={`text-sm text-slate-500 mt-0.5 ${companyNameAlignClass}`}
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
						{showCrNumber && companyInfo?.commercialReg && (
							<p className="text-xs text-slate-400 mt-0.5">
								{t("finance.templates.preview.crNumber")}: {companyInfo.commercialReg}
							</p>
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
					{showDocumentNumber && documentInfo?.number && (
						<p className="text-xs text-slate-600 mt-2">
							<span className="text-slate-400">{t("finance.templates.preview.documentNumber")}:</span>{" "}
							<strong>{documentInfo.number}</strong>
						</p>
					)}
					{showDocumentDate && documentInfo?.date && (
						<p className="text-xs text-slate-600 mt-0.5">
							<span className="text-slate-400">{t("finance.templates.preview.date")}:</span>{" "}
							<strong>{documentInfo.date}</strong>
						</p>
					)}

					</div>
			</div>
		</div>
	);
}
