"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@ui/components/accordion";
import { Skeleton } from "@ui/components/skeleton";
import { CatalogItemCard } from "./CatalogItemCard";
import { DOMAIN_STYLES, type Domain, type ItemCatalogEntry } from "../types";

const CATEGORY_LABELS: Record<string, string> = {
	paint: "دهانات",
	plaster: "لياسة",
	flooring: "أرضيات",
	walls: "جدران",
	ceiling: "أسقف",
	doors: "أبواب",
	windows: "نوافذ",
	insulation: "عزل",
	cladding: "تكسيات",
	trim: "وزرات وأفاريز",
	kitchen: "مطابخ",
	electrical: "كهرباء",
	plumbing: "سباكة",
	hvac: "تكييف",
	firefighting: "إطفاء حريق",
	low_current: "تيار خفيف",
	exterior: "أعمال خارجية",
	elevator: "مصاعد",
	tank: "خزانات",
	solar: "طاقة شمسية",
};

interface Props {
	groupedByCategory: Record<string, Record<string, ItemCatalogEntry[]>> | null;
	isLoading: boolean;
	searchQuery: string;
	onItemSelect: (entry: ItemCatalogEntry) => Promise<void> | void;
}

function filterBySearch(
	grouped: Record<string, Record<string, ItemCatalogEntry[]>>,
	query: string,
): Record<string, Record<string, ItemCatalogEntry[]>> {
	if (!query.trim()) return grouped;
	const q = query.trim().toLowerCase();

	const result: typeof grouped = {};
	for (const [domain, categories] of Object.entries(grouped)) {
		result[domain] = {};
		for (const [catKey, items] of Object.entries(categories)) {
			const matches = items.filter(
				(e) =>
					e.nameAr.toLowerCase().includes(q) ||
					e.nameEn.toLowerCase().includes(q) ||
					e.itemKey.toLowerCase().includes(q),
			);
			if (matches.length > 0) result[domain][catKey] = matches;
		}
	}
	return result;
}

export function CatalogCategoryTree({
	groupedByCategory,
	isLoading,
	searchQuery,
	onItemSelect,
}: Props) {
	if (isLoading) {
		return (
			<div className="space-y-2">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-16 w-full" />
				))}
			</div>
		);
	}

	if (!groupedByCategory) {
		return (
			<p className="py-12 text-center text-sm text-muted-foreground">
				الكتالوج غير متاح
			</p>
		);
	}

	const filtered = filterBySearch(groupedByCategory, searchQuery);
	const domainsWithMatches = (Object.keys(filtered) as Domain[]).filter(
		(d) => Object.values(filtered[d]).reduce((s, arr) => s + arr.length, 0) > 0,
	);

	if (domainsWithMatches.length === 0) {
		return (
			<p className="py-12 text-center text-sm text-muted-foreground">
				لا نتائج للبحث: {searchQuery}
			</p>
		);
	}

	return (
		<Accordion
			type="multiple"
			defaultValue={["FINISHING"]}
			className="space-y-2"
		>
			{domainsWithMatches.map((domain) => {
				const categories = filtered[domain];
				const totalCount = Object.values(categories).reduce(
					(sum, items) => sum + items.length,
					0,
				);
				const style = DOMAIN_STYLES[domain];

				return (
					<AccordionItem
						key={domain}
						value={domain}
						className="rounded-lg border"
					>
						<AccordionTrigger className="px-4 hover:no-underline">
							<div className="flex items-center gap-2">
								<span
									style={{ color: style.color }}
									className="font-semibold"
								>
									{style.label}
								</span>
								<span className="text-xs text-muted-foreground">
									({totalCount} بند)
								</span>
							</div>
						</AccordionTrigger>
						<AccordionContent className="space-y-3 px-2 pb-3">
							{Object.entries(categories).map(([catKey, entries]) => (
								<div key={catKey}>
									<h4 className="mb-2 px-2 text-sm font-medium text-muted-foreground">
										{CATEGORY_LABELS[catKey] ?? catKey}
									</h4>
									<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
										{entries.map((entry) => (
											<CatalogItemCard
												key={entry.itemKey}
												entry={entry}
												onSelect={() => onItemSelect(entry)}
											/>
										))}
									</div>
								</div>
							))}
						</AccordionContent>
					</AccordionItem>
				);
			})}
		</Accordion>
	);
}
