"use client";

import { useTranslations } from "next-intl";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Settings2, Globe, FileText } from "lucide-react";
import type { ClientFormData } from "../ClientForm";

interface AdditionalSectionProps {
	formData: ClientFormData;
	setFormData: React.Dispatch<React.SetStateAction<ClientFormData>>;
}

// لغات العرض
const displayLanguages = [
	{ code: "ar", name: "العربية" },
	{ code: "en", name: "English" },
];

export function AdditionalSection({
	formData,
	setFormData,
}: AdditionalSectionProps) {
	const t = useTranslations();

	return (
		<Card className="rounded-2xl">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2 text-lg">
					<Settings2 className="h-5 w-5 text-primary" />
					{t("finance.clients.sections.additional")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* الملاحظات */}
				<div>
					<Label className="flex items-center gap-2">
						<FileText className="h-4 w-4 text-slate-400" />
						{t("finance.clients.notes")}
					</Label>
					<Textarea
						value={formData.notes}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								notes: e.target.value,
							}))
						}
						placeholder={t("finance.clients.notesPlaceholder")}
						rows={4}
						className="rounded-xl mt-1"
					/>
				</div>

				{/* لغة العرض */}
				<div className="max-w-xs">
					<Label className="flex items-center gap-2">
						<Globe className="h-4 w-4 text-slate-400" />
						{t("finance.clients.displayLanguage")}
					</Label>
					<Select
						value={formData.displayLanguage}
						onValueChange={(value) =>
							setFormData((prev) => ({ ...prev, displayLanguage: value }))
						}
					>
						<SelectTrigger className="rounded-xl mt-1">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{displayLanguages.map((lang) => (
								<SelectItem key={lang.code} value={lang.code}>
									{lang.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<p className="text-xs text-slate-500 mt-1">
						{t("finance.clients.displayLanguageHint")}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
