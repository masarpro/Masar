"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Skeleton } from "@ui/components/skeleton";
import { Checkbox } from "@ui/components/checkbox";
import { Label } from "@ui/components/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { toast } from "sonner";
import {
	Search,
	Copy,
	Loader2,
	PackageOpen,
	FileText,
	User,
} from "lucide-react";
import {
	useAvailableQuotations,
	useCopyFromQuotation,
} from "@saas/projects/hooks/use-project-boq";

interface CopyFromQuotationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	projectId: string;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function CopyFromQuotationDialog({
	open,
	onOpenChange,
	organizationId,
	projectId,
}: CopyFromQuotationDialogProps) {
	const t = useTranslations("projectBoq");

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [includePrices, setIncludePrices] = useState(true);

	// Debounce search input
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	const { data: quotations, isLoading } = useAvailableQuotations(
		organizationId,
		projectId,
		debouncedSearch || undefined,
	);

	const copyMutation = useCopyFromQuotation();

	const handleCopy = async (quotationId: string) => {
		try {
			const result = await copyMutation.mutateAsync({
				organizationId,
				projectId,
				quotationId,
				includePrices,
			});
			toast.success(
				t("toast.copiedFromQuotation", { count: result.copiedCount }),
			);
			onOpenChange(false);
		} catch {
			// Error handled by mutation
		}
	};

	const quotationList = Array.isArray(quotations) ? quotations : [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden">
				<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
					<DialogTitle className="text-base font-semibold">
						{t("copyQuotation.title")}
					</DialogTitle>
				</DialogHeader>

				<div className="p-5 space-y-4">
					{/* Search Input */}
					<div className="relative">
						<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t("copyQuotation.search")}
							className="ps-9 rounded-xl h-10"
						/>
					</div>

					{/* Include Prices Toggle */}
					<div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
						<Checkbox
							id="includePrices"
							checked={includePrices}
							onCheckedChange={(checked) =>
								setIncludePrices(checked === true)
							}
						/>
						<Label
							htmlFor="includePrices"
							className="text-sm cursor-pointer flex-1"
						>
							{includePrices
								? t("copyQuotation.includePrices")
								: t("copyQuotation.itemsOnly")}
						</Label>
					</div>

					{/* Quotations List */}
					<div className="max-h-[400px] overflow-y-auto space-y-3">
						{isLoading ? (
							<>
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3"
									>
										<Skeleton className="h-5 w-48" />
										<div className="flex gap-4">
											<Skeleton className="h-4 w-32" />
											<Skeleton className="h-4 w-24" />
										</div>
										<Skeleton className="h-9 w-24" />
									</div>
								))}
							</>
						) : quotationList.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
									<PackageOpen className="h-7 w-7 text-slate-400" />
								</div>
								<p className="text-sm font-medium text-slate-600 dark:text-slate-300">
									{t("copyQuotation.noQuotations")}
								</p>
							</div>
						) : (
							quotationList.map((quotation: any) => (
								<div
									key={quotation.id}
									className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
								>
									{/* Quotation Header */}
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
												<FileText className="h-4 w-4 text-slate-400 shrink-0" />
												{quotation.quotationNo || quotation.id}
											</h4>
										</div>
									</div>

									{/* Quotation Details */}
									<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
										{quotation.client?.name && (
											<span className="flex items-center gap-1">
												<User className="h-3.5 w-3.5" />
												{t("copyQuotation.client")}: {quotation.client.name}
											</span>
										)}
										{quotation._count?.items != null && (
											<span>
												{t("copyQuotation.itemCount", {
													count: quotation._count.items,
												})}
											</span>
										)}
										{quotation.total != null && (
											<span className="font-medium text-emerald-600 dark:text-emerald-400">
												{formatCurrency(Number(quotation.total))}
											</span>
										)}
									</div>

									{/* Copy Button */}
									<div className="mt-3 flex justify-end">
										<Button
											size="sm"
											variant="outline"
											className="rounded-xl h-9"
											disabled={copyMutation.isPending}
											onClick={() => handleCopy(quotation.id)}
										>
											{copyMutation.isPending &&
											copyMutation.variables?.quotationId ===
												quotation.id ? (
												<Loader2 className="h-4 w-4 me-1.5 animate-spin" />
											) : (
												<Copy className="h-4 w-4 me-1.5" />
											)}
											{t("copyQuotation.copy")}
										</Button>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex justify-end">
					<Button
						type="button"
						variant="outline"
						className="rounded-xl h-10"
						onClick={() => onOpenChange(false)}
					>
						{t("actions.cancel")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
