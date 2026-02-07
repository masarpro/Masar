"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient, skipToken } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	EyeIcon,
	SaveIcon,
	ArrowLeftIcon,
	Undo2Icon,
	Redo2Icon,
	Loader2Icon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ComponentsPanel, type ElementType } from "./ComponentsPanel";
import { type TemplateElement } from "./TemplateCanvas";
import { InteractivePreview } from "./InteractivePreview";
import { PropertiesPanel, type TemplateSettings } from "./PropertiesPanel";
import {
	getQuotationElements,
	getInvoiceElements,
	DEFAULT_TEMPLATE_SETTINGS,
} from "../../lib/default-templates";
import { getSampleData } from "../../lib/sample-preview-data";
import type { OrganizationData } from "./renderer/TemplateRenderer";

interface TemplateEditorProps {
	organizationId: string;
	organizationSlug: string;
	templateId?: string;
}

const defaultElements: TemplateElement[] = [
	{
		id: "1",
		type: "header",
		enabled: true,
		order: 1,
		settings: {
			showLogo: true,
			showCompanyName: true,
			showAddress: true,
			showBilingualName: true,
			layout: "modern",
		},
	},
	{
		id: "2",
		type: "clientInfo",
		enabled: true,
		order: 2,
		settings: {
			showTaxNumber: true,
			showEmail: true,
			showPhone: true,
			showCompanyName: true,
		},
	},
	{
		id: "3",
		type: "itemsTable",
		enabled: true,
		order: 3,
		settings: {
			showQuantity: true,
			showUnit: true,
			showUnitPrice: true,
			showRowNumbers: true,
			alternatingColors: true,
		},
	},
	{
		id: "4",
		type: "totals",
		enabled: true,
		order: 4,
		settings: {
			showDiscount: true,
			showVat: true,
			showAmountInWords: true,
			highlightTotal: true,
		},
	},
	{
		id: "5",
		type: "terms",
		enabled: true,
		order: 5,
		settings: {
			showPaymentTerms: true,
			showDeliveryTerms: true,
			showWarrantyTerms: true,
			showValidityNote: true,
			validityDays: 30,
		},
	},
	{
		id: "6",
		type: "signature",
		enabled: true,
		order: 6,
		settings: {
			showDate: true,
			showStampArea: true,
			twoColumns: true,
		},
	},
	{
		id: "7",
		type: "bankDetails",
		enabled: true,
		order: 7,
		settings: {
			showBankName: true,
			showIban: true,
			showAccountName: true,
			showSwiftCode: false,
		},
	},
	{
		id: "8",
		type: "qrCode",
		enabled: true,
		order: 8,
		settings: {
			size: "medium",
			showZatcaCompliance: true,
		},
	},
	{
		id: "9",
		type: "footer",
		enabled: true,
		order: 9,
		settings: {
			showThankYouMessage: true,
			showYear: true,
		},
	},
];

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

