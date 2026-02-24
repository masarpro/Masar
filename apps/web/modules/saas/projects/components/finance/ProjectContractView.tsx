"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { FileDiff, Loader2, Pencil, Save, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ContractSummaryBar } from "./contract/ContractSummaryBar";
import {
	ContractFormSections,
	type ContractFormRef,
} from "./contract/ContractFormSections";

interface ProjectContractViewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function ProjectContractView({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectContractViewProps) {
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const t = useTranslations();
	const queryClient = useQueryClient();
	const contractRef = useRef<ContractFormRef>(null);
	const [isEditing, setIsEditing] = useState(false);

	const { data: contract, isLoading: contractLoading } = useQuery(
		orpc.projectContract.get.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	const { data: summary, isLoading: summaryLoading } = useQuery(
		orpc.projectContract.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	const invalidateAll = () => {
		queryClient.invalidateQueries({
			queryKey: orpc.projectContract.get.queryOptions({
				input: { organizationId, projectId },
			}).queryKey,
		});
		queryClient.invalidateQueries({
			queryKey: orpc.projectContract.getSummary.queryOptions({
				input: { organizationId, projectId },
			}).queryKey,
		});
	};

	const upsertMutation = useMutation({
		...orpc.projectContract.upsert.mutationOptions(),
		onSuccess: () => {
			invalidateAll();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const setTermsMutation = useMutation({
		...orpc.projectContract.setPaymentTerms.mutationOptions(),
		onSuccess: () => {
			invalidateAll();
			toast.success(t("projects.contract.saved"));
			setIsEditing(false);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const isSaving = upsertMutation.isPending || setTermsMutation.isPending;

	const handleSave = async () => {
		const data = contractRef.current?.getFormData();
		if (!data) return;

		const VALID_STATUSES = ["DRAFT", "ACTIVE", "SUSPENDED", "CLOSED"];
		const VALID_METHODS = [
			"CASH",
			"BANK_TRANSFER",
			"CHEQUE",
			"CREDIT_CARD",
			"OTHER",
		];
		const VALID_TERM_TYPES = [
			"ADVANCE",
			"MILESTONE",
			"MONTHLY",
			"COMPLETION",
			"CUSTOM",
		];

		const status = VALID_STATUSES.includes(data.contractStatus)
			? (data.contractStatus as
					| "DRAFT"
					| "ACTIVE"
					| "SUSPENDED"
					| "CLOSED")
			: undefined;

		const paymentMethod =
			data.paymentMethod && VALID_METHODS.includes(data.paymentMethod)
				? (data.paymentMethod as
						| "CASH"
						| "BANK_TRANSFER"
						| "CHEQUE"
						| "CREDIT_CARD"
						| "OTHER")
				: null;

		// First upsert the contract
		upsertMutation.mutate(
			{
				organizationId,
				projectId,
				contractNo: contract?.contractNo ?? undefined,
				value: data.contractValue,
				status,
				signedDate: data.signedDate
					? new Date(data.signedDate)
					: null,
				startDate: data.startDate
					? new Date(data.startDate)
					: null,
				endDate: data.endDate ? new Date(data.endDate) : null,
				retentionPercent: data.retentionPercent,
				retentionCap: data.retentionCap,
				retentionReleaseDays: data.retentionReleaseDays,
				notes: data.contractNotes || null,
				includesVat: data.includesVat,
				vatPercent: data.vatPercent,
				paymentMethod,
				performanceBondPercent: data.performanceBondPercent,
				performanceBondAmount: data.performanceBondAmount,
				insuranceRequired: data.insuranceRequired,
				insuranceDetails: data.insuranceDetails || null,
				scopeOfWork: data.scopeOfWork || null,
				penaltyPercent: data.penaltyPercent,
				penaltyCapPercent: data.penaltyCapPercent,
			},
			{
				onSuccess: () => {
					// Then save payment terms
					setTermsMutation.mutate({
						organizationId,
						projectId,
						terms: data.paymentTerms.map((term) => ({
							id: term.id ?? undefined,
							type: VALID_TERM_TYPES.includes(term.type)
								? (term.type as
										| "ADVANCE"
										| "MILESTONE"
										| "MONTHLY"
										| "COMPLETION"
										| "CUSTOM")
								: "CUSTOM",
							label: term.label,
							percent: term.percent,
							amount: term.amount,
							sortOrder: term.sortOrder,
						})),
					});
				},
			},
		);
	};

	if (contractLoading || summaryLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-full space-y-6 pb-40">
			{/* Header + Edit button */}
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold">
					{t("projects.contract.title")}
				</h2>
				{!isEditing ? (
					<div className="flex gap-2">
						<Button
							asChild
							variant="outline"
							className="rounded-xl border-purple-200 px-5 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/30"
						>
							<Link href={`${basePath}/changes`}>
								<FileDiff className="ml-2 h-4 w-4" />
								{t("changeOrders.title")}
							</Link>
						</Button>
						<Button
							onClick={() => setIsEditing(true)}
							className="rounded-xl bg-teal-600 px-6 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
						>
							<Pencil className="ml-2 h-4 w-4" />
							{t("projects.contract.editContract")}
						</Button>
					</div>
				) : (
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => setIsEditing(false)}
							disabled={isSaving}
							className="rounded-xl border-slate-200 px-5 dark:border-slate-700"
						>
							<X className="ml-2 h-4 w-4" />
							{t("projects.contract.cancelEdit")}
						</Button>
						<Button
							onClick={handleSave}
							disabled={isSaving}
							className="rounded-xl bg-teal-600 px-6 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
						>
							{isSaving ? (
								<>
									<Loader2 className="ml-2 h-4 w-4 animate-spin" />
									{t("projects.contract.saving")}
								</>
							) : (
								<>
									<Save className="ml-2 h-4 w-4" />
									{t("projects.contract.saveChanges")}
								</>
							)}
						</Button>
					</div>
				)}
			</div>

			{/* Summary Bar */}
			<ContractSummaryBar
				originalValue={summary?.originalValue ?? 0}
				approvedCOImpact={summary?.approvedCOImpact ?? 0}
				adjustedValue={summary?.adjustedValue ?? 0}
				retentionAmount={summary?.retentionAmount ?? 0}
			/>

			{/* Contract Form (same as creation page) */}
			{isEditing ? (
				<ContractFormSections
					key="editing"
					ref={contractRef}
					contractNo={contract?.contractNo ?? undefined}
					initialData={
						contract
							? {
									value: contract.value,
									status: contract.status,
									includesVat: contract.includesVat,
									vatPercent: contract.vatPercent,
									signedDate: contract.signedDate,
									startDate: contract.startDate,
									endDate: contract.endDate,
									paymentMethod: contract.paymentMethod,
									scopeOfWork: contract.scopeOfWork,
									notes: contract.notes,
									retentionPercent:
										contract.retentionPercent,
									retentionCap: contract.retentionCap,
									retentionReleaseDays:
										contract.retentionReleaseDays,
									performanceBondPercent:
										contract.performanceBondPercent,
									performanceBondAmount:
										contract.performanceBondAmount,
									insuranceRequired:
										contract.insuranceRequired,
									insuranceDetails:
										contract.insuranceDetails,
									penaltyPercent: contract.penaltyPercent,
									penaltyCapPercent:
										contract.penaltyCapPercent,
									paymentTerms: contract.paymentTerms,
								}
							: undefined
					}
				/>
			) : (
				<ContractReadOnlyView contract={contract} />
			)}
		</div>
	);
}

// ─── Read-Only View ──────────────────────────────────────────
function ContractReadOnlyView({ contract }: { contract: any }) {
	const t = useTranslations();

	if (!contract) {
		return (
			<div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
				<p className="text-sm text-slate-400">
					{t("projects.contract.title")}
				</p>
				<p className="mt-1 text-xs text-slate-300">
					{t("projects.contract.editContract")}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Contract Details */}
			<div className="overflow-hidden rounded-2xl border border-teal-200/50 bg-teal-50/50 dark:border-teal-800/30 dark:bg-teal-950/20">
				<div className="border-b border-teal-200/50 p-5 dark:border-teal-800/30">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-medium text-teal-900 dark:text-teal-100">
							{t("projects.createProject.contractInfo")}
						</h3>
						{contract.contractNo && (
							<span className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1 font-mono text-sm text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300">
								{contract.contractNo}
							</span>
						)}
					</div>
				</div>

				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<ReadOnlyField
						label={t("projects.createProject.contractValue")}
						value={
							contract.value > 0
								? `${formatCurrency(contract.value)} ر.س`
								: "—"
						}
					/>
					<ReadOnlyField
						label={t("projects.createProject.contractStatus")}
						value={
							contract.status
								? t(
										`projects.createProject.contractStatuses.${contract.status}`,
									)
								: "—"
						}
					/>
					{contract.includesVat && (
						<ReadOnlyField
							label={t("projects.createProject.vatToggle")}
							value={`${formatCurrency(contract.value * 1.15)} ر.س`}
						/>
					)}
					{contract.paymentMethod && (
						<ReadOnlyField
							label={t("projects.createProject.paymentMethod")}
							value={t(
								`projects.createProject.paymentMethods.${contract.paymentMethod}`,
							)}
						/>
					)}
					<ReadOnlyField
						label={t("projects.createProject.signedDate")}
						value={
							contract.signedDate
								? new Date(
										contract.signedDate,
									).toLocaleDateString("ar-SA")
								: "—"
						}
					/>
					<ReadOnlyField
						label={t("projects.createProject.startDate")}
						value={
							contract.startDate
								? new Date(
										contract.startDate,
									).toLocaleDateString("ar-SA")
								: "—"
						}
					/>
					<ReadOnlyField
						label={t("projects.createProject.endDate")}
						value={
							contract.endDate
								? new Date(
										contract.endDate,
									).toLocaleDateString("ar-SA")
								: "—"
						}
					/>
				</div>

				{contract.scopeOfWork && (
					<div className="border-t border-teal-200/50 p-5 dark:border-teal-800/30">
						<p className="mb-1 text-xs text-slate-500">
							{t("projects.createProject.scopeOfWork")}
						</p>
						<p className="text-sm text-slate-700 dark:text-slate-300">
							{contract.scopeOfWork}
						</p>
					</div>
				)}
			</div>

			{/* Payment Terms */}
			{contract.paymentTerms?.length > 0 && (
				<div className="overflow-hidden rounded-2xl border border-violet-200/50 bg-violet-50/50 dark:border-violet-800/30 dark:bg-violet-950/20">
					<div className="border-b border-violet-200/50 p-5 dark:border-violet-800/30">
						<h3 className="text-lg font-medium text-violet-900 dark:text-violet-100">
							{t("projects.createProject.paymentTermsSection")}
						</h3>
					</div>
					<div className="space-y-2 p-5">
						{contract.paymentTerms.map(
							(term: any, idx: number) => (
								<div
									key={term.id ?? idx}
									className="flex items-center justify-between rounded-xl border border-violet-100 bg-white p-3 dark:border-violet-800/30 dark:bg-slate-900/40"
								>
									<div className="flex items-center gap-3">
										<span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
											{t(
												`projects.createProject.termTypes.${term.type}`,
											)}
										</span>
										{term.label && (
											<span className="text-sm text-slate-600 dark:text-slate-400">
												{term.label}
											</span>
										)}
									</div>
									<div className="flex items-center gap-3">
										{term.percent != null && (
											<span className="font-mono text-sm font-medium text-violet-700 dark:text-violet-300">
												{term.percent}%
											</span>
										)}
										{term.amount != null && (
											<span className="font-mono text-sm text-slate-600 dark:text-slate-400">
												{formatCurrency(term.amount)}{" "}
												ر.س
											</span>
										)}
									</div>
								</div>
							),
						)}
					</div>
				</div>
			)}

			{/* Guarantees & Retention */}
			{(contract.retentionPercent ||
				contract.performanceBondPercent ||
				contract.insuranceRequired ||
				contract.penaltyPercent) && (
				<div className="overflow-hidden rounded-2xl border border-amber-200/50 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-950/20">
					<div className="border-b border-amber-200/50 p-5 dark:border-amber-800/30">
						<h3 className="text-lg font-medium text-amber-900 dark:text-amber-100">
							{t("projects.createProject.guaranteesSection")}
						</h3>
					</div>
					<div className="grid gap-4 p-5 sm:grid-cols-2">
						{contract.retentionPercent != null && (
							<ReadOnlyField
								label={t(
									"projects.createProject.retentionPercent",
								)}
								value={`${contract.retentionPercent}%`}
							/>
						)}
						{contract.performanceBondPercent != null && (
							<ReadOnlyField
								label={t(
									"projects.createProject.performanceBondPercent",
								)}
								value={`${contract.performanceBondPercent}%`}
							/>
						)}
						{contract.insuranceRequired && (
							<ReadOnlyField
								label={t(
									"projects.createProject.insuranceRequired",
								)}
								value={
									contract.insuranceDetails || "✓"
								}
							/>
						)}
						{contract.penaltyPercent != null && (
							<ReadOnlyField
								label={t(
									"projects.createProject.penaltyPercent",
								)}
								value={`${contract.penaltyPercent}%`}
							/>
						)}
						{contract.penaltyCapPercent != null && (
							<ReadOnlyField
								label={t(
									"projects.createProject.penaltyCapPercent",
								)}
								value={`${contract.penaltyCapPercent}%`}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

// ─── Helpers ─────────────────────────────────────────────────
function ReadOnlyField({
	label,
	value,
}: {
	label: string;
	value: string;
}) {
	return (
		<div className="space-y-1">
			<p className="text-xs text-slate-500">{label}</p>
			<p className="text-sm font-medium text-slate-800 dark:text-slate-200">
				{value}
			</p>
		</div>
	);
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}
