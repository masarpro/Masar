"use client";

import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface BOQFiltersProps {
	section: string;
	onSectionChange: (val: string) => void;
	sourceType: string;
	onSourceTypeChange: (val: string) => void;
	isPriced: string;
	onIsPricedChange: (val: string) => void;
	search: string;
	onSearchChange: (val: string) => void;
}

export function BOQFilters({
	section,
	onSectionChange,
	sourceType,
	onSourceTypeChange,
	isPriced,
	onIsPricedChange,
	search,
	onSearchChange,
}: BOQFiltersProps) {
	const t = useTranslations("projectBoq");

	return (
		<div className="flex flex-wrap items-center gap-3">
			{/* Section */}
			<Select value={section} onValueChange={onSectionChange}>
				<SelectTrigger className="w-[140px] rounded-xl h-9 text-sm">
					<SelectValue placeholder={t("filters.allSections")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{t("filters.allSections")}</SelectItem>
					<SelectItem value="STRUCTURAL">{t("section.STRUCTURAL")}</SelectItem>
					<SelectItem value="FINISHING">{t("section.FINISHING")}</SelectItem>
					<SelectItem value="MEP">{t("section.MEP")}</SelectItem>
					<SelectItem value="LABOR">{t("section.LABOR")}</SelectItem>
					<SelectItem value="GENERAL">{t("section.GENERAL")}</SelectItem>
				</SelectContent>
			</Select>

			{/* Source */}
			<Select value={sourceType} onValueChange={onSourceTypeChange}>
				<SelectTrigger className="w-[140px] rounded-xl h-9 text-sm">
					<SelectValue placeholder={t("filters.allSources")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{t("filters.allSources")}</SelectItem>
					<SelectItem value="MANUAL">{t("source.MANUAL")}</SelectItem>
					<SelectItem value="COST_STUDY">{t("source.COST_STUDY")}</SelectItem>
					<SelectItem value="IMPORTED">{t("source.IMPORTED")}</SelectItem>
					<SelectItem value="CONTRACT">{t("source.CONTRACT")}</SelectItem>
					<SelectItem value="QUOTATION">{t("source.QUOTATION")}</SelectItem>
				</SelectContent>
			</Select>

			{/* Priced status */}
			<Select value={isPriced} onValueChange={onIsPricedChange}>
				<SelectTrigger className="w-[130px] rounded-xl h-9 text-sm">
					<SelectValue placeholder={t("filters.allStatuses")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
					<SelectItem value="true">{t("filters.priced")}</SelectItem>
					<SelectItem value="false">{t("filters.unpriced")}</SelectItem>
				</SelectContent>
			</Select>

			{/* Search */}
			<div className="relative flex-1 min-w-[200px]">
				<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
				<Input
					placeholder={t("filters.search")}
					value={search}
					onChange={(e: any) => onSearchChange(e.target.value)}
					className="ps-9 rounded-xl h-9 text-sm"
				/>
			</div>
		</div>
	);
}
