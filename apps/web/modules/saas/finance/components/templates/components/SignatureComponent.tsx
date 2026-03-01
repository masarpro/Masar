"use client";

import { useTranslations } from "next-intl";

interface SignatureComponentProps {
	settings: {
		signatureImage?: string;
		signaturePosition?: "bottom-right" | "bottom-left";
	};
	signatures?: {
		authorized?: string;
		authorizedTitle?: string;
		client?: string;
		clientTitle?: string;
	};
	primaryColor?: string;
}

export function SignatureComponent({
	settings,
	signatures,
	primaryColor = "#3b82f6",
}: SignatureComponentProps) {
	const t = useTranslations();
	const {
		signatureImage,
		signaturePosition = "bottom-right",
	} = settings;

	// If signature image is set, show image at specified position
	if (signatureImage) {
		return (
			<div className="py-8 border-t border-slate-200 signature-section">
				<div
					className={`flex ${
						signaturePosition === "bottom-left" ? "justify-start" : "justify-end"
					}`}
				>
					<div className="space-y-2 text-center">
						<img
							src={signatureImage}
							alt={t("finance.templates.preview.authorizedSignature")}
							className="h-20 object-contain"
						/>
						<div className="h-px bg-slate-300 w-48" />
						<p className="text-sm text-slate-600">
							{signatures?.authorized || t("finance.templates.preview.authorizedName")}
						</p>
						{signatures?.authorizedTitle && (
							<p className="text-xs text-slate-400">{signatures.authorizedTitle}</p>
						)}
					</div>
				</div>
			</div>
		);
	}

	// Default: signature line
	return (
		<div className="py-8 border-t border-slate-200 signature-section">
			<div
				className={`flex ${
					signaturePosition === "bottom-left" ? "justify-start" : "justify-end"
				}`}
			>
				<div className="space-y-4 w-64">
					<h4
						className="text-sm font-semibold"
						style={{ color: primaryColor }}
					>
						{t("finance.templates.preview.authorizedSignature")}
					</h4>
					<div className="h-16 border-b-2 border-slate-300" />
					<p className="text-sm text-slate-600">
						{signatures?.authorized || t("finance.templates.preview.authorizedName")}
					</p>
					{signatures?.authorizedTitle && (
						<p className="text-xs text-slate-400">{signatures.authorizedTitle}</p>
					)}
				</div>
			</div>
		</div>
	);
}
