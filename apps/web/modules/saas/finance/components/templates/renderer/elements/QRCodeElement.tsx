"use client";

import { useTranslations } from "next-intl";
import type { QuotationData, InvoiceData, OrganizationData } from "../TemplateRenderer";

function isInvoiceData(data?: QuotationData | InvoiceData): data is InvoiceData {
	return !!data && "invoiceNo" in data;
}

interface QRCodeElementProps {
	settings: {
		qrSize?: "small" | "medium" | "large";
		showZatcaCompliance?: boolean;
	};
	data?: QuotationData | InvoiceData;
	organization?: OrganizationData;
	primaryColor?: string;
}

export function QRCodeElement({
	settings,
	data,
	organization,
	primaryColor = "#3b82f6",
}: QRCodeElementProps) {
	const t = useTranslations();
	const { qrSize = "medium", showZatcaCompliance = false } = settings;

	// QR size mapping
	const sizeMap = {
		small: "w-20 h-20",
		medium: "w-32 h-32",
		large: "w-40 h-40",
	};

	// Check if we have a real QR code image from an issued invoice
	const realQrCode = isInvoiceData(data) ? data.qrCode : null;
	const zatcaUuid = isInvoiceData(data) ? data.zatcaUuid : null;

	// If we have a real QR code, render the actual image
	if (realQrCode) {
		return (
			<div className="py-4">
				<div className="flex items-center gap-4">
					<div className="bg-white p-3 rounded-lg border border-slate-200 shrink-0 print:border-gray-400">
						<img
							src={realQrCode}
							alt="ZATCA QR Code"
							className={`${sizeMap[qrSize]} print:w-24 print:h-24`}
							style={{ minWidth: "5rem", minHeight: "5rem" }}
						/>
					</div>
					{showZatcaCompliance && (
						<div>
							<p className="text-xs text-slate-500">
								{t("finance.templates.editor.settings.showZatcaCompliance")}
							</p>
							{zatcaUuid && (
								<p className="text-xs font-mono text-slate-400 mt-1 break-all">
									UUID: {zatcaUuid}
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		);
	}

	// Placeholder QR for template preview / drafts
	return (
		<div className="py-4">
			<div className="flex flex-col items-center gap-2">
				<div
					className={`${sizeMap[qrSize]} border-2 rounded-lg flex items-center justify-center bg-white`}
					style={{ borderColor: primaryColor }}
				>
					<svg
						viewBox="0 0 100 100"
						className="w-full h-full p-2"
						fill={primaryColor}
					>
						<rect x="0" y="0" width="28" height="28" />
						<rect x="4" y="4" width="20" height="20" fill="white" />
						<rect x="8" y="8" width="12" height="12" />
						<rect x="72" y="0" width="28" height="28" />
						<rect x="76" y="4" width="20" height="20" fill="white" />
						<rect x="80" y="8" width="12" height="12" />
						<rect x="0" y="72" width="28" height="28" />
						<rect x="4" y="76" width="20" height="20" fill="white" />
						<rect x="8" y="80" width="12" height="12" />
						<rect x="36" y="8" width="4" height="4" />
						<rect x="44" y="8" width="4" height="4" />
						<rect x="52" y="8" width="4" height="4" />
						<rect x="36" y="16" width="4" height="4" />
						<rect x="48" y="16" width="4" height="4" />
						<rect x="36" y="24" width="4" height="4" />
						<rect x="44" y="24" width="4" height="4" />
						<rect x="52" y="24" width="4" height="4" />
						<rect x="8" y="36" width="4" height="4" />
						<rect x="16" y="36" width="4" height="4" />
						<rect x="8" y="44" width="4" height="4" />
						<rect x="16" y="52" width="4" height="4" />
						<rect x="36" y="36" width="8" height="8" />
						<rect x="48" y="36" width="4" height="4" />
						<rect x="56" y="36" width="4" height="4" />
						<rect x="64" y="36" width="4" height="4" />
						<rect x="36" y="48" width="4" height="4" />
						<rect x="48" y="48" width="4" height="4" />
						<rect x="60" y="48" width="4" height="4" />
						<rect x="36" y="56" width="4" height="4" />
						<rect x="52" y="56" width="4" height="4" />
						<rect x="64" y="56" width="4" height="4" />
						<rect x="80" y="36" width="4" height="4" />
						<rect x="88" y="36" width="4" height="4" />
						<rect x="84" y="44" width="4" height="4" />
						<rect x="92" y="44" width="4" height="4" />
						<rect x="80" y="52" width="4" height="4" />
						<rect x="88" y="56" width="4" height="4" />
						<rect x="36" y="80" width="4" height="4" />
						<rect x="44" y="76" width="4" height="4" />
						<rect x="52" y="80" width="4" height="4" />
						<rect x="60" y="84" width="4" height="4" />
						<rect x="44" y="88" width="4" height="4" />
						<rect x="56" y="92" width="4" height="4" />
						<rect x="76" y="76" width="4" height="4" />
						<rect x="84" y="80" width="4" height="4" />
						<rect x="92" y="76" width="4" height="4" />
						<rect x="80" y="88" width="4" height="4" />
						<rect x="88" y="92" width="4" height="4" />
					</svg>
				</div>
				{showZatcaCompliance && (
					<div className="text-center">
						<p className="text-xs text-slate-500">
							{t("finance.templates.editor.settings.showZatcaCompliance")}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
