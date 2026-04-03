"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
	useQuery,
	useMutation,
	useQueryClient,
	skipToken,
} from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { Slider } from "@ui/components/slider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	SaveIcon,
	ArrowRightIcon,
	Loader2Icon,
	PaletteIcon,
	TypeIcon,
	LayoutListIcon,
	ZoomInIcon,
	ZoomOutIcon,
	RotateCcwIcon,
	ImageIcon,
	FileIcon,
	XIcon,
	DropletIcon,
	Receipt,
	FileSignature,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
const CropImageDialog = dynamic(
	() =>
		import("@saas/settings/components/CropImageDialog").then((m) => ({
			default: m.CropImageDialog,
		})),
	{ ssr: false },
);
import { toast } from "sonner";
import type { TemplateElement } from "./TemplateCanvas";
import { TemplateRenderer } from "./renderer/TemplateRenderer";
import type { OrganizationData, TemplateConfig } from "./renderer/TemplateRenderer";
import {
	getPresetByKey,
	TEMPLATE_COLORS,
	type TemplateSettings,
	type DefaultTemplateConfig,
} from "../../lib/default-templates";
import { getSampleData } from "../../lib/sample-preview-data";
import { EditorPageSkeleton } from "@saas/shared/components/skeletons";
import { SettingsSection, ElementSettingsRow } from "./customizer";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const fontFamilies = [
	{ value: "Cairo", label: "Cairo" },
	{ value: "Tajawal", label: "Tajawal" },
	{ value: "IBM Plex Sans Arabic", label: "IBM Plex Sans Arabic" },
	{ value: "Noto Sans Arabic", label: "Noto Sans Arabic" },
];

const fontSizeKeys = [
	{ value: "12px", labelKey: "common.small" },
	{ value: "14px", labelKey: "common.medium" },
	{ value: "16px", labelKey: "common.large" },
	{ value: "18px", labelKey: "common.xlarge" },
] as const;

