"use client";

import { useTranslations } from "next-intl";

interface ClientInfoComponentProps {
	settings: {
		showTaxNumber?: boolean;
		showEmail?: boolean;
		showPhone?: boolean;
		showCompanyName?: boolean;
		showAddress?: boolean;
		showCompanyInfo?: boolean;
		showCompanyPhone?: boolean;
		showInvoiceNumber?: boolean;
		showInvoiceType?: boolean;
		showIssueDate?: boolean;
		showDueDate?: boolean;
		showStatus?: boolean;
		// Layout variants
		layout?: "default" | "bordered-right" | "two-cards" | "highlight-card" | "client-with-qr";
		// Bordered-right settings
		clientBackground?: string;
		borderColor?: string;
		labelStyle?: "default" | "gold-small" | "orange-uppercase" | "green-dot";
		labelColor?: string;
		// Two-cards settings
		invoiceCardBackground?: string;
		clientCardBackground?: string;
		clientCardBorder?: string;
		borderSide?: "right" | "left";
		borderRadius?: string;
		// Highlight-card settings
		background?: string;
		// QR settings
		showQrCode?: boolean;
		qrSize?: "small" | "medium" | "large";
	};
	clientInfo?: {
		name?: string;
		company?: string;
		address?: string;
		phone?: string;
		email?: string;
		taxNumber?: string;
	};
	companyInfo?: {
		name?: string;
		nameAr?: string;
		nameEn?: string;
		address?: string;
		phone?: string;
		email?: string;
		taxNumber?: string;
		commercialReg?: string;
	};
	documentInfo?: {
		number?: string;
		date?: string;
		validUntil?: string;
		invoiceType?: string;
	};
	primaryColor?: string;
	secondaryColor?: string;
	qrCode?: string | null;
	documentType?: "quotation" | "invoice";
}

