"use client";

import { useTranslations } from "next-intl";
import type { QuotationData, InvoiceData, OrganizationData } from "../TemplateRenderer";

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

	// In a real implementation, this would generate a proper QR code
	// For ZATCA compliance, the QR code would contain TLV-encoded data
	// For now, we show a placeholder

	return (
		<div className="py-4">
			<div className="flex flex-col items-center gap-2">
				{/* QR Code placeholder */}
				<div
					className={`${sizeMap[qrSize]} border-2 rounded-lg flex items-center justify-center bg-white`}
					style={{ borderColor: primaryColor }}
				>
					{/* Simulated QR pattern */}
					<svg
						viewBox="0 0 100 100"
						className="w-full h-full p-2"
						fill={primaryColor}
					>
						{/* Top-left position marker */}
						<rect x="0" y="0" width="28" height="28" />
						<rect x="4" y="4" width="20" height="20" fill="white" />
						<rect x="8" y="8" width="12" height="12" />

						{/* Top-right position marker */}
						<rect x="72" y="0" width="28" height="28" />
						<rect x="76" y="4" width="20" height="20" fill="white" />
						<rect x="80" y="8" width="12" height="12" />

						{/* Bottom-left position marker */}
						<rect x="0" y="72" width="28" height="28" />
						<rect x="4" y="76" width="20" height="20" fill="white" />
						<rect x="8" y="80" width="12" height="12" />

						{/* Random data pattern (simplified) */}
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

				{/* ZATCA compliance badge */}
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
