"use client";

import { useTranslations } from "next-intl";
import { Building2, CreditCard, User, Hash } from "lucide-react";

interface BankDetailsComponentProps {
	settings: {
		showBankName?: boolean;
		showIban?: boolean;
		showAccountName?: boolean;
		showSwiftCode?: boolean;
	};
	bankDetails?: {
		bankName?: string;
		bankNameEn?: string;
		iban?: string;
		accountName?: string;
		accountNameEn?: string;
		swiftCode?: string;
	};
	primaryColor?: string;
}

export function BankDetailsComponent({
	settings,
	bankDetails,
	primaryColor = "#3b82f6",
}: BankDetailsComponentProps) {
	const t = useTranslations();
	const {
		showBankName = true,
		showIban = true,
		showAccountName = true,
		showSwiftCode = false,
	} = settings;

	const defaultBankDetails = {
		bankName: t("finance.templates.preview.sampleBankName"),
		bankNameEn: "Al Rajhi Bank",
		iban: "SA00 0000 0000 0000 0000 0000",
		accountName: t("finance.templates.preview.sampleAccountName"),
		accountNameEn: "Company Name",
		swiftCode: "RJHISARI",
	};

	const details = bankDetails || defaultBankDetails;

	// Check if any bank details are to be shown
	const hasContent = showBankName || showIban || showAccountName || showSwiftCode;
	if (!hasContent) return null;

	return (
		<div className="py-4">
			<div
				className="rounded-xl border-2 p-4"
				style={{ borderColor: `${primaryColor}30` }}
			>
				{/* Header */}
				<div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: `${primaryColor}20` }}>
					<div
						className="p-2 rounded-lg"
						style={{ backgroundColor: `${primaryColor}15` }}
					>
						<Building2 className="h-5 w-5" style={{ color: primaryColor }} />
					</div>
					<h4
						className="text-sm font-semibold"
						style={{ color: primaryColor }}
					>
						{t("finance.templates.preview.bankDetails")}
					</h4>
				</div>

				{/* Bank Details Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Bank Name */}
					{showBankName && details.bankName && (
						<div className="flex items-start gap-3">
							<div
								className="p-1.5 rounded-md mt-0.5"
								style={{ backgroundColor: `${primaryColor}10` }}
							>
								<Building2 className="h-4 w-4" style={{ color: primaryColor }} />
							</div>
							<div>
								<p className="text-xs text-slate-500 mb-0.5">
									{t("finance.templates.preview.bankName")}
								</p>
								<p className="text-sm font-medium text-slate-900">
									{details.bankName}
								</p>
								{details.bankNameEn && details.bankNameEn !== details.bankName && (
									<p className="text-xs text-slate-500" dir="ltr">
										{details.bankNameEn}
									</p>
								)}
							</div>
						</div>
					)}

					{/* Account Name */}
					{showAccountName && details.accountName && (
						<div className="flex items-start gap-3">
							<div
								className="p-1.5 rounded-md mt-0.5"
								style={{ backgroundColor: `${primaryColor}10` }}
							>
								<User className="h-4 w-4" style={{ color: primaryColor }} />
							</div>
							<div>
								<p className="text-xs text-slate-500 mb-0.5">
									{t("finance.templates.preview.accountName")}
								</p>
								<p className="text-sm font-medium text-slate-900">
									{details.accountName}
								</p>
								{details.accountNameEn && details.accountNameEn !== details.accountName && (
									<p className="text-xs text-slate-500" dir="ltr">
										{details.accountNameEn}
									</p>
								)}
							</div>
						</div>
					)}

					{/* IBAN */}
					{showIban && details.iban && (
						<div className="flex items-start gap-3 md:col-span-2">
							<div
								className="p-1.5 rounded-md mt-0.5"
								style={{ backgroundColor: `${primaryColor}10` }}
							>
								<CreditCard className="h-4 w-4" style={{ color: primaryColor }} />
							</div>
							<div className="flex-1">
								<p className="text-xs text-slate-500 mb-0.5">
									{t("finance.templates.preview.ibanNumber")}
								</p>
								<p
									className="text-sm font-mono font-medium text-slate-900 tracking-wider"
									dir="ltr"
								>
									{details.iban}
								</p>
							</div>
						</div>
					)}

					{/* SWIFT Code */}
					{showSwiftCode && details.swiftCode && (
						<div className="flex items-start gap-3">
							<div
								className="p-1.5 rounded-md mt-0.5"
								style={{ backgroundColor: `${primaryColor}10` }}
							>
								<Hash className="h-4 w-4" style={{ color: primaryColor }} />
							</div>
							<div>
								<p className="text-xs text-slate-500 mb-0.5">
									{t("finance.templates.preview.swiftCode")}
								</p>
								<p
									className="text-sm font-mono font-medium text-slate-900"
									dir="ltr"
								>
									{details.swiftCode}
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
