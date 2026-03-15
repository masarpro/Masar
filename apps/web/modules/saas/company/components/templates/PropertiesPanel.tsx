"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Label } from "@ui/components/label";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Button } from "@ui/components/button";
import { Switch } from "@ui/components/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Slider } from "@ui/components/slider";
import {
	Settings2Icon,
	PaletteIcon,
	TypeIcon,
	LayoutIcon,
	PercentIcon,
} from "lucide-react";
import type { TemplateElement } from "./TemplateCanvas";

export interface TemplateSettings {
	backgroundColor: string;
	primaryColor: string;
	fontFamily: string;
	fontSize: string;
	lineHeight: string;
	pageSize: "A4" | "Letter";
	orientation: "portrait" | "landscape";
	margins: string;
	vatPercent: number;
	currency: string;
}

interface PropertiesPanelProps {
	selectedElement: TemplateElement | null;
	templateSettings: TemplateSettings;
	onUpdateElement: (id: string, settings: Record<string, unknown>) => void;
	onUpdateSettings: (settings: Partial<TemplateSettings>) => void;
	onToggleElement: (id: string) => void;
}

const fontFamilies = [
	{ value: "inherit", label: "افتراضي" },
	{ value: "Cairo", label: "Cairo" },
	{ value: "Tajawal", label: "Tajawal" },
	{ value: "IBM Plex Sans Arabic", label: "IBM Plex Sans Arabic" },
	{ value: "Noto Sans Arabic", label: "Noto Sans Arabic" },
];

const fontSizes = [
	{ value: "12px", label: "صغير" },
	{ value: "14px", label: "متوسط" },
	{ value: "16px", label: "كبير" },
	{ value: "18px", label: "كبير جداً" },
];

const currencies = [
	{ value: "SAR", label: "ريال سعودي (SAR)" },
	{ value: "AED", label: "درهم إماراتي (AED)" },
	{ value: "USD", label: "دولار أمريكي (USD)" },
	{ value: "EUR", label: "يورو (EUR)" },
];

