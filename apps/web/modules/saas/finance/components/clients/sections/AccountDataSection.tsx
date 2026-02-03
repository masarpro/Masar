"use client";

import { useTranslations } from "next-intl";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { CreditCard, X } from "lucide-react";
import type { ClientFormData } from "../ClientForm";

interface AccountDataSectionProps {
	formData: ClientFormData;
	setFormData: React.Dispatch<React.SetStateAction<ClientFormData>>;
}

// قائمة العملات
const currencies = [
	{ code: "SAR", name: "ريال سعودي" },
	{ code: "USD", name: "دولار أمريكي" },
	{ code: "EUR", name: "يورو" },
	{ code: "AED", name: "درهم إماراتي" },
	{ code: "KWD", name: "دينار كويتي" },
];

// قائمة التصنيفات
const classificationOptions = [
	{ value: "VIP", label: "VIP" },
	{ value: "regular", label: "عادي" },
	{ value: "company", label: "شركة" },
	{ value: "government", label: "جهة حكومية" },
	{ value: "contractor", label: "مقاول" },
];

export function AccountDataSection({
	formData,
	setFormData,
}: AccountDataSectionProps) {
	const t = useTranslations();

	const addClassification = (value: string) => {
		if (!formData.classification.includes(value)) {
			setFormData((prev) => ({
				...prev,
				classification: [...prev.classification, value],
			}));
		}
	};

	const removeClassification = (value: string) => {
		setFormData((prev) => ({
			...prev,
			classification: prev.classification.filter((c) => c !== value),
		}));
	};

	return (
		<Card className="rounded-2xl">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2 text-lg">
					<CreditCard className="h-5 w-5 text-primary" />
					{t("finance.clients.sections.accountData")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid gap-4 sm:grid-cols-2">
					{/* رقم الكود */}
					<div>
						<Label>{t("finance.clients.code")}</Label>
						<Input
							value={formData.code}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									code: e.target.value,
								}))
							}
							placeholder={t("finance.clients.codePlaceholder")}
							className="rounded-xl mt-1"
							dir="ltr"
						/>
						<p className="text-xs text-slate-500 mt-1">
							{t("finance.clients.codeHint")}
						</p>
					</div>

					{/* العملة */}
					<div>
						<Label>{t("finance.clients.currency")}</Label>
						<Select
							value={formData.currency}
							onValueChange={(value) =>
								setFormData((prev) => ({ ...prev, currency: value }))
							}
						>
							<SelectTrigger className="rounded-xl mt-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{currencies.map((currency) => (
									<SelectItem key={currency.code} value={currency.code}>
										{currency.code} - {currency.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* التصنيفات */}
				<div>
					<Label>{t("finance.clients.classification")}</Label>
					<div className="mt-2 flex flex-wrap gap-2">
						{formData.classification.map((c) => {
							const option = classificationOptions.find(
								(opt) => opt.value === c,
							);
							return (
								<Badge
									key={c}
									variant="secondary"
									className="rounded-lg px-3 py-1 gap-2"
								>
									{option?.label || c}
									<button
										type="button"
										onClick={() => removeClassification(c)}
										className="hover:text-red-500"
									>
										<X className="h-3 w-3" />
									</button>
								</Badge>
							);
						})}
					</div>
					<Select
						value=""
						onValueChange={(value) => {
							if (value) addClassification(value);
						}}
					>
						<SelectTrigger className="rounded-xl mt-2 max-w-xs">
							<SelectValue placeholder={t("finance.clients.addClassification")} />
						</SelectTrigger>
						<SelectContent>
							{classificationOptions
								.filter((opt) => !formData.classification.includes(opt.value))
								.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				</div>
			</CardContent>
		</Card>
	);
}
