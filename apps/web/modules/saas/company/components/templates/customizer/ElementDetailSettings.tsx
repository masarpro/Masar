"use client";

import type { useTranslations } from "next-intl";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { Textarea } from "@ui/components/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Button } from "@ui/components/button";
import type { TemplateElement } from "../TemplateCanvas";
import { BankDetailsSettings } from "./BankDetailsSettings";

export interface ElementDetailSettingsProps {
	element: TemplateElement;
	onUpdate: (settings: Record<string, unknown>) => void;
	organizationId: string;
	t: ReturnType<typeof useTranslations>;
}

export function ElementDetailSettings({
	element,
	onUpdate,
	organizationId,
	t,
}: ElementDetailSettingsProps) {
	const s = element.settings;
	const toggle = (key: string, defaultVal = true) => (
		<div className="flex items-center justify-between" key={key}>
			<Label className="text-xs">
				{t(`finance.templates.editor.settings.${key}`)}
			</Label>
			<Switch
				checked={(s[key] as boolean) ?? defaultVal}
				onCheckedChange={(checked: any) => onUpdate({ [key]: checked })}
				className="scale-75"
			/>
		</div>
	);

	switch (element.type) {
		case "header":
			return (
				<>
					{toggle("showAddress")}
					{toggle("showBilingualName")}
					{toggle("showPhone", false)}
					{toggle("showCrNumber", false)}
					{toggle("showQrInHeader", false)}
					{toggle("showTitleInHeader", true)}
					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("finance.templates.editor.settings.companyNameSize")}
						</Label>
						<Select
							value={(s.companyNameSize as string) ?? "large"}
							onValueChange={(v: any) => onUpdate({ companyNameSize: v })}
						>
							<SelectTrigger className="h-8 text-xs rounded-lg">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="small">
									{t("common.small")}
								</SelectItem>
								<SelectItem value="medium">
									{t("common.medium")}
								</SelectItem>
								<SelectItem value="large">
									{t("common.large")}
								</SelectItem>
								<SelectItem value="xlarge">
									{t("common.xlarge")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("finance.templates.editor.settings.layout")}
						</Label>
						<Select
							value={(s.layout as string) ?? "modern"}
							onValueChange={(v: any) => onUpdate({ layout: v })}
						>
							<SelectTrigger className="h-8 text-xs rounded-lg">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="modern">
									{t("finance.templates.editor.layouts.modern")}
								</SelectItem>
								<SelectItem value="classic">
									{t("finance.templates.editor.layouts.classic")}
								</SelectItem>
								<SelectItem value="minimal">
									{t("finance.templates.editor.layouts.minimal")}
								</SelectItem>
								<SelectItem value="bilingual">
									{t("finance.templates.editor.layouts.bilingual")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</>
			);

		case "documentMeta":
			return (
				<>
					{toggle("showDocumentNumber")}
					{toggle("showDate")}
					{toggle("showDueDate")}
					{toggle("showDocumentTypeLabel", false)}
					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("finance.templates.editor.settings.layout")}
						</Label>
						<Select
							value={(s.layout as string) ?? "centered"}
							onValueChange={(v: any) => onUpdate({ layout: v })}
						>
							<SelectTrigger className="h-8 text-xs rounded-lg">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="centered">
									{t("finance.templates.editor.layouts.centered")}
								</SelectItem>
								<SelectItem value="bar">
									{t("finance.templates.editor.layouts.bar")}
								</SelectItem>
								<SelectItem value="card">
									{t("finance.templates.editor.layouts.card")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</>
			);

		case "clientInfo":
			return (
				<>
					{toggle("showCompanyPhone")}
					{toggle("showEmail")}
					{toggle("showPhone")}
					{toggle("showAddress", true)}
					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("finance.templates.editor.settings.layout")}
						</Label>
						<Select
							value={(s.layout as string) ?? "default"}
							onValueChange={(v: any) => onUpdate({ layout: v })}
						>
							<SelectTrigger className="h-8 text-xs rounded-lg">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="default">
									{t("finance.templates.editor.layouts.modern")}
								</SelectItem>
								<SelectItem value="bordered-right">
									{t("finance.templates.editor.layouts.classic")}
								</SelectItem>
								<SelectItem value="two-cards">
									{t("finance.templates.editor.layouts.card")}
								</SelectItem>
								<SelectItem value="highlight-card">
									{t("finance.templates.editor.layouts.bar")}
								</SelectItem>
								<SelectItem value="client-with-qr">
									{t("finance.templates.editor.layouts.clientWithQr")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</>
			);

		case "itemsTable":
			return (
				<>
					{toggle("showQuantity")}
					{toggle("showUnit")}
					{toggle("showUnitPrice")}
					{toggle("showRowNumbers")}
					{toggle("alternatingColors")}
				</>
			);

		case "totals":
			return (
				<>
					{toggle("showDiscount")}
					{toggle("showAmountInWords", false)}
					{toggle("highlightTotal")}
				</>
			);

		case "terms":
			return (
				<>
					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("finance.templates.editor.settings.termsTitle")}
						</Label>
						<Input
							value={(s.title as string) ?? ""}
							onChange={(e: any) => onUpdate({ title: e.target.value })}
							placeholder={t("finance.templates.preview.termsAndConditions")}
							className="h-8 text-xs rounded-lg"
						/>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("finance.templates.editor.settings.termsContent")}
						</Label>
						<Textarea
							value={(s.content as string) ?? ""}
							onChange={(e: any) => onUpdate({ content: e.target.value })}
							placeholder={t("finance.templates.editor.settings.termsContentPlaceholder")}
							rows={4}
							className="text-xs rounded-lg"
						/>
					</div>
				</>
			);

		case "signature":
			return (
				<>
					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("finance.templates.editor.settings.signatureImage")}
						</Label>
						{(s.signatureImage as string) ? (
							<div className="space-y-2">
								<img
									src={s.signatureImage as string}
									alt={t("finance.templates.editor.settings.signatureImage")}
									className="h-16 object-contain border rounded-lg p-1"
								/>
								<Button
									variant="outline"
									size="sm"
									className="text-xs rounded-lg"
									onClick={() => onUpdate({ signatureImage: "" })}
								>
									{t("finance.templates.editor.settings.removeSignature")}
								</Button>
							</div>
						) : (
							<Input
								type="file"
								accept="image/*"
								className="h-8 text-xs rounded-lg"
								onChange={(e: any) => {
									const file = e.target.files?.[0];
									if (file) {
										const reader = new FileReader();
										reader.onload = (ev) => {
											onUpdate({ signatureImage: ev.target?.result as string });
										};
										reader.readAsDataURL(file);
									}
								}}
							/>
						)}
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("finance.templates.editor.settings.signaturePosition")}
						</Label>
						<Select
							value={(s.signaturePosition as string) ?? "bottom-right"}
							onValueChange={(v: any) => onUpdate({ signaturePosition: v })}
						>
							<SelectTrigger className="h-8 text-xs rounded-lg">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="bottom-right">
									{t("finance.templates.editor.settings.positionBottomRight")}
								</SelectItem>
								<SelectItem value="bottom-left">
									{t("finance.templates.editor.settings.positionBottomLeft")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</>
			);

		case "bankDetails":
			return (
				<BankDetailsSettings
					selectedBankId={(s.selectedBankId as string) ?? ""}
					organizationId={organizationId}
					onUpdate={onUpdate}
					t={t}
				/>
			);

		case "qrCode":
			return (
				<>
					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("finance.templates.editor.settings.qrSize")}
						</Label>
						<Select
							value={(s.size as string) ?? "medium"}
							onValueChange={(v: any) => onUpdate({ size: v })}
						>
							<SelectTrigger className="h-8 text-xs rounded-lg">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="small">
									{t("common.small")}
								</SelectItem>
								<SelectItem value="medium">
									{t("common.medium")}
								</SelectItem>
								<SelectItem value="large">
									{t("common.large")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</>
			);

		case "footer":
			return (
				<>
					{toggle("showAddress", false)}
					{toggle("showPhone", false)}
					{toggle("showEmail", false)}
					{toggle("showWebsite", false)}
					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("finance.templates.editor.settings.footerAlign")}
						</Label>
						<Select
							value={(s.textAlign as string) ?? "center"}
							onValueChange={(v: any) => onUpdate({ textAlign: v })}
						>
							<SelectTrigger className="h-8 text-xs rounded-lg">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="end">
									{t("finance.templates.editor.alignments.start")}
								</SelectItem>
								<SelectItem value="center">
									{t("finance.templates.editor.alignments.center")}
								</SelectItem>
								<SelectItem value="start">
									{t("finance.templates.editor.alignments.end")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</>
			);

		case "text":
			return (
				<>
					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("finance.templates.editor.settings.textLabel")}
						</Label>
						<Input
							value={(s.label as string) ?? ""}
							onChange={(e: any) => onUpdate({ label: e.target.value })}
							placeholder={t(
								"finance.templates.editor.settings.textLabelPlaceholder",
							)}
							className="h-8 text-xs rounded-lg"
						/>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("finance.templates.editor.settings.textPlaceholder")}
						</Label>
						<Input
							value={(s.placeholder as string) ?? ""}
							onChange={(e: any) =>
								onUpdate({ placeholder: e.target.value })
							}
							placeholder={t(
								"finance.templates.editor.settings.textPlaceholderHint",
							)}
							className="h-8 text-xs rounded-lg"
						/>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs">
							{t("finance.templates.editor.settings.defaultContent")}
						</Label>
						<Textarea
							value={(s.content as string) ?? ""}
							onChange={(e: any) =>
								onUpdate({ content: e.target.value })
							}
							placeholder={t(
								"finance.templates.editor.settings.defaultContentPlaceholder",
							)}
							rows={2}
							className="text-xs rounded-lg"
						/>
					</div>
					{toggle("isEditable")}
				</>
			);

		default:
			return (
				<p className="text-xs text-muted-foreground">
					{t("finance.templates.editor.selectElementToEdit")}
				</p>
			);
	}
}
