"use client";

import { useTranslations } from "next-intl";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import { MapPin, Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import type { ClientFormData, SecondaryAddress } from "../ClientForm";

interface AddressSectionProps {
	formData: ClientFormData;
	setFormData: React.Dispatch<React.SetStateAction<ClientFormData>>;
}

// قائمة الدول
const countries = [
	{ code: "SA", name: "السعودية" },
	{ code: "AE", name: "الإمارات" },
	{ code: "KW", name: "الكويت" },
	{ code: "QA", name: "قطر" },
	{ code: "BH", name: "البحرين" },
	{ code: "OM", name: "عمان" },
	{ code: "EG", name: "مصر" },
	{ code: "JO", name: "الأردن" },
];

// قائمة المناطق السعودية
const saudiRegions = [
	"الرياض",
	"مكة المكرمة",
	"المدينة المنورة",
	"القصيم",
	"الشرقية",
	"عسير",
	"تبوك",
	"حائل",
	"الحدود الشمالية",
	"جازان",
	"نجران",
	"الباحة",
	"الجوف",
];

export function AddressSection({
	formData,
	setFormData,
}: AddressSectionProps) {
	const t = useTranslations();

	const handleToggleSecondaryAddress = () => {
		if (formData.showSecondaryAddress) {
			// إخفاء وإزالة العنوان الثانوي
			setFormData((prev) => ({
				...prev,
				showSecondaryAddress: false,
				secondaryAddress: null,
			}));
		} else {
			// إظهار وتهيئة العنوان الثانوي
			setFormData((prev) => ({
				...prev,
				showSecondaryAddress: true,
				secondaryAddress: {
					streetAddress1: "",
					streetAddress2: "",
					city: "",
					region: "",
					postalCode: "",
					country: "SA",
				},
			}));
		}
	};

	const updateSecondaryAddress = (
		field: keyof SecondaryAddress,
		value: string,
	) => {
		setFormData((prev) => ({
			...prev,
			secondaryAddress: {
				...(prev.secondaryAddress || {}),
				[field]: value,
			},
		}));
	};

	return (
		<Card className="rounded-2xl">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2 text-lg">
					<MapPin className="h-5 w-5 text-primary" />
					{t("finance.clients.sections.address")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* العنوان الرئيسي */}
				<div className="space-y-4">
					<div>
						<Label>{t("finance.clients.streetAddress1")}</Label>
						<Input
							value={formData.streetAddress1}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									streetAddress1: e.target.value,
								}))
							}
							placeholder={t("finance.clients.streetAddress1Placeholder")}
							className="rounded-xl mt-1"
						/>
					</div>

					<div>
						<Label>{t("finance.clients.streetAddress2")}</Label>
						<Input
							value={formData.streetAddress2}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									streetAddress2: e.target.value,
								}))
							}
							placeholder={t("finance.clients.streetAddress2Placeholder")}
							className="rounded-xl mt-1"
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<Label>{t("finance.clients.city")}</Label>
							<Input
								value={formData.city}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										city: e.target.value,
									}))
								}
								placeholder={t("finance.clients.cityPlaceholder")}
								className="rounded-xl mt-1"
							/>
						</div>
						<div>
							<Label>{t("finance.clients.region")}</Label>
							<Select
								value={formData.region}
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, region: value }))
								}
							>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue
										placeholder={t("finance.clients.regionPlaceholder")}
									/>
								</SelectTrigger>
								<SelectContent>
									{saudiRegions.map((region) => (
										<SelectItem key={region} value={region}>
											{region}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<Label>{t("finance.clients.postalCode")}</Label>
							<Input
								value={formData.postalCode}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										postalCode: e.target.value,
									}))
								}
								placeholder="12345"
								className="rounded-xl mt-1"
								dir="ltr"
							/>
						</div>
						<div>
							<Label>{t("finance.clients.country")}</Label>
							<Select
								value={formData.country}
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, country: value }))
								}
							>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{countries.map((country) => (
										<SelectItem key={country.code} value={country.code}>
											{country.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* العنوان الثانوي */}
				<Collapsible
					open={formData.showSecondaryAddress}
					onOpenChange={handleToggleSecondaryAddress}
				>
					<CollapsibleTrigger asChild>
						<Button
							type="button"
							variant="outline"
							className="w-full justify-between rounded-xl"
						>
							<span className="flex items-center gap-2">
								{formData.showSecondaryAddress ? (
									<X className="h-4 w-4" />
								) : (
									<Plus className="h-4 w-4" />
								)}
								{formData.showSecondaryAddress
									? t("finance.clients.removeSecondaryAddress")
									: t("finance.clients.addSecondaryAddress")}
							</span>
							{formData.showSecondaryAddress ? (
								<ChevronUp className="h-4 w-4" />
							) : (
								<ChevronDown className="h-4 w-4" />
							)}
						</Button>
					</CollapsibleTrigger>

					<CollapsibleContent className="mt-4 space-y-4 border-t pt-4">
						<h4 className="font-medium text-slate-700 dark:text-slate-300">
							{t("finance.clients.secondaryAddress")}
						</h4>

						<div>
							<Label>{t("finance.clients.streetAddress1")}</Label>
							<Input
								value={formData.secondaryAddress?.streetAddress1 || ""}
								onChange={(e) =>
									updateSecondaryAddress("streetAddress1", e.target.value)
								}
								placeholder={t("finance.clients.streetAddress1Placeholder")}
								className="rounded-xl mt-1"
							/>
						</div>

						<div>
							<Label>{t("finance.clients.streetAddress2")}</Label>
							<Input
								value={formData.secondaryAddress?.streetAddress2 || ""}
								onChange={(e) =>
									updateSecondaryAddress("streetAddress2", e.target.value)
								}
								placeholder={t("finance.clients.streetAddress2Placeholder")}
								className="rounded-xl mt-1"
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<Label>{t("finance.clients.city")}</Label>
								<Input
									value={formData.secondaryAddress?.city || ""}
									onChange={(e) =>
										updateSecondaryAddress("city", e.target.value)
									}
									placeholder={t("finance.clients.cityPlaceholder")}
									className="rounded-xl mt-1"
								/>
							</div>
							<div>
								<Label>{t("finance.clients.region")}</Label>
								<Select
									value={formData.secondaryAddress?.region || ""}
									onValueChange={(value) =>
										updateSecondaryAddress("region", value)
									}
								>
									<SelectTrigger className="rounded-xl mt-1">
										<SelectValue
											placeholder={t("finance.clients.regionPlaceholder")}
										/>
									</SelectTrigger>
									<SelectContent>
										{saudiRegions.map((region) => (
											<SelectItem key={region} value={region}>
												{region}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<Label>{t("finance.clients.postalCode")}</Label>
								<Input
									value={formData.secondaryAddress?.postalCode || ""}
									onChange={(e) =>
										updateSecondaryAddress("postalCode", e.target.value)
									}
									placeholder="12345"
									className="rounded-xl mt-1"
									dir="ltr"
								/>
							</div>
							<div>
								<Label>{t("finance.clients.country")}</Label>
								<Select
									value={formData.secondaryAddress?.country || "SA"}
									onValueChange={(value) =>
										updateSecondaryAddress("country", value)
									}
								>
									<SelectTrigger className="rounded-xl mt-1">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{countries.map((country) => (
											<SelectItem key={country.code} value={country.code}>
												{country.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</CollapsibleContent>
				</Collapsible>
			</CardContent>
		</Card>
	);
}
