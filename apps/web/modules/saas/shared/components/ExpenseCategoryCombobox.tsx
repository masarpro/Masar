"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@ui/lib";
import { Button } from "@ui/components/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@ui/components/command";
import { EXPENSE_CATEGORIES, type ExpenseMainCategory } from "@repo/utils";

interface ExpenseCategoryComboboxProps {
	value: string;
	onValueChange: (categoryId: string) => void;
	disabled?: boolean;
	placeholder?: string;
}

export function ExpenseCategoryCombobox({
	value,
	onValueChange,
	disabled,
	placeholder,
}: ExpenseCategoryComboboxProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const locale = useLocale();
	const isAr = locale === "ar";

	const getName = (cat: ExpenseMainCategory) =>
		isAr ? cat.nameAr : cat.nameEn;

	const getSecondaryName = (cat: ExpenseMainCategory) =>
		isAr ? cat.nameEn : cat.nameAr;

	const selected = value
		? EXPENSE_CATEGORIES.find((c) => c.id === value)
		: undefined;

	const filtered = search.trim()
		? EXPENSE_CATEGORIES.filter((c) => {
				const q = search.toLowerCase().trim();
				return (
					c.nameAr.includes(q) ||
					c.nameEn.toLowerCase().includes(q) ||
					c.id.toLowerCase().includes(q) ||
					c.subcategories.some(
						(s) =>
							s.nameAr.includes(q) ||
							s.nameEn.toLowerCase().includes(q),
					)
				);
			})
		: EXPENSE_CATEGORIES;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					disabled={disabled}
					className="w-full justify-between rounded-xl h-10 font-normal bg-card shadow-xs"
				>
					{selected ? (
						<span className="truncate">{getName(selected)}</span>
					) : (
						<span className="text-muted-foreground">
							{placeholder ?? (isAr ? "اختر الفئة" : "Select category")}
						</span>
					)}
					<ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder={isAr ? "ابحث عن فئة..." : "Search category..."}
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						<CommandEmpty>
							{isAr ? "لا توجد نتائج" : "No results found"}
						</CommandEmpty>
						<CommandGroup>
							{filtered.map((cat) => (
								<CommandItem
									key={cat.id}
									value={cat.id}
									onSelect={() => {
										onValueChange(cat.id);
										setOpen(false);
										setSearch("");
									}}
								>
									<Check
										className={cn(
											"me-2 h-4 w-4 shrink-0",
											value === cat.id ? "opacity-100" : "opacity-0",
										)}
									/>
									<div className="flex flex-col min-w-0">
										<span className="truncate text-sm">{getName(cat)}</span>
										<span className="truncate text-xs text-muted-foreground">
											{getSecondaryName(cat)}
										</span>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