export function TemplateEditor({
	organizationId,
	organizationSlug,
	templateId,
}: TemplateEditorProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/finance`;

	// Template state
	const [templateName, setTemplateName] = useState("");
	const [templateType, setTemplateType] = useState<"quotation" | "invoice" | "letter">("quotation");
	const [elements, setElements] = useState<TemplateElement[]>(defaultElements);
	const [settings, setSettings] = useState<TemplateSettings>(defaultSettings);
	const [selectedElement, setSelectedElement] = useState<string | null>(null);

	// History for undo/redo
	const [history, setHistory] = useState<TemplateElement[][]>([defaultElements]);
	const [historyIndex, setHistoryIndex] = useState(0);

	// Fetch existing template data when editing
	const { data: existingTemplate, isLoading: isLoadingTemplate } = useQuery(
		orpc.finance.templates.getById.queryOptions({
			input: templateId
				? { organizationId, id: templateId }
				: skipToken,
		}),
	);

	// Fetch organization finance settings for preview
	const { data: orgSettings } = useQuery(
		orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
	);

	// Prepare organization data for preview
	const organizationData: OrganizationData = {
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
		thankYouMessage: orgSettings?.thankYouMessage ?? undefined,
	};

	// Get sample data for preview
	const sampleData = getSampleData(templateType, settings);

	// Initialize state from loaded template
	useEffect(() => {
		if (existingTemplate && templateId) {
			setTemplateName(existingTemplate.name);
			const type = existingTemplate.templateType.toLowerCase() as "quotation" | "invoice" | "letter";
			setTemplateType(type);

			const content = existingTemplate.content as { elements?: TemplateElement[] } | null;

			// تحديد العناصر المناسبة
			let elementsToUse: TemplateElement[];
			if (content?.elements && Array.isArray(content.elements) && content.elements.length > 0) {
				elementsToUse = content.elements;
			} else {
				// تحميل العناصر الافتراضية بناءً على نوع القالب
				if (type === "quotation") {
					elementsToUse = getQuotationElements();
				} else if (type === "invoice") {
					elementsToUse = getInvoiceElements();
				} else {
					elementsToUse = defaultElements; // للرسائل
				}
			}

			setElements(elementsToUse);
			setHistory([elementsToUse]);
			setHistoryIndex(0);

			// تحميل الإعدادات
			const settings = existingTemplate.settings as Partial<TemplateSettings> | null;
			if (settings && Object.keys(settings).length > 0) {
				setSettings({ ...defaultSettings, ...settings });
			}
		}
	}, [existingTemplate, templateId]);

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.templates.create({
				organizationId,
				name: templateName,
				templateType: templateType.toUpperCase() as "QUOTATION" | "INVOICE" | "LETTER",
				content: { elements },
				settings,
			});
		},
		onSuccess: (data) => {
			toast.success(t("finance.templates.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "templates"] });
			router.push(`${basePath}/templates/${data.id}`);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("finance.templates.createError"));
		},
	});

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.templates.update({
				organizationId,
				id: templateId!,
				name: templateName,
				content: { elements },
				settings,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.templates.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "templates"] });
		},
		onError: (error: Error) => {
			toast.error(error.message || t("finance.templates.updateError"));
		},
	});

	const addToHistory = useCallback((newElements: TemplateElement[]) => {
		const newHistory = history.slice(0, historyIndex + 1);
		newHistory.push(newElements);
		setHistory(newHistory);
		setHistoryIndex(newHistory.length - 1);
	}, [history, historyIndex]);

	const undo = useCallback(() => {
		if (historyIndex > 0) {
			setHistoryIndex(historyIndex - 1);
			setElements(history[historyIndex - 1]);
		}
	}, [history, historyIndex]);

	const redo = useCallback(() => {
		if (historyIndex < history.length - 1) {
			setHistoryIndex(historyIndex + 1);
			setElements(history[historyIndex + 1]);
		}
	}, [history, historyIndex]);

	// Element operations
	const handleDragStart = useCallback((_elementType: ElementType) => {
		// Drag started - could add visual feedback here
	}, []);

	const handleAddElement = useCallback((elementType: ElementType) => {
		const maxOrder = Math.max(...elements.map((el) => el.order), 0);
		const newElement: TemplateElement = {
			id: `element-${Date.now()}`,
			type: elementType,
			enabled: true,
			order: maxOrder + 1,
			settings: {},
		};
		const newElements = [...elements, newElement];
		setElements(newElements);
		addToHistory(newElements);
		setSelectedElement(newElement.id);
	}, [elements, addToHistory]);

	const handleDropElement = useCallback((elementType: ElementType, targetIndex?: number) => {
		const sortedElements = [...elements].sort((a, b) => a.order - b.order);

		const newElement: TemplateElement = {
			id: `element-${Date.now()}`,
			type: elementType,
			enabled: true,
			order: targetIndex !== undefined ? targetIndex + 0.5 : sortedElements.length + 1,
			settings: {},
		};

		// Reorder elements
		const newElements = [...sortedElements, newElement]
			.sort((a, b) => a.order - b.order)
			.map((el, index) => ({ ...el, order: index + 1 }));

		setElements(newElements);
		addToHistory(newElements);
		setSelectedElement(newElement.id);
	}, [elements, addToHistory]);

	const handleMoveElement = useCallback((id: string, direction: "up" | "down") => {
		const sortedElements = [...elements].sort((a, b) => a.order - b.order);
		const index = sortedElements.findIndex((el) => el.id === id);

		if (
			(direction === "up" && index === 0) ||
			(direction === "down" && index === sortedElements.length - 1)
		) {
			return;
		}

		const swapIndex = direction === "up" ? index - 1 : index + 1;
		const temp = sortedElements[index].order;
		sortedElements[index] = { ...sortedElements[index], order: sortedElements[swapIndex].order };
		sortedElements[swapIndex] = { ...sortedElements[swapIndex], order: temp };

		const newElements = sortedElements.sort((a, b) => a.order - b.order);
		setElements(newElements);
		addToHistory(newElements);
	}, [elements, addToHistory]);

	const handleToggleElement = useCallback((id: string) => {
		const newElements = elements.map((el) =>
			el.id === id ? { ...el, enabled: !el.enabled } : el
		);
		setElements(newElements);
		addToHistory(newElements);
	}, [elements, addToHistory]);

	const handleRemoveElement = useCallback((id: string) => {
		const newElements = elements.filter((el) => el.id !== id);
		setElements(newElements);
		addToHistory(newElements);
		if (selectedElement === id) {
			setSelectedElement(null);
		}
	}, [elements, selectedElement, addToHistory]);

	const handleUpdateElement = useCallback((id: string, newSettings: Record<string, unknown>) => {
		const newElements = elements.map((el) =>
			el.id === id ? { ...el, settings: { ...el.settings, ...newSettings } } : el
		);
		setElements(newElements);
		addToHistory(newElements);
	}, [elements, addToHistory]);

	const handleUpdateSettings = useCallback((newSettings: Partial<TemplateSettings>) => {
		setSettings((prev) => ({ ...prev, ...newSettings }));
	}, []);

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

	const selectedElementData = selectedElement
		? elements.find((el) => el.id === selectedElement) ?? null
		: null;

	// Show loading state when fetching existing template
	if (templateId && isLoadingTemplate) {
		return (
			<div className="h-[calc(100vh-4rem)] flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
					<p className="text-muted-foreground">{t("common.loading")}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-[calc(100vh-4rem)] flex flex-col">
			{/* Toolbar */}
			<div className="border-b bg-background px-4 py-3 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link href={`${basePath}/templates`}>
						<Button variant="ghost" size="icon">
							<ArrowLeftIcon className="h-5 w-5" />
						</Button>
					</Link>
					<div className="flex items-center gap-3">
						<Input
							value={templateName}
							onChange={(e) => setTemplateName(e.target.value)}
							placeholder={t("finance.templates.editor.templateNamePlaceholder")}
							className="w-64"
						/>
						<Select
							value={templateType}
							onValueChange={(v) => setTemplateType(v as typeof templateType)}
						>
							<SelectTrigger className="w-40">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="quotation">
									{t("finance.templates.types.quotation")}
								</SelectItem>
								<SelectItem value="invoice">
									{t("finance.templates.types.invoice")}
								</SelectItem>
								<SelectItem value="letter">
									{t("finance.templates.types.letter")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1 border-e pe-2 me-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={undo}
							disabled={historyIndex === 0}
						>
							<Undo2Icon className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={redo}
							disabled={historyIndex === history.length - 1}
						>
							<Redo2Icon className="h-4 w-4" />
						</Button>
					</div>
					<Button variant="outline" asChild>
						<Link href={`${basePath}/templates/${templateId || "new"}/preview`}>
							<EyeIcon className="h-4 w-4 me-2" />
							{t("finance.templates.editor.preview")}
						</Link>
					</Button>
					<Button onClick={handleSave} disabled={isSaving || !templateName}>
						<SaveIcon className="h-4 w-4 me-2" />
						{isSaving
							? t("common.saving")
							: t("finance.templates.editor.save")}
					</Button>
				</div>
			</div>

			{/* Main Editor Area */}
			<div className="flex flex-1 overflow-hidden">
				{/* Components Panel (Left) */}
				<ComponentsPanel
					onDragStart={handleDragStart}
					onAddElement={handleAddElement}
				/>

				{/* Interactive Preview (Center) */}
				<InteractivePreview
					elements={elements}
					settings={settings}
					selectedElement={selectedElement}
					onSelectElement={setSelectedElement}
					onDropElement={handleDropElement}
					templateType={templateType}
					organization={organizationData}
					sampleData={sampleData}
				/>

				{/* Properties Panel (Right) */}
				<PropertiesPanel
					selectedElement={selectedElementData}
					templateSettings={settings}
					onUpdateElement={handleUpdateElement}
					onUpdateSettings={handleUpdateSettings}
					onToggleElement={handleToggleElement}
				/>
			</div>
		</div>
	);
}
