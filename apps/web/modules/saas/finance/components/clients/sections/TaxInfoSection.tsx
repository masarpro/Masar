"use client";

import { useTranslations } from "next-intl";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Receipt } from "lucide-react";
import type { ClientFormData } from "../ClientForm";

interface TaxInfoSectionProps {
	formData: ClientFormData;
	setFormData: React.Dispatch<React.SetStateAction<ClientFormData>>;
}

export function TaxInfoSection({
	formData,
	setFormData,
}: TaxInfoSectionProps) {
	const t = useTranslations();

	return (
		<Card className="rounded-2xl">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2 text-lg">
					<Receipt className="h-5 w-5 text-primary" />
					{t("finance.clients.sections.taxInfo")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<Label>{t("finance.clients.taxNumber")}</Label>
						<Input
							value={formData.taxNumber}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									taxNumber: e.target.value,
								}))
							}
							placeholder={t("finance.clients.taxNumberPlaceholder")}
							className="rounded-xl mt-1"
							dir="ltr"
						/>
						<p className="text-xs text-slate-500 mt-1">
							{t("finance.clients.taxNumberHint")}
						</p>
					</div>
					<div>
						<Label>{t("finance.clients.crNumber")}</Label>
						<Input
							value={formData.crNumber}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									crNumber: e.target.value,
								}))
							}
							placeholder={t("finance.clients.crNumberPlaceholder")}
							className="rounded-xl mt-1"
							dir="ltr"
						/>
						<p className="text-xs text-slate-500 mt-1">
							{t("finance.clients.crNumberHint")}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
