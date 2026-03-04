"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { FinanceLogoUpload } from "@saas/finance/components/settings/FinanceLogoUpload";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import {
	Save,
	Loader2,
	ImageIcon,
	Building2,
	MapPin,
	Phone,
	Receipt,
} from "lucide-react";

const CURRENCIES = [
	{ value: "SAR", label: "SAR", labelAr: "ريال سعودي" },
	{ value: "USD", label: "USD", labelAr: "دولار أمريكي" },
	{ value: "EUR", label: "EUR", labelAr: "يورو" },
	{ value: "AED", label: "AED", labelAr: "درهم إماراتي" },
	{ value: "KWD", label: "KWD", labelAr: "دينار كويتي" },
	{ value: "QAR", label: "QAR", labelAr: "ريال قطري" },
	{ value: "BHD", label: "BHD", labelAr: "دينار بحريني" },
	{ value: "OMR", label: "OMR", labelAr: "ريال عماني" },
	{ value: "EGP", label: "EGP", labelAr: "جنيه مصري" },
	{ value: "GBP", label: "GBP", labelAr: "جنيه إسترليني" },
];

function SectionTitle({
	icon: Icon,
	children,
}: {
	icon: React.ComponentType<{ className?: string }>;
	children: React.ReactNode;
}) {
	return (
		<span className="flex items-center gap-2">
			<Icon className="h-4 w-4 text-primary" />
			{children}
		</span>
	);
}