const defaultSettings: TemplateSettings = {
	backgroundColor: "#ffffff",
	primaryColor: "#3b82f6",
	fontFamily: "Cairo",
	fontSize: "14px",
	lineHeight: "1.6",
	pageSize: "A4",
	orientation: "portrait",
	margins: "20mm",
	vatPercent: 15,
	currency: "SAR",
};

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface TemplateCustomizerProps {
	organizationId: string;
	organizationSlug: string;
	templateId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function TemplateCustomizer({
	organizationId,
	organizationSlug,
	templateId,
}: TemplateCustomizerProps) {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/settings`;

	const presetKey = searchParams.get("preset");

	// State
	const [templateName, setTemplateName] = useState("");
	const [templateType, setTemplateType] = useState<"QUOTATION" | "INVOICE">(
		"INVOICE",
	);
	const [elements, setElements] = useState<TemplateElement[]>([]);
	const [settings, setSettings] = useState<TemplateSettings>(defaultSettings);
	const [zoom, setZoom] = useState(70);
	const [expandedElement, setExpandedElement] = useState<string | null>(null);
	const [initialized, setInitialized] = useState(false);
	const [headerFile, setHeaderFile] = useState<File | null>(null);
	const [footerFile, setFooterFile] = useState<File | null>(null);
	const [showHeaderCrop, setShowHeaderCrop] = useState(false);
	const [showFooterCrop, setShowFooterCrop] = useState(false);

	// Fetch existing template when editing
	const { data: existingTemplate, isLoading: isLoadingTemplate } = useQuery(
		orpc.company.templates.getById.queryOptions({
			input: templateId
				? { organizationId, id: templateId }
				: skipToken,
		}),
	);

	// Fetch organization finance settings for preview
	const { data: orgSettings } = useQuery({
		...orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
		staleTime: STALE_TIMES.FINANCE_SETTINGS,
	});

	// Fetch bank accounts for bank selection
	const { data: banksData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
	);

	const banks = useMemo(
		() => (banksData?.accounts ?? []).filter((b: any) => b.accountType === "BANK"),
		[banksData],
	);

	// Prepare organization data for preview
	const organizationData: OrganizationData = useMemo(
		() => ({
			name: orgSettings?.companyNameAr ?? "",
			nameAr: orgSettings?.companyNameAr ?? undefined,
			nameEn: orgSettings?.companyNameEn ?? undefined,
			logo: orgSettings?.logo ?? undefined,
			address: orgSettings?.address ?? undefined,
			addressAr: orgSettings?.address ?? undefined,
			addressEn: orgSettings?.addressEn ?? undefined,
			phone: orgSettings?.phone ?? undefined,
			email: orgSettings?.email ?? undefined,
			website: orgSettings?.website ?? undefined,
			taxNumber: orgSettings?.taxNumber ?? undefined,
			commercialReg: orgSettings?.commercialReg ?? undefined,
			bankName: orgSettings?.bankName ?? undefined,
			bankNameEn: orgSettings?.bankNameEn ?? undefined,
			accountName: orgSettings?.accountName ?? undefined,
			iban: orgSettings?.iban ?? undefined,
			accountNumber: orgSettings?.accountNumber ?? undefined,
			swiftCode: orgSettings?.swiftCode ?? undefined,
			headerText: orgSettings?.headerText ?? undefined,
			footerText: orgSettings?.footerText ?? undefined,
			thankYouMessage: undefined,
		}),
		[orgSettings],
	);

	// Initialize from preset or existing template
	useEffect(() => {
		if (initialized) return;

		if (templateId && existingTemplate) {
			// Editing existing template
			setTemplateName(existingTemplate.name);
			setTemplateType(existingTemplate.templateType as "QUOTATION" | "INVOICE");

			const content = existingTemplate.content as {
				elements?: TemplateElement[];
			} | null;
			if (content?.elements?.length) {
				setElements(content.elements);
			}

			const loadedSettings = existingTemplate.settings as Partial<TemplateSettings> | null;
			if (loadedSettings && Object.keys(loadedSettings).length > 0) {
				setSettings({ ...defaultSettings, ...loadedSettings });
			}
			setInitialized(true);
		} else if (!templateId && presetKey) {
			// Creating from preset
			const preset = getPresetByKey(presetKey);
			if (preset) {
				setTemplateName("");
				setTemplateType(preset.templateType);
				setElements(preset.elements);
				setSettings({ ...preset.settings });
				setInitialized(true);
			}
		} else if (!templateId && !presetKey) {
			setInitialized(true);
		}
	}, [templateId, existingTemplate, presetKey, initialized]);

	// Get the preset config for labeling
	const presetConfig: DefaultTemplateConfig | undefined = useMemo(() => {
		if (presetKey) return getPresetByKey(presetKey);
		return undefined;
	}, [presetKey]);

	// Sample data for preview
	const docType = templateType.toLowerCase() as "quotation" | "invoice";
	const sampleData = useMemo(
		() => getSampleData(docType, settings),
		[docType, settings],
	);

	const templateConfig: TemplateConfig = useMemo(
		() => ({ elements, settings }),
		[elements, settings],
	);

	// ── Mutations ──────────────────────────────────────────────────────────

	// Strip undefined values from an object to avoid serialization issues
	const cleanObject = useCallback((obj: Record<string, unknown>): Record<string, unknown> => {
		const cleaned: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj)) {
			if (value !== undefined) {
				cleaned[key] = value;
			}
		}
		return cleaned;
	}, []);

	const createMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.templates.create({
				organizationId,
				name: templateName,
				templateType,
				content: { elements },
				settings: cleanObject(settings as any),
			});
		},
		onSuccess: (data) => {
			toast.success(t("finance.templates.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["company", "templates"] });
			router.push(`${basePath}/templates/${data.id}`);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("finance.templates.createError"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.templates.update({
				organizationId,
				id: templateId!,
				name: templateName,
				content: { elements },
				settings: cleanObject(settings as any),
			});
		},
		onSuccess: () => {
			toast.success(t("finance.templates.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: ["company", "templates"] });
		},
		onError: (error: Error) => {
			toast.error(error.message || t("finance.templates.updateError"));
		},
	});

	// ── Handlers ───────────────────────────────────────────────────────────

	const handleUpdateSettings = useCallback(
		(newSettings: Partial<TemplateSettings>) => {
			setSettings((prev) => ({ ...prev, ...newSettings }));
		},
		[],
	);

	const handleToggleElement = useCallback((id: string) => {
		setElements((prev) =>
			prev.map((el) =>
				el.id === id ? { ...el, enabled: !el.enabled } : el,
			),
		);
	}, []);

	const handleUpdateElement = useCallback(
		(id: string, newSettings: Record<string, unknown>) => {
			setElements((prev) =>
				prev.map((el) =>
					el.id === id
						? { ...el, settings: { ...el.settings, ...newSettings } }
						: el,
				),
			);
		},
		[],
	);

	const handleSave = useCallback(async () => {
		if (!templateName.trim()) {
			toast.error(t("finance.templates.errors.nameRequired"));
			return;
		}
		if (templateId) {
			updateMutation.mutate();
		} else {
			createMutation.mutate();
		}
	}, [templateId, templateName, createMutation, updateMutation, t]);

	const isSaving = createMutation.isPending || updateMutation.isPending;

	// ── Letterhead helpers ────────────────────────────────────────────────

	const blobToBase64 = (blob: Blob): Promise<string> =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});

	const handleHeaderUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				setHeaderFile(file);
				setShowHeaderCrop(true);
			}
			e.target.value = "";
		},
		[],
	);

	const handleFooterUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				setFooterFile(file);
				setShowFooterCrop(true);
			}
			e.target.value = "";
		},
		[],
	);

	const handleHeaderCrop = useCallback(
		async (blob: Blob | null) => {
			if (blob) {
				const base64 = await blobToBase64(blob);
				handleUpdateSettings({ headerImage: base64 });
			}
			setShowHeaderCrop(false);
			setHeaderFile(null);
		},
		[handleUpdateSettings],
	);

	const handleFooterCrop = useCallback(
		async (blob: Blob | null) => {
			if (blob) {
				const base64 = await blobToBase64(blob);
				handleUpdateSettings({ footerImage: base64 });
			}
			setShowFooterCrop(false);
			setFooterFile(null);
		},
		[handleUpdateSettings],
	);

	// ── Loading state ──────────────────────────────────────────────────────

	if (templateId && isLoadingTemplate) {
		return <EditorPageSkeleton />;
	}

	// ── Render ──────────────────────────────────────────────────────────────

	return (
		<div className="h-[calc(100vh-4rem)] flex flex-col">
			{/* ── Toolbar ──────────────────────────────────────────────────── */}
			<div className="border-b bg-background px-4 py-3 flex items-center justify-between shrink-0">
				<div className="flex items-center gap-3">
					<Link href={`${basePath}/templates`}>
						<Button variant="ghost" size="icon" className="rounded-xl" aria-label={t("common.back")}>
							<ArrowRightIcon className="h-5 w-5 rtl:rotate-180" />
						</Button>
					</Link>
					<div>
						<Input
							value={templateName}
							onChange={(e: any) => setTemplateName(e.target.value)}
							placeholder={t(
								"finance.templates.customizer.templateNamePlaceholder",
							)}
							className="w-64 rounded-xl"
						/>
						{presetConfig && !templateId && (
							<p className="text-xs text-muted-foreground mt-1">
								{t("finance.templates.customizer.basedOn", {
									name: presetConfig.nameAr,
								})}
							</p>
						)}
					</div>
					{/* Template Type Selector */}
					{!templateId && (
						<Select
							value={templateType}
							onValueChange={(v: any) => setTemplateType(v as "QUOTATION" | "INVOICE")}
						>
							<SelectTrigger className="w-auto gap-1.5 rounded-xl h-9 text-xs px-3">
								{templateType === "INVOICE" ? (
									<Receipt className="h-3.5 w-3.5" />
								) : (
									<FileSignature className="h-3.5 w-3.5" />
								)}
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="INVOICE">
									<div className="flex items-center gap-2">
										<Receipt className="h-3.5 w-3.5" />
										{t("finance.templates.customizer.documentTypeInvoice")}
									</div>
								</SelectItem>
								<SelectItem value="QUOTATION">
									<div className="flex items-center gap-2">
										<FileSignature className="h-3.5 w-3.5" />
										{t("finance.templates.customizer.documentTypeQuotation")}
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					)}
				</div>

				<Button
					onClick={handleSave}
					disabled={isSaving || !templateName.trim()}
					className="rounded-xl"
				>
					{isSaving ? (
						<Loader2Icon className="h-4 w-4 me-2 animate-spin" />
					) : (
						<SaveIcon className="h-4 w-4 me-2" />
					)}
					{isSaving
						? t("finance.templates.customizer.saving")
						: templateId
							? t("finance.templates.editor.save")
							: t("finance.templates.customizer.saveAsNew")}
				</Button>
			</div>

			{/* ── Main Area: Settings + Preview ────────────────────────────── */}
			<div className="flex flex-1 overflow-hidden">
				{/* ── Settings Panel (Right in RTL) ────────────────────────── */}
				<div className="w-[380px] shrink-0 border-s bg-muted/30 overflow-y-auto p-4 space-y-5">
					{/* ─ Colors ─────────────────────────────────────────────── */}
					<SettingsSection
						icon={<PaletteIcon className="h-4 w-4" />}
						title={t("finance.templates.customizer.colors")}
						defaultOpen
					>
						<div className="space-y-4">
							{/* Primary Color */}
							<div className="space-y-2">
								<Label className="text-xs">
									{t("finance.templates.editor.primaryColor")}
								</Label>
								<div className="flex items-center gap-2">
									<Input
										type="color"
										value={settings.primaryColor}
										onChange={(e: any) =>
											handleUpdateSettings({ primaryColor: e.target.value })
										}
										className="w-10 h-10 p-1 rounded-lg cursor-pointer"
									/>
									<Input
										value={settings.primaryColor}
										onChange={(e: any) =>
											handleUpdateSettings({ primaryColor: e.target.value })
										}
										className="flex-1 text-xs rounded-xl"
									/>
								</div>
								{/* Quick Colors */}
								<div className="flex flex-wrap gap-1.5">
									{TEMPLATE_COLORS.map((color) => (
										<button
											key={color.value}
											type="button"
											onClick={() =>
												handleUpdateSettings({
													primaryColor: color.value,
												})
											}
											className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
												settings.primaryColor === color.value
													? "border-primary ring-2 ring-primary/30"
													: "border-transparent"
											}`}
											style={{ backgroundColor: color.value }}
											title={color.label}
										/>
									))}
								</div>
							</div>

							{/* Background Color */}
							<div className="space-y-2">
								<Label className="text-xs">
									{t("finance.templates.editor.backgroundColor")}
								</Label>
								<div className="flex items-center gap-2">
									<Input
										type="color"
										value={settings.backgroundColor}
										onChange={(e: any) =>
											handleUpdateSettings({
												backgroundColor: e.target.value,
											})
										}
										className="w-10 h-10 p-1 rounded-lg cursor-pointer"
									/>
									<Input
										value={settings.backgroundColor}
										onChange={(e: any) =>
											handleUpdateSettings({
												backgroundColor: e.target.value,
											})
										}
										className="flex-1 text-xs rounded-xl"
									/>
								</div>
							</div>

							{/* Secondary Color */}
							<div className="space-y-2">
								<Label className="text-xs">
									{t("finance.templates.customizer.secondaryColor")}
								</Label>
								<div className="flex items-center gap-2">
									<Input
										type="color"
										value={settings.secondaryColor ?? "#1e293b"}
										onChange={(e: any) =>
											handleUpdateSettings({
												secondaryColor: e.target.value,
											})
										}
										className="w-10 h-10 p-1 rounded-lg cursor-pointer"
									/>
									<Input
										value={settings.secondaryColor ?? "#1e293b"}
										onChange={(e: any) =>
											handleUpdateSettings({
												secondaryColor: e.target.value,
											})
										}
										className="flex-1 text-xs rounded-xl"
									/>
								</div>
							</div>
						</div>
					</SettingsSection>

					{/* ─ Logo ───────────────────────────────────────────────── */}
					<SettingsSection
						icon={<ImageIcon className="h-4 w-4" />}
						title={t("finance.templates.customizer.logo")}
						defaultOpen
					>
						<div className="space-y-4">
							{/* Logo Size */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label className="text-xs">
										{t("finance.templates.customizer.logoSize")}
									</Label>
									<span className="text-xs text-muted-foreground">
										{settings.logoSize ?? 64}px
									</span>
								</div>
								<Slider
									value={[settings.logoSize ?? 64]}
									onValueChange={([v]) =>
										handleUpdateSettings({ logoSize: v })
									}
									min={32}
									max={120}
									step={4}
								/>
								<div className="flex justify-between text-[10px] text-muted-foreground">
									<span>{t("finance.templates.customizer.logoSmall")}</span>
									<span>{t("finance.templates.customizer.logoLarge")}</span>
								</div>
							</div>

							{/* Logo Position */}
							<div className="space-y-1.5">
								<Label className="text-xs">
									{t("finance.templates.editor.settings.logoPosition")}
								</Label>
								<Select
									value={(() => {
										const headerEl = elements.find((el) => el.type === "header");
										return (headerEl?.settings?.logoPosition as string) ?? "top";
									})()}
									onValueChange={(v: any) => {
										const headerEl = elements.find((el) => el.type === "header");
										if (headerEl) {
											handleUpdateElement(headerEl.id, { logoPosition: v });
										}
									}}
								>
									<SelectTrigger className="h-8 text-xs rounded-lg">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										<SelectItem value="top">
											{t("finance.templates.editor.logoPositions.top")}
										</SelectItem>
										<SelectItem value="right">
											{t("finance.templates.editor.logoPositions.right")}
										</SelectItem>
										<SelectItem value="left">
											{t("finance.templates.editor.logoPositions.left")}
										</SelectItem>
										<SelectItem value="center">
											{t("finance.templates.editor.logoPositions.center")}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</SettingsSection>

					{/* ─ Letterhead ────────────────────────────────────────── */}
					<SettingsSection
						icon={<FileIcon className="h-4 w-4" />}
						title={t("finance.templates.customizer.letterhead")}
					>
						<div className="space-y-4">
							{/* Header Image */}
							<div className="space-y-2">
								<Label className="text-xs">{t("finance.templates.customizer.headerImage")}</Label>
								{settings.headerImage ? (
									<div className="relative rounded-lg border overflow-hidden">
										{/* NOTE: <img> used intentionally — print/template context where next/Image optimization doesn't apply */}
										<img src={settings.headerImage} alt="" className="w-full" />
										<Button
											variant="outline"
											size="icon"
											className="absolute top-1 end-1 h-6 w-6 rounded-full bg-background/80"
											onClick={() => handleUpdateSettings({ headerImage: undefined })}
											aria-label={t("finance.templates.customizer.removeHeaderImage")}
										>
											<XIcon className="h-3 w-3" />
										</Button>
									</div>
								) : (
									<Input
										type="file"
										accept="image/*"
										className="h-8 text-xs rounded-lg"
										onChange={handleHeaderUpload}
									/>
								)}
							</div>

							{/* Footer Image */}
							<div className="space-y-2">
								<Label className="text-xs">{t("finance.templates.customizer.footerImage")}</Label>
								{settings.footerImage ? (
									<div className="relative rounded-lg border overflow-hidden">
										{/* NOTE: <img> used intentionally — print/template context where next/Image optimization doesn't apply */}
										<img src={settings.footerImage} alt="" className="w-full" />
										<Button
											variant="outline"
											size="icon"
											className="absolute top-1 end-1 h-6 w-6 rounded-full bg-background/80"
											onClick={() => handleUpdateSettings({ footerImage: undefined })}
											aria-label={t("finance.templates.customizer.removeFooterImage")}
										>
											<XIcon className="h-3 w-3" />
										</Button>
									</div>
								) : (
									<Input
										type="file"
										accept="image/*"
										className="h-8 text-xs rounded-lg"
										onChange={handleFooterUpload}
									/>
								)}
							</div>

							{/* Watermark Toggle */}
							<div className="flex items-center justify-between">
								<Label className="text-xs flex items-center gap-1.5">
									<DropletIcon className="h-3.5 w-3.5" />
									{t("finance.templates.customizer.watermark")}
								</Label>
								<Switch
									checked={settings.showWatermark ?? false}
									onCheckedChange={(checked: any) =>
										handleUpdateSettings({ showWatermark: checked })
									}
									className="scale-75"
								/>
							</div>

							{/* Watermark Opacity */}
							{settings.showWatermark && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label className="text-xs">
											{t("finance.templates.customizer.watermarkOpacity")}
										</Label>
										<span className="text-xs text-muted-foreground">
											{settings.watermarkOpacity ?? 5}%
										</span>
									</div>
									<Slider
										value={[settings.watermarkOpacity ?? 5]}
										onValueChange={([v]) =>
											handleUpdateSettings({ watermarkOpacity: v })
										}
										min={1}
										max={20}
										step={1}
									/>
								</div>
							)}
						</div>
					</SettingsSection>

					{/* ─ Fonts ──────────────────────────────────────────────── */}
					<SettingsSection
						icon={<TypeIcon className="h-4 w-4" />}
						title={t("finance.templates.customizer.fonts")}
					>
						<div className="space-y-3">
							<div className="space-y-2">
								<Label className="text-xs">
									{t("finance.templates.editor.fontFamily")}
								</Label>
								<Select
									value={settings.fontFamily}
									onValueChange={(v: any) =>
										handleUpdateSettings({ fontFamily: v })
									}
								>
									<SelectTrigger className="rounded-xl">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										{fontFamilies.map((f) => (
											<SelectItem key={f.value} value={f.value}>
												{f.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">
									{t("finance.templates.editor.fontSize")}
								</Label>
								<Select
									value={settings.fontSize}
									onValueChange={(v: any) =>
										handleUpdateSettings({ fontSize: v })
									}
								>
									<SelectTrigger className="rounded-xl">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										{fontSizeKeys.map((s) => (
											<SelectItem key={s.value} value={s.value}>
												{t(s.labelKey)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</SettingsSection>

					{/* ─ Document Sections ──────────────────────────────────── */}
					<SettingsSection
						icon={<LayoutListIcon className="h-4 w-4" />}
						title={t("finance.templates.customizer.sections")}
						defaultOpen
					>
						<div className="space-y-1">
							{[...elements]
								.sort((a, b) => a.order - b.order)
								.map((el) => (
									<ElementSettingsRow
										key={el.id}
										element={el}
										isExpanded={expandedElement === el.id}
										onToggleExpand={() =>
											setExpandedElement(
												expandedElement === el.id ? null : el.id,
											)
										}
										onToggleEnabled={() =>
											handleToggleElement(el.id)
										}
										onUpdateSettings={(newSettings) =>
											handleUpdateElement(el.id, newSettings)
										}
										organizationId={organizationId}
										t={t}
									/>
								))}
						</div>
					</SettingsSection>

				</div>

				{/* ── Preview Panel (Left in RTL) ──────────────────────────── */}
				<div className="flex-1 bg-slate-100 dark:bg-slate-900 overflow-auto relative">
					{/* Zoom Controls */}
					<div className="sticky top-3 z-10 flex justify-center">
						<div className="flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-xl border shadow-sm px-2 py-1">
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								onClick={() =>
									setZoom((z) => Math.max(30, z - 10))
								}
								aria-label={t("finance.templates.editor.actions.zoomOut")}
							>
								<ZoomOutIcon className="h-4 w-4" />
							</Button>
							<span className="text-xs font-medium w-10 text-center">
								{zoom}%
							</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								onClick={() =>
									setZoom((z) => Math.min(150, z + 10))
								}
								aria-label={t("finance.templates.editor.actions.zoomIn")}
							>
								<ZoomInIcon className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								onClick={() => setZoom(70)}
							>
								<RotateCcwIcon className="h-3.5 w-3.5" />
							</Button>
						</div>
					</div>

					{/* Rendered Preview */}
					<div className="flex justify-center p-6 pt-2">
						<div
							className="mx-auto"
							style={{
								width: `${794 * (zoom / 100)}px`,
								minHeight: `${1123 * (zoom / 100)}px`,
							}}
						>
							<div
								className="bg-white shadow-xl rounded-sm"
								style={{
									width: "794px",
									minHeight: "1123px",
									transform: `scale(${zoom / 100})`,
									transformOrigin: "top center",
								}}
							>
								<TemplateRenderer
									data={sampleData}
									template={templateConfig}
									organization={organizationData}
									documentType={docType}
									banks={banks}
									interactive={false}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Crop dialogs for letterhead */}
			<CropImageDialog
				image={headerFile}
				open={showHeaderCrop}
				onOpenChange={(open: any) => {
					if (!open) {
						setShowHeaderCrop(false);
						setHeaderFile(null);
					}
				}}
				onCrop={handleHeaderCrop}
				aspectRatio={NaN}
				maxWidth={4096}
				maxHeight={4096}
				outputType="image/jpeg"
				quality={0.85}
				title={t("finance.templates.customizer.cropHeader")}
				saveLabel={t("finance.templates.customizer.cropHeaderSave")}
			/>
			<CropImageDialog
				image={footerFile}
				open={showFooterCrop}
				onOpenChange={(open: any) => {
					if (!open) {
						setShowFooterCrop(false);
						setFooterFile(null);
					}
				}}
				onCrop={handleFooterCrop}
				aspectRatio={NaN}
				maxWidth={4096}
				maxHeight={4096}
				outputType="image/jpeg"
				quality={0.85}
				title={t("finance.templates.customizer.cropFooter")}
				saveLabel={t("finance.templates.customizer.cropFooterSave")}
			/>
		</div>
	);
}