export function PropertiesPanel({
	selectedElement,
	templateSettings,
	onUpdateElement,
	onUpdateSettings,
	onToggleElement,
}: PropertiesPanelProps) {
	const t = useTranslations();

	return (
		<div className="w-[320px] border-s bg-muted/30 p-4 overflow-y-auto">
			{/* Element Properties */}
			{selectedElement ? (
				<Card className="rounded-2xl border-0 shadow-none bg-transparent mb-6">
					<CardHeader className="px-0 pt-0">
						<CardTitle className="text-base flex items-center gap-2">
							<Settings2Icon className="h-5 w-5" />
							{t("finance.templates.editor.elementProperties")}
						</CardTitle>
					</CardHeader>
					<CardContent className="px-0 space-y-4">
						{/* Element Info */}
						<div className="flex items-center justify-between p-3 bg-background rounded-xl border">
							<div>
								<p className="font-medium">
									{t(`finance.templates.editor.elementTypes.${selectedElement.type}`)}
								</p>
								<p className="text-xs text-muted-foreground">
									{t(`finance.templates.editor.elementDescriptions.${selectedElement.type}`)}
								</p>
							</div>
							<Switch
								checked={selectedElement.enabled}
								onCheckedChange={() => onToggleElement(selectedElement.id)}
							/>
						</div>

						{/* Element-specific settings */}
						{selectedElement.type === "header" && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showLogo")}</Label>
									<Switch
										checked={(selectedElement.settings.showLogo as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showLogo: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showCompanyName")}</Label>
									<Switch
										checked={(selectedElement.settings.showCompanyName as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showCompanyName: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showAddress")}</Label>
									<Switch
										checked={(selectedElement.settings.showAddress as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showAddress: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showBilingualName")}</Label>
									<Switch
										checked={(selectedElement.settings.showBilingualName as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showBilingualName: checked })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>{t("finance.templates.editor.settings.layout")}</Label>
									<Select
										value={(selectedElement.settings.layout as string) ?? "modern"}
										onValueChange={(value) =>
											onUpdateElement(selectedElement.id, { layout: value })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="modern">{t("finance.templates.editor.layouts.modern")}</SelectItem>
											<SelectItem value="classic">{t("finance.templates.editor.layouts.classic")}</SelectItem>
											<SelectItem value="minimal">{t("finance.templates.editor.layouts.minimal")}</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						)}

						{selectedElement.type === "clientInfo" && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showTaxNumber")}</Label>
									<Switch
										checked={(selectedElement.settings.showTaxNumber as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showTaxNumber: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showEmail")}</Label>
									<Switch
										checked={(selectedElement.settings.showEmail as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showEmail: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showPhone")}</Label>
									<Switch
										checked={(selectedElement.settings.showPhone as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showPhone: checked })
										}
									/>
								</div>
							</div>
						)}

						{selectedElement.type === "itemsTable" && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showQuantity")}</Label>
									<Switch
										checked={(selectedElement.settings.showQuantity as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showQuantity: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showUnit")}</Label>
									<Switch
										checked={(selectedElement.settings.showUnit as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showUnit: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showUnitPrice")}</Label>
									<Switch
										checked={(selectedElement.settings.showUnitPrice as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showUnitPrice: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showRowNumbers")}</Label>
									<Switch
										checked={(selectedElement.settings.showRowNumbers as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showRowNumbers: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.alternatingColors")}</Label>
									<Switch
										checked={(selectedElement.settings.alternatingColors as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { alternatingColors: checked })
										}
									/>
								</div>
							</div>
						)}

						{selectedElement.type === "totals" && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showDiscount")}</Label>
									<Switch
										checked={(selectedElement.settings.showDiscount as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showDiscount: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showVat")}</Label>
									<Switch
										checked={(selectedElement.settings.showVat as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showVat: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showAmountInWords")}</Label>
									<Switch
										checked={(selectedElement.settings.showAmountInWords as boolean) ?? false}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showAmountInWords: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.highlightTotal")}</Label>
									<Switch
										checked={(selectedElement.settings.highlightTotal as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { highlightTotal: checked })
										}
									/>
								</div>
							</div>
						)}

						{selectedElement.type === "terms" && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showPaymentTerms")}</Label>
									<Switch
										checked={(selectedElement.settings.showPaymentTerms as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showPaymentTerms: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showDeliveryTerms")}</Label>
									<Switch
										checked={(selectedElement.settings.showDeliveryTerms as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showDeliveryTerms: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showWarrantyTerms")}</Label>
									<Switch
										checked={(selectedElement.settings.showWarrantyTerms as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showWarrantyTerms: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showValidityNote")}</Label>
									<Switch
										checked={(selectedElement.settings.showValidityNote as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showValidityNote: checked })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>{t("finance.templates.editor.settings.validityDays")}</Label>
									<Input
										type="number"
										min={1}
										max={365}
										value={(selectedElement.settings.validityDays as number) ?? 30}
										onChange={(e) =>
											onUpdateElement(selectedElement.id, { validityDays: parseInt(e.target.value) || 30 })
										}
									/>
								</div>
							</div>
						)}

						{selectedElement.type === "qrCode" && (
							<div className="space-y-4">
								<div className="space-y-2">
									<Label>{t("finance.templates.editor.settings.qrSize")}</Label>
									<Select
										value={(selectedElement.settings.size as string) ?? "medium"}
										onValueChange={(value) =>
											onUpdateElement(selectedElement.id, { size: value })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="small">{t("common.small")}</SelectItem>
											<SelectItem value="medium">{t("common.medium")}</SelectItem>
											<SelectItem value="large">{t("common.large")}</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showZatcaCompliance")}</Label>
									<Switch
										checked={(selectedElement.settings.showZatcaCompliance as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showZatcaCompliance: checked })
										}
									/>
								</div>
							</div>
						)}

						{selectedElement.type === "signature" && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showDate")}</Label>
									<Switch
										checked={(selectedElement.settings.showDate as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showDate: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showStampArea")}</Label>
									<Switch
										checked={(selectedElement.settings.showStampArea as boolean) ?? false}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showStampArea: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.twoColumns")}</Label>
									<Switch
										checked={(selectedElement.settings.twoColumns as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { twoColumns: checked })
										}
									/>
								</div>
							</div>
						)}

						{selectedElement.type === "bankDetails" && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showBankName")}</Label>
									<Switch
										checked={(selectedElement.settings.showBankName as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showBankName: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showIban")}</Label>
									<Switch
										checked={(selectedElement.settings.showIban as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showIban: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showAccountName")}</Label>
									<Switch
										checked={(selectedElement.settings.showAccountName as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showAccountName: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showSwiftCode")}</Label>
									<Switch
										checked={(selectedElement.settings.showSwiftCode as boolean) ?? false}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showSwiftCode: checked })
										}
									/>
								</div>
							</div>
						)}

						{selectedElement.type === "footer" && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showThankYouMessage")}</Label>
									<Switch
										checked={(selectedElement.settings.showThankYouMessage as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showThankYouMessage: checked })
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.showYear")}</Label>
									<Switch
										checked={(selectedElement.settings.showYear as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { showYear: checked })
										}
									/>
								</div>
							</div>
						)}

						{selectedElement.type === "text" && (
							<div className="space-y-4">
								<div className="space-y-2">
									<Label>{t("finance.templates.editor.settings.textLabel")}</Label>
									<Input
										value={(selectedElement.settings.label as string) ?? ""}
										onChange={(e) =>
											onUpdateElement(selectedElement.id, { label: e.target.value })
										}
										placeholder={t("finance.templates.editor.settings.textLabelPlaceholder")}
									/>
								</div>
								<div className="space-y-2">
									<Label>{t("finance.templates.editor.settings.textPlaceholder")}</Label>
									<Input
										value={(selectedElement.settings.placeholder as string) ?? ""}
										onChange={(e) =>
											onUpdateElement(selectedElement.id, { placeholder: e.target.value })
										}
										placeholder={t("finance.templates.editor.settings.textPlaceholderHint")}
									/>
								</div>
								<div className="space-y-2">
									<Label>{t("finance.templates.editor.settings.defaultContent")}</Label>
									<Textarea
										value={(selectedElement.settings.content as string) ?? ""}
										onChange={(e) =>
											onUpdateElement(selectedElement.id, { content: e.target.value })
										}
										placeholder={t("finance.templates.editor.settings.defaultContentPlaceholder")}
										rows={3}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label>{t("finance.templates.editor.settings.isEditable")}</Label>
									<Switch
										checked={(selectedElement.settings.isEditable as boolean) ?? true}
										onCheckedChange={(checked) =>
											onUpdateElement(selectedElement.id, { isEditable: checked })
										}
									/>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			) : (
				<Card className="rounded-2xl border-0 shadow-none bg-transparent mb-6">
					<CardContent className="px-0 pt-0">
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
								<Settings2Icon className="h-6 w-6 text-muted-foreground" />
							</div>
							<p className="text-sm text-muted-foreground">
								{t("finance.templates.editor.selectElementToEdit")}
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Template Settings */}
			<Card className="rounded-2xl">
				<CardHeader className="pb-3">
					<CardTitle className="text-base flex items-center gap-2">
						<PaletteIcon className="h-5 w-5" />
						{t("finance.templates.editor.templateSettings")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Colors */}
					<div className="space-y-4">
						<h4 className="text-sm font-medium flex items-center gap-2">
							<PaletteIcon className="h-4 w-4" />
							{t("finance.templates.editor.colors")}
						</h4>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label className="text-xs">{t("finance.templates.editor.backgroundColor")}</Label>
								<div className="flex items-center gap-2">
									<Input
										type="color"
										value={templateSettings.backgroundColor}
										onChange={(e) =>
											onUpdateSettings({ backgroundColor: e.target.value })
										}
										className="w-10 h-10 p-1 rounded-lg cursor-pointer"
									/>
									<Input
										value={templateSettings.backgroundColor}
										onChange={(e) =>
											onUpdateSettings({ backgroundColor: e.target.value })
										}
										className="flex-1 text-xs"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">{t("finance.templates.editor.primaryColor")}</Label>
								<div className="flex items-center gap-2">
									<Input
										type="color"
										value={templateSettings.primaryColor}
										onChange={(e) =>
											onUpdateSettings({ primaryColor: e.target.value })
										}
										className="w-10 h-10 p-1 rounded-lg cursor-pointer"
									/>
									<Input
										value={templateSettings.primaryColor}
										onChange={(e) =>
											onUpdateSettings({ primaryColor: e.target.value })
										}
										className="flex-1 text-xs"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Typography */}
					<div className="space-y-4">
						<h4 className="text-sm font-medium flex items-center gap-2">
							<TypeIcon className="h-4 w-4" />
							{t("finance.templates.editor.typography")}
						</h4>
						<div className="space-y-3">
							<div className="space-y-2">
								<Label className="text-xs">{t("finance.templates.editor.fontFamily")}</Label>
								<Select
									value={templateSettings.fontFamily}
									onValueChange={(value) => onUpdateSettings({ fontFamily: value })}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{fontFamilies.map((font) => (
											<SelectItem key={font.value} value={font.value}>
												{font.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">{t("finance.templates.editor.fontSize")}</Label>
								<Select
									value={templateSettings.fontSize}
									onValueChange={(value) => onUpdateSettings({ fontSize: value })}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{fontSizes.map((size) => (
											<SelectItem key={size.value} value={size.value}>
												{size.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{/* Page Settings */}
					<div className="space-y-4">
						<h4 className="text-sm font-medium flex items-center gap-2">
							<LayoutIcon className="h-4 w-4" />
							{t("finance.templates.editor.pageSettings")}
						</h4>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label className="text-xs">{t("finance.templates.editor.pageSize")}</Label>
								<Select
									value={templateSettings.pageSize}
									onValueChange={(value) =>
										onUpdateSettings({ pageSize: value as "A4" | "Letter" })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="A4">A4</SelectItem>
										<SelectItem value="Letter">Letter</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">{t("finance.templates.editor.orientation")}</Label>
								<Select
									value={templateSettings.orientation}
									onValueChange={(value) =>
										onUpdateSettings({ orientation: value as "portrait" | "landscape" })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="portrait">
											{t("finance.templates.editor.portrait")}
										</SelectItem>
										<SelectItem value="landscape">
											{t("finance.templates.editor.landscape")}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{/* Tax & Currency */}
					<div className="space-y-4">
						<h4 className="text-sm font-medium flex items-center gap-2">
							<PercentIcon className="h-4 w-4" />
							{t("finance.templates.editor.taxCurrency")}
						</h4>
						<div className="space-y-3">
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label className="text-xs">{t("finance.templates.editor.vatPercent")}</Label>
									<span className="text-xs text-muted-foreground">
										{templateSettings.vatPercent}%
									</span>
								</div>
								<Slider
									value={[templateSettings.vatPercent]}
									onValueChange={([value]) => onUpdateSettings({ vatPercent: value })}
									max={25}
									step={0.5}
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">{t("finance.templates.editor.currency")}</Label>
								<Select
									value={templateSettings.currency}
									onValueChange={(value) => onUpdateSettings({ currency: value })}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{currencies.map((currency) => (
											<SelectItem key={currency.value} value={currency.value}>
												{currency.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
