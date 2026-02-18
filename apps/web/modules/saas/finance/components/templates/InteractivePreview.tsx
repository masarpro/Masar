"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@ui/lib";
import {
	InfoIcon,
	ZoomInIcon,
	ZoomOutIcon,
	RotateCcwIcon,
	ChevronUpIcon,
	ChevronDownIcon,
	ArrowUpIcon,
	ArrowDownIcon,
	Trash2Icon,
	EyeIcon,
	EyeOffIcon,
	GripVerticalIcon,
} from "lucide-react";
import { Button } from "@ui/components/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@ui/components/tooltip";
import { TemplateRenderer } from "./renderer/TemplateRenderer";
import type { TemplateElement } from "./TemplateCanvas";
import type { TemplateSettings } from "./PropertiesPanel";
import type { ElementType } from "./ComponentsPanel";
import type {
	OrganizationData,
	QuotationData,
	InvoiceData,
} from "./renderer/TemplateRenderer";

interface InteractivePreviewProps {
	elements: TemplateElement[];
	settings: TemplateSettings;
	selectedElement: string | null;
	onSelectElement: (id: string | null) => void;
	onDropElement: (elementType: ElementType, targetIndex?: number) => void;
	onMoveElement?: (id: string, direction: "up" | "down") => void;
	onResizeElement?: (id: string, action: "increase" | "decrease") => void;
	onRemoveElement?: (id: string) => void;
	onToggleElement?: (id: string) => void;
	templateType: "quotation" | "invoice" | "letter";
	organization?: OrganizationData;
	sampleData: QuotationData | InvoiceData;
}

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
// Convert to pixels (assuming 96 DPI for screen)
const MM_TO_PX = 3.7795275591;
const A4_WIDTH_PX = A4_WIDTH_MM * MM_TO_PX;
const A4_HEIGHT_PX = A4_HEIGHT_MM * MM_TO_PX;

