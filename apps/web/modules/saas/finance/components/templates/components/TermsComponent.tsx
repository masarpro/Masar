"use client";

import { useTranslations } from "next-intl";

interface TermsComponentProps {
	settings: {
		showPaymentTerms?: boolean;
		showDeliveryTerms?: boolean;
		showWarrantyTerms?: boolean;
	};
	terms?: {
		paymentTerms?: string;
		deliveryTerms?: string;
		warrantyTerms?: string;
	};
	primaryColor?: string;
}

export function TermsComponent({
	settings,
	terms,
	primaryColor = "#3b82f6",
}: TermsComponentProps) {
	const t = useTranslations();
	const {
		showPaymentTerms = true,
		showDeliveryTerms = true,
		showWarrantyTerms = true,
	} = settings;

	const defaultTerms = {
		paymentTerms: t("finance.templates.preview.defaultPaymentTerms"),
		deliveryTerms: t("finance.templates.preview.defaultDeliveryTerms"),
		warrantyTerms: t("finance.templates.preview.defaultWarrantyTerms"),
	};

	const displayTerms = terms || defaultTerms;

	const hasContent =
		(showPaymentTerms && displayTerms.paymentTerms) ||
		(showDeliveryTerms && displayTerms.deliveryTerms) ||
		(showWarrantyTerms && displayTerms.warrantyTerms);

	if (!hasContent) return null;

	return (
		<div className="py-6 border-t border-slate-200">
			<h3
				className="text-sm font-semibold uppercase tracking-wide mb-4"
				style={{ color: primaryColor }}
			>
				{t("finance.templates.preview.termsAndConditions")}
			</h3>
			<div className="space-y-4 text-sm text-slate-600">
				{showPaymentTerms && displayTerms.paymentTerms && (
					<div>
						<span className="font-medium text-slate-700">
							{t("finance.templates.preview.paymentTermsLabel")}:
						</span>{" "}
						{displayTerms.paymentTerms}
					</div>
				)}
				{showDeliveryTerms && displayTerms.deliveryTerms && (
					<div>
						<span className="font-medium text-slate-700">
							{t("finance.templates.preview.deliveryTermsLabel")}:
						</span>{" "}
						{displayTerms.deliveryTerms}
					</div>
				)}
				{showWarrantyTerms && displayTerms.warrantyTerms && (
					<div>
						<span className="font-medium text-slate-700">
							{t("finance.templates.preview.warrantyTermsLabel")}:
						</span>{" "}
						{displayTerms.warrantyTerms}
					</div>
				)}
			</div>
		</div>
	);
}
