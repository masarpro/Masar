"use client";

import { useTranslations } from "next-intl";
import { formatDateArabic } from "../../../lib/utils";

interface ClientInfoComponentProps {
	settings: {
		showTaxNumber?: boolean;
		showEmail?: boolean;
		showPhone?: boolean;
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
	};
	primaryColor?: string;
}

export function ClientInfoComponent({
	settings,
	clientInfo,
	documentInfo,
	primaryColor = "#3b82f6",
}: ClientInfoComponentProps) {
	const t = useTranslations();
	const { showTaxNumber = true, showEmail = true, showPhone = true } = settings;

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
						{clientInfo?.name || t("finance.templates.preview.clientName")}
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
							{t("finance.templates.preview.taxNumber")}: {clientInfo.taxNumber}
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
						<span className="text-slate-500">{t("finance.templates.preview.documentNumber")}:</span>
						<span className="font-medium text-slate-900">
							{documentInfo?.number || "QT-2024-001"}
						</span>
					</div>
					<div className="flex justify-between text-sm">
						<span className="text-slate-500">{t("finance.templates.preview.date")}:</span>
						<span className="font-medium text-slate-900">
							{documentInfo?.date || formatDateArabic(new Date())}
						</span>
					</div>
					{documentInfo?.validUntil && (
						<div className="flex justify-between text-sm">
							<span className="text-slate-500">{t("finance.templates.preview.validUntil")}:</span>
							<span className="font-medium text-slate-900">{documentInfo.validUntil}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
