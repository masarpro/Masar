"use client";

import { useTranslations } from "next-intl";
import { Stamp } from "lucide-react";

interface SignatureComponentProps {
	settings: {
		showDate?: boolean;
		showStampArea?: boolean;
		twoColumns?: boolean;
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
		showDate = true,
		showStampArea = false,
		twoColumns = true,
	} = settings;

	// Two-column layout (default)
	if (twoColumns) {
		return (
			<div className="py-8 border-t border-slate-200">
				<div className="grid grid-cols-2 gap-12">
					{/* Authorized Signature */}
					<div className="space-y-4">
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
						{showDate && (
							<p className="text-xs text-slate-400">
								{t("finance.templates.preview.date")}: _______________
							</p>
						)}

						{/* Stamp Area */}
						{showStampArea && (
							<div className="mt-4">
								<div
									className="w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center"
									style={{ borderColor: `${primaryColor}50` }}
								>
									<Stamp className="h-6 w-6 mb-1" style={{ color: `${primaryColor}60` }} />
									<span className="text-xs" style={{ color: `${primaryColor}60` }}>
										{t("finance.templates.preview.stampArea")}
									</span>
								</div>
							</div>
						)}
					</div>

					{/* Client Signature */}
					<div className="space-y-4">
						<h4
							className="text-sm font-semibold"
							style={{ color: primaryColor }}
						>
							{t("finance.templates.preview.clientSignature")}
						</h4>
						<div className="h-16 border-b-2 border-slate-300" />
						<p className="text-sm text-slate-600">
							{signatures?.client || t("finance.templates.preview.clientName")}
						</p>
						{signatures?.clientTitle && (
							<p className="text-xs text-slate-400">{signatures.clientTitle}</p>
						)}
						{showDate && (
							<p className="text-xs text-slate-400">
								{t("finance.templates.preview.date")}: _______________
							</p>
						)}
					</div>
				</div>
			</div>
		);
	}

	// Single column layout
	return (
		<div className="py-8 border-t border-slate-200">
			<div className="flex items-start justify-between">
				{/* Signature Section */}
				<div className="space-y-4 flex-1 max-w-sm">
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
					{showDate && (
						<p className="text-xs text-slate-400">
							{t("finance.templates.preview.date")}: _______________
						</p>
					)}
				</div>

				{/* Stamp Area */}
				{showStampArea && (
					<div className="ms-8">
						<div
							className="w-28 h-28 rounded-full border-2 border-dashed flex flex-col items-center justify-center"
							style={{ borderColor: `${primaryColor}50` }}
						>
							<Stamp className="h-8 w-8 mb-1" style={{ color: `${primaryColor}60` }} />
							<span className="text-xs" style={{ color: `${primaryColor}60` }}>
								{t("finance.templates.preview.stampArea")}
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
