"use client";

import { Button } from "@ui/components/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type PaginatioProps = {
	className?: string;
	totalItems: number;
	itemsPerPage: number;
	currentPage: number;
	onChangeCurrentPage: (page: number) => void;
};

const Pagination = ({
	currentPage,
	totalItems,
	itemsPerPage,
	className,
	onChangeCurrentPage,
}: PaginatioProps) => {
	const t = useTranslations();
	const numberOfPages = Math.ceil(totalItems / itemsPerPage);

	return (
		<div className={className}>
			<nav aria-label={t("pagination.navigation")} className="flex items-center justify-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					disabled={currentPage === 1}
					onClick={() => onChangeCurrentPage(currentPage - 1)}
					aria-label={t("common.previous")}
				>
					<ChevronLeftIcon className="rtl:rotate-180" />
				</Button>
				<span className="text-gray-500 text-sm">
					{t("pagination.rangeOf", {
						start: currentPage * itemsPerPage - itemsPerPage + 1,
						end: currentPage * itemsPerPage > totalItems
							? totalItems
							: currentPage * itemsPerPage,
						total: totalItems,
					})}
				</span>
				<Button
					variant="ghost"
					size="icon"
					disabled={currentPage === numberOfPages}
					onClick={() => onChangeCurrentPage(currentPage + 1)}
					aria-label={t("common.next")}
				>
					<ChevronRightIcon className="rtl:rotate-180" />
				</Button>
			</nav>
		</div>
	);
};
Pagination.displayName = "Pagination";

export { Pagination };
