"use client";

import { useState } from "react";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Hammer, Plus, Receipt, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { AddExpenseDialog } from "./AddExpenseDialog";

interface Expense {
	_type?: "expense" | "subcontract_payment";
	id: string;
	date: Date;
	category:
		| "MATERIALS"
		| "LABOR"
		| "EQUIPMENT"
		| "SUBCONTRACTOR"
		| "TRANSPORT"
		| "MISC";
	amount: number;
	vendorName: string | null;
	note: string | null;
	description?: string | null;
	createdBy: { id: string; name: string };
	createdAt: Date;
}

interface ExpensesTableProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	expenses: Expense[];
	isLoading?: boolean;
	selectedCategory: string | undefined;
	onCategoryChange: (category: string | undefined) => void;
	searchQuery: string;
	onSearchChange: (query: string) => void;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

function getCategoryBadge(
	category: string,
	_type: string | undefined,
	t: (key: string) => string,
): React.ReactNode {
	const categoryConfig: Record<string, { className: string; label: string }> = {
		MATERIALS: {
			className:
				"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
			label: t("finance.category.MATERIALS"),
		},
		LABOR: {
			className:
				"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
			label: t("finance.category.LABOR"),
		},
		EQUIPMENT: {
			className:
				"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
			label: t("finance.category.EQUIPMENT"),
		},
		SUBCONTRACTOR: {
			className:
				"bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
			label: t("finance.category.SUBCONTRACTOR"),
		},
		TRANSPORT: {
			className:
				"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
			label: t("finance.category.TRANSPORT"),
		},
		MISC: {
			className:
				"bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
			label: t("finance.category.MISC"),
		},
	};

	const config = categoryConfig[category] || categoryConfig.MISC;
	return (
		<div className="flex items-center gap-1.5">
			<Badge className={`border-0 ${config.className}`}>{config.label}</Badge>
			{_type === "subcontract_payment" && (
				<Badge className="border-0 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 px-1.5">
					<Hammer className="h-3 w-3" />
				</Badge>
			)}
		</div>
	);
}

export function ExpensesTable({
	organizationId,
	organizationSlug,
	projectId,
	expenses,
	isLoading,
	selectedCategory,
	onCategoryChange,
	searchQuery,
	onSearchChange,
}: ExpensesTableProps) {
	const t = useTranslations();
	const [showAddDialog, setShowAddDialog] = useState(false);

	const categories = [
		{ value: "all", label: t("finance.expenses.allCategories") },
		{ value: "MATERIALS", label: t("finance.category.MATERIALS") },
		{ value: "LABOR", label: t("finance.category.LABOR") },
		{ value: "EQUIPMENT", label: t("finance.category.EQUIPMENT") },
		{ value: "SUBCONTRACTOR", label: t("finance.category.SUBCONTRACTOR") },
		{ value: "TRANSPORT", label: t("finance.category.TRANSPORT") },
		{ value: "MISC", label: t("finance.category.MISC") },
	];

	return (
		<>
			<div className="space-y-4">
				{/* Filters & Actions */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
						<div className="relative flex-1 max-w-xs">
							<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder={t("finance.expenses.searchPlaceholder")}
								value={searchQuery}
								onChange={(e) => onSearchChange(e.target.value)}
								className="ps-10 rounded-xl"
							/>
						</div>
						<Select
							value={selectedCategory || "all"}
							onValueChange={(value) =>
								onCategoryChange(value === "all" ? undefined : value)
							}
						>
							<SelectTrigger className="w-48 rounded-xl">
								<SelectValue
									placeholder={t("finance.expenses.filterByCategory")}
								/>
							</SelectTrigger>
							<SelectContent>
								{categories.map((cat) => (
									<SelectItem key={cat.value} value={cat.value}>
										{cat.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<Button
						className="rounded-xl"
						onClick={() => setShowAddDialog(true)}
					>
						<Plus className="me-2 h-4 w-4" />
						{t("finance.expenses.new")}
					</Button>
				</div>

				{/* Table */}
				{isLoading ? (
					<div className="flex items-center justify-center py-16">
						<div className="relative">
							<div className="h-12 w-12 rounded-full border-4 border-primary/20" />
							<div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					</div>
				) : expenses.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="mb-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
							<Receipt className="h-8 w-8 text-slate-400" />
						</div>
						<p className="mb-4 text-slate-500 dark:text-slate-400">
							{searchQuery
								? t("finance.expenses.noSearchResults")
								: t("finance.expenses.empty")}
						</p>
						{!searchQuery && (
							<Button
								className="rounded-xl"
								onClick={() => setShowAddDialog(true)}
							>
								<Plus className="me-2 h-4 w-4" />
								{t("finance.expenses.new")}
							</Button>
						)}
					</div>
				) : (
					<div className="rounded-xl border border-slate-200 dark:border-slate-800">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="text-start">
										{t("finance.expenses.date")}
									</TableHead>
									<TableHead className="text-start">
										{t("finance.expenses.category")}
									</TableHead>
									<TableHead className="text-start">
										{t("finance.expenses.amount")}
									</TableHead>
									<TableHead className="text-start">
										{t("finance.expenses.vendor")}
									</TableHead>
									<TableHead className="text-start">
										{t("finance.expenses.description")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{expenses.map((expense) => (
									<TableRow
										key={`${expense._type || "expense"}-${expense.id}`}
									>
										<TableCell>
											{format(new Date(expense.date), "dd/MM/yyyy", {
												locale: ar,
											})}
										</TableCell>
										<TableCell>
											{getCategoryBadge(
												expense.category,
												expense._type,
												t,
											)}
										</TableCell>
										<TableCell className="font-semibold">
											{formatCurrency(expense.amount)}
										</TableCell>
										<TableCell className="text-slate-600 dark:text-slate-400">
											{expense.vendorName || "-"}
										</TableCell>
										<TableCell className="text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
											{expense.description ||
												expense.note ||
												"-"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>

			{/* Add Expense Dialog */}
			<AddExpenseDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				organizationId={organizationId}
				projectId={projectId}
			/>
		</>
	);
}
