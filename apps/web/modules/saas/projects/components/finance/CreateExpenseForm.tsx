"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface CreateExpenseFormProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function CreateExpenseForm({
	organizationId,
	organizationSlug,
	projectId,
}: CreateExpenseFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance`;

	const defaultContractId = searchParams.get("contractId") || "";

	const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
	const [category, setCategory] = useState<string>(
		defaultContractId ? "SUBCONTRACTOR" : "",
	);
	const [amount, setAmount] = useState("");
	const [vendorName, setVendorName] = useState("");
	const [note, setNote] = useState("");
	const [subcontractContractId, setSubcontractContractId] = useState(defaultContractId);

	// Fetch subcontract contracts for linking
	const { data: contracts } = useQuery({
		...orpc.projectFinance.listSubcontracts.queryOptions({
			input: { organizationId, projectId },
		}),
		enabled: category === "SUBCONTRACTOR",
	});

	const createMutation = useMutation({
		...orpc.projectFinance.createExpense.mutationOptions(),
		onSuccess: () => {
			toast.success(t("finance.notifications.expenseCreated"));
			queryClient.invalidateQueries({ queryKey: ["projectFinance"] });
			router.push(`${basePath}/expenses`);
		},
		onError: () => {
			toast.error(t("finance.notifications.expenseCreateError"));
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!date || !category || !amount) {
			toast.error(t("finance.validation.requiredFields"));
			return;
		}

		createMutation.mutate({
			organizationId,
			projectId,
			date: new Date(date),
			category: category as
				| "MATERIALS"
				| "LABOR"
				| "EQUIPMENT"
				| "SUBCONTRACTOR"
				| "TRANSPORT"
				| "MISC",
			amount: Number.parseFloat(amount),
			vendorName: vendorName || undefined,
			note: note || undefined,
			subcontractContractId:
				category === "SUBCONTRACTOR" && subcontractContractId
					? subcontractContractId
					: undefined,
		});
	};

	const categories = [
		{ value: "MATERIALS", label: t("finance.category.MATERIALS") },
		{ value: "LABOR", label: t("finance.category.LABOR") },
		{ value: "EQUIPMENT", label: t("finance.category.EQUIPMENT") },
		{ value: "SUBCONTRACTOR", label: t("finance.category.SUBCONTRACTOR") },
		{ value: "TRANSPORT", label: t("finance.category.TRANSPORT") },
		{ value: "MISC", label: t("finance.category.MISC") },
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					asChild
					className="shrink-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
				>
					<Link href={`${basePath}/expenses`}>
						<ChevronLeft className="h-5 w-5 text-slate-500" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
						{t("finance.expenses.new")}
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{t("finance.expenses.newSubtitle")}
					</p>
				</div>
			</div>

			{/* Form */}
			<form
				onSubmit={handleSubmit}
				className="mx-auto max-w-xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
			>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="date">{t("finance.expenses.date")}</Label>
						<Input
							id="date"
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							className="rounded-xl"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="category">{t("finance.expenses.category")}</Label>
						<Select
							value={category}
							onValueChange={(val) => {
								setCategory(val);
								if (val !== "SUBCONTRACTOR") {
									setSubcontractContractId("");
								}
							}}
							required
						>
							<SelectTrigger className="rounded-xl">
								<SelectValue
									placeholder={t("finance.expenses.selectCategory")}
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

					{/* Subcontract Contract Selector */}
					{category === "SUBCONTRACTOR" && contracts && contracts.length > 0 && (
						<div className="space-y-2">
							<Label htmlFor="contract">
								{t("finance.subcontracts.selectContract")}
							</Label>
							<Select
								value={subcontractContractId || "none"}
								onValueChange={(val) =>
									setSubcontractContractId(val === "none" ? "" : val)
								}
							>
								<SelectTrigger className="rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">-</SelectItem>
									{contracts.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="amount">{t("finance.expenses.amount")}</Label>
						<Input
							id="amount"
							type="number"
							min="0"
							step="0.01"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder="0.00"
							className="rounded-xl"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="vendorName">{t("finance.expenses.vendor")}</Label>
						<Input
							id="vendorName"
							type="text"
							value={vendorName}
							onChange={(e) => setVendorName(e.target.value)}
							placeholder={t("finance.expenses.vendorPlaceholder")}
							className="rounded-xl"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="note">{t("finance.expenses.note")}</Label>
						<Textarea
							id="note"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder={t("finance.expenses.notePlaceholder")}
							className="min-h-24 rounded-xl"
						/>
					</div>
				</div>

				<div className="flex gap-3">
					<Button
						type="button"
						variant="outline"
						className="flex-1 rounded-xl"
						asChild
					>
						<Link href={`${basePath}/expenses`}>{t("common.cancel")}</Link>
					</Button>
					<Button
						type="submit"
						className="flex-1 rounded-xl"
						disabled={createMutation.isPending}
					>
						{createMutation.isPending
							? t("common.creating")
							: t("finance.expenses.create")}
					</Button>
				</div>
			</form>
		</div>
	);
}
