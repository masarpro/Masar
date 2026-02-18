"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
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
} from "lucide-react";
import { cn } from "@ui/lib";

export type ElementType =
	| "header"
	| "clientInfo"
	| "itemsTable"
	| "totals"
	| "terms"
	| "signature"
	| "qrCode"
	| "footer"
	| "text"
	| "image"
	| "timeline"
	| "gallery"
	| "paymentSchedule"
	| "bankDetails";

interface ComponentDefinition {
	id: ElementType;
	icon: React.ComponentType<{ className?: string }>;
	category: "basic" | "advanced";
}

const components: ComponentDefinition[] = [
	// Basic components
	{ id: "header", icon: Building2Icon, category: "basic" },
	{ id: "clientInfo", icon: FileTextIcon, category: "basic" },
	{ id: "text", icon: TypeIcon, category: "basic" },
	{ id: "itemsTable", icon: TableIcon, category: "basic" },
	{ id: "totals", icon: CalculatorIcon, category: "basic" },
	{ id: "terms", icon: ScrollTextIcon, category: "basic" },
	{ id: "signature", icon: PenToolIcon, category: "basic" },
	{ id: "footer", icon: FootprintsIcon, category: "basic" },
	// Advanced components
	{ id: "timeline", icon: CalendarIcon, category: "advanced" },
	{ id: "gallery", icon: GalleryHorizontalEndIcon, category: "advanced" },
	{ id: "paymentSchedule", icon: CreditCardIcon, category: "advanced" },
	{ id: "qrCode", icon: QrCodeIcon, category: "advanced" },
	{ id: "image", icon: ImageIcon, category: "advanced" },
	{ id: "bankDetails", icon: LandmarkIcon, category: "advanced" },
];

interface ComponentsPanelProps {
	onDragStart: (elementType: ElementType) => void;
	onAddElement: (elementType: ElementType) => void;
}

export function ComponentsPanel({
	onDragStart,
	onAddElement,
}: ComponentsPanelProps) {
	const t = useTranslations();

	const basicComponents = components.filter((c) => c.category === "basic");
	const advancedComponents = components.filter((c) => c.category === "advanced");

	const handleDragStart = (
		e: React.DragEvent<HTMLDivElement>,
		elementType: ElementType,
	) => {
		e.dataTransfer.setData("elementType", elementType);
		e.dataTransfer.effectAllowed = "copy";
		onDragStart(elementType);
	};

	return (
		<div className="w-[240px] border-e bg-muted/30 p-4 overflow-y-auto">
			<Card className="rounded-2xl border-0 shadow-none bg-transparent">
				<CardHeader className="px-0 pt-0">
					<CardTitle className="text-base">
						{t("finance.templates.editor.components")}
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						{t("finance.templates.editor.dragHint")}
					</p>
				</CardHeader>
				<CardContent className="px-0 space-y-6">
					{/* Basic Components */}
					<div className="space-y-3">
						<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							{t("finance.templates.editor.basicComponents")}
						</h3>
						<div className="flex flex-col gap-2">
							{basicComponents.map((component) => {
								const Icon = component.icon;
								return (
									<div
										key={component.id}
										draggable
										onDragStart={(e) => handleDragStart(e, component.id)}
										onClick={() => onAddElement(component.id)}
										className={cn(
											"flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-muted",
											"bg-background hover:bg-muted/50 hover:border-primary/50",
											"cursor-grab active:cursor-grabbing transition-all duration-200",
											"group",
										)}
									>
										<div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
											<Icon className="h-5 w-5" />
										</div>
										<span className="text-sm font-medium">
											{t(`finance.templates.editor.elementTypes.${component.id}`)}
										</span>
									</div>
								);
							})}
						</div>
					</div>

					{/* Advanced Components */}
					<div className="space-y-3">
						<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							{t("finance.templates.editor.advancedComponents")}
						</h3>
						<div className="flex flex-col gap-2">
							{advancedComponents.map((component) => {
								const Icon = component.icon;
								return (
									<div
										key={component.id}
										draggable
										onDragStart={(e) => handleDragStart(e, component.id)}
										onClick={() => onAddElement(component.id)}
										className={cn(
											"flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-muted",
											"bg-background hover:bg-muted/50 hover:border-purple-500/50",
											"cursor-grab active:cursor-grabbing transition-all duration-200",
											"group",
										)}
									>
										<div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
											<Icon className="h-5 w-5" />
										</div>
										<span className="text-sm font-medium">
											{t(`finance.templates.editor.elementTypes.${component.id}`)}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
