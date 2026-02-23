"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Plus, Save, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const TERM_TYPES = [
	"ADVANCE",
	"MILESTONE",
	"MONTHLY",
	"COMPLETION",
	"CUSTOM",
] as const;

type TermType = (typeof TERM_TYPES)[number];

interface PaymentTerm {
	id?: string;
	type: TermType;
	label: string;
	percent: string;
	amount: string;
	dueDate: string;
}

interface PaymentTermsCardProps {
	organizationId: string;
	projectId: string;
	terms: Array<{
		id: string;
		type: string;
		label?: string | null;
		percent?: number | null;
		amount?: number | null;
		dueDate?: string | Date | null;
	}>;
}

function toDateInputValue(date: string | Date | null | undefined): string {
	if (!date) return "";
	const d = new Date(date);
	return d.toISOString().split("T")[0];
}

export function PaymentTermsCard({
	organizationId,
	projectId,
	terms: initialTerms,
}: PaymentTermsCardProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [terms, setTerms] = useState<PaymentTerm[]>(
		initialTerms.map((term) => ({
			id: term.id,
			type: term.type as TermType,
			label: term.label ?? "",
			percent: term.percent?.toString() ?? "",
			amount: term.amount?.toString() ?? "",
			dueDate: toDateInputValue(term.dueDate),
		})),
	);

	const { mutate: saveTerms, isPending } = useMutation({
		...orpc.projectContract.setPaymentTerms.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projects.contract.paymentTerms.saved"));
			queryClient.invalidateQueries({
				queryKey: orpc.projectContract.get.queryOptions({
					input: { organizationId, projectId },
				}).queryKey,
			});
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const addTerm = () => {
		setTerms((prev) => [
			...prev,
			{
				type: "MILESTONE" as TermType,
				label: "",
				percent: "",
				amount: "",
				dueDate: "",
			},
		]);
	};

	const removeTerm = (index: number) => {
		setTerms((prev) => prev.filter((_, i) => i !== index));
	};

	const updateTerm = (
		index: number,
		field: keyof PaymentTerm,
		value: string,
	) => {
		setTerms((prev) =>
			prev.map((term, i) =>
				i === index ? { ...term, [field]: value } : term,
			),
		);
	};

	const handleSave = () => {
		saveTerms({
			organizationId,
			projectId,
			terms: terms.map((term, index) => ({
				type: term.type,
				label: term.label || null,
				percent: term.percent
					? Number.parseFloat(term.percent)
					: null,
				amount: term.amount
					? Number.parseFloat(term.amount)
					: null,
				dueDate: term.dueDate ? new Date(term.dueDate) : null,
				sortOrder: index,
			})),
		});
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-lg">
					{t("projects.contract.paymentTerms.title")}
				</CardTitle>
				<div className="flex gap-2">
					<Button onClick={addTerm} variant="outline" size="sm">
						<Plus className="mr-2 h-4 w-4" />
						{t("projects.contract.paymentTerms.addTerm")}
					</Button>
					<Button
						onClick={handleSave}
						disabled={isPending}
						size="sm"
					>
						<Save className="mr-2 h-4 w-4" />
						{t("projects.contract.save")}
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{terms.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						{t("projects.contract.paymentTerms.noTerms")}
					</p>
				) : (
					<div className="space-y-3">
						{/* Header */}
						<div className="hidden grid-cols-[140px_1fr_80px_120px_120px_40px] gap-2 text-xs font-medium text-muted-foreground sm:grid">
							<span>{t("projects.contract.paymentTerms.type")}</span>
							<span>{t("projects.contract.paymentTerms.label")}</span>
							<span>{t("projects.contract.paymentTerms.percent")}</span>
							<span>{t("projects.contract.paymentTerms.amount")}</span>
							<span>{t("projects.contract.paymentTerms.dueDate")}</span>
							<span />
						</div>

						{/* Rows */}
						{terms.map((term, index) => (
							<div
								key={term.id ?? `new-${index}`}
								className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-[140px_1fr_80px_120px_120px_40px] sm:items-center sm:border-0 sm:p-0"
							>
								<Select
									value={term.type}
									onValueChange={(v) =>
										updateTerm(index, "type", v)
									}
								>
									<SelectTrigger className="h-9 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{TERM_TYPES.map((type) => (
											<SelectItem key={type} value={type}>
												{t(
													`projects.contract.paymentTerms.types.${type}`,
												)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Input
									value={term.label}
									onChange={(e) =>
										updateTerm(index, "label", e.target.value)
									}
									placeholder={t(
										"projects.contract.paymentTerms.label",
									)}
									className="h-9 text-sm"
								/>

								<Input
									type="number"
									value={term.percent}
									onChange={(e) =>
										updateTerm(index, "percent", e.target.value)
									}
									placeholder="%"
									min={0}
									max={100}
									className="h-9 text-sm"
								/>

								<Input
									type="number"
									value={term.amount}
									onChange={(e) =>
										updateTerm(index, "amount", e.target.value)
									}
									placeholder="0"
									min={0}
									className="h-9 text-sm"
								/>

								<Input
									type="date"
									value={term.dueDate}
									onChange={(e) =>
										updateTerm(index, "dueDate", e.target.value)
									}
									className="h-9 text-sm"
								/>

								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 text-destructive hover:text-destructive"
									onClick={() => removeTerm(index)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
