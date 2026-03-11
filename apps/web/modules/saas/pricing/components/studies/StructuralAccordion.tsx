"use client";

import { useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@ui/components/accordion";
import { Badge } from "@ui/components/badge";
import { Check, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@ui/lib";
import { formatNumber } from "../../lib/utils";

import {
	PlainConcreteSection,
	FoundationsSection,
	ColumnsSection,
	BeamsSection,
	SlabsSection,
	BlocksSection,
	StairsSection,
} from "./sections";

interface StructuralItem {
	id: string;
	category: string;
	name: string;
	quantity: number;
	dimensions: Record<string, number>;
	concreteVolume: number;
	steelWeight: number;
	totalCost: number;
	subCategory?: string | null;
}

interface StructuralAccordionProps {
	studyId: string;
	organizationId: string;
	items: StructuralItem[];
	onUpdate: () => void;
}

export function StructuralAccordion({
	studyId,
	organizationId,
	items,
	onUpdate,
}: StructuralAccordionProps) {
	const t = useTranslations();

	const sections = [
		{
			id: "plainConcrete",
			title: t("pricing.studies.structural.plainConcrete"),
			icon: "🧱",
			component: PlainConcreteSection,
		},
		{
			id: "foundations",
			title: t("pricing.studies.structural.reinforcedFoundations"),
			icon: "🏗️",
			component: FoundationsSection,
		},
		{
			id: "beams",
			title: t("pricing.studies.structural.beams"),
			icon: "📏",
			component: BeamsSection,
		},
		{
			id: "columns",
			title: t("pricing.studies.structural.columns"),
			icon: "🏛️",
			component: ColumnsSection,
		},
		{
			id: "slabs",
			title: t("pricing.studies.structural.slabs"),
			icon: "⬛",
			component: SlabsSection,
		},
		{
			id: "blocks",
			title: t("pricing.studies.structural.blocks"),
			icon: "🧱",
			component: BlocksSection,
		},
		{
			id: "stairs",
			title: t("pricing.studies.structural.stairs"),
			icon: "🪜",
			component: StairsSection,
		},
	];

	// First section open by default
	const [openItems, setOpenItems] = useState<string[]>([sections[0].id]);
	const [savedSections, setSavedSections] = useState<string[]>([]);

	const getItemsByCategory = (category: string) =>
		items.filter((item) => item.category === category);

	const handleSave = (sectionId: string) => {
		if (!savedSections.includes(sectionId)) {
			setSavedSections((prev) => [...prev, sectionId]);
		}
		onUpdate();
	};

	return (
		<Accordion
			type="multiple"
			value={openItems}
			onValueChange={setOpenItems}
			className="space-y-3"
		>
			{sections.map((section) => {
				const SectionComponent = section.component;
				const sectionItems = getItemsByCategory(section.id);
				const isSaved = savedSections.includes(section.id);
				const hasItems = sectionItems.length > 0;

				// Calculate totals per section
				const sectionConcrete = sectionItems.reduce(
					(sum, item) => sum + item.concreteVolume,
					0,
				);
				const sectionSteel = sectionItems.reduce(
					(sum, item) => sum + item.steelWeight,
					0,
				);

				return (
					<AccordionItem
						key={section.id}
						value={section.id}
						className={cn(
							"border rounded-lg px-4 transition-all duration-200",
							isSaved &&
								"border-green-500/50 bg-green-50/30 dark:bg-green-950/20",
							hasItems &&
								!isSaved &&
								"border-blue-200/50 bg-blue-50/30 dark:bg-blue-950/20",
							!hasItems && !isSaved && "border-border",
						)}
					>
						<AccordionTrigger className="hover:no-underline py-4">
							<div className="flex items-center justify-between w-full ml-4">
								<div className="flex items-center gap-3">
									<span className="text-2xl">
										{section.icon}
									</span>
									<span className="font-semibold text-lg">
										{section.title}
									</span>
									{hasItems && (
										<Badge
											variant="secondary"
											className="text-xs"
										>
											{sectionItems.length} عنصر
										</Badge>
									)}
								</div>
								<div className="flex items-center gap-3">
									{/* Concrete/Steel summary */}
									{hasItems && (
										<div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
											{sectionConcrete > 0 && (
												<span className="flex items-center gap-1">
													خرسانة:{" "}
													<span className="font-semibold text-blue-600">
														{formatNumber(
															sectionConcrete,
														)}{" "}
														م³
													</span>
												</span>
											)}
											{sectionConcrete > 0 &&
												sectionSteel > 0 && (
													<span className="text-muted-foreground/50">
														|
													</span>
												)}
											{sectionSteel > 0 && (
												<span className="flex items-center gap-1">
													حديد:{" "}
													<span className="font-semibold text-orange-600">
														{formatNumber(
															sectionSteel,
														)}{" "}
														كجم
													</span>
												</span>
											)}
										</div>
									)}
									{/* Status badge */}
									{isSaved ? (
										<Badge
											variant="default"
											className="bg-green-600"
										>
											<Check className="h-3 w-3 ml-1" />
											{t(
												"pricing.studies.messages.saved",
											)}
										</Badge>
									) : !hasItems ? (
										<Badge
											variant="outline"
											className="text-muted-foreground"
										>
											<AlertCircle className="h-3 w-3 ml-1" />
											{t(
												"pricing.studies.structural.noItems",
											)}
										</Badge>
									) : null}
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="pb-4">
							<SectionComponent
								studyId={studyId}
								organizationId={organizationId}
								items={sectionItems}
								onSave={() => handleSave(section.id)}
								onUpdate={onUpdate}
							/>
						</AccordionContent>
					</AccordionItem>
				);
			})}
		</Accordion>
	);
}
