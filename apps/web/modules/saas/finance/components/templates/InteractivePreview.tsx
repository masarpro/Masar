"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@ui/lib";
import { InfoIcon, ZoomInIcon, ZoomOutIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@ui/components/button";
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
	templateType,
	organization,
	sampleData,
}: InteractivePreviewProps) {
	const t = useTranslations();
	const [isDragOver, setIsDragOver] = useState(false);
	const [scale, setScale] = useState(0.6); // Default zoom level

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