export function InteractivePreview({
	elements,
	settings,
	selectedElement,
	onSelectElement,
	onDropElement,
	onMoveElement,
	onResizeElement,
	onRemoveElement,
	onToggleElement,
	templateType,
	organization,
	sampleData,
}: InteractivePreviewProps) {
	const t = useTranslations();
	const [isDragOver, setIsDragOver] = useState(false);
	const [scale, setScale] = useState(0.6); // Default zoom level

	// Get selected element data and position info
	const selectedElementData = useMemo(() => {
		if (!selectedElement) return null;
		const sortedElements = [...elements].sort((a, b) => a.order - b.order);
		const index = sortedElements.findIndex((el) => el.id === selectedElement);
		const element = sortedElements[index];
		if (!element) return null;
		return {
			element,
			index,
			isFirst: index === 0,
			isLast: index === sortedElements.length - 1,
			total: sortedElements.length,
		};
	}, [selectedElement, elements]);

	const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			setIsDragOver(false);

			const elementType = e.dataTransfer.getData("elementType") as ElementType;
			if (elementType) {
				onDropElement(elementType);
			}
		},
		[onDropElement]
	);

	const handleElementClick = useCallback(
		(elementId: string | null) => {
			onSelectElement(elementId);
		},
		[onSelectElement]
	);

	const handleBackgroundClick = useCallback(() => {
		onSelectElement(null);
	}, [onSelectElement]);

	const handleZoomIn = useCallback(() => {
		setScale((prev) => Math.min(prev + 0.1, 1.5));
	}, []);

	const handleZoomOut = useCallback(() => {
		setScale((prev) => Math.max(prev - 0.1, 0.3));
	}, []);

	const handleResetZoom = useCallback(() => {
		setScale(0.6);
	}, []);

	// Prepare template config for renderer
	const templateConfig = {
		elements,
		settings: {
			backgroundColor: settings.backgroundColor,
			primaryColor: settings.primaryColor,
			fontFamily: settings.fontFamily,
			fontSize: settings.fontSize,
			vatPercent: settings.vatPercent,
			currency: settings.currency,
		},
	};

	const sortedElements = [...elements].sort((a, b) => a.order - b.order);
	const hasElements = sortedElements.length > 0;

	return (
		<div className="flex-1 bg-slate-100 dark:bg-slate-900 flex flex-col overflow-hidden">
			{/* Toolbar */}
			<div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-950 border-b">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-slate-600 dark:text-slate-400">
						{t("finance.templates.editor.livePreview")}
					</span>
					<span className="text-xs text-slate-400">
						A4 ({A4_WIDTH_MM}mm × {A4_HEIGHT_MM}mm)
					</span>
				</div>

				{/* Zoom Controls */}
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={handleZoomOut}
						disabled={scale <= 0.3}
					>
						<ZoomOutIcon className="h-4 w-4" />
					</Button>
					<span className="text-xs text-slate-500 w-12 text-center">
						{Math.round(scale * 100)}%
					</span>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={handleZoomIn}
						disabled={scale >= 1.5}
					>
						<ZoomInIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={handleResetZoom}
					>
						<RotateCcwIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Company Data Notice */}
			<div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900">
				<div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
					<InfoIcon className="h-3.5 w-3.5 flex-shrink-0" />
					<span>
						{t("finance.templates.editor.companyDataNotice")}
					</span>
				</div>
			</div>

			{/* Floating Element Toolbar */}
			{selectedElementData && (
				<TooltipProvider delayDuration={300}>
					<div className="px-4 py-2 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-primary/20">
						<div className="flex items-center justify-between">
							{/* Element Info */}
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-2">
									<GripVerticalIcon className="h-4 w-4 text-primary/60" />
									<span className="text-sm font-medium text-primary">
										{t(`finance.templates.editor.elementTypes.${selectedElementData.element.type}`)}
									</span>
								</div>
								<span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
									{selectedElementData.index + 1} / {selectedElementData.total}
								</span>
								{!selectedElementData.element.enabled && (
									<span className="text-xs text-orange-600 bg-orange-100 dark:bg-orange-950 px-2 py-0.5 rounded-full">
										{t("common.hidden")}
									</span>
								)}
							</div>

							{/* Actions */}
							<div className="flex items-center gap-1">
								{/* Move Controls */}
								<div className="flex items-center gap-0.5 border-e pe-2 me-1">
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-primary hover:bg-primary/20"
												onClick={() => onMoveElement?.(selectedElementData.element.id, "up")}
												disabled={selectedElementData.isFirst}
											>
												<ArrowUpIcon className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent side="bottom">
											{t("finance.templates.editor.actions.moveUp")}
										</TooltipContent>
									</Tooltip>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-primary hover:bg-primary/20"
												onClick={() => onMoveElement?.(selectedElementData.element.id, "down")}
												disabled={selectedElementData.isLast}
											>
												<ArrowDownIcon className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent side="bottom">
											{t("finance.templates.editor.actions.moveDown")}
										</TooltipContent>
									</Tooltip>
								</div>

								{/* Height Controls */}
								<div className="flex items-center gap-0.5 border-e pe-2 me-1">
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950"
												onClick={() => onResizeElement?.(selectedElementData.element.id, "increase")}
											>
												<ChevronUpIcon className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent side="bottom">
											{t("finance.templates.editor.actions.increaseHeight")}
										</TooltipContent>
									</Tooltip>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950"
												onClick={() => onResizeElement?.(selectedElementData.element.id, "decrease")}
												disabled={((selectedElementData.element.settings.minHeight as number) || 0) <= 0}
											>
												<ChevronDownIcon className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent side="bottom">
											{t("finance.templates.editor.actions.decreaseHeight")}
										</TooltipContent>
									</Tooltip>
									{((selectedElementData.element.settings.minHeight as number) || 0) > 0 && (
										<span className="text-xs text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded ms-1">
											+{selectedElementData.element.settings.minHeight as number}px
										</span>
									)}
								</div>

								{/* Toggle Visibility */}
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className={cn(
												"h-8 w-8",
												selectedElementData.element.enabled
													? "text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-950"
													: "text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-950"
											)}
											onClick={() => onToggleElement?.(selectedElementData.element.id)}
										>
											{selectedElementData.element.enabled ? (
												<EyeIcon className="h-4 w-4" />
											) : (
												<EyeOffIcon className="h-4 w-4" />
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">
										{selectedElementData.element.enabled
											? t("finance.templates.editor.actions.hide")
											: t("finance.templates.editor.actions.show")}
									</TooltipContent>
								</Tooltip>

								{/* Delete */}
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-destructive hover:bg-destructive/10"
											onClick={() => {
												onRemoveElement?.(selectedElementData.element.id);
												onSelectElement(null);
											}}
										>
											<Trash2Icon className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">
										{t("finance.templates.editor.actions.delete")}
									</TooltipContent>
								</Tooltip>
							</div>
						</div>
					</div>
				</TooltipProvider>
			)}

			{/* Preview Container */}
			<div className="flex-1 overflow-auto p-6">
				<div
					className="mx-auto"
					style={{
						width: A4_WIDTH_PX * scale,
						minHeight: A4_HEIGHT_PX * scale,
					}}
				>
					{/* A4 Paper */}
					<div
						className={cn(
							"bg-white shadow-2xl transition-all origin-top-left",
							isDragOver && "ring-2 ring-primary ring-offset-2"
						)}
						style={{
							width: A4_WIDTH_PX,
							minHeight: A4_HEIGHT_PX,
							transform: `scale(${scale})`,
							transformOrigin: "top left",
						}}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
					>
						{!hasElements ? (
							/* Empty State */
							<div
								className={cn(
									"flex flex-col items-center justify-center py-20 mx-8 my-8 border-2 border-dashed rounded-xl transition-colors",
									isDragOver
										? "border-primary bg-primary/5"
										: "border-slate-200"
								)}
							>
								<div className="text-center space-y-2">
									<div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
										<svg
											className="h-8 w-8 text-slate-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={1.5}
												d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
											/>
										</svg>
									</div>
									<p className="text-sm text-slate-500">
										{t("finance.templates.editor.dropHint")}
									</p>
									<p className="text-xs text-slate-400">
										{t("finance.templates.editor.dropHintSecondary")}
									</p>
								</div>
							</div>
						) : (
							/* Live Preview - Actual A4 Size */
							<div
								onClick={handleBackgroundClick}
								style={{
									backgroundColor: settings.backgroundColor || "#ffffff",
								}}
							>
								<TemplateRenderer
									data={sampleData}
									template={templateConfig}
									organization={organization}
									documentType={templateType === "letter" ? "quotation" : templateType}
									interactive={true}
									selectedElementId={selectedElement}
									onElementClick={handleElementClick}
								/>
							</div>
						)}

						{/* Bottom Drop Zone */}
						{hasElements && (
							<div
								className={cn(
									"mx-8 mb-8 py-6 border-2 border-dashed rounded-xl transition-colors text-center",
									isDragOver
										? "border-primary bg-primary/5"
										: "border-slate-200"
								)}
							>
								<p className="text-sm text-slate-400">
									{t("finance.templates.editor.dropHereToAdd")}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
