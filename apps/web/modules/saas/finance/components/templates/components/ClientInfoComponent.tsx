"use client";

import { useTranslations } from "next-intl";
import { formatDateArabic } from "../../../lib/utils";

interface ClientInfoComponentProps {
	settings: {
		showTaxNumber?: boolean;
		showEmail?: boolean;
		showPhone?: boolean;
		showCompanyName?: boolean;
		showAddress?: boolean;
		showInvoiceNumber?: boolean;
		showInvoiceType?: boolean;
		showIssueDate?: boolean;
		showDueDate?: boolean;
		showStatus?: boolean;
		// Layout variants
		layout?: "default" | "bordered-right" | "two-cards" | "highlight-card";
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
	};
	clientInfo?: {
		name?: string;
		company?: string;
		address?: string;
		phone?: string;
		email?: string;
		taxNumber?: string;
	};
	documentInfo?: {
		number?: string;
		date?: string;
		validUntil?: string;
		invoiceType?: string;
	};
	primaryColor?: string;
	secondaryColor?: string;
}

export function ClientInfoComponent({
	settings,
	clientInfo,
	documentInfo,
	primaryColor = "#3b82f6",
	secondaryColor,
}: ClientInfoComponentProps) {
	const t = useTranslations();
	const {
		showTaxNumber = true,
		showEmail = true,
		showPhone = true,
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
	} = settings;

	const accent = secondaryColor || primaryColor;

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
						style={{ color: primaryColor }}
					>
						{text}
					</span>
				);
		}
	};

	// ─── Bordered Right Layout ───────────────────────────────────────────
	if (layout === "bordered-right") {
		const bg = clientBackground || "#f8f7f4";
		const bColor = borderColor || accent;

		return (
			<div className="py-4">
				{/* Document meta row */}
				{(documentInfo?.number || documentInfo?.date) && (
					<div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-3 text-sm">
						{documentInfo?.number && (
							<div>
								<span className="text-slate-500">
									{t("finance.templates.preview.documentNumber")}:
								</span>{" "}
								<strong>{documentInfo.number}</strong>
							</div>
						)}
						{documentInfo?.date && (
							<div>
								<span className="text-slate-500">
									{t("finance.templates.preview.date")}:
								</span>{" "}
								{documentInfo.date}
							</div>
						)}
						{documentInfo?.validUntil && (
							<div>
								<span className="text-slate-500">
									{t("finance.templates.preview.validUntil")}:
								</span>{" "}
								{documentInfo.validUntil}
							</div>
						)}
					</div>
				)}

				{/* Client card with border */}
				<div
					className="p-4 rounded-sm"
					style={{
						background: bg,
						borderRight: `3px solid ${bColor}`,
						borderRadius: `0 6px 6px 0`,
					}}
				>
					<div className="mb-2">
						{renderLabel(t("finance.templates.preview.billTo"))}
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
			</div>
		);
	}

	// ─── Two Cards Layout ────────────────────────────────────────────────
	if (layout === "two-cards") {
		const invoiceBg = invoiceCardBackground || "#fafafa";
		const clientBg = clientCardBackground || "#fff7ed";
		const clientBorderCss = clientCardBorder || `3px solid ${primaryColor}`;
		const radius = borderRadius || "8px";

		return (
			<div className="py-4">
				<div className="flex gap-4">
					{/* Invoice details card */}
					<div
						className="flex-1 p-3"
						style={{ background: invoiceBg, borderRadius: radius }}
					>
						<div className="mb-2">
							{renderLabel(t("finance.templates.preview.documentDetails"))}
						</div>
						<div className="space-y-1.5 text-sm">
							{documentInfo?.number && (
								<div className="flex justify-between">
									<span className="text-slate-400">
										{t("finance.templates.preview.documentNumber")}
									</span>
									<span className="font-semibold">
										{documentInfo.number}
									</span>
								</div>
							)}
							{documentInfo?.date && (
								<div className="flex justify-between">
									<span className="text-slate-400">
										{t("finance.templates.preview.date")}
									</span>
									<span className="font-semibold">{documentInfo.date}</span>
								</div>
							)}
							{documentInfo?.validUntil && (
								<div className="flex justify-between">
									<span className="text-slate-400">
										{t("finance.templates.preview.validUntil")}
									</span>
									<span className="font-semibold">
										{documentInfo.validUntil}
									</span>
								</div>
							)}
						</div>
					</div>

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
							{renderLabel(t("finance.templates.preview.billTo"))}
						</div>
						<p className="font-bold text-sm">
							{clientInfo?.name ||
								t("finance.templates.preview.clientName")}
						</p>
						{clientInfo?.address && (
							<p className="text-xs text-slate-500 mt-1">
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
			<div className="py-4">
				<div
					className="p-4"
					style={{
						background: bg,
						borderRadius: radius,
						border: `1px solid ${bColor}`,
					}}
				>
					<div className="flex justify-between">
						<div className="text-end">
							<div className="mb-1">
								{renderLabel(t("finance.templates.preview.billTo"))}
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
			</div>
		);
	}

	// ─── Default Layout ──────────────────────────────────────────────────
	return (
		<div className="grid grid-cols-2 gap-6 py-6">
			{/* Client Info */}
			<div className="space-y-3">
				<h3
					className="text-sm font-semibold uppercase tracking-wide"
					style={{ color: primaryColor }}
				>
					{t("finance.templates.preview.billTo")}
				</h3>
				<div className="space-y-1">
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

			{/* Document Info */}
			<div className="space-y-3">
				<h3
					className="text-sm font-semibold uppercase tracking-wide"
					style={{ color: primaryColor }}
				>
					{t("finance.templates.preview.documentDetails")}
				</h3>
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-slate-500">
							{t("finance.templates.preview.documentNumber")}:
						</span>
						<span className="font-medium text-slate-900">
							{documentInfo?.number || "QT-2024-001"}
						</span>
					</div>
					<div className="flex justify-between text-sm">
						<span className="text-slate-500">
							{t("finance.templates.preview.date")}:
						</span>
						<span className="font-medium text-slate-900">
							{documentInfo?.date || formatDateArabic(new Date())}
						</span>
					</div>
					{documentInfo?.validUntil && (
						<div className="flex justify-between text-sm">
							<span className="text-slate-500">
								{t("finance.templates.preview.validUntil")}:
							</span>
							<span className="font-medium text-slate-900">
								{documentInfo.validUntil}
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
