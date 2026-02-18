"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface CreateClaimFormProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function CreateClaimForm({
	organizationId,
	organizationSlug,
	projectId,
}: CreateClaimFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance/claims`;

	const [periodStart, setPeriodStart] = useState("");
	const [periodEnd, setPeriodEnd] = useState("");
	const [amount, setAmount] = useState("");
	const [dueDate, setDueDate] = useState("");
	const [note, setNote] = useState("");

	const createMutation = useMutation({
		...orpc.projectFinance.createClaim.mutationOptions(),
		onSuccess: () => {
			toast.success(t("finance.notifications.claimCreated"));
			queryClient.invalidateQueries({ queryKey: ["projectFinance"] });
			router.push(basePath);
		},
		onError: () => {
			toast.error(t("finance.notifications.claimCreateError"));
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!amount) {
			toast.error(t("finance.validation.amountRequired"));
			return;
		}

		createMutation.mutate({
			organizationId,
			projectId,
			periodStart: periodStart ? new Date(periodStart) : undefined,
			periodEnd: periodEnd ? new Date(periodEnd) : undefined,
			amount: Number.parseFloat(amount),
			dueDate: dueDate ? new Date(dueDate) : undefined,
			note: note || undefined,
		});
	};

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
					<Link href={basePath}>
						<ChevronLeft className="h-5 w-5 text-slate-500" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
						{t("finance.claims.new")}
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{t("finance.claims.newSubtitle")}
					</p>
				</div>
			</div>

			{/* Form */}
			<form
				onSubmit={handleSubmit}
				className="mx-auto max-w-xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
			>
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="periodStart">
								{t("finance.claims.periodStart")}
							</Label>
							<Input
								id="periodStart"
								type="date"
								value={periodStart}
								onChange={(e) => setPeriodStart(e.target.value)}
								className="rounded-xl"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="periodEnd">{t("finance.claims.periodEnd")}</Label>
							<Input
								id="periodEnd"
								type="date"
								value={periodEnd}
								onChange={(e) => setPeriodEnd(e.target.value)}
								className="rounded-xl"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="amount">{t("finance.claims.amount")}</Label>
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
						<Label htmlFor="dueDate">{t("finance.claims.dueDate")}</Label>
						<Input
							id="dueDate"
							type="date"
							value={dueDate}
							onChange={(e) => setDueDate(e.target.value)}
							className="rounded-xl"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="note">{t("finance.claims.note")}</Label>
						<Textarea
							id="note"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder={t("finance.claims.notePlaceholder")}
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
						<Link href={basePath}>{t("common.cancel")}</Link>
					</Button>
					<Button
						type="submit"
						className="flex-1 rounded-xl"
						disabled={createMutation.isPending}
					>
						{createMutation.isPending
							? t("common.creating")
							: t("finance.claims.create")}
					</Button>
				</div>
			</form>
		</div>
	);
}
