"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@ui/lib";
import { Button } from "@ui/components/button";
import {
	Building2Icon,
	FileTextIcon,
	TableIcon,
	CalculatorIcon,
	ScrollTextIcon,
	PenToolIcon,
	QrCodeIcon,
	FootprintsIcon,
	TypeIcon,
	ImageIcon,
	CalendarIcon,
	CreditCardIcon,
	GalleryHorizontalEndIcon,
	LandmarkIcon,
	GripVerticalIcon,
	ChevronUpIcon,
	ChevronDownIcon,
	Trash2Icon,
	EyeIcon,
	EyeOffIcon,
} from "lucide-react";
import type { ElementType } from "./ComponentsPanel";

export interface TemplateElement {
	id: string;
	type: ElementType;
	enabled: boolean;
	order: number;
	settings: Record<string, unknown>;
}

interface TemplateCanvasProps {
	elements: TemplateElement[];
	selectedElement: string | null;
	onSelectElement: (id: string | null) => void;
	onMoveElement: (id: string, direction: "up" | "down") => void;
	onToggleElement: (id: string) => void;
	onRemoveElement: (id: string) => void;
	onDropElement: (elementType: ElementType, targetIndex?: number) => void;
	templateSettings: {
		backgroundColor: string;
		primaryColor: string;
		fontFamily: string;
	};
}

const elementIcons: Record<ElementType, React.ComponentType<{ className?: string }>> = {
	header: Building2Icon,
	clientInfo: FileTextIcon,
	itemsTable: TableIcon,
	totals: CalculatorIcon,
	terms: ScrollTextIcon,
	signature: PenToolIcon,
	qrCode: QrCodeIcon,
	footer: FootprintsIcon,
	text: TypeIcon,
	image: ImageIcon,
	timeline: CalendarIcon,
	gallery: GalleryHorizontalEndIcon,
	paymentSchedule: CreditCardIcon,
	bankDetails: LandmarkIcon,
};

export function TemplateCanvas({
	elements,
	selectedElement,
	onSelectElement,
	onMoveElement,
	onToggleElement,
	onRemoveElement,
	onDropElement,
	templateSettings,
}: TemplateCanvasProps) {
	const t = useTranslations();
	const [isDragOver, setIsDragOver] = useState(false);
	const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

	const sortedElements = [...elements].sort((a, b) => a.order - b.order);

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
		setIsDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(false);
		setDropTargetIndex(null);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(false);
		setDropTargetIndex(null);

		const elementType = e.dataTransfer.getData("elementType") as ElementType;
		if (elementType) {
			onDropElement(elementType, dropTargetIndex ?? undefined);
		}
	};

	const handleElementDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
		e.preventDefault();
		e.stopPropagation();
		setDropTargetIndex(index);
	};

	return (
		<div className="flex-1 bg-slate-100 dark:bg-slate-900 p-6 overflow-auto">
			<div className="max-w-[210mm] mx-auto">
				{/* A4 Paper Canvas */}
				<div
					className={cn(
						"bg-white dark:bg-slate-950 shadow-xl rounded-lg min-h-[297mm] p-8 transition-all",
						isDragOver && "ring-2 ring-primary ring-offset-2",
					)}
					style={{
						backgroundColor: templateSettings.backgroundColor || "#ffffff",
						fontFamily: templateSettings.fontFamily || "inherit",
					}}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
				>
					{/* Canvas Header */}
					<div className="flex items-center justify-between mb-6 pb-4 border-b border-dashed border-slate-200 dark:border-slate-700">
						<h3 className="text-sm font-medium text-slate-500">
							{t("finance.templates.editor.canvasTitle")}
						</h3>
						<span className="text-xs text-slate-400">A4 (210mm × 297mm)</span>
					</div>

					{/* Elements List */}
					<div className="space-y-3">
						{sortedElements.length === 0 ? (
							<div
								className={cn(
									"flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl transition-colors",
									isDragOver
										? "border-primary bg-primary/5"
										: "border-slate-200 dark:border-slate-700",
								)}
							>
								<div className="text-center space-y-2">
									<div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
										<TableIcon className="h-8 w-8 text-slate-400" />
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
							sortedElements.map((element, index) => {
								const Icon = elementIcons[element.type];
								const isSelected = selectedElement === element.id;
								const isDropTarget = dropTargetIndex === index;

								return (
									<div key={element.id}>
										{/* Drop zone indicator */}
										{isDropTarget && (
											<div className="h-1 bg-primary rounded-full mb-2 animate-pulse" />
										)}

										<div
											className={cn(
												"group relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
												element.enabled
													? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
													: "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-50",
												isSelected && "ring-2 ring-primary border-primary",
											)}
											onClick={() => onSelectElement(element.id)}
											onDragOver={(e) => handleElementDragOver(e, index)}
										>
											{/* Drag Handle */}
											<div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
												<GripVerticalIcon className="h-5 w-5" />
											</div>

											{/* Icon */}
											<div
												className={cn(
													"p-2 rounded-lg",
													element.enabled
														? "bg-primary/10 text-primary"
														: "bg-slate-200 dark:bg-slate-700 text-slate-400",
												)}
											>
												<Icon className="h-5 w-5" />
											</div>

											{/* Element Info */}
											<div className="flex-1">
												<p
													className={cn(
														"font-medium",
														element.enabled
															? "text-slate-900 dark:text-slate-100"
															: "text-slate-500",
													)}
												>
													{t(`finance.templates.editor.elementTypes.${element.type}`)}
												</p>
												<p className="text-xs text-slate-400">
													{t(`finance.templates.editor.elementDescriptions.${element.type}`)}
												</p>
											</div>

											{/* Actions */}
											<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={(e) => {
														e.stopPropagation();
														onMoveElement(element.id, "up");
													}}
													disabled={index === 0}
												>
													<ChevronUpIcon className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={(e) => {
														e.stopPropagation();
														onMoveElement(element.id, "down");
													}}
													disabled={index === sortedElements.length - 1}
												>
													<ChevronDownIcon className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={(e) => {
														e.stopPropagation();
														onToggleElement(element.id);
													}}
												>
													{element.enabled ? (
														<EyeIcon className="h-4 w-4" />
													) : (
														<EyeOffIcon className="h-4 w-4" />
													)}
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-destructive hover:text-destructive"
													onClick={(e) => {
														e.stopPropagation();
														onRemoveElement(element.id);
													}}
												>
													<Trash2Icon className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>
								);
							})
						)}
					</div>

					{/* Bottom Drop Zone */}
					{sortedElements.length > 0 && (
						<div
							className={cn(
								"mt-4 py-6 border-2 border-dashed rounded-xl transition-colors text-center",
								isDragOver
									? "border-primary bg-primary/5"
									: "border-slate-200 dark:border-slate-700",
							)}
							onDragOver={(e) => {
								e.preventDefault();
								setDropTargetIndex(sortedElements.length);
							}}
						>
							<p className="text-sm text-slate-400">
								{t("finance.templates.editor.dropHereToAdd")}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
