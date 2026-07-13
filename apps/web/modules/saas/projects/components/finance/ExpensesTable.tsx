"use client";

import { useState } from "react";
import { formatSAR } from "@shared/lib/formatters";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { EmptyState } from "@ui/components/empty-state";
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
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";
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

function getCategoryBadge(
	category: string,
	_type: string | undefined,
	t: (key: string) => string,
): React.ReactNode {
	const categoryConfig: Record<string, { className: string; label: string }> = {
		MATERIALS: {
			className:
				"bg-chart-4/15 text-chart-4",
			label: t("finance.category.MATERIALS"),
		},
		LABOR: {
			className:
				"bg-chart-1/15 text-chart-1",
			label: t("finance.category.LABOR"),
		},
		EQUIPMENT: {
			className:
				"bg-chart-4/15 text-chart-4",
			label: t("finance.category.EQUIPMENT"),
		},
		SUBCONTRACTOR: {
			className:
				"bg-chart-4/15 text-chart-4",
			label: t("finance.category.SUBCONTRACTOR"),
		},
		TRANSPORT: {
			className:
				"bg-chart-1/15 text-chart-1",
			label: t("finance.category.TRANSPORT"),
		},
		MISC: {
			className:
				"bg-muted text-muted-foreground",
			label: t("finance.category.MISC"),
		},
	};

	const config = categoryConfig[category] || categoryConfig.MISC;
	return (
		<div className="flex items-center gap-1.5">
			<Badge className={`border-0 ${config.className}`}>{config.label}</Badge>
			{_type === "subcontract_payment" && (
				<Badge className="border-0 bg-chart-4/15 text-chart-4 px-1.5">
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
				{/* الجوال: بحث + ورقة فلاتر + زر إضافة مضغوط في صف واحد */}
				<div className="flex items-center gap-2 sm:hidden">
					<div className="relative min-w-0 flex-1">
						<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("finance.expenses.searchPlaceholder")}
							value={searchQuery}
							onChange={(e: any) => onSearchChange(e.target.value)}
							className="ps-10 rounded-xl"
						/>
					</div>
					<MobileFilterSheet activeCount={selectedCategory ? 1 : 0}>
						<Select
							value={selectedCategory || "all"}
							onValueChange={(value: any) =>
								onCategoryChange(value === "all" ? undefined : value)
							}
						>
							<SelectTrigger className="w-full rounded-xl">
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
					</MobileFilterSheet>
					<Button
						size="icon"
						aria-label={t("finance.expenses.new")}
						className="h-10 w-10 shrink-0 rounded-xl"
						onClick={() => setShowAddDialog(true)}
					>
						<Plus className="h-5 w-5" />
					</Button>
				</div>

				{/* Filters & Actions (الديسكتوب كما هو) */}
				<div className="hidden gap-3 sm:flex sm:items-center sm:justify-between">
					<div className="flex flex-1 items-center gap-3">
						<div className="relative flex-1 max-w-xs">
							<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={t("finance.expenses.searchPlaceholder")}
								value={searchQuery}
								onChange={(e: any) => onSearchChange(e.target.value)}
								className="ps-10 rounded-xl"
							/>
						</div>
						<Select
							value={selectedCategory || "all"}
							onValueChange={(value: any) =>
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
				{isLoading ? <ListTableSkeleton /> : expenses.length === 0 ? (
					<EmptyState
						icon={<Receipt className="h-8 w-8" />}
						description={searchQuery
							? t("finance.expenses.noSearchResults")
							: t("finance.expenses.empty")}
					>
						{!searchQuery && (
							<Button
								className="rounded-xl"
								onClick={() => setShowAddDialog(true)}
							>
								<Plus className="me-2 h-4 w-4" />
								{t("finance.expenses.new")}
							</Button>
						)}
					</EmptyState>
				) : (
					<div className="rounded-xl border-2">
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
											{formatSAR(expense.amount)}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{expense.vendorName || "-"}
										</TableCell>
										<TableCell className="text-muted-foreground max-w-[200px] truncate">
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
