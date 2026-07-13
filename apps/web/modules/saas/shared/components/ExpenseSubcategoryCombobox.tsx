"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { orpc } from "@shared/lib/orpc-query-utils";

// Shape we rely on from `categories.list` (subset of OrgSubcategory).
interface SubcategoryOption {
	id: string;
	nameAr: string;
	nameEn: string;
}

interface ExpenseSubcategoryComboboxProps {
	/** Organization whose (DB-backed, editable) categories to list. */
	organizationId: string;
	/** Parent OrgCategory id (cuid). */
	categoryId: string;
	/** Selected OrgSubcategory id (cuid) or null. */
	value: string | null;
	onValueChange: (subcategoryId: string | null) => void;
	disabled?: boolean;
	placeholder?: string;
}

export function ExpenseSubcategoryCombobox({
	organizationId,
	categoryId,
	value,
	onValueChange,
	disabled,
	placeholder,
}: ExpenseSubcategoryComboboxProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const locale = useLocale();
	const isAr = locale === "ar";

	const { data: categories = [] } = useQuery(
		orpc.categories.list.queryOptions({
			input: { organizationId, group: "EXPENSE" },
		}),
	);

	const category = categoryId
		? categories.find((c) => c.id === categoryId)
		: undefined;
	const subcategories = category?.subcategories ?? [];

	const getName = (sub: SubcategoryOption) =>
		isAr ? sub.nameAr : sub.nameEn;

	const selected = value
		? subcategories.find((s) => s.id === value)
		: undefined;

	const filtered = search.trim()
		? subcategories.filter((s) => {
				const q = search.toLowerCase().trim();
				return (
					s.nameAr.includes(q) ||
					s.nameEn.toLowerCase().includes(q)
				);
			})
		: subcategories;

	const isDisabled = disabled || !categoryId || subcategories.length === 0;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					disabled={isDisabled}
					className="w-full justify-between rounded-xl h-10 font-normal bg-card"
				>
					{selected ? (
						<span className="truncate">{getName(selected)}</span>
					) : (
						<span className="text-muted-foreground">
							{placeholder ??
								(isAr
									? "اختر الفئة الفرعية (اختياري)"
									: "Select subcategory (optional)")}
						</span>
					)}
					<ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder={
							isAr ? "ابحث عن فئة فرعية..." : "Search subcategory..."
						}
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						<CommandEmpty>
							{isAr ? "لا توجد نتائج" : "No results found"}
						</CommandEmpty>
						<CommandGroup>
							{/* Clear option */}
							<CommandItem
								value="__clear__"
								onSelect={() => {
									onValueChange(null);
									setOpen(false);
									setSearch("");
								}}
							>
								<Check
									className={cn(
										"me-2 h-4 w-4 shrink-0",
										!value ? "opacity-100" : "opacity-0",
									)}
								/>
								<span className="text-sm text-muted-foreground">
									{isAr ? "— بدون تحديد —" : "— None —"}
								</span>
							</CommandItem>
							{filtered.map((sub) => (
								<CommandItem
									key={sub.id}
									value={sub.id}
									onSelect={() => {
										onValueChange(sub.id);
										setOpen(false);
										setSearch("");
									}}
								>
									<Check
										className={cn(
											"me-2 h-4 w-4 shrink-0",
											value === sub.id ? "opacity-100" : "opacity-0",
										)}
									/>
									<span className="truncate text-sm">{getName(sub)}</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