export function CompanyInfoSettings() {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";

	const { data: settings, isLoading } = useQuery(
		orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
	);

	const [formData, setFormData] = useState<Record<string, any>>({});
	const [hasChanges, setHasChanges] = useState(false);

	const currentSettings = settings || {};
	const getFieldValue = (field: string) => {
		return formData[field] ?? (currentSettings as any)[field] ?? "";
	};

	useEffect(() => {
		setHasChanges(Object.keys(formData).length > 0);
	}, [formData]);

	// Compose address preview from structured fields
	const composedAddress = useMemo(() => {
		const parts = [
			getFieldValue("buildingNumber"),
			getFieldValue("street"),
			getFieldValue("secondaryNumber"),
			getFieldValue("postalCode"),
			getFieldValue("city"),
		].filter(Boolean);
		return parts.join("، ");
	}, [
		getFieldValue("buildingNumber"),
		getFieldValue("street"),
		getFieldValue("secondaryNumber"),
		getFieldValue("postalCode"),
		getFieldValue("city"),
	]);

	const updateMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.settings.update({
				organizationId,
				...formData,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.settings.updateSuccess"));
			setFormData({});
			setHasChanges(false);
			queryClient.invalidateQueries({
				predicate: (query) => {
					const key = query.queryKey as string[];
					return key.some(
						(k) => typeof k === "string" && k.includes("settings"),
					);
				},
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.settings.updateError"));
		},
	});

	const handleFieldChange = (field: string, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSave = () => {
		updateMutation.mutate();
	};

	if (!organizationId || isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<>
			{/* 1. Logo Section */}
			<SettingsItem
				title={
					<SectionTitle icon={ImageIcon}>
						{t("finance.settings.logoSection")}
					</SectionTitle>
				}
				description={t("finance.settings.logoSectionDescription")}
			>
				<FinanceLogoUpload
					organizationId={organizationId}
					currentLogoUrl={getFieldValue("logo")}
					onLogoChange={(url) => handleFieldChange("logo", url)}
					onLogoRemove={() => handleFieldChange("logo", "")}
				/>
			</SettingsItem>

			{/* 2. Organization Identity */}
			<SettingsItem
				title={
					<SectionTitle icon={Building2}>
						{t("finance.settings.companyInfo")}
					</SectionTitle>
				}
				description={t("finance.settings.companyInfoDescription")}
			>
				<div className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>{t("finance.settings.companyNameAr")}</Label>
							<Input
								value={getFieldValue("companyNameAr")}
								onChange={(e) =>
									handleFieldChange("companyNameAr", e.target.value)
								}
								placeholder={t("finance.settings.companyNameArPlaceholder")}
								dir="rtl"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>{t("finance.settings.companyNameEn")}</Label>
							<Input
								value={getFieldValue("companyNameEn")}
								onChange={(e) =>
									handleFieldChange("companyNameEn", e.target.value)
								}
								placeholder={t("finance.settings.companyNameEnPlaceholder")}
								dir="ltr"
								className="text-left"
							/>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>{t("finance.settings.taxNumber")}</Label>
							<Input
								value={getFieldValue("taxNumber")}
								onChange={(e) =>
									handleFieldChange("taxNumber", e.target.value)
								}
								placeholder={t("finance.settings.taxNumberPlaceholder")}
								dir="ltr"
								className="font-mono text-left"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>{t("finance.settings.commercialReg")}</Label>
							<Input
								value={getFieldValue("commercialReg")}
								onChange={(e) =>
									handleFieldChange("commercialReg", e.target.value)
								}
								placeholder={t("finance.settings.commercialRegPlaceholder")}
								dir="ltr"
								className="font-mono text-left"
							/>
						</div>
					</div>
				</div>
			</SettingsItem>

			{/* 3. National Address */}
			<SettingsItem
				title={
					<SectionTitle icon={MapPin}>
						{t("finance.settings.nationalAddress")}
					</SectionTitle>
				}
				description={t("finance.settings.nationalAddressDescription")}
			>
				<div className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>{t("finance.settings.buildingNumber")}</Label>
							<Input
								value={getFieldValue("buildingNumber")}
								onChange={(e) =>
									handleFieldChange("buildingNumber", e.target.value)
								}
								placeholder={t("finance.settings.buildingNumberPlaceholder")}
								dir="ltr"
								className="text-left"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>{t("finance.settings.street")}</Label>
							<Input
								value={getFieldValue("street")}
								onChange={(e) =>
									handleFieldChange("street", e.target.value)
								}
								placeholder={t("finance.settings.streetPlaceholder")}
								dir="rtl"
							/>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>{t("finance.settings.secondaryNumber")}</Label>
							<Input
								value={getFieldValue("secondaryNumber")}
								onChange={(e) =>
									handleFieldChange("secondaryNumber", e.target.value)
								}
								placeholder={t("finance.settings.secondaryNumberPlaceholder")}
								dir="ltr"
								className="text-left"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>{t("finance.settings.postalCode")}</Label>
							<Input
								value={getFieldValue("postalCode")}
								onChange={(e) =>
									handleFieldChange("postalCode", e.target.value)
								}
								placeholder={t("finance.settings.postalCodePlaceholder")}
								dir="ltr"
								className="text-left"
							/>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>{t("finance.settings.city")}</Label>
							<Input
								value={getFieldValue("city")}
								onChange={(e) =>
									handleFieldChange("city", e.target.value)
								}
								placeholder={t("finance.settings.cityPlaceholder")}
								dir="rtl"
							/>
						</div>
					</div>
					{composedAddress && (
						<div className="rounded-lg border border-border bg-muted/50 p-3">
							<p className="text-xs text-muted-foreground mb-1">
								{t("finance.settings.addressPreview")}
							</p>
							<p className="text-sm" dir="rtl">
								{composedAddress}
							</p>
						</div>
					)}
				</div>
			</SettingsItem>

			{/* 4. Contact Info */}
			<SettingsItem
				title={
					<SectionTitle icon={Phone}>
						{t("finance.settings.contactInfo")}
					</SectionTitle>
				}
				description={t("finance.settings.contactInfoDescription")}
			>
				<div className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>{t("finance.settings.phone")}</Label>
							<Input
								value={getFieldValue("phone")}
								onChange={(e) =>
									handleFieldChange("phone", e.target.value)
								}
								placeholder={t("finance.settings.phonePlaceholder")}
								dir="ltr"
								className="text-left"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>{t("finance.settings.email")}</Label>
							<Input
								type="email"
								value={getFieldValue("email")}
								onChange={(e) =>
									handleFieldChange("email", e.target.value)
								}
								placeholder={t("finance.settings.emailPlaceholder")}
								dir="ltr"
								className="text-left"
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label>{t("finance.settings.website")}</Label>
						<Input
							value={getFieldValue("website")}
							onChange={(e) =>
								handleFieldChange("website", e.target.value)
							}
							placeholder={t("finance.settings.websitePlaceholder")}
							dir="ltr"
							className="text-left"
						/>
					</div>
				</div>
			</SettingsItem>

			{/* 5. Tax & Currency */}
			<SettingsItem
				title={
					<SectionTitle icon={Receipt}>
						{t("finance.settings.taxAndCurrency")}
					</SectionTitle>
				}
				description={t("finance.settings.taxAndCurrencyDescription")}
			>
				<div className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>{t("finance.settings.defaultVatPercent")}</Label>
							<div className="relative max-w-xs">
								<Input
									type="number"
									min="0"
									max="100"
									step="0.5"
									value={getFieldValue("defaultVatPercent") || 15}
									onChange={(e) =>
										handleFieldChange(
											"defaultVatPercent",
											parseFloat(e.target.value),
										)
									}
									className="ps-10"
									dir="ltr"
								/>
								<span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
									%
								</span>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label>{t("finance.settings.defaultCurrency")}</Label>
							<Select
								value={getFieldValue("defaultCurrency") || "SAR"}
								onValueChange={(value) =>
									handleFieldChange("defaultCurrency", value)
								}
							>
								<SelectTrigger className="max-w-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{CURRENCIES.map((currency) => (
										<SelectItem
											key={currency.value}
											value={currency.value}
										>
											{currency.label} - {currency.labelAr}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label>{t("finance.settings.quotationValidityDays")}</Label>
						<div className="flex items-center gap-2 max-w-xs">
							<Input
								type="number"
								min="1"
								max="365"
								value={getFieldValue("quotationValidityDays") || 30}
								onChange={(e) =>
									handleFieldChange(
										"quotationValidityDays",
										parseInt(e.target.value),
									)
								}
								dir="ltr"
							/>
							<span className="text-sm text-muted-foreground">
								{t("common.days")}
							</span>
						</div>
					</div>
				</div>
			</SettingsItem>

			{/* Save Button */}
			{hasChanges && (
				<div className="flex justify-end">
					<Button
						onClick={handleSave}
						disabled={updateMutation.isPending}
					>
						{updateMutation.isPending ? (
							<>
								<Loader2 className="h-4 w-4 ms-2 animate-spin" />
								{t("common.saving")}
							</>
						) : (
							<>
								<Save className="h-4 w-4 ms-2" />
								{t("common.saveChanges")}
							</>
						)}
					</Button>
				</div>
			)}
		</>
	);
}
