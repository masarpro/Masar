"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Textarea } from "@ui/components/textarea";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { FileText, Plus, TrendingDown, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { SubcontractDetailSheet } from "./SubcontractDetailSheet";

interface SubcontractsTabProps {
	organizationId: string;
	organizationSlug: string;
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

export function SubcontractsTab({
	organizationId,
	organizationSlug,
	projectId,
}: SubcontractsTabProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
	const [deleteContractId, setDeleteContractId] = useState<string | null>(null);

	// Form state
	const [name, setName] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [value, setValue] = useState("");
	const [notes, setNotes] = useState("");

	const { data: contracts, isLoading } = useQuery(
		orpc.projectFinance.listSubcontracts.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	const createMutation = useMutation({
		...orpc.projectFinance.createSubcontract.mutationOptions(),
		onSuccess: () => {
			toast.success(t("finance.notifications.subcontractCreated"));
			queryClient.invalidateQueries({ queryKey: ["projectFinance"] });
			setShowCreateDialog(false);
			resetForm();
		},
		onError: (error) => {
			console.error("[createSubcontract] Client error:", error);
			toast.error(
				error.message || t("finance.notifications.subcontractCreateError"),
			);
		},
	});

	const deleteMutation = useMutation({
		...orpc.projectFinance.deleteSubcontract.mutationOptions(),
		onSuccess: () => {
			toast.success(t("finance.notifications.subcontractDeleted"));
			queryClient.invalidateQueries({ queryKey: ["projectFinance"] });
			setDeleteContractId(null);
		},
		onError: () => {
			toast.error(t("finance.notifications.subcontractDeleteError"));
		},
	});

	function resetForm() {
		setName("");
		setStartDate("");
		setEndDate("");
		setValue("");
		setNotes("");
	}

	function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		if (!name || !value) {
			toast.error(t("finance.validation.requiredFields"));
			return;
		}
		createMutation.mutate({
			organizationId,
			projectId,
			name,
			startDate: startDate ? new Date(startDate) : undefined,
			endDate: endDate ? new Date(endDate) : undefined,
			value: Number.parseFloat(value),
			notes: notes || undefined,
		});
	}

	// Summary calculations
	const totalValue = contracts?.reduce((sum, c) => sum + c.value, 0) ?? 0;
	const totalPaid = contracts?.reduce((sum, c) => sum + c.totalPaid, 0) ?? 0;
	const totalRemaining = totalValue - totalPaid;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="relative">
					<div className="h-12 w-12 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Summary Cards */}
			{contracts && contracts.length > 0 && (
				<div className="grid grid-cols-3 gap-3">
					<div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950/30">
						<div className="flex items-center gap-2">
							<div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/50">
								<FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-indigo-600 dark:text-indigo-400">
									{t("finance.subcontracts.totalValue")}
								</p>
								<p className="truncate text-sm font-semibold text-indigo-700 dark:text-indigo-300">
									{formatCurrency(totalValue)}
								</p>
							</div>
						</div>
					</div>
					<div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/30">
						<div className="flex items-center gap-2">
							<div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/50">
								<TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-red-600 dark:text-red-400">
									{t("finance.subcontracts.totalPaid")}
								</p>
								<p className="truncate text-sm font-semibold text-red-700 dark:text-red-300">
									{formatCurrency(totalPaid)}
								</p>
							</div>
						</div>
					</div>
					<div className="rounded-xl bg-teal-50 p-4 dark:bg-teal-950/30">
						<div className="flex items-center gap-2">
							<div className="rounded-lg bg-teal-100 p-2 dark:bg-teal-900/50">
								<Wallet className="h-4 w-4 text-teal-600 dark:text-teal-400" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-teal-600 dark:text-teal-400">
									{t("finance.subcontracts.remaining")}
								</p>
								<p className="truncate text-sm font-semibold text-teal-700 dark:text-teal-300">
									{formatCurrency(totalRemaining)}
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Header with New Button */}
			<div className="flex items-center justify-end">
				<Button
					className="rounded-xl"
					onClick={() => setShowCreateDialog(true)}
				>
					<Plus className="me-2 h-4 w-4" />
					{t("finance.subcontracts.new")}
				</Button>
			</div>

			{/* Contracts List */}
			{!contracts || contracts.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<div className="mb-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
						<FileText className="h-8 w-8 text-slate-400" />
					</div>
					<p className="mb-4 text-slate-500 dark:text-slate-400">
						{t("finance.subcontracts.empty")}
					</p>
					<Button
						className="rounded-xl"
						onClick={() => setShowCreateDialog(true)}
					>
						<Plus className="me-2 h-4 w-4" />
						{t("finance.subcontracts.emptyAction")}
					</Button>
				</div>
			) : (
				<div className="rounded-xl border border-slate-200 dark:border-slate-800">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="text-start">
									{t("finance.subcontracts.name")}
								</TableHead>
								<TableHead className="text-start">
									{t("finance.subcontracts.duration")}
								</TableHead>
								<TableHead className="text-start">
									{t("finance.subcontracts.value")}
								</TableHead>
								<TableHead className="text-start">
									{t("finance.subcontracts.paid")}
								</TableHead>
								<TableHead className="text-start">
									{t("finance.subcontracts.remaining")}
								</TableHead>
								<TableHead className="text-start">
									{t("finance.subcontracts.progress")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{contracts.map((contract) => {
								const progress = contract.value > 0
									? Math.min((contract.totalPaid / contract.value) * 100, 100)
									: 0;
								const isCompleted = contract.endDate && new Date(contract.endDate) < new Date();

								return (
									<TableRow
										key={contract.id}
										className="cursor-pointer"
										onClick={() => setSelectedContractId(contract.id)}
									>
										<TableCell className="font-medium">
											{contract.name}
										</TableCell>
										<TableCell className="text-sm text-slate-600 dark:text-slate-400">
											{contract.startDate && contract.endDate ? (
												<>
													{format(new Date(contract.startDate), "dd/MM/yyyy", { locale: ar })}
													{" - "}
													{format(new Date(contract.endDate), "dd/MM/yyyy", { locale: ar })}
												</>
											) : contract.startDate ? (
												format(new Date(contract.startDate), "dd/MM/yyyy", { locale: ar })
											) : (
												"-"
											)}
										</TableCell>
										<TableCell className="font-semibold">
											{formatCurrency(contract.value)}
										</TableCell>
										<TableCell className="text-red-600 dark:text-red-400">
											{formatCurrency(contract.totalPaid)}
										</TableCell>
										<TableCell className="text-teal-600 dark:text-teal-400">
											{formatCurrency(contract.remaining)}
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
													<div
														className="h-full rounded-full bg-primary transition-all"
														style={{ width: `${progress}%` }}
													/>
												</div>
												<span className="text-xs text-slate-500">
													{progress.toFixed(0)}%
												</span>
												{isCompleted && (
													<Badge className="border-0 bg-slate-100 text-slate-600 text-xs dark:bg-slate-800 dark:text-slate-400">
														{t("finance.subcontracts.statusCompleted")}
													</Badge>
												)}
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Create Dialog */}
			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("finance.subcontracts.new")}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleCreate} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="sc-name">{t("finance.subcontracts.name")}</Label>
							<Input
								id="sc-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={t("finance.subcontracts.namePlaceholder")}
								className="rounded-xl"
								required
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label htmlFor="sc-start">{t("finance.subcontracts.startDate")}</Label>
								<Input
									id="sc-start"
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className="rounded-xl"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="sc-end">{t("finance.subcontracts.endDate")}</Label>
								<Input
									id="sc-end"
									type="date"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									className="rounded-xl"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="sc-value">{t("finance.subcontracts.value")}</Label>
							<Input
								id="sc-value"
								type="number"
								min="0"
								step="0.01"
								value={value}
								onChange={(e) => setValue(e.target.value)}
								placeholder="0.00"
								className="rounded-xl"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="sc-notes">{t("finance.subcontracts.notes")}</Label>
							<Textarea
								id="sc-notes"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder={t("finance.subcontracts.notesPlaceholder")}
								className="min-h-20 rounded-xl"
							/>
						</div>
						<div className="flex gap-3">
							<Button
								type="button"
								variant="outline"
								className="flex-1 rounded-xl"
								onClick={() => {
									setShowCreateDialog(false);
									resetForm();
								}}
							>
								{t("common.cancel")}
							</Button>
							<Button
								type="submit"
								className="flex-1 rounded-xl"
								disabled={createMutation.isPending}
							>
								{createMutation.isPending
									? t("common.creating")
									: t("common.save")}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Detail Sheet */}
			<SubcontractDetailSheet
				contractId={selectedContractId}
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				projectId={projectId}
				open={!!selectedContractId}
				onOpenChange={(open) => {
					if (!open) setSelectedContractId(null);
				}}
				onDelete={(id) => setDeleteContractId(id)}
			/>

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deleteContractId}
				onOpenChange={(open) => {
					if (!open) setDeleteContractId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("finance.subcontracts.deleteTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.subcontracts.deleteConfirm")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className="bg-red-600 hover:bg-red-700"
							onClick={() => {
								if (deleteContractId) {
									deleteMutation.mutate({
										organizationId,
										projectId,
										contractId: deleteContractId,
									});
								}
							}}
						>
							{t("finance.actions.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