export function ClientInfoComponent({
	settings,
	clientInfo,
	companyInfo,
	documentInfo,
	primaryColor = "#3b82f6",
	secondaryColor,
	qrCode,
	documentType,
}: ClientInfoComponentProps) {
	const t = useTranslations();
	const {
		showTaxNumber = true,
		showEmail = true,
		showPhone = true,
		showCompanyInfo = false,
		showCompanyPhone = true,
		layout = "default",
		clientBackground,
		borderColor,
		labelStyle = "default",
		labelColor,
		invoiceCardBackground,
		clientCardBackground,
		clientCardBorder,
		borderSide = "right",
		borderRadius = "0",
		showQrCode = false,
		qrSize = "medium",
	} = settings;

	const accent = secondaryColor || primaryColor;

	const billToLabel =
		documentType === "quotation"
			? t("finance.templates.preview.quotationTo")
			: t("finance.templates.preview.billTo");

	// QR size mapping
	const qrSizeMap = { small: 80, medium: 110, large: 140 };
	const qrSizePx = qrSizeMap[qrSize] || 110;

	// Label renderer based on style
	const renderLabel = (text: string) => {
		switch (labelStyle) {
			case "gold-small":
				return (
					<span
						className="text-[10px] font-bold"
						style={{ color: labelColor || accent }}
					>
						{text}
					</span>
				);
			case "orange-uppercase":
				return (
					<span
						className="text-[9px] font-bold uppercase"
						style={{
							color: labelColor || primaryColor,
							letterSpacing: "1px",
						}}
					>
						{text}
					</span>
				);
			case "green-dot":
				return (
					<span className="flex items-center gap-1.5 text-xs font-bold">
						<span
							className="w-1.5 h-1.5 rounded-full inline-block"
							style={{ background: labelColor || primaryColor }}
						/>
						<span style={{ color: labelColor || primaryColor }}>{text}</span>
					</span>
				);
			default:
				return (
					<span
						className="text-sm font-semibold uppercase tracking-wide"
						style={{ color: labelColor || "#334155" }}
					>
						{text}
					</span>
				);
		}
	};

	// QR code renderer (real or placeholder)
	const renderQr = () => {
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

	// Shared company info renderer
	const renderCompanyInfoBlock = (className?: string) => {
		if (!showCompanyInfo || !companyInfo) return null;
		return (
			<div className={className}>
				<div className="mb-1">
					{renderLabel(t("finance.templates.preview.companyInfo"))}
				</div>
				<p className="font-bold text-sm mt-1">
					{companyInfo.name || t("finance.templates.preview.companyName")}
				</p>
				{companyInfo.address && (
					<p className="text-xs text-slate-500 mt-0.5">
						{companyInfo.address}
					</p>
				)}
				{companyInfo.commercialReg && (
					<p className="text-xs text-slate-500">
						{t("finance.templates.preview.crNumber")}: {companyInfo.commercialReg}
					</p>
				)}
				{companyInfo.taxNumber && (
					<p className="text-xs text-slate-500">
						{t("finance.templates.preview.taxNumber")}: {companyInfo.taxNumber}
					</p>
				)}
				{showCompanyPhone && companyInfo.phone && (
					<p className="text-xs text-slate-500">{companyInfo.phone}</p>
				)}
				{companyInfo.email && (
					<p className="text-xs text-slate-500">{companyInfo.email}</p>
				)}
			</div>
		);
	};

	// ─── Client with QR Layout ──────────────────────────────────────────
	if (layout === "client-with-qr") {
		const bg = clientBackground || "#f8f7f4";
		const bColor = borderColor || accent;

		return (
			<div className="py-2 client-info-card">
				<div className="flex gap-4 items-start">
					{/* Client info (right side in RTL) */}
					<div
						className="flex-1 p-4 rounded-sm"
						style={{
							background: bg,
							borderRight: `3px solid ${bColor}`,
							borderRadius: "0 6px 6px 0",
						}}
					>
						<div className="mb-2">
							{renderLabel(billToLabel)}
						</div>
						<div className="space-y-0.5">
							<p className="font-bold text-sm">
								{clientInfo?.name || t("finance.templates.preview.clientName")}
							</p>
							{clientInfo?.company && (
								<p className="text-xs text-slate-600">{clientInfo.company}</p>
							)}
							{clientInfo?.address && (
								<p className="text-xs text-slate-500">{clientInfo.address}</p>
							)}
							{showTaxNumber && clientInfo?.taxNumber && (
								<p className="text-xs text-slate-500">
									{t("finance.templates.preview.taxNumber")}: {clientInfo.taxNumber}
								</p>
							)}
							{showPhone && clientInfo?.phone && (
								<p className="text-xs text-slate-500">{clientInfo.phone}</p>
							)}
							{showEmail && clientInfo?.email && (
								<p className="text-xs text-slate-500">{clientInfo.email}</p>
							)}
						</div>
					</div>

					{/* QR Code (left side in RTL) */}
					{showQrCode && (
						<div className="flex items-center justify-center pt-4">
							{renderQr()}
						</div>
					)}
				</div>
			</div>
		);
	}

	// ─── Bordered Right Layout ───────────────────────────────────────────
	if (layout === "bordered-right") {
		const bg = clientBackground || "#f8f7f4";
		const bColor = borderColor || accent;

		return (
			<div className="py-2 client-info-card">
				<div className="flex gap-4">
					{/* Client card with border */}
					<div
						className="flex-1 p-4 rounded-sm"
						style={{
							background: bg,
							borderRight: `3px solid ${bColor}`,
							borderRadius: `0 6px 6px 0`,
						}}
					>
						<div className="mb-2">
							{renderLabel(billToLabel)}
						</div>
						<div className="flex justify-between">
							<div className="text-end">
								<p className="font-bold text-sm">
									{clientInfo?.name ||
										t("finance.templates.preview.clientName")}
								</p>
								{clientInfo?.address && (
									<p className="text-xs text-slate-500 mt-0.5">
										{clientInfo.address}
									</p>
								)}
							</div>
							<div className="text-start text-xs text-slate-500 space-y-0.5">
								{showTaxNumber && clientInfo?.taxNumber && (
									<p>
										{t("finance.templates.preview.taxNumber")}:{" "}
										{clientInfo.taxNumber}
									</p>
								)}
								{showPhone && clientInfo?.phone && <p>{clientInfo.phone}</p>}
								{showEmail && clientInfo?.email && <p>{clientInfo.email}</p>}
							</div>
						</div>
					</div>

					{/* Company info card */}
					{showCompanyInfo && companyInfo && (
						<div
							className="flex-1 p-4 rounded-sm"
							style={{
								background: bg,
								borderRadius: "6px",
							}}
						>
							{renderCompanyInfoBlock()}
						</div>
					)}
				</div>
			</div>
		);
	}

	// ─── Two Cards Layout ────────────────────────────────────────────────
	if (layout === "two-cards") {
		const companyBg = invoiceCardBackground || "#fafafa";
		const clientBg = clientCardBackground || "#fff7ed";
		const clientBorderCss = clientCardBorder || `3px solid ${primaryColor}`;
		const radius = borderRadius || "8px";

		return (
			<div className="py-2 client-info-card">
				<div className="flex gap-4">
					{/* Company info card (replaces old invoice details card) */}
					{showCompanyInfo && companyInfo ? (
						<div
							className="flex-1 p-3"
							style={{ background: companyBg, borderRadius: radius }}
						>
							{renderCompanyInfoBlock()}
						</div>
					) : (
						<div
							className="flex-1 p-3"
							style={{ background: companyBg, borderRadius: radius }}
						>
							<div className="mb-2">
								{renderLabel(t("finance.templates.preview.companyInfo"))}
							</div>
							<p className="text-xs text-slate-400">
								{t("finance.templates.preview.companyName")}
							</p>
						</div>
					)}

					{/* Client card */}
					<div
						className="flex-[1.3] p-3"
						style={{
							background: clientBg,
							borderRadius: radius,
							[borderSide === "right"
								? "borderRight"
								: "borderLeft"]: clientBorderCss,
						}}
					>
						<div className="mb-2">
							{renderLabel(billToLabel)}
						</div>
						<p className="font-bold text-sm">
							{clientInfo?.name ||
								t("finance.templates.preview.clientName")}
						</p>
						{clientInfo?.address && (
							<p className="text-xs text-slate-500 mt-0.5">
								{clientInfo.address}
							</p>
						)}
						{showTaxNumber && clientInfo?.taxNumber && (
							<p className="text-xs text-slate-500">
								{t("finance.templates.preview.taxNumber")}:{" "}
								{clientInfo.taxNumber}
							</p>
						)}
						{showPhone && clientInfo?.phone && (
							<p className="text-xs text-slate-500">{clientInfo.phone}</p>
						)}
					</div>
				</div>
			</div>
		);
	}

	// ─── Highlight Card Layout ───────────────────────────────────────────
	if (layout === "highlight-card") {
		const bg = settings.background || "#f0fdf4";
		const bColor = settings.borderColor || "#bbf7d0";
		const radius = borderRadius || "8px";

		return (
			<div className="py-2 client-info-card">
				<div className="flex gap-4">
					<div
						className="flex-1 p-4"
						style={{
							background: bg,
							borderRadius: radius,
							border: `1px solid ${bColor}`,
						}}
					>
						<div className="flex justify-between">
							<div className="text-end">
								<div className="mb-1">
									{renderLabel(billToLabel)}
								</div>
								<p className="font-bold text-sm mt-1">
									{clientInfo?.name ||
										t("finance.templates.preview.clientName")}
								</p>
								{clientInfo?.address && (
									<p className="text-xs text-slate-500 mt-0.5">
										{clientInfo.address}
									</p>
								)}
							</div>
							<div className="text-start text-xs text-slate-500 space-y-0.5 mt-6">
								{showTaxNumber && clientInfo?.taxNumber && (
									<p>
										{t("finance.templates.preview.taxNumber")}:{" "}
										<strong className="text-slate-800">
											{clientInfo.taxNumber}
										</strong>
									</p>
								)}
								{showPhone && clientInfo?.phone && <p>{clientInfo.phone}</p>}
								{showEmail && clientInfo?.email && <p>{clientInfo.email}</p>}
							</div>
						</div>
					</div>

					{/* Company info alongside */}
					{showCompanyInfo && companyInfo && (
						<div
							className="flex-1 p-4"
							style={{
								background: bg,
								borderRadius: radius,
								border: `1px solid ${bColor}`,
							}}
						>
							{renderCompanyInfoBlock()}
						</div>
					)}
				</div>
			</div>
		);
	}

	// ─── Default Layout ──────────────────────────────────────────────────
	return (
		<div className="grid grid-cols-2 gap-6 py-3 client-info-card">
			{/* Client Info */}
			<div className="space-y-1.5">
				<h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
					{billToLabel}
				</h3>
				<div className="space-y-0.5">
					<p className="font-medium text-slate-900">
						{clientInfo?.name ||
							t("finance.templates.preview.clientName")}
					</p>
					{clientInfo?.company && (
						<p className="text-sm text-slate-600">{clientInfo.company}</p>
					)}
					{clientInfo?.address && (
						<p className="text-sm text-slate-500">{clientInfo.address}</p>
					)}
					{showPhone && clientInfo?.phone && (
						<p className="text-sm text-slate-500">{clientInfo.phone}</p>
					)}
					{showEmail && clientInfo?.email && (
						<p className="text-sm text-slate-500">{clientInfo.email}</p>
					)}
					{showTaxNumber && clientInfo?.taxNumber && (
						<p className="text-sm text-slate-500">
							{t("finance.templates.preview.taxNumber")}:{" "}
							{clientInfo.taxNumber}
						</p>
					)}
				</div>
			</div>

			{/* Company Info (replaces old Document Info) */}
			{showCompanyInfo && companyInfo ? (
				<div className="space-y-1.5">
					<h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
						{t("finance.templates.preview.companyInfo")}
					</h3>
					<div className="space-y-0.5">
						<p className="font-medium text-slate-900">
							{companyInfo.name || t("finance.templates.preview.companyName")}
						</p>
						{companyInfo.address && (
							<p className="text-sm text-slate-500">{companyInfo.address}</p>
						)}
						{companyInfo.commercialReg && (
							<p className="text-sm text-slate-500">
								{t("finance.templates.preview.crNumber")}: {companyInfo.commercialReg}
							</p>
						)}
						{companyInfo.taxNumber && (
							<p className="text-sm text-slate-500">
								{t("finance.templates.preview.taxNumber")}: {companyInfo.taxNumber}
							</p>
						)}
						{showCompanyPhone && companyInfo.phone && (
							<p className="text-sm text-slate-500">{companyInfo.phone}</p>
						)}
					</div>
				</div>
			) : (
				<div className="space-y-1.5">
					<h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
						{t("finance.templates.preview.companyInfo")}
					</h3>
					<p className="text-sm text-slate-400">
						{t("finance.templates.preview.companyName")}
					</p>
				</div>
			)}
		</div>
	);
}
